import { useState } from "react";
import { Link } from "react-router-dom";
import { Star, Users, DoorOpen, Gauge, Snowflake, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FavoriteButton } from "@/components/FavoriteButton";
import { formatCurrencyBRL } from "@/lib/validators";
import { Vehicle } from "@/hooks/useVehicles";

interface VehicleCardProps {
  vehicle: Vehicle;
  linkParams?: string;
}

export const VehicleCard = ({ vehicle, linkParams }: VehicleCardProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const images = vehicle.vehicle_images?.sort((a, b) => {
    if (a.is_primary) return -1;
    if (b.is_primary) return 1;
    return a.display_order - b.display_order;
  }) || [];
  
  const imageUrls = images.length > 0 
    ? images.map(img => img.image_url) 
    : ["https://images.unsplash.com/photo-1590362891991-f776e747a588"];

  const location = vehicle.city && vehicle.state 
    ? `${vehicle.city}, ${vehicle.state}` 
    : "Localização não informada";

  const carLink = `/cars/${vehicle.id}${linkParams ? `?${linkParams}` : ""}`;

  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex(prev => prev === 0 ? imageUrls.length - 1 : prev - 1);
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex(prev => prev === imageUrls.length - 1 ? 0 : prev + 1);
  };

  const handleDotClick = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex(index);
  };

  const translateTransmission = (type: string) => {
    const translations: Record<string, string> = {
      automatic: 'Automático',
      manual: 'Manual',
      cvt: 'CVT'
    };
    return translations[type] || type;
  };

  const translateFuel = (type: string) => {
    const translations: Record<string, string> = {
      flex: 'Flex',
      gasoline: 'Gasolina',
      ethanol: 'Etanol',
      diesel: 'Diesel',
      electric: 'Elétrico',
      hybrid: 'Híbrido'
    };
    return translations[type] || type;
  };

  return (
    <Link to={carLink}>
      <Card className="overflow-hidden group hover:shadow-xl transition-smooth border-2 hover:border-primary h-full">
        {/* Image Carousel */}
        <div className="relative h-52 overflow-hidden">
          {/* Images */}
          <div className="relative w-full h-full">
            {imageUrls.map((url, index) => (
              <img
                key={index}
                src={url}
                alt={`${vehicle.brand} ${vehicle.model} - Foto ${index + 1}`}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                  index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                }`}
              />
            ))}
          </div>

          {/* Navigation Arrows */}
          {imageUrls.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background shadow-md"
                aria-label="Foto anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background shadow-md"
                aria-label="Próxima foto"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Dots Indicator */}
          {imageUrls.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {imageUrls.slice(0, 5).map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => handleDotClick(e, index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentImageIndex 
                      ? 'bg-white w-4' 
                      : 'bg-white/60 hover:bg-white/80'
                  }`}
                  aria-label={`Ir para foto ${index + 1}`}
                />
              ))}
              {imageUrls.length > 5 && (
                <span className="text-white text-xs font-medium ml-1">+{imageUrls.length - 5}</span>
              )}
            </div>
          )}

          {/* Vehicle Type Badge */}
          <Badge className="absolute top-3 left-3 bg-background/90 backdrop-blur capitalize text-xs font-medium">
            {vehicle.vehicle_type}
          </Badge>

          {/* Favorite Button */}
          <FavoriteButton 
            vehicleId={vehicle.id} 
            size="sm" 
            variant="overlay"
            className="absolute top-3 right-3"
          />
        </div>

        <CardContent className="p-4">
          {/* Header: Title + Rating */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-bold text-lg leading-tight line-clamp-1">
              {vehicle.brand} {vehicle.model} {vehicle.year}
            </h3>
            {vehicle.average_rating && (
              <div className="flex items-center gap-1 shrink-0">
                <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                <span className="font-semibold text-sm">{vehicle.average_rating}</span>
                <span className="text-muted-foreground text-xs">({vehicle.total_reviews})</span>
              </div>
            )}
          </div>
          
          {/* Location */}
          <div className="flex items-center gap-1 text-muted-foreground text-sm mb-3">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            <span className="truncate">{location}</span>
          </div>

          {/* Vehicle specs */}
          <div className="grid grid-cols-4 gap-2 mb-3 py-2 border-y border-border/50">
            <div className="flex flex-col items-center text-center">
              <Users className="w-4 h-4 text-muted-foreground mb-1" />
              <span className="text-xs text-muted-foreground">{vehicle.seats}</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <DoorOpen className="w-4 h-4 text-muted-foreground mb-1" />
              <span className="text-xs text-muted-foreground">{vehicle.doors}p</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <Gauge className="w-4 h-4 text-muted-foreground mb-1" />
              <span className="text-xs text-muted-foreground">{(vehicle.mileage / 1000).toFixed(0)}k</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <Snowflake className={`w-4 h-4 mb-1 ${vehicle.has_air_conditioning ? 'text-primary' : 'text-muted-foreground/40'}`} />
              <span className={`text-xs ${vehicle.has_air_conditioning ? 'text-muted-foreground' : 'text-muted-foreground/40'}`}>
                {vehicle.has_air_conditioning ? 'A/C' : 'S/AC'}
              </span>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            <Badge variant="secondary" className="text-xs capitalize px-2 py-0.5">
              {translateTransmission(vehicle.transmission_type)}
            </Badge>
            <Badge variant="secondary" className="text-xs capitalize px-2 py-0.5">
              {translateFuel(vehicle.fuel_type)}
            </Badge>
            <Badge variant="outline" className="text-xs capitalize px-2 py-0.5 border-muted-foreground/30">
              {vehicle.color}
            </Badge>
          </div>

          {/* Price + CTA */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <span className="text-xl font-bold text-primary">
                {formatCurrencyBRL(vehicle.daily_price)}
              </span>
              <span className="text-muted-foreground text-sm">/dia</span>
            </div>
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm px-4">
              Ver Detalhes
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
