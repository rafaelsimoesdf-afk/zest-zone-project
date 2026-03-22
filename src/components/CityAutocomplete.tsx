import { useState, useEffect, useRef, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";
import { brazilianStates, citiesByState } from "@/hooks/useBrazilLocations";

interface CityAutocompleteProps {
  value: string;
  onChange: (city: string) => void;
  placeholder?: string;
  className?: string;
  hideIcon?: boolean;
}

interface CityResult {
  city: string;
  state: string;
  stateCode: string;
  label: string;
}

// Build a flat list of all cities with state info
const allCities: CityResult[] = (() => {
  const results: CityResult[] = [];
  for (const state of brazilianStates) {
    const cities = citiesByState[state.code] || [];
    for (const city of cities) {
      results.push({
        city,
        state: state.name,
        stateCode: state.code,
        label: `${city}, ${state.code}`,
      });
    }
  }
  return results;
})();

export const CityAutocomplete = ({ value, onChange, placeholder = "Cidade ou endereço...", className, hideIcon = false }: CityAutocompleteProps) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
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

  const filtered = useMemo(() => {
    if (!value || value.length < 2) return [];
    const q = value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return allCities
      .filter(c => {
        const normalized = c.label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return normalized.includes(q);
      })
      .slice(0, 10);
  }, [value]);

  useEffect(() => {
    if (filtered.length > 0 && value.length >= 2) {
      setShowSuggestions(true);
    }
  }, [filtered, value]);

  const handleSelect = (result: CityResult) => {
    onChange(result.label);
    setShowSuggestions(false);
  };

  return (
    <div className="relative">
      {!hideIcon && (
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
      )}
      <Input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={className}
      />
      
      {showSuggestions && filtered.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {filtered.map((result) => (
            <button
              key={`${result.stateCode}-${result.city}`}
              type="button"
              onClick={() => handleSelect(result)}
              className="w-full px-4 py-2 text-left hover:bg-accent transition-colors"
            >
              <span className="font-medium text-foreground">{result.city}</span>
              <span className="text-sm text-muted-foreground ml-2">{result.stateCode}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
