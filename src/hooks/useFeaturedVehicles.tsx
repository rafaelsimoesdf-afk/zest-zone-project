import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FeaturedVehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  daily_price: number;
  vehicle_type: string;
  vehicle_images?: Array<{
    id: string;
    image_url: string;
    is_primary: boolean;
  }>;
  addresses?: {
    city: string;
    state: string;
  };
}

export const useFeaturedVehicles = (limit: number = 3) => {
  return useQuery({
    queryKey: ["featured-vehicles", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select(`
          id,
          brand,
          model,
          year,
          daily_price,
          vehicle_type,
          vehicle_images (
            id,
            image_url,
            is_primary
          ),
          addresses (
            city,
            state
          )
        `)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as FeaturedVehicle[];
    },
  });
};
