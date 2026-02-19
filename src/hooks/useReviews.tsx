import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { sendReviewReceivedEmail, getUserEmailData } from "@/hooks/useEmailNotifications";

export interface Review {
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

export interface OwnerStats {
  average_rating: number;
  total_reviews: number;
  total_trips: number;
  reviews: Review[];
}

// Fetch reviews for a specific user (owner) - only reviews received AS AN OWNER
export const useOwnerReviews = (ownerId: string) => {
  return useQuery({
    queryKey: ["owner-reviews", ownerId],
    queryFn: async (): Promise<OwnerStats> => {
      if (!ownerId) {
        return { average_rating: 0, total_reviews: 0, total_trips: 0, reviews: [] };
      }

      // Fetch reviews where the owner is the reviewed person
      const { data: reviews, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("reviewed_id", ownerId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching reviews:", error);
        throw error;
      }

      // Fetch reviewer profiles and booking info, then filter to only include reviews
      // where the user was the OWNER of the booking (not the customer)
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
              .select("customer_id, owner_id")
              .eq("id", review.booking_id)
              .single(),
          ]);
          
          return { 
            ...review, 
            reviewer: reviewerResult.data,
            booking: bookingResult.data,
          };
        })
      );

      // Filter to only include reviews where the user was the owner of the booking
      const ownerReviews = reviewsWithDetails.filter(
        (review) => review.booking?.owner_id === ownerId
      );

      const { count: totalTrips } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("owner_id", ownerId)
        .eq("status", "completed");

      const totalReviews = ownerReviews.length;
      const averageRating = totalReviews > 0
        ? ownerReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;

      return {
        average_rating: averageRating,
        total_reviews: totalReviews,
        total_trips: totalTrips || 0,
        reviews: ownerReviews as Review[],
      };
    },
    enabled: !!ownerId,
  });
};

// Check if a user has already reviewed a booking
export const useExistingReview = (bookingId: string, reviewerId: string) => {
  return useQuery({
    queryKey: ["existing-review", bookingId, reviewerId],
    queryFn: async () => {
      if (!bookingId || !reviewerId) return null;

      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("booking_id", bookingId)
        .eq("reviewer_id", reviewerId)
        .maybeSingle();

      if (error) {
        console.error("Error checking existing review:", error);
        throw error;
      }

      return data;
    },
    enabled: !!bookingId && !!reviewerId,
  });
};

// Create a new review
export const useCreateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookingId,
      reviewerId,
      reviewedId,
      rating,
      comment,
    }: {
      bookingId: string;
      reviewerId: string;
      reviewedId: string;
      rating: number;
      comment?: string;
    }) => {
      const { data, error } = await supabase
        .from("reviews")
        .insert({
          booking_id: bookingId,
          reviewer_id: reviewerId,
          reviewed_id: reviewedId,
          rating,
          comment: comment || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Get booking info to determine roles and vehicle name
      const { data: booking } = await supabase
        .from("bookings")
        .select("customer_id, owner_id, vehicle_id")
        .eq("id", bookingId)
        .single();

      // Get vehicle name
      let vehicleName = "veículo";
      if (booking?.vehicle_id) {
        const { data: vehicle } = await supabase
          .from("vehicles")
          .select("brand, model")
          .eq("id", booking.vehicle_id)
          .single();
        if (vehicle) {
          vehicleName = `${vehicle.brand} ${vehicle.model}`;
        }
      }

      // Get reviewer name for notification
      const { data: reviewerProfile } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", reviewerId)
        .single();

      const reviewerName = reviewerProfile 
        ? `${reviewerProfile.first_name} ${reviewerProfile.last_name}` 
        : "Um usuário";

      // Determine if reviewer is owner or customer
      const isReviewerOwner = booking?.owner_id === reviewerId;
      
      // Create appropriate notification message
      let notificationTitle: string;
      let notificationMessage: string;

      if (isReviewerOwner) {
        // Owner reviewed the customer
        notificationTitle = "Você recebeu uma avaliação do proprietário!";
        notificationMessage = `O proprietário do ${vehicleName} avaliou você com ${rating} estrela${rating > 1 ? "s" : ""}${comment ? `: "${comment}"` : ""}. Clique para ver suas avaliações como locatário.`;
      } else {
        // Customer reviewed the owner
        notificationTitle = "Você recebeu uma avaliação do locatário!";
        notificationMessage = `${reviewerName} avaliou sua experiência com o ${vehicleName} com ${rating} estrela${rating > 1 ? "s" : ""}${comment ? `: "${comment}"` : ""}. Clique para ver suas avaliações como proprietário.`;
      }

      // Create notification for the reviewed person
      await supabase.from("notifications").insert({
        user_id: reviewedId,
        notification_type: "booking",
        title: notificationTitle,
        message: notificationMessage,
        action_url: "/profile?tab=reviews",
      });

      // Send email notification for review received
      const reviewedUserData = await getUserEmailData(reviewedId);
      const reviewerProfileData = await getUserEmailData(reviewerId);
      if (reviewedUserData && reviewerProfileData) {
        sendReviewReceivedEmail({
          reviewedEmail: reviewedUserData.email,
          reviewedName: reviewedUserData.name,
          reviewerName: reviewerProfileData.name,
          vehicleName,
          rating,
          comment: comment || null,
        });
      }

      return data;
    },
    onSuccess: (data) => {
      toast.success("Avaliação enviada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["owner-reviews", data.reviewed_id] });
      queryClient.invalidateQueries({ queryKey: ["customer-reviews", data.reviewed_id] });
      queryClient.invalidateQueries({ queryKey: ["all-user-reviews", data.reviewed_id] });
      queryClient.invalidateQueries({ queryKey: ["existing-review"] });
    },
    onError: (error) => {
      console.error("Error creating review:", error);
      toast.error("Erro ao enviar avaliação. Tente novamente.");
    },
  });
};

// Update an existing review
export const useUpdateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reviewId,
      rating,
      comment,
    }: {
      reviewId: string;
      rating: number;
      comment?: string;
    }) => {
      const { data, error } = await supabase
        .from("reviews")
        .update({
          rating,
          comment: comment || null,
        })
        .eq("id", reviewId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success("Avaliação atualizada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["owner-reviews", data.reviewed_id] });
      queryClient.invalidateQueries({ queryKey: ["existing-review"] });
    },
    onError: (error) => {
      console.error("Error updating review:", error);
      toast.error("Erro ao atualizar avaliação. Tente novamente.");
    },
  });
};
