import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, User, MapPin, FileText, Car, Camera, Home, Check } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface ReviewData {
  personalData: {
    first_name: string;
    last_name: string;
    birth_date: string;
    cpf: string;
    phone_number: string;
  };
  addressData: {
    zip_code: string;
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
  };
  identityData: {
    document_type: string;
    front_preview: string;
    back_preview: string;
  };
  cnhData: {
    cnh_number: string;
    category: string;
    issue_date: string;
    expiry_date: string;
    front_preview: string;
    back_preview: string;
  };
  selfieData: {
    selfie_preview: string;
  };
  proofData: {
    document_type: string;
    document_preview: string;
  };
}

interface Confirmations {
  data_accuracy: boolean;
  lgpd: boolean;
  terms: boolean;
}

interface StepReviewProps {
  data: ReviewData;
  confirmations: Confirmations;
  onConfirmationsChange: (confirmations: Confirmations) => void;
  errors: Record<string, string>;
}

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
};

const PROOF_TYPES: Record<string, string> = {
  'conta_luz': 'Conta de Luz',
  'conta_agua': 'Conta de Água',
  'conta_gas': 'Conta de Gás',
  'conta_internet': 'Conta de Internet',
  'conta_telefone': 'Conta de Telefone',
  'fatura_cartao': 'Fatura de Cartão',
  'extrato_bancario': 'Extrato Bancário',
  'outro': 'Outro',
};

export const StepReview = ({ data, confirmations, onConfirmationsChange, errors }: StepReviewProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground">Revisão e Envio</h2>
        <p className="text-muted-foreground mt-2">
          Revise suas informações antes de enviar
        </p>
      </div>

      {/* Personal Data */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Dados Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">Nome:</span>
            <p className="font-medium">{data.personalData.first_name} {data.personalData.last_name}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Data de Nascimento:</span>
            <p className="font-medium">{formatDate(data.personalData.birth_date)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">CPF:</span>
            <p className="font-medium">{data.personalData.cpf}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Telefone:</span>
            <p className="font-medium">{data.personalData.phone_number}</p>
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Endereço
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <p className="font-medium">
            {data.addressData.street}, {data.addressData.number}
            {data.addressData.complement && ` - ${data.addressData.complement}`}
          </p>
          <p className="text-muted-foreground">
            {data.addressData.neighborhood} - {data.addressData.city}/{data.addressData.state}
          </p>
          <p className="text-muted-foreground">CEP: {data.addressData.zip_code}</p>
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Documentos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <span className="text-sm text-muted-foreground">
              Documento de Identidade ({data.identityData.document_type.toUpperCase()})
            </span>
            <div className="flex gap-2 mt-2">
              {data.identityData.front_preview && (
                <img src={data.identityData.front_preview} alt="Frente" className="h-16 w-24 object-cover rounded" />
              )}
              {data.identityData.back_preview && (
                <img src={data.identityData.back_preview} alt="Verso" className="h-16 w-24 object-cover rounded" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CNH */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Car className="h-5 w-5 text-primary" />
            CNH
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-muted-foreground">Número:</span>
              <p className="font-medium">{data.cnhData.cnh_number}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Categoria:</span>
              <p className="font-medium">{data.cnhData.category}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Emissão:</span>
              <p className="font-medium">{formatDate(data.cnhData.issue_date)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Validade:</span>
              <p className="font-medium">{formatDate(data.cnhData.expiry_date)}</p>
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            {data.cnhData.front_preview && (
              <img src={data.cnhData.front_preview} alt="Frente CNH" className="h-16 w-24 object-cover rounded" />
            )}
            {data.cnhData.back_preview && (
              <img src={data.cnhData.back_preview} alt="Verso CNH" className="h-16 w-24 object-cover rounded" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Selfie */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Selfie de Verificação
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.selfieData.selfie_preview && (
            <img src={data.selfieData.selfie_preview} alt="Selfie" className="h-24 w-24 object-cover rounded-lg" />
          )}
        </CardContent>
      </Card>

      {/* Proof of Residence */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Home className="h-5 w-5 text-primary" />
            Comprovante de Residência
          </CardTitle>
        </CardHeader>
        <CardContent>
          <span className="text-sm text-muted-foreground">
            {PROOF_TYPES[data.proofData.document_type] || data.proofData.document_type}
          </span>
          {data.proofData.document_preview && (
            <img src={data.proofData.document_preview} alt="Comprovante" className="h-16 w-24 object-cover rounded mt-2" />
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Legal Confirmations */}
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground">Confirmações Legais</h3>
        
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="data_accuracy"
              checked={confirmations.data_accuracy}
              onCheckedChange={(checked) => 
                onConfirmationsChange({ ...confirmations, data_accuracy: checked as boolean })
              }
            />
            <Label htmlFor="data_accuracy" className="text-sm leading-relaxed cursor-pointer">
              Declaro que todas as informações fornecidas são verdadeiras e corretas.
            </Label>
          </div>
          {errors.data_accuracy && (
            <p className="text-sm text-destructive flex items-center gap-1 ml-7">
              <AlertCircle className="h-4 w-4" />
              {errors.data_accuracy}
            </p>
          )}

          <div className="flex items-start space-x-3">
            <Checkbox
              id="lgpd"
              checked={confirmations.lgpd}
              onCheckedChange={(checked) => 
                onConfirmationsChange({ ...confirmations, lgpd: checked as boolean })
              }
            />
            <Label htmlFor="lgpd" className="text-sm leading-relaxed cursor-pointer">
              Autorizo o uso dos meus dados pessoais conforme a Lei Geral de Proteção de Dados (LGPD).
            </Label>
          </div>
          {errors.lgpd && (
            <p className="text-sm text-destructive flex items-center gap-1 ml-7">
              <AlertCircle className="h-4 w-4" />
              {errors.lgpd}
            </p>
          )}

          <div className="flex items-start space-x-3">
            <Checkbox
              id="terms"
              checked={confirmations.terms}
              onCheckedChange={(checked) => 
                onConfirmationsChange({ ...confirmations, terms: checked as boolean })
              }
            />
            <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
              Concordo com os{' '}
              <a href="/terms" className="text-primary hover:underline">Termos de Uso</a>
              {' '}e{' '}
              <a href="/privacy" className="text-primary hover:underline">Política de Privacidade</a>.
            </Label>
          </div>
          {errors.terms && (
            <p className="text-sm text-destructive flex items-center gap-1 ml-7">
              <AlertCircle className="h-4 w-4" />
              {errors.terms}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
