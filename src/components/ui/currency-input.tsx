import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number;
  onChange: (value: number) => void;
  showPrefix?: boolean;
}

/**
 * CurrencyInput - Input para valores em Real Brasileiro (BRL)
 * 
 * Comportamento:
 * - Ao clicar/focar, limpa o valor e inicia do zero
 * - Ao digitar, trata os dígitos como centavos:
 *   - 1 -> 0,01 (exibido como 0,01)
 *   - 12 -> 0,12
 *   - 123 -> 1,23
 *   - 1234 -> 12,34
 *   - etc.
 * - Ao perder o foco, formata como 150,00
 */
const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onChange, showPrefix = true, placeholder = "0,00", ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState("");
    const [isFocused, setIsFocused] = React.useState(false);

    // Format number to BRL display (without R$ prefix)
    const formatToBRL = (num: number): string => {
      if (num === 0) return "";
      return num.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    };

    // Update display when value changes externally
    React.useEffect(() => {
      if (!isFocused) {
        setDisplayValue(formatToBRL(value));
      }
    }, [value, isFocused]);

    const handleFocus = () => {
      setIsFocused(true);
      // Clear the display to start fresh
      setDisplayValue("");
    };

    const handleBlur = () => {
      setIsFocused(false);
      // Format the current value on blur
      setDisplayValue(formatToBRL(value));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value.replace(/\D/g, '');
      
      if (rawValue === '') {
        setDisplayValue("");
        onChange(0);
        return;
      }

      // Convert to cents, then to reais
      const cents = parseInt(rawValue, 10);
      const reais = cents / 100;

      // Format for display
      const formatted = reais.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

      setDisplayValue(formatted);
      onChange(reais);
    };

    return (
      <div className="relative">
        {showPrefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            R$
          </span>
        )}
        <Input
          ref={ref}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={cn(showPrefix && "pl-10", className)}
          {...props}
        />
      </div>
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };
