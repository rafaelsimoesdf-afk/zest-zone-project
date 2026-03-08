import { useState } from "react";
import { Link } from "react-router-dom";
import { Star, Users, DoorOpen, Gauge, Snowflake, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FavoriteButton } from "@/components/FavoriteButton";
import { formatCurrencyBRL } from "@/lib/validators";
import { translateVehicleType, translateTransmission, translateFuel } from "@/lib/translations";
import { Vehicle } from "@/hooks/useVehicles";

interface VehicleCardProps {
  vehicle: Vehicle;
  linkParams?: string;
  appDriverMode?: boolean;
}

export const VehicleCard = ({ vehicle, linkParams, appDriverMode }: VehicleCardProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
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

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && imageUrls.length > 1) {
      setCurrentImageIndex(prev => prev === imageUrls.length - 1 ? 0 : prev + 1);
    }
    if (isRightSwipe && imageUrls.length > 1) {
      setCurrentImageIndex(prev => prev === 0 ? imageUrls.length - 1 : prev - 1);
    }
  };

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

  return (
    <Link to={carLink}>
      <Card className="overflow-hidden group hover:shadow-xl transition-smooth border hover:border-primary h-full bg-card">
        {/* Image Carousel */}
        <div 
          className="relative h-48 sm:h-52 overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
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

          {/* Navigation Arrows - only on desktop hover */}
          {imageUrls.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-1.5 sm:left-2 top-1/2 -translate-y-1/2 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background shadow-md"
                aria-label="Foto anterior"
              >
                <ChevronLeft className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background shadow-md"
                aria-label="Próxima foto"
              >
                <ChevronRight className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </button>
            </>
          )}

          {/* Dots Indicator */}
          {imageUrls.length > 1 && (
            <div className="absolute bottom-1.5 sm:bottom-3 left-1/2 -translate-x-1/2 flex gap-1 sm:gap-1.5">
              {imageUrls.slice(0, 5).map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => handleDotClick(e, index)}
                  className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all ${
                    index === currentImageIndex 
                      ? 'bg-white w-2.5 sm:w-4' 
                      : 'bg-white/60 hover:bg-white/80'
                  }`}
                  aria-label={`Ir para foto ${index + 1}`}
                />
              ))}
              {imageUrls.length > 5 && (
                <span className="text-white text-[9px] sm:text-xs font-medium ml-0.5 sm:ml-1">+{imageUrls.length - 5}</span>
              )}
            </div>
          )}

          {/* Vehicle Type Badge */}
          <Badge className="absolute top-1.5 left-1.5 sm:top-3 sm:left-3 bg-background/90 backdrop-blur text-[9px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5">
            {translateVehicleType(vehicle.vehicle_type)}
          </Badge>

          {/* Favorite Button */}
          <FavoriteButton 
            vehicleId={vehicle.id} 
            size="sm" 
            variant="overlay"
            className="absolute top-1.5 right-1.5 sm:top-3 sm:right-3"
          />
        </div>

        <CardContent className="p-2 sm:p-4">
          {/* Header: Title + Rating */}
          <div className="flex items-start justify-between gap-1 mb-1 sm:mb-2">
            <h3 className="font-bold text-xs sm:text-lg leading-tight line-clamp-1">
              {vehicle.brand} {vehicle.model}
            </h3>
            {vehicle.average_rating && (
              <div className="flex items-center gap-0.5 shrink-0">
                <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-yellow-500 text-yellow-500" />
                <span className="font-semibold text-[10px] sm:text-sm">{vehicle.average_rating}</span>
                <span className="text-muted-foreground text-[9px] sm:text-xs">({vehicle.total_reviews})</span>
              </div>
            )}
          </div>
          
          {/* Location */}
          <div className="flex items-center gap-0.5 sm:gap-1 text-muted-foreground text-[10px] sm:text-sm mb-1.5 sm:mb-3">
            <MapPin className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-primary shrink-0" />
            <span className="truncate">{location}</span>
          </div>

          {/* Vehicle specs */}
          <div className="grid grid-cols-4 gap-0.5 sm:gap-2 mb-1.5 sm:mb-3 py-1 sm:py-2 border-y border-border/50">
            <div className="flex flex-col items-center text-center">
              <Users className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-muted-foreground mb-0.5" />
              <span className="text-[9px] sm:text-xs text-muted-foreground">{vehicle.seats}</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <DoorOpen className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-muted-foreground mb-0.5" />
              <span className="text-[9px] sm:text-xs text-muted-foreground">{vehicle.doors}p</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <Gauge className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-muted-foreground mb-0.5" />
              <span className="text-[9px] sm:text-xs text-muted-foreground">{(vehicle.mileage / 1000).toFixed(0)}k</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <Snowflake className={`w-2.5 h-2.5 sm:w-4 sm:h-4 mb-0.5 ${vehicle.has_air_conditioning ? 'text-primary' : 'text-muted-foreground/40'}`} />
              <span className={`text-[9px] sm:text-xs ${vehicle.has_air_conditioning ? 'text-muted-foreground' : 'text-muted-foreground/40'}`}>
                A/C
              </span>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mb-1.5 sm:mb-3">
            <Badge variant="secondary" className="text-[9px] sm:text-xs capitalize px-1 sm:px-2 py-0 h-4 sm:h-5">
              {translateTransmission(vehicle.transmission_type)}
            </Badge>
            <Badge variant="secondary" className="text-[9px] sm:text-xs capitalize px-1 sm:px-2 py-0 h-4 sm:h-5">
              {translateFuel(vehicle.fuel_type)}
            </Badge>
            <Badge variant="outline" className="text-[9px] sm:text-xs capitalize px-1 sm:px-2 py-0 h-4 sm:h-5 border-muted-foreground/30 hidden sm:inline-flex">
              {vehicle.color}
            </Badge>
          </div>

          {/* Price + CTA */}
          <div className="flex items-center justify-between pt-0.5 sm:pt-2">
            <div>
              {appDriverMode ? (
                <div className="flex flex-col gap-0.5">
                  {(vehicle.app_driver_weekly_price ?? 0) > 0 && (
                    <div>
                      <span className="text-sm sm:text-xl font-bold text-primary">
                        {formatCurrencyBRL(vehicle.app_driver_weekly_price!)}
                      </span>
                      <span className="text-muted-foreground text-[9px] sm:text-sm">/semana</span>
                    </div>
                  )}
                  {(vehicle.app_driver_monthly_price ?? 0) > 0 && (
                    <div>
                      <span className="text-sm sm:text-xl font-bold text-primary">
                        {formatCurrencyBRL(vehicle.app_driver_monthly_price!)}
                      </span>
                      <span className="text-muted-foreground text-[9px] sm:text-sm">/mês</span>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <span className="text-sm sm:text-xl font-bold text-primary">
                    {formatCurrencyBRL(vehicle.daily_price)}
                  </span>
                  <span className="text-muted-foreground text-[9px] sm:text-sm">/dia</span>
                </>
              )}
            </div>
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 text-[10px] sm:text-sm px-2 sm:px-4 h-6 sm:h-9">
              Detalhes
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
