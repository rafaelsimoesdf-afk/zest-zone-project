import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { sendBookingStatusEmail, getUserEmailData } from "@/hooks/useEmailNotifications";

export interface VehicleInspection {
  id: string;
  booking_id: string;
  inspection_type: "pickup" | "return";
  inspector_id: string;
  notes: string | null;
  status: "pending" | "confirmed" | "disputed";
  confirmed_by: string | null;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
  photos?: InspectionPhoto[];
}

export interface InspectionPhoto {
  id: string;
  inspection_id: string;
  photo_url: string;
  caption: string | null;
  display_order: number;
  created_at: string;
}

export const useBookingInspections = (bookingId: string) => {
  return useQuery({
    queryKey: ["vehicle-inspections", bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicle_inspections")
        .select("*, vehicle_inspection_photos(*)")
        .eq("booking_id", bookingId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      return (data || []).map((inspection: any) => ({
        ...inspection,
        photos: inspection.vehicle_inspection_photos || [],
      })) as VehicleInspection[];
    },
    enabled: !!bookingId,
  });
};

export const useCreateInspection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookingId,
      inspectionType,
      notes,
      photoFiles,
    }: {
      bookingId: string;
      inspectionType: "pickup" | "return";
      notes: string;
      photoFiles: File[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      if (photoFiles.length === 0) {
        throw new Error("É necessário tirar pelo menos 1 foto do veículo");
      }

      // Create inspection record
      const { data: inspection, error: inspError } = await supabase
        .from("vehicle_inspections")
        .insert({
          booking_id: bookingId,
          inspection_type: inspectionType,
          inspector_id: user.id,
          notes: notes || null,
          status: "pending",
        })
        .select()
        .single();

      if (inspError) throw inspError;

      // Upload photos and create records
      for (let i = 0; i < photoFiles.length; i++) {
        const file = photoFiles[i];
        const filePath = `${bookingId}/${inspection.id}/${Date.now()}_${i}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from("inspection-photos")
          .upload(filePath, file, { contentType: file.type });

        if (uploadError) {
          console.error("Error uploading photo:", uploadError);
          continue;
        }

        const { data: signedData } = await supabase.storage
          .from("inspection-photos")
          .createSignedUrl(filePath, 60 * 60 * 24 * 365 * 10); // 10 years

        const photoUrl = signedData?.signedUrl || filePath;

        await supabase.from("vehicle_inspection_photos").insert({
          inspection_id: inspection.id,
          photo_url: photoUrl,
          display_order: i,
        });
      }

      // Create notification for the other party
      const { data: booking } = await supabase
        .from("bookings")
        .select("customer_id, owner_id, vehicles(brand, model)")
        .eq("id", bookingId)
        .single();

      if (booking) {
        const notifyUserId = inspectionType === "pickup" 
          ? booking.owner_id 
          : booking.customer_id;
        const vehicleName = (booking.vehicles as any)
          ? `${(booking.vehicles as any).brand} ${(booking.vehicles as any).model}`
          : "veículo";
        const typeLabel = inspectionType === "pickup" ? "entrega" : "devolução";

        await supabase.from("notifications").insert({
          user_id: notifyUserId,
          notification_type: "booking",
          title: `Inspeção de ${typeLabel} registrada`,
          message: `Uma inspeção de ${typeLabel} do ${vehicleName} foi registrada. Confirme as condições do veículo.`,
          action_url: `/booking/${bookingId}`,
        });
      }

      return inspection;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-inspections", variables.bookingId] });
      const label = variables.inspectionType === "pickup" ? "entrega" : "devolução";
      toast.success(`Inspeção de ${label} registrada com sucesso!`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao registrar inspeção");
    },
  });
};

export const useConfirmInspection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      inspectionId,
      bookingId,
    }: {
      inspectionId: string;
      bookingId: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { error } = await supabase
        .from("vehicle_inspections")
        .update({
          status: "confirmed",
          confirmed_by: user.id,
          confirmed_at: new Date().toISOString(),
        })
        .eq("id", inspectionId);

      if (error) throw error;

      // Notify the inspector
      const { data: inspection } = await supabase
        .from("vehicle_inspections")
        .select("inspector_id, inspection_type, booking_id")
        .eq("id", inspectionId)
        .single();

      if (inspection) {
        const typeLabel = inspection.inspection_type === "pickup" ? "entrega" : "devolução";
        await supabase.from("notifications").insert({
          user_id: inspection.inspector_id,
          notification_type: "booking",
          title: `Inspeção de ${typeLabel} confirmada!`,
          message: `A inspeção de ${typeLabel} foi confirmada pela outra parte.`,
          action_url: `/booking/${bookingId}`,
        });

        // Auto-complete booking when return inspection is confirmed
        if (inspection.inspection_type === "return") {
          // Verify pickup is also confirmed
          const { data: allInspections } = await supabase
            .from("vehicle_inspections")
            .select("inspection_type, status")
            .eq("booking_id", bookingId);

          const pickupConfirmed = allInspections?.some(
            (i) => i.inspection_type === "pickup" && i.status === "confirmed"
          );

          if (pickupConfirmed) {
            await supabase
              .from("bookings")
              .update({ status: "completed" })
              .eq("id", bookingId);
          }
        }
      }

      return { inspectionId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-inspections", variables.bookingId] });
      queryClient.invalidateQueries({ queryKey: ["booking", variables.bookingId] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Inspeção confirmada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao confirmar inspeção");
    },
  });
};
