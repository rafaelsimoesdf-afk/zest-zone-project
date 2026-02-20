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
  start_time: string | null;
  end_time: string | null;
  total_days: number;
  daily_rate: number;
  total_price: number;
  extra_hours: number;
  extra_hours_charge: number;
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
        .not("cancelled_reason", "eq", "duplicate")
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
        .not("cancelled_reason", "eq", "duplicate")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Booking[];
    },
  });
};

export interface BookingAcceptances {
  owner_rules_accepted: boolean;
  owner_rules_accepted_at: string | null;
  basic_rules_accepted: boolean;
  basic_rules_accepted_at: string | null;
  cancellation_policy_accepted: boolean;
  cancellation_policy_accepted_at: string | null;
  terms_of_service_accepted: boolean;
  terms_of_service_accepted_at: string | null;
  privacy_policy_accepted: boolean;
  privacy_policy_accepted_at: string | null;
}

export interface CreateBookingData {
  vehicle_id: string;
  owner_id: string;
  start_date: string;
  end_date: string;
  start_time?: string | null;
  end_time?: string | null;
  total_days: number;
  daily_rate: number;
  total_price: number;
  extra_hours?: number;
  extra_hours_charge?: number;
  pickup_location?: string | null;
  return_location?: string | null;
  notes?: string | null;
  acceptances?: BookingAcceptances;
}

export const useCreateBooking = () => {
  const queryClient = useQueryClient();
  const mutationRef = { current: false };

  return useMutation({
    mutationFn: async (bookingData: CreateBookingData) => {
      // Prevent double submissions
      if (mutationRef.current) {
        throw new Error("Reserva já está sendo processada, aguarde...");
      }
      mutationRef.current = true;

      try {
        return await createBookingFn(bookingData);
      } finally {
        mutationRef.current = false;
      }
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

async function createBookingFn(bookingData: CreateBookingData) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Use atomic database function with advisory lock to prevent duplicates
  const { data: bookingId, error: rpcError } = await supabase.rpc("create_booking_atomic", {
    p_customer_id: user.id,
    p_vehicle_id: bookingData.vehicle_id,
    p_owner_id: bookingData.owner_id,
    p_start_date: bookingData.start_date,
    p_end_date: bookingData.end_date,
    p_start_time: bookingData.start_time || null,
    p_end_time: bookingData.end_time || null,
    p_total_days: bookingData.total_days,
    p_daily_rate: bookingData.daily_rate,
    p_total_price: bookingData.total_price,
    p_extra_hours: bookingData.extra_hours || 0,
    p_extra_hours_charge: bookingData.extra_hours_charge || 0,
    p_pickup_location: bookingData.pickup_location || null,
    p_return_location: bookingData.return_location || null,
    p_notes: bookingData.notes || null,
  });

  if (rpcError) {
    // Parse user-friendly error from database
    const msg = rpcError.message || "Erro ao criar reserva";
    throw new Error(msg);
  }

  // Get vehicle info for notification
  const { data: vehicleInfo } = await supabase
    .from("vehicles")
    .select("brand, model")
    .eq("id", bookingData.vehicle_id)
    .single();

  // Get customer name for notification
  const { data: customerProfile } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", user.id)
    .single();

  // Save acceptances for legal compliance
  const { acceptances } = bookingData;
  if (acceptances && bookingId) {
    const { error: acceptanceError } = await supabase
      .from("booking_acceptances")
      .insert({
        booking_id: bookingId,
        user_id: user.id,
        owner_rules_accepted: acceptances.owner_rules_accepted,
        owner_rules_accepted_at: acceptances.owner_rules_accepted_at,
        basic_rules_accepted: acceptances.basic_rules_accepted,
        basic_rules_accepted_at: acceptances.basic_rules_accepted_at,
        cancellation_policy_accepted: acceptances.cancellation_policy_accepted,
        cancellation_policy_accepted_at: acceptances.cancellation_policy_accepted_at,
        terms_of_service_accepted: acceptances.terms_of_service_accepted,
        terms_of_service_accepted_at: acceptances.terms_of_service_accepted_at,
        privacy_policy_accepted: acceptances.privacy_policy_accepted,
        privacy_policy_accepted_at: acceptances.privacy_policy_accepted_at,
        user_agent: navigator.userAgent,
      });

    if (acceptanceError) {
      console.error("Error saving acceptances:", acceptanceError);
    }
  }

  // Create notification for the vehicle owner
  if (bookingData.owner_id && bookingId) {
    const vehicleName = vehicleInfo ? `${vehicleInfo.brand} ${vehicleInfo.model}` : "veículo";
    const customerName = customerProfile ? `${customerProfile.first_name} ${customerProfile.last_name}` : "Um usuário";
    
    await supabase.from("notifications").insert({
      user_id: bookingData.owner_id,
      notification_type: "booking",
      title: "Nova solicitação de reserva!",
      message: `${customerName} quer alugar seu ${vehicleName} de ${new Date(bookingData.start_date).toLocaleDateString('pt-BR')} a ${new Date(bookingData.end_date).toLocaleDateString('pt-BR')}. Clique para revisar e aprovar!`,
      action_url: `/owner-dashboard`,
    });
  }

  return { id: bookingId };
}

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
  owner?: {
    first_name: string;
    last_name: string;
    phone_number: string | null;
    profile_image: string | null;
  };
  customer?: {
    first_name: string;
    last_name: string;
    phone_number: string | null;
    email: string;
    profile_image: string | null;
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
          owner:profiles!bookings_owner_id_fkey (
            first_name,
            last_name,
            phone_number,
            profile_image
          ),
          customer:profiles!bookings_customer_id_fkey (
            first_name,
            last_name,
            phone_number,
            email,
            profile_image
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
