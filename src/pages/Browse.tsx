import { useState } from "react";
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
import { CityAutocomplete } from "@/components/CityAutocomplete";

const Browse = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    vehicleType: "all",
    transmission: "all",
    fuel: "all",
    maxPrice: undefined as number | undefined,
    city: "",
    brandId: "all",
    modelId: "all",
  });

  const { data: brands } = useBrands();
  const { data: models } = useModels(filters.brandId !== "all" ? filters.brandId : undefined);
  const { data: vehicles, isLoading } = useVehicles(filters);

  const handleSearch = () => {
    // Filters are already applied via the query
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24 pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4">
              Encontre o Carro Perfeito
            </h1>
            <p className="text-lg text-muted-foreground">
              Mais de 10.000 carros disponíveis para você
            </p>
          </div>

          {/* Search and Filters */}
          <div className="bg-card border rounded-2xl p-6 mb-8 shadow-md">
            <div className="grid lg:grid-cols-6 gap-4">
              <div className="lg:col-span-2">
                <CityAutocomplete
                  value={filters.city}
                  onChange={(city) => setFilters({ ...filters, city })}
                  placeholder="Cidade ou endereço..."
                  className="pl-10 h-12"
                />
              </div>
              <Select
                value={filters.brandId}
                onValueChange={(value) => setFilters({ ...filters, brandId: value, modelId: "all" })}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Marca" />
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
              <Select
                value={filters.modelId}
                onValueChange={(value) => setFilters({ ...filters, modelId: value })}
                disabled={filters.brandId === "all"}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Modelo" />
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
              <Select
                value={filters.vehicleType}
                onValueChange={(value) => setFilters({ ...filters, vehicleType: value })}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="sedan">Sedan</SelectItem>
                  <SelectItem value="suv">SUV</SelectItem>
                  <SelectItem value="hatchback">Hatchback</SelectItem>
                  <SelectItem value="pickup">Pickup</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2 lg:col-span-6">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1 lg:flex-none"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <SlidersHorizontal className="w-5 h-5 mr-2" />
                  Filtros
                </Button>
                <Button
                  size="lg"
                  className="flex-1 bg-gradient-primary hover:opacity-90 transition-smooth"
                >
                  <Search className="w-5 h-5 mr-2" />
                  Buscar
                </Button>
              </div>
            </div>

            {showFilters && (
              <div className="mt-6 pt-6 border-t grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Select
                  value={filters.maxPrice?.toString() || ""}
                  onValueChange={(value) => setFilters({ ...filters, maxPrice: value ? parseFloat(value) : undefined })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Preço Máximo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="100">Até R$ 100/dia</SelectItem>
                    <SelectItem value="150">Até R$ 150/dia</SelectItem>
                    <SelectItem value="200">Até R$ 200/dia</SelectItem>
                    <SelectItem value="300">Até R$ 300/dia</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={filters.transmission}
                  onValueChange={(value) => setFilters({ ...filters, transmission: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Transmissão" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="automatic">Automático</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={filters.fuel}
                  onValueChange={(value) => setFilters({ ...filters, fuel: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Combustível" />
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
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Ano" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2023">2023</SelectItem>
                    <SelectItem value="2022">2022</SelectItem>
                    <SelectItem value="2021">2021 ou anterior</SelectItem>
                  </SelectContent>
                </Select>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevância</SelectItem>
                    <SelectItem value="price-low">Menor Preço</SelectItem>
                    <SelectItem value="price-high">Maior Preço</SelectItem>
                    <SelectItem value="rating">Melhor Avaliado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Results */}
          <div className="mb-4">
            <p className="text-muted-foreground">
              {isLoading ? "Carregando..." : (
                <>Mostrando <span className="font-semibold text-foreground">{vehicles?.length || 0}</span> resultados</>
              )}
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Carregando veículos...</p>
            </div>
          ) : !vehicles || vehicles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhum veículo encontrado com os filtros selecionados.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehicles.map((vehicle) => {
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
                        <Badge className="absolute top-4 right-4 bg-background/90 backdrop-blur capitalize">
                          {vehicle.vehicle_type}
                        </Badge>
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
                              R$ {vehicle.daily_price}
                            </span>
                            <span className="text-muted-foreground text-sm">/dia</span>
                          </div>
                          <Button size="sm" className="bg-gradient-accent">
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
