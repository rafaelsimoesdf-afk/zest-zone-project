import { useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Upload, Check, FileImage } from "lucide-react";
import { Button } from "@/components/ui/button";

interface IdentityData {
  document_type: 'rg' | 'cnh';
  front_image: File | null;
  back_image: File | null;
  front_preview: string;
  back_preview: string;
}

interface StepIdentityDocumentsProps {
  data: IdentityData;
  onChange: (data: IdentityData) => void;
  errors: Record<string, string>;
}

export const StepIdentityDocuments = ({ data, onChange, errors }: StepIdentityDocumentsProps) => {
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (type: 'front' | 'back', file: File | null) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'front') {
          onChange({
            ...data,
            front_image: file,
            front_preview: reader.result as string,
          });
        } else {
          onChange({
            ...data,
            back_image: file,
            back_preview: reader.result as string,
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground">Documento de Identidade</h2>
        <p className="text-muted-foreground mt-2">
          Envie frente e verso do seu documento
        </p>
      </div>

      <div className="space-y-4">
        <Label>Tipo de Documento *</Label>
        <RadioGroup
          value={data.document_type}
          onValueChange={(value: 'rg' | 'cnh') => onChange({ ...data, document_type: value })}
          className="grid grid-cols-2 gap-4"
        >
          <Label
            htmlFor="rg"
            className={`flex items-center justify-center p-4 border rounded-lg cursor-pointer transition-colors ${
              data.document_type === 'rg' 
                ? 'border-primary bg-primary/10' 
                : 'border-border hover:border-primary/50'
            }`}
          >
            <RadioGroupItem value="rg" id="rg" className="sr-only" />
            <span className="font-medium">RG</span>
          </Label>
          <Label
            htmlFor="cnh-doc"
            className={`flex items-center justify-center p-4 border rounded-lg cursor-pointer transition-colors ${
              data.document_type === 'cnh' 
                ? 'border-primary bg-primary/10' 
                : 'border-border hover:border-primary/50'
            }`}
          >
            <RadioGroupItem value="cnh" id="cnh-doc" className="sr-only" />
            <span className="font-medium">CNH</span>
          </Label>
        </RadioGroup>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Front */}
        <Card className={`${errors.front_image ? 'border-destructive' : ''}`}>
          <CardContent className="p-4">
            <Label className="mb-2 block">Frente do Documento *</Label>
            <input
              ref={frontInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileChange('front', e.target.files?.[0] || null)}
            />
            
            {data.front_preview ? (
              <div className="relative">
                <img 
                  src={data.front_preview} 
                  alt="Frente do documento" 
                  className="w-full h-40 object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => frontInputRef.current?.click()}
                >
                  Alterar
                </Button>
                <div className="absolute bottom-2 right-2 bg-green-500 text-white p-1 rounded-full">
                  <Check className="h-4 w-4" />
                </div>
              </div>
            ) : (
              <div 
                className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => frontInputRef.current?.click()}
              >
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Clique para enviar a frente
                </p>
              </div>
            )}
            {errors.front_image && (
              <p className="text-sm text-destructive flex items-center gap-1 mt-2">
                <AlertCircle className="h-4 w-4" />
                {errors.front_image}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Back */}
        <Card className={`${errors.back_image ? 'border-destructive' : ''}`}>
          <CardContent className="p-4">
            <Label className="mb-2 block">Verso do Documento *</Label>
            <input
              ref={backInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileChange('back', e.target.files?.[0] || null)}
            />
            
            {data.back_preview ? (
              <div className="relative">
                <img 
                  src={data.back_preview} 
                  alt="Verso do documento" 
                  className="w-full h-40 object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => backInputRef.current?.click()}
                >
                  Alterar
                </Button>
                <div className="absolute bottom-2 right-2 bg-green-500 text-white p-1 rounded-full">
                  <Check className="h-4 w-4" />
                </div>
              </div>
            ) : (
              <div 
                className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => backInputRef.current?.click()}
              >
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Clique para enviar o verso
                </p>
              </div>
            )}
            {errors.back_image && (
              <p className="text-sm text-destructive flex items-center gap-1 mt-2">
                <AlertCircle className="h-4 w-4" />
                {errors.back_image}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="bg-muted/50 p-4 rounded-lg">
        <div className="flex items-start gap-2">
          <FileImage className="h-5 w-5 text-primary mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Dicas para uma boa foto:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Use boa iluminação</li>
              <li>Evite reflexos</li>
              <li>Certifique-se de que todas as informações estão legíveis</li>
              <li>Não corte nenhuma parte do documento</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
