import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useVehicles } from "@/hooks/useVehicles";
import { useBrands, useModels } from "@/hooks/useBrands";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { TuroSearchBar } from "@/components/TuroSearchBar";
import { FilterBar } from "@/components/browse/FilterBar";
import { VehicleCard } from "@/components/browse/VehicleCard";
import { Badge } from "@/components/ui/badge";
import { Car, Users } from "lucide-react";

const AppDriverRentals = () => {
  const [searchParams] = useSearchParams();
  const [periodFilter, setPeriodFilter] = useState<"all" | "weekly" | "monthly">("all");
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
    appDriverRental: true,
  });
  const [sortBy, setSortBy] = useState("relevance");

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

  const sortedVehicles = vehicles ? [...vehicles].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return (a.app_driver_weekly_price || a.daily_price) - (b.app_driver_weekly_price || b.daily_price);
      case "price-high":
        return (b.app_driver_weekly_price || b.daily_price) - (a.app_driver_weekly_price || a.daily_price);
      case "year-new":
        return b.year - a.year;
      default:
        return 0;
    }
  }) : [];

  // Filter by period availability
  const filteredVehicles = sortedVehicles.filter(v => {
    if (periodFilter === "weekly") return (v.app_driver_weekly_price ?? 0) > 0;
    if (periodFilter === "monthly") return (v.app_driver_monthly_price ?? 0) > 0;
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24 pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Car className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                  Aluguel para Motoristas de Aplicativo
                </h1>
                <p className="text-sm text-muted-foreground">
                  Veículos disponíveis para Uber, 99, InDrive e empresas
                </p>
              </div>
            </div>

            {/* Period Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-muted-foreground mr-1">Período:</span>
              {[
                { value: "all" as const, label: "Todos" },
                { value: "weekly" as const, label: "Semanal" },
                { value: "monthly" as const, label: "Mensal" },
              ].map((period) => (
                <button
                  key={period.value}
                  onClick={() => setPeriodFilter(period.value)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    periodFilter === period.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>

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

          {/* Filter Bar */}
          <FilterBar
            filters={filters}
            onFiltersChange={(newFilters) => setFilters({ ...newFilters, appDriverRental: true })}
            onBrandChange={setPreviewBrandId}
            brands={brands}
            models={models}
            sortBy={sortBy}
            onSortChange={setSortBy}
            resultsCount={filteredVehicles.length}
            vehicles={vehicles || []}
          />

          {/* Results */}
          <div className="mb-4">
            <p className="text-muted-foreground">
              {isLoading ? "Carregando..." : (
                <>Mostrando <span className="font-semibold text-foreground">{filteredVehicles.length}</span> veículos para motoristas de app</>
              )}
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Carregando veículos...</p>
            </div>
          ) : filteredVehicles.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Users className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">Nenhum veículo disponível para motoristas de aplicativo com os filtros selecionados.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredVehicles.map((vehicle) => {
                const carLinkParams = new URLSearchParams();
                if (filters.fromDate) carLinkParams.set("from", filters.fromDate);
                if (filters.untilDate) carLinkParams.set("until", filters.untilDate);
                if (filters.fromTime) carLinkParams.set("fromTime", filters.fromTime);
                if (filters.untilTime) carLinkParams.set("untilTime", filters.untilTime);
                carLinkParams.set("appDriver", "true");

                return (
                  <div key={vehicle.id} className="relative">
                    <VehicleCard
                      vehicle={vehicle}
                      linkParams={carLinkParams.toString()}
                    />
                    {/* Price badges for weekly/monthly */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
                      <Badge className="bg-primary text-primary-foreground text-xs shadow-md">
                        <Car className="h-3 w-3 mr-1" /> App Driver
                      </Badge>
                      {(vehicle.app_driver_weekly_price ?? 0) > 0 && (
                        <Badge variant="secondary" className="text-xs shadow-md">
                          R$ {vehicle.app_driver_weekly_price?.toFixed(0)}/semana
                        </Badge>
                      )}
                      {(vehicle.app_driver_monthly_price ?? 0) > 0 && (
                        <Badge variant="secondary" className="text-xs shadow-md">
                          R$ {vehicle.app_driver_monthly_price?.toFixed(0)}/mês
                        </Badge>
                      )}
                    </div>
                  </div>
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

export default AppDriverRentals;
