import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { maskCEP } from "@/lib/validators";
import { AlertCircle, Loader2 } from "lucide-react";
import { brazilianStates, getCitiesForState } from "@/hooks/useBrazilLocations";

interface AddressData {
  zip_code: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

interface StepAddressProps {
  data: AddressData;
  onChange: (data: AddressData) => void;
  errors: Record<string, string>;
}

export const StepAddress = ({ data, onChange, errors }: StepAddressProps) => {
  const [loadingCEP, setLoadingCEP] = useState(false);
  const [selectedState, setSelectedState] = useState(data.state || '');
  const states = brazilianStates.map(s => ({ sigla: s.code, nome: s.name }));
  const cities = getCitiesForState(selectedState).map(c => ({ nome: c }));

  const handleCEPChange = async (value: string) => {
    const maskedCEP = maskCEP(value);
    onChange({ ...data, zip_code: maskedCEP });

    const cleanCEP = maskedCEP.replace(/\D/g, '');
    if (cleanCEP.length === 8) {
      setLoadingCEP(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
        const result = await response.json();
        
        if (!result.erro) {
          setSelectedState(result.uf);
          onChange({
            ...data,
            zip_code: maskedCEP,
            street: result.logradouro || '',
            neighborhood: result.bairro || '',
            city: result.localidade || '',
            state: result.uf || '',
          });
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
      } finally {
        setLoadingCEP(false);
      }
    }
  };

  const handleStateChange = (value: string) => {
    setSelectedState(value);
    onChange({ ...data, state: value, city: '' });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground">Endereço</h2>
        <p className="text-muted-foreground mt-2">
          Informe seu endereço completo
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="zip_code">CEP *</Label>
        <div className="relative">
          <Input
            id="zip_code"
            value={data.zip_code}
            onChange={(e) => handleCEPChange(e.target.value)}
            placeholder="00000-000"
            maxLength={9}
            className={errors.zip_code ? 'border-destructive' : ''}
          />
          {loadingCEP && (
            <Loader2 className="h-4 w-4 animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          )}
        </div>
        {errors.zip_code && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.zip_code}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="street">Rua *</Label>
        <Input
          id="street"
          value={data.street}
          onChange={(e) => onChange({ ...data, street: e.target.value })}
          placeholder="Nome da rua"
          className={errors.street ? 'border-destructive' : ''}
        />
        {errors.street && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.street}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="number">Número *</Label>
          <Input
            id="number"
            value={data.number}
            onChange={(e) => onChange({ ...data, number: e.target.value })}
            placeholder="123"
            className={errors.number ? 'border-destructive' : ''}
          />
          {errors.number && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.number}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="complement">Complemento</Label>
          <Input
            id="complement"
            value={data.complement}
            onChange={(e) => onChange({ ...data, complement: e.target.value })}
            placeholder="Apto 101"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="neighborhood">Bairro *</Label>
        <Input
          id="neighborhood"
          value={data.neighborhood}
          onChange={(e) => onChange({ ...data, neighborhood: e.target.value })}
          placeholder="Nome do bairro"
          className={errors.neighborhood ? 'border-destructive' : ''}
        />
        {errors.neighborhood && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.neighborhood}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="state">Estado *</Label>
          <Select value={data.state} onValueChange={handleStateChange}>
            <SelectTrigger className={errors.state ? 'border-destructive' : ''}>
              <SelectValue placeholder="Selecione o estado" />
            </SelectTrigger>
            <SelectContent className="bg-background border">
              {states.map((state) => (
                <SelectItem key={state.sigla} value={state.sigla}>
                  {state.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.state && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.state}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">Cidade *</Label>
          <Select 
            value={data.city} 
            onValueChange={(value) => onChange({ ...data, city: value })}
            disabled={!data.state}
          >
            <SelectTrigger className={errors.city ? 'border-destructive' : ''}>
              <SelectValue placeholder="Selecione a cidade" />
            </SelectTrigger>
            <SelectContent className="bg-background border max-h-60">
              {cities.map((city) => (
                <SelectItem key={city.nome} value={city.nome}>
                  {city.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.city && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.city}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
