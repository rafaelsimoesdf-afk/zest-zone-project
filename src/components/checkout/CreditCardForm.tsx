import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export interface CreditCardFormData {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
  postalCode: string;
  addressNumber: string;
}

interface Props {
  value: CreditCardFormData;
  onChange: (next: CreditCardFormData) => void;
  saveCard: boolean;
  onSaveCardChange: (v: boolean) => void;
}

const maskNumber = (v: string) =>
  v.replace(/\D/g, "").slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ");

const maskExpiry = (v: string) => v.replace(/\D/g, "").slice(0, 2);

const maskYear = (v: string) => v.replace(/\D/g, "").slice(0, 4);

const maskCcv = (v: string) => v.replace(/\D/g, "").slice(0, 4);

const maskCep = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
};

export function CreditCardForm({ value, onChange, saveCard, onSaveCardChange }: Props) {
  const set = (patch: Partial<CreditCardFormData>) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-3 mt-3 p-3 sm:p-4 border rounded-lg bg-muted/20">
      <div>
        <Label className="text-xs sm:text-sm">Nome impresso no cartão</Label>
        <Input
          value={value.holderName}
          onChange={(e) => set({ holderName: e.target.value.toUpperCase() })}
          placeholder="COMO IMPRESSO NO CARTÃO"
          className="h-10 text-sm uppercase"
          autoComplete="cc-name"
        />
      </div>

      <div>
        <Label className="text-xs sm:text-sm">Número do cartão</Label>
        <Input
          value={value.number}
          onChange={(e) => set({ number: maskNumber(e.target.value) })}
          placeholder="0000 0000 0000 0000"
          inputMode="numeric"
          autoComplete="cc-number"
          className="h-10 text-sm font-mono"
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label className="text-xs sm:text-sm">Mês</Label>
          <Input
            value={value.expiryMonth}
            onChange={(e) => set({ expiryMonth: maskExpiry(e.target.value) })}
            placeholder="MM"
            inputMode="numeric"
            autoComplete="cc-exp-month"
            className="h-10 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs sm:text-sm">Ano</Label>
          <Input
            value={value.expiryYear}
            onChange={(e) => set({ expiryYear: maskYear(e.target.value) })}
            placeholder="AAAA"
            inputMode="numeric"
            autoComplete="cc-exp-year"
            className="h-10 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs sm:text-sm">CVV</Label>
          <Input
            value={value.ccv}
            onChange={(e) => set({ ccv: maskCcv(e.target.value) })}
            placeholder="123"
            inputMode="numeric"
            autoComplete="cc-csc"
            className="h-10 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2">
          <Label className="text-xs sm:text-sm">CEP do titular</Label>
          <Input
            value={value.postalCode}
            onChange={(e) => set({ postalCode: maskCep(e.target.value) })}
            placeholder="00000-000"
            inputMode="numeric"
            autoComplete="postal-code"
            className="h-10 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs sm:text-sm">Número</Label>
          <Input
            value={value.addressNumber}
            onChange={(e) => set({ addressNumber: e.target.value.replace(/\D/g, "").slice(0, 6) })}
            placeholder="Nº"
            inputMode="numeric"
            className="h-10 text-sm"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 pt-1 cursor-pointer">
        <Checkbox checked={saveCard} onCheckedChange={(c) => onSaveCardChange(c === true)} />
        <span className="text-xs sm:text-sm text-muted-foreground">
          Salvar cartão para próximas reservas (pagamento em 1 clique)
        </span>
      </label>

      <p className="text-[11px] text-muted-foreground">
        🔒 Dados processados com segurança pelo Asaas. Não armazenamos o número completo do cartão.
      </p>
    </div>
  );
}
