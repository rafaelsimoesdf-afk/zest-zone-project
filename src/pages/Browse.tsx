import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useVehicles } from "@/hooks/useVehicles";
import { useBrands, useModels } from "@/hooks/useBrands";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { TuroSearchBar } from "@/components/TuroSearchBar";
import { FilterBar } from "@/components/browse/FilterBar";
import { VehicleCard } from "@/components/browse/VehicleCard";

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

  const [previewBrandId, setPreviewBrandId] = useState<string>("all");
  const { data: brands } = useBrands();
  const { data: models } = useModels(previewBrandId !== "all" ? previewBrandId : (filters.brandId !== "all" ? filters.brandId : undefined));
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
            onBrandChange={setPreviewBrandId}
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
                // Build link params with dates
                const carLinkParams = new URLSearchParams();
                if (filters.fromDate) carLinkParams.set("from", filters.fromDate);
                if (filters.untilDate) carLinkParams.set("until", filters.untilDate);
                if (filters.fromTime) carLinkParams.set("fromTime", filters.fromTime);
                if (filters.untilTime) carLinkParams.set("untilTime", filters.untilTime);
                
                return (
                  <VehicleCard 
                    key={vehicle.id} 
                    vehicle={vehicle} 
                    linkParams={carLinkParams.toString()}
                  />
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
