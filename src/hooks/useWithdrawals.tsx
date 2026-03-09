import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { sendWithdrawalRequestedEmail, sendWithdrawalCompletedEmail, getUserEmailData } from "@/hooks/useEmailNotifications";

export interface OwnerBalance {
  total_earnings: number;
  platform_fees: number;
  total_withdrawn: number;
  pending_withdrawals: number;
  available_balance: number;
}

export interface Withdrawal {
  id: string;
  owner_id: string;
  amount: number;
  platform_fee: number;
  net_amount: number;
  pix_key: string;
  status: string;
  auto_approved: boolean;
  requested_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  completed_at: string | null;
  rejection_reason: string | null;
  admin_notes: string | null;
  transfer_proof_url: string | null;
  created_at: string;
  updated_at: string;
  owner?: {
    first_name: string;
    last_name: string;
    email: string;
    cpf: string | null;
  };
}

export interface WithdrawalConfig {
  id: string;
  auto_approval_limit: number;
  minimum_withdrawal: number;
  platform_fee_percentage: number;
}

export interface WithdrawalSettings {
  id: string;
  owner_id: string;
  auto_withdraw_enabled: boolean;
  frequency: string;
  minimum_amount: number;
}

// Owner hooks
export const useOwnerBalance = () => {
  return useQuery({
    queryKey: ["ownerBalance"],
    queryFn: async (): Promise<OwnerBalance> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase.rpc("get_owner_balance", {
        _owner_id: user.id,
      });

      if (error) throw error;
      if (!data || data.length === 0) {
        return { total_earnings: 0, platform_fees: 0, total_withdrawn: 0, pending_withdrawals: 0, available_balance: 0 };
      }
      return data[0] as OwnerBalance;
    },
  });
};

export const useWithdrawalConfig = () => {
  return useQuery({
    queryKey: ["withdrawalConfig"],
    queryFn: async (): Promise<WithdrawalConfig> => {
      const { data, error } = await supabase
        .from("withdrawal_config")
        .select("*")
        .limit(1)
        .single();

      if (error) throw error;
      return data as WithdrawalConfig;
    },
  });
};

export const useOwnerWithdrawals = () => {
  return useQuery({
    queryKey: ["ownerWithdrawals"],
    queryFn: async (): Promise<Withdrawal[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("withdrawals")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Withdrawal[];
    },
  });
};

export const useWithdrawalSettings = () => {
  return useQuery({
    queryKey: ["withdrawalSettings"],
    queryFn: async (): Promise<WithdrawalSettings | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("withdrawal_settings")
        .select("*")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as WithdrawalSettings | null;
    },
  });
};

export const useRequestWithdrawal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (amount: number) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get user CPF for PIX key
      const { data: profile } = await supabase
        .from("profiles")
        .select("cpf, first_name, last_name")
        .eq("id", user.id)
        .single();

      if (!profile?.cpf) {
        throw new Error("Você precisa ter o CPF cadastrado para solicitar saques");
      }

      // Get withdrawal config for auto-approval
      const { data: config } = await supabase
        .from("withdrawal_config")
        .select("*")
        .limit(1)
        .single();

      if (!config) throw new Error("Configuração de saque não encontrada");

      if (amount < config.minimum_withdrawal) {
        throw new Error(`Valor mínimo para saque: R$ ${config.minimum_withdrawal.toFixed(2)}`);
      }

      // Check available balance
      const { data: balanceData } = await supabase.rpc("get_owner_balance", {
        _owner_id: user.id,
      });

      if (!balanceData || balanceData.length === 0 || balanceData[0].available_balance < amount) {
        throw new Error("Saldo insuficiente para este saque");
      }

      const withdrawalFee = amount * (config.platform_fee_percentage / 100);
      const netAmount = amount - withdrawalFee;
      const autoApproved = amount <= config.auto_approval_limit;

      const { data, error } = await supabase
        .from("withdrawals")
        .insert({
          owner_id: user.id,
          amount,
          platform_fee: withdrawalFee,
          net_amount: netAmount,
          pix_key: profile.cpf,
          status: autoApproved ? "approved" : "pending",
          auto_approved: autoApproved,
        })
        .select()
        .single();

      if (error) throw error;

      // Notify admins about new withdrawal request if not auto-approved
      if (!autoApproved) {
        // We don't need to notify individual admins - they'll see it in the panel
      }

      return { data, autoApproved };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["ownerBalance"] });
      queryClient.invalidateQueries({ queryKey: ["ownerWithdrawals"] });
      if (result.autoApproved) {
        toast.success("Saque aprovado automaticamente! Aguarde o processamento.");
      } else {
        toast.success("Solicitação de saque enviada! Aguarde aprovação.");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao solicitar saque");
    },
  });
};

export const useSaveWithdrawalSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: { auto_withdraw_enabled: boolean; frequency: string; minimum_amount: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: existing } = await supabase
        .from("withdrawal_settings")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("withdrawal_settings")
          .update({
            auto_withdraw_enabled: settings.auto_withdraw_enabled,
            frequency: settings.frequency as "weekly" | "biweekly" | "monthly",
            minimum_amount: settings.minimum_amount,
          })
          .eq("owner_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("withdrawal_settings")
          .insert({
            owner_id: user.id,
            auto_withdraw_enabled: settings.auto_withdraw_enabled,
            frequency: settings.frequency as "weekly" | "biweekly" | "monthly",
            minimum_amount: settings.minimum_amount,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["withdrawalSettings"] });
      toast.success("Configurações salvas!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao salvar configurações");
    },
  });
};

// Admin hooks
export const useAllWithdrawals = (statusFilter?: string) => {
  return useQuery({
    queryKey: ["allWithdrawals", statusFilter],
    queryFn: async (): Promise<Withdrawal[]> => {
      let query = supabase
        .from("withdrawals")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter && statusFilter !== "all") {
        query = query.eq("status", statusFilter as "pending" | "approved" | "processing" | "completed" | "rejected");
      }

      const { data, error } = await query;
      if (error) throw error;

      // Enrich with owner profile data
      const ownerIds = [...new Set((data || []).map(w => w.owner_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email, cpf")
        .in("id", ownerIds);

      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      return (data || []).map(w => ({
        ...w,
        owner: profileMap.get(w.owner_id) ? {
          first_name: profileMap.get(w.owner_id)!.first_name,
          last_name: profileMap.get(w.owner_id)!.last_name,
          email: profileMap.get(w.owner_id)!.email,
          cpf: profileMap.get(w.owner_id)!.cpf,
        } : undefined,
      })) as Withdrawal[];
    },
  });
};

export const useUpdateWithdrawalStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ withdrawalId, status, rejectionReason, adminNotes }: {
      withdrawalId: string;
      status: string;
      rejectionReason?: string;
      adminNotes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const updateData: Record<string, unknown> = {
        status: status as "pending" | "approved" | "processing" | "completed" | "rejected",
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      };

      if (rejectionReason) updateData.rejection_reason = rejectionReason;
      if (adminNotes) updateData.admin_notes = adminNotes;
      if (status === "completed") updateData.completed_at = new Date().toISOString();

      const { data, error } = await supabase
        .from("withdrawals")
        .update(updateData)
        .eq("id", withdrawalId)
        .select()
        .single();

      if (error) throw error;

      // Notify the owner
      if (data) {
        let title = "";
        let message = "";

        switch (status) {
          case "approved":
            title = "Saque aprovado!";
            message = `Seu saque de R$ ${Number(data.net_amount).toFixed(2)} foi aprovado e será processado em breve.`;
            break;
          case "completed":
            title = "Saque concluído!";
            message = `Seu saque de R$ ${Number(data.net_amount).toFixed(2)} foi transferido via PIX para o CPF cadastrado.`;
            break;
          case "rejected":
            title = "Saque rejeitado";
            message = rejectionReason 
              ? `Seu saque foi rejeitado. Motivo: ${rejectionReason}`
              : "Seu saque foi rejeitado. Entre em contato com o suporte.";
            break;
        }

        if (title) {
          await supabase.from("notifications").insert({
            user_id: data.owner_id,
            notification_type: "payment",
            title,
            message,
            action_url: "/owner-withdrawals",
          });
        }
      }

      return data;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["allWithdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["ownerBalance"] });
      queryClient.invalidateQueries({ queryKey: ["ownerWithdrawals"] });

      const messages: Record<string, string> = {
        approved: "Saque aprovado!",
        processing: "Saque em processamento!",
        completed: "Saque concluído!",
        rejected: "Saque rejeitado.",
      };
      toast.success(messages[status] || "Status atualizado!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar saque");
    },
  });
};
