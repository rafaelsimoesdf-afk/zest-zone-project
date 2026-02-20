import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StripeConnectStatus {
  has_account: boolean;
  onboarding_complete: boolean;
  stripe_status: {
    charges_enabled: boolean;
    payouts_enabled: boolean;
    details_submitted: boolean;
  } | null;
}

export const useStripeConnectStatus = () => {
  return useQuery({
    queryKey: ["stripeConnectStatus"],
    queryFn: async (): Promise<StripeConnectStatus> => {
      const { data, error } = await supabase.functions.invoke("stripe-connect-onboarding", {
        body: { action: "status" },
      });
      if (error) throw error;
      return data as StripeConnectStatus;
    },
  });
};

export const useStartStripeOnboarding = () => {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("stripe-connect-onboarding", {
        body: { action: "create_or_link" },
      });
      if (error) throw error;
      return data as { url: string };
    },
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, "_blank");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao iniciar onboarding Stripe");
    },
  });
};

export const useProcessWithdrawalTransfer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (withdrawalId: string) => {
      const { data, error } = await supabase.functions.invoke("process-withdrawal-transfer", {
        body: { withdrawalId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.success && data.manual_transfer_required) {
        toast.warning("Saque aprovado. Transferência Stripe indisponível — realizar PIX manual.");
      } else if (data.success) {
        toast.success("Transferência Stripe realizada com sucesso!");
      } else if (data.error) {
        toast.error(data.error);
      }
      // Force refetch all withdrawal-related queries
      queryClient.invalidateQueries({ queryKey: ["allWithdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["ownerBalance"] });
      queryClient.invalidateQueries({ queryKey: ["ownerWithdrawals"] });
    },
    onError: (error: any) => {
      const msg = error?.message || error?.context?.body?.message || "Erro ao processar transferência";
      toast.error(msg);
      // Still invalidate in case partial update happened
      queryClient.invalidateQueries({ queryKey: ["allWithdrawals"] });
    },
  });
};
