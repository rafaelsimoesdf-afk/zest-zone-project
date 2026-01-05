import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UserReview {
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
  booking?: {
    vehicle?: {
      brand: string;
      model: string;
    };
    customer_id: string;
    owner_id: string;
  };
  // Derived field to identify review type
  review_type: "as_customer" | "as_owner";
}

export interface UserReviewsStats {
  as_customer: {
    average_rating: number;
    total_reviews: number;
    reviews: UserReview[];
  };
  as_owner: {
    average_rating: number;
    total_reviews: number;
    reviews: UserReview[];
  };
  total_trips_as_customer: number;
  total_trips_as_owner: number;
}

// Fetch all reviews for a user - both as customer and as owner
export const useAllUserReviews = (userId: string) => {
  return useQuery({
    queryKey: ["all-user-reviews", userId],
    queryFn: async (): Promise<UserReviewsStats> => {
      if (!userId) {
        return {
          as_customer: { average_rating: 0, total_reviews: 0, reviews: [] },
          as_owner: { average_rating: 0, total_reviews: 0, reviews: [] },
          total_trips_as_customer: 0,
          total_trips_as_owner: 0,
        };
      }

      // Fetch all reviews where the user is the reviewed person
      const { data: reviews, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("reviewed_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching user reviews:", error);
        throw error;
      }

      // Fetch reviewer profiles and booking info
      const reviewsWithDetails = await Promise.all(
        (reviews || []).map(async (review) => {
          const [reviewerResult, bookingResult] = await Promise.all([
            supabase
              .from("profiles")
              .select("first_name, last_name, profile_image")
              .eq("id", review.reviewer_id)
              .single(),
            supabase
              .from("bookings")
              .select("customer_id, owner_id, vehicle_id")
              .eq("id", review.booking_id)
              .single(),
          ]);

          let vehicle = null;
          if (bookingResult.data?.vehicle_id) {
            const { data: vehicleData } = await supabase
              .from("vehicles")
              .select("brand, model")
              .eq("id", bookingResult.data.vehicle_id)
              .single();
            vehicle = vehicleData;
          }

          // Determine if this review is for the user as customer or owner
          const isAsCustomer = bookingResult.data?.customer_id === userId;
          const reviewType = isAsCustomer ? "as_customer" : "as_owner";

          return {
            ...review,
            reviewer: reviewerResult.data,
            booking: bookingResult.data ? { ...bookingResult.data, vehicle } : undefined,
            review_type: reviewType,
          } as UserReview;
        })
      );

      // Separate reviews by type
      const customerReviews = reviewsWithDetails.filter((r) => r.review_type === "as_customer");
      const ownerReviews = reviewsWithDetails.filter((r) => r.review_type === "as_owner");

      // Count completed trips
      const [customerTripsResult, ownerTripsResult] = await Promise.all([
        supabase
          .from("bookings")
          .select("*", { count: "exact", head: true })
          .eq("customer_id", userId)
          .eq("status", "completed"),
        supabase
          .from("bookings")
          .select("*", { count: "exact", head: true })
          .eq("owner_id", userId)
          .eq("status", "completed"),
      ]);

      const calcAverage = (revs: UserReview[]) =>
        revs.length > 0 ? revs.reduce((sum, r) => sum + r.rating, 0) / revs.length : 0;

      return {
        as_customer: {
          average_rating: calcAverage(customerReviews),
          total_reviews: customerReviews.length,
          reviews: customerReviews,
        },
        as_owner: {
          average_rating: calcAverage(ownerReviews),
          total_reviews: ownerReviews.length,
          reviews: ownerReviews,
        },
        total_trips_as_customer: customerTripsResult.count || 0,
        total_trips_as_owner: ownerTripsResult.count || 0,
      };
    },
    enabled: !!userId,
  });
};
