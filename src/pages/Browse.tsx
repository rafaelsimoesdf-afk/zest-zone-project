import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, Star } from "lucide-react";
import { useVehicles } from "@/hooks/useVehicles";
import { useBrands, useModels } from "@/hooks/useBrands";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "react-router-dom";
import { FavoriteButton } from "@/components/FavoriteButton";
import { formatCurrencyBRL } from "@/lib/validators";
import { TuroSearchBar } from "@/components/TuroSearchBar";

const Browse = () => {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    vehicleType: "all",
    transmission: "all",
    fuel: "all",
    maxPrice: undefined as number | undefined,
    city: "",
    brandId: "all",
    modelId: "all",
    fromDate: undefined as string | undefined,
    untilDate: undefined as string | undefined,
    fromTime: undefined as string | undefined,
    untilTime: undefined as string | undefined,
    minYear: undefined as number | undefined,
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
          <div className="mb-8">
            <TuroSearchBar
              initialLocation={urlCity}
              initialFromDate={urlFromDate}
              initialUntilDate={urlUntilDate}
              initialFromTime={urlFromTime}
              initialUntilTime={urlUntilTime}
            />
          </div>

          {/* Filters - Always Visible */}
          <div className="bg-card border rounded-2xl p-6 mb-8 shadow-md">
            <div className="flex items-center gap-2 mb-4">
              <SlidersHorizontal className="w-5 h-5 text-muted-foreground" />
              <h2 className="font-semibold text-lg">Filtros</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Marca</label>
                <Select
                  value={filters.brandId}
                  onValueChange={(value) => setFilters({ ...filters, brandId: value, modelId: "all" })}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Selecione a marca" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Marcas</SelectItem>
                    {brands?.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Modelo</label>
                <Select
                  value={filters.modelId}
                  onValueChange={(value) => setFilters({ ...filters, modelId: value })}
                  disabled={filters.brandId === "all"}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Selecione o modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Modelos</SelectItem>
                    {models?.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Tipo de Veículo</label>
                <Select
                  value={filters.vehicleType}
                  onValueChange={(value) => setFilters({ ...filters, vehicleType: value })}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Tipos</SelectItem>
                    <SelectItem value="sedan">Sedan</SelectItem>
                    <SelectItem value="suv">SUV</SelectItem>
                    <SelectItem value="hatchback">Hatchback</SelectItem>
                    <SelectItem value="pickup">Pickup</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Transmissão</label>
                <Select
                  value={filters.transmission}
                  onValueChange={(value) => setFilters({ ...filters, transmission: value })}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="automatic">Automático</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Combustível</label>
                <Select
                  value={filters.fuel}
                  onValueChange={(value) => setFilters({ ...filters, fuel: value })}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="flex">Flex</SelectItem>
                    <SelectItem value="gasoline">Gasolina</SelectItem>
                    <SelectItem value="diesel">Diesel</SelectItem>
                    <SelectItem value="electric">Elétrico</SelectItem>
                    <SelectItem value="hybrid">Híbrido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Preço Máximo</label>
                <Select
                  value={filters.maxPrice?.toString() || "all"}
                  onValueChange={(value) => setFilters({ ...filters, maxPrice: value !== "all" ? parseFloat(value) : undefined })}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Selecione o preço" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Sem limite</SelectItem>
                    <SelectItem value="100">Até R$ 100/dia</SelectItem>
                    <SelectItem value="150">Até R$ 150/dia</SelectItem>
                    <SelectItem value="200">Até R$ 200/dia</SelectItem>
                    <SelectItem value="300">Até R$ 300/dia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Ano Mínimo</label>
                <Select
                  value={filters.minYear?.toString() || "all"}
                  onValueChange={(value) => setFilters({ ...filters, minYear: value !== "all" ? parseInt(value) : undefined })}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Selecione o ano" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Qualquer ano</SelectItem>
                    <SelectItem value="2024">A partir de 2024</SelectItem>
                    <SelectItem value="2023">A partir de 2023</SelectItem>
                    <SelectItem value="2022">A partir de 2022</SelectItem>
                    <SelectItem value="2020">A partir de 2020</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Ordenar por</label>
                <Select
                  value={sortBy}
                  onValueChange={setSortBy}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevância</SelectItem>
                    <SelectItem value="price-low">Menor Preço</SelectItem>
                    <SelectItem value="price-high">Maior Preço</SelectItem>
                    <SelectItem value="year-new">Mais Novo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>


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
