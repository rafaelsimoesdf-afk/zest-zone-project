import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Booking {
  id: string;
  vehicle_id: string;
  customer_id: string;
  owner_id: string;
  start_date: string;
  end_date: string;
  total_days: number;
  daily_rate: number;
  total_price: number;
  status: string;
  pickup_location: string | null;
  return_location: string | null;
  notes: string | null;
  created_at: string;
  vehicles?: {
    brand: string;
    model: string;
    year: number;
    vehicle_images?: Array<{
      image_url: string;
      is_primary: boolean;
    }>;
  };
  profiles?: {
    first_name: string;
    last_name: string;
  };
}

export const useMyBookings = () => {
  return useQuery({
    queryKey: ["myBookings"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          vehicles (
            brand,
            model,
            year,
            vehicle_images (
              image_url,
              is_primary
            )
          ),
          profiles!bookings_owner_id_fkey (
            first_name,
            last_name
          )
        `)
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Booking[];
    },
  });
};

export const useOwnerBookings = () => {
  return useQuery({
    queryKey: ["ownerBookings"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          vehicles (
            brand,
            model,
            year,
            vehicle_images (
              image_url,
              is_primary
            )
          ),
          profiles!bookings_customer_id_fkey (
            first_name,
            last_name
          )
        `)
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Booking[];
    },
  });
};

export interface CreateBookingData {
  vehicle_id: string;
  owner_id: string;
  start_date: string;
  end_date: string;
  total_days: number;
  daily_rate: number;
  total_price: number;
  pickup_location?: string;
  return_location?: string;
  notes?: string;
}

export const useCreateBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingData: CreateBookingData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check if user is trying to book their own vehicle
      if (user.id === bookingData.owner_id) {
        throw new Error("Você não pode reservar seu próprio veículo");
      }

      const { data, error } = await supabase
        .from("bookings")
        .insert({
          ...bookingData,
          customer_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myBookings"] });
      queryClient.invalidateQueries({ queryKey: ["ownerBookings"] });
      toast.success("Reserva criada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar reserva");
    },
  });
};

export interface BookingDetails extends Booking {
  vehicles?: {
    brand: string;
    model: string;
    year: number;
    color: string;
    license_plate: string;
    vehicle_images?: Array<{
      image_url: string;
      is_primary: boolean;
    }>;
  };
  profiles?: {
    first_name: string;
    last_name: string;
    phone_number: string | null;
  };
}

export const useBooking = (bookingId: string) => {
  return useQuery({
    queryKey: ["booking", bookingId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          vehicles (
            brand,
            model,
            year,
            color,
            license_plate,
            vehicle_images (
              image_url,
              is_primary
            )
          ),
          profiles!bookings_owner_id_fkey (
            first_name,
            last_name,
            phone_number
          )
        `)
        .eq("id", bookingId)
        .maybeSingle();

      if (error) throw error;
      return data as BookingDetails | null;
    },
    enabled: !!bookingId,
  });
};
