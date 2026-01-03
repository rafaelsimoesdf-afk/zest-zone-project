import { useState } from "react";
import { SlidersHorizontal, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PriceFilter } from "./PriceFilter";
import { VehicleTypeFilter } from "./VehicleTypeFilter";
import { YearFilter } from "./YearFilter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  brands?: { id: string; name: string }[];
  models?: { id: string; name: string }[];
  sortBy: string;
  onSortChange: (value: string) => void;
  resultsCount: number;
}

export const FilterBar = ({
  filters,
  onFiltersChange,
  brands,
  models,
  sortBy,
  onSortChange,
  resultsCount,
}: FilterBarProps) => {
  const [openPopover, setOpenPopover] = useState<string | null>(null);

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
    }
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
    `h-10 px-4 rounded-full border-2 gap-1 ${
      isActive
        ? "border-primary bg-primary/10 text-primary"
        : "border-border hover:border-primary/50"
    }`;

  return (
    <div className="flex flex-wrap items-center gap-2 p-4 bg-card border rounded-xl mb-6">
      <div className="flex items-center gap-1 text-muted-foreground mr-2">
        <SlidersHorizontal className="w-4 h-4" />
      </div>

      {/* Price Filter */}
      <Popover
        open={openPopover === "price"}
        onOpenChange={(open) => setOpenPopover(open ? "price" : null)}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={getFilterButtonClass(!!(filters.minPrice || filters.maxPrice))}
          >
            {getPriceLabel()}
            <ChevronDown className="w-4 h-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="start">
          <PriceFilter
            minPrice={filters.minPrice || 10}
            maxPrice={filters.maxPrice || 500}
            onChange={handlePriceChange}
            onReset={() => resetFilter("price")}
            onApply={() => setOpenPopover(null)}
            resultsCount={resultsCount}
          />
        </PopoverContent>
      </Popover>

      {/* Vehicle Type Filter */}
      <Popover
        open={openPopover === "vehicleType"}
        onOpenChange={(open) => setOpenPopover(open ? "vehicleType" : null)}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={getFilterButtonClass(filters.vehicleType !== "all")}
          >
            {getVehicleTypeLabel()}
            <ChevronDown className="w-4 h-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-4" align="start">
          <VehicleTypeFilter
            selectedTypes={filters.vehicleType !== "all" ? [filters.vehicleType] : []}
            onChange={handleVehicleTypeChange}
            onReset={() => resetFilter("vehicleType")}
            onApply={() => setOpenPopover(null)}
            resultsCount={resultsCount}
          />
        </PopoverContent>
      </Popover>

      {/* Brand Filter */}
      <Popover
        open={openPopover === "brand"}
        onOpenChange={(open) => setOpenPopover(open ? "brand" : null)}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={`h-10 px-4 rounded-full border-2 gap-1 ${
              filters.brandId !== "all"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border hover:border-primary/50"
            }`}
          >
            {filters.brandId !== "all"
              ? brands?.find((b) => b.id === filters.brandId)?.name || "Marca"
              : "Marca & Modelo"}
            <ChevronDown className="w-4 h-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-4" align="start">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Marca</label>
              <Select
                value={filters.brandId}
                onValueChange={(value) =>
                  onFiltersChange({ ...filters, brandId: value, modelId: "all" })
                }
              >
                <SelectTrigger>
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
              <label className="text-sm font-medium">Modelo</label>
              <Select
                value={filters.modelId}
                onValueChange={(value) => onFiltersChange({ ...filters, modelId: value })}
                disabled={filters.brandId === "all"}
              >
                <SelectTrigger>
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
            <div className="flex justify-between pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFiltersChange({ ...filters, brandId: "all", modelId: "all" })}
              >
                Limpar
              </Button>
              <Button size="sm" onClick={() => setOpenPopover(null)}>
                Ver {resultsCount}+ resultados
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Year Filter */}
      <Popover
        open={openPopover === "year"}
        onOpenChange={(open) => setOpenPopover(open ? "year" : null)}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={getFilterButtonClass(!!(filters.minYear || filters.maxYear))}
          >
            {getYearLabel()}
            <ChevronDown className="w-4 h-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="start">
          <YearFilter
            minYear={filters.minYear || 2000}
            maxYear={filters.maxYear || new Date().getFullYear()}
            onChange={handleYearChange}
            onReset={() => resetFilter("year")}
            onApply={() => setOpenPopover(null)}
            resultsCount={resultsCount}
          />
        </PopoverContent>
      </Popover>

      {/* Transmission Filter */}
      <Popover
        open={openPopover === "transmission"}
        onOpenChange={(open) => setOpenPopover(open ? "transmission" : null)}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={`h-10 px-4 rounded-full border-2 gap-1 ${
              filters.transmission !== "all"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border hover:border-primary/50"
            }`}
          >
            {filters.transmission === "all"
              ? "Transmissão"
              : filters.transmission === "manual"
              ? "Manual"
              : "Automático"}
            <ChevronDown className="w-4 h-4" />
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
                className="w-full justify-start"
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
          <Button
            variant="outline"
            className={`h-10 px-4 rounded-full border-2 gap-1 ${
              filters.fuel !== "all"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border hover:border-primary/50"
            }`}
          >
            {filters.fuel === "all"
              ? "Combustível"
              : filters.fuel === "flex"
              ? "Flex"
              : filters.fuel === "gasoline"
              ? "Gasolina"
              : filters.fuel === "diesel"
              ? "Diesel"
              : filters.fuel === "electric"
              ? "Elétrico"
              : "Híbrido"}
            <ChevronDown className="w-4 h-4" />
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
                className="w-full justify-start"
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

      {/* Sort */}
      <div className="ml-auto">
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="h-10 w-40 rounded-full border-2">
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
