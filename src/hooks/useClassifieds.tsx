import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface VehicleListing {
  id: string;
  seller_id: string;
  vehicle_id: string | null;
  brand: string;
  model: string;
  year: number;
  color: string;
  mileage: number;
  vehicle_type: string;
  transmission_type: string;
  fuel_type: string;
  doors: number;
  seats: number;
  has_air_conditioning: boolean;
  sale_price: number;
  description: string | null;
  condition: string;
  accepts_trade: boolean;
  license_plate: string | null;
  city: string | null;
  state: string | null;
  whatsapp_number: string | null;
  show_phone: boolean;
  allow_chat: boolean;
  status: string;
  views_count: number;
  created_at: string;
  updated_at: string;
  listing_images?: Array<{
    id: string;
    image_url: string;
    is_primary: boolean;
    display_order: number;
  }>;
  profiles?: {
    first_name: string;
    last_name: string;
    profile_image: string | null;
    phone_number: string | null;
  };
}

export const useListings = (filters?: {
  vehicleType?: string;
  transmission?: string;
  fuel?: string;
  minPrice?: number;
  maxPrice?: number;
  city?: string;
  condition?: string;
  minYear?: number;
  maxYear?: number;
}) => {
  return useQuery({
    queryKey: ["listings", filters],
    queryFn: async () => {
      let query = supabase
        .from("vehicle_listings")
        .select(`
          *,
          listing_images (
            id,
            image_url,
            is_primary,
            display_order
          ),
          profiles!vehicle_listings_seller_id_fkey (
            first_name,
            last_name,
            profile_image,
            phone_number
          )
        `)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (filters?.vehicleType && filters.vehicleType !== "all") {
        query = query.eq("vehicle_type", filters.vehicleType);
      }
      if (filters?.transmission && filters.transmission !== "all") {
        query = query.eq("transmission_type", filters.transmission);
      }
      if (filters?.fuel && filters.fuel !== "all") {
        query = query.eq("fuel_type", filters.fuel);
      }
      if (filters?.minPrice) {
        query = query.gte("sale_price", filters.minPrice);
      }
      if (filters?.maxPrice) {
        query = query.lte("sale_price", filters.maxPrice);
      }
      if (filters?.condition && filters.condition !== "all") {
        query = query.eq("condition", filters.condition);
      }
      if (filters?.minYear) {
        query = query.gte("year", filters.minYear);
      }
      if (filters?.maxYear) {
        query = query.lte("year", filters.maxYear);
      }
      if (filters?.city) {
        const cityName = filters.city.split(",")[0].trim();
        query = query.ilike("city", cityName);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as VehicleListing[];
    },
  });
};

export const useListing = (id: string) => {
  return useQuery({
    queryKey: ["listing", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicle_listings")
        .select(`
          *,
          listing_images (
            id,
            image_url,
            is_primary,
            display_order
          ),
          profiles!vehicle_listings_seller_id_fkey (
            first_name,
            last_name,
            profile_image,
            phone_number
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;

      // Increment views
      await supabase
        .from("vehicle_listings")
        .update({ views_count: (data.views_count || 0) + 1 })
        .eq("id", id);

      return data as VehicleListing;
    },
    enabled: !!id,
  });
};

export const useMyListings = () => {
  return useQuery({
    queryKey: ["myListings"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("vehicle_listings")
        .select(`
          *,
          listing_images (
            id,
            image_url,
            is_primary,
            display_order
          )
        `)
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as VehicleListing[];
    },
  });
};

export const useCreateListing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (listing: {
      vehicle_id?: string;
      brand: string;
      model: string;
      year: number;
      color: string;
      mileage: number;
      vehicle_type: string;
      transmission_type: string;
      fuel_type: string;
      doors: number;
      seats: number;
      has_air_conditioning: boolean;
      sale_price: number;
      description?: string;
      condition: string;
      accepts_trade: boolean;
      license_plate?: string;
      city?: string;
      state?: string;
      whatsapp_number?: string;
      show_phone: boolean;
      allow_chat: boolean;
      image_urls?: string[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { image_urls, ...listingData } = listing;

      const { data, error } = await supabase
        .from("vehicle_listings")
        .insert({
          ...listingData,
          seller_id: user.id,
        } as any)
        .select()
        .single();

      if (error) throw error;

      // Copy images from vehicle or insert provided URLs
      if (image_urls && image_urls.length > 0) {
        const images = image_urls.map((url, index) => ({
          listing_id: data.id,
          image_url: url,
          is_primary: index === 0,
          display_order: index,
        }));

        await supabase.from("listing_images").insert(images as any);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["myListings"] });
      toast.success("Anúncio criado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar anúncio: ${error.message}`);
    },
  });
};

export const useUpdateListing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; status?: string; sale_price?: number; description?: string }) => {
      const { error } = await supabase
        .from("vehicle_listings")
        .update(updates as any)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["myListings"] });
      toast.success("Anúncio atualizado!");
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });
};

export const useDeleteListing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("listing_images").delete().eq("listing_id", id);
      const { error } = await supabase.from("vehicle_listings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["myListings"] });
      toast.success("Anúncio excluído!");
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });
};

// Listing messages
export const useListingMessages = (listingId: string, otherUserId: string) => {
  return useQuery({
    queryKey: ["listingMessages", listingId, otherUserId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("listing_messages")
        .select("*")
        .eq("listing_id", listingId)
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!listingId && !!otherUserId,
    refetchInterval: 5000,
  });
};

export const useSendListingMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listingId, receiverId, content }: { listingId: string; receiverId: string; content: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("listing_messages").insert({
        listing_id: listingId,
        sender_id: user.id,
        receiver_id: receiverId,
        content,
      } as any);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["listingMessages", variables.listingId] });
    },
  });
};
