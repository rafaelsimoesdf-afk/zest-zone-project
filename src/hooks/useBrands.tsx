import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface VehicleBrand {
  id: string;
  name: string;
  country: string;
  logo_url: string | null;
  is_popular: boolean;
}

export interface VehicleModel {
  id: string;
  brand_id: string;
  name: string;
  category: string | null;
  is_popular: boolean;
}

export const useBrands = () => {
  return useQuery({
    queryKey: ["vehicle-brands"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicle_brands")
        .select("*")
        .order("is_popular", { ascending: false })
        .order("name", { ascending: true });

      if (error) throw error;
      return data as VehicleBrand[];
    },
  });
};

export const useModels = (brandId?: string) => {
  return useQuery({
    queryKey: ["vehicle-models", brandId],
    queryFn: async () => {
      let query = supabase
        .from("vehicle_models")
        .select("*")
        .order("is_popular", { ascending: false })
        .order("name", { ascending: true });

      if (brandId) {
        query = query.eq("brand_id", brandId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as VehicleModel[];
    },
    enabled: !!brandId,
  });
};
