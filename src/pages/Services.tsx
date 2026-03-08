import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, MapPin, Wrench, Car, Camera, Navigation, Shield, FileText, Truck, Sparkles, Users, Phone, SlidersHorizontal, X, Star } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useServiceListings, SERVICE_CATEGORIES, getCategoryLabel, ServiceListing } from "@/hooks/useServices";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useServiceListings, SERVICE_CATEGORIES, getCategoryLabel, ServiceListing } from "@/hooks/useServices";
import { useAuth } from "@/contexts/AuthContext";

const categoryIcons: Record<string, any> = {
  motorista_particular: Users,
  polimento: Sparkles,
  lavagem: Car,
  turismo: Navigation,
  mecanico: Wrench,
  guincho: Truck,
  fotografo: Camera,
  seguro: Shield,
  documentacao: FileText,
  transporte: Truck,
  outros: Wrench,
};

const ServiceCard = ({ service }: { service: ServiceListing }) => {
  const Icon = categoryIcons[service.category] || Wrench;
  const providerName = service.profiles
    ? `${service.profiles.first_name} ${service.profiles.last_name}`
    : "Prestador";

  return (
    <Link to={`/services/${service.id}`}>
      <Card className="h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-border overflow-hidden group">
        <div className="relative h-44 sm:h-52 overflow-hidden bg-muted">
          {service.image_url ? (
            <img
              src={service.image_url}
              alt={service.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Icon className="w-14 h-14 text-muted-foreground/20" />
            </div>
          )}
          <Badge variant="secondary" className="absolute top-3 left-3 backdrop-blur-sm bg-background/80 shadow-sm flex items-center gap-1.5 text-xs">
            <Icon className="w-3 h-3" />
            {getCategoryLabel(service.category)}
          </Badge>
          {service.price_range && (
            <div className="absolute bottom-3 right-3 bg-primary text-primary-foreground text-xs sm:text-sm font-bold px-3 py-1 rounded-full shadow-md">
              {service.price_range}
            </div>
          )}
        </div>
        <CardContent className="p-4 sm:p-5 space-y-3">
          <h3 className="font-bold text-foreground text-base sm:text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {service.title}
          </h3>
          {service.description && (
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
              {service.description}
            </p>
          )}
          {service.city && (
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-primary/60" />
              {service.city}{service.state ? `, ${service.state}` : ""}
            </div>
          )}
          <div className="flex items-center gap-2.5 pt-3 border-t border-border">
            <Avatar className="h-8 w-8">
              <AvatarImage src={service.profiles?.profile_image || undefined} />
              <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                {providerName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">{providerName}</p>
              {service.whatsapp_number && service.show_phone && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Phone className="w-3 h-3" /> WhatsApp disponível
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

const FeaturedCard = ({ service }: { service: ServiceListing }) => {
  const Icon = categoryIcons[service.category] || Wrench;
  const providerName = service.profiles
    ? `${service.profiles.first_name} ${service.profiles.last_name}`
    : "Prestador";

  return (
    <Link to={`/services/${service.id}`} className="block min-w-[280px] sm:min-w-[320px] snap-start">
      <Card className="h-full overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-background hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
        <div className="relative h-40 sm:h-48 overflow-hidden bg-muted">
          {service.image_url ? (
            <img
              src={service.image_url}
              alt={service.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
              <Icon className="w-12 h-12 text-primary/30" />
            </div>
          )}
          <div className="absolute top-3 left-3 flex items-center gap-1.5">
            <Badge className="bg-primary text-primary-foreground text-xs shadow-md flex items-center gap-1">
              <Star className="w-3 h-3 fill-current" />
              Destaque
            </Badge>
          </div>
          {service.price_range && (
            <div className="absolute bottom-3 right-3 bg-background/90 backdrop-blur-sm text-foreground text-xs font-bold px-3 py-1 rounded-full shadow-md border border-border">
              {service.price_range}
            </div>
          )}
        </div>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Icon className="w-3 h-3" />
            {getCategoryLabel(service.category)}
          </div>
          <h3 className="font-bold text-foreground text-sm sm:text-base leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {service.title}
          </h3>
          <div className="flex items-center gap-2 pt-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={service.profiles?.profile_image || undefined} />
              <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                {providerName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <p className="text-xs text-muted-foreground truncate">{providerName}</p>
            {service.city && (
              <>
                <span className="text-muted-foreground/40">•</span>
                <span className="text-xs text-muted-foreground truncate flex items-center gap-1">
                  <MapPin className="w-3 h-3 shrink-0" />
                  {service.city}
                </span>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

const Services = () => {
  const { user } = useAuth();
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const { data: services, isLoading } = useServiceListings({
    category: category !== "all" ? category : undefined,
    search: search || undefined,
  });

  const handleSearch = () => {
    setSearch(searchInput);
  };

  // First 4 services as "featured"
  const featuredServices = services?.slice(0, 4) || [];
  const remainingServices = services?.slice(4) || [];
  const activeFilterLabel = category !== "all" ? getCategoryLabel(category) : null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-12">
        {/* Hero */}
        <div className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                Serviços Automotivos
              </h1>
              <p className="text-muted-foreground text-lg mb-8">
                Encontre profissionais qualificados para cuidar do seu veículo
              </p>

              {/* Search bar with filter toggle */}
              <div className="flex gap-2 max-w-xl mx-auto">
                <Input
                  placeholder="Buscar serviços..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="flex-1"
                />
                <Button onClick={handleSearch}>
                  <Search className="w-4 h-4 mr-2" />
                  Buscar
                </Button>
                <Button
                  variant={showFilters ? "default" : "outline"}
                  size="icon"
                  onClick={() => setShowFilters(!showFilters)}
                  className="shrink-0 relative"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  {activeFilterLabel && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full border-2 border-background" />
                  )}
                </Button>
              </div>

              {/* Active filter indicator */}
              {activeFilterLabel && !showFilters && (
                <div className="mt-3 flex justify-center">
                  <Badge
                    variant="secondary"
                    className="cursor-pointer gap-1.5 pr-1.5"
                    onClick={() => { setCategory("all"); }}
                  >
                    {(() => { const Icon = categoryIcons[category] || Wrench; return <Icon className="w-3 h-3" />; })()}
                    {activeFilterLabel}
                    <X className="w-3 h-3 ml-1 hover:text-destructive" />
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Collapsible Filters */}
        {showFilters && (
          <div className="border-b border-border bg-card/50 backdrop-blur-sm animate-in slide-in-from-top-2 duration-200">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">Filtrar por categoria</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)} className="h-7 px-2 text-muted-foreground">
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={category === "all" ? "default" : "outline"}
                  size="sm"
                  className="rounded-full h-8 px-3 text-xs"
                  onClick={() => setCategory("all")}
                >
                  Todos
                </Button>
                {SERVICE_CATEGORIES.map((cat) => {
                  const Icon = categoryIcons[cat.value] || Wrench;
                  return (
                    <Button
                      key={cat.value}
                      variant={category === cat.value ? "default" : "outline"}
                      size="sm"
                      className="rounded-full h-8 px-3 text-xs"
                      onClick={() => setCategory(cat.value)}
                    >
                      <Icon className="w-3 h-3 mr-1" />
                      {cat.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="container mx-auto px-4 mt-8">
          {isLoading ? (
            <div className="space-y-10">
              {/* Featured skeleton */}
              <div>
                <div className="h-6 bg-muted rounded w-48 mb-4" />
                <div className="flex gap-4 overflow-hidden">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="min-w-[280px] sm:min-w-[320px] animate-pulse">
                      <Card className="overflow-hidden">
                        <div className="h-40 sm:h-48 bg-muted" />
                        <CardContent className="p-4 space-y-2">
                          <div className="h-3 bg-muted rounded w-1/3" />
                          <div className="h-4 bg-muted rounded w-3/4" />
                          <div className="h-3 bg-muted rounded w-1/2" />
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
              {/* Grid skeleton */}
              <div>
                <div className="h-6 bg-muted rounded w-40 mb-4" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i} className="animate-pulse overflow-hidden">
                      <div className="h-44 sm:h-52 bg-muted" />
                      <CardContent className="p-4 space-y-3">
                        <div className="h-5 bg-muted rounded w-3/4" />
                        <div className="h-4 bg-muted rounded w-1/2" />
                        <div className="h-4 bg-muted rounded w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          ) : services && services.length > 0 ? (
            <div className="space-y-10">
              {/* Featured / Destaques */}
              {featuredServices.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="w-5 h-5 text-primary fill-primary/20" />
                    <h2 className="text-xl font-bold text-foreground">Anúncios em Destaque</h2>
                  </div>
                  <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
                    {featuredServices.map((service) => (
                      <FeaturedCard key={service.id} service={service} />
                    ))}
                  </div>
                </section>
              )}

              {/* All services grid */}
              {remainingServices.length > 0 && (
                <section>
                  <h2 className="text-xl font-bold text-foreground mb-4">
                    {activeFilterLabel ? `Serviços de ${activeFilterLabel}` : "Todos os Serviços"}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {remainingServices.map((service) => (
                      <ServiceCard key={service.id} service={service} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          ) : (
            <div className="text-center py-20">
              <Wrench className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Nenhum serviço encontrado
              </h3>
              <p className="text-muted-foreground mb-6">
                {search ? "Tente buscar com outros termos" : "Nenhum serviço disponível no momento."}
              </p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Services;
