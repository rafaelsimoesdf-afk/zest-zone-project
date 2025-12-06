import { useRef } from "react";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Upload, Check, Camera, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SelfieData {
  selfie_image: File | null;
  selfie_preview: string;
}

interface StepSelfieProps {
  data: SelfieData;
  onChange: (data: SelfieData) => void;
  errors: Record<string, string>;
}

export const StepSelfie = ({ data, onChange, errors }: StepSelfieProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (file: File | null) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange({
          selfie_image: file,
          selfie_preview: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground">Selfie de Verificação</h2>
        <p className="text-muted-foreground mt-2">
          Tire uma selfie segurando seu documento
        </p>
      </div>

      <Card className={`max-w-md mx-auto ${errors.selfie_image ? 'border-destructive' : ''}`}>
        <CardContent className="p-6">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
          />
          
          {data.selfie_preview ? (
            <div className="relative">
              <img 
                src={data.selfie_preview} 
                alt="Selfie de verificação" 
                className="w-full h-64 object-cover rounded-lg"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => inputRef.current?.click()}
              >
                Tirar novamente
              </Button>
              <div className="absolute bottom-2 right-2 bg-green-500 text-white p-1 rounded-full">
                <Check className="h-4 w-4" />
              </div>
            </div>
          ) : (
            <div 
              className="border-2 border-dashed border-border rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => inputRef.current?.click()}
            >
              <div className="relative inline-block">
                <User className="h-16 w-16 text-muted-foreground mb-4" />
                <Camera className="h-6 w-6 text-primary absolute -bottom-1 -right-1 bg-background rounded-full p-1" />
              </div>
              <p className="text-muted-foreground mb-2">
                Clique para tirar uma selfie
              </p>
              <p className="text-xs text-muted-foreground">
                Segure seu documento próximo ao rosto
              </p>
            </div>
          )}
          {errors.selfie_image && (
            <p className="text-sm text-destructive flex items-center gap-1 mt-4">
              <AlertCircle className="h-4 w-4" />
              {errors.selfie_image}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="bg-muted/50 p-4 rounded-lg max-w-md mx-auto">
        <div className="flex items-start gap-2">
          <Camera className="h-5 w-5 text-primary mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Instruções:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Segure seu documento ao lado do rosto</li>
              <li>Certifique-se de que o documento está legível</li>
              <li>Seu rosto deve estar bem visível</li>
              <li>Use boa iluminação e evite sombras</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
