import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useBooking } from "@/hooks/useBookings";
import { useExistingReview } from "@/hooks/useReviews";
import { useUpdateOwnerBookingStatus } from "@/hooks/useOwnerDashboard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calendar, MapPin, Car, User, Phone, Mail, ArrowLeft, Clock, CreditCard, MessageSquare, Star, CheckCircle } from "lucide-react";
import { formatCurrencyBRL } from "@/lib/validators";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import InspectionSection from "@/components/inspection/InspectionSection";
import { useBookingInspections } from "@/hooks/useVehicleInspections";

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
  completed: "Concluída",
};

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  confirmed: "default",
  cancelled: "destructive",
  completed: "outline",
};


const BookingDetails = () => {
  const { id } = useParams();
  const bookingId = id || "";
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: booking, isLoading } = useBooking(bookingId);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showOwnerReviewModal, setShowOwnerReviewModal] = useState(false);

  const isOwner = !!user && !!booking && user.id === booking.owner_id;
  const isCustomer = !!user && !!booking && user.id === booking.customer_id;

  // Check if customer already reviewed the owner (hooks must be unconditional)
  const { data: existingCustomerReview } = useExistingReview(
    booking?.status === "completed" && isCustomer ? bookingId : "",
    booking?.status === "completed" && isCustomer ? user?.id || "" : ""
  );

  // Check if owner already reviewed the customer
  const { data: existingOwnerReview } = useExistingReview(
    booking?.status === "completed" && isOwner ? bookingId : "",
    booking?.status === "completed" && isOwner ? user?.id || "" : ""
  );

  const canCustomerReview = isCustomer && booking?.status === "completed" && !existingCustomerReview;
  const canOwnerReview = isOwner && booking?.status === "completed" && !existingOwnerReview;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-24">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <p className="text-muted-foreground">Carregando detalhes da reserva...</p>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-24">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Car className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Reserva não encontrada</h3>
                <p className="text-muted-foreground mb-6 text-center">
                  A reserva que você está procurando não existe ou você não tem permissão para visualizá-la.
                </p>
                <Button asChild>
                  <Link to="/my-bookings">Voltar para Minhas Reservas</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const vehicleName = booking.vehicles 
    ? `${booking.vehicles.brand} ${booking.vehicles.model} ${booking.vehicles.year}` 
    : "Veículo";
  const ownerName = booking.owner 
    ? `${booking.owner.first_name} ${booking.owner.last_name}` 
    : "Proprietário";
  const customerName = booking.customer
    ? `${booking.customer.first_name} ${booking.customer.last_name}`
    : "Locatário";
  const primaryImage = booking.vehicles?.vehicle_images?.find(img => img.is_primary);
  const startDate = new Date(booking.start_date);
  const endDate = new Date(booking.end_date);
  const createdAt = new Date(booking.created_at);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-3 sm:px-4 py-20 sm:py-24">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-8">
            <Button variant="ghost" size="icon" className="shrink-0 w-8 h-8 sm:w-10 sm:h-10" onClick={() => navigate("/my-bookings")}>
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-3xl font-display font-bold text-primary truncate">
                Detalhes da Reserva
              </h1>
              <p className="text-xs sm:text-base text-muted-foreground">#{booking.id.slice(0, 8)}</p>
            </div>
            <Badge variant={statusVariants[booking.status] || "outline"} className="text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1 shrink-0">
              {statusLabels[booking.status] || booking.status}
            </Badge>
          </div>

          <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {/* Vehicle Card */}
              <Card>
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                    <Car className="w-4 h-4 sm:w-5 sm:h-5" />
                    Veículo
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
                  <div className="flex gap-3 sm:gap-4">
                    {primaryImage ? (
                      <img 
                        src={primaryImage.image_url} 
                        alt={vehicleName}
                        className="w-20 h-16 sm:w-32 sm:h-24 object-cover rounded-lg shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-16 sm:w-32 sm:h-24 bg-muted rounded-lg flex items-center justify-center shrink-0">
                        <Car className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-xl font-semibold truncate">{vehicleName}</h3>
                      {booking.vehicles && (
                        <div className="text-xs sm:text-sm text-muted-foreground mt-1 space-y-0.5 sm:space-y-1">
                          <p>Cor: {booking.vehicles.color}</p>
                          <p className="truncate">Placa: {booking.vehicles.license_plate}</p>
                        </div>
                      )}
                      <Link 
                        to={`/cars/${booking.vehicle_id}`}
                        className="text-primary text-xs sm:text-sm hover:underline mt-1 sm:mt-2 inline-block"
                      >
                        Ver página do veículo →
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Dates Card */}
              <Card>
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                    Período da Reserva
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
                  <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                    <div className="p-3 sm:p-4 bg-muted/50 rounded-lg">
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">Retirada</p>
                      <p className="font-semibold text-xs sm:text-base">{startDate.toLocaleDateString('pt-BR', { 
                        weekday: 'short', 
                        day: '2-digit', 
                        month: 'short', 
                        year: 'numeric' 
                      })}</p>
                    </div>
                    <div className="p-3 sm:p-4 bg-muted/50 rounded-lg">
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">Devolução</p>
                      <p className="font-semibold text-xs sm:text-base">{endDate.toLocaleDateString('pt-BR', { 
                        weekday: 'short', 
                        day: '2-digit', 
                        month: 'short', 
                        year: 'numeric' 
                      })}</p>
                    </div>
                  </div>
                  <div className="mt-3 sm:mt-4 text-center">
                    <span className="text-xl sm:text-2xl font-bold text-primary">{booking.total_days}</span>
                    <span className="text-muted-foreground text-sm sm:text-base ml-1">
                      {booking.total_days === 1 ? 'dia' : 'dias'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Location Card */}
              {(booking.pickup_location || booking.return_location) && (
                <Card>
                  <CardHeader className="p-3 sm:p-6">
                    <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                      <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                      Localização
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0 space-y-3 sm:space-y-4">
                    {booking.pickup_location && (
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-1">Local de Retirada</p>
                        <p className="font-medium text-xs sm:text-base break-words">{booking.pickup_location}</p>
                      </div>
                    )}
                    {booking.return_location && (
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-1">Local de Devolução</p>
                        <p className="font-medium text-xs sm:text-base break-words">{booking.return_location}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Vehicle Inspection Section */}
              {user && (
                <InspectionSection
                  bookingId={booking.id}
                  bookingStatus={booking.status}
                  isOwner={isOwner}
                  isCustomer={isCustomer}
                  userId={user.id}
                />
              )}

              {/* Notes Card */}
              {booking.notes && (
                <Card>
                  <CardHeader className="p-3 sm:p-6">
                    <CardTitle className="text-sm sm:text-base">Observações</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
                    <p className="text-muted-foreground text-xs sm:text-base">{booking.notes}</p>
                  </CardContent>
                </Card>
              )}

              {/* Owner Info (visible to customer) */}
              {isCustomer && booking.owner && (
                <Card>
                  <CardHeader className="p-3 sm:p-6">
                    <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                      <User className="w-4 h-4 sm:w-5 sm:h-5" />
                      Proprietário
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden shrink-0">
                        {booking.owner.profile_image ? (
                          <img src={booking.owner.profile_image} alt={ownerName} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm sm:text-base truncate">{ownerName}</p>
                        {booking.owner.phone_number && (
                          <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="w-3 h-3 shrink-0" />
                            <span className="truncate">{booking.owner.phone_number}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Customer Info (visible to owner) */}
              {isOwner && booking.customer && (
                <Card>
                  <CardHeader className="p-3 sm:p-6">
                    <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                      <User className="w-4 h-4 sm:w-5 sm:h-5" />
                      Locatário
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden shrink-0">
                        {booking.customer.profile_image ? (
                          <img src={booking.customer.profile_image} alt={customerName} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm sm:text-base truncate">{customerName}</p>
                        {booking.customer.email && (
                          <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="w-3 h-3 shrink-0" />
                            <span className="truncate">{booking.customer.email}</span>
                          </p>
                        )}
                        {booking.customer.phone_number && (
                          <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="w-3 h-3 shrink-0" />
                            <span className="truncate">{booking.customer.phone_number}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4 sm:space-y-6 order-first lg:order-none">
              {/* Price Summary */}
              <Card>
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                    <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
                    Resumo do Pagamento
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0 space-y-2 sm:space-y-3">
                  {(() => {
                    const dailySubtotal = booking.daily_rate * booking.total_days;
                    const insurance = booking.total_days * 20;
                    const extraHoursCharge = Number((booking as any).extra_hours_charge) || 0;
                    const extraHours = Number((booking as any).extra_hours) || 0;
                    
                    return (
                      <>
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span className="text-muted-foreground">
                            Diária ({formatCurrencyBRL(booking.daily_rate)} × {booking.total_days})
                          </span>
                          <span>{formatCurrencyBRL(dailySubtotal)}</span>
                        </div>
                        {extraHoursCharge > 0.01 && (
                          <div className="flex justify-between text-xs sm:text-sm">
                            <span className="text-muted-foreground">Horas adicionais ({extraHours.toFixed(1)}h)</span>
                            <span>{formatCurrencyBRL(extraHoursCharge)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span className="text-muted-foreground">Seguro</span>
                          <span>{formatCurrencyBRL(insurance)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-semibold text-base sm:text-lg">
                          <span>Total</span>
                          <span className="text-primary">{formatCurrencyBRL(booking.total_price)}</span>
                        </div>
                      </>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Booking Info */}
              <Card>
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                    Informações
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0 space-y-2 sm:space-y-3 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Criada em</span>
                    <span>{createdAt.toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant={statusVariants[booking.status] || "outline"} className="text-xs">
                      {statusLabels[booking.status] || booking.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="space-y-2">
                {/* Review Button - Available for completed bookings for customers who haven't reviewed yet */}
                {canCustomerReview && (
                  <Button 
                    className="w-full" 
                    variant="default"
                    onClick={() => setShowReviewModal(true)}
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Avaliar Proprietário
                  </Button>
                )}
                {/* Show if customer already reviewed */}
                {isCustomer && booking.status === 'completed' && existingCustomerReview && (
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => setShowReviewModal(true)}
                  >
                    <Star className="w-4 h-4 mr-2 fill-accent text-accent" />
                    Editar Avaliação do Proprietário
                  </Button>
                )}
                {/* Owner Review Button - Available for completed bookings for owners who haven't reviewed yet */}
                {canOwnerReview && (
                  <Button 
                    className="w-full" 
                    variant="default"
                    onClick={() => setShowOwnerReviewModal(true)}
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Avaliar Locatário
                  </Button>
                )}
                {/* Show if owner already reviewed */}
                {isOwner && booking.status === 'completed' && existingOwnerReview && (
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => setShowOwnerReviewModal(true)}
                  >
                    <Star className="w-4 h-4 mr-2 fill-accent text-accent" />
                    Editar Avaliação do Locatário
                  </Button>
                )}
                {/* Message Button - Available for confirmed, in_progress, and completed bookings */}
                {['confirmed', 'in_progress', 'completed'].includes(booking.status) && (
                  <Button className="w-full" variant="outline" asChild>
                    <Link to={`/messages?booking=${booking.id}`}>
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Enviar Mensagem
                    </Link>
                  </Button>
                )}
                {booking.status === 'pending' && isCustomer && (
                  <Button variant="destructive" className="w-full">
                    Cancelar Reserva
                  </Button>
                )}
                {booking.status === 'pending' && isOwner && (
                  <>
                    <Button className="w-full">Confirmar Reserva</Button>
                    <Button variant="destructive" className="w-full">Recusar Reserva</Button>
                  </>
                )}
                {booking.status === 'completed' && isOwner && (
                  <Button className="w-full" variant="outline" disabled>
                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                    Reserva Finalizada
                  </Button>
                )}
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/my-bookings">Voltar para Minhas Reservas</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Customer Review Modal - for reviewing the owner */}
        {isCustomer && booking.status === 'completed' && (
          <ReviewForm
            open={showReviewModal}
            onOpenChange={setShowReviewModal}
            bookingId={booking.id}
            reviewerId={user?.id || ""}
            reviewedId={booking.owner_id}
            reviewedName={ownerName}
          />
        )}

        {/* Owner Review Modal - for reviewing the customer */}
        {isOwner && booking.status === 'completed' && (
          <ReviewForm
            open={showOwnerReviewModal}
            onOpenChange={setShowOwnerReviewModal}
            bookingId={booking.id}
            reviewerId={user?.id || ""}
            reviewedId={booking.customer_id}
            reviewedName={customerName}
          />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default BookingDetails;
