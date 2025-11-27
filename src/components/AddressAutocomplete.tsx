import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export interface AddressData {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
  latitude?: number;
  longitude?: number;
}

interface AddressAutocompleteProps {
  value: AddressData;
  onChange: (address: AddressData) => void;
  disabled?: boolean;
}

interface Prediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export const AddressAutocomplete = ({ value, onChange, disabled }: AddressAutocompleteProps) => {
  const [suggestions, setSuggestions] = useState<Prediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!searchInput || searchInput.length < 3) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('google-places-autocomplete', {
          body: { input: searchInput, type: 'address' }
        });

        if (error) throw error;
        
        setSuggestions(data.predictions || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error fetching address suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchInput]);

  const handleSelectSuggestion = (prediction: Prediction) => {
    const parts = prediction.description.split(', ');
    const newAddress = { ...value };
    
    if (parts.length >= 1) {
      const streetPart = parts[0].split(' - ')[0];
      const streetMatch = streetPart.match(/^(.+?)(?:,?\s*(\d+.*))?$/);
      if (streetMatch) {
        newAddress.street = streetMatch[1].trim();
        if (streetMatch[2]) newAddress.number = streetMatch[2].trim();
      }
    }
    if (parts.length >= 2) newAddress.neighborhood = parts[1];
    if (parts.length >= 3) newAddress.city = parts[2];
    if (parts.length >= 4) {
      const statePart = parts[3].split(' - ')[0].trim();
      newAddress.state = statePart;
    }

    onChange(newAddress);
    setShowSuggestions(false);
    setSuggestions([]);
    setSearchInput("");
  };

  const displayValue = value.street 
    ? `${value.street}${value.number ? `, ${value.number}` : ""} - ${value.neighborhood}, ${value.city} - ${value.state}`
    : "";

  return (
    <div className="space-y-4">
      <div className="space-y-2 relative">
        <Label htmlFor="address-search">
          <MapPin className="w-4 h-4 inline mr-2" />
          Buscar Endereço *
        </Label>
        <Input
          id="address-search"
          ref={inputRef}
          type="text"
          placeholder="Digite o endereço completo"
          disabled={disabled}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto"
          >
            {suggestions.map((prediction) => (
              <button
                key={prediction.place_id}
                type="button"
                onClick={() => handleSelectSuggestion(prediction)}
                className="w-full px-4 py-2 text-left hover:bg-accent transition-colors flex flex-col"
              >
                <span className="font-medium text-foreground">{prediction.structured_formatting.main_text}</span>
                <span className="text-sm text-muted-foreground">{prediction.structured_formatting.secondary_text}</span>
              </button>
            ))}
          </div>
        )}
        
        {isLoading && (
          <div className="absolute right-3 top-9">
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        )}
      </div>

      {value.street && (
        <div className="grid sm:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
          <div className="space-y-2">
            <Label htmlFor="street">Rua *</Label>
            <Input
              id="street"
              value={value.street}
              onChange={(e) => onChange({ ...value, street: e.target.value })}
              disabled={disabled}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="number">Número *</Label>
            <Input
              id="number"
              value={value.number}
              onChange={(e) => onChange({ ...value, number: e.target.value })}
              disabled={disabled}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="complement">Complemento</Label>
            <Input
              id="complement"
              value={value.complement || ""}
              onChange={(e) => onChange({ ...value, complement: e.target.value })}
              disabled={disabled}
              placeholder="Apto, Bloco, etc."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="neighborhood">Bairro *</Label>
            <Input
              id="neighborhood"
              value={value.neighborhood}
              onChange={(e) => onChange({ ...value, neighborhood: e.target.value })}
              disabled={disabled}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">Cidade *</Label>
            <Input
              id="city"
              value={value.city}
              onChange={(e) => onChange({ ...value, city: e.target.value })}
              disabled={disabled}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">Estado *</Label>
            <Input
              id="state"
              value={value.state}
              onChange={(e) => onChange({ ...value, state: e.target.value })}
              disabled={disabled}
              required
              maxLength={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="zip_code">CEP *</Label>
            <Input
              id="zip_code"
              value={value.zip_code}
              onChange={(e) => onChange({ ...value, zip_code: e.target.value })}
              disabled={disabled}
              required
              placeholder="00000-000"
            />
          </div>
        </div>
      )}
    </div>
  );
};
