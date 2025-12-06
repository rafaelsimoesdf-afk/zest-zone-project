import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CNHDetails {
  id: string;
  user_id: string;
  cnh_number: string;
  category: string;
  issue_date: string;
  expiry_date: string;
  front_image_url: string;
  back_image_url: string;
  digital_image_url: string | null;
  is_valid: boolean;
  verified: boolean;
}

export interface IdentityDocument {
  id: string;
  user_id: string;
  document_type: 'rg' | 'cnh';
  front_image_url: string;
  back_image_url: string;
  verified: boolean;
}

export interface SelfieVerification {
  id: string;
  user_id: string;
  selfie_url: string;
  verified: boolean;
}

export interface ProofOfResidence {
  id: string;
  user_id: string;
  document_type: string;
  document_url: string;
  issue_date: string | null;
  verified: boolean;
}

// Fetch CNH details
export const useCNHDetails = () => {
  return useQuery({
    queryKey: ["cnh-details"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("cnh_details")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as CNHDetails | null;
    },
  });
};

// Save CNH details
interface SaveCNHDetailsInput {
  cnh_number: string;
  category: string;
  issue_date: string;
  expiry_date: string;
  front_image_url: string;
  back_image_url: string;
  digital_image_url?: string | null;
}

export const useSaveCNHDetails = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (details: SaveCNHDetailsInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: existing } = await supabase
        .from("cnh_details")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      const cnhPayload = {
        cnh_number: details.cnh_number,
        category: details.category as any,
        issue_date: details.issue_date,
        expiry_date: details.expiry_date,
        front_image_url: details.front_image_url,
        back_image_url: details.back_image_url,
        digital_image_url: details.digital_image_url || null,
        is_valid: true,
      } as any;

      if (existing) {
        const { data, error } = await supabase
          .from("cnh_details")
          .update(cnhPayload)
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("cnh_details")
          .insert([{ ...cnhPayload, user_id: user.id }])
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cnh-details"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao salvar CNH");
    },
  });
};

// Fetch identity documents
export const useIdentityDocument = () => {
  return useQuery({
    queryKey: ["identity-document"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("identity_documents")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as IdentityDocument | null;
    },
  });
};

// Save identity document
export const useSaveIdentityDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (details: Omit<IdentityDocument, 'id' | 'user_id' | 'verified'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: existing } = await supabase
        .from("identity_documents")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from("identity_documents")
          .update(details)
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("identity_documents")
          .insert({ ...details, user_id: user.id })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["identity-document"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao salvar documento");
    },
  });
};

// Fetch selfie verification
export const useSelfieVerification = () => {
  return useQuery({
    queryKey: ["selfie-verification"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("selfie_verifications")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as SelfieVerification | null;
    },
  });
};

// Save selfie verification
export const useSaveSelfieVerification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (selfie_url: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: existing } = await supabase
        .from("selfie_verifications")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from("selfie_verifications")
          .update({ selfie_url })
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("selfie_verifications")
          .insert({ selfie_url, user_id: user.id })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["selfie-verification"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao salvar selfie");
    },
  });
};

// Fetch proof of residence
export const useProofOfResidence = () => {
  return useQuery({
    queryKey: ["proof-of-residence"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("proof_of_residence")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as ProofOfResidence | null;
    },
  });
};

// Save proof of residence
export const useSaveProofOfResidence = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (details: { document_type: string; document_url: string; issue_date?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: existing } = await supabase
        .from("proof_of_residence")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      const payload = {
        document_type: details.document_type as any,
        document_url: details.document_url,
        issue_date: details.issue_date,
      };

      if (existing) {
        const { data, error } = await supabase
          .from("proof_of_residence")
          .update(payload)
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("proof_of_residence")
          .insert([{ ...payload, user_id: user.id }])
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proof-of-residence"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao salvar comprovante");
    },
  });
};

// Submit verification
export const useSubmitVerification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("profiles")
        .update({
          verification_status: 'pending',
          verification_submitted_at: new Date().toISOString(),
          terms_accepted: true,
          lgpd_accepted: true,
          data_accuracy_declared: true,
        })
        .eq("id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Cadastro enviado para análise!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao enviar cadastro");
    },
  });
};

// Upload document file
export const uploadDocument = async (file: File, folder: string): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}/${folder}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('user-documents')
    .upload(fileName, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('user-documents')
    .getPublicUrl(fileName);

  return publicUrl;
};
