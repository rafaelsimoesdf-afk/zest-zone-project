import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useFavorites, useRemoveFavorite } from '@/hooks/useFavorites';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, Trash2, Car, MapPin, Fuel, Settings2 } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const transmissionLabels: Record<string, string> = {
  manual: 'Manual',
  automatic: 'Automático',
  cvt: 'CVT',
};

const fuelLabels: Record<string, string> = {
  gasoline: 'Gasolina',
  ethanol: 'Etanol',
  flex: 'Flex',
  diesel: 'Diesel',
  electric: 'Elétrico',
  hybrid: 'Híbrido',
};

const Favorites = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: favorites, isLoading } = useFavorites();
  const removeFavorite = useRemoveFavorite();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const getVehicleImage = (vehicle: any) => {
    if (!vehicle?.vehicle_images?.length) return '/placeholder.svg';
    const primary = vehicle.vehicle_images.find((img: any) => img.is_primary);
    return primary?.image_url || vehicle.vehicle_images[0]?.image_url || '/placeholder.svg';
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="h-8 w-8 text-primary fill-primary" />
          <h1 className="text-3xl font-bold text-foreground">Meus Favoritos</h1>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-4" />
                  <Skeleton className="h-8 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !favorites?.length ? (
          <Card className="p-12 text-center">
            <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Nenhum favorito ainda
            </h2>
            <p className="text-muted-foreground mb-6">
              Explore nossos veículos e adicione seus favoritos clicando no ícone de coração.
            </p>
            <Button asChild>
              <Link to="/browse">Explorar Veículos</Link>
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((favorite) => {
              const vehicle = favorite.vehicle;
              if (!vehicle || vehicle.status !== 'approved') return null;

              return (
                <Card key={favorite.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <Link to={`/car/${vehicle.id}`}>
                      <img
                        src={getVehicleImage(vehicle)}
                        alt={`${vehicle.brand} ${vehicle.model}`}
                        className="h-48 w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </Link>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground rounded-full h-10 w-10 shadow-md"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover dos favoritos?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Deseja remover {vehicle.brand} {vehicle.model} dos seus favoritos?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => removeFavorite.mutate(vehicle.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Remover
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>

                  <CardContent className="p-4">
                    <Link to={`/car/${vehicle.id}`}>
                      <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                        {vehicle.brand} {vehicle.model}
                      </h3>
                    </Link>
                    
                    <p className="text-sm text-muted-foreground mb-3">
                      {vehicle.year}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {vehicle.addresses && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                          <MapPin className="h-3 w-3" />
                          {vehicle.addresses.city}, {vehicle.addresses.state}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                        <Settings2 className="h-3 w-3" />
                        {transmissionLabels[vehicle.transmission_type] || vehicle.transmission_type}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                        <Fuel className="h-3 w-3" />
                        {fuelLabels[vehicle.fuel_type] || vehicle.fuel_type}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-2xl font-bold text-primary">
                          R$ {vehicle.daily_price.toLocaleString('pt-BR')}
                        </span>
                        <span className="text-sm text-muted-foreground">/dia</span>
                      </div>
                      <Button asChild size="sm">
                        <Link to={`/car/${vehicle.id}`}>
                          <Car className="h-4 w-4 mr-2" />
                          Ver Detalhes
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Favorites;
