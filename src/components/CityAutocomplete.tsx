import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CityAutocompleteProps {
  value: string;
  onChange: (city: string) => void;
  placeholder?: string;
  className?: string;
  hideIcon?: boolean;
}

type CitySuggestion = {
  key: string;
  city: string;
  state: string;
  display: string; // "Cidade, UF, BR"
};

const formatCityState = (city: string, state: string) => `${city}, ${state}, BR`;

const parseLocationInput = (input: string) => {
  const parts = input
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  const cityPart = parts[0] ?? "";
  const statePart = parts[1] ?? "";

  // Aceita UF (2 letras) e ignora "BR" no final
  const uf = /^[A-Za-z]{2}$/.test(statePart) ? statePart.toUpperCase() : "";

  return { cityPart, uf };
};

export const CityAutocomplete = ({
  value,
  onChange,
  placeholder = "Cidade ou endereço...",
  className,
  hideIcon = false,
}: CityAutocompleteProps) => {
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const parsed = useMemo(() => parseLocationInput(value), [value]);

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
      if (!parsed.cityPart || parsed.cityPart.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsLoading(true);
      try {
        // Busca todas as cidades distintas de veículos aprovados
        let query = supabase
          .from("vehicles")
          .select("city, state")
          .eq("status", "approved")
          .not("city", "is", null)
          .not("state", "is", null);

        const { data, error } = await query;
        
        if (error) {
          console.error("Error fetching cities:", error);
          throw error;
        }

        console.log("Cities from DB:", data);

        // Filtra e deduplica no frontend para garantir que funcione
        const seen = new Set<string>();
        const deduped: CitySuggestion[] = [];
        const searchTerm = parsed.cityPart.toLowerCase();

        for (const row of data ?? []) {
          const city = row.city as string | null;
          const state = row.state as string | null;
          if (!city || !state) continue;

          // Filtro por cidade (case insensitive)
          if (!city.toLowerCase().includes(searchTerm)) continue;

          // Filtro por UF se fornecido
          if (parsed.uf && state.toUpperCase() !== parsed.uf) continue;

          const key = `${city}__${state}`;
          if (seen.has(key)) continue;
          seen.add(key);

          deduped.push({
            key,
            city,
            state,
            display: formatCityState(city, state),
          });
        }

        deduped.sort((a, b) => a.display.localeCompare(b.display, "pt-BR"));

        console.log("Filtered suggestions:", deduped);

        setSuggestions(deduped.slice(0, 10));
        setShowSuggestions(deduped.length > 0);
      } catch (error) {
        console.error("Error fetching city suggestions from DB:", error);
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 250);
    return () => clearTimeout(debounceTimer);
  }, [parsed.cityPart, parsed.uf]);

  const handleSelectSuggestion = (suggestion: CitySuggestion) => {
    onChange(suggestion.display);
    setShowSuggestions(false);
    setSuggestions([]);
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
        onFocus={() => {
          if (suggestions.length > 0) setShowSuggestions(true);
        }}
      />

      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => handleSelectSuggestion(s)}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors"
            >
              <span className="font-medium text-gray-900">{s.display}</span>
            </button>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      )}
    </div>
  );
};
