import { useState } from "react";
import { Link } from "react-router-dom";
import { Star, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { FavoriteButton } from "@/components/FavoriteButton";
import { formatCurrencyBRL } from "@/lib/validators";
import { translateTransmission } from "@/lib/translations";
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
    : "";

  const carLink = `/cars/${vehicle.id}${linkParams ? `?${linkParams}` : ""}`;

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
    if (distance > minSwipeDistance && imageUrls.length > 1) {
      setCurrentImageIndex(prev => prev === imageUrls.length - 1 ? 0 : prev + 1);
    }
    if (distance < -minSwipeDistance && imageUrls.length > 1) {
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
    <Link to={carLink} className="group block">
      {/* Image Carousel - Airbnb rounded style */}
      <div
        className="relative aspect-[4/3] rounded-xl overflow-hidden mb-2.5"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
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
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-background/90 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background hover:scale-105 shadow-sm"
              aria-label="Foto anterior"
            >
              <ChevronLeft className="w-4 h-4 text-foreground" />
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-background/90 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background hover:scale-105 shadow-sm"
              aria-label="Próxima foto"
            >
              <ChevronRight className="w-4 h-4 text-foreground" />
            </button>
          </>
        )}

        {/* Dots Indicator */}
        {imageUrls.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {imageUrls.slice(0, 5).map((_, index) => (
              <button
                key={index}
                onClick={(e) => handleDotClick(e, index)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  index === currentImageIndex
                    ? 'bg-background w-2'
                    : 'bg-background/60'
                }`}
                aria-label={`Ir para foto ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Favorite Button */}
        <FavoriteButton
          vehicleId={vehicle.id}
          size="sm"
          variant="overlay"
          className="absolute top-2.5 right-2.5"
        />
      </div>

      {/* Info - Airbnb compact style */}
      <div className="space-y-0.5">
        <div className="flex items-start justify-between gap-1">
          <h3 className="font-semibold text-[15px] text-foreground leading-tight">
            {vehicle.brand} {vehicle.model}
          </h3>
          {vehicle.average_rating && (
            <div className="flex items-center gap-0.5 shrink-0">
              <Star className="w-3.5 h-3.5 fill-foreground text-foreground" />
              <span className="text-sm font-medium">{vehicle.average_rating}</span>
            </div>
          )}
        </div>

        <p className="text-sm text-muted-foreground">
          {vehicle.year} · {translateTransmission(vehicle.transmission_type)}
        </p>

        {location && (
          <p className="text-sm text-muted-foreground">{location}</p>
        )}

        <div className="pt-1">
          {appDriverMode ? (
            <div className="flex flex-col gap-0.5">
              {(vehicle.app_driver_weekly_price ?? 0) > 0 && (
                <p className="text-[15px]">
                  <span className="font-semibold">{formatCurrencyBRL(vehicle.app_driver_weekly_price!)}</span>
                  <span className="text-muted-foreground font-normal"> /semana</span>
                </p>
              )}
              {(vehicle.app_driver_monthly_price ?? 0) > 0 && (
                <p className="text-[15px]">
                  <span className="font-semibold">{formatCurrencyBRL(vehicle.app_driver_monthly_price!)}</span>
                  <span className="text-muted-foreground font-normal"> /mês</span>
                </p>
              )}
            </div>
          ) : (
            <p className="text-[15px]">
              <span className="font-semibold">{formatCurrencyBRL(vehicle.daily_price)}</span>
              <span className="text-muted-foreground font-normal"> /dia</span>
            </p>
          )}
        </div>
      </div>
    </Link>
  );
};
