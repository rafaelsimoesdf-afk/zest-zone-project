import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, MapPin, Plus, Wrench, Car, Camera, Navigation, Shield, FileText, Truck, Sparkles, Users, Phone, ChevronDown } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
          {/* Categories + CTA */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={category === "all" ? "default" : "outline"}
                size="sm"
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
                    onClick={() => setCategory(cat.value)}
                  >
                    <Icon className="w-3.5 h-3.5 mr-1.5" />
                    {cat.label}
                  </Button>
                );
              })}
            </div>
            {user && (
              <Button asChild className="shrink-0">
                <Link to="/my-services">
                  <Plus className="w-4 h-4 mr-2" />
                  Anunciar Serviço
                </Link>
              </Button>
            )}
          </div>

          {/* Results */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-6 bg-muted rounded w-3/4 mb-3" />
                    <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                    <div className="h-4 bg-muted rounded w-full mb-4" />
                    <div className="h-10 bg-muted rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : services && services.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => {
                const Icon = categoryIcons[service.category] || Wrench;
                const providerName = service.profiles
                  ? `${service.profiles.first_name} ${service.profiles.last_name}`
                  : "Prestador";

                return (
                  <Link key={service.id} to={`/services/${service.id}`}>
                    <Card className="h-full hover:shadow-lg transition-all hover:-translate-y-1 border-border">
                      {service.image_url && (
                        <div className="relative h-48 overflow-hidden rounded-t-lg">
                          <img
                            src={service.image_url}
                            alt={service.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <CardContent className={`p-5 ${!service.image_url ? 'pt-6' : ''}`}>
                        <div className="flex items-start justify-between mb-3">
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Icon className="w-3 h-3" />
                            {getCategoryLabel(service.category)}
                          </Badge>
                          {service.price_range && (
                            <span className="text-sm font-semibold text-primary">
                              {service.price_range}
                            </span>
                          )}
                        </div>

                        <h3 className="font-semibold text-foreground text-lg mb-2 line-clamp-2">
                          {service.title}
                        </h3>

                        {service.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                            {service.description}
                          </p>
                        )}

                        {service.city && (
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
                            <MapPin className="w-3.5 h-3.5" />
                            {service.city}{service.state ? `, ${service.state}` : ""}
                          </div>
                        )}

                        <div className="flex items-center gap-2 pt-3 border-t border-border">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={service.profiles?.profile_image || undefined} />
                            <AvatarFallback className="text-xs">
                              {providerName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-muted-foreground">{providerName}</span>
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
