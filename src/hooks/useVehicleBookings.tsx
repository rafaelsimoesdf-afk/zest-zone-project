import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface VehicleBooking {
  start_date: string;
  end_date: string;
  status: string;
}

export const useVehicleBookings = (vehicleId: string) => {
  return useQuery({
    queryKey: ["vehicle-bookings", vehicleId],
    queryFn: async () => {
      // Use the secure database function that returns correct date ranges
      const { data, error } = await supabase.rpc("get_public_vehicle_bookings", {
        _vehicle_id: vehicleId,
      });

      if (error) {
        console.error("Error fetching vehicle bookings:", error);
        throw error;
      }
      
      console.log("Vehicle bookings for", vehicleId, ":", data);
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
    // Dates come as yyyy-MM-dd from the database function
    const startStr = booking.start_date;
    const endStr = booking.end_date;
    
    const [startYear, startMonth, startDay] = startStr.split('-').map(Number);
    const [endYear, endMonth, endDay] = endStr.split('-').map(Number);
    
    const start = new Date(startYear, startMonth - 1, startDay);
    const end = new Date(endYear, endMonth - 1, endDay);

    console.log(`Booking: ${startStr} to ${endStr} -> blocking dates from`, start, "to", end);

    // Add all dates between start and end (inclusive)
    const current = new Date(start);
    while (current <= end) {
      disabledDates.push(new Date(current.getFullYear(), current.getMonth(), current.getDate()));
      current.setDate(current.getDate() + 1);
    }
  });

  console.log("Total disabled dates:", disabledDates.length, disabledDates.map(d => d.toISOString().split('T')[0]));
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
    // Dates come as yyyy-MM-dd from the database function
    const startStr = booking.start_date;
    const endStr = booking.end_date;
    
    const [startYear, startMonth, startDay] = startStr.split('-').map(Number);
    const [endYear, endMonth, endDay] = endStr.split('-').map(Number);
    
    const bookingStart = new Date(startYear, startMonth - 1, startDay);
    const bookingEnd = new Date(endYear, endMonth - 1, endDay);

    // Normalize the input dates to midnight
    const checkStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const checkEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

    // Check for overlap
    return checkStart <= bookingEnd && checkEnd >= bookingStart;
  });
};
