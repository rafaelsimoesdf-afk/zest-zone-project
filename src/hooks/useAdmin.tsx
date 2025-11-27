import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useAdminStats = () => {
  return useQuery({
    queryKey: ["adminStats"],
    queryFn: async () => {
      const [
        { count: totalVehicles },
        { count: pendingVehicles },
        { count: totalUsers },
        { count: totalBookings },
        { count: activeBookings },
      ] = await Promise.all([
        supabase.from("vehicles").select("*", { count: "exact", head: true }),
        supabase.from("vehicles").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("bookings").select("*", { count: "exact", head: true }),
        supabase.from("bookings").select("*", { count: "exact", head: true }).in("status", ["pending", "confirmed", "in_progress"]),
      ]);

      return {
        totalVehicles: totalVehicles || 0,
        pendingVehicles: pendingVehicles || 0,
        totalUsers: totalUsers || 0,
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
      const { data, error } = await supabase
        .from("vehicles")
        .update({ status: status as any })
        .eq("id", vehicleId)
        .select()
        .single();

      if (error) throw error;
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
