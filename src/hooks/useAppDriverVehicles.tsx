import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Vehicle } from "@/hooks/useVehicles";

export const useAppDriverVehicles = (limit: number = 4) => {
  return useQuery({
    queryKey: ["app-driver-vehicles", limit],
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
          app_driver_rental,
          app_driver_weekly_price,
          app_driver_monthly_price,
          vehicle_images (
            id,
            image_url,
            is_primary,
            display_order
          )
        `)
        .eq("status", "approved")
        .eq("app_driver_rental", true)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(vehicle => ({
        ...vehicle,
        average_rating: null,
        total_reviews: 0
      })) as Vehicle[];
    },
  });
};
