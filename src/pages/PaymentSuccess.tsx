import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useCreateBooking } from "@/hooks/useBookings";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { sendPaymentConfirmedEmail, getUserEmailData } from "@/hooks/useEmailNotifications";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const createBooking = useCreateBooking();
  const [bookingCreated, setBookingCreated] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const sessionId = searchParams.get("session_id");
  const vehicleId = searchParams.get("vehicleId");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const startTime = searchParams.get("startTime");
  const endTime = searchParams.get("endTime");
  const days = searchParams.get("days");
  const dailyRate = searchParams.get("dailyRate");
  const extraHours = searchParams.get("extraHours");
  const extraHoursCharge = searchParams.get("extraHoursCharge");
  const totalPrice = searchParams.get("totalPrice");
  const ownerId = searchParams.get("ownerId");
  const pickupLocation = searchParams.get("pickupLocation");
  const notes = searchParams.get("notes");
  const acceptancesParam = searchParams.get("acceptances");

  // Parse acceptances from URL
  const acceptances = acceptancesParam ? JSON.parse(decodeURIComponent(acceptancesParam)) : null;

  useEffect(() => {
    const createBookingAfterPayment = async () => {
      if (!user || bookingCreated || isCreating) return;
      if (!vehicleId || !startDate || !endDate || !days || !dailyRate || !totalPrice || !ownerId) {
        return;
      }

      setIsCreating(true);

      try {
        const formattedStartDate = `${startDate}T12:00:00`;
        const formattedEndDate = `${endDate}T12:00:00`;

        await createBooking.mutateAsync({
          vehicle_id: vehicleId,
          owner_id: ownerId,
          start_date: formattedStartDate,
          end_date: formattedEndDate,
          total_days: parseInt(days),
          daily_rate: parseFloat(dailyRate),
          total_price: parseFloat(totalPrice),
          pickup_location: pickupLocation || null,
          notes: notes || null,
          start_time: startTime || null,
          end_time: endTime || null,
          extra_hours: parseFloat(extraHours || '0'),
          extra_hours_charge: parseFloat(extraHoursCharge || '0'),
          acceptances: acceptances || undefined,
        });

        // Send payment confirmation email
        const customerData = await getUserEmailData(user.id);
        if (customerData) {
          // Get vehicle name from ownerId context (already passed as vehicleName-like string)
          const { data: vehicleInfo } = await import("@/integrations/supabase/client").then(m =>
            m.supabase.from("vehicles").select("brand, model").eq("id", vehicleId).single()
          );
          sendPaymentConfirmedEmail({
            customerEmail: customerData.email,
            customerName: customerData.name,
            vehicleName: vehicleInfo ? `${vehicleInfo.brand} ${vehicleInfo.model}` : vehicleId,
            startDate: formattedStartDate,
            endDate: formattedEndDate,
            dailySubtotal: parseFloat(dailyRate) * parseInt(days),
            extraHoursCharge: parseFloat(extraHoursCharge || '0'),
            insurance: 0,
            totalPrice: parseFloat(totalPrice),
            sessionId: sessionId || "",
          });
        }

        setBookingCreated(true);
      } catch (error) {
        console.error("Error creating booking:", error);
      } finally {
        setIsCreating(false);
      }
    };

    createBookingAfterPayment();
  }, [user, vehicleId, startDate, endDate, startTime, endTime, days, dailyRate, extraHours, extraHoursCharge, totalPrice, ownerId, pickupLocation, notes, acceptances, bookingCreated, isCreating]);

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 pt-24 pb-20 flex items-center justify-center">
        <div className="container mx-auto px-4 max-w-lg">
          <Card className="border shadow-lg">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
              </div>

              <h1 className="font-display text-2xl font-bold mb-3">
                Pagamento confirmado!
              </h1>

              <p className="text-muted-foreground mb-6">
                {bookingCreated 
                  ? "Sua reserva foi criada com sucesso. O proprietário será notificado e você receberá a confirmação em breve."
                  : isCreating 
                    ? "Criando sua reserva..."
                    : "Processando sua reserva..."
                }
              </p>

              <div className="space-y-3">
                <Button asChild className="w-full gradient-accent text-accent-foreground">
                  <Link to="/my-bookings">Ver minhas reservas</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/browse">Continuar explorando</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PaymentSuccess;
