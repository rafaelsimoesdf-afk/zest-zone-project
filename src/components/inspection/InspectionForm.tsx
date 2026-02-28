import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, X, ImagePlus, Loader2 } from "lucide-react";
import { useCreateInspection } from "@/hooks/useVehicleInspections";

interface InspectionFormProps {
  bookingId: string;
  inspectionType: "pickup" | "return";
  onSuccess?: () => void;
}

const MAX_PHOTOS = 10;

const InspectionForm = ({ bookingId, inspectionType, onSuccess }: InspectionFormProps) => {
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
  const [notes, setNotes] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const createInspection = useCreateInspection();

  const typeLabel = inspectionType === "pickup" ? "Entrega" : "Devolução";

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remaining = MAX_PHOTOS - photos.length;
    const newFiles = Array.from(files).slice(0, remaining);

    const newPhotos = newFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setPhotos((prev) => [...prev, ...newPhotos]);
    // Reset input
    e.target.value = "";
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async () => {
    if (photos.length === 0) return;

    await createInspection.mutateAsync({
      bookingId,
      inspectionType,
      notes,
      photoFiles: photos.map((p) => p.file),
    });

    // Cleanup previews
    photos.forEach((p) => URL.revokeObjectURL(p.preview));
    setPhotos([]);
    setNotes("");
    onSuccess?.();
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="p-3 sm:p-6">
        <CardTitle className="text-sm sm:text-base flex items-center gap-2">
          <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          Inspeção de {typeLabel} do Veículo
        </CardTitle>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          {inspectionType === "pickup"
            ? "Tire fotos do veículo para registrar o estado na entrega. Mínimo 1 foto, máximo 10."
            : "Tire fotos do veículo para registrar o estado na devolução. Mínimo 1 foto, máximo 10."}
        </p>
      </CardHeader>
      <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0 space-y-4">
        {/* Photo Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {photos.map((photo, index) => (
            <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
              <img
                src={photo.preview}
                alt={`Foto ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute top-1 right-1 bg-destructive text-white rounded-full w-5 h-5 flex items-center justify-center"
              >
                <X className="w-3 h-3" />
              </button>
              <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                {index + 1}/{photos.length}
              </span>
            </div>
          ))}

          {photos.length < MAX_PHOTOS && (
            <div className="aspect-square flex flex-col gap-1">
              {/* Camera button */}
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex-1 border-2 border-dashed border-primary/40 rounded-lg flex flex-col items-center justify-center gap-1 hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <Camera className="w-5 h-5 text-primary" />
                <span className="text-[10px] text-primary font-medium">Câmera</span>
              </button>
              {/* Gallery button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="h-8 border border-dashed border-muted-foreground/40 rounded-lg flex items-center justify-center gap-1 hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <ImagePlus className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">Galeria</span>
              </button>
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          {photos.length}/{MAX_PHOTOS} fotos selecionadas
        </p>

        {/* Hidden inputs */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileSelect}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Notes */}
        <div>
          <label className="text-xs sm:text-sm font-medium mb-1 block">
            Observações sobre o estado do veículo
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Descreva qualquer detalhe relevante: arranhões, amassados, nível de combustível, quilometragem, etc."
            className="min-h-[80px] text-sm"
            maxLength={2000}
          />
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={photos.length === 0 || createInspection.isPending}
          className="w-full"
        >
          {createInspection.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Enviando inspeção...
            </>
          ) : (
            <>
              <Camera className="w-4 h-4 mr-2" />
              Registrar Inspeção de {typeLabel}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default InspectionForm;
