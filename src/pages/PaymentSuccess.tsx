import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useCreateBooking } from "@/hooks/useBookings";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, AlertCircle } from "lucide-react";
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
  const [verificationFailed, setVerificationFailed] = useState(false);
  const hasAttempted = useRef(false);

  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (hasAttempted.current) return;

    const verifyAndCreateBooking = async () => {
      if (!user || bookingCreated || isCreating) return;
      if (!sessionId) return;

      hasAttempted.current = true;
      setIsCreating(true);

      try {
        // Step 1: Verify payment with Stripe via edge function
        const { data: verifyData, error: verifyError } = await supabase.functions.invoke("verify-payment", {
          body: { sessionId },
        });

        if (verifyError || !verifyData?.verified) {
          console.error("Payment verification failed:", verifyError || verifyData?.error);
          setVerificationFailed(true);
          return;
        }

        // Step 2: Use VERIFIED metadata from Stripe (not URL params)
        const metadata = verifyData.metadata;
        const formattedStartDate = `${metadata.startDate}T12:00:00`;
        const formattedEndDate = `${metadata.endDate}T12:00:00`;

        await createBooking.mutateAsync({
          vehicle_id: metadata.vehicleId,
          owner_id: metadata.ownerId,
          start_date: formattedStartDate,
          end_date: formattedEndDate,
          total_days: parseInt(metadata.days),
          daily_rate: parseFloat(metadata.dailyRate),
          total_price: parseFloat(metadata.totalPrice),
          pickup_location: metadata.pickupLocation || null,
          notes: metadata.notes || null,
          start_time: metadata.startTime || null,
          end_time: metadata.endTime || null,
          extra_hours: parseFloat(metadata.extraHours || "0"),
          extra_hours_charge: parseFloat(metadata.extraHoursCharge || "0"),
          acceptances: metadata.acceptances ? JSON.parse(metadata.acceptances) : undefined,
        });

        // Step 3: Send payment confirmation email
        const customerData = await getUserEmailData(user.id);
        if (customerData) {
          const { data: vehicleInfo } = await supabase
            .from("vehicles")
            .select("brand, model")
            .eq("id", metadata.vehicleId)
            .single();

          sendPaymentConfirmedEmail({
            customerEmail: customerData.email,
            customerName: customerData.name,
            vehicleName: vehicleInfo ? `${vehicleInfo.brand} ${vehicleInfo.model}` : metadata.vehicleId,
            startDate: formattedStartDate,
            endDate: formattedEndDate,
            dailySubtotal: parseFloat(metadata.dailyRate) * parseInt(metadata.days),
            extraHoursCharge: parseFloat(metadata.extraHoursCharge || "0"),
            insurance: 0,
            totalPrice: parseFloat(metadata.totalPrice),
            sessionId: sessionId || "",
          });
        }

        setBookingCreated(true);
      } catch (error) {
        console.error("Error creating booking:", error);
        hasAttempted.current = false;
      } finally {
        setIsCreating(false);
      }
    };

    verifyAndCreateBooking();
  }, [user]);

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
              {verificationFailed ? (
                <>
                  <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="w-12 h-12 text-destructive" />
                  </div>
                  <h1 className="font-display text-2xl font-bold mb-3">
                    Erro na verificação do pagamento
                  </h1>
                  <p className="text-muted-foreground mb-6">
                    Não foi possível verificar seu pagamento. Se você foi cobrado, entre em contato com o suporte.
                  </p>
                </>
              ) : (
                <>
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
                        ? "Verificando pagamento e criando sua reserva..."
                        : "Processando sua reserva..."}
                  </p>
                </>
              )}

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
