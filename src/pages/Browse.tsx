import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Star } from "lucide-react";
import { useVehicles } from "@/hooks/useVehicles";
import { useBrands, useModels } from "@/hooks/useBrands";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { FavoriteButton } from "@/components/FavoriteButton";
import { formatCurrencyBRL } from "@/lib/validators";
import { TuroSearchBar } from "@/components/TuroSearchBar";
import { FilterBar } from "@/components/browse/FilterBar";

const Browse = () => {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    vehicleType: "all",
    transmission: "all",
    fuel: "all",
    maxPrice: undefined as number | undefined,
    minPrice: undefined as number | undefined,
    city: "",
    brandId: "all",
    modelId: "all",
    fromDate: undefined as string | undefined,
    untilDate: undefined as string | undefined,
    fromTime: undefined as string | undefined,
    untilTime: undefined as string | undefined,
    minYear: undefined as number | undefined,
    maxYear: undefined as number | undefined,
  });
  const [sortBy, setSortBy] = useState("relevance");

  // Ler parâmetros da URL ao carregar a página
  const urlCity = searchParams.get("city") || "";
  const urlFromDate = searchParams.get("from") || undefined;
  const urlUntilDate = searchParams.get("until") || undefined;
  const urlFromTime = searchParams.get("fromTime") || "10:00";
  const urlUntilTime = searchParams.get("untilTime") || "10:00";

  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      city: urlCity,
      fromDate: urlFromDate,
      untilDate: urlUntilDate,
      fromTime: urlFromTime,
      untilTime: urlUntilTime,
    }));
  }, [urlCity, urlFromDate, urlUntilDate, urlFromTime, urlUntilTime]);

  const { data: brands } = useBrands();
  const { data: models } = useModels(filters.brandId !== "all" ? filters.brandId : undefined);
  const { data: vehicles, isLoading } = useVehicles(filters);

  // Ordenar veículos
  const sortedVehicles = vehicles ? [...vehicles].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.daily_price - b.daily_price;
      case "price-high":
        return b.daily_price - a.daily_price;
      case "year-new":
        return b.year - a.year;
      default:
        return 0;
    }
  }) : [];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24 pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search Bar */}
          <div className="mb-6">
            <TuroSearchBar
              initialLocation={urlCity}
              initialFromDate={urlFromDate}
              initialUntilDate={urlUntilDate}
              initialFromTime={urlFromTime}
              initialUntilTime={urlUntilTime}
            />
          </div>

          {/* Turo-style Filter Bar */}
          <FilterBar
            filters={filters}
            onFiltersChange={setFilters}
            brands={brands}
            models={models}
            sortBy={sortBy}
            onSortChange={setSortBy}
            resultsCount={sortedVehicles.length}
            vehicles={vehicles || []}
          />

          {/* Results */}
          <div className="mb-4">
            <p className="text-muted-foreground">
              {isLoading ? "Carregando..." : (
                <>Mostrando <span className="font-semibold text-foreground">{sortedVehicles.length}</span> resultados</>
              )}
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Carregando veículos...</p>
            </div>
          ) : sortedVehicles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhum veículo encontrado com os filtros selecionados.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedVehicles.map((vehicle) => {
                const primaryImage = vehicle.vehicle_images?.find(img => img.is_primary) || vehicle.vehicle_images?.[0];
                const location = vehicle.addresses ? `${vehicle.addresses.city}, ${vehicle.addresses.state}` : "Localização não informada";
                
                return (
                  <Link key={vehicle.id} to={`/cars/${vehicle.id}`}>
                    <Card className="overflow-hidden group hover:shadow-xl transition-smooth border-2 hover:border-primary h-full">
                      <div className="relative h-56 overflow-hidden">
                        <img
                          src={primaryImage?.image_url || "https://images.unsplash.com/photo-1590362891991-f776e747a588"}
                          alt={`${vehicle.brand} ${vehicle.model}`}
                          className="w-full h-full object-cover group-hover:scale-110 transition-smooth"
                        />
                        <Badge className="absolute top-4 left-4 bg-background/90 backdrop-blur capitalize">
                          {vehicle.vehicle_type}
                        </Badge>
                        <FavoriteButton 
                          vehicleId={vehicle.id} 
                          size="sm" 
                          variant="overlay"
                          className="absolute top-4 right-4"
                        />
                      </div>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-bold text-xl">{vehicle.brand} {vehicle.model} {vehicle.year}</h3>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-accent text-accent" />
                            <span className="font-semibold">4.9</span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          📍 {location}
                        </p>
                        <div className="flex gap-2 mb-4">
                          <Badge variant="secondary" className="text-xs capitalize">
                            {vehicle.transmission_type}
                          </Badge>
                          <Badge variant="secondary" className="text-xs capitalize">
                            {vehicle.fuel_type}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-2xl font-bold text-primary">
                              {formatCurrencyBRL(vehicle.daily_price)}
                            </span>
                            <span className="text-muted-foreground text-sm">/dia</span>
                          </div>
                          <Button size="sm" className="bg-primary text-white hover:bg-primary/90">
                            Ver Detalhes
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
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

export default Browse;
