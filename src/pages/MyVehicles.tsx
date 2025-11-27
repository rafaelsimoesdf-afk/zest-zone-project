import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Car, Plus, Edit, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

const MyVehicles = () => {
  const { user } = useAuth();

  // Mock data - will be replaced with real data from Supabase
  const vehicles = [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-24">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-display font-bold bg-gradient-primary bg-clip-text text-transparent">
              Meus Veículos
            </h1>
            <Button asChild>
              <Link to="/become-owner">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Veículo
              </Link>
            </Button>
          </div>

          {vehicles.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Car className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Nenhum veículo cadastrado</h3>
                <p className="text-muted-foreground mb-6 text-center">
                  Comece a ganhar dinheiro alugando seu carro!
                </p>
                <Button asChild>
                  <Link to="/become-owner">
                    <Plus className="w-4 h-4 mr-2" />
                    Cadastrar Primeiro Veículo
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {vehicles.map((vehicle: any) => (
                <Card key={vehicle.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{vehicle.brand} {vehicle.model}</CardTitle>
                        <CardDescription>{vehicle.year}</CardDescription>
                      </div>
                      <Badge variant="outline">{vehicle.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Diária:</span>
                        <span className="font-semibold text-lg">R$ {vehicle.dailyPrice}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MyVehicles;
