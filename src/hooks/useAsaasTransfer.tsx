import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useAsaasTransfer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (withdrawalId: string) => {
      const { data, error } = await supabase.functions.invoke("asaas-create-transfer", {
        body: { withdrawalId },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allWithdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["ownerWithdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["ownerBalance"] });
      toast.success("Transferência PIX enviada via Asaas!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao processar transferência");
    },
  });
};
