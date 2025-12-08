import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface VehicleBooking {
  id: string;
  start_date: string;
  end_date: string;
  status: string;
}

export const useVehicleBookings = (vehicleId: string) => {
  return useQuery({
    queryKey: ["vehicle-bookings", vehicleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, start_date, end_date, status")
        .eq("vehicle_id", vehicleId)
        .in("status", ["pending", "confirmed", "in_progress"]);

      if (error) throw error;
      return data as VehicleBooking[];
    },
    enabled: !!vehicleId,
  });
};

// Helper function to get all disabled dates from bookings
export const getDisabledDates = (bookings: VehicleBooking[] | undefined): Date[] => {
  if (!bookings) return [];

  const disabledDates: Date[] = [];

  bookings.forEach((booking) => {
    const start = new Date(booking.start_date);
    const end = new Date(booking.end_date);

    // Add all dates between start and end (inclusive)
    const current = new Date(start);
    while (current <= end) {
      disabledDates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
  });

  return disabledDates;
};

// Helper function to check if a date range overlaps with any booking
export const isDateRangeAvailable = (
  startDate: Date,
  endDate: Date,
  bookings: VehicleBooking[] | undefined
): boolean => {
  if (!bookings || bookings.length === 0) return true;

  return !bookings.some((booking) => {
    const bookingStart = new Date(booking.start_date);
    const bookingEnd = new Date(booking.end_date);

    // Check for overlap
    return startDate <= bookingEnd && endDate >= bookingStart;
  });
};
