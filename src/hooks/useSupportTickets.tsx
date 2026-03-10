import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect } from "react";

export type TicketPriority = "low" | "medium" | "high" | "emergency";
export type TicketCategory = "account" | "payment" | "booking" | "vehicle_issue" | "owner_issue" | "renter_issue" | "accident" | "technical" | "other";
export type TicketStatus = "open" | "in_progress" | "waiting_customer" | "resolved" | "closed";

export interface SupportTicket {
  id: string;
  ticket_number: string;
  subject: string;
  message: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: string;
  booking_id: string | null;
  assigned_to: string | null;
  sla_deadline: string | null;
  closed_at: string | null;
  resolved_at: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  content: string;
  is_from_support: boolean;
  created_at: string;
  sender?: { first_name: string; last_name: string; profile_image: string | null };
}

export interface FaqArticle {
  id: string;
  category: TicketCategory;
  title: string;
  content: string;
  keywords: string[];
  display_order: number;
  is_published: boolean;
}

const priorityLabels: Record<TicketPriority, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  emergency: "Emergencial",
};

const categoryLabels: Record<TicketCategory, string> = {
  account: "Conta",
  payment: "Pagamento",
  booking: "Reserva",
  vehicle_issue: "Problema com veículo",
  owner_issue: "Problema com proprietário",
  renter_issue: "Problema com locatário",
  accident: "Acidente ou dano",
  technical: "Problema técnico",
  other: "Outros",
};

const statusLabels: Record<string, string> = {
  open: "Aberto",
  in_progress: "Em atendimento",
  waiting_customer: "Aguardando cliente",
  resolved: "Resolvido",
  closed: "Fechado",
};

export { priorityLabels, categoryLabels, statusLabels };

export const slaLabels: Record<TicketPriority, string> = {
  emergency: "5 minutos",
  high: "30 minutos",
  medium: "2 horas",
  low: "24 horas",
};

// ==================== QUERIES ====================

export const useSupportTickets = () => {
  return useQuery({
    queryKey: ["support-tickets"],
    queryFn: async (): Promise<SupportTicket[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as SupportTicket[];
    },
  });
};

export const useSupportTicket = (ticketId: string | undefined) => {
  return useQuery({
    queryKey: ["support-ticket", ticketId],
    enabled: !!ticketId,
    queryFn: async (): Promise<SupportTicket> => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("id", ticketId!)
        .single();

      if (error) throw error;
      return data as unknown as SupportTicket;
    },
  });
};

export const useTicketMessages = (ticketId: string | undefined) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!ticketId) return;

    const channel = supabase
      .channel(`ticket-messages-${ticketId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ticket_messages",
          filter: `ticket_id=eq.${ticketId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["ticket-messages", ticketId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId, queryClient]);

  return useQuery({
    queryKey: ["ticket-messages", ticketId],
    enabled: !!ticketId,
    queryFn: async (): Promise<TicketMessage[]> => {
      const { data, error } = await supabase
        .from("ticket_messages")
        .select("*")
        .eq("ticket_id", ticketId!)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as TicketMessage[];
    },
  });
};

export const useFaqArticles = (category?: TicketCategory) => {
  return useQuery({
    queryKey: ["faq-articles", category],
    queryFn: async (): Promise<FaqArticle[]> => {
      let query = supabase
        .from("faq_articles")
        .select("*")
        .eq("is_published", true)
        .order("display_order", { ascending: true });

      if (category) {
        query = query.eq("category", category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as FaqArticle[];
    },
  });
};

// ==================== MUTATIONS ====================

export const useCreateTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      subject: string;
      message: string;
      category: TicketCategory;
      priority: TicketPriority;
      booking_id?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("support_tickets")
        .insert({
          user_id: user.id,
          subject: params.subject,
          message: params.message,
          category: params.category as string,
          priority: params.priority as string,
          booking_id: params.booking_id || null,
        } as any)
        .select()
        .single();

      if (error) throw error;

      // Create notification
      await supabase.from("notifications").insert({
        user_id: user.id,
        title: "Chamado aberto",
        message: `Seu chamado "${params.subject}" foi aberto com sucesso.`,
        notification_type: "system" as any,
        action_url: `/support/ticket/${(data as any).id}`,
      });

      return data as unknown as SupportTicket;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      toast.success("Chamado aberto com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao abrir chamado: " + error.message);
    },
  });
};

export const useSendTicketMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { ticketId: string; content: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("ticket_messages")
        .insert({
          ticket_id: params.ticketId,
          sender_id: user.id,
          content: params.content,
          is_from_support: false,
        })
        .select()
        .single();

      if (error) throw error;

      // Update ticket status if it was waiting_customer
      await supabase
        .from("support_tickets")
        .update({ status: "open" } as any)
        .eq("id", params.ticketId)
        .eq("status", "waiting_customer");

      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["ticket-messages", vars.ticketId] });
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
    },
    onError: (error) => {
      toast.error("Erro ao enviar mensagem: " + error.message);
    },
  });
};

export const useRateTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      ticketId: string;
      rating: number;
      resolvedProblem: "yes" | "partially" | "no";
      comment?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("ticket_ratings")
        .insert({
          ticket_id: params.ticketId,
          user_id: user.id,
          rating: params.rating,
          resolved_problem: params.resolvedProblem,
          comment: params.comment || null,
        } as any);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      toast.success("Obrigado pela sua avaliação!");
    },
    onError: (error) => {
      toast.error("Erro ao avaliar: " + error.message);
    },
  });
};

// ==================== ADMIN QUERIES ====================

export const useAllSupportTickets = (filters?: {
  status?: string;
  priority?: string;
  category?: string;
}) => {
  return useQuery({
    queryKey: ["admin-support-tickets", filters],
    queryFn: async () => {
      let query = supabase
        .from("support_tickets")
        .select("*, profiles!support_tickets_user_id_fkey(first_name, last_name, email)")
        .order("created_at", { ascending: false });

      if (filters?.status) query = query.eq("status", filters.status);
      if (filters?.priority) query = query.eq("priority", filters.priority);
      if (filters?.category) query = query.eq("category", filters.category);

      const { data, error } = await query;
      if (error) throw error;
      return data as any[];
    },
  });
};

export const useUpdateTicketStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { ticketId: string; status: string; assignedTo?: string }) => {
      const updates: any = { status: params.status };
      if (params.assignedTo) updates.assigned_to = params.assignedTo;
      if (params.status === "resolved") updates.resolved_at = new Date().toISOString();
      if (params.status === "closed") updates.closed_at = new Date().toISOString();

      const { error } = await supabase
        .from("support_tickets")
        .update(updates)
        .eq("id", params.ticketId);

      if (error) throw error;

      // Log audit
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("ticket_audit_log").insert({
        ticket_id: params.ticketId,
        action: "status_change",
        performed_by: user?.id,
        new_value: params.status,
      } as any);

      // Notify the ticket owner
      const { data: ticket } = await supabase
        .from("support_tickets")
        .select("user_id, subject")
        .eq("id", params.ticketId)
        .single();

      if (ticket) {
        await supabase.from("notifications").insert({
          user_id: ticket.user_id,
          title: "Chamado atualizado",
          message: `Seu chamado "${ticket.subject}" foi atualizado para: ${statusLabels[params.status] || params.status}`,
          notification_type: "system" as any,
          action_url: `/support/ticket/${params.ticketId}`,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-support-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      toast.success("Status atualizado!");
    },
  });
};

export const useSendAdminTicketMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { ticketId: string; content: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("ticket_messages")
        .insert({
          ticket_id: params.ticketId,
          sender_id: user.id,
          content: params.content,
          is_from_support: true,
        });

      if (error) throw error;

      // Update status to in_progress
      await supabase
        .from("support_tickets")
        .update({ status: "in_progress" } as any)
        .eq("id", params.ticketId)
        .in("status", ["open"]);

      // Notify ticket owner
      const { data: ticket } = await supabase
        .from("support_tickets")
        .select("user_id, subject")
        .eq("id", params.ticketId)
        .single();

      if (ticket) {
        await supabase.from("notifications").insert({
          user_id: ticket.user_id,
          title: "Nova resposta do suporte",
          message: `O suporte respondeu ao seu chamado "${ticket.subject}"`,
          notification_type: "system" as any,
          action_url: `/support/ticket/${params.ticketId}`,
        });
      }
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["ticket-messages", vars.ticketId] });
      queryClient.invalidateQueries({ queryKey: ["admin-support-tickets"] });
      toast.success("Resposta enviada!");
    },
  });
};
