import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface RentalContract {
  id: string;
  booking_id: string;
  inspection_id: string | null;
  zapsign_doc_id: string | null;
  zapsign_doc_token: string | null;
  status: string;
  signed_pdf_url: string | null;
  audit_trail_url: string | null;
  document_hash: string | null;
  contract_data: any;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface ContractSignature {
  id: string;
  contract_id: string;
  signer_id: string;
  signer_role: string;
  sign_order: number;
  zapsign_signer_token: string | null;
  zapsign_sign_url: string | null;
  status: string;
  signed_at: string | null;
  ip_address: string | null;
  created_at: string;
}

export const useBookingContract = (bookingId: string) => {
  return useQuery({
    queryKey: ["rental-contract", bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rental_contracts")
        .select("*")
        .eq("booking_id", bookingId)
        .maybeSingle();

      if (error) throw error;
      return data as RentalContract | null;
    },
    enabled: !!bookingId,
  });
};

export const useContractSignatures = (contractId: string) => {
  return useQuery({
    queryKey: ["contract-signatures", contractId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contract_signatures")
        .select("*")
        .eq("contract_id", contractId)
        .order("sign_order");

      if (error) throw error;
      return data as ContractSignature[];
    },
    enabled: !!contractId,
  });
};

export const useCreateContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookingId,
      inspectionId,
    }: {
      bookingId: string;
      inspectionId?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke(
        "create-zapsign-document",
        {
          body: { bookingId, inspectionId },
        }
      );

      if (error) throw new Error(error.message || "Erro ao criar contrato");
      if (!data?.success) throw new Error(data?.error || "Erro ao criar contrato");
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["rental-contract", variables.bookingId],
      });
      queryClient.invalidateQueries({
        queryKey: ["contract-signatures"],
      });
      toast.success("Contrato criado com sucesso! Pronto para assinatura.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar contrato");
    },
  });
};
