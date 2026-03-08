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
          <div className="flex flex-col gap-4 mb-8">
            {/* Mobile: horizontal scroll | Desktop: wrap */}
            <div className="relative">
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
            {user && (
              <div className="flex justify-end">
                <Button asChild className="shrink-0 rounded-full">
                  <Link to="/my-services">
                    <Plus className="w-4 h-4 mr-2" />
                    Anunciar Serviço
                  </Link>
                </Button>
              </div>
            )}
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
