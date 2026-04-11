import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useListing, useListingMessages, useSendListingMessage, useUpdateListing, useDeleteListing } from "@/hooks/useClassifieds";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { formatCurrencyBRL } from "@/lib/validators";
import { translateVehicleType, translateTransmission, translateFuel } from "@/lib/translations";
import {
  ArrowLeft, MapPin, Eye, Phone, MessageSquare, Send, Users, DoorOpen, Gauge,
  Snowflake, Fuel, Settings, ArrowLeftRight, ChevronLeft, ChevronRight, Calendar,
  Trash2, Pause, Play, Car, Palette, Cog, Share2,
  ShieldCheck, Thermometer, Radio, FileText, CheckCircle2,
  CalendarIcon,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const conditionLabels: Record<string, string> = {
  new: "Novo",
  "semi-new": "Seminovo",
  used: "Usado",
};

const ClassifiedDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: listing, isLoading } = useListing(id || "");
  const updateListing = useUpdateListing();
  const deleteListing = useDeleteListing();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [chatMessage, setChatMessage] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isOwner = user?.id === listing?.seller_id;
  const sellerId = listing?.seller_id || "";

  const { data: messages } = useListingMessages(id || "", sellerId);
  const sendMessage = useSendListingMessage();

  const images = listing?.listing_images?.sort((a, b) => {
    if (a.is_primary) return -1;
    if (b.is_primary) return 1;
    return a.display_order - b.display_order;
  }) || [];

  const imageUrls = images.length > 0 ? images.map(img => img.image_url) : ["https://images.unsplash.com/photo-1590362891991-f776e747a588"];

  const vehicle = listing?.linked_vehicle;
  const minSwipeDistance = 50;

  const handleTouchStart = (e: React.TouchEvent) => { setTouchEnd(null); setTouchStart(e.targetTouches[0].clientX); };
  const handleTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance && imageUrls.length > 1) setCurrentImageIndex(p => p === imageUrls.length - 1 ? 0 : p + 1);
    if (distance < -minSwipeDistance && imageUrls.length > 1) setCurrentImageIndex(p => p === 0 ? imageUrls.length - 1 : p - 1);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !listing || !user) return;
    await sendMessage.mutateAsync({
      listingId: listing.id,
      receiverId: listing.seller_id,
      content: chatMessage.trim(),
    });
    setChatMessage("");
  };

  const handleWhatsApp = () => {
    if (!listing?.whatsapp_number) return;
    const phone = listing.whatsapp_number.replace(/\D/g, "");
    const message = encodeURIComponent(`Olá! Vi seu anúncio do ${listing.brand} ${listing.model} ${listing.year} por ${formatCurrencyBRL(listing.sale_price)} na InfiniteDrive e gostaria de mais informações.`);
    window.open(`https://wa.me/55${phone}?text=${message}`, "_blank");
  };

  const handleDelete = async () => {
    if (!listing) return;
    await deleteListing.mutateAsync(listing.id);
    navigate("/classifieds");
  };

  const handleToggleStatus = async () => {
    if (!listing) return;
    const newStatus = listing.status === "active" ? "paused" : "active";
    await updateListing.mutateAsync({ id: listing.id, status: newStatus });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col">
        <main className="flex-1 pt-24 flex items-center justify-center">
          <p className="text-muted-foreground">Carregando anúncio...</p>
        </main>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="flex flex-col">
        <main className="flex-1 pt-24 flex items-center justify-center">
          <p className="text-muted-foreground">Anúncio não encontrado.</p>
        </main>
      </div>
    );
  }

  const sellerProfile = listing.profiles;
  const sellerName = sellerProfile ? `${sellerProfile.first_name} ${sellerProfile.last_name}` : "Vendedor";

  // Helper to render accessory item
  const AccessoryItem = ({ label }: { label: string }) => (
    <div className="flex items-center gap-2 text-xs sm:text-sm">
      <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary shrink-0" />
      <span>{label}</span>
    </div>
  );

  // Build safety accessories list
  const safetyItems: string[] = [];
  if (vehicle?.airbag_frontal) safetyItems.push("Airbag Frontal");
  if (vehicle?.airbag_lateral) safetyItems.push("Airbag Lateral");
  if (vehicle?.freios_abs) safetyItems.push("Freios ABS");
  if (vehicle?.controle_tracao) safetyItems.push("Controle de Tração");
  if (vehicle?.controle_estabilidade) safetyItems.push("Controle de Estabilidade");
  if (vehicle?.camera_re) safetyItems.push("Câmera de Ré");
  if (vehicle?.sensor_estacionamento) safetyItems.push("Sensor de Estacionamento");
  if (vehicle?.alarme) safetyItems.push("Alarme");

  const comfortItems: string[] = [];
  if (listing.has_air_conditioning || vehicle?.has_air_conditioning) comfortItems.push("Ar-condicionado");
  if (vehicle?.ar_digital) comfortItems.push("Ar Digital");
  if (vehicle?.direcao_hidraulica) comfortItems.push("Direção Hidráulica");
  if (vehicle?.direcao_eletrica) comfortItems.push("Direção Elétrica");
  if (vehicle?.vidros_eletricos) comfortItems.push("Vidros Elétricos");
  if (vehicle?.retrovisores_eletricos) comfortItems.push("Retrovisores Elétricos");
  if (vehicle?.banco_couro) comfortItems.push("Banco de Couro");
  if (vehicle?.banco_eletrico) comfortItems.push("Banco Elétrico");

  const techItems: string[] = [];
  if (vehicle?.multimidia) techItems.push("Multimídia");
  if (vehicle?.bluetooth) techItems.push("Bluetooth");
  if (vehicle?.android_auto) techItems.push("Android Auto");
  if (vehicle?.apple_carplay) techItems.push("Apple CarPlay");
  if (vehicle?.gps) techItems.push("GPS");
  if (vehicle?.wifi) techItems.push("Wi-Fi");
  if (vehicle?.entrada_usb) techItems.push("Entrada USB");
  if (vehicle?.carregador_inducao) techItems.push("Carregador por Indução");
  if (vehicle?.piloto_automatico) techItems.push("Piloto Automático");
  if (vehicle?.start_stop) techItems.push("Start/Stop");

  const exteriorItems: string[] = [];
  if (vehicle?.rodas_liga_leve) exteriorItems.push("Rodas Liga Leve");
  if (vehicle?.farol_led) exteriorItems.push("Farol LED");
  if (vehicle?.farol_milha) exteriorItems.push("Farol de Milha");
  if (vehicle?.rack_teto) exteriorItems.push("Rack de Teto");
  if (vehicle?.engate) exteriorItems.push("Engate");
  if (vehicle?.sensor_chuva) exteriorItems.push("Sensor de Chuva");
  if (vehicle?.sensor_crepuscular) exteriorItems.push("Sensor Crepuscular");

  const otherItems: string[] = [];
  if (vehicle?.chave_reserva) otherItems.push("Chave Reserva");
  if (vehicle?.manual_veiculo) otherItems.push("Manual do Veículo");

  const hasAnyAccessory = safetyItems.length > 0 || comfortItems.length > 0 || techItems.length > 0 || exteriorItems.length > 0 || otherItems.length > 0;

  return (
    <div className="flex flex-col">
      <main className="flex-1 pt-20 sm:pt-24 pb-20">
        <div className="container mx-auto px-3 sm:px-6 lg:px-8">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4 -ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6 sm:space-y-8">
              {/* Image Gallery */}
              <div className="space-y-3 sm:space-y-4">
                <div
                  className="relative h-[280px] sm:h-[400px] lg:h-[500px] rounded-xl sm:rounded-2xl overflow-hidden"
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  {imageUrls.map((url, index) => (
                    <img
                      key={index}
                      src={url}
                      alt={`${listing.brand} ${listing.model} - Foto ${index + 1}`}
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'}`}
                    />
                  ))}

                  {imageUrls.length > 1 && (
                    <>
                      <button onClick={() => setCurrentImageIndex(p => p === 0 ? imageUrls.length - 1 : p - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur flex items-center justify-center hover:bg-background shadow-md">
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button onClick={() => setCurrentImageIndex(p => p === imageUrls.length - 1 ? 0 : p + 1)} className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur flex items-center justify-center hover:bg-background shadow-md">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  {/* Dots for mobile */}
                  {imageUrls.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 sm:hidden">
                      {imageUrls.slice(0, 6).map((_, index) => (
                        <button key={index} onClick={() => setCurrentImageIndex(index)} className={`w-2 h-2 rounded-full transition-all ${index === currentImageIndex ? 'bg-white w-4' : 'bg-white/60'}`} />
                      ))}
                      {imageUrls.length > 6 && <span className="text-white text-xs font-medium ml-1">+{imageUrls.length - 6}</span>}
                    </div>
                  )}

                  <div className="absolute top-3 right-3 flex gap-2">
                    <Button size="icon" variant="secondary" className="backdrop-blur-sm bg-background/80 w-8 h-8 sm:w-10 sm:h-10">
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="absolute bottom-3 right-3 bg-background/80 backdrop-blur rounded-full px-3 py-1 text-xs font-medium hidden sm:block">
                    {currentImageIndex + 1} / {imageUrls.length}
                  </div>
                </div>

                {/* Thumbnails */}
                {imageUrls.length > 1 && (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 sm:gap-3">
                    {imageUrls.slice(0, 6).map((url, i) => (
                      <button key={i} onClick={() => setCurrentImageIndex(i)} className={`relative h-14 sm:h-20 rounded-lg overflow-hidden border-2 transition-all ${i === currentImageIndex ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'}`}>
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Vehicle Header */}
              <div>
                <div className="flex flex-wrap gap-2 mb-2 sm:mb-3">
                  <Badge className="text-xs">{translateVehicleType(listing.vehicle_type)}</Badge>
                  <Badge variant="secondary">{conditionLabels[listing.condition] || listing.condition}</Badge>
                  {listing.accepts_trade && (
                    <Badge variant="outline" className="border-primary/50 text-primary">
                      <ArrowLeftRight className="w-3 h-3 mr-1" />
                      Aceita troca
                    </Badge>
                  )}
                </div>
                <h1 className="font-display text-xl sm:text-3xl lg:text-4xl font-bold mb-2">
                  {listing.brand} {listing.model} {listing.year}
                </h1>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-muted-foreground text-sm">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                    <span className="text-xs sm:text-sm">{listing.city && listing.state ? `${listing.city}, ${listing.state}` : "Localização não informada"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="text-xs sm:text-sm">{listing.views_count} visualizações</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="text-xs sm:text-sm">Publicado em {format(new Date(listing.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Specifications Grid */}
              <div>
                <h2 className="font-bold text-lg sm:text-xl mb-3 sm:mb-4">Especificações</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
                  <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-muted/50">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm text-muted-foreground">Ano</div>
                      <div className="font-semibold text-sm sm:text-base">{vehicle?.ano_modelo || listing.year}</div>
                    </div>
                  </div>
                  {vehicle?.ano_fabricacao && (
                    <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-muted/50">
                      <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm text-muted-foreground">Fabricação</div>
                        <div className="font-semibold text-sm sm:text-base">{vehicle.ano_fabricacao}</div>
                      </div>
                    </div>
                  )}
                  {vehicle?.versao && (
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
                      <div className="font-semibold text-sm sm:text-base">{translateTransmission(listing.transmission_type)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-muted/50">
                    <Fuel className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm text-muted-foreground">Combustível</div>
                      <div className="font-semibold text-sm sm:text-base">{translateFuel(listing.fuel_type)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-muted/50">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm text-muted-foreground">Passageiros</div>
                      <div className="font-semibold text-sm sm:text-base">{listing.seats}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-muted/50">
                    <DoorOpen className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm text-muted-foreground">Portas</div>
                      <div className="font-semibold text-sm sm:text-base">{listing.doors}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-muted/50">
                    <Palette className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm text-muted-foreground">Cor</div>
                      <div className="font-semibold text-sm sm:text-base capitalize">{listing.color}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-muted/50">
                    <Gauge className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm text-muted-foreground">Quilometragem</div>
                      <div className="font-semibold text-sm sm:text-base">{listing.mileage.toLocaleString("pt-BR")} km</div>
                    </div>
                  </div>
                  {vehicle?.motor && (
                    <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-muted/50">
                      <Cog className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm text-muted-foreground">Motor</div>
                        <div className="font-semibold text-sm sm:text-base">{vehicle.motor}</div>
                      </div>
                    </div>
                  )}
                  {vehicle?.direcao && (
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
                      <div className="font-semibold text-sm sm:text-base">{translateVehicleType(listing.vehicle_type)}</div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Description */}
              <div>
                <h2 className="font-bold text-base sm:text-xl mb-2 sm:mb-4">Descrição</h2>
                <p className="text-xs sm:text-base text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {listing.description || "Nenhuma descrição disponível."}
                </p>
              </div>

              {/* Accessories - only show if linked vehicle has data */}
              {hasAnyAccessory && (
                <>
                  <Separator />

                  {safetyItems.length > 0 && (
                    <div>
                      <h2 className="font-bold text-base sm:text-xl mb-3 sm:mb-4 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                        Segurança
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {safetyItems.map(item => <AccessoryItem key={item} label={item} />)}
                      </div>
                    </div>
                  )}

                  {comfortItems.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h2 className="font-bold text-base sm:text-xl mb-3 sm:mb-4 flex items-center gap-2">
                          <Thermometer className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                          Conforto
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {comfortItems.map(item => <AccessoryItem key={item} label={item} />)}
                        </div>
                      </div>
                    </>
                  )}

                  {techItems.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h2 className="font-bold text-base sm:text-xl mb-3 sm:mb-4 flex items-center gap-2">
                          <Radio className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                          Tecnologia
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {techItems.map(item => <AccessoryItem key={item} label={item} />)}
                        </div>
                      </div>
                    </>
                  )}

                  {exteriorItems.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h2 className="font-bold text-base sm:text-xl mb-3 sm:mb-4 flex items-center gap-2">
                          <Car className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                          Exterior
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {exteriorItems.map(item => <AccessoryItem key={item} label={item} />)}
                        </div>
                      </div>
                    </>
                  )}

                  {otherItems.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h2 className="font-bold text-base sm:text-xl mb-3 sm:mb-4 flex items-center gap-2">
                          <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                          Outros
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {otherItems.map(item => <AccessoryItem key={item} label={item} />)}
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Right Sidebar */}
            <div className="space-y-4">
              {/* Price Card */}
              <Card className="border-primary/30 sticky top-24">
                <CardContent className="pt-6">
                  <div className="text-center mb-6">
                    <span className="text-3xl sm:text-4xl font-bold text-primary">
                      {formatCurrencyBRL(listing.sale_price)}
                    </span>
                  </div>

                  {/* Seller Info */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 mb-4">
                    <Avatar className="w-10 h-10 sm:w-12 sm:h-12">
                      <AvatarImage src={sellerProfile?.profile_image || undefined} />
                      <AvatarFallback>{sellerName[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{sellerName}</p>
                      <p className="text-xs text-muted-foreground">Vendedor</p>
                    </div>
                  </div>

                  {/* Quick specs summary */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="text-center p-2 rounded-lg bg-muted/30">
                      <Gauge className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
                      <span className="text-xs text-muted-foreground">{(listing.mileage / 1000).toFixed(0)}k km</span>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-muted/30">
                      <Settings className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
                      <span className="text-xs text-muted-foreground">{translateTransmission(listing.transmission_type)}</span>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-muted/30">
                      <Fuel className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
                      <span className="text-xs text-muted-foreground">{translateFuel(listing.fuel_type)}</span>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-muted/30">
                      <Calendar className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
                      <span className="text-xs text-muted-foreground">{listing.year}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  {!isOwner ? (
                    <div className="space-y-3">
                      {listing.show_phone && listing.whatsapp_number && (
                        <Button className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={handleWhatsApp}>
                          <Phone className="w-4 h-4 mr-2" />
                          WhatsApp
                        </Button>
                      )}
                      {listing.allow_chat && user && (
                        <Dialog open={chatOpen} onOpenChange={setChatOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="w-full">
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Enviar Mensagem
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Mensagem para {sellerName}</DialogTitle>
                            </DialogHeader>
                            <div className="max-h-64 overflow-y-auto space-y-2 p-2 border rounded-lg">
                              {messages && messages.length > 0 ? messages.map((msg: any) => (
                                <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                                  <div className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${msg.sender_id === user?.id ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                    {msg.content}
                                  </div>
                                </div>
                              )) : (
                                <p className="text-center text-muted-foreground text-sm py-4">Nenhuma mensagem ainda</p>
                              )}
                              <div ref={messagesEndRef} />
                            </div>
                            <div className="flex gap-2">
                              <Input
                                value={chatMessage}
                                onChange={e => setChatMessage(e.target.value)}
                                placeholder="Digite sua mensagem..."
                                onKeyDown={e => e.key === "Enter" && handleSendMessage()}
                              />
                              <Button size="icon" onClick={handleSendMessage} disabled={sendMessage.isPending}>
                                <Send className="w-4 h-4" />
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                      {!user && (
                        <Button variant="outline" className="w-full" onClick={() => navigate("/auth")}>
                          Faça login para entrar em contato
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full" onClick={handleToggleStatus} disabled={updateListing.isPending}>
                        {listing.status === "active" ? <><Pause className="w-4 h-4 mr-2" />Pausar Anúncio</> : <><Play className="w-4 h-4 mr-2" />Reativar Anúncio</>}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" className="w-full" disabled={deleteListing.isPending}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir Anúncio
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir anúncio?</AlertDialogTitle>
                            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ClassifiedDetails;
