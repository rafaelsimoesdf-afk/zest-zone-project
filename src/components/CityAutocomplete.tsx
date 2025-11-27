import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";

interface CityAutocompleteProps {
  value: string;
  onChange: (city: string) => void;
  placeholder?: string;
  className?: string;
}

export const CityAutocomplete = ({ value, onChange, placeholder = "Cidade ou endereço...", className }: CityAutocompleteProps) => {
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
        console.error("Google Places API key not found");
        setIsLoaded(true); // Allow input even without API
        return;
      }

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=pt-BR`;
      script.async = true;
      script.defer = true;
      script.onload = () => setIsLoaded(true);
      script.onerror = () => {
        console.error("Failed to load Google Maps");
        setIsLoaded(true); // Allow input even if API fails
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
      fields: ["address_components", "formatted_address"],
      types: ["(cities)"],
    });

    // Handle place selection
    autocompleteRef.current.addListener("place_changed", () => {
      const place = autocompleteRef.current?.getPlace();
      if (!place?.address_components) return;

      const addressComponents = place.address_components;
      let cityName = "";
      let stateName = "";

      addressComponents.forEach((component) => {
        const types = component.types;
        
        if (types.includes("administrative_area_level_2")) {
          cityName = component.long_name;
        }
        if (types.includes("administrative_area_level_1")) {
          stateName = component.short_name;
        }
      });

      if (cityName) {
        onChange(stateName ? `${cityName}, ${stateName}` : cityName);
      }
    });

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [isLoaded, onChange]);

  return (
    <div className="relative">
      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
      <Input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={className}
      />
    </div>
  );
};
