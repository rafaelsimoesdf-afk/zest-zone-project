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
  Car,
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
import { Badge } from "@/components/ui/badge";
import { maskCPF, formatCurrencyBRL } from "@/lib/validators";
import { AsaasPaymentModal } from "@/components/checkout/AsaasPaymentModal";
import { CreditCardForm, type CreditCardFormData } from "@/components/checkout/CreditCardForm";
import { useSavedCards, useDeleteSavedCard } from "@/hooks/useSavedCards";
import { Trash2 } from "lucide-react";

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
  const isAppDriverMode = searchParams.get("appDriver") === "true";
  const appDriverPeriod = searchParams.get("appDriverPeriod") as "weekly" | "monthly" | null;

  const { data: vehicle, isLoading } = useVehicle(vehicleId || "");
  const [isProcessing, setIsProcessing] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<"pix" | "credit_card" | "boleto">("pix");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [cpf, setCpf] = useState("");
  const [message, setMessage] = useState("");

  // Asaas payment modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [chargeData, setChargeData] = useState<{
    chargeId: string;
    asaasPaymentId: string;
    billingType: "PIX" | "BOLETO" | "CREDIT_CARD" | "UNDEFINED";
    pixQrCode: string | null;
    pixCopyPaste: string | null;
    invoiceUrl: string | null;
    bankSlipUrl: string | null;
    boletoIdentificationField: string | null;
    initialStatus: string;
    value: number;
  } | null>(null);

  // Cartão de crédito embutido
  const { data: savedCards = [] } = useSavedCards();
  const deleteCard = useDeleteSavedCard();
  const [selectedCardId, setSelectedCardId] = useState<string>("new");
  const [saveCard, setSaveCard] = useState(true);
  const [cardForm, setCardForm] = useState<CreditCardFormData>({
    holderName: "",
    number: "",
    expiryMonth: "",
    expiryYear: "",
    ccv: "",
    postalCode: "",
    addressNumber: "",
  });


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

  // Calculate pricing
  const days = startDate && endDate
    ? Math.ceil((parseDateString(endDate).getTime() - parseDateString(startDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  
  // App driver mode pricing
  const isAppDriver = isAppDriverMode && appDriverPeriod;
  const appDriverPrice = isAppDriver && vehicle
    ? (appDriverPeriod === "weekly" ? (vehicle.app_driver_weekly_price || 0) : (vehicle.app_driver_monthly_price || 0))
    : 0;

  // Calculate extra hours if return time > pickup time (only for standard mode)
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  
  let extraHoursCharge = 0;
  let extraHours = 0;
  
  if (!isAppDriver && endMinutes > startMinutes && vehicle) {
    extraHours = (endMinutes - startMinutes) / 60;
    const hourlyRate = vehicle.daily_price / 24;
    extraHoursCharge = hourlyRate * extraHours;
  }
  
  const dailySubtotal = isAppDriver ? appDriverPrice : (vehicle ? vehicle.daily_price * days : 0);
  const subtotal = dailySubtotal + extraHoursCharge;
  const insurance = days * 35;
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

    // Validações específicas para cartão
    if (paymentMethod === "credit_card") {
      const usingSaved = selectedCardId !== "new";
      if (!usingSaved) {
        const c = cardForm;
        if (!c.holderName || c.number.replace(/\D/g, "").length < 13 ||
            !c.expiryMonth || c.expiryYear.length !== 4 || c.ccv.length < 3 ||
            c.postalCode.replace(/\D/g, "").length !== 8 || !c.addressNumber) {
          toast.error("Preencha todos os dados do cartão corretamente");
          return;
        }
      }
    }

    setIsProcessing(true);

    try {
      const pickupLocationStr = address
        ? `${address.street}, ${address.number} - ${address.neighborhood}, ${address.city} - ${address.state}`
        : '';

      const acceptanceTimestamp = new Date().toISOString();

      const billingTypeMap = {
        pix: "PIX",
        credit_card: "CREDIT_CARD",
        boleto: "BOLETO",
      } as const;

      const requestBody: any = {
        billingType: billingTypeMap[paymentMethod],
        bookingPayload: {
          vehicleId: vehicle.id,
          ownerId: vehicle.owner_id,
          startDate,
          endDate,
          startTime,
          endTime,
          days,
          dailyRate: isAppDriver ? appDriverPrice : vehicle.daily_price,
          totalPrice,
          extraHours,
          extraHoursCharge,
          pickupLocation: pickupLocationStr,
          notes: message || '',
          acceptances: {
            owner_rules_accepted: acceptOwnerRules,
            owner_rules_accepted_at: acceptanceTimestamp,
            basic_rules_accepted: acceptBasicRules,
            basic_rules_accepted_at: acceptanceTimestamp,
            cancellation_policy_accepted: acceptCancellationPolicy,
            cancellation_policy_accepted_at: acceptanceTimestamp,
            terms_of_service_accepted: acceptTermsOfService,
            terms_of_service_accepted_at: acceptanceTimestamp,
            privacy_policy_accepted: acceptPrivacyPolicy,
            privacy_policy_accepted_at: acceptanceTimestamp,
          },
        },
      };

      if (paymentMethod === "credit_card") {
        if (selectedCardId !== "new") {
          const saved = savedCards.find((c) => c.id === selectedCardId);
          if (!saved) throw new Error("Cartão salvo não encontrado");
          requestBody.creditCardToken = saved.credit_card_token;
        } else {
          requestBody.creditCard = {
            holderName: cardForm.holderName,
            number: cardForm.number.replace(/\D/g, ""),
            expiryMonth: cardForm.expiryMonth.padStart(2, "0"),
            expiryYear: cardForm.expiryYear,
            ccv: cardForm.ccv,
          };
          requestBody.creditCardHolderInfo = {
            name: `${firstName} ${lastName}`.trim(),
            email: profile?.email ?? user.email ?? "",
            cpfCnpj: cpf.replace(/\D/g, ""),
            postalCode: cardForm.postalCode.replace(/\D/g, ""),
            addressNumber: cardForm.addressNumber,
            phone: profile?.phone_number ?? undefined,
          };
          requestBody.saveCard = saveCard;
        }
      }

      const { data, error } = await supabase.functions.invoke('asaas-create-charge', {
        body: requestBody,
      });

      if (error) throw new Error(error.message || 'Erro ao gerar cobrança');
      if (!data?.chargeId) throw new Error('Resposta inválida do servidor de pagamento');

      setChargeData({
        chargeId: data.chargeId,
        asaasPaymentId: data.asaasPaymentId,
        billingType: data.billingType,
        pixQrCode: data.pixQrCode,
        pixCopyPaste: data.pixCopyPaste,
        invoiceUrl: data.invoiceUrl,
        bankSlipUrl: data.bankSlipUrl,
        boletoIdentificationField: data.boletoIdentificationField ?? null,
        initialStatus: data.status ?? "PENDING",
        value: data.value,
      });
      setPaymentModalOpen(true);
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Erro ao processar pagamento');
    } finally {
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

      <main className="flex-1 pt-20 sm:pt-24 pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          {/* Header */}
          <div className="flex items-center gap-2 sm:gap-4 mb-6 sm:mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-full w-8 h-8 sm:w-10 sm:h-10"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold">
              Confirmar e pagar
            </h1>
          </div>

          <div className="grid lg:grid-cols-5 gap-6 lg:gap-12">
            {/* Left Column - Form */}
            <div className="lg:col-span-3 space-y-6 sm:space-y-8">
              {/* Trip Details */}
              <section>
                <h2 className="font-bold text-lg sm:text-xl mb-3 sm:mb-4">Sua reserva</h2>
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm sm:text-base">Datas</p>
                      <p className="text-muted-foreground text-xs sm:text-base">
                        {formatDate(startDate)} – {formatDate(endDate)}
                      </p>
                    </div>
                    <Button
                      variant="link"
                      className="text-foreground underline p-0 h-auto text-xs sm:text-sm"
                      onClick={() => navigate(-1)}
                    >
                      Editar
                    </Button>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm sm:text-base">
                        {isAppDriver ? "Período" : "Duração"}
                      </p>
                      <p className="text-muted-foreground text-xs sm:text-base">
                        {isAppDriver
                          ? (appDriverPeriod === "weekly" ? "Semanal (7 dias)" : "Mensal (30 dias)")
                          : `${days} ${days === 1 ? "dia" : "dias"}`
                        }
                      </p>
                    </div>
                  </div>
                  {isAppDriver && (
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        <Car className="w-3 h-3 mr-1" />
                        Motorista de App
                      </Badge>
                    </div>
                  )}
                </div>
              </section>

              <Separator />

              {/* Payment Method */}
              <section>
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h2 className="font-bold text-lg sm:text-xl">Pagar com</h2>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/0/04/Visa.svg" alt="Visa" className="h-4 sm:h-5" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-4 sm:h-5" />
                    <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                  </div>
                </div>

                <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as "pix" | "credit_card" | "boleto")} className="space-y-2 sm:space-y-3">
                  <div className="flex items-center space-x-2 sm:space-x-3 border rounded-lg p-3 sm:p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="pix" id="pix" />
                    <Label htmlFor="pix" className="flex items-center gap-2 sm:gap-3 cursor-pointer flex-1">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#32BCAD] rounded flex items-center justify-center">
                        <span className="text-white font-bold text-[10px] sm:text-xs">PIX</span>
                      </div>
                      <span className="font-medium text-sm sm:text-base">Pix</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 sm:space-x-3 border rounded-lg p-3 sm:p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="credit_card" id="credit_card" />
                    <Label htmlFor="credit_card" className="flex items-center gap-2 sm:gap-3 cursor-pointer flex-1">
                      <CreditCard className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
                      <span className="font-medium text-sm sm:text-base">Cartão de crédito</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 sm:space-x-3 border rounded-lg p-3 sm:p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="boleto" id="boleto" />
                    <Label htmlFor="boleto" className="flex items-center gap-2 sm:gap-3 cursor-pointer flex-1">
                      <CreditCard className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
                      <span className="font-medium text-sm sm:text-base">Boleto bancário</span>
                    </Label>
                  </div>
                </RadioGroup>

                {/* Cartão de crédito embutido */}
                {paymentMethod === "credit_card" && (
                  <div className="mt-3 sm:mt-4 space-y-3">
                    {savedCards.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-xs sm:text-sm font-medium">Seus cartões salvos</Label>
                        {savedCards.map((c) => (
                          <div
                            key={c.id}
                            className={`flex items-center gap-3 border rounded-lg p-3 cursor-pointer transition-colors ${
                              selectedCardId === c.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                            }`}
                            onClick={() => setSelectedCardId(c.id)}
                          >
                            <input
                              type="radio"
                              checked={selectedCardId === c.id}
                              onChange={() => setSelectedCardId(c.id)}
                              className="accent-primary"
                            />
                            <CreditCard className="w-5 h-5 text-muted-foreground" />
                            <div className="flex-1">
                              <p className="text-sm font-medium">
                                {c.credit_card_brand ?? "Cartão"} •••• {c.credit_card_last_digits ?? "****"}
                              </p>
                              {c.holder_name && (
                                <p className="text-xs text-muted-foreground">{c.holder_name}</p>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => { e.stopPropagation(); deleteCard.mutate(c.id); }}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                        <div
                          className={`flex items-center gap-3 border rounded-lg p-3 cursor-pointer transition-colors ${
                            selectedCardId === "new" ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                          }`}
                          onClick={() => setSelectedCardId("new")}
                        >
                          <input
                            type="radio"
                            checked={selectedCardId === "new"}
                            onChange={() => setSelectedCardId("new")}
                            className="accent-primary"
                          />
                          <span className="text-sm font-medium">Usar novo cartão</span>
                        </div>
                      </div>
                    )}

                    {selectedCardId === "new" && (
                      <CreditCardForm
                        value={cardForm}
                        onChange={setCardForm}
                        saveCard={saveCard}
                        onSaveCardChange={setSaveCard}
                      />
                    )}
                  </div>
                )}


                <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
                  <Input
                    placeholder="Nome"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="h-10 sm:h-12 text-sm sm:text-base"
                  />
                  <Input
                    placeholder="Sobrenome"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="h-10 sm:h-12 text-sm sm:text-base"
                  />
                  <Input
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => setCpf(maskCPF(e.target.value))}
                    maxLength={14}
                    inputMode="numeric"
                    className="h-10 sm:h-12 text-sm sm:text-base"
                  />
                </div>
              </section>

              <Separator />

              {/* Message to Owner */}
              <section>
                <h2 className="font-bold text-lg sm:text-xl mb-2">Fale com o proprietário</h2>
                <p className="text-muted-foreground text-xs sm:text-sm mb-3 sm:mb-4">
                  Conte sobre sua viagem, motivo do aluguel e outras informações importantes.
                </p>

                <Card className="mb-3 sm:mb-4">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Avatar className="w-10 h-10 sm:w-12 sm:h-12">
                        <AvatarImage src={owner?.profile_image || undefined} />
                        <AvatarFallback className="text-sm">
                          {owner?.first_name?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm sm:text-base truncate">{owner?.first_name}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
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
                  className="min-h-[100px] sm:min-h-[120px] resize-none text-sm sm:text-base"
                />
              </section>

              <Separator />

              {/* Cancellation Policy */}
              <section>
                <h2 className="font-bold text-lg sm:text-xl mb-2">Política de cancelamento</h2>
                <p className="text-muted-foreground text-xs sm:text-base">
                  Esta reserva não é reembolsável.{" "}
                  <Button variant="link" className="p-0 h-auto text-foreground underline text-xs sm:text-base">
                    Saiba mais
                  </Button>
                </p>
              </section>

              <Separator />

              {/* Basic Rules */}
              <section>
                <h2 className="font-bold text-lg sm:text-xl mb-2">Regras básicas</h2>
                <p className="text-muted-foreground text-xs sm:text-base mb-3 sm:mb-4">
                  Pedimos a todos os locatários que se lembrem de alguns pequenos detalhes que contribuem para uma boa experiência.
                </p>
                <ul className="space-y-1.5 sm:space-y-2 text-muted-foreground text-xs sm:text-base">
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
                <h2 className="font-bold text-lg sm:text-xl mb-3 sm:mb-4">Termos e Políticas</h2>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                  Para continuar, você precisa ler e aceitar os termos abaixo:
                </p>

                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <Checkbox
                      id="ownerRules"
                      checked={acceptOwnerRules}
                      onCheckedChange={(checked) => setAcceptOwnerRules(checked === true)}
                      className="mt-0.5"
                    />
                    <Label htmlFor="ownerRules" className="text-xs sm:text-sm leading-relaxed cursor-pointer">
                      Li e aceito as{" "}
                      <Button variant="link" className="p-0 h-auto text-primary underline text-xs sm:text-sm">
                        Regras do proprietário
                      </Button>
                    </Label>
                  </div>

                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <Checkbox
                      id="basicRules"
                      checked={acceptBasicRules}
                      onCheckedChange={(checked) => setAcceptBasicRules(checked === true)}
                      className="mt-0.5"
                    />
                    <Label htmlFor="basicRules" className="text-xs sm:text-sm leading-relaxed cursor-pointer">
                      Li e aceito as{" "}
                      <Button variant="link" className="p-0 h-auto text-primary underline text-xs sm:text-sm">
                        Regras básicas
                      </Button>
                    </Label>
                  </div>

                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <Checkbox
                      id="cancellationPolicy"
                      checked={acceptCancellationPolicy}
                      onCheckedChange={(checked) => setAcceptCancellationPolicy(checked === true)}
                      className="mt-0.5"
                    />
                    <Label htmlFor="cancellationPolicy" className="text-xs sm:text-sm leading-relaxed cursor-pointer">
                      Li e aceito a{" "}
                      <Button variant="link" className="p-0 h-auto text-primary underline text-xs sm:text-sm">
                        Política de Cancelamento
                      </Button>
                    </Label>
                  </div>

                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <Checkbox
                      id="termsOfService"
                      checked={acceptTermsOfService}
                      onCheckedChange={(checked) => setAcceptTermsOfService(checked === true)}
                      className="mt-0.5"
                    />
                    <Label htmlFor="termsOfService" className="text-xs sm:text-sm leading-relaxed cursor-pointer">
                      Li e aceito os{" "}
                      <Button variant="link" className="p-0 h-auto text-primary underline text-xs sm:text-sm">
                        Termos de Serviço
                      </Button>
                    </Label>
                  </div>

                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <Checkbox
                      id="privacyPolicy"
                      checked={acceptPrivacyPolicy}
                      onCheckedChange={(checked) => setAcceptPrivacyPolicy(checked === true)}
                      className="mt-0.5"
                    />
                    <Label htmlFor="privacyPolicy" className="text-xs sm:text-sm leading-relaxed cursor-pointer">
                      Li e aceito a{" "}
                      <Button variant="link" className="p-0 h-auto text-primary underline text-xs sm:text-sm">
                        Política de Privacidade
                      </Button>
                    </Label>
                  </div>
                </div>

                {!allAccepted && (
                  <p className="text-xs sm:text-sm text-destructive mt-3 sm:mt-4">
                    * Todos os itens acima são obrigatórios
                  </p>
                )}

                <Button
                  size="lg"
                  className="w-full gradient-accent text-accent-foreground hover:opacity-90 transition-smooth px-6 sm:px-8 mt-4 sm:mt-6 text-sm sm:text-base"
                  onClick={handleConfirmBooking}
                  disabled={isProcessing}
                >
                  {isProcessing ? "Processando pagamento..." : "Confirmar e pagar"}
                </Button>
              </section>
            </div>

            {/* Right Column - Summary */}
            <div className="lg:col-span-2 order-first lg:order-none">
              <Card className="lg:sticky lg:top-24 border shadow-lg">
                <CardContent className="p-4 sm:p-6">
                  {/* Vehicle Preview */}
                  <div className="flex gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div className="w-20 h-16 sm:w-28 sm:h-24 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={images[0] || "https://images.unsplash.com/photo-1590362891991-f776e747a588"}
                        alt={`${vehicle.brand} ${vehicle.model}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm sm:text-base truncate">
                        {vehicle.brand} {vehicle.model} {vehicle.year}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground capitalize">
                        {vehicle.vehicle_type}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-accent text-accent" />
                        <span className="text-xs sm:text-sm font-medium">5,00</span>
                        <span className="text-xs sm:text-sm text-muted-foreground">(0)</span>
                      </div>
                    </div>
                  </div>

                  <Separator className="mb-4 sm:mb-6" />

                  {/* Price Summary */}
                  <div>
                    <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4">Resumo do Pagamento</h3>

                    <div className="space-y-2 sm:space-y-3 text-sm sm:text-base">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          {isAppDriver
                            ? `Aluguel ${appDriverPeriod === "weekly" ? "Semanal" : "Mensal"} (${days} dias)`
                            : `Diária (${formatCurrencyBRL(vehicle.daily_price)} × ${days})`
                          }
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
                        <span className="font-bold text-base sm:text-lg text-primary">{formatCurrencyBRL(totalPrice)}</span>
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

      {chargeData && (
        <AsaasPaymentModal
          open={paymentModalOpen}
          onOpenChange={setPaymentModalOpen}
          chargeId={chargeData.chargeId}
          asaasPaymentId={chargeData.asaasPaymentId}
          billingType={chargeData.billingType}
          pixQrCode={chargeData.pixQrCode}
          pixCopyPaste={chargeData.pixCopyPaste}
          invoiceUrl={chargeData.invoiceUrl}
          bankSlipUrl={chargeData.bankSlipUrl}
          boletoIdentificationField={chargeData.boletoIdentificationField}
          initialStatus={chargeData.initialStatus}
          value={chargeData.value}
        />
      )}
    </div>
  );
};

export default Checkout;
