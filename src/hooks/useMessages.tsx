import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect } from "react";

export interface Message {
  id: string;
  booking_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  sender?: {
    first_name: string;
    last_name: string;
    profile_image: string | null;
  };
  receiver?: {
    first_name: string;
    last_name: string;
    profile_image: string | null;
  };
}

export interface Conversation {
  booking_id: string;
  other_user: {
    id: string;
    first_name: string;
    last_name: string;
    profile_image: string | null;
  };
  vehicle: {
    brand: string;
    model: string;
    year: number;
  };
  booking: {
    start_date: string;
    end_date: string;
    status: string;
  };
  last_message: {
    content: string;
    created_at: string;
    is_read: boolean;
    sender_id: string;
  } | null;
  unread_count: number;
}

// Fetch all conversations for the current user
export const useConversations = () => {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get all bookings where user is customer or owner with confirmed+ status
      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select(`
          id,
          customer_id,
          owner_id,
          start_date,
          end_date,
          status,
          vehicles (
            brand,
            model,
            year
          )
        `)
        .or(`customer_id.eq.${user.id},owner_id.eq.${user.id}`)
        .in("status", ["confirmed", "in_progress", "completed"]);

      if (bookingsError) throw bookingsError;
      if (!bookings || bookings.length === 0) return [];

      // Get all messages for these bookings
      const bookingIds = bookings.map(b => b.id);
      const { data: messages, error: messagesError } = await supabase
        .from("messages")
        .select("*")
        .in("booking_id", bookingIds)
        .order("created_at", { ascending: false });

      if (messagesError) throw messagesError;

      // Get other user profiles
      const otherUserIds = bookings.map(b => 
        b.customer_id === user.id ? b.owner_id : b.customer_id
      );
      
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, profile_image")
        .in("id", otherUserIds);

      if (profilesError) throw profilesError;

      // Build conversations
      const conversations: Conversation[] = bookings.map(booking => {
        const otherUserId = booking.customer_id === user.id ? booking.owner_id : booking.customer_id;
        const otherUser = profiles?.find(p => p.id === otherUserId);
        const bookingMessages = messages?.filter(m => m.booking_id === booking.id) || [];
        const lastMessage = bookingMessages[0] || null;
        const unreadCount = bookingMessages.filter(m => 
          m.receiver_id === user.id && !m.is_read
        ).length;

        return {
          booking_id: booking.id,
          other_user: {
            id: otherUserId,
            first_name: otherUser?.first_name || "",
            last_name: otherUser?.last_name || "",
            profile_image: otherUser?.profile_image || null,
          },
          vehicle: {
            brand: (booking.vehicles as any)?.brand || "",
            model: (booking.vehicles as any)?.model || "",
            year: (booking.vehicles as any)?.year || 0,
          },
          booking: {
            start_date: booking.start_date,
            end_date: booking.end_date,
            status: booking.status,
          },
          last_message: lastMessage ? {
            content: lastMessage.content,
            created_at: lastMessage.created_at,
            is_read: lastMessage.is_read,
            sender_id: lastMessage.sender_id,
          } : null,
          unread_count: unreadCount,
        };
      });

      // Sort by last message date
      return conversations.sort((a, b) => {
        const dateA = a.last_message?.created_at || a.booking.start_date;
        const dateB = b.last_message?.created_at || b.booking.start_date;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });
    },
  });
};

// Fetch messages for a specific booking
export const useBookingMessages = (bookingId: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["messages", bookingId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("booking_id", bookingId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Get sender/receiver profiles
      const userIds = [...new Set(data?.flatMap(m => [m.sender_id, m.receiver_id]) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, profile_image")
        .in("id", userIds);

      return data?.map(message => ({
        ...message,
        sender: profiles?.find(p => p.id === message.sender_id),
        receiver: profiles?.find(p => p.id === message.receiver_id),
      })) as Message[];
    },
    enabled: !!bookingId,
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!bookingId) return;

    const channel = supabase
      .channel(`messages-${bookingId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `booking_id=eq.${bookingId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["messages", bookingId] });
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
          queryClient.invalidateQueries({ queryKey: ["unreadMessagesCount"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId, queryClient]);

  return query;
};

// Send a message
export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      bookingId, 
      receiverId, 
      content 
    }: { 
      bookingId: string; 
      receiverId: string; 
      content: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("messages")
        .insert({
          booking_id: bookingId,
          sender_id: user.id,
          receiver_id: receiverId,
          content: content.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      // Create notification for receiver
      await supabase.from("notifications").insert({
        user_id: receiverId,
        title: "Nova mensagem",
        message: `Você recebeu uma nova mensagem sobre sua reserva`,
        notification_type: "booking",
      });

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["messages", variables.bookingId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao enviar mensagem");
    },
  });
};

// Mark messages as read
export const useMarkMessagesAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("messages")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("booking_id", bookingId)
        .eq("receiver_id", user.id)
        .eq("is_read", false);

      if (error) throw error;
    },
    onSuccess: (_, bookingId) => {
      queryClient.invalidateQueries({ queryKey: ["messages", bookingId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["unreadMessagesCount"] });
    },
  });
};

// Get total unread messages count
export const useUnreadMessagesCount = () => {
  return useQuery({
    queryKey: ["unreadMessagesCount"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { count, error } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("is_read", false);

      if (error) throw error;
      return count || 0;
    },
  });
};
