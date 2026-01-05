import { useState, useEffect } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { VerificationRequired } from "@/components/VerificationRequired";
import { maskCPF, formatCurrencyBRL } from "@/lib/validators";

const Checkout = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { isApproved, verificationStatus, isLoading: isLoadingVerification } = useIsUserApproved();

  const vehicleId = searchParams.get("vehicleId");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const startTime = searchParams.get("startTime") || "09:00";
  const endTime = searchParams.get("endTime") || "09:00";

  const { data: vehicle, isLoading } = useVehicle(vehicleId || "");
  const [isProcessing, setIsProcessing] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [cpf, setCpf] = useState("");
  const [message, setMessage] = useState("");

  // Acceptance checkboxes state
  const [acceptOwnerRules, setAcceptOwnerRules] = useState(false);
  const [acceptBasicRules, setAcceptBasicRules] = useState(false);
  const [acceptCancellationPolicy, setAcceptCancellationPolicy] = useState(false);
  const [acceptTermsOfService, setAcceptTermsOfService] = useState(false);
  const [acceptPrivacyPolicy, setAcceptPrivacyPolicy] = useState(false);

  const allAccepted = acceptOwnerRules && acceptBasicRules && acceptCancellationPolicy && acceptTermsOfService && acceptPrivacyPolicy;

  // Pre-fill form with user profile data when it loads
  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || "");
      setLastName(profile.last_name || "");
      setCpf(profile.cpf ? maskCPF(profile.cpf) : "");
    }
  }, [profile]);

  // Helper function to parse date string (yyyy-MM-dd) without timezone issues
  const parseDateString = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Calculate pricing - Locatário paga apenas subtotal + seguro
  const days = startDate && endDate
    ? Math.ceil((parseDateString(endDate).getTime() - parseDateString(startDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  
  // Calculate extra hours if return time > pickup time
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  
  let extraHoursCharge = 0;
  let extraHours = 0;
  
  if (endMinutes > startMinutes && vehicle) {
    extraHours = (endMinutes - startMinutes) / 60;
    const hourlyRate = vehicle.daily_price / 24;
    extraHoursCharge = hourlyRate * extraHours;
  }
  
  const dailySubtotal = vehicle ? vehicle.daily_price * days : 0;
  const subtotal = dailySubtotal + extraHoursCharge;
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

    if (!allAccepted) {
      toast.error("Você precisa aceitar todos os termos e políticas para continuar");
      return;
    }

    setIsProcessing(true);

    try {
      const pickupLocationStr = address
        ? `${address.street}, ${address.number} - ${address.neighborhood}, ${address.city} - ${address.state}`
        : '';

      const acceptanceTimestamp = new Date().toISOString();

      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          vehicleId: vehicle.id,
          vehicleName: `${vehicle.brand} ${vehicle.model} ${vehicle.year}`,
          startDate,
          endDate,
          startTime,
          endTime,
          days,
          dailyRate: vehicle.daily_price,
          dailySubtotal,
          extraHours,
          extraHoursCharge,
          subtotal,
          insurance,
          totalPrice,
          ownerId: vehicle.owner_id,
          pickupLocation: pickupLocationStr,
          notes: message || '',
          // Acceptance data for legal compliance
          acceptances: {
            owner_rules_accepted: acceptOwnerRules,
            owner_rules_accepted_at: acceptOwnerRules ? acceptanceTimestamp : null,
            basic_rules_accepted: acceptBasicRules,
            basic_rules_accepted_at: acceptBasicRules ? acceptanceTimestamp : null,
            cancellation_policy_accepted: acceptCancellationPolicy,
            cancellation_policy_accepted_at: acceptCancellationPolicy ? acceptanceTimestamp : null,
            terms_of_service_accepted: acceptTermsOfService,
            terms_of_service_accepted_at: acceptTermsOfService ? acceptanceTimestamp : null,
            privacy_policy_accepted: acceptPrivacyPolicy,
            privacy_policy_accepted_at: acceptPrivacyPolicy ? acceptanceTimestamp : null,
          },
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
    // Parse date without timezone issues
    const date = parseDateString(dateStr);
    return format(date, "d 'de' MMM", { locale: ptBR });
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
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => setCpf(maskCPF(e.target.value))}
                    maxLength={14}
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

              {/* Terms - Checkboxes */}
              <section>
                <h2 className="font-bold text-xl mb-4">Termos e Políticas</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Para continuar, você precisa ler e aceitar os termos abaixo:
                </p>

                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="ownerRules"
                      checked={acceptOwnerRules}
                      onCheckedChange={(checked) => setAcceptOwnerRules(checked === true)}
                    />
                    <Label htmlFor="ownerRules" className="text-sm leading-relaxed cursor-pointer">
                      Li e aceito as{" "}
                      <Button variant="link" className="p-0 h-auto text-primary underline text-sm">
                        Regras estabelecidas pelo proprietário
                      </Button>
                    </Label>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="basicRules"
                      checked={acceptBasicRules}
                      onCheckedChange={(checked) => setAcceptBasicRules(checked === true)}
                    />
                    <Label htmlFor="basicRules" className="text-sm leading-relaxed cursor-pointer">
                      Li e aceito as{" "}
                      <Button variant="link" className="p-0 h-auto text-primary underline text-sm">
                        Regras básicas para locatários
                      </Button>
                    </Label>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="cancellationPolicy"
                      checked={acceptCancellationPolicy}
                      onCheckedChange={(checked) => setAcceptCancellationPolicy(checked === true)}
                    />
                    <Label htmlFor="cancellationPolicy" className="text-sm leading-relaxed cursor-pointer">
                      Li e aceito a{" "}
                      <Button variant="link" className="p-0 h-auto text-primary underline text-sm">
                        Política de Reembolso e Cancelamento
                      </Button>
                    </Label>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="termsOfService"
                      checked={acceptTermsOfService}
                      onCheckedChange={(checked) => setAcceptTermsOfService(checked === true)}
                    />
                    <Label htmlFor="termsOfService" className="text-sm leading-relaxed cursor-pointer">
                      Li e aceito os{" "}
                      <Button variant="link" className="p-0 h-auto text-primary underline text-sm">
                        Termos de Serviço
                      </Button>
                    </Label>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="privacyPolicy"
                      checked={acceptPrivacyPolicy}
                      onCheckedChange={(checked) => setAcceptPrivacyPolicy(checked === true)}
                    />
                    <Label htmlFor="privacyPolicy" className="text-sm leading-relaxed cursor-pointer">
                      Li e aceito a{" "}
                      <Button variant="link" className="p-0 h-auto text-primary underline text-sm">
                        Política de Privacidade
                      </Button>
                    </Label>
                  </div>
                </div>

                {!allAccepted && (
                  <p className="text-sm text-destructive mt-4">
                    * Todos os itens acima são obrigatórios
                  </p>
                )}

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
                    <h3 className="font-bold text-lg mb-4">Resumo do Pagamento</h3>

                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Diária ({formatCurrencyBRL(vehicle.daily_price)} × {days})
                        </span>
                        <span className="font-medium">{formatCurrencyBRL(dailySubtotal)}</span>
                      </div>

                      {extraHoursCharge > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Horas adicionais ({extraHours.toFixed(1)}h)
                          </span>
                          <span className="font-medium">{formatCurrencyBRL(extraHoursCharge)}</span>
                        </div>
                      )}

                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Seguro</span>
                        <span className="font-medium">{formatCurrencyBRL(insurance)}</span>
                      </div>

                      <Separator />

                      <div className="flex justify-between items-center">
                        <span className="font-bold">Total</span>
                        <span className="font-bold text-lg text-primary">{formatCurrencyBRL(totalPrice)}</span>
                      </div>
                    </div>
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
