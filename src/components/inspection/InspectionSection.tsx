import { useBookingInspections } from "@/hooks/useVehicleInspections";
import InspectionForm from "./InspectionForm";
import InspectionView from "./InspectionView";
import { Card, CardContent } from "@/components/ui/card";
import { Shield } from "lucide-react";

interface InspectionSectionProps {
  bookingId: string;
  bookingStatus: string;
  isOwner: boolean;
  isCustomer: boolean;
  userId: string;
}

const InspectionSection = ({
  bookingId,
  bookingStatus,
  isOwner,
  isCustomer,
  userId,
}: InspectionSectionProps) => {
  const { data: inspections, isLoading } = useBookingInspections(bookingId);

  if (isLoading) return null;

  const pickupInspection = inspections?.find((i) => i.inspection_type === "pickup");
  const returnInspection = inspections?.find((i) => i.inspection_type === "return");

  // Pickup: customer creates, owner confirms
  // Return: owner creates, customer confirms
  const canCreatePickup = isCustomer && !pickupInspection && ["confirmed", "in_progress"].includes(bookingStatus);
  const canConfirmPickup = isOwner && pickupInspection?.status === "pending";

  const canCreateReturn = isOwner && !returnInspection && ["confirmed", "in_progress", "completed"].includes(bookingStatus);
  const canConfirmReturn = isCustomer && returnInspection?.status === "pending";

  // Only show if booking is in relevant status
  if (!["confirmed", "in_progress", "completed"].includes(bookingStatus)) return null;

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-3 sm:p-4 flex items-start gap-3">
          <Shield className="w-5 h-5 text-primary mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold text-sm sm:text-base">Inspeção do Veículo</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              As inspeções de entrega e devolução são obrigatórias para proteger ambas as partes.
              Registre o estado do veículo com fotos e observações.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Pickup Inspection */}
      {pickupInspection ? (
        <InspectionView
          inspection={pickupInspection}
          bookingId={bookingId}
          canConfirm={!!canConfirmPickup}
        />
      ) : canCreatePickup ? (
        <InspectionForm bookingId={bookingId} inspectionType="pickup" />
      ) : (
        ["confirmed", "in_progress"].includes(bookingStatus) && (
          <Card className="border-dashed">
            <CardContent className="p-3 sm:p-4 text-center text-muted-foreground text-sm">
              {isOwner
                ? "Aguardando o locatário registrar a inspeção de entrega."
                : "Registre a inspeção de entrega para confirmar o recebimento do veículo."}
            </CardContent>
          </Card>
        )
      )}

      {/* Return Inspection - only show after pickup is confirmed */}
      {pickupInspection?.status === "confirmed" && (
        <>
          {returnInspection ? (
            <InspectionView
              inspection={returnInspection}
              bookingId={bookingId}
              canConfirm={!!canConfirmReturn}
            />
          ) : canCreateReturn ? (
            <InspectionForm bookingId={bookingId} inspectionType="return" />
          ) : (
            ["confirmed", "in_progress", "completed"].includes(bookingStatus) && (
              <Card className="border-dashed">
                <CardContent className="p-3 sm:p-4 text-center text-muted-foreground text-sm">
                  {isCustomer
                    ? "Aguardando o proprietário registrar a inspeção de devolução."
                    : "Registre a inspeção de devolução para confirmar o estado do veículo."}
                </CardContent>
              </Card>
            )
          )}
        </>
      )}
    </div>
  );
};

export default InspectionSection;
