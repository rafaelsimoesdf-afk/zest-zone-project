import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface OwnerBooking {
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
  updated_at: string;
  vehicles?: {
    id: string;
    brand: string;
    model: string;
    year: number;
    license_plate: string;
    vehicle_images?: Array<{
      image_url: string;
      is_primary: boolean;
    }>;
  };
  customer?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string | null;
    profile_image: string | null;
  };
}

export interface VehicleStats {
  vehicle_id: string;
  brand: string;
  model: string;
  year: number;
  license_plate: string;
  total_bookings: number;
  confirmed_bookings: number;
  pending_bookings: number;
  cancelled_bookings: number;
  gross_revenue: number; // Receita bruta (total pago pelo locatário)
  platform_fee: number; // Taxa da plataforma (15% do subtotal)
  net_revenue: number; // Receita líquida (o que o proprietário recebe)
  average_daily_rate: number;
  total_days_rented: number;
  image_url: string | null;
}

export interface DashboardStats {
  total_vehicles: number;
  total_bookings: number;
  pending_bookings: number;
  confirmed_bookings: number;
  completed_bookings: number;
  cancelled_bookings: number;
  gross_revenue: number; // Receita bruta total
  platform_fees: number; // Total de taxas pagas à plataforma
  net_revenue: number; // Receita líquida (o que o proprietário recebe)
  average_booking_value: number;
  average_days_per_booking: number;
  this_month_net_revenue: number;
  last_month_net_revenue: number;
  revenue_growth: number;
}

export const useOwnerDashboardStats = () => {
  return useQuery({
    queryKey: ["ownerDashboardStats"],
    queryFn: async (): Promise<DashboardStats> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get vehicles count
      const { count: vehiclesCount } = await supabase
        .from("vehicles")
        .select("*", { count: "exact", head: true })
        .eq("owner_id", user.id);

      // Get all bookings for owner's vehicles
      const { data: bookings } = await supabase
        .from("bookings")
        .select("*")
        .eq("owner_id", user.id);

      const allBookings = bookings || [];
      
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      const pendingBookings = allBookings.filter(b => b.status === "pending");
      const confirmedBookings = allBookings.filter(b => b.status === "confirmed");
      const completedBookings = allBookings.filter(b => b.status === "completed");
      const cancelledBookings = allBookings.filter(b => b.status === "cancelled");

      const revenueBookings = allBookings.filter(b => 
        b.status === "confirmed" || b.status === "completed"
      );
      
      // Calcular receitas - Taxa de 15% (diárias + horas extras) é paga pelo proprietário
      // O locatário paga: diárias + horas extras + seguro
      // O proprietário recebe: (diárias + horas extras) - 15% = 85% do valor das diárias + horas extras
      const PLATFORM_FEE_RATE = 0.15;
      const INSURANCE_PER_DAY = 20;
      
      let grossRevenue = 0;
      let platformFees = 0;
      let netRevenue = 0;
      
      revenueBookings.forEach(b => {
        const dailySubtotal = Number(b.daily_rate) * b.total_days;
        const extraHoursCharge = Number(b.extra_hours_charge) || 0;
        const rentalAmount = dailySubtotal + extraHoursCharge; // Diárias + horas extras
        const insurance = b.total_days * INSURANCE_PER_DAY;
        const bookingGross = rentalAmount + insurance; // O que o locatário pagou
        const platformFee = rentalAmount * PLATFORM_FEE_RATE; // 15% das diárias + horas extras
        const bookingNet = rentalAmount - platformFee; // O que o proprietário recebe
        
        grossRevenue += bookingGross;
        platformFees += platformFee;
        netRevenue += bookingNet;
      });
      
      const totalDays = revenueBookings.reduce((sum, b) => sum + b.total_days, 0);

      const thisMonthBookings = revenueBookings.filter(b => 
        new Date(b.created_at) >= thisMonthStart
      );
      
      let thisMonthNetRevenue = 0;
      thisMonthBookings.forEach(b => {
        const dailySubtotal = Number(b.daily_rate) * b.total_days;
        const extraHoursCharge = Number(b.extra_hours_charge) || 0;
        const rentalAmount = dailySubtotal + extraHoursCharge;
        const platformFee = rentalAmount * PLATFORM_FEE_RATE;
        thisMonthNetRevenue += rentalAmount - platformFee;
      });

      const lastMonthBookings = revenueBookings.filter(b => {
        const date = new Date(b.created_at);
        return date >= lastMonthStart && date <= lastMonthEnd;
      });
      
      let lastMonthNetRevenue = 0;
      lastMonthBookings.forEach(b => {
        const dailySubtotal = Number(b.daily_rate) * b.total_days;
        const extraHoursCharge = Number(b.extra_hours_charge) || 0;
        const rentalAmount = dailySubtotal + extraHoursCharge;
        const platformFee = rentalAmount * PLATFORM_FEE_RATE;
        lastMonthNetRevenue += rentalAmount - platformFee;
      });

      const revenueGrowth = lastMonthNetRevenue > 0 
        ? ((thisMonthNetRevenue - lastMonthNetRevenue) / lastMonthNetRevenue) * 100 
        : thisMonthNetRevenue > 0 ? 100 : 0;

      return {
        total_vehicles: vehiclesCount || 0,
        total_bookings: allBookings.length,
        pending_bookings: pendingBookings.length,
        confirmed_bookings: confirmedBookings.length,
        completed_bookings: completedBookings.length,
        cancelled_bookings: cancelledBookings.length,
        gross_revenue: grossRevenue,
        platform_fees: platformFees,
        net_revenue: netRevenue,
        average_booking_value: revenueBookings.length > 0 ? netRevenue / revenueBookings.length : 0,
        average_days_per_booking: revenueBookings.length > 0 ? totalDays / revenueBookings.length : 0,
        this_month_net_revenue: thisMonthNetRevenue,
        last_month_net_revenue: lastMonthNetRevenue,
        revenue_growth: revenueGrowth,
      };
    },
  });
};

export const useOwnerVehicleStats = () => {
  return useQuery({
    queryKey: ["ownerVehicleStats"],
    queryFn: async (): Promise<VehicleStats[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get all vehicles with their bookings
      const { data: vehicles } = await supabase
        .from("vehicles")
        .select(`
          id,
          brand,
          model,
          year,
          license_plate,
          vehicle_images (
            image_url,
            is_primary
          )
        `)
        .eq("owner_id", user.id);

      if (!vehicles) return [];

      // Get all bookings for these vehicles
      const vehicleIds = vehicles.map(v => v.id);
      const { data: bookings } = await supabase
        .from("bookings")
        .select("*")
        .in("vehicle_id", vehicleIds);

      const allBookings = bookings || [];

      const PLATFORM_FEE_RATE = 0.15;
      const INSURANCE_PER_DAY = 20;
      
      return vehicles.map(vehicle => {
        const vehicleBookings = allBookings.filter(b => b.vehicle_id === vehicle.id);
        const revenueBookings = vehicleBookings.filter(b => 
          b.status === "confirmed" || b.status === "completed"
        );
        const primaryImage = vehicle.vehicle_images?.find(img => img.is_primary) || vehicle.vehicle_images?.[0];

        let grossRevenue = 0;
        let platformFee = 0;
        let netRevenue = 0;
        
        revenueBookings.forEach(b => {
          const dailySubtotal = Number(b.daily_rate) * b.total_days;
          const extraHoursCharge = Number(b.extra_hours_charge) || 0;
          const rentalAmount = dailySubtotal + extraHoursCharge;
          const insurance = b.total_days * INSURANCE_PER_DAY;
          const bookingGross = rentalAmount + insurance;
          const fee = rentalAmount * PLATFORM_FEE_RATE;
          
          grossRevenue += bookingGross;
          platformFee += fee;
          netRevenue += rentalAmount - fee;
        });

        return {
          vehicle_id: vehicle.id,
          brand: vehicle.brand,
          model: vehicle.model,
          year: vehicle.year,
          license_plate: vehicle.license_plate,
          total_bookings: vehicleBookings.length,
          confirmed_bookings: vehicleBookings.filter(b => b.status === "confirmed").length,
          pending_bookings: vehicleBookings.filter(b => b.status === "pending").length,
          cancelled_bookings: vehicleBookings.filter(b => b.status === "cancelled").length,
          gross_revenue: grossRevenue,
          platform_fee: platformFee,
          net_revenue: netRevenue,
          average_daily_rate: revenueBookings.length > 0 
            ? revenueBookings.reduce((sum, b) => sum + Number(b.daily_rate), 0) / revenueBookings.length 
            : 0,
          total_days_rented: revenueBookings.reduce((sum, b) => sum + b.total_days, 0),
          image_url: primaryImage?.image_url || null,
        };
      });
    },
  });
};

export const useOwnerBookings = (status?: string) => {
  return useQuery({
    queryKey: ["ownerBookings", status],
    queryFn: async (): Promise<OwnerBooking[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let query = supabase
        .from("bookings")
        .select(`
          *,
          vehicles (
            id,
            brand,
            model,
            year,
            license_plate,
            vehicle_images (
              image_url,
              is_primary
            )
          ),
          customer:profiles!bookings_customer_id_fkey (
            id,
            first_name,
            last_name,
            email,
            phone_number,
            profile_image
          )
        `)
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (status && status !== "all") {
        query = query.eq("status", status as "pending" | "confirmed" | "completed" | "cancelled" | "in_progress" | "disputed");
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as OwnerBooking[];
    },
  });
};

export const useHasVehicles = () => {
  return useQuery({
    queryKey: ["hasVehicles"],
    queryFn: async (): Promise<boolean> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { count } = await supabase
        .from("vehicles")
        .select("*", { count: "exact", head: true })
        .eq("owner_id", user.id);

      return (count || 0) > 0;
    },
  });
};

export interface UpdateBookingStatusData {
  bookingId: string;
  status: string;
  reason?: string;
}

export const useUpdateOwnerBookingStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingId, status, reason }: UpdateBookingStatusData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Verify ownership and get booking details
      const { data: booking } = await supabase
        .from("bookings")
        .select(`
          owner_id,
          customer_id,
          vehicles (brand, model)
        `)
        .eq("id", bookingId)
        .single();

      if (!booking || booking.owner_id !== user.id) {
        throw new Error("Você não tem permissão para alterar esta reserva");
      }

      const updateData: Record<string, unknown> = { 
        status: status as "pending" | "confirmed" | "completed" | "cancelled" | "in_progress" | "disputed"
      };
      
      if (reason) {
        updateData.notes = reason;
      }

      const { data, error } = await supabase
        .from("bookings")
        .update(updateData)
        .eq("id", bookingId)
        .select()
        .single();

      if (error) throw error;

      // Create notification for customer based on status change
      if (booking.customer_id) {
        const vehicleInfo = booking.vehicles as { brand: string; model: string } | null;
        const vehicleName = vehicleInfo ? `${vehicleInfo.brand} ${vehicleInfo.model}` : "veículo";
        
        let notificationTitle = "";
        let notificationMessage = "";
        let actionUrl = `/booking/${bookingId}`;
        
        switch (status) {
          case "confirmed":
            notificationTitle = "Reserva aprovada!";
            notificationMessage = `Ótima notícia! Sua reserva do ${vehicleName} foi aceita pelo proprietário. Clique para ver os detalhes da reserva.`;
            break;
          case "cancelled":
            notificationTitle = "Reserva cancelada";
            notificationMessage = reason 
              ? `Sua reserva do ${vehicleName} foi cancelada. Motivo: ${reason}`
              : `Infelizmente sua reserva do ${vehicleName} foi cancelada pelo proprietário. Clique para mais detalhes.`;
            break;
          case "completed":
            notificationTitle = "Reserva finalizada!";
            notificationMessage = `Sua viagem com o ${vehicleName} foi finalizada com sucesso! Que tal avaliar sua experiência com o proprietário?`;
            break;
        }
        
        if (notificationTitle) {
          await supabase.from("notifications").insert({
            user_id: booking.customer_id,
            notification_type: "booking",
            title: notificationTitle,
            message: notificationMessage,
            action_url: actionUrl,
          });
        }
      }

      return data;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["ownerBookings"] });
      queryClient.invalidateQueries({ queryKey: ["ownerDashboardStats"] });
      queryClient.invalidateQueries({ queryKey: ["ownerVehicleStats"] });
      
      const messages: Record<string, string> = {
        confirmed: "Reserva aprovada com sucesso!",
        rejected: "Reserva rejeitada.",
        cancelled: "Reserva cancelada.",
        completed: "Reserva finalizada! O locatário agora pode avaliar.",
      };
      
      toast.success(messages[status] || "Status atualizado!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar reserva");
    },
  });
};
