import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useBooking } from "@/hooks/useBookings";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calendar, MapPin, Car, User, Phone, Mail, ArrowLeft, Clock, CreditCard, MessageSquare } from "lucide-react";

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
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: booking, isLoading } = useBooking(id || "");

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
  const ownerName = booking.profiles 
    ? `${booking.profiles.first_name} ${booking.profiles.last_name}` 
    : "Proprietário";
  const primaryImage = booking.vehicles?.vehicle_images?.find(img => img.is_primary);
  const startDate = new Date(booking.start_date);
  const endDate = new Date(booking.end_date);
  const createdAt = new Date(booking.created_at);
  
  const isOwner = user?.id === booking.owner_id;
  const isCustomer = user?.id === booking.customer_id;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" onClick={() => navigate("/my-bookings")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-display font-bold text-primary">
                Detalhes da Reserva
              </h1>
              <p className="text-muted-foreground">#{booking.id.slice(0, 8)}</p>
            </div>
            <Badge variant={statusVariants[booking.status] || "outline"} className="text-sm px-3 py-1">
              {statusLabels[booking.status] || booking.status}
            </Badge>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Vehicle Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="w-5 h-5" />
                    Veículo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    {primaryImage ? (
                      <img 
                        src={primaryImage.image_url} 
                        alt={vehicleName}
                        className="w-32 h-24 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-32 h-24 bg-muted rounded-lg flex items-center justify-center">
                        <Car className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold">{vehicleName}</h3>
                      {booking.vehicles && (
                        <div className="text-sm text-muted-foreground mt-1 space-y-1">
                          <p>Cor: {booking.vehicles.color}</p>
                          <p>Placa: {booking.vehicles.license_plate}</p>
                        </div>
                      )}
                      <Link 
                        to={`/cars/${booking.vehicle_id}`}
                        className="text-primary text-sm hover:underline mt-2 inline-block"
                      >
                        Ver página do veículo →
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Dates Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Período da Reserva
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Retirada</p>
                      <p className="font-semibold">{startDate.toLocaleDateString('pt-BR', { 
                        weekday: 'long', 
                        day: '2-digit', 
                        month: 'long', 
                        year: 'numeric' 
                      })}</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Devolução</p>
                      <p className="font-semibold">{endDate.toLocaleDateString('pt-BR', { 
                        weekday: 'long', 
                        day: '2-digit', 
                        month: 'long', 
                        year: 'numeric' 
                      })}</p>
                    </div>
                  </div>
                  <div className="mt-4 text-center">
                    <span className="text-2xl font-bold text-primary">{booking.total_days}</span>
                    <span className="text-muted-foreground ml-1">
                      {booking.total_days === 1 ? 'dia' : 'dias'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Location Card */}
              {(booking.pickup_location || booking.return_location) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Localização
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {booking.pickup_location && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Local de Retirada</p>
                        <p className="font-medium">{booking.pickup_location}</p>
                      </div>
                    )}
                    {booking.return_location && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Local de Devolução</p>
                        <p className="font-medium">{booking.return_location}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Notes Card */}
              {booking.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Observações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{booking.notes}</p>
                  </CardContent>
                </Card>
              )}

              {/* Owner Info (visible to customer) */}
              {isCustomer && booking.profiles && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Proprietário
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{ownerName}</p>
                        {booking.profiles.phone_number && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {booking.profiles.phone_number}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Price Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Resumo do Pagamento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(() => {
                    const subtotal = booking.daily_rate * booking.total_days;
                    const insurance = booking.total_days * 20;
                    return (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Diária (R$ {booking.daily_rate.toFixed(2)} × {booking.total_days})
                          </span>
                          <span>R$ {subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Seguro</span>
                          <span>R$ {insurance.toFixed(2)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-semibold text-lg">
                          <span>Total</span>
                          <span className="text-primary">R$ {booking.total_price.toFixed(2)}</span>
                        </div>
                      </>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Booking Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Informações
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Criada em</span>
                    <span>{createdAt.toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant={statusVariants[booking.status] || "outline"} className="text-xs">
                      {statusLabels[booking.status] || booking.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="space-y-2">
                {/* Message Button - Available for confirmed, in_progress, and completed bookings */}
                {['confirmed', 'in_progress', 'completed'].includes(booking.status) && (
                  <Button className="w-full" asChild>
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
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/my-bookings">Voltar para Minhas Reservas</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BookingDetails;
