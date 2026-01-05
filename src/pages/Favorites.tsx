import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useFavorites, useRemoveFavorite } from '@/hooks/useFavorites';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, Trash2, Car, MapPin, Fuel, Settings2 } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { formatCurrencyBRL } from '@/lib/validators';
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
      
      <main className="container mx-auto px-3 sm:px-4 pt-20 sm:pt-24 pb-6 sm:pb-8">
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-8">
          <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-primary fill-primary" />
          <h1 className="text-xl sm:text-3xl font-bold text-foreground">Meus Favoritos</h1>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-36 sm:h-48 w-full" />
                <CardContent className="p-3 sm:p-4">
                  <Skeleton className="h-5 sm:h-6 w-3/4 mb-2" />
                  <Skeleton className="h-3 sm:h-4 w-1/2 mb-3 sm:mb-4" />
                  <Skeleton className="h-7 sm:h-8 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !favorites?.length ? (
          <Card className="p-8 sm:p-12 text-center">
            <Heart className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-3 sm:mb-4" />
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
              Nenhum favorito ainda
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
              Explore nossos veículos e adicione seus favoritos clicando no ícone de coração.
            </p>
            <Button asChild size="sm" className="sm:text-base">
              <Link to="/browse">Explorar Veículos</Link>
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
                        className="h-36 sm:h-48 w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </Link>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground rounded-full h-8 w-8 sm:h-10 sm:w-10 shadow-md"
                        >
                          <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-base sm:text-lg">Remover dos favoritos?</AlertDialogTitle>
                          <AlertDialogDescription className="text-sm">
                            Deseja remover {vehicle.brand} {vehicle.model} dos seus favoritos?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                          <AlertDialogCancel className="sm:mr-2">Cancelar</AlertDialogCancel>
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

                  <CardContent className="p-3 sm:p-4">
                    <Link to={`/car/${vehicle.id}`}>
                      <h3 className="font-semibold text-sm sm:text-lg text-foreground group-hover:text-primary transition-colors truncate">
                        {vehicle.brand} {vehicle.model}
                      </h3>
                    </Link>
                    
                    <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
                      {vehicle.year}
                    </p>

                    <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                      {vehicle.addresses && (
                        <span className="inline-flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs text-muted-foreground bg-muted px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                          <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          {vehicle.addresses.city}, {vehicle.addresses.state}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs text-muted-foreground bg-muted px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                        <Settings2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        {transmissionLabels[vehicle.transmission_type] || vehicle.transmission_type}
                      </span>
                      <span className="inline-flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs text-muted-foreground bg-muted px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                        <Fuel className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        {fuelLabels[vehicle.fuel_type] || vehicle.fuel_type}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-lg sm:text-2xl font-bold text-primary">
                          {formatCurrencyBRL(vehicle.daily_price)}
                        </span>
                        <span className="text-xs sm:text-sm text-muted-foreground">/dia</span>
                      </div>
                      <Button asChild size="sm" className="shrink-0 text-xs sm:text-sm h-8 sm:h-9">
                        <Link to={`/car/${vehicle.id}`}>
                          <Car className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">Ver Detalhes</span>
                          <span className="sm:hidden">Ver</span>
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
