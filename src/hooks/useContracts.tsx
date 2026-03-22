import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

interface ContractFunctionResponse {
  success: boolean;
  contractId: string;
  status?: string;
  contractStatus?: string;
  currentSignerUrl?: string | null;
  signers?: Array<{
    signer_id: string;
    signer_role: string;
    sign_order: number;
    signer_token: string | null;
    sign_url: string | null;
    status: string;
  }>;
  error?: string;
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

async function invokeAuthedFunction<TResponse>(
  functionName: string,
  body: Record<string, unknown>
): Promise<TResponse> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Faça login para continuar");
  }

  const { data, error } = await supabase.functions.invoke(functionName, {
    body,
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (error) {
    const errorBody = await error.context?.json?.().catch(() => null);
    throw new Error(errorBody?.error || error.message || "Erro ao processar contrato");
  }

  const typedData = data as TResponse & { success?: boolean; error?: string };
  if (!typedData?.success) {
    throw new Error(typedData?.error || "Erro ao processar contrato");
  }

  return typedData as TResponse;
}

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
      return invokeAuthedFunction<ContractFunctionResponse>("create-zapsign-document", {
        bookingId,
        inspectionId,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["rental-contract", variables.bookingId] });
      queryClient.invalidateQueries({ queryKey: ["contract-signatures"] });
      toast.success("Contrato criado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar contrato");
    },
  });
};

export const useSyncContractStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookingId,
      contractId,
    }: {
      bookingId: string;
      contractId?: string;
    }) => {
      return invokeAuthedFunction<ContractFunctionResponse>("sync-zapsign-contract", {
        bookingId,
        contractId,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["rental-contract", variables.bookingId] });
      if (variables.contractId) {
        queryClient.invalidateQueries({ queryKey: ["contract-signatures", variables.contractId] });
      }
    },
  });
};
