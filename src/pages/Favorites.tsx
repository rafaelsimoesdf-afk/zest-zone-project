import { Link, Navigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BottomTabBar from '@/components/BottomTabBar';
import { useFavorites, useRemoveFavorite } from '@/hooks/useFavorites';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, Trash2, Car, MapPin, Fuel, Settings2 } from 'lucide-react';
import { formatCurrencyBRL } from '@/lib/validators';
import { translateTransmission, translateFuel } from '@/lib/translations';
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
      {/* Desktop Navbar */}
      <div className="hidden md:block">
        <Navbar />
      </div>

      {/* Mobile Header */}
      <div className="md:hidden px-4 pt-14 pb-2">
        <h1 className="text-2xl font-bold text-foreground">Favoritos</h1>
      </div>

      {/* Desktop Header */}
      <main className="container mx-auto px-3 sm:px-4 md:pt-20 md:pb-8 pb-20">
        <div className="hidden md:flex items-center gap-2 sm:gap-3 mb-4 sm:mb-8">
          <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-primary fill-primary" />
          <h1 className="text-xl sm:text-3xl font-bold text-foreground">Meus Favoritos</h1>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <Skeleton className="aspect-square rounded-xl mb-2" />
                <Skeleton className="h-4 w-3/4 mb-1" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : !favorites?.length ? (
          <div className="text-center py-16">
            <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Nenhum favorito ainda
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Explore nossos veículos e adicione seus favoritos clicando no ícone de coração.
            </p>
            <Button asChild size="sm">
              <Link to="/browse">Explorar Veículos</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
            {favorites.map((favorite) => {
              const vehicle = favorite.vehicle;
              if (!vehicle || vehicle.status !== 'approved') return null;

              return (
                <div key={favorite.id} className="group">
                  <div className="relative">
                    <Link to={`/car/${vehicle.id}`}>
                      <img
                        src={getVehicleImage(vehicle)}
                        alt={`${vehicle.brand} ${vehicle.model}`}
                        className="aspect-square w-full object-cover rounded-xl"
                      />
                    </Link>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground rounded-full h-8 w-8 shadow-md"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover dos favoritos?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Deseja remover {vehicle.brand} {vehicle.model} dos seus favoritos?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
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
                  <Link to={`/car/${vehicle.id}`} className="block mt-2">
                    <h3 className="font-semibold text-sm text-foreground truncate">
                      {vehicle.brand} {vehicle.model}
                    </h3>
                    <p className="text-xs text-muted-foreground">{vehicle.year}</p>
                    <p className="text-sm font-semibold text-foreground mt-0.5">
                      {formatCurrencyBRL(vehicle.daily_price)}<span className="text-xs font-normal text-muted-foreground">/dia</span>
                    </p>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <div className="hidden md:block">
        <Footer />
      </div>
      <BottomTabBar />
    </div>
  );
};

export default Favorites;
