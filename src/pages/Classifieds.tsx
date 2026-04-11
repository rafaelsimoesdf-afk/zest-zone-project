import { useState } from "react";
import { Link } from "react-router-dom";
import { useListings } from "@/hooks/useClassifieds";
import { useAuth } from "@/contexts/AuthContext";
import { ClassifiedCard } from "@/components/classifieds/ClassifiedCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, SlidersHorizontal } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";

const categories = [
  { label: "Veículos", to: "/browse" },
  { label: "Classificados", to: "/classifieds" },
  { label: "Serviços", to: "/services" },
];

const Classifieds = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    vehicleType: "all",
    transmission: "all",
    fuel: "all",
    condition: "all",
    minPrice: undefined as number | undefined,
    maxPrice: undefined as number | undefined,
    city: "",
    minYear: undefined as number | undefined,
    maxYear: undefined as number | undefined,
  });
  const [sortBy, setSortBy] = useState("recent");
  const [searchCity, setSearchCity] = useState("");

  const { data: listings, isLoading } = useListings({
    ...filters,
    city: searchCity || undefined,
  });

  const sortedListings = listings ? [...listings].sort((a, b) => {
    switch (sortBy) {
      case "price-low": return a.sale_price - b.sale_price;
      case "price-high": return b.sale_price - a.sale_price;
      case "year-new": return b.year - a.year;
      case "views": return b.views_count - a.views_count;
      default: return 0;
    }
  }) : [];

  return (
    <div className="flex flex-col">
      {/* Mobile: Pill Search Bar */}
      <div className="md:hidden px-4 py-3">
        <div className="flex items-center gap-3 w-full bg-background border border-border rounded-full px-5 py-3.5 shadow-airbnb">
          <Search className="w-5 h-5 text-foreground" />
          <input
            type="text"
            placeholder="Buscar por cidade ou veículo..."
            value={searchCity}
            onChange={(e) => setSearchCity(e.target.value)}
            className="flex-1 text-sm bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Category Tabs - Airbnb style */}
      <div className="border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-around md:justify-start md:gap-8">
            {categories.map((cat) => (
              <Link
                key={cat.to}
                to={cat.to}
                className={`relative py-3 md:py-4 text-sm font-medium whitespace-nowrap transition-fast ${
                  cat.to === "/classifieds"
                    ? "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1 pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-4xl font-display font-bold text-primary">
                Classificados
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base mt-1">
                Compre e venda veículos na nossa plataforma
              </p>
            </div>
            {user && (
              <Button asChild>
                <Link to="/classifieds/create">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Anúncio
                </Link>
              </Button>
            )}
          </div>

          {/* Desktop Search & Filters Bar */}
          <div className="hidden md:flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cidade..."
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Mais recentes</SelectItem>
                <SelectItem value="price-low">Menor preço</SelectItem>
                <SelectItem value="price-high">Maior preço</SelectItem>
                <SelectItem value="year-new">Ano mais novo</SelectItem>
                <SelectItem value="views">Mais vistos</SelectItem>
              </SelectContent>
            </Select>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <SlidersHorizontal className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filtros</SheetTitle>
                </SheetHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label>Condição</Label>
                    <Select value={filters.condition} onValueChange={(v) => setFilters(p => ({ ...p, condition: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="new">Novo</SelectItem>
                        <SelectItem value="semi-new">Seminovo</SelectItem>
                        <SelectItem value="used">Usado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Tipo</Label>
                    <Select value={filters.vehicleType} onValueChange={(v) => setFilters(p => ({ ...p, vehicleType: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="sedan">Sedan</SelectItem>
                        <SelectItem value="hatchback">Hatch</SelectItem>
                        <SelectItem value="suv">SUV</SelectItem>
                        <SelectItem value="pickup">Picape</SelectItem>
                        <SelectItem value="van">Van</SelectItem>
                        <SelectItem value="coupe">Cupê</SelectItem>
                        <SelectItem value="convertible">Conversível</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Câmbio</Label>
                    <Select value={filters.transmission} onValueChange={(v) => setFilters(p => ({ ...p, transmission: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="automatic">Automático</SelectItem>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="cvt">CVT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Combustível</Label>
                    <Select value={filters.fuel} onValueChange={(v) => setFilters(p => ({ ...p, fuel: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="flex">Flex</SelectItem>
                        <SelectItem value="gasoline">Gasolina</SelectItem>
                        <SelectItem value="ethanol">Etanol</SelectItem>
                        <SelectItem value="diesel">Diesel</SelectItem>
                        <SelectItem value="electric">Elétrico</SelectItem>
                        <SelectItem value="hybrid">Híbrido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Preço mín.</Label>
                      <CurrencyInput value={filters.minPrice || 0} onChange={(v) => setFilters(p => ({ ...p, minPrice: v || undefined }))} />
                    </div>
                    <div>
                      <Label>Preço máx.</Label>
                      <CurrencyInput value={filters.maxPrice || 0} onChange={(v) => setFilters(p => ({ ...p, maxPrice: v || undefined }))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Ano mín.</Label>
                      <Input type="number" placeholder="2010" value={filters.minYear || ""} onChange={(e) => setFilters(p => ({ ...p, minYear: e.target.value ? Number(e.target.value) : undefined }))} />
                    </div>
                    <div>
                      <Label>Ano máx.</Label>
                      <Input type="number" placeholder="2025" value={filters.maxYear || ""} onChange={(e) => setFilters(p => ({ ...p, maxYear: e.target.value ? Number(e.target.value) : undefined }))} />
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" onClick={() => setFilters({ vehicleType: "all", transmission: "all", fuel: "all", condition: "all", minPrice: undefined, maxPrice: undefined, city: "", minYear: undefined, maxYear: undefined })}>
                    Limpar Filtros
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Mobile: Sort & Filter row */}
          <div className="flex md:hidden gap-2 mb-4">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="flex-1 h-9 text-xs">
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Mais recentes</SelectItem>
                <SelectItem value="price-low">Menor preço</SelectItem>
                <SelectItem value="price-high">Maior preço</SelectItem>
                <SelectItem value="year-new">Ano mais novo</SelectItem>
                <SelectItem value="views">Mais vistos</SelectItem>
              </SelectContent>
            </Select>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  <SlidersHorizontal className="w-4 h-4 mr-1" />
                  Filtros
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filtros</SheetTitle>
                </SheetHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label>Condição</Label>
                    <Select value={filters.condition} onValueChange={(v) => setFilters(p => ({ ...p, condition: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="new">Novo</SelectItem>
                        <SelectItem value="semi-new">Seminovo</SelectItem>
                        <SelectItem value="used">Usado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Tipo</Label>
                    <Select value={filters.vehicleType} onValueChange={(v) => setFilters(p => ({ ...p, vehicleType: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="sedan">Sedan</SelectItem>
                        <SelectItem value="hatchback">Hatch</SelectItem>
                        <SelectItem value="suv">SUV</SelectItem>
                        <SelectItem value="pickup">Picape</SelectItem>
                        <SelectItem value="van">Van</SelectItem>
                        <SelectItem value="coupe">Cupê</SelectItem>
                        <SelectItem value="convertible">Conversível</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Câmbio</Label>
                    <Select value={filters.transmission} onValueChange={(v) => setFilters(p => ({ ...p, transmission: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="automatic">Automático</SelectItem>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="cvt">CVT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Combustível</Label>
                    <Select value={filters.fuel} onValueChange={(v) => setFilters(p => ({ ...p, fuel: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="flex">Flex</SelectItem>
                        <SelectItem value="gasoline">Gasolina</SelectItem>
                        <SelectItem value="ethanol">Etanol</SelectItem>
                        <SelectItem value="diesel">Diesel</SelectItem>
                        <SelectItem value="electric">Elétrico</SelectItem>
                        <SelectItem value="hybrid">Híbrido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Preço mín.</Label>
                      <CurrencyInput value={filters.minPrice || 0} onChange={(v) => setFilters(p => ({ ...p, minPrice: v || undefined }))} />
                    </div>
                    <div>
                      <Label>Preço máx.</Label>
                      <CurrencyInput value={filters.maxPrice || 0} onChange={(v) => setFilters(p => ({ ...p, maxPrice: v || undefined }))} />
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" onClick={() => setFilters({ vehicleType: "all", transmission: "all", fuel: "all", condition: "all", minPrice: undefined, maxPrice: undefined, city: "", minYear: undefined, maxYear: undefined })}>
                    Limpar Filtros
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Results count */}
          <div className="mb-4">
            <p className="text-muted-foreground text-sm">
              {isLoading ? "Carregando..." : (
                <>Mostrando <span className="font-semibold text-foreground">{sortedListings.length}</span> anúncios</>
              )}
            </p>
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Carregando anúncios...</p>
            </div>
          ) : sortedListings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhum anúncio encontrado.</p>
              {user && (
                <Button asChild className="mt-4">
                  <Link to="/classifieds/create">
                    <Plus className="w-4 h-4 mr-2" />
                    Seja o primeiro a anunciar!
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {sortedListings.map((listing) => (
                <ClassifiedCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Classifieds;
