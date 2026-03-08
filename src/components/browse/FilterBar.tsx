import { useState, useCallback } from "react";
import { SlidersHorizontal, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { PriceFilter } from "./PriceFilter";
import { VehicleTypeFilter } from "./VehicleTypeFilter";
import { YearFilter } from "./YearFilter";
import { BrandModelFilter } from "./BrandModelFilter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Vehicle } from "@/hooks/useVehicles";
import { useIsMobile } from "@/hooks/use-mobile";

interface FilterBarProps {
  filters: {
    vehicleType: string;
    transmission: string;
    fuel: string;
    maxPrice?: number;
    minPrice?: number;
    brandId: string;
    modelId: string;
    minYear?: number;
    maxYear?: number;
  };
  onFiltersChange: (filters: any) => void;
  onBrandChange: (brandId: string) => void;
  brands?: { id: string; name: string }[];
  models?: { id: string; name: string }[];
  sortBy: string;
  onSortChange: (value: string) => void;
  resultsCount: number;
  vehicles: Vehicle[];
}

export const FilterBar = ({
  filters,
  onFiltersChange,
  onBrandChange,
  brands,
  models,
  sortBy,
  onSortChange,
  resultsCount,
  vehicles,
}: FilterBarProps) => {
  const isMobile = useIsMobile();
  const [openPopover, setOpenPopover] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Calculate preview count for price filter
  const getPreviewCountForPrice = useCallback((minPrice: number, maxPrice: number) => {
    return vehicles.filter((v) => {
      const priceMatch = v.daily_price >= minPrice && v.daily_price <= maxPrice;
      const typeMatch = filters.vehicleType === "all" || v.vehicle_type === filters.vehicleType;
      const yearMatch = (!filters.minYear || v.year >= filters.minYear) && (!filters.maxYear || v.year <= filters.maxYear);
      return priceMatch && typeMatch && yearMatch;
    }).length;
  }, [vehicles, filters.vehicleType, filters.minYear, filters.maxYear]);

  const getPreviewCountForType = useCallback((types: string[]) => {
    return vehicles.filter((v) => {
      const typeMatch = types.length === 0 || types.includes(v.vehicle_type);
      const priceMatch = (!filters.minPrice || v.daily_price >= filters.minPrice) && (!filters.maxPrice || v.daily_price <= filters.maxPrice);
      const yearMatch = (!filters.minYear || v.year >= filters.minYear) && (!filters.maxYear || v.year <= filters.maxYear);
      return typeMatch && priceMatch && yearMatch;
    }).length;
  }, [vehicles, filters.minPrice, filters.maxPrice, filters.minYear, filters.maxYear]);

  const getPreviewCountForYear = useCallback((minYear: number, maxYear: number) => {
    return vehicles.filter((v) => {
      const yearMatch = v.year >= minYear && v.year <= maxYear;
      const typeMatch = filters.vehicleType === "all" || v.vehicle_type === filters.vehicleType;
      const priceMatch = (!filters.minPrice || v.daily_price >= filters.minPrice) && (!filters.maxPrice || v.daily_price <= filters.maxPrice);
      return yearMatch && typeMatch && priceMatch;
    }).length;
  }, [vehicles, filters.vehicleType, filters.minPrice, filters.maxPrice]);

  const getPreviewCountForBrandModel = useCallback((brandId: string, modelId: string) => {
    return vehicles.filter((v) => {
      const brandMatch = brandId === "all" || (v as any).brand_id === brandId;
      const modelMatch = modelId === "all" || (v as any).model_id === modelId;
      const typeMatch = filters.vehicleType === "all" || v.vehicle_type === filters.vehicleType;
      const priceMatch = (!filters.minPrice || v.daily_price >= filters.minPrice) && (!filters.maxPrice || v.daily_price <= filters.maxPrice);
      const yearMatch = (!filters.minYear || v.year >= filters.minYear) && (!filters.maxYear || v.year <= filters.maxYear);
      return brandMatch && modelMatch && typeMatch && priceMatch && yearMatch;
    }).length;
  }, [vehicles, filters.vehicleType, filters.minPrice, filters.maxPrice, filters.minYear, filters.maxYear]);

  const handlePriceChange = (minPrice: number, maxPrice: number) => {
    onFiltersChange({
      ...filters,
      minPrice: minPrice > 10 ? minPrice : undefined,
      maxPrice: maxPrice < 500 ? maxPrice : undefined,
    });
  };

  const handleVehicleTypeChange = (types: string[]) => {
    onFiltersChange({
      ...filters,
      vehicleType: types.length > 0 ? types[0] : "all",
    });
  };

  const handleYearChange = (minYear: number, maxYear: number) => {
    const currentYear = new Date().getFullYear();
    onFiltersChange({
      ...filters,
      minYear: minYear > 2000 ? minYear : undefined,
      maxYear: maxYear < currentYear ? maxYear : undefined,
    });
  };

  const handleBrandModelChange = (brandId: string, modelId: string) => {
    onFiltersChange({
      ...filters,
      brandId,
      modelId,
    });
  };

  const resetFilter = (filterName: string) => {
    switch (filterName) {
      case "price":
        onFiltersChange({ ...filters, minPrice: undefined, maxPrice: undefined });
        break;
      case "vehicleType":
        onFiltersChange({ ...filters, vehicleType: "all" });
        break;
      case "year":
        onFiltersChange({ ...filters, minYear: undefined, maxYear: undefined });
        break;
      case "brandModel":
        onFiltersChange({ ...filters, brandId: "all", modelId: "all" });
        break;
    }
  };

  const resetAllFilters = () => {
    onFiltersChange({
      ...filters,
      minPrice: undefined,
      maxPrice: undefined,
      vehicleType: "all",
      transmission: "all",
      fuel: "all",
      brandId: "all",
      modelId: "all",
      minYear: undefined,
      maxYear: undefined,
    });
  };

  const getPriceLabel = () => {
    if (filters.minPrice || filters.maxPrice) {
      const min = filters.minPrice || 10;
      const max = filters.maxPrice || 500;
      return `R$${min} - R$${max}+/dia`;
    }
    return "Preço";
  };

  const getYearLabel = () => {
    if (filters.minYear || filters.maxYear) {
      const min = filters.minYear || 2000;
      const max = filters.maxYear || new Date().getFullYear();
      return `${min} - ${max}`;
    }
    return "Ano";
  };

  const getVehicleTypeLabel = () => {
    if (filters.vehicleType !== "all") {
      const types: Record<string, string> = {
        sedan: "Sedan",
        suv: "SUV",
        hatchback: "Hatchback",
        pickup: "Pickup",
        van: "Van",
        convertible: "Conversível",
        coupe: "Cupê",
        wagon: "Wagon",
      };
      return types[filters.vehicleType] || filters.vehicleType;
    }
    return "Tipo de Veículo";
  };

  const getFilterButtonClass = (isActive: boolean) =>
    `h-8 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm rounded-full border-2 gap-1 ${
      isActive
        ? "border-primary bg-primary/10 text-primary"
        : "border-border hover:border-primary/50"
    }`;

  const hasActiveFilters = !!(filters.minPrice || filters.maxPrice || filters.vehicleType !== "all" || filters.transmission !== "all" || filters.fuel !== "all" || filters.brandId !== "all" || filters.minYear || filters.maxYear);

  // Mobile: Sheet with all filters inside
  if (isMobile) {
    return (
      <div className="flex items-center gap-2 mb-4">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="relative rounded-full gap-2">
              <SlidersHorizontal className="w-4 h-4" />
              Filtros
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full border-2 border-background" />
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filtros</SheetTitle>
            </SheetHeader>
            <div className="space-y-6 mt-4">
              {/* Price */}
              <div>
                <h4 className="text-sm font-semibold mb-3">Preço</h4>
                <PriceFilter
                  minPrice={filters.minPrice || 10}
                  maxPrice={filters.maxPrice || 500}
                  onChange={handlePriceChange}
                  onReset={() => resetFilter("price")}
                  onApply={() => {}}
                  getPreviewCount={getPreviewCountForPrice}
                />
              </div>

              {/* Vehicle Type */}
              <div>
                <h4 className="text-sm font-semibold mb-3">Tipo de Veículo</h4>
                <VehicleTypeFilter
                  selectedTypes={filters.vehicleType !== "all" ? [filters.vehicleType] : []}
                  onChange={handleVehicleTypeChange}
                  onReset={() => resetFilter("vehicleType")}
                  onApply={() => {}}
                  getPreviewCount={getPreviewCountForType}
                />
              </div>

              {/* Brand & Model */}
              <div>
                <h4 className="text-sm font-semibold mb-3">Marca & Modelo</h4>
                <BrandModelFilter
                  brandId={filters.brandId}
                  modelId={filters.modelId}
                  brands={brands}
                  models={models}
                  onBrandChange={onBrandChange}
                  onChange={handleBrandModelChange}
                  onReset={() => resetFilter("brandModel")}
                  onApply={() => {}}
                  getPreviewCount={getPreviewCountForBrandModel}
                />
              </div>

              {/* Year */}
              <div>
                <h4 className="text-sm font-semibold mb-3">Ano</h4>
                <YearFilter
                  minYear={filters.minYear || 2000}
                  maxYear={filters.maxYear || new Date().getFullYear()}
                  onChange={handleYearChange}
                  onReset={() => resetFilter("year")}
                  onApply={() => {}}
                  getPreviewCount={getPreviewCountForYear}
                />
              </div>

              {/* Transmission */}
              <div>
                <h4 className="text-sm font-semibold mb-3">Transmissão</h4>
                <div className="space-y-1">
                  {[
                    { value: "all", label: "Todas" },
                    { value: "manual", label: "Manual" },
                    { value: "automatic", label: "Automático" },
                  ].map((option) => (
                    <Button
                      key={option.value}
                      variant={filters.transmission === option.value ? "secondary" : "ghost"}
                      className="w-full justify-start text-sm"
                      onClick={() => onFiltersChange({ ...filters, transmission: option.value })}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Fuel */}
              <div>
                <h4 className="text-sm font-semibold mb-3">Combustível</h4>
                <div className="space-y-1">
                  {[
                    { value: "all", label: "Todos" },
                    { value: "flex", label: "Flex" },
                    { value: "gasoline", label: "Gasolina" },
                    { value: "diesel", label: "Diesel" },
                    { value: "electric", label: "Elétrico" },
                    { value: "hybrid", label: "Híbrido" },
                  ].map((option) => (
                    <Button
                      key={option.value}
                      variant={filters.fuel === option.value ? "secondary" : "ghost"}
                      className="w-full justify-start text-sm"
                      onClick={() => onFiltersChange({ ...filters, fuel: option.value })}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Reset & Apply */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={resetAllFilters}>
                  Limpar Filtros
                </Button>
                <Button className="flex-1" onClick={() => setSheetOpen(false)}>
                  Ver {resultsCount} resultados
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Sort */}
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="h-8 w-40 rounded-full border-2 text-xs">
            <SelectValue placeholder="Ordenar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relevance">Relevância</SelectItem>
            <SelectItem value="price-low">Menor Preço</SelectItem>
            <SelectItem value="price-high">Maior Preço</SelectItem>
            <SelectItem value="year-new">Mais Novo</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }

  // Desktop: inline popovers
  return (
    <div className="flex flex-wrap items-center gap-2 p-4 bg-card border rounded-xl mb-6">
      <div className="flex items-center gap-1 text-muted-foreground mr-2">
        <SlidersHorizontal className="w-4 h-4" />
      </div>

      <div className="flex flex-wrap gap-2 flex-1">
        {/* Price Filter */}
        <Popover
          open={openPopover === "price"}
          onOpenChange={(open) => setOpenPopover(open ? "price" : null)}
        >
          <PopoverTrigger asChild>
            <Button variant="outline" className={getFilterButtonClass(!!(filters.minPrice || filters.maxPrice))}>
              <span className="truncate">{getPriceLabel()}</span>
              <ChevronDown className="w-4 h-4 shrink-0" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="start">
            <PriceFilter
              minPrice={filters.minPrice || 10}
              maxPrice={filters.maxPrice || 500}
              onChange={handlePriceChange}
              onReset={() => resetFilter("price")}
              onApply={() => setOpenPopover(null)}
              getPreviewCount={getPreviewCountForPrice}
            />
          </PopoverContent>
        </Popover>

        {/* Vehicle Type Filter */}
        <Popover
          open={openPopover === "vehicleType"}
          onOpenChange={(open) => setOpenPopover(open ? "vehicleType" : null)}
        >
          <PopoverTrigger asChild>
            <Button variant="outline" className={getFilterButtonClass(filters.vehicleType !== "all")}>
              <span className="truncate">{getVehicleTypeLabel()}</span>
              <ChevronDown className="w-4 h-4 shrink-0" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-4" align="start">
            <VehicleTypeFilter
              selectedTypes={filters.vehicleType !== "all" ? [filters.vehicleType] : []}
              onChange={handleVehicleTypeChange}
              onReset={() => resetFilter("vehicleType")}
              onApply={() => setOpenPopover(null)}
              getPreviewCount={getPreviewCountForType}
            />
          </PopoverContent>
        </Popover>

        {/* Brand & Model Filter */}
        <Popover
          open={openPopover === "brand"}
          onOpenChange={(open) => setOpenPopover(open ? "brand" : null)}
        >
          <PopoverTrigger asChild>
            <Button variant="outline" className={getFilterButtonClass(filters.brandId !== "all")}>
              <span className="truncate">
                {filters.brandId !== "all"
                  ? brands?.find((b) => b.id === filters.brandId)?.name || "Marca"
                  : "Marca & Modelo"}
              </span>
              <ChevronDown className="w-4 h-4 shrink-0" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-4" align="start">
            <BrandModelFilter
              brandId={filters.brandId}
              modelId={filters.modelId}
              brands={brands}
              models={models}
              onBrandChange={onBrandChange}
              onChange={handleBrandModelChange}
              onReset={() => resetFilter("brandModel")}
              onApply={() => setOpenPopover(null)}
              getPreviewCount={getPreviewCountForBrandModel}
            />
          </PopoverContent>
        </Popover>

        {/* Year Filter */}
        <Popover
          open={openPopover === "year"}
          onOpenChange={(open) => setOpenPopover(open ? "year" : null)}
        >
          <PopoverTrigger asChild>
            <Button variant="outline" className={getFilterButtonClass(!!(filters.minYear || filters.maxYear))}>
              <span className="truncate">{getYearLabel()}</span>
              <ChevronDown className="w-4 h-4 shrink-0" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="start">
            <YearFilter
              minYear={filters.minYear || 2000}
              maxYear={filters.maxYear || new Date().getFullYear()}
              onChange={handleYearChange}
              onReset={() => resetFilter("year")}
              onApply={() => setOpenPopover(null)}
              getPreviewCount={getPreviewCountForYear}
            />
          </PopoverContent>
        </Popover>

        {/* Transmission Filter */}
        <Popover
          open={openPopover === "transmission"}
          onOpenChange={(open) => setOpenPopover(open ? "transmission" : null)}
        >
          <PopoverTrigger asChild>
            <Button variant="outline" className={getFilterButtonClass(filters.transmission !== "all")}>
              <span className="truncate">
                {filters.transmission === "all" ? "Transmissão" : filters.transmission === "manual" ? "Manual" : "Automático"}
              </span>
              <ChevronDown className="w-4 h-4 shrink-0" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2" align="start">
            <div className="space-y-1">
              {[
                { value: "all", label: "Todas" },
                { value: "manual", label: "Manual" },
                { value: "automatic", label: "Automático" },
              ].map((option) => (
                <Button
                  key={option.value}
                  variant={filters.transmission === option.value ? "secondary" : "ghost"}
                  className="w-full justify-start text-sm"
                  onClick={() => {
                    onFiltersChange({ ...filters, transmission: option.value });
                    setOpenPopover(null);
                  }}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Fuel Filter */}
        <Popover
          open={openPopover === "fuel"}
          onOpenChange={(open) => setOpenPopover(open ? "fuel" : null)}
        >
          <PopoverTrigger asChild>
            <Button variant="outline" className={getFilterButtonClass(filters.fuel !== "all")}>
              <span className="truncate">
                {filters.fuel === "all" ? "Combustível" : filters.fuel === "flex" ? "Flex" : filters.fuel === "gasoline" ? "Gasolina" : filters.fuel === "diesel" ? "Diesel" : filters.fuel === "electric" ? "Elétrico" : "Híbrido"}
              </span>
              <ChevronDown className="w-4 h-4 shrink-0" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2" align="start">
            <div className="space-y-1">
              {[
                { value: "all", label: "Todos" },
                { value: "flex", label: "Flex" },
                { value: "gasoline", label: "Gasolina" },
                { value: "diesel", label: "Diesel" },
                { value: "electric", label: "Elétrico" },
                { value: "hybrid", label: "Híbrido" },
              ].map((option) => (
                <Button
                  key={option.value}
                  variant={filters.fuel === option.value ? "secondary" : "ghost"}
                  className="w-full justify-start text-sm"
                  onClick={() => {
                    onFiltersChange({ ...filters, fuel: option.value });
                    setOpenPopover(null);
                  }}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Sort */}
      <div className="ml-auto">
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="h-10 w-40 rounded-full border-2 text-sm">
            <SelectValue placeholder="Ordenar" />
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
  );
};
