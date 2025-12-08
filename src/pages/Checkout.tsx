import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useVehicle } from "@/hooks/useVehicles";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useIsUserApproved } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowLeft,
  Star,
  CreditCard,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Shield,
  MessageSquare,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { VerificationRequired } from "@/components/VerificationRequired";

const Checkout = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { isApproved, verificationStatus, isLoading: isLoadingVerification } = useIsUserApproved();

  const vehicleId = searchParams.get("vehicleId");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const { data: vehicle, isLoading } = useVehicle(vehicleId || "");
  const [isProcessing, setIsProcessing] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [firstName, setFirstName] = useState(profile?.first_name || "");
  const [lastName, setLastName] = useState(profile?.last_name || "");
  const [cpf, setCpf] = useState(profile?.cpf || "");
  const [message, setMessage] = useState("");
  const [showPriceDetails, setShowPriceDetails] = useState(false);

  // Calculate pricing - Locatário paga apenas subtotal + seguro
  const days = startDate && endDate
    ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const subtotal = vehicle ? vehicle.daily_price * days : 0;
  const insurance = days * 20;
  const totalPrice = subtotal + insurance;

  const owner = vehicle?.profiles as any;
  const address = vehicle?.addresses as any;
  const images = vehicle?.vehicle_images?.sort((a, b) => a.display_order - b.display_order).map(img => img.image_url) || [];

  if (!user) {
    navigate("/auth");
    return null;
  }

  if (isLoadingVerification) {
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

  if (!isApproved) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-24 pb-20 flex items-center justify-center">
          <VerificationRequired 
            action="fazer reservas" 
            verificationStatus={verificationStatus} 
          />
        </main>
        <Footer />
      </div>
    );
  }

  if (!vehicleId || !startDate || !endDate) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-24 pb-20 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Dados de reserva inválidos</p>
            <Button asChild>
              <Link to="/browse">Voltar para busca</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

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

  const handleConfirmBooking = async () => {
    if (!firstName || !lastName) {
      toast.error("Preencha seu nome completo");
      return;
    }

    setIsProcessing(true);

    try {
      const pickupLocationStr = address
        ? `${address.street}, ${address.number} - ${address.neighborhood}, ${address.city} - ${address.state}`
        : '';

      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          vehicleId: vehicle.id,
          vehicleName: `${vehicle.brand} ${vehicle.model} ${vehicle.year}`,
          startDate,
          endDate,
          days,
          dailyRate: vehicle.daily_price,
          subtotal,
          insurance,
          totalPrice,
          ownerId: vehicle.owner_id,
          pickupLocation: pickupLocationStr,
          notes: message || '',
        },
      });

      if (error) {
        throw new Error(error.message || 'Erro ao processar pagamento');
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('URL de pagamento não recebida');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Erro ao processar pagamento');
      setIsProcessing(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "d 'de' MMM", { locale: ptBR });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 pt-24 pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-display text-2xl sm:text-3xl font-bold">
              Confirmar e pagar
            </h1>
          </div>

          <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Left Column - Form */}
            <div className="lg:col-span-3 space-y-8">
              {/* Trip Details */}
              <section>
                <h2 className="font-bold text-xl mb-4">Sua reserva</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Datas</p>
                      <p className="text-muted-foreground">
                        {formatDate(startDate)} – {formatDate(endDate)}
                      </p>
                    </div>
                    <Button
                      variant="link"
                      className="text-foreground underline p-0 h-auto"
                      onClick={() => navigate(-1)}
                    >
                      Editar
                    </Button>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Duração</p>
                      <p className="text-muted-foreground">
                        {days} {days === 1 ? "dia" : "dias"}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <Separator />

              {/* Payment Method */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-xl">Pagar com</h2>
                  <div className="flex items-center gap-2">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/0/04/Visa.svg" alt="Visa" className="h-5" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-5" />
                    <Smartphone className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>

                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                  <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="pix" id="pix" />
                    <Label htmlFor="pix" className="flex items-center gap-3 cursor-pointer flex-1">
                      <div className="w-8 h-8 bg-[#32BCAD] rounded flex items-center justify-center">
                        <span className="text-white font-bold text-xs">PIX</span>
                      </div>
                      <span className="font-medium">Pix</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="credit_card" id="credit_card" />
                    <Label htmlFor="credit_card" className="flex items-center gap-3 cursor-pointer flex-1">
                      <CreditCard className="w-8 h-8 text-muted-foreground" />
                      <span className="font-medium">Cartão de crédito</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="debit_card" id="debit_card" />
                    <Label htmlFor="debit_card" className="flex items-center gap-3 cursor-pointer flex-1">
                      <CreditCard className="w-8 h-8 text-muted-foreground" />
                      <span className="font-medium">Cartão de débito</span>
                    </Label>
                  </div>
                </RadioGroup>

                <div className="mt-4 space-y-3">
                  <Input
                    placeholder="Nome"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="h-12"
                  />
                  <Input
                    placeholder="Sobrenome"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="h-12"
                  />
                  <Input
                    placeholder="CPF"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    className="h-12"
                  />
                </div>
              </section>

              <Separator />

              {/* Message to Owner */}
              <section>
                <h2 className="font-bold text-xl mb-2">Fale com o proprietário</h2>
                <p className="text-muted-foreground text-sm mb-4">
                  Conte sobre sua viagem, motivo do aluguel e outras informações importantes.
                </p>

                <Card className="mb-4">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={owner?.profile_image || undefined} />
                        <AvatarFallback>
                          {owner?.first_name?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{owner?.first_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Membro desde {owner?.created_at ? new Date(owner.created_at).getFullYear() : "2024"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Textarea
                  placeholder={`Olá, ${owner?.first_name}! Estarei alugando seu veículo para...`}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-[120px] resize-none"
                />
              </section>

              <Separator />

              {/* Cancellation Policy */}
              <section>
                <h2 className="font-bold text-xl mb-2">Política de cancelamento</h2>
                <p className="text-muted-foreground">
                  Esta reserva não é reembolsável.{" "}
                  <Button variant="link" className="p-0 h-auto text-foreground underline">
                    Saiba mais
                  </Button>
                </p>
              </section>

              <Separator />

              {/* Basic Rules */}
              <section>
                <h2 className="font-bold text-xl mb-2">Regras básicas</h2>
                <p className="text-muted-foreground mb-4">
                  Pedimos a todos os locatários que se lembrem de alguns pequenos detalhes que contribuem para uma boa experiência.
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span>Siga as regras estabelecidas pelo proprietário</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span>Cuide do veículo como se fosse seu</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span>Devolva o veículo no horário combinado</span>
                  </li>
                </ul>
              </section>

              <Separator />

              {/* Terms */}
              <section>
                <p className="text-sm text-muted-foreground mb-6">
                  Ao clicar no botão abaixo, concordo com as seguintes políticas:{" "}
                  <Button variant="link" className="p-0 h-auto text-foreground underline text-sm">
                    Regras estabelecidas pelo proprietário
                  </Button>
                  ,{" "}
                  <Button variant="link" className="p-0 h-auto text-foreground underline text-sm">
                    Regras básicas para locatários
                  </Button>
                  ,{" "}
                  <Button variant="link" className="p-0 h-auto text-foreground underline text-sm">
                    Política de Reembolso e Cancelamento
                  </Button>
                  . Também concordo com os{" "}
                  <Button variant="link" className="p-0 h-auto text-foreground underline text-sm">
                    Termos de Serviço
                  </Button>{" "}
                  e confirmo que li a{" "}
                  <Button variant="link" className="p-0 h-auto text-foreground underline text-sm">
                    Política de Privacidade
                  </Button>
                  .
                </p>

                <Button
                  size="lg"
                  className="w-full sm:w-auto gradient-accent text-accent-foreground hover:opacity-90 transition-smooth px-8"
                  onClick={handleConfirmBooking}
                  disabled={isProcessing}
                >
                  {isProcessing ? "Redirecionando para pagamento..." : "Confirmar e pagar"}
                </Button>
              </section>
            </div>

            {/* Right Column - Summary */}
            <div className="lg:col-span-2">
              <Card className="sticky top-24 border shadow-lg">
                <CardContent className="p-6">
                  {/* Vehicle Preview */}
                  <div className="flex gap-4 mb-6">
                    <div className="w-28 h-24 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={images[0] || "https://images.unsplash.com/photo-1590362891991-f776e747a588"}
                        alt={`${vehicle.brand} ${vehicle.model}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">
                        {vehicle.brand} {vehicle.model} {vehicle.year}
                      </p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {vehicle.vehicle_type}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-4 h-4 fill-accent text-accent" />
                        <span className="text-sm font-medium">5,00</span>
                        <span className="text-sm text-muted-foreground">(0 avaliações)</span>
                      </div>
                    </div>
                  </div>

                  <Separator className="mb-6" />

                  {/* Price Summary */}
                  <div>
                    <h3 className="font-bold text-lg mb-4">Seu total</h3>

                    <Collapsible open={showPriceDetails} onOpenChange={setShowPriceDetails}>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            {days} {days === 1 ? "dia" : "dias"} x R$ {vehicle.daily_price.toFixed(2)}
                          </span>
                          <span className="font-medium">R$ {subtotal.toFixed(2)}</span>
                        </div>

                        <CollapsibleContent className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Seguro</span>
                            <span className="font-medium">R$ {insurance.toFixed(2)}</span>
                          </div>
                        </CollapsibleContent>

                        <Separator />

                        <div className="flex justify-between items-center">
                          <span className="font-bold">Total (BRL)</span>
                          <span className="font-bold text-lg">R$ {totalPrice.toFixed(2)}</span>
                        </div>

                        <CollapsibleTrigger asChild>
                          <Button variant="link" className="p-0 h-auto text-foreground underline text-sm w-full text-right">
                            {showPriceDetails ? (
                              <span className="flex items-center gap-1 justify-end">
                                Ocultar detalhes <ChevronUp className="w-4 h-4" />
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 justify-end">
                                Detalhamento do preço <ChevronDown className="w-4 h-4" />
                              </span>
                            )}
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                    </Collapsible>
                  </div>

                  <Separator className="my-6" />

                  {/* Security Badge */}
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

export default Checkout;
