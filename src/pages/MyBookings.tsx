import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useMyBookings } from "@/hooks/useBookings";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BottomTabBar from "@/components/BottomTabBar";
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
      {/* Desktop Navbar */}
      <div className="hidden md:block">
        <Navbar />
      </div>

      {/* Mobile Header */}
      <div className="md:hidden px-4 pt-14 pb-2">
        <h1 className="text-2xl font-bold text-foreground">Viagens</h1>
      </div>

      <main className="flex-1 container mx-auto px-3 sm:px-4 md:py-20 pb-20">
        {/* Desktop title */}
        <div className="hidden md:block max-w-5xl mx-auto">
          <h1 className="text-2xl sm:text-4xl font-display font-bold mb-4 sm:mb-8 text-primary">
            Minhas Reservas
          </h1>
        </div>

        <div className="max-w-5xl mx-auto">
          {isLoading ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">Carregando suas reservas...</p>
            </div>
          ) : !bookings || bookings.length === 0 ? (
            /* Airbnb-style empty state */
            <div className="text-center py-12 md:py-16 px-4">
              <div className="max-w-sm mx-auto">
                <Car className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Planeje sua próxima viagem</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Explore nossos carros disponíveis. Quando você reservar, suas viagens serão exibidas aqui.
                </p>
                <Button asChild className="rounded-lg">
                  <Link to="/browse">Comece já</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((booking) => {
                const vehicleName = booking.vehicles ? `${booking.vehicles.brand} ${booking.vehicles.model} ${booking.vehicles.year}` : "Veículo";
                const ownerName = booking.profiles ? `${booking.profiles.first_name} ${booking.profiles.last_name}` : "Proprietário";
                const primaryImage = booking.vehicles?.vehicle_images?.find(img => img.is_primary);
                const startDate = new Date(booking.start_date).toLocaleDateString('pt-BR');
                const endDate = new Date(booking.end_date).toLocaleDateString('pt-BR');

                return (
                  <button
                    key={booking.id}
                    onClick={() => navigate(`/booking/${booking.id}`)}
                    className="w-full bg-card border border-border rounded-2xl p-4 flex gap-4 text-left hover:shadow-md transition-shadow"
                  >
                    {primaryImage && (
                      <img
                        src={primaryImage.image_url}
                        alt={vehicleName}
                        className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-xl shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm md:text-base text-foreground truncate">{vehicleName}</h3>
                      <p className="text-xs text-muted-foreground">{startDate} – {endDate}</p>
                      <Badge variant="outline" className="text-xs mt-1.5">
                        {translateBookingStatus(booking.status)}
                      </Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

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

      <div className="hidden md:block">
        <Footer />
      </div>
      <BottomTabBar />
    </div>
  );
};

export default MyBookings;
