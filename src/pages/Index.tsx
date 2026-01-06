import { Link } from "react-router-dom";
import {
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
import { TuroSearchBar } from "@/components/TuroSearchBar";
import { useFeaturedVehicles } from "@/hooks/useFeaturedVehicles";
import { Skeleton } from "@/components/ui/skeleton";
import heroImage from "@/assets/hero-car.jpg";
import { VehicleCard } from "@/components/browse/VehicleCard";

const Index = () => {
  const { data: featuredVehicles, isLoading: isLoadingVehicles } = useFeaturedVehicles(3);

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
      <section className="relative min-h-[85vh] sm:min-h-[90vh] flex items-center pt-20 sm:pt-24 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={heroImage}
            alt="InfiniteDrive Hero"
            className="w-full h-full object-cover brightness-50"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-transparent" />
        </div>

        <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-20">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="font-display text-3xl sm:text-5xl lg:text-7xl mb-4 sm:mb-6 leading-tight">
              Alugue Carros <span className="text-primary">Entre Pessoas</span>
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-6 sm:mb-8 leading-relaxed max-w-2xl mx-auto px-2">
              A plataforma que conecta proprietários e locatários. Alugue o
              carro ideal ou ganhe dinheiro com seu veículo parado.
            </p>

            {/* Search Bar */}
            <div className="mb-6 sm:mb-8 px-2 sm:px-0">
              <TuroSearchBar />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
              <Button size="lg" className="bg-primary text-white hover:bg-primary/90 w-full sm:w-auto" asChild>
                <Link to="/browse">
                  Ver Todos os Carros
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button
                size="lg"
                className="bg-white text-primary font-semibold hover:bg-white/90 w-full sm:w-auto"
                asChild
              >
                <Link to="/become-owner">Anuncie seu Carro</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12 sm:py-20 bg-muted/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16">
            <Badge className="mb-4">Por que escolher o InfiniteDrive?</Badge>
            <h2 className="font-display text-2xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Vantagens para Você
            </h2>
            <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
              A melhor experiência de aluguel de carros com segurança,
              economia e praticidade
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
            {benefits.map((benefit, index) => (
              <Card
                key={index}
                className="border-2 hover:border-primary transition-smooth hover:shadow-lg"
              >
                <CardContent className="pt-4 sm:pt-6 text-center p-3 sm:p-6">
                  <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-primary flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
                    <benefit.icon className="w-5 h-5 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-sm sm:text-xl mb-1 sm:mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground text-xs sm:text-base hidden sm:block">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Cars */}
      <section className="py-12 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 sm:mb-12 gap-4">
            <div>
              <Badge className="mb-3 sm:mb-4">Carros em Destaque</Badge>
              <h2 className="font-display text-2xl sm:text-4xl lg:text-5xl font-bold">
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
            {isLoadingVehicles ? (
              // Loading skeletons
              Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} className="overflow-hidden border-2">
                  <Skeleton className="h-48 sm:h-64 w-full" />
                  <CardContent className="p-4 sm:p-6">
                    <Skeleton className="h-5 sm:h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-4" />
                    <div className="flex justify-between">
                      <Skeleton className="h-7 sm:h-8 w-20 sm:w-24" />
                      <Skeleton className="h-8 sm:h-9 w-16 sm:w-20" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : featuredVehicles && featuredVehicles.length > 0 ? (
              featuredVehicles.map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} />
              ))
            ) : (
              <div className="col-span-full text-center py-8 sm:py-12">
                <Car className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-sm sm:text-base">Nenhum veículo disponível no momento.</p>
                <Button className="mt-4 bg-primary text-white" asChild>
                  <Link to="/become-owner">Seja o primeiro a anunciar!</Link>
                </Button>
              </div>
            )}
          </div>

          <div className="text-center mt-8 sm:mt-12 sm:hidden">
            <Button variant="outline" asChild className="w-full">
              <Link to="/browse">
                Ver Todos os Carros
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 sm:py-20 bg-muted/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16">
            <Badge className="mb-4">Processo Simples</Badge>
            <h2 className="font-display text-2xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              Como Funciona
            </h2>
            <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
              Alugar um carro nunca foi tão fácil e rápido
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 relative">
            {howItWorks.map((item, index) => (
              <div key={index} className="relative">
                <div className="text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary flex items-center justify-center mx-auto mb-3 sm:mb-4 text-lg sm:text-2xl font-display font-bold text-white shadow-lg">
                    {item.step}
                  </div>
                  <h3 className="font-bold text-sm sm:text-xl mb-1 sm:mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-xs sm:text-base hidden sm:block">{item.description}</p>
                </div>
                {index < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-primary opacity-30" />
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-8 sm:mt-12">
            <Button size="lg" asChild className="w-full sm:w-auto">
              <Link to="/how-it-works">
                Saiba Mais
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section for Owners */}
      <section className="py-12 sm:py-20 relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-10" />
        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto bg-card border-2 border-primary rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-12 shadow-xl">
            <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 items-center">
              <div>
                <Badge className="mb-3 sm:mb-4 bg-accent">
                  💰 Ganhe Renda Extra
                </Badge>
                <h2 className="font-display text-xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
                  Alugue seu Carro e Lucre
                </h2>
                <p className="text-muted-foreground text-sm sm:text-base mb-4 sm:mb-6">
                  Transforme seu carro parado em fonte de renda. Milhares de
                  proprietários já estão ganhando dinheiro com o InfiniteDrive.
                </p>
                <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                  <li className="flex items-center gap-2 text-sm sm:text-base">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-secondary shrink-0" />
                    <span>Cadastro gratuito e rápido</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm sm:text-base">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-secondary shrink-0" />
                    <span>Você define o preço e disponibilidade</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm sm:text-base">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-secondary shrink-0" />
                    <span>Seguro completo incluído</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm sm:text-base">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-secondary shrink-0" />
                    <span>Suporte dedicado 24/7</span>
                  </li>
                </ul>
                <Button size="lg" className="bg-primary text-white hover:bg-primary/90 w-full sm:w-auto" asChild>
                  <Link to="/become-owner">
                    Começar Agora
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <Card className="p-3 sm:p-6 text-center border-2">
                  <Car className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 text-primary" />
                  <div className="text-xl sm:text-3xl font-display font-bold mb-0.5 sm:mb-1">
                    10K+
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    Carros Cadastrados
                  </div>
                </Card>
                <Card className="p-3 sm:p-6 text-center border-2">
                  <Users className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 text-secondary" />
                  <div className="text-xl sm:text-3xl font-display font-bold mb-0.5 sm:mb-1">
                    50K+
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    Usuários Ativos
                  </div>
                </Card>
                <Card className="p-3 sm:p-6 text-center border-2">
                  <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 text-accent" />
                  <div className="text-xl sm:text-3xl font-display font-bold mb-0.5 sm:mb-1">
                    R$ 2k
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    Média Mensal
                  </div>
                </Card>
                <Card className="p-3 sm:p-6 text-center border-2">
                  <Star className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 text-accent" />
                  <div className="text-xl sm:text-3xl font-display font-bold mb-0.5 sm:mb-1">
                    4.9
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">
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
