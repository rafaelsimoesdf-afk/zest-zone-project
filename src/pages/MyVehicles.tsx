import { useAuth } from "@/contexts/AuthContext";
import { useMyVehicles, useDeleteVehicle } from "@/hooks/useVehicles";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Car, Plus, Edit, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { formatCurrencyBRL } from "@/lib/validators";

const MyVehicles = () => {
  const { user } = useAuth();
  const { data: vehicles, isLoading } = useMyVehicles();
  const deleteVehicle = useDeleteVehicle();

  const handleDelete = (vehicleId: string) => {
    deleteVehicle.mutate(vehicleId);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-24">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-display font-bold text-primary">
              Meus Veículos
            </h1>
            <Button asChild>
              <Link to="/become-owner">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Veículo
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <p className="text-muted-foreground">Carregando seus veículos...</p>
              </CardContent>
            </Card>
          ) : !vehicles || vehicles.length === 0 ? (
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
              {vehicles.map((vehicle) => {
                const primaryImage = vehicle.vehicle_images?.find(img => img.is_primary) || vehicle.vehicle_images?.[0];
                
                return (
                  <Card key={vehicle.id}>
                    {primaryImage && (
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={primaryImage.image_url}
                          alt={`${vehicle.brand} ${vehicle.model}`}
                          className="w-full h-full object-cover"
                        />
                        <Badge className="absolute top-4 right-4 capitalize">{vehicle.status}</Badge>
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{vehicle.brand} {vehicle.model}</CardTitle>
                          <CardDescription>{vehicle.year} • {vehicle.color}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Tipo:</span>
                            <span className="ml-2 capitalize">{vehicle.vehicle_type}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Câmbio:</span>
                            <span className="ml-2 capitalize">{vehicle.transmission_type}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Combustível:</span>
                            <span className="ml-2 capitalize">{vehicle.fuel_type}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Passageiros:</span>
                            <span className="ml-2">{vehicle.seats}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t">
                          <div>
                            <span className="text-muted-foreground text-sm">Diária:</span>
                            <span className="font-semibold text-lg ml-2">{formatCurrencyBRL(vehicle.daily_price)}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1" disabled>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" disabled={deleteVehicle.isPending}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir este veículo? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDelete(vehicle.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
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

export default MyVehicles;
