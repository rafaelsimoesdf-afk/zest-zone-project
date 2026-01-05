import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  brand_id?: string | null;
  model_id?: string | null;
  year: number;
  ano_fabricacao?: number | null;
  ano_modelo?: number | null;
  versao?: string | null;
  daily_price: number;
  caucao?: number | null;
  vehicle_type: string;
  transmission_type: string;
  fuel_type: string;
  seats: number;
  doors: number;
  color: string;
  mileage: number;
  motor?: string | null;
  direcao?: string | null;
  description: string | null;
  regras?: string | null;
  has_air_conditioning: boolean;
  license_plate: string;
  chassi_mascarado?: string | null;
  situacao_veiculo?: string | null;
  document_url?: string | null;
  document_verified?: boolean | null;
  status: string;
  owner_id: string;
  address_id: string | null;
  city: string | null;
  state: string | null;
  created_at: string;
  // Security accessories
  airbag_frontal?: boolean | null;
  airbag_lateral?: boolean | null;
  freios_abs?: boolean | null;
  controle_tracao?: boolean | null;
  controle_estabilidade?: boolean | null;
  camera_re?: boolean | null;
  sensor_estacionamento?: boolean | null;
  alarme?: boolean | null;
  // Comfort accessories
  ar_digital?: boolean | null;
  direcao_hidraulica?: boolean | null;
  direcao_eletrica?: boolean | null;
  vidros_eletricos?: boolean | null;
  retrovisores_eletricos?: boolean | null;
  banco_couro?: boolean | null;
  banco_eletrico?: boolean | null;
  // Technology accessories
  multimidia?: boolean | null;
  bluetooth?: boolean | null;
  android_auto?: boolean | null;
  apple_carplay?: boolean | null;
  gps?: boolean | null;
  wifi?: boolean | null;
  entrada_usb?: boolean | null;
  carregador_inducao?: boolean | null;
  piloto_automatico?: boolean | null;
  start_stop?: boolean | null;
  // Exterior accessories
  rodas_liga_leve?: boolean | null;
  farol_led?: boolean | null;
  farol_milha?: boolean | null;
  rack_teto?: boolean | null;
  engate?: boolean | null;
  // Other accessories
  chave_reserva?: boolean | null;
  manual_veiculo?: boolean | null;
  sensor_chuva?: boolean | null;
  sensor_crepuscular?: boolean | null;
  vehicle_images?: Array<{
    id: string;
    image_url: string;
    is_primary: boolean;
    display_order: number;
  }>;
  average_rating?: number | null;
  total_reviews?: number;
}

export const useVehicles = (filters?: {
  vehicleType?: string;
  transmission?: string;
  fuel?: string;
  minPrice?: number;
  maxPrice?: number;
  city?: string;
  brandId?: string;
  modelId?: string;
  fromDate?: string;
  untilDate?: string;
  fromTime?: string;
  untilTime?: string;
  minYear?: number;
  maxYear?: number;
}) => {
  return useQuery({
    queryKey: ["vehicles", filters],
    queryFn: async () => {
      let query = supabase
        .from("vehicles")
        .select(`
          *,
          vehicle_images (
            id,
            image_url,
            is_primary,
            display_order
          )
        `)
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (filters?.vehicleType && filters.vehicleType !== "all") {
        query = query.eq("vehicle_type", filters.vehicleType as any);
      }

      if (filters?.transmission && filters.transmission !== "all") {
        query = query.eq("transmission_type", filters.transmission as any);
      }

      if (filters?.fuel && filters.fuel !== "all") {
        query = query.eq("fuel_type", filters.fuel as any);
      }

      if (filters?.minPrice) {
        query = query.gte("daily_price", filters.minPrice);
      }

      if (filters?.maxPrice) {
        query = query.lte("daily_price", filters.maxPrice);
      }

      if (filters?.brandId && filters.brandId !== "all") {
        query = query.eq("brand_id", filters.brandId);
      }

      if (filters?.modelId && filters.modelId !== "all") {
        query = query.eq("model_id", filters.modelId);
      }

      if (filters?.minYear) {
        query = query.gte("year", filters.minYear);
      }

      if (filters?.maxYear) {
        query = query.lte("year", filters.maxYear);
      }

      // Filtro por cidade - extrai apenas a cidade do formato "Cidade, UF, BR"
      if (filters?.city) {
        const cityName = filters.city.split(",")[0].trim();
        query = query.ilike("city", cityName);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      let vehicles = data as Vehicle[];

      // Buscar as avaliações médias de cada veículo (baseado no owner_id)
      const ownerIds = [...new Set(vehicles.map(v => v.owner_id))];
      
      if (ownerIds.length > 0) {
        const { data: reviews } = await supabase
          .from("reviews")
          .select("reviewed_id, rating")
          .in("reviewed_id", ownerIds);

        if (reviews) {
          // Calcular média por owner
          const ownerRatings: Record<string, { sum: number; count: number }> = {};
          reviews.forEach(review => {
            if (!ownerRatings[review.reviewed_id]) {
              ownerRatings[review.reviewed_id] = { sum: 0, count: 0 };
            }
            ownerRatings[review.reviewed_id].sum += review.rating;
            ownerRatings[review.reviewed_id].count += 1;
          });

          // Adicionar rating aos veículos
          vehicles = vehicles.map(vehicle => ({
            ...vehicle,
            average_rating: ownerRatings[vehicle.owner_id] 
              ? Math.round((ownerRatings[vehicle.owner_id].sum / ownerRatings[vehicle.owner_id].count) * 10) / 10
              : null,
            total_reviews: ownerRatings[vehicle.owner_id]?.count || 0,
          }));
        }
      }

      // Filtrar por disponibilidade se datas foram fornecidas
      if (filters?.fromDate && filters?.untilDate) {
        const searchStart = new Date(filters.fromDate);
        const searchEnd = new Date(filters.untilDate);

        // Buscar reservas de todos os veículos e filtrar os disponíveis
        const availableVehicles: Vehicle[] = [];

        for (const vehicle of vehicles) {
          const { data: bookings } = await supabase.rpc('get_public_vehicle_bookings', {
            _vehicle_id: vehicle.id
          });

          // Verificar se há conflito de datas
          const hasConflict = bookings?.some((booking: any) => {
            const bookingStart = new Date(booking.start_date);
            const bookingEnd = new Date(booking.end_date);
            
            // Há conflito se as datas se sobrepõem
            return !(searchEnd < bookingStart || searchStart > bookingEnd);
          });

          if (!hasConflict) {
            availableVehicles.push(vehicle);
          }
        }

        return availableVehicles;
      }

      return vehicles;
    },
  });
};

export const useVehicle = (id: string) => {
  return useQuery({
    queryKey: ["vehicle", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select(`
          *,
          vehicle_images (
            id,
            image_url,
            is_primary,
            display_order
          ),
          addresses (
            city,
            state,
            neighborhood,
            street,
            number,
            complement,
            zip_code
          ),
          profiles!vehicles_owner_id_fkey (
            first_name,
            last_name,
            profile_image
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};

export const useMyVehicles = () => {
  return useQuery({
    queryKey: ["myVehicles"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("vehicles")
        .select(`
          *,
          vehicle_images (
            id,
            image_url,
            is_primary,
            display_order
          )
        `)
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Vehicle[];
    },
  });
};

export const useDeleteVehicle = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (vehicleId: string) => {
      // First delete all vehicle images from storage
      const { data: images } = await supabase
        .from("vehicle_images")
        .select("image_url")
        .eq("vehicle_id", vehicleId);

      if (images) {
        for (const image of images) {
          // Extract file path from public URL
          const urlParts = image.image_url.split('/vehicle-images/');
          if (urlParts[1]) {
            await supabase.storage
              .from('vehicle-images')
              .remove([urlParts[1]]);
          }
        }
      }

      // Delete vehicle images from database
      await supabase
        .from("vehicle_images")
        .delete()
        .eq("vehicle_id", vehicleId);

      // Delete vehicle
      const { error } = await supabase
        .from("vehicles")
        .delete()
        .eq("id", vehicleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["myVehicles"] });
      toast.success("Veículo excluído com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir veículo: ${error.message}`);
    },
  });
};
