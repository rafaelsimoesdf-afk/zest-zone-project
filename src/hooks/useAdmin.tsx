import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { sendVerificationEmail, sendVehicleStatusEmail } from "@/hooks/useEmailNotifications";

export const useAdminStats = () => {
  return useQuery({
    queryKey: ["adminStats"],
    queryFn: async () => {
      const [
        { count: totalVehicles },
        { count: pendingVehicles },
        { count: totalUsers },
        { count: pendingVerifications },
        { count: totalBookings },
        { count: activeBookings },
      ] = await Promise.all([
        supabase.from("vehicles").select("*", { count: "exact", head: true }),
        supabase.from("vehicles").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("verification_status", "pending"),
        supabase.from("bookings").select("*", { count: "exact", head: true }),
        supabase.from("bookings").select("*", { count: "exact", head: true }).in("status", ["pending", "confirmed", "in_progress"]),
      ]);

      return {
        totalVehicles: totalVehicles || 0,
        pendingVehicles: pendingVehicles || 0,
        totalUsers: totalUsers || 0,
        pendingVerifications: pendingVerifications || 0,
        totalBookings: totalBookings || 0,
        activeBookings: activeBookings || 0,
      };
    },
  });
};

export const usePendingVehicles = () => {
  return useQuery({
    queryKey: ["pendingVehicles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select(`
          *,
          profiles!vehicles_owner_id_fkey (
            first_name,
            last_name,
            email
          ),
          vehicle_images (
            image_url,
            is_primary
          )
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

export const useAllVehicles = () => {
  return useQuery({
    queryKey: ["allVehicles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select(`
          *,
          profiles!vehicles_owner_id_fkey (
            first_name,
            last_name,
            email
          ),
          vehicle_images (
            image_url,
            is_primary
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

export const useAllUsers = () => {
  return useQuery({
    queryKey: ["allUsers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

export const usePendingUserVerifications = () => {
  return useQuery({
    queryKey: ["pendingUserVerifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("verification_status", "pending")
        .order("verification_submitted_at", { ascending: true });

      if (error) throw error;
      return data;
    },
  });
};

export const useUserVerificationDetails = (userId: string | null) => {
  return useQuery({
    queryKey: ["userVerificationDetails", userId],
    queryFn: async () => {
      if (!userId) return null;

      const [
        { data: profile },
        { data: address },
        { data: cnh },
        { data: identityDoc },
        { data: selfie },
        { data: proofOfResidence },
      ] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).single(),
        supabase.from("addresses").select("*").eq("user_id", userId).eq("is_default", true).maybeSingle(),
        supabase.from("cnh_details").select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("identity_documents").select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("selfie_verifications").select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("proof_of_residence").select("*").eq("user_id", userId).maybeSingle(),
      ]);

      return {
        profile,
        address,
        cnh,
        identityDoc,
        selfie,
        proofOfResidence,
      };
    },
    enabled: !!userId,
  });
};

export const useAllBookings = () => {
  return useQuery({
    queryKey: ["allBookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          vehicles (
            brand,
            model,
            license_plate
          ),
          profiles!bookings_customer_id_fkey (
            first_name,
            last_name,
            email
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

export const useUpdateVehicleStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ vehicleId, status }: { vehicleId: string; status: string }) => {
      // Fetch vehicle + owner info before updating
      const { data: vehicleInfo } = await supabase
        .from("vehicles")
        .select(`*, profiles!vehicles_owner_id_fkey (first_name, last_name, email)`)
        .eq("id", vehicleId)
        .single();

      const { data, error } = await supabase
        .from("vehicles")
        .update({ status: status as any })
        .eq("id", vehicleId)
        .select()
        .single();

      if (error) throw error;

      // Send email to vehicle owner
      if (vehicleInfo?.profiles) {
        const owner = vehicleInfo.profiles as any;
        sendVehicleStatusEmail({
          ownerEmail: owner.email,
          ownerName: `${owner.first_name} ${owner.last_name}`,
          vehicleName: `${vehicleInfo.brand} ${vehicleInfo.model} ${vehicleInfo.year}`,
          licensePlate: vehicleInfo.license_plate,
          dailyPrice: vehicleInfo.daily_price,
          approved: status === "approved",
        });
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["pendingVehicles"] });
      queryClient.invalidateQueries({ queryKey: ["allVehicles"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
      
      const statusText = variables.status === "approved" ? "aprovado" : "rejeitado";
      toast.success(`Veículo ${statusText} com sucesso!`);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar status do veículo");
    },
  });
};

export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      const { data, error } = await supabase
        .from("profiles")
        .update({ status: status as any })
        .eq("id", userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      toast.success("Status do usuário atualizado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar status do usuário");
    },
  });
};

export const useUpdateUserVerificationStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, verificationStatus }: { userId: string; verificationStatus: 'approved' | 'rejected' | 'pending' }) => {
      const updateData: any = {
        verification_status: verificationStatus,
      };

      if (verificationStatus === 'approved') {
        updateData.verification_validated_at = new Date().toISOString();
        updateData.status = 'verified';
      }

      // Fetch user info before updating for email
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("email, first_name, last_name")
        .eq("id", userId)
        .single();

      const { data, error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", userId)
        .select()
        .single();

      if (error) throw error;

      // Send verification email
      if (userProfile) {
        sendVerificationEmail({
          userEmail: userProfile.email,
          userName: `${userProfile.first_name} ${userProfile.last_name}`,
          approved: verificationStatus === "approved",
        });
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["pendingUserVerifications"] });
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
      queryClient.invalidateQueries({ queryKey: ["userVerificationDetails"] });
      
      const statusText = variables.verificationStatus === "approved" ? "aprovado" : "rejeitado";
      toast.success(`Cadastro ${statusText} com sucesso!`);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar status de verificação");
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      // Delete related data first to avoid foreign key constraints
      await Promise.all([
        supabase.from("addresses").delete().eq("user_id", userId),
        supabase.from("cnh_details").delete().eq("user_id", userId),
        supabase.from("identity_documents").delete().eq("user_id", userId),
        supabase.from("selfie_verifications").delete().eq("user_id", userId),
        supabase.from("proof_of_residence").delete().eq("user_id", userId),
        supabase.from("user_roles").delete().eq("user_id", userId),
        supabase.from("bank_accounts").delete().eq("user_id", userId),
        supabase.from("notifications").delete().eq("user_id", userId),
      ]);

      // Delete profile
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
      queryClient.invalidateQueries({ queryKey: ["pendingUserVerifications"] });
      toast.success("Usuário excluído com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao excluir usuário");
    },
  });
};

export const useUpdateBookingStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: string }) => {
      const { data, error } = await supabase
        .from("bookings")
        .update({ status: status as any })
        .eq("id", bookingId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["allBookings"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
      queryClient.invalidateQueries({ queryKey: ["myBookings"] });
      queryClient.invalidateQueries({ queryKey: ["ownerBookings"] });
      
      const statusLabels: Record<string, string> = {
        pending: "Pendente",
        confirmed: "Confirmada",
        in_progress: "Em Andamento",
        completed: "Concluída",
        cancelled: "Cancelada",
        disputed: "Em Disputa",
      };
      
      toast.success(`Reserva atualizada para: ${statusLabels[variables.status] || variables.status}`);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar status da reserva");
    },
  });
};

export const useDeleteBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingId: string) => {
      // Delete related payments first
      await supabase.from("payments").delete().eq("booking_id", bookingId);
      await supabase.from("reviews").delete().eq("booking_id", bookingId);

      const { error } = await supabase
        .from("bookings")
        .delete()
        .eq("id", bookingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allBookings"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
      queryClient.invalidateQueries({ queryKey: ["myBookings"] });
      queryClient.invalidateQueries({ queryKey: ["ownerBookings"] });
      toast.success("Reserva excluída com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao excluir reserva");
    },
  });
};
