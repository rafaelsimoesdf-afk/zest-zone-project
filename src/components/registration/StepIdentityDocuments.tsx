import { useRef } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Upload, Check, FileImage, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface IdentityData {
  document_type: 'rg' | 'cnh';
  front_image: File | null;
  back_image: File | null;
  digital_image: File | null;
  front_preview: string;
  back_preview: string;
  digital_preview: string;
}

interface StepIdentityDocumentsProps {
  data: IdentityData;
  onChange: (data: IdentityData) => void;
  errors: Record<string, string>;
}

export const StepIdentityDocuments = ({ data, onChange, errors }: StepIdentityDocumentsProps) => {
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const digitalInputRef = useRef<HTMLInputElement>(null);

  // Check which option is being used (only for CNH)
  const hasFrontAndBack = data.front_image && data.back_image;
  const hasDigital = data.digital_image;
  const isPhysicalOptionDisabled = data.document_type === 'cnh' && hasDigital && !hasFrontAndBack;
  const isDigitalOptionDisabled = data.document_type === 'cnh' && hasFrontAndBack && !hasDigital;

  const handleFileChange = (type: 'front' | 'back' | 'digital', file: File | null) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'front') {
          onChange({
            ...data,
            front_image: file,
            front_preview: reader.result as string,
          });
        } else if (type === 'back') {
          onChange({
            ...data,
            back_image: file,
            back_preview: reader.result as string,
          });
        } else {
          onChange({
            ...data,
            digital_image: file,
            digital_preview: reader.result as string,
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const clearPhysicalDocuments = () => {
    onChange({
      ...data,
      front_image: null,
      back_image: null,
      front_preview: "",
      back_preview: "",
    });
  };

  const clearDigitalDocument = () => {
    onChange({
      ...data,
      digital_image: null,
      digital_preview: "",
    });
  };

  // Clear CNH-specific fields when switching to RG
  const handleDocumentTypeChange = (value: 'rg' | 'cnh') => {
    if (value === 'rg') {
      onChange({
        ...data,
        document_type: value,
        digital_image: null,
        digital_preview: "",
      });
    } else {
      onChange({ ...data, document_type: value });
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
          onValueChange={handleDocumentTypeChange}
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

      {/* Info about document options (only for CNH) */}
      {data.document_type === 'cnh' && (
        <div className="bg-primary/10 border border-primary/30 p-4 rounded-lg flex items-start gap-3">
          <Info className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="font-medium text-primary">Escolha uma das opções abaixo:</p>
            <p className="text-sm text-primary/80">
              Envie a <strong>CNH Frente + Verso</strong> OU a <strong>CNH Digital</strong>. Não é necessário enviar ambas.
            </p>
          </div>
        </div>
      )}

      {errors.identity_documents && (
        <div className="bg-destructive/10 border border-destructive/30 p-4 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
          <p className="text-sm text-destructive">{errors.identity_documents}</p>
        </div>
      )}

      {/* Option 1: Front + Back */}
      <div className={`space-y-4 ${isPhysicalOptionDisabled ? 'opacity-50' : ''}`}>
        {data.document_type === 'cnh' && (
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Opção 1: CNH Física (Frente + Verso)</h3>
            {hasFrontAndBack && (
              <Button variant="ghost" size="sm" onClick={clearPhysicalDocuments}>
                Limpar
              </Button>
            )}
          </div>
        )}
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
                disabled={isPhysicalOptionDisabled}
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
                  className={`border-2 border-dashed border-border rounded-lg p-8 text-center transition-colors ${
                    isPhysicalOptionDisabled ? 'cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'
                  }`}
                  onClick={() => !isPhysicalOptionDisabled && frontInputRef.current?.click()}
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
                disabled={isPhysicalOptionDisabled}
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
                  className={`border-2 border-dashed border-border rounded-lg p-8 text-center transition-colors ${
                    isPhysicalOptionDisabled ? 'cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'
                  }`}
                  onClick={() => !isPhysicalOptionDisabled && backInputRef.current?.click()}
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
      </div>

      {/* CNH Digital Option - Only show when CNH is selected */}
      {data.document_type === 'cnh' && (
        <>
          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-muted-foreground font-medium">OU</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Option 2: Digital */}
          <div className={`space-y-4 ${isDigitalOptionDisabled ? 'opacity-50' : ''}`}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Opção 2: CNH Digital</h3>
              {hasDigital && (
                <Button variant="ghost" size="sm" onClick={clearDigitalDocument}>
                  Limpar
                </Button>
              )}
            </div>
            <Card className={`${errors.digital_image ? 'border-destructive' : ''}`}>
              <CardContent className="p-4">
                <Label className="mb-2 block">CNH Digital (captura de tela ou PDF)</Label>
                <input
                  ref={digitalInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  disabled={isDigitalOptionDisabled}
                  onChange={(e) => handleFileChange('digital', e.target.files?.[0] || null)}
                />
                
                {data.digital_preview ? (
                  <div className="relative">
                    <img 
                      src={data.digital_preview} 
                      alt="CNH Digital" 
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => digitalInputRef.current?.click()}
                    >
                      Alterar
                    </Button>
                    <div className="absolute bottom-2 right-2 bg-green-500 text-white p-1 rounded-full">
                      <Check className="h-4 w-4" />
                    </div>
                  </div>
                ) : (
                  <div 
                    className={`border-2 border-dashed border-border rounded-lg p-8 text-center transition-colors ${
                      isDigitalOptionDisabled ? 'cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'
                    }`}
                    onClick={() => !isDigitalOptionDisabled && digitalInputRef.current?.click()}
                  >
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Clique para enviar a CNH Digital
                    </p>
                  </div>
                )}
                {errors.digital_image && (
                  <p className="text-sm text-destructive flex items-center gap-1 mt-2">
                    <AlertCircle className="h-4 w-4" />
                    {errors.digital_image}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

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
