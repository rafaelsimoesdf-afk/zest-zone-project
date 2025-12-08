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
  total_days: number;
  daily_rate: number;
  total_price: number;
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
  total_revenue: number;
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
  total_revenue: number;
  average_booking_value: number;
  average_days_per_booking: number;
  this_month_revenue: number;
  last_month_revenue: number;
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
      const totalRevenue = revenueBookings.reduce((sum, b) => sum + Number(b.total_price), 0);
      const totalDays = revenueBookings.reduce((sum, b) => sum + b.total_days, 0);

      const thisMonthBookings = revenueBookings.filter(b => 
        new Date(b.created_at) >= thisMonthStart
      );
      const thisMonthRevenue = thisMonthBookings.reduce((sum, b) => sum + Number(b.total_price), 0);

      const lastMonthBookings = revenueBookings.filter(b => {
        const date = new Date(b.created_at);
        return date >= lastMonthStart && date <= lastMonthEnd;
      });
      const lastMonthRevenue = lastMonthBookings.reduce((sum, b) => sum + Number(b.total_price), 0);

      const revenueGrowth = lastMonthRevenue > 0 
        ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
        : thisMonthRevenue > 0 ? 100 : 0;

      return {
        total_vehicles: vehiclesCount || 0,
        total_bookings: allBookings.length,
        pending_bookings: pendingBookings.length,
        confirmed_bookings: confirmedBookings.length,
        completed_bookings: completedBookings.length,
        cancelled_bookings: cancelledBookings.length,
        total_revenue: totalRevenue,
        average_booking_value: revenueBookings.length > 0 ? totalRevenue / revenueBookings.length : 0,
        average_days_per_booking: revenueBookings.length > 0 ? totalDays / revenueBookings.length : 0,
        this_month_revenue: thisMonthRevenue,
        last_month_revenue: lastMonthRevenue,
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

      return vehicles.map(vehicle => {
        const vehicleBookings = allBookings.filter(b => b.vehicle_id === vehicle.id);
        const revenueBookings = vehicleBookings.filter(b => 
          b.status === "confirmed" || b.status === "completed"
        );
        const primaryImage = vehicle.vehicle_images?.find(img => img.is_primary) || vehicle.vehicle_images?.[0];

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
          total_revenue: revenueBookings.reduce((sum, b) => sum + Number(b.total_price), 0),
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

      // Verify ownership
      const { data: booking } = await supabase
        .from("bookings")
        .select("owner_id")
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
      };
      
      toast.success(messages[status] || "Status atualizado!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar reserva");
    },
  });
};
