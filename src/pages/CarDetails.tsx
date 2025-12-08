import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useVehicle } from "@/hooks/useVehicles";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  ArrowLeft,
  Star,
  MapPin,
  Users,
  Fuel,
  Settings,
  Calendar,
  Shield,
  MessageSquare,
  Share2,
  CheckCircle2,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { FavoriteButton } from "@/components/FavoriteButton";

const CarDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mainImage, setMainImage] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("10:00");

  // Generate time options from 06:00 to 22:00 in 30-minute intervals
  const timeOptions = [];
  for (let hour = 6; hour <= 22; hour++) {
    timeOptions.push(`${hour.toString().padStart(2, '0')}:00`);
    if (hour < 22) {
      timeOptions.push(`${hour.toString().padStart(2, '0')}:30`);
    }
  }

  const { data: vehicle, isLoading } = useVehicle(id || "");
  

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

      <main className="flex-1 pt-24 pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Button
            variant="ghost"
            className="mb-6"
            asChild
          >
            <Link to="/browse">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para busca
            </Link>
          </Button>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Images Gallery */}
              <div className="space-y-4">
                <div className="relative h-[400px] sm:h-[500px] rounded-2xl overflow-hidden">
                  <img
                    src={images[mainImage] || "https://images.unsplash.com/photo-1590362891991-f776e747a588"}
                    alt={`${vehicle.brand} ${vehicle.model}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 right-4 flex gap-2">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="backdrop-blur-sm bg-background/80"
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

                <div className="grid grid-cols-4 gap-3">
                  {images.slice(0, 4).map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setMainImage(index)}
                      className={`relative h-24 rounded-lg overflow-hidden border-2 transition-all ${
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
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <Badge className="mb-3 capitalize">{vehicle.vehicle_type}</Badge>
                    <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2">
                      {vehicle.brand} {vehicle.model} {vehicle.year}
                    </h1>
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Star className="w-5 h-5 fill-accent text-accent" />
                        <span className="font-semibold text-foreground">4.9</span>
                        <span>(0 avaliações)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{address ? `${address.neighborhood}, ${address.city} - ${address.state}` : "Localização não informada"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Specs */}
                <div>
                  <h2 className="font-bold text-xl mb-4">Especificações</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
                      <Calendar className="w-5 h-5 text-primary" />
                      <div>
                        <div className="text-sm text-muted-foreground">Ano</div>
                        <div className="font-semibold">{vehicle.year}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
                      <Settings className="w-5 h-5 text-primary" />
                      <div>
                        <div className="text-sm text-muted-foreground">Câmbio</div>
                        <div className="font-semibold capitalize">{vehicle.transmission_type}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
                      <Fuel className="w-5 h-5 text-primary" />
                      <div>
                        <div className="text-sm text-muted-foreground">Combustível</div>
                        <div className="font-semibold capitalize">{vehicle.fuel_type}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
                      <Users className="w-5 h-5 text-primary" />
                      <div>
                        <div className="text-sm text-muted-foreground">Passageiros</div>
                        <div className="font-semibold">{vehicle.seats}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Description */}
                <div>
                  <h2 className="font-bold text-xl mb-4">Descrição</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {vehicle.description || "Nenhuma descrição disponível."}
                  </p>
                </div>

                <Separator className="my-6" />

                {/* Features */}
                <div>
                  <h2 className="font-bold text-xl mb-4">Recursos e Acessórios</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {vehicle.has_air_conditioning && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-secondary" />
                        <span>Ar-condicionado</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-secondary" />
                      <span>{vehicle.doors} portas</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-secondary" />
                      <span>Cor: {vehicle.color}</span>
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Owner Info */}
                <div>
                  <h2 className="font-bold text-xl mb-4">Proprietário</h2>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <Avatar className="w-16 h-16">
                          <AvatarImage src={owner?.profile_image || undefined} />
                          <AvatarFallback>
                            {owner?.first_name?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg">
                            {owner?.first_name} {owner?.last_name}
                          </h3>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-accent text-accent" />
                              <span>4.9</span>
                            </div>
                            <span>•</span>
                            <span>0 viagens</span>
                          </div>
                        </div>
                        <Button variant="outline">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Conversar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            {/* Booking Card - Sticky */}
            <div className="lg:sticky lg:top-24 h-fit">
              <Card className="border-2 shadow-xl">
                <CardContent className="p-6">
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-4xl font-display font-bold text-primary">
                        R$ {vehicle.daily_price}
                      </span>
                      <span className="text-muted-foreground">/dia</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
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
                          <Input 
                            type="date" 
                            className="h-11"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                          />
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
                          <Input 
                            type="date" 
                            className="h-11"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            min={startDate || new Date().toISOString().split('T')[0]}
                          />
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
                        const days = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
                        
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

                        return (
                          <>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                R$ {vehicle.daily_price} x {days} {days === 1 ? 'dia' : 'dias'}
                              </span>
                              <span className="font-semibold">R$ {(vehicle.daily_price * days).toFixed(2)}</span>
                            </div>
                            {extraHoursCharge > 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                  Horas adicionais ({extraHours.toFixed(1)}h)
                                </span>
                                <span className="font-semibold">R$ {extraHoursCharge.toFixed(2)}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Seguro</span>
                              <span className="font-semibold">R$ {insurance.toFixed(2)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-bold">
                              <span>Total</span>
                              <span className="text-primary text-lg">R$ {total.toFixed(2)}</span>
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

                      const days = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
                      if (days <= 0) {
                        toast.error("A data de devolução deve ser posterior à data de retirada");
                        return;
                      }

                      // Navigate to checkout with booking data including time
                      navigate(`/checkout?vehicleId=${vehicle.id}&startDate=${startDate}&startTime=${startTime}&endDate=${endDate}&endTime=${endTime}`);
                    }}
                    disabled={!startDate || !endDate}
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
