import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CustomerReview {
  id: string;
  booking_id: string;
  reviewer_id: string;
  reviewed_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
  reviewer?: {
    first_name: string;
    last_name: string;
    profile_image: string | null;
  };
}

export interface CustomerStats {
  average_rating: number;
  total_reviews: number;
  total_trips: number;
  reviews: CustomerReview[];
}

// Fetch reviews for a specific customer (renter) - ONLY reviews received as a renter
export const useCustomerReviews = (customerId: string) => {
  return useQuery({
    queryKey: ["customer-reviews", customerId],
    queryFn: async (): Promise<CustomerStats> => {
      if (!customerId) {
        return { average_rating: 0, total_reviews: 0, total_trips: 0, reviews: [] };
      }

      // Fetch reviews where the customer is the reviewed person
      const { data: reviews, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("reviewed_id", customerId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching customer reviews:", error);
        throw error;
      }

      // Filter reviews to only include those where the user was the customer (renter)
      const reviewsAsCustomer = await Promise.all(
        (reviews || []).map(async (review) => {
          // Get booking to check if reviewed user was the customer
          const { data: booking } = await supabase
            .from("bookings")
            .select("customer_id")
            .eq("id", review.booking_id)
            .single();

          // Only include if the reviewed user was the customer (renter)
          if (booking?.customer_id !== customerId) {
            return null;
          }

          // Fetch reviewer profile
          const { data: reviewer } = await supabase
            .from("profiles")
            .select("first_name, last_name, profile_image")
            .eq("id", review.reviewer_id)
            .single();
          
          return { ...review, reviewer };
        })
      );

      // Filter out null values (reviews where user was owner, not customer)
      const filteredReviews = reviewsAsCustomer.filter(
        (r): r is CustomerReview & { reviewer: { first_name: string; last_name: string; profile_image: string | null } } => r !== null
      );

      // Count completed trips as a customer
      const { count: totalTrips } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("customer_id", customerId)
        .eq("status", "completed");

      const totalReviews = filteredReviews.length;
      const averageRating = totalReviews > 0
        ? filteredReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;

      return {
        average_rating: averageRating,
        total_reviews: totalReviews,
        total_trips: totalTrips || 0,
        reviews: filteredReviews as CustomerReview[],
      };
    },
    enabled: !!customerId,
  });
};
