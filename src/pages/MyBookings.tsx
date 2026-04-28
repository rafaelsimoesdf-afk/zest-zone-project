import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useMyBookings } from "@/hooks/useBookings";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Car, Star } from "lucide-react";
import { formatCurrencyBRL } from "@/lib/validators";
import { translateBookingStatus } from "@/lib/translations";
import { ReviewForm } from "@/components/reviews/ReviewForm";

const MyBookings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: bookings, isLoading } = useMyBookings();
  const [reviewBooking, setReviewBooking] = useState<{
    id: string;
    ownerId: string;
    ownerName: string;
  } | null>(null);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-3 sm:px-4 py-20 sm:py-24">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl sm:text-4xl font-display font-bold mb-4 sm:mb-8 text-primary">
            Minhas Reservas
          </h1>

          {isLoading ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10 sm:py-16">
                <p className="text-muted-foreground text-sm sm:text-base">Carregando suas reservas...</p>
              </CardContent>
            </Card>
          ) : !bookings || bookings.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10 sm:py-16 px-4">
                <Car className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mb-3 sm:mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold mb-2 text-center">Nenhuma reserva encontrada</h3>
                <p className="text-muted-foreground mb-4 sm:mb-6 text-center text-sm sm:text-base">
                  Você ainda não fez nenhuma reserva. Explore nossos carros disponíveis!
                </p>
                <Button asChild size="sm" className="sm:text-base">
                  <Link to="/browse">Buscar Carros</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {bookings.map((booking) => {
                const vehicleName = booking.vehicles ? `${booking.vehicles.brand} ${booking.vehicles.model} ${booking.vehicles.year}` : "Veículo";
                const ownerName = booking.profiles ? `${booking.profiles.first_name} ${booking.profiles.last_name}` : "Proprietário";
                const primaryImage = booking.vehicles?.vehicle_images?.find(img => img.is_primary);
                const startDate = new Date(booking.start_date).toLocaleDateString('pt-BR');
                const endDate = new Date(booking.end_date).toLocaleDateString('pt-BR');
                
                return (
                  <Card key={booking.id}>
                    <CardHeader className="p-3 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:justify-between">
                        <div className="flex gap-3">
                          {primaryImage && (
                            <img 
                              src={primaryImage.image_url} 
                              alt={vehicleName}
                              className="w-16 h-16 sm:w-24 sm:h-24 object-cover rounded-lg shrink-0"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-sm sm:text-lg truncate">{vehicleName}</CardTitle>
                            <CardDescription className="text-xs sm:text-sm">Reserva #{booking.id.slice(0, 8)}</CardDescription>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">Proprietário: {ownerName}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs sm:text-sm self-start shrink-0">
                          {translateBookingStatus(booking.status)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                      <div className="grid gap-2 sm:gap-4 mb-3 sm:mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground shrink-0" />
                          <span className="text-xs sm:text-sm">
                            {startDate} - {endDate} ({booking.total_days} {booking.total_days === 1 ? 'dia' : 'dias'})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-semibold">
                            Total: {formatCurrencyBRL(booking.total_price)}
                          </span>
                        </div>
                      </div>
                      {booking.pickup_location && (
                        <div className="flex items-start gap-2 mb-3 sm:mb-4">
                          <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground shrink-0 mt-0.5" />
                          <span className="text-xs sm:text-sm break-words">{booking.pickup_location}</span>
                        </div>
                      )}
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs sm:text-sm h-8 sm:h-9"
                          onClick={() => navigate(`/booking/${booking.id}`)}
                        >
                          Ver Detalhes
                        </Button>
                        {booking.status === 'completed' && user?.id === booking.customer_id && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-xs sm:text-sm h-8 sm:h-9"
                            onClick={() => setReviewBooking({
                              id: booking.id,
                              ownerId: booking.owner_id,
                              ownerName: ownerName
                            })}
                          >
                            <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                            Avaliar
                          </Button>
                        )}
                        {booking.status === 'pending' && (
                          <Button variant="ghost" size="sm" className="text-xs sm:text-sm h-8 sm:h-9">Cancelar</Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Review Modal */}
        {reviewBooking && (
          <ReviewForm
            open={!!reviewBooking}
            onOpenChange={(open) => !open && setReviewBooking(null)}
            bookingId={reviewBooking.id}
            reviewerId={user?.id || ""}
            reviewedId={reviewBooking.ownerId}
            reviewedName={reviewBooking.ownerName}
          />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default MyBookings;
