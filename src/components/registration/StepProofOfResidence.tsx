import { useRef } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Upload, Check, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

const PROOF_TYPES = [
  { value: 'conta_luz', label: 'Conta de Luz' },
  { value: 'conta_agua', label: 'Conta de Água' },
  { value: 'conta_gas', label: 'Conta de Gás' },
  { value: 'conta_internet', label: 'Conta de Internet' },
  { value: 'conta_telefone', label: 'Conta de Telefone' },
  { value: 'fatura_cartao', label: 'Fatura de Cartão' },
  { value: 'extrato_bancario', label: 'Extrato Bancário' },
  { value: 'outro', label: 'Outro' },
];

interface ProofData {
  document_type: string;
  document_image: File | null;
  document_preview: string;
}

interface StepProofOfResidenceProps {
  data: ProofData;
  onChange: (data: ProofData) => void;
  errors: Record<string, string>;
}

export const StepProofOfResidence = ({ data, onChange, errors }: StepProofOfResidenceProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (file: File | null) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange({
          ...data,
          document_image: file,
          document_preview: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground">Comprovante de Residência</h2>
        <p className="text-muted-foreground mt-2">
          Envie um comprovante recente (máximo 3 meses)
        </p>
      </div>

      <div className="space-y-2 max-w-md mx-auto">
        <Label>Tipo de Comprovante *</Label>
        <Select value={data.document_type} onValueChange={(value) => onChange({ ...data, document_type: value })}>
          <SelectTrigger className={errors.document_type ? 'border-destructive' : ''}>
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent className="bg-background border">
            {PROOF_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.document_type && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.document_type}
          </p>
        )}
      </div>

      <Card className={`max-w-md mx-auto ${errors.document_image ? 'border-destructive' : ''}`}>
        <CardContent className="p-6">
          <Label className="mb-4 block">Foto do Comprovante *</Label>
          <input
            ref={inputRef}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
          />
          
          {data.document_preview ? (
            <div className="relative">
              {data.document_image?.type === 'application/pdf' ? (
                <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center">
                  <FileText className="h-16 w-16 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground ml-2">PDF enviado</span>
                </div>
              ) : (
                <img 
                  src={data.document_preview} 
                  alt="Comprovante de residência" 
                  className="w-full h-48 object-cover rounded-lg"
                />
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => inputRef.current?.click()}
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
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-1">
                Clique para enviar o comprovante
              </p>
              <p className="text-xs text-muted-foreground">
                Formatos aceitos: JPG, PNG, PDF
              </p>
            </div>
          )}
          {errors.document_image && (
            <p className="text-sm text-destructive flex items-center gap-1 mt-4">
              <AlertCircle className="h-4 w-4" />
              {errors.document_image}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="bg-muted/50 p-4 rounded-lg max-w-md mx-auto">
        <div className="flex items-start gap-2">
          <FileText className="h-5 w-5 text-primary mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Documentos aceitos:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Conta de água, luz, gás ou telefone</li>
              <li>Fatura de cartão de crédito</li>
              <li>Extrato bancário</li>
              <li>Documento deve ter no máximo 3 meses</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
