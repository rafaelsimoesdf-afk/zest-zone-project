import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const PaymentSuccess = () => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/auth" replace />;

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
                Assim que o Asaas confirmar o pagamento, sua reserva será criada automaticamente e aparecerá em "Minhas Reservas".
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
