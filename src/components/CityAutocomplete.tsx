import { useState, useEffect, useRef } from "react";
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

interface Prediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  terms: Array<{ offset: number; value: string }>;
}

// Função para formatar a localização no formato "Cidade, UF, BR"
const formatLocation = (prediction: Prediction): string => {
  const terms = prediction.terms || [];
  
  if (terms.length >= 2) {
    const city = terms[0]?.value || '';
    const state = terms[1]?.value || '';
    // Pegar sigla do estado (primeiras 2 letras se for nome completo)
    const stateAbbrev = state.length > 2 ? getStateAbbreviation(state) : state;
    return `${city}, ${stateAbbrev}, BR`;
  }
  
  return prediction.structured_formatting.main_text;
};

// Mapeamento de estados brasileiros para siglas
const getStateAbbreviation = (stateName: string): string => {
  const stateMap: Record<string, string> = {
    'Acre': 'AC',
    'Alagoas': 'AL',
    'Amapá': 'AP',
    'Amazonas': 'AM',
    'Bahia': 'BA',
    'Ceará': 'CE',
    'Distrito Federal': 'DF',
    'Espírito Santo': 'ES',
    'Goiás': 'GO',
    'Maranhão': 'MA',
    'Mato Grosso': 'MT',
    'Mato Grosso do Sul': 'MS',
    'Minas Gerais': 'MG',
    'Pará': 'PA',
    'Paraíba': 'PB',
    'Paraná': 'PR',
    'Pernambuco': 'PE',
    'Piauí': 'PI',
    'Rio de Janeiro': 'RJ',
    'Rio Grande do Norte': 'RN',
    'Rio Grande do Sul': 'RS',
    'Rondônia': 'RO',
    'Roraima': 'RR',
    'Santa Catarina': 'SC',
    'São Paulo': 'SP',
    'Sergipe': 'SE',
    'Tocantins': 'TO',
    'State of Acre': 'AC',
    'State of Alagoas': 'AL',
    'State of Amapá': 'AP',
    'State of Amazonas': 'AM',
    'State of Bahia': 'BA',
    'State of Ceará': 'CE',
    'State of Espírito Santo': 'ES',
    'State of Goiás': 'GO',
    'State of Maranhão': 'MA',
    'State of Mato Grosso': 'MT',
    'State of Mato Grosso do Sul': 'MS',
    'State of Minas Gerais': 'MG',
    'State of Pará': 'PA',
    'State of Paraíba': 'PB',
    'State of Paraná': 'PR',
    'State of Pernambuco': 'PE',
    'State of Piauí': 'PI',
    'State of Rio de Janeiro': 'RJ',
    'State of Rio Grande do Norte': 'RN',
    'State of Rio Grande do Sul': 'RS',
    'State of Rondônia': 'RO',
    'State of Roraima': 'RR',
    'State of Santa Catarina': 'SC',
    'State of São Paulo': 'SP',
    'State of Sergipe': 'SE',
    'State of Tocantins': 'TO',
  };
  return stateMap[stateName] || stateName;
};

export const CityAutocomplete = ({ value, onChange, placeholder = "Cidade ou endereço...", className, hideIcon = false }: CityAutocompleteProps) => {
  const [suggestions, setSuggestions] = useState<Prediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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
      if (!value || value.length < 3) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('google-places-autocomplete', {
          body: { input: value, type: 'city' }
        });

        if (error) throw error;
        
        setSuggestions(data.predictions || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error fetching city suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [value]);

  const handleSelectSuggestion = (prediction: Prediction) => {
    const formattedLocation = formatLocation(prediction);
    onChange(formattedLocation);
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
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((prediction) => {
            const formattedLocation = formatLocation(prediction);
            return (
              <button
                key={prediction.place_id}
                type="button"
                onClick={() => handleSelectSuggestion(prediction)}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors"
              >
                <span className="font-medium text-gray-900">{formattedLocation}</span>
              </button>
            );
          })}
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
