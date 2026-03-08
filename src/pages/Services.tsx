import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, MapPin, Wrench, Car, Camera, Navigation, Shield, FileText, Truck, Sparkles, Users, Phone, SlidersHorizontal, X, Star, ChevronRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useServiceListings, SERVICE_CATEGORIES, getCategoryLabel } from "@/hooks/useServices";
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

const Services = () => {
  const { user } = useAuth();
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const { data: services, isLoading } = useServiceListings({
    category: category !== "all" ? category : undefined,
    search: search || undefined,
  });

  const handleSearch = () => {
    setSearch(searchInput);
  };

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

              {/* Search bar */}
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
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 mt-8">
          {/* Categories: horizontal scroll on mobile, wrap on desktop */}
          <div className="flex flex-col gap-4 mb-8">
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 sm:flex-wrap scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
              <Button
                variant={category === "all" ? "default" : "outline"}
                size="sm"
                className="shrink-0 rounded-full h-9 px-4 text-xs sm:text-sm"
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
                    className="shrink-0 rounded-full h-9 px-4 text-xs sm:text-sm"
                    onClick={() => setCategory(cat.value)}
                  >
                    <Icon className="w-3.5 h-3.5 mr-1.5" />
                    {cat.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Results */}
          {isLoading ? (
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
          ) : services && services.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {services.map((service) => {
                const Icon = categoryIcons[service.category] || Wrench;
                const providerName = service.profiles
                  ? `${service.profiles.first_name} ${service.profiles.last_name}`
                  : "Prestador";

                return (
                  <Link key={service.id} to={`/services/${service.id}`}>
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
              })}
            </div>
          ) : (
            <div className="text-center py-20">
              <Wrench className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Nenhum serviço encontrado
              </h3>
              <p className="text-muted-foreground mb-6">
                {search ? "Tente buscar com outros termos" : "Seja o primeiro a anunciar um serviço!"}
              </p>
              {user && (
                <Button asChild>
                  <Link to="/my-services">
                    <Plus className="w-4 h-4 mr-2" />
                    Anunciar Serviço
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Services;
