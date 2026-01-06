import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Vehicle } from "@/hooks/useVehicles";

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
          transmission_type,
          fuel_type,
          seats,
          doors,
          mileage,
          has_air_conditioning,
          color,
          city,
          state,
          vehicle_images (
            id,
            image_url,
            is_primary,
            display_order
          )
        `)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      // Add placeholder values for average_rating and total_reviews since featured vehicles don't need to fetch this
      return (data || []).map(vehicle => ({
        ...vehicle,
        average_rating: null,
        total_reviews: 0
      })) as Vehicle[];
    },
  });
};
