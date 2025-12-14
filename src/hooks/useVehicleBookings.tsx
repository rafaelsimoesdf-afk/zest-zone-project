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
  if (!bookings || bookings.length === 0) return [];

  const disabledDates: Date[] = [];

  bookings.forEach((booking) => {
    // Parse dates properly - handle both ISO strings and date-only strings
    const startStr = booking.start_date.split('T')[0];
    const endStr = booking.end_date.split('T')[0];
    
    const [startYear, startMonth, startDay] = startStr.split('-').map(Number);
    const [endYear, endMonth, endDay] = endStr.split('-').map(Number);
    
    const start = new Date(startYear, startMonth - 1, startDay);
    const end = new Date(endYear, endMonth - 1, endDay);

    // Add all dates between start and end (inclusive)
    const current = new Date(start);
    while (current <= end) {
      disabledDates.push(new Date(current.getFullYear(), current.getMonth(), current.getDate()));
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
    // Parse dates properly
    const startStr = booking.start_date.split('T')[0];
    const endStr = booking.end_date.split('T')[0];
    
    const [startYear, startMonth, startDay] = startStr.split('-').map(Number);
    const [endYear, endMonth, endDay] = endStr.split('-').map(Number);
    
    const bookingStart = new Date(startYear, startMonth - 1, startDay);
    const bookingEnd = new Date(endYear, endMonth - 1, endDay);

    // Check for overlap
    return startDate <= bookingEnd && endDate >= bookingStart;
  });
};
