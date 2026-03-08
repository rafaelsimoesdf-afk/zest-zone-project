import { useState } from "react";
import { Link } from "react-router-dom";
import { Star, Users, DoorOpen, Gauge, Snowflake, MapPin, ChevronLeft, ChevronRight, Eye, ArrowLeftRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrencyBRL } from "@/lib/validators";
import { translateVehicleType, translateTransmission, translateFuel } from "@/lib/translations";
import { VehicleListing } from "@/hooks/useClassifieds";

const conditionLabels: Record<string, string> = {
  new: "Novo",
  "semi-new": "Seminovo",
  used: "Usado",
};

interface ClassifiedCardProps {
  listing: VehicleListing;
}

export const ClassifiedCard = ({ listing }: ClassifiedCardProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const images = listing.listing_images?.sort((a, b) => {
    if (a.is_primary) return -1;
    if (b.is_primary) return 1;
    return a.display_order - b.display_order;
  }) || [];

  const imageUrls = images.length > 0
    ? images.map(img => img.image_url)
    : ["https://images.unsplash.com/photo-1590362891991-f776e747a588"];

  const location = listing.city && listing.state
    ? `${listing.city}, ${listing.state}`
    : "Localização não informada";

  const minSwipeDistance = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const handleTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance && imageUrls.length > 1) setCurrentImageIndex(p => p === imageUrls.length - 1 ? 0 : p + 1);
    if (distance < -minSwipeDistance && imageUrls.length > 1) setCurrentImageIndex(p => p === 0 ? imageUrls.length - 1 : p - 1);
  };

  const handlePrevImage = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setCurrentImageIndex(p => p === 0 ? imageUrls.length - 1 : p - 1); };
  const handleNextImage = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setCurrentImageIndex(p => p === imageUrls.length - 1 ? 0 : p + 1); };
  const handleDotClick = (e: React.MouseEvent, i: number) => { e.preventDefault(); e.stopPropagation(); setCurrentImageIndex(i); };

  return (
    <Link to={`/classifieds/${listing.id}`}>
      <Card className="overflow-hidden group hover:shadow-xl transition-smooth border hover:border-primary h-full bg-card">
        <div
          className="relative h-48 sm:h-52 overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="relative w-full h-full">
            {imageUrls.map((url, index) => (
              <img
                key={index}
                src={url}
                alt={`${listing.brand} ${listing.model} - Foto ${index + 1}`}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'}`}
              />
            ))}
          </div>

          {imageUrls.length > 1 && (
            <>
              <button onClick={handlePrevImage} className="absolute left-1.5 sm:left-2 top-1/2 -translate-y-1/2 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background shadow-md" aria-label="Foto anterior">
                <ChevronLeft className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </button>
              <button onClick={handleNextImage} className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background shadow-md" aria-label="Próxima foto">
                <ChevronRight className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </button>
            </>
          )}

          {imageUrls.length > 1 && (
            <div className="absolute bottom-1.5 sm:bottom-3 left-1/2 -translate-x-1/2 flex gap-1 sm:gap-1.5">
              {imageUrls.slice(0, 5).map((_, index) => (
                <button key={index} onClick={(e) => handleDotClick(e, index)} className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all ${index === currentImageIndex ? 'bg-white w-2.5 sm:w-4' : 'bg-white/60 hover:bg-white/80'}`} aria-label={`Ir para foto ${index + 1}`} />
              ))}
              {imageUrls.length > 5 && <span className="text-white text-[9px] sm:text-xs font-medium ml-0.5 sm:ml-1">+{imageUrls.length - 5}</span>}
            </div>
          )}

          <Badge className="absolute top-1.5 left-1.5 sm:top-3 sm:left-3 bg-background/90 backdrop-blur text-[9px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5">
            {translateVehicleType(listing.vehicle_type)}
          </Badge>

          <Badge variant="secondary" className="absolute top-1.5 right-1.5 sm:top-3 sm:right-3 bg-primary/90 text-primary-foreground text-[9px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5">
            {conditionLabels[listing.condition] || listing.condition}
          </Badge>
        </div>

        <CardContent className="p-2 sm:p-4">
          <div className="flex items-start justify-between gap-1 mb-1 sm:mb-2">
            <h3 className="font-bold text-xs sm:text-lg leading-tight line-clamp-1">
              {listing.brand} {listing.model} {listing.year}
            </h3>
            <div className="flex items-center gap-0.5 shrink-0 text-muted-foreground">
              <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="text-[9px] sm:text-xs">{listing.views_count}</span>
            </div>
          </div>

          <div className="flex items-center gap-0.5 sm:gap-1 text-muted-foreground text-[10px] sm:text-sm mb-1.5 sm:mb-3">
            <MapPin className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-primary shrink-0" />
            <span className="truncate">{location}</span>
          </div>

          <div className="grid grid-cols-4 gap-0.5 sm:gap-2 mb-1.5 sm:mb-3 py-1 sm:py-2 border-y border-border/50">
            <div className="flex flex-col items-center text-center">
              <Users className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-muted-foreground mb-0.5" />
              <span className="text-[9px] sm:text-xs text-muted-foreground">{listing.seats}</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <DoorOpen className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-muted-foreground mb-0.5" />
              <span className="text-[9px] sm:text-xs text-muted-foreground">{listing.doors}p</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <Gauge className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-muted-foreground mb-0.5" />
              <span className="text-[9px] sm:text-xs text-muted-foreground">{(listing.mileage / 1000).toFixed(0)}k</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <Snowflake className={`w-2.5 h-2.5 sm:w-4 sm:h-4 mb-0.5 ${listing.has_air_conditioning ? 'text-primary' : 'text-muted-foreground/40'}`} />
              <span className={`text-[9px] sm:text-xs ${listing.has_air_conditioning ? 'text-muted-foreground' : 'text-muted-foreground/40'}`}>A/C</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1 mb-1.5 sm:mb-3">
            <Badge variant="secondary" className="text-[9px] sm:text-xs capitalize px-1 sm:px-2 py-0 h-4 sm:h-5">
              {translateTransmission(listing.transmission_type)}
            </Badge>
            <Badge variant="secondary" className="text-[9px] sm:text-xs capitalize px-1 sm:px-2 py-0 h-4 sm:h-5">
              {translateFuel(listing.fuel_type)}
            </Badge>
            {listing.accepts_trade && (
              <Badge variant="outline" className="text-[9px] sm:text-xs px-1 sm:px-2 py-0 h-4 sm:h-5 border-primary/50 text-primary">
                <ArrowLeftRight className="w-2.5 h-2.5 mr-0.5" />
                Aceita troca
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between pt-0.5 sm:pt-2">
            <div>
              <span className="text-sm sm:text-xl font-bold text-primary">
                {formatCurrencyBRL(listing.sale_price)}
              </span>
            </div>
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 text-[10px] sm:text-sm px-2 sm:px-4 h-6 sm:h-9">
              Ver Anúncio
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
