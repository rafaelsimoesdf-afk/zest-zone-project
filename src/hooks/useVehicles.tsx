import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  maxPrice?: number;
  city?: string;
  brandId?: string;
  modelId?: string;
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

      if (filters?.maxPrice) {
        query = query.lte("daily_price", filters.maxPrice);
      }

      if (filters?.brandId && filters.brandId !== "all") {
        query = query.eq("brand_id", filters.brandId);
      }

      if (filters?.modelId && filters.modelId !== "all") {
        query = query.eq("model_id", filters.modelId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Vehicle[];
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
