import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface SavedCard {
  id: string;
  credit_card_token: string;
  credit_card_brand: string | null;
  credit_card_last_digits: string | null;
  holder_name: string | null;
  is_default: boolean;
  created_at: string;
}

export function useSavedCards() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["saved-cards", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<SavedCard[]> => {
      const { data, error } = await supabase
        .from("asaas_saved_cards")
        .select("id, credit_card_token, credit_card_brand, credit_card_last_digits, holder_name, is_default, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as SavedCard[];
    },
  });
}

export function useDeleteSavedCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("asaas_saved_cards").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["saved-cards"] });
      toast.success("Cartão removido");
    },
    onError: (e: any) => toast.error(e.message || "Erro ao remover cartão"),
  });
}
