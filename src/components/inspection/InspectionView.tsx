import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Camera, CheckCircle, Clock, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { useConfirmInspection, VehicleInspection } from "@/hooks/useVehicleInspections";

interface InspectionViewProps {
  inspection: VehicleInspection;
  bookingId: string;
  canConfirm: boolean;
}

const statusConfig = {
  pending: { label: "Aguardando Confirmação", variant: "secondary" as const, icon: Clock },
  confirmed: { label: "Confirmada", variant: "default" as const, icon: CheckCircle },
  disputed: { label: "Disputada", variant: "destructive" as const, icon: AlertTriangle },
};

const InspectionView = ({ inspection, bookingId, canConfirm }: InspectionViewProps) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const confirmInspection = useConfirmInspection();

  const typeLabel = inspection.inspection_type === "pickup" ? "Entrega" : "Devolução";
  const config = statusConfig[inspection.status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = config.icon;
  const photos = inspection.photos || [];

  const handleConfirm = () => {
    confirmInspection.mutate({ inspectionId: inspection.id, bookingId });
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <>
      <Card className={inspection.status === "confirmed" ? "border-green-500/30 bg-green-500/5" : "border-amber-500/30 bg-amber-500/5"}>
        <CardHeader className="p-3 sm:p-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
              Inspeção de {typeLabel}
            </CardTitle>
            <Badge variant={config.variant} className="text-xs flex items-center gap-1">
              <StatusIcon className="w-3 h-3" />
              {config.label}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Registrada em {new Date(inspection.created_at).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0 space-y-3">
          {/* Photos */}
          {photos.length > 0 && (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
              {photos.map((photo, index) => (
                <button
                  key={photo.id}
                  onClick={() => openLightbox(index)}
                  className="aspect-square rounded-md overflow-hidden border hover:opacity-80 transition-opacity"
                >
                  <img
                    src={photo.photo_url}
                    alt={`Foto ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Notes */}
          {inspection.notes && (
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">Observações:</p>
              <p className="text-sm whitespace-pre-wrap">{inspection.notes}</p>
            </div>
          )}

          {/* Confirmation info */}
          {inspection.status === "confirmed" && inspection.confirmed_at && (
            <p className="text-xs text-green-600 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Confirmada em {new Date(inspection.confirmed_at).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}

          {/* Confirm button */}
          {canConfirm && inspection.status === "pending" && (
            <Button
              onClick={handleConfirm}
              disabled={confirmInspection.isPending}
              className="w-full"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {confirmInspection.isPending ? "Confirmando..." : `Confirmar Inspeção de ${typeLabel}`}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-3xl p-0 bg-black border-none">
          <div className="relative">
            {photos[lightboxIndex] && (
              <img
                src={photos[lightboxIndex].photo_url}
                alt={`Foto ${lightboxIndex + 1}`}
                className="w-full max-h-[80vh] object-contain"
              />
            )}
            <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => setLightboxIndex((i) => Math.max(0, i - 1))}
                disabled={lightboxIndex === 0}
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              <span className="text-white text-sm bg-black/50 px-3 py-1 rounded-full">
                {lightboxIndex + 1} / {photos.length}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => setLightboxIndex((i) => Math.min(photos.length - 1, i + 1))}
                disabled={lightboxIndex === photos.length - 1}
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InspectionView;
