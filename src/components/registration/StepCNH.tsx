import { useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Upload, Check, AlertTriangle } from "lucide-react";
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
  front_preview: string;
  back_preview: string;
}

interface StepCNHProps {
  data: CNHData;
  onChange: (data: CNHData) => void;
  errors: Record<string, string>;
}

export const StepCNH = ({ data, onChange, errors }: StepCNHProps) => {
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  const isExpired = data.expiry_date && isCNHExpired(new Date(data.expiry_date));

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Front */}
        <Card className={`${errors.front_image ? 'border-destructive' : ''}`}>
          <CardContent className="p-4">
            <Label className="mb-2 block">Frente da CNH *</Label>
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
            <Label className="mb-2 block">Verso da CNH *</Label>
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
    </div>
  );
};
