import { useAuth } from "@/contexts/AuthContext";
import { useMyBookings } from "@/hooks/useBookings";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Car } from "lucide-react";

const MyBookings = () => {
  const { user } = useAuth();
  const { data: bookings, isLoading } = useMyBookings();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-24">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-display font-bold mb-8 text-primary">
            Minhas Reservas
          </h1>

          {isLoading ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <p className="text-muted-foreground">Carregando suas reservas...</p>
              </CardContent>
            </Card>
          ) : !bookings || bookings.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Car className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Nenhuma reserva encontrada</h3>
                <p className="text-muted-foreground mb-6 text-center">
                  Você ainda não fez nenhuma reserva. Explore nossos carros disponíveis!
                </p>
                <Button asChild>
                  <a href="/browse">Buscar Carros</a>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => {
                const vehicleName = booking.vehicles ? `${booking.vehicles.brand} ${booking.vehicles.model} ${booking.vehicles.year}` : "Veículo";
                const ownerName = booking.profiles ? `${booking.profiles.first_name} ${booking.profiles.last_name}` : "Proprietário";
                const primaryImage = booking.vehicles?.vehicle_images?.find(img => img.is_primary);
                const startDate = new Date(booking.start_date).toLocaleDateString('pt-BR');
                const endDate = new Date(booking.end_date).toLocaleDateString('pt-BR');
                
                return (
                  <Card key={booking.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4">
                          {primaryImage && (
                            <img 
                              src={primaryImage.image_url} 
                              alt={vehicleName}
                              className="w-24 h-24 object-cover rounded-lg"
                            />
                          )}
                          <div>
                            <CardTitle>{vehicleName}</CardTitle>
                            <CardDescription>Reserva #{booking.id.slice(0, 8)}</CardDescription>
                            <p className="text-sm text-muted-foreground mt-1">Proprietário: {ownerName}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="capitalize">{booking.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2 mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">
                            {startDate} até {endDate} ({booking.total_days} {booking.total_days === 1 ? 'dia' : 'dias'})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">
                            Total: R$ {booking.total_price.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      {booking.pickup_location && (
                        <div className="flex items-center gap-2 mb-4">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{booking.pickup_location}</span>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Ver Detalhes</Button>
                        {booking.status === 'pending' && (
                          <Button variant="ghost" size="sm">Cancelar</Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MyBookings;
