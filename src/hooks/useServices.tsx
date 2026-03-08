import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export const SERVICE_CATEGORIES = [
  { value: "motorista_particular", label: "Motorista Particular" },
  { value: "polimento", label: "Polimento para Veículos" },
  { value: "lavagem", label: "Lavagem em Casa" },
  { value: "turismo", label: "Passeios Turísticos" },
  { value: "mecanico", label: "Mecânico 24h" },
  { value: "guincho", label: "Guincho Particular" },
  { value: "fotografo", label: "Fotógrafo para Veículos" },
  { value: "seguro", label: "Seguros e Proteção" },
  { value: "documentacao", label: "Documentação Veicular" },
  { value: "transporte", label: "Transporte de Veículos" },
  { value: "outros", label: "Outros" },
];

export const getCategoryLabel = (value: string) => {
  return SERVICE_CATEGORIES.find(c => c.value === value)?.label || value;
};

export interface ServiceListing {
  id: string;
  provider_id: string;
  title: string;
  description: string | null;
  category: string;
  custom_category: string | null;
  price_range: string | null;
  city: string | null;
  state: string | null;
  whatsapp_number: string | null;
  show_phone: boolean;
  allow_chat: boolean;
  status: string;
  views_count: number;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
    profile_image: string | null;
    phone_number: string | null;
  };
}

export const useServiceListings = (filters?: {
  category?: string;
  city?: string;
  search?: string;
}) => {
  return useQuery({
    queryKey: ["serviceListings", filters],
    queryFn: async () => {
      let query = supabase
        .from("service_listings")
        .select(`
          *,
          profiles!service_listings_provider_id_fkey (
            first_name,
            last_name,
            profile_image,
            phone_number
          )
        `)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (filters?.category && filters.category !== "all") {
        query = query.eq("category", filters.category);
      }
      if (filters?.city) {
        query = query.ilike("city", `%${filters.city.split(",")[0].trim()}%`);
      }
      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ServiceListing[];
    },
  });
};

export const useServiceListing = (id: string) => {
  return useQuery({
    queryKey: ["serviceListing", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_listings")
        .select(`
          *,
          profiles!service_listings_provider_id_fkey (
            first_name,
            last_name,
            profile_image,
            phone_number
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;

      // Increment views
      await supabase
        .from("service_listings")
        .update({ views_count: (data.views_count || 0) + 1 })
        .eq("id", id);

      return data as ServiceListing;
    },
    enabled: !!id,
  });
};

export const useMyServices = () => {
  return useQuery({
    queryKey: ["myServices"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("service_listings")
        .select("*")
        .eq("provider_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ServiceListing[];
    },
  });
};

export const useCreateService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (service: {
      title: string;
      description?: string;
      category: string;
      custom_category?: string;
      price_range?: string;
      city?: string;
      state?: string;
      whatsapp_number?: string;
      show_phone: boolean;
      allow_chat: boolean;
      image_url?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("service_listings")
        .insert({
          ...service,
          provider_id: user.id,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["serviceListings"] });
      queryClient.invalidateQueries({ queryKey: ["myServices"] });
      toast.success("Serviço anunciado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar serviço: ${error.message}`);
    },
  });
};

export const useUpdateService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { error } = await supabase
        .from("service_listings")
        .update(updates as any)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["serviceListings"] });
      queryClient.invalidateQueries({ queryKey: ["myServices"] });
      toast.success("Serviço atualizado!");
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });
};

export const useDeleteService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("service_listings")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["serviceListings"] });
      queryClient.invalidateQueries({ queryKey: ["myServices"] });
      toast.success("Serviço excluído!");
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });
};

export const useServiceSubscription = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["serviceSubscription", user?.id],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return { subscribed: false };

      const { data, error } = await supabase.functions.invoke("check-service-subscription", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;
      return data as { subscribed: boolean; subscription_end?: string; subscription_id?: string };
    },
    enabled: !!user,
    refetchInterval: 60000,
  });
};

export const useSubscribeToServices = () => {
  return useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("create-service-subscription", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { url: string };
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

// Service messages
export const useServiceMessages = (serviceId: string, otherUserId: string) => {
  return useQuery({
    queryKey: ["serviceMessages", serviceId, otherUserId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("service_messages")
        .select("*")
        .eq("service_id", serviceId)
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!serviceId && !!otherUserId,
    refetchInterval: 5000,
  });
};

export const useSendServiceMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ serviceId, receiverId, content }: { serviceId: string; receiverId: string; content: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("service_messages").insert({
        service_id: serviceId,
        sender_id: user.id,
        receiver_id: receiverId,
        content,
      } as any);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["serviceMessages", variables.serviceId] });
    },
  });
};
