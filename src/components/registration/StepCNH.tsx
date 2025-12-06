import { useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Upload, Check, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isCNHExpired } from "@/lib/validators";

const CNH_CATEGORIES = ['A', 'B', 'C', 'D', 'E', 'AB', 'AC', 'AD', 'AE'];

interface CNHData {
  cnh_number: string;
  category: string;
  issue_date: string;
  expiry_date: string;
  front_image: File | null;
  back_image: File | null;
  digital_image: File | null;
  front_preview: string;
  back_preview: string;
  digital_preview: string;
}

interface StepCNHProps {
  data: CNHData;
  onChange: (data: CNHData) => void;
  errors: Record<string, string>;
}

export const StepCNH = ({ data, onChange, errors }: StepCNHProps) => {
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const digitalInputRef = useRef<HTMLInputElement>(null);

  const isExpired = data.expiry_date && isCNHExpired(new Date(data.expiry_date));

  // Check which option is being used
  const hasFrontAndBack = data.front_image && data.back_image;
  const hasDigital = data.digital_image;
  const isPhysicalOptionDisabled = hasDigital && !hasFrontAndBack;
  const isDigitalOptionDisabled = hasFrontAndBack && !hasDigital;

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

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground">Carteira Nacional de Habilitação</h2>
        <p className="text-muted-foreground mt-2">
          Sua CNH é obrigatória para alugar veículos
        </p>
      </div>

      {isExpired && (
        <div className="bg-destructive/10 border border-destructive/30 p-4 rounded-lg flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
          <div>
            <p className="font-medium text-destructive">CNH Vencida</p>
            <p className="text-sm text-destructive/80">
              Sua CNH está vencida. Por favor, renove sua CNH antes de continuar o cadastro.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cnh_number">Número da CNH *</Label>
          <Input
            id="cnh_number"
            value={data.cnh_number}
            onChange={(e) => onChange({ ...data, cnh_number: e.target.value })}
            placeholder="00000000000"
            maxLength={11}
            className={errors.cnh_number ? 'border-destructive' : ''}
          />
          {errors.cnh_number && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.cnh_number}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Categoria *</Label>
          <Select value={data.category} onValueChange={(value) => onChange({ ...data, category: value })}>
            <SelectTrigger className={errors.category ? 'border-destructive' : ''}>
              <SelectValue placeholder="Selecione a categoria" />
            </SelectTrigger>
            <SelectContent className="bg-background border">
              {CNH_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.category}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="issue_date">Data de Emissão *</Label>
          <Input
            id="issue_date"
            type="date"
            value={data.issue_date}
            onChange={(e) => onChange({ ...data, issue_date: e.target.value })}
            className={errors.issue_date ? 'border-destructive' : ''}
          />
          {errors.issue_date && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.issue_date}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="expiry_date">Data de Validade *</Label>
          <Input
            id="expiry_date"
            type="date"
            value={data.expiry_date}
            onChange={(e) => onChange({ ...data, expiry_date: e.target.value })}
            className={`${errors.expiry_date || isExpired ? 'border-destructive' : ''}`}
          />
          {(errors.expiry_date || isExpired) && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.expiry_date || 'CNH vencida'}
            </p>
          )}
        </div>
      </div>

      {/* Info about document options */}
      <div className="bg-primary/10 border border-primary/30 p-4 rounded-lg flex items-start gap-3">
        <Info className="h-5 w-5 text-primary mt-0.5" />
        <div>
          <p className="font-medium text-primary">Escolha uma das opções abaixo:</p>
          <p className="text-sm text-primary/80">
            Envie a <strong>CNH Frente + Verso</strong> OU a <strong>CNH Digital</strong>. Não é necessário enviar ambas.
          </p>
        </div>
      </div>

      {errors.cnh_documents && (
        <div className="bg-destructive/10 border border-destructive/30 p-4 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
          <p className="text-sm text-destructive">{errors.cnh_documents}</p>
        </div>
      )}

      {/* Option 1: Front + Back */}
      <div className={`space-y-4 ${isPhysicalOptionDisabled ? 'opacity-50' : ''}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Opção 1: CNH Física (Frente + Verso)</h3>
          {hasFrontAndBack && (
            <Button variant="ghost" size="sm" onClick={clearPhysicalDocuments}>
              Limpar
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Front */}
          <Card className={`${errors.front_image ? 'border-destructive' : ''}`}>
            <CardContent className="p-4">
              <Label className="mb-2 block">Frente da CNH</Label>
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
                    alt="Frente da CNH" 
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
            </CardContent>
          </Card>

          {/* Back */}
          <Card className={`${errors.back_image ? 'border-destructive' : ''}`}>
            <CardContent className="p-4">
              <Label className="mb-2 block">Verso da CNH</Label>
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
                    alt="Verso da CNH" 
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
            </CardContent>
          </Card>
        </div>
      </div>

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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
