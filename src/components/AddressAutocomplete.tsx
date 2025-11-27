import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin } from "lucide-react";

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

export const AddressAutocomplete = ({ value, onChange, disabled }: AddressAutocompleteProps) => {
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load Google Maps API
    const loadGoogleMaps = () => {
      if (window.google) {
        setIsLoaded(true);
        return;
      }

      const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
      if (!apiKey) {
        console.error("Google Places API key not found. Please add VITE_GOOGLE_PLACES_API_KEY to your .env file");
        setIsLoaded(true); // Allow manual input even without API
        return;
      }

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=pt-BR`;
      script.async = true;
      script.defer = true;
      script.onload = () => setIsLoaded(true);
      script.onerror = () => {
        console.error("Failed to load Google Maps API");
        setIsLoaded(true); // Allow manual input even if API fails
      };
      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, []);

  useEffect(() => {
    if (!isLoaded || !inputRef.current || !window.google) return;

    // Initialize autocomplete
    autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: "br" },
      fields: ["address_components", "geometry", "formatted_address"],
      types: ["address"],
    });

    // Handle place selection
    autocompleteRef.current.addListener("place_changed", () => {
      const place = autocompleteRef.current?.getPlace();
      if (!place?.address_components) return;

      const addressComponents = place.address_components;
      const newAddress: AddressData = {
        street: "",
        number: "",
        complement: value.complement || "",
        neighborhood: "",
        city: "",
        state: "",
        zip_code: "",
        latitude: place.geometry?.location?.lat(),
        longitude: place.geometry?.location?.lng(),
      };

      addressComponents.forEach((component) => {
        const types = component.types;
        
        if (types.includes("street_number")) {
          newAddress.number = component.long_name;
        }
        if (types.includes("route")) {
          newAddress.street = component.long_name;
        }
        if (types.includes("sublocality") || types.includes("neighborhood")) {
          newAddress.neighborhood = component.long_name;
        }
        if (types.includes("administrative_area_level_2")) {
          newAddress.city = component.long_name;
        }
        if (types.includes("administrative_area_level_1")) {
          newAddress.state = component.short_name;
        }
        if (types.includes("postal_code")) {
          newAddress.zip_code = component.long_name;
        }
      });

      onChange(newAddress);
    });

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [isLoaded, onChange]);

  const displayValue = value.street 
    ? `${value.street}${value.number ? `, ${value.number}` : ""} - ${value.neighborhood}, ${value.city} - ${value.state}`
    : "";

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="address-search">
          <MapPin className="w-4 h-4 inline mr-2" />
          Buscar Endereço *
        </Label>
        <Input
          id="address-search"
          ref={inputRef}
          type="text"
          placeholder={!import.meta.env.VITE_GOOGLE_PLACES_API_KEY ? "Preencha os campos abaixo manualmente" : "Digite o endereço completo"}
          disabled={disabled}
          defaultValue={displayValue}
        />
        {!isLoaded && import.meta.env.VITE_GOOGLE_PLACES_API_KEY && (
          <p className="text-sm text-muted-foreground">Carregando Google Maps...</p>
        )}
        {!import.meta.env.VITE_GOOGLE_PLACES_API_KEY && (
          <p className="text-sm text-amber-600">
            Configure a Google Places API key no arquivo .env para habilitar a busca automática de endereços
          </p>
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
