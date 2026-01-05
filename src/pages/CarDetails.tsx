import { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { useVehicle } from "@/hooks/useVehicles";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowLeft,
  Star,
  MapPin,
  Users,
  Fuel,
  Settings,
  Calendar as CalendarIcon,
  Shield,
  
  Share2,
  CheckCircle2,
  CalendarDays,
  Gauge,
  Car,
  Palette,
  FileText,
  ShieldCheck,
  Thermometer,
  Radio,
  Cog,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { FavoriteButton } from "@/components/FavoriteButton";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useVehicleBookings, getDisabledDates, isDateRangeAvailable } from "@/hooks/useVehicleBookings";
import { formatCurrencyBRL } from "@/lib/validators";
import { useOwnerReviews } from "@/hooks/useReviews";
import { OwnerReputationModal } from "@/components/reviews/OwnerReputationModal";

const CarDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [mainImage, setMainImage] = useState(0);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [startTime, setStartTime] = useState("10:00");
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [endTime, setEndTime] = useState("10:00");
  const [showReputationModal, setShowReputationModal] = useState(false);

  // Generate time options from 06:00 to 22:00 in 30-minute intervals
  const timeOptions = [];
  for (let hour = 6; hour <= 22; hour++) {
    timeOptions.push(`${hour.toString().padStart(2, '0')}:00`);
    if (hour < 22) {
      timeOptions.push(`${hour.toString().padStart(2, '0')}:30`);
    }
  }

  // Pre-fill dates from search params
  useEffect(() => {
    const fromDateParam = searchParams.get("from");
    const untilDateParam = searchParams.get("until");
    const fromTimeParam = searchParams.get("fromTime");
    const untilTimeParam = searchParams.get("untilTime");

    if (fromDateParam) {
      setStartDate(new Date(fromDateParam + "T00:00:00"));
    }
    if (untilDateParam) {
      setEndDate(new Date(untilDateParam + "T00:00:00"));
    }
    if (fromTimeParam) {
      setStartTime(fromTimeParam);
    }
    if (untilTimeParam) {
      setEndTime(untilTimeParam);
    }
  }, [searchParams]);

  const { data: vehicle, isLoading } = useVehicle(id || "");
  const { data: vehicleBookings } = useVehicleBookings(id || "");
  
  // Fetch owner reviews
  const ownerId = vehicle?.owner_id || "";
  const { data: ownerStats } = useOwnerReviews(ownerId);
  
  // Get all disabled dates from existing bookings
  const disabledDates = getDisabledDates(vehicleBookings);
  
  // Function to check if a date is disabled
  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Disable past dates
    if (date < today) return true;
    
    // Disable booked dates
    return disabledDates.some(
      (disabled) =>
        disabled.getFullYear() === date.getFullYear() &&
        disabled.getMonth() === date.getMonth() &&
        disabled.getDate() === date.getDate()
    );
  };
  

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-24 pb-20 flex items-center justify-center">
          <p className="text-muted-foreground">Carregando...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-24 pb-20 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Veículo não encontrado</p>
            <Button asChild>
              <Link to="/browse">Voltar para busca</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const images = vehicle.vehicle_images?.sort((a, b) => a.display_order - b.display_order).map(img => img.image_url) || [];
  const owner = vehicle.profiles as any;
  const address = vehicle.addresses as any;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 pt-20 sm:pt-24 pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Button
            variant="ghost"
            className="mb-4 sm:mb-6 -ml-2"
            size="sm"
            asChild
          >
            <Link to="/browse">
              <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="text-sm">Voltar</span>
            </Link>
          </Button>

          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6 sm:space-y-8">
              {/* Images Gallery */}
              <div className="space-y-3 sm:space-y-4">
                <div className="relative h-[280px] sm:h-[400px] lg:h-[500px] rounded-xl sm:rounded-2xl overflow-hidden">
                  <img
                    src={images[mainImage] || "https://images.unsplash.com/photo-1590362891991-f776e747a588"}
                    alt={`${vehicle.brand} ${vehicle.model}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 sm:top-4 right-3 sm:right-4 flex gap-2">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="backdrop-blur-sm bg-background/80 w-8 h-8 sm:w-10 sm:h-10"
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                    <FavoriteButton 
                      vehicleId={vehicle.id} 
                      size="md" 
                      variant="overlay"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 sm:gap-3">
                  {images.slice(0, 4).map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setMainImage(index)}
                      className={`relative h-16 sm:h-24 rounded-lg overflow-hidden border-2 transition-all ${
                        mainImage === index
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${vehicle.brand} ${vehicle.model} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Car Info */}
              <div>
                <div className="mb-4">
                  <Badge className="mb-2 sm:mb-3 capitalize text-xs">{vehicle.vehicle_type}</Badge>
                  <h1 className="font-display text-xl sm:text-3xl lg:text-4xl font-bold mb-2">
                    {vehicle.brand} {vehicle.model} {vehicle.year}
                  </h1>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-muted-foreground text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-accent text-accent" />
                      <span className="font-semibold text-foreground">
                        {ownerStats?.total_reviews && ownerStats.total_reviews > 0 
                          ? ownerStats.average_rating.toFixed(1) 
                          : "Novo"}
                      </span>
                      <span className="text-xs sm:text-sm">
                        ({ownerStats?.total_reviews || 0} {ownerStats?.total_reviews === 1 ? "avaliação" : "avaliações"})
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="text-xs sm:text-sm truncate">
                        {address 
                          ? `${address.neighborhood}, ${address.city} - ${address.state}` 
                          : (vehicle.city && vehicle.state 
                              ? `${vehicle.city} - ${vehicle.state}` 
                              : "Localização não informada")}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator className="my-4 sm:my-6" />

                {/* Specs */}
                <div>
                  <h2 className="font-bold text-lg sm:text-xl mb-3 sm:mb-4">Especificações</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
                    <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-muted/50">
                      <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm text-muted-foreground">Ano</div>
                        <div className="font-semibold text-sm sm:text-base">{vehicle.ano_modelo || vehicle.year}</div>
                      </div>
                    </div>
                    {vehicle.ano_fabricacao && (
                      <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-muted/50">
                        <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm text-muted-foreground">Fabricação</div>
                          <div className="font-semibold text-sm sm:text-base">{vehicle.ano_fabricacao}</div>
                        </div>
                      </div>
                    )}
                    {vehicle.versao && (
                      <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-muted/50">
                        <Car className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm text-muted-foreground">Versão</div>
                          <div className="font-semibold text-sm sm:text-base truncate">{vehicle.versao}</div>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-muted/50">
                      <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm text-muted-foreground">Câmbio</div>
                        <div className="font-semibold text-sm sm:text-base capitalize">{vehicle.transmission_type}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-muted/50">
                      <Fuel className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm text-muted-foreground">Combustível</div>
                        <div className="font-semibold text-sm sm:text-base capitalize">{vehicle.fuel_type}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-muted/50">
                      <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm text-muted-foreground">Passageiros</div>
                        <div className="font-semibold text-sm sm:text-base">{vehicle.seats}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-muted/50">
                      <Car className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm text-muted-foreground">Portas</div>
                        <div className="font-semibold text-sm sm:text-base">{vehicle.doors}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-muted/50">
                      <Palette className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm text-muted-foreground">Cor</div>
                        <div className="font-semibold text-sm sm:text-base capitalize">{vehicle.color}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-muted/50">
                      <Gauge className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm text-muted-foreground">KM</div>
                        <div className="font-semibold text-sm sm:text-base">{vehicle.mileage?.toLocaleString('pt-BR')}</div>
                      </div>
                    </div>
                    {vehicle.motor && (
                      <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-muted/50">
                        <Cog className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm text-muted-foreground">Motor</div>
                          <div className="font-semibold text-sm sm:text-base">{vehicle.motor}</div>
                        </div>
                      </div>
                    )}
                    {vehicle.direcao && (
                      <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-muted/50">
                        <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm text-muted-foreground">Direção</div>
                          <div className="font-semibold text-sm sm:text-base capitalize">{vehicle.direcao}</div>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-muted/50">
                      <Car className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm text-muted-foreground">Tipo</div>
                        <div className="font-semibold text-sm sm:text-base capitalize">{vehicle.vehicle_type}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Caução */}
                {vehicle.caucao && vehicle.caucao > 0 && (
                  <>
                    <Separator className="my-6" />
                    <div>
                      <h2 className="font-bold text-xl mb-4">Caução</h2>
                      <div className="p-4 rounded-xl bg-muted/50">
                        <span className="text-lg font-semibold text-primary">{formatCurrencyBRL(vehicle.caucao)}</span>
                        <p className="text-sm text-muted-foreground mt-1">Valor de caução requerido pelo proprietário</p>
                      </div>
                    </div>
                  </>
                )}

                <Separator className="my-4 sm:my-6" />

                {/* Description */}
                <div>
                  <h2 className="font-bold text-base sm:text-xl mb-2 sm:mb-4">Descrição</h2>
                  <p className="text-xs sm:text-base text-muted-foreground leading-relaxed">
                    {vehicle.description || "Nenhuma descrição disponível."}
                  </p>
                </div>

                {/* Rules */}
                {vehicle.regras && (
                  <>
                    <Separator className="my-4 sm:my-6" />
                    <div>
                      <h2 className="font-bold text-base sm:text-xl mb-2 sm:mb-4">Regras de Uso</h2>
                      <p className="text-xs sm:text-base text-muted-foreground leading-relaxed whitespace-pre-line">
                        {vehicle.regras}
                      </p>
                    </div>
                  </>
                )}

                <Separator className="my-4 sm:my-6" />

                {/* Safety Accessories */}
                <div>
                  <h2 className="font-bold text-base sm:text-xl mb-3 sm:mb-4 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                    Segurança
                  </h2>
                  <div className="grid grid-cols-1 gap-2">
                    {vehicle.airbag_frontal && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary shrink-0" />
                        <span>Airbag Frontal</span>
                      </div>
                    )}
                    {vehicle.airbag_lateral && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary shrink-0" />
                        <span>Airbag Lateral</span>
                      </div>
                    )}
                    {vehicle.freios_abs && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary shrink-0" />
                        <span>Freios ABS</span>
                      </div>
                    )}
                    {vehicle.controle_tracao && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary shrink-0" />
                        <span>Controle de Tração</span>
                      </div>
                    )}
                    {vehicle.controle_estabilidade && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary shrink-0" />
                        <span>Controle de Estabilidade</span>
                      </div>
                    )}
                    {vehicle.camera_re && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary shrink-0" />
                        <span>Câmera de Ré</span>
                      </div>
                    )}
                    {vehicle.sensor_estacionamento && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary shrink-0" />
                        <span>Sensor de Estacionamento</span>
                      </div>
                    )}
                    {vehicle.alarme && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary shrink-0" />
                        <span>Alarme</span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator className="my-4 sm:my-6" />

                {/* Comfort Accessories */}
                <div>
                  <h2 className="font-bold text-base sm:text-xl mb-3 sm:mb-4 flex items-center gap-2">
                    <Thermometer className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                    Conforto
                  </h2>
                  <div className="grid grid-cols-1 gap-2">
                    {vehicle.has_air_conditioning && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary shrink-0" />
                        <span>Ar-condicionado</span>
                      </div>
                    )}
                    {vehicle.ar_digital && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary shrink-0" />
                        <span>Ar Digital</span>
                      </div>
                    )}
                    {vehicle.direcao_hidraulica && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary shrink-0" />
                        <span>Direção Hidráulica</span>
                      </div>
                    )}
                    {vehicle.direcao_eletrica && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary shrink-0" />
                        <span>Direção Elétrica</span>
                      </div>
                    )}
                    {vehicle.vidros_eletricos && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary shrink-0" />
                        <span>Vidros Elétricos</span>
                      </div>
                    )}
                    {vehicle.retrovisores_eletricos && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary shrink-0" />
                        <span>Retrovisores Elétricos</span>
                      </div>
                    )}
                    {vehicle.banco_couro && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary shrink-0" />
                        <span>Banco de Couro</span>
                      </div>
                    )}
                    {vehicle.banco_eletrico && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary shrink-0" />
                        <span>Banco Elétrico</span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator className="my-4 sm:my-6" />

                {/* Technology Accessories */}
                <div>
                  <h2 className="font-bold text-base sm:text-xl mb-3 sm:mb-4 flex items-center gap-2">
                    <Radio className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                    Tecnologia
                  </h2>
                  <div className="grid grid-cols-1 gap-2">
                    {vehicle.multimidia && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary shrink-0" />
                        <span>Multimídia</span>
                      </div>
                    )}
                    {vehicle.bluetooth && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary shrink-0" />
                        <span>Bluetooth</span>
                      </div>
                    )}
                    {vehicle.android_auto && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary shrink-0" />
                        <span>Android Auto</span>
                      </div>
                    )}
                    {vehicle.apple_carplay && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary shrink-0" />
                        <span>Apple CarPlay</span>
                      </div>
                    )}
                    {vehicle.gps && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary shrink-0" />
                        <span>GPS</span>
                      </div>
                    )}
                    {vehicle.wifi && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary shrink-0" />
                        <span>Wi-Fi</span>
                      </div>
                    )}
                    {vehicle.entrada_usb && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary shrink-0" />
                        <span>Entrada USB</span>
                      </div>
                    )}
                    {vehicle.carregador_inducao && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary shrink-0" />
                        <span>Carregador Indução</span>
                      </div>
                    )}
                    {vehicle.piloto_automatico && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary shrink-0" />
                        <span>Piloto Automático</span>
                      </div>
                    )}
                    {vehicle.start_stop && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary shrink-0" />
                        <span>Start/Stop</span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator className="my-4 sm:my-6" />

                {/* Exterior Accessories */}
                <div>
                  <h2 className="font-bold text-base sm:text-xl mb-3 sm:mb-4 flex items-center gap-2">
                    <Car className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                    Exterior
                  </h2>
                  <div className="grid grid-cols-1 gap-2">
                    {vehicle.rodas_liga_leve && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary shrink-0" />
                        <span>Rodas Liga Leve</span>
                      </div>
                    )}
                    {vehicle.farol_led && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary shrink-0" />
                        <span>Farol LED</span>
                      </div>
                    )}
                    {vehicle.farol_milha && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary shrink-0" />
                        <span>Farol de Milha</span>
                      </div>
                    )}
                    {vehicle.rack_teto && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary shrink-0" />
                        <span>Rack de Teto</span>
                      </div>
                    )}
                    {vehicle.engate && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary shrink-0" />
                        <span>Engate</span>
                      </div>
                    )}
                    {vehicle.sensor_chuva && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary shrink-0" />
                        <span>Sensor de Chuva</span>
                      </div>
                    )}
                    {vehicle.sensor_crepuscular && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary shrink-0" />
                        <span>Sensor Crepuscular</span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator className="my-4 sm:my-6" />

                {/* Other Accessories */}
                <div>
                  <h2 className="font-bold text-base sm:text-xl mb-3 sm:mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                    Outros
                  </h2>
                  <div className="grid grid-cols-1 gap-2">
                    {vehicle.chave_reserva && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary shrink-0" />
                        <span>Chave Reserva</span>
                      </div>
                    )}
                    {vehicle.manual_veiculo && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary shrink-0" />
                        <span>Manual do Veículo</span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator className="my-4 sm:my-6" />

                {/* Owner Info */}
                <div>
                  <h2 className="font-bold text-base sm:text-xl mb-3 sm:mb-4">Proprietário</h2>
                  <Card>
                    <CardContent className="p-3 sm:p-6">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <Avatar className="w-10 h-10 sm:w-16 sm:h-16 shrink-0">
                          <AvatarImage src={owner?.profile_image || undefined} />
                          <AvatarFallback className="text-sm sm:text-base">
                            {owner?.first_name?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-sm sm:text-lg truncate">
                            {owner?.first_name} {owner?.last_name}
                          </h3>
                          <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground flex-wrap">
                            <div className="flex items-center gap-0.5 sm:gap-1">
                              <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-accent text-accent" />
                              <span>{ownerStats?.average_rating.toFixed(1) || "0.0"}</span>
                            </div>
                            <span>•</span>
                            <span>{ownerStats?.total_reviews || 0} aval.</span>
                            <span>•</span>
                            <span>{ownerStats?.total_trips || 0} viagens</span>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="shrink-0 text-xs sm:text-sm px-2 sm:px-4"
                          onClick={() => setShowReputationModal(true)}
                        >
                          <Star className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                          <span className="hidden sm:inline">Ver Reputação</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Owner Reputation Modal */}
                <OwnerReputationModal
                  open={showReputationModal}
                  onOpenChange={setShowReputationModal}
                  ownerId={vehicle.owner_id}
                  ownerName={`${owner?.first_name || ""} ${owner?.last_name || ""}`}
                  ownerImage={owner?.profile_image}
                />
              </div>
            </div>

            {/* Booking Card - Sticky */}
            <div className="lg:sticky lg:top-24 h-fit order-first lg:order-none">
              <Card className="border-2 shadow-xl">
                <CardContent className="p-4 sm:p-6">
                  <div className="mb-4 sm:mb-6">
                    <div className="flex items-baseline gap-2 mb-1 sm:mb-2">
                      <span className="text-2xl sm:text-4xl font-display font-bold text-primary">
                        {formatCurrencyBRL(vehicle.daily_price)}
                      </span>
                      <span className="text-muted-foreground text-sm sm:text-base">/dia</span>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      * Valor pode variar conforme o período
                    </p>
                  </div>

                  <div className="space-y-4 mb-6">
                    {/* Pickup - Data e Hora */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Retirada
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Data</label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "h-11 w-full justify-start text-left font-normal",
                                  !startDate && "text-muted-foreground"
                                )}
                              >
                                <CalendarDays className="mr-2 h-4 w-4" />
                                {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={startDate}
                                onSelect={(date) => {
                                  setStartDate(date);
                                  // Reset end date if it's before new start date
                                  if (date && endDate && endDate < date) {
                                    setEndDate(undefined);
                                  }
                                }}
                                disabled={isDateDisabled}
                                initialFocus
                                locale={ptBR}
                                className="pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Hora</label>
                          <select
                            className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                          >
                            {timeOptions.map((time) => (
                              <option key={`start-${time}`} value={time}>
                                {time}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Return - Data e Hora */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Devolução
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Data</label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "h-11 w-full justify-start text-left font-normal",
                                  !endDate && "text-muted-foreground"
                                )}
                              >
                                <CalendarDays className="mr-2 h-4 w-4" />
                                {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={endDate}
                                onSelect={setEndDate}
                                disabled={(date) => {
                                  // Disable if before start date
                                  if (startDate && date < startDate) return true;
                                  // Also disable booked dates
                                  return isDateDisabled(date);
                                }}
                                initialFocus
                                locale={ptBR}
                                className="pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Hora</label>
                          <select
                            className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                          >
                            {timeOptions.map((time) => (
                              <option key={`end-${time}`} value={time}>
                                {time}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {startDate && endDate && (
                    <div className="space-y-3 mb-6 p-4 bg-muted/50 rounded-xl">
                      {(() => {
                        // Calculate full days
                        const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                        
                        // Calculate extra hours if return time > pickup time
                        const [startHour, startMinute] = startTime.split(':').map(Number);
                        const [endHour, endMinute] = endTime.split(':').map(Number);
                        const startMinutes = startHour * 60 + startMinute;
                        const endMinutes = endHour * 60 + endMinute;
                        
                        let extraHoursCharge = 0;
                        let extraHours = 0;
                        
                        // Only charge extra if return time is later than pickup time
                        if (endMinutes > startMinutes) {
                          extraHours = (endMinutes - startMinutes) / 60;
                          // Calculate proportional daily rate for extra hours (hourly = daily / 24)
                          const hourlyRate = vehicle.daily_price / 24;
                          extraHoursCharge = hourlyRate * extraHours;
                        }
                        
                        const subtotal = vehicle.daily_price * days + extraHoursCharge;
                        const insurance = days * 20;
                        const total = subtotal + insurance;

                        // Check for date conflicts
                        const hasConflict = !isDateRangeAvailable(startDate, endDate, vehicleBookings);

                        return (
                          <>
                            {hasConflict && (
                              <div className="text-destructive text-sm font-medium mb-2 p-2 bg-destructive/10 rounded-lg">
                                ⚠️ O período selecionado conflita com uma reserva existente
                              </div>
                            )}
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                {formatCurrencyBRL(vehicle.daily_price)} x {days} {days === 1 ? 'dia' : 'dias'}
                              </span>
                              <span className="font-semibold">{formatCurrencyBRL(vehicle.daily_price * days)}</span>
                            </div>
                            {extraHoursCharge > 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                  Horas adicionais ({extraHours.toFixed(1)}h)
                                </span>
                                <span className="font-semibold">{formatCurrencyBRL(extraHoursCharge)}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Seguro</span>
                              <span className="font-semibold">{formatCurrencyBRL(insurance)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-bold">
                              <span>Total</span>
                              <span className="text-primary text-lg">{formatCurrencyBRL(total)}</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}

                  <Button
                    size="lg"
                    className="w-full gradient-accent text-accent-foreground hover:opacity-90 transition-smooth mb-4"
                    onClick={() => {
                      if (!user) {
                        navigate("/auth");
                        return;
                      }
                      if (!startDate || !endDate) {
                        toast.error("Selecione as datas de retirada e devolução");
                        return;
                      }

                      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                      if (days <= 0) {
                        toast.error("A data de devolução deve ser posterior à data de retirada");
                        return;
                      }

                      // Check for booking conflicts
                      if (!isDateRangeAvailable(startDate, endDate, vehicleBookings)) {
                        toast.error("O período selecionado conflita com uma reserva existente. Escolha outras datas.");
                        return;
                      }

                      // Format dates as ISO strings for URL
                      const formattedStartDate = format(startDate, "yyyy-MM-dd");
                      const formattedEndDate = format(endDate, "yyyy-MM-dd");

                      // Navigate to checkout with booking data including time
                      navigate(`/checkout?vehicleId=${vehicle.id}&startDate=${formattedStartDate}&startTime=${startTime}&endDate=${formattedEndDate}&endTime=${endTime}`);
                    }}
                    disabled={!startDate || !endDate || (startDate && endDate && !isDateRangeAvailable(startDate, endDate, vehicleBookings))}
                  >
                    {!user ? "Faça login para reservar" : "Reservar Agora"}
                  </Button>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
                    <Shield className="w-4 h-4 text-secondary" />
                    <span>Pagamento seguro e protegido</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CarDetails;
