import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  daily_price: number;
  vehicle_type: string;
  transmission_type: string;
  fuel_type: string;
  seats: number;
  doors: number;
  color: string;
  mileage: number;
  description: string | null;
  has_air_conditioning: boolean;
  license_plate: string;
  status: string;
  owner_id: string;
  address_id: string | null;
  created_at: string;
  vehicle_images?: Array<{
    id: string;
    image_url: string;
    is_primary: boolean;
    display_order: number;
  }>;
  addresses?: {
    city: string;
    state: string;
    neighborhood: string;
    latitude: number | null;
    longitude: number | null;
  };
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
          ),
          addresses (
            city,
            state,
            neighborhood,
            latitude,
            longitude
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

      const { data, error } = await query;

      if (error) throw error;
      
      let vehicles = data as Vehicle[];

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
