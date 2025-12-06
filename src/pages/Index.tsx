import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Shield,
  DollarSign,
  Star,
  ArrowRight,
  Car,
  Clock,
  Users,
  CheckCircle2,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CityAutocomplete } from "@/components/CityAutocomplete";
import { useFeaturedVehicles } from "@/hooks/useFeaturedVehicles";
import { Skeleton } from "@/components/ui/skeleton";
import heroImage from "@/assets/hero-car.jpg";

const Index = () => {
  const navigate = useNavigate();
  const [searchCity, setSearchCity] = useState("");
  const { data: featuredVehicles, isLoading: isLoadingVehicles } = useFeaturedVehicles(3);

  const handleSearch = () => {
    if (searchCity) {
      navigate(`/browse?city=${encodeURIComponent(searchCity)}`);
    } else {
      navigate('/browse');
    }
  };

  const getVehicleImage = (vehicle: any) => {
    const primaryImage = vehicle.vehicle_images?.find((img: any) => img.is_primary);
    return primaryImage?.image_url || vehicle.vehicle_images?.[0]?.image_url || "https://images.unsplash.com/photo-1494976388531-d1058494cdd8";
  };

  const getVehicleLocation = (vehicle: any) => {
    if (vehicle.addresses) {
      return `${vehicle.addresses.city}, ${vehicle.addresses.state}`;
    }
    return "Localização não informada";
  };

  const vehicleTypeLabels: Record<string, string> = {
    sedan: "Sedan",
    hatchback: "Hatchback",
    suv: "SUV",
    pickup: "Pickup",
    van: "Van",
    convertible: "Conversível",
    coupe: "Coupé",
    wagon: "Wagon",
  };

  const benefits = [
    {
      icon: Shield,
      title: "Seguro e Protegido",
      description: "Todas as reservas incluem seguro completo e suporte 24h",
    },
    {
      icon: DollarSign,
      title: "Preços Justos",
      description: "Economize até 40% comparado a locadoras tradicionais",
    },
    {
      icon: Star,
      title: "Avaliações Reais",
      description: "Sistema de reviews verificados de locatários anteriores",
    },
    {
      icon: Clock,
      title: "Reserva Instantânea",
      description: "Alugue em minutos com confirmação imediata",
    },
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Busque o Carro Ideal",
      description: "Encontre o veículo perfeito por localização, preço e tipo",
    },
    {
      step: "2",
      title: "Reserve com Segurança",
      description: "Pagamento protegido e comunicação direta com o proprietário",
    },
    {
      step: "3",
      title: "Retire e Dirija",
      description: "Encontre o proprietário, faça a vistoria e pegue as chaves",
    },
    {
      step: "4",
      title: "Devolva e Avalie",
      description: "Retorne o veículo e compartilhe sua experiência",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center pt-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={heroImage}
            alt="CarShare Hero"
            className="w-full h-full object-cover brightness-50"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-transparent" />
        </div>

        <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-2xl">
            <Badge className="mb-6 bg-accent text-accent-foreground">
              🚗 Mais de 10.000 carros disponíveis
            </Badge>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl mb-6 leading-tight">
              Alugue Carros{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Entre Pessoas
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 leading-relaxed">
              A plataforma que conecta proprietários e locatários. Alugue o
              carro ideal ou ganhe dinheiro com seu veículo parado.
            </p>

            {/* Search Bar */}
            <div className="bg-background rounded-2xl p-4 shadow-xl border border-border mb-8">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <CityAutocomplete
                    value={searchCity}
                    onChange={setSearchCity}
                    placeholder="Digite a cidade ou endereço..."
                    className="border-0 bg-muted h-12 pl-10"
                  />
                </div>
                <Button
                  size="lg"
                  onClick={handleSearch}
                  className="bg-primary text-white hover:bg-primary/90"
                >
                  <Search className="w-5 h-5 mr-2" />
                  Buscar Carros
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="bg-primary text-white hover:bg-primary/90" asChild>
                <Link to="/browse">
                  Ver Todos os Carros
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button
                size="lg"
                className="bg-white text-primary font-semibold hover:bg-white/90"
                asChild
              >
                <Link to="/become-owner">Anuncie seu Carro</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4">Por que escolher o CarShare?</Badge>
            <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4">
              Vantagens para Você
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A melhor experiência de aluguel de carros com segurança,
              economia e praticidade
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <Card
                key={index}
                className="border-2 hover:border-primary transition-smooth hover:shadow-lg"
              >
                <CardContent className="pt-6 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <benefit.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-xl mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Cars */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <Badge className="mb-4">Carros em Destaque</Badge>
              <h2 className="font-display text-4xl sm:text-5xl font-bold">
                Explore Nossa Frota
              </h2>
            </div>
            <Button variant="outline" asChild className="hidden sm:flex">
              <Link to="/browse">
                Ver Todos
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {isLoadingVehicles ? (
              // Loading skeletons
              Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} className="overflow-hidden border-2">
                  <Skeleton className="h-64 w-full" />
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-4" />
                    <div className="flex justify-between">
                      <Skeleton className="h-8 w-24" />
                      <Skeleton className="h-9 w-20" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : featuredVehicles && featuredVehicles.length > 0 ? (
              featuredVehicles.map((vehicle) => (
                <Link key={vehicle.id} to={`/cars/${vehicle.id}`}>
                  <Card className="overflow-hidden group hover:shadow-xl transition-smooth border-2 hover:border-primary">
                    <div className="relative h-64 overflow-hidden">
                      <img
                        src={getVehicleImage(vehicle)}
                        alt={`${vehicle.brand} ${vehicle.model}`}
                        className="w-full h-full object-cover group-hover:scale-110 transition-smooth"
                      />
                      <Badge className="absolute top-4 right-4 bg-background/90 backdrop-blur">
                        {vehicleTypeLabels[vehicle.vehicle_type] || vehicle.vehicle_type}
                      </Badge>
                    </div>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-xl">{vehicle.brand} {vehicle.model} {vehicle.year}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        📍 {getVehicleLocation(vehicle)}
                      </p>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-2xl font-bold text-primary">
                            R$ {vehicle.daily_price}
                          </span>
                          <span className="text-muted-foreground">/dia</span>
                        </div>
                        <Button size="sm" className="bg-primary text-white hover:bg-primary/90">
                          Reservar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Car className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum veículo disponível no momento.</p>
                <Button className="mt-4 bg-primary text-white" asChild>
                  <Link to="/become-owner">Seja o primeiro a anunciar!</Link>
                </Button>
              </div>
            )}
          </div>

          <div className="text-center mt-12 sm:hidden">
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link to="/browse">
                Ver Todos os Carros
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4">Processo Simples</Badge>
            <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4">
              Como Funciona
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Alugar um carro nunca foi tão fácil e rápido
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {howItWorks.map((item, index) => (
              <div key={index} className="relative">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mx-auto mb-4 text-2xl font-display font-bold text-white shadow-lg">
                    {item.step}
                  </div>
                  <h3 className="font-bold text-xl mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
                {index < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-primary opacity-30" />
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button size="lg" asChild>
              <Link to="/how-it-works">
                Saiba Mais
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section for Owners */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-10" />
        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto bg-card border-2 border-primary rounded-3xl p-8 sm:p-12 shadow-xl">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <Badge className="mb-4 bg-accent">
                  💰 Ganhe Renda Extra
                </Badge>
                <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
                  Alugue seu Carro e Lucre
                </h2>
                <p className="text-muted-foreground mb-6">
                  Transforme seu carro parado em fonte de renda. Milhares de
                  proprietários já estão ganhando dinheiro com o CarShare.
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-secondary" />
                    <span>Cadastro gratuito e rápido</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-secondary" />
                    <span>Você define o preço e disponibilidade</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-secondary" />
                    <span>Seguro completo incluído</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-secondary" />
                    <span>Suporte dedicado 24/7</span>
                  </li>
                </ul>
                <Button size="lg" className="bg-gradient-accent text-white" asChild>
                  <Link to="/become-owner">
                    Começar Agora
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-6 text-center border-2">
                  <Car className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <div className="text-3xl font-display font-bold mb-1">
                    10K+
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Carros Cadastrados
                  </div>
                </Card>
                <Card className="p-6 text-center border-2">
                  <Users className="w-8 h-8 mx-auto mb-2 text-secondary" />
                  <div className="text-3xl font-display font-bold mb-1">
                    50K+
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Usuários Ativos
                  </div>
                </Card>
                <Card className="p-6 text-center border-2">
                  <DollarSign className="w-8 h-8 mx-auto mb-2 text-accent" />
                  <div className="text-3xl font-display font-bold mb-1">
                    R$ 2k
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Média Mensal
                  </div>
                </Card>
                <Card className="p-6 text-center border-2">
                  <Star className="w-8 h-8 mx-auto mb-2 text-accent" />
                  <div className="text-3xl font-display font-bold mb-1">
                    4.9
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Avaliação
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
