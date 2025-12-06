import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { maskCPF, maskPhone, validateCPF, validatePhone, calculateAge } from "@/lib/validators";
import { AlertCircle } from "lucide-react";

interface PersonalData {
  first_name: string;
  last_name: string;
  birth_date: string;
  cpf: string;
  phone_number: string;
}

interface StepPersonalDataProps {
  data: PersonalData;
  onChange: (data: PersonalData) => void;
  errors: Record<string, string>;
}

export const StepPersonalData = ({ data, onChange, errors }: StepPersonalDataProps) => {
  const handleChange = (field: keyof PersonalData, value: string) => {
    let processedValue = value;
    
    if (field === 'cpf') {
      processedValue = maskCPF(value);
    } else if (field === 'phone_number') {
      processedValue = maskPhone(value);
    }
    
    onChange({ ...data, [field]: processedValue });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground">Dados Pessoais</h2>
        <p className="text-muted-foreground mt-2">
          Preencha seus dados pessoais para começar
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="first_name">Nome *</Label>
          <Input
            id="first_name"
            value={data.first_name}
            onChange={(e) => handleChange('first_name', e.target.value)}
            placeholder="Seu nome"
            className={errors.first_name ? 'border-destructive' : ''}
          />
          {errors.first_name && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.first_name}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="last_name">Sobrenome *</Label>
          <Input
            id="last_name"
            value={data.last_name}
            onChange={(e) => handleChange('last_name', e.target.value)}
            placeholder="Seu sobrenome"
            className={errors.last_name ? 'border-destructive' : ''}
          />
          {errors.last_name && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.last_name}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="birth_date">Data de Nascimento *</Label>
        <Input
          id="birth_date"
          type="date"
          value={data.birth_date}
          onChange={(e) => handleChange('birth_date', e.target.value)}
          className={errors.birth_date ? 'border-destructive' : ''}
        />
        {errors.birth_date && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.birth_date}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="cpf">CPF *</Label>
        <Input
          id="cpf"
          value={data.cpf}
          onChange={(e) => handleChange('cpf', e.target.value)}
          placeholder="000.000.000-00"
          maxLength={14}
          className={errors.cpf ? 'border-destructive' : ''}
        />
        {errors.cpf && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.cpf}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone_number">Telefone Celular *</Label>
        <Input
          id="phone_number"
          value={data.phone_number}
          onChange={(e) => handleChange('phone_number', e.target.value)}
          placeholder="(00) 00000-0000"
          maxLength={15}
          className={errors.phone_number ? 'border-destructive' : ''}
        />
        {errors.phone_number && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.phone_number}
          </p>
        )}
      </div>
    </div>
  );
};
