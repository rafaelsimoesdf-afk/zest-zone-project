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
  ChevronLeft,
  ChevronRight,
  Zap,
  Heart,
  Key,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { TuroSearchBar } from "@/components/TuroSearchBar";
import { useFeaturedVehicles } from "@/hooks/useFeaturedVehicles";
import { Skeleton } from "@/components/ui/skeleton";
import { VehicleCard } from "@/components/browse/VehicleCard";
import { useRef } from "react";

const Index = () => {
  const { data: featuredVehicles, isLoading: isLoadingVehicles } = useFeaturedVehicles(8);
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollCarousel = (direction: "left" | "right") => {
    if (!carouselRef.current) return;
    const scrollAmount = 320;
    carouselRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const categories = [
    { icon: Car, label: "Sedans", type: "sedan" },
    { icon: Zap, label: "SUVs", type: "suv" },
    { icon: Key, label: "Hatches", type: "hatch" },
    { icon: Car, label: "Pickups", type: "pickup" },
    { icon: Star, label: "Esportivos", type: "sports" },
    { icon: Users, label: "Vans", type: "van" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Hero Section - Clean, Airbnb style */}
      <section className="pt-[72px]">
        <div className="bg-muted/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
            <div className="max-w-3xl mx-auto text-center mb-8">
              <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-semibold text-foreground mb-4 leading-tight">
                Encontre o carro perfeito
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
                Alugue carros de pessoas reais. Mais barato, mais prático, mais seguro.
              </p>
            </div>

            {/* Search Bar */}
            <div className="max-w-4xl mx-auto">
              <TuroSearchBar />
            </div>
          </div>
        </div>

        {/* Category Filter - Horizontal icons */}
        <div className="border-b border-border">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-8 py-4 overflow-x-auto scrollbar-hide">
              {categories.map((cat) => (
                <Link
                  key={cat.type}
                  to={`/browse?type=${cat.type}`}
                  className="flex flex-col items-center gap-1.5 min-w-[56px] group"
                >
                  <cat.icon className="w-6 h-6 text-muted-foreground group-hover:text-foreground transition-fast" />
                  <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground whitespace-nowrap transition-fast">
                    {cat.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Cars - Airbnb Grid */}
      <section className="py-8 sm:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
              Carros em destaque
            </h2>
            <Link
              to="/browse"
              className="text-sm font-semibold text-foreground hover:underline flex items-center gap-1"
            >
              Mostrar todos
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Horizontal scrollable on mobile, grid on desktop */}
          <div className="relative">
            {/* Desktop grid */}
            <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-6">
              {isLoadingVehicles ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <div key={index}>
                    <Skeleton className="aspect-[4/3] rounded-xl mb-2.5" />
                    <Skeleton className="h-4 w-3/4 mb-1" />
                    <Skeleton className="h-3.5 w-1/2 mb-1" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                ))
              ) : featuredVehicles && featuredVehicles.length > 0 ? (
                featuredVehicles.slice(0, 8).map((vehicle) => (
                  <VehicleCard key={vehicle.id} vehicle={vehicle} />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <Car className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Nenhum veículo disponível no momento.</p>
                  <Button className="mt-4" asChild>
                    <Link to="/become-owner">Seja o primeiro a anunciar!</Link>
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile carousel */}
            <div className="sm:hidden">
              <div
                ref={carouselRef}
                className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 -mx-4 px-4"
              >
                {isLoadingVehicles ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="min-w-[280px] snap-start">
                      <Skeleton className="aspect-[4/3] rounded-xl mb-2.5" />
                      <Skeleton className="h-4 w-3/4 mb-1" />
                      <Skeleton className="h-3.5 w-1/2" />
                    </div>
                  ))
                ) : featuredVehicles && featuredVehicles.length > 0 ? (
                  featuredVehicles.map((vehicle) => (
                    <div key={vehicle.id} className="min-w-[280px] snap-start">
                      <VehicleCard vehicle={vehicle} />
                    </div>
                  ))
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works - Clean minimal */}
      <section className="py-10 sm:py-16 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-8 sm:mb-10">
            Como funciona
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12">
            {[
              {
                step: "1",
                title: "Busque o carro ideal",
                description: "Encontre por localização, data e tipo de veículo",
              },
              {
                step: "2",
                title: "Reserve com segurança",
                description: "Pagamento protegido e comunicação direta com o proprietário",
              },
              {
                step: "3",
                title: "Retire e dirija",
                description: "Encontre o proprietário, faça a vistoria e pegue as chaves",
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 sm:mt-10">
            <Button variant="outline" className="rounded-lg" asChild>
              <Link to="/how-it-works">
                Saiba mais
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA for Owners - Clean card */}
      <section className="py-10 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-foreground text-background rounded-2xl p-8 sm:p-12 lg:p-16">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold mb-4">
                  Ganhe dinheiro com seu carro
                </h2>
                <p className="text-background/70 text-base sm:text-lg mb-6 leading-relaxed">
                  Transforme seu carro parado em fonte de renda. Milhares de proprietários já estão ganhando dinheiro com o InfiniteDrive.
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    "Cadastro gratuito e rápido",
                    "Você define o preço e disponibilidade",
                    "Seguro completo incluído",
                    "Suporte dedicado 24/7",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm sm:text-base text-background/90">
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button
                  size="lg"
                  className="bg-background text-foreground hover:bg-background/90 rounded-lg font-semibold"
                  asChild
                >
                  <Link to="/become-owner">
                    Começar agora
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
              </div>
              <div className="hidden lg:grid grid-cols-2 gap-4">
                {[
                  { value: "10K+", label: "Carros Cadastrados", icon: Car },
                  { value: "50K+", label: "Usuários Ativos", icon: Users },
                  { value: "R$ 2k", label: "Média Mensal", icon: DollarSign },
                  { value: "4.9", label: "Avaliação", icon: Star },
                ].map((stat) => (
                  <div key={stat.label} className="bg-background/10 rounded-xl p-5 text-center">
                    <stat.icon className="w-6 h-6 mx-auto mb-2 text-primary" />
                    <div className="text-2xl font-bold text-background mb-0.5">{stat.value}</div>
                    <div className="text-xs text-background/60">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits - Simple icons row */}
      <section className="py-10 sm:py-16 border-t border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {[
              { icon: Shield, title: "Seguro incluído", desc: "Todas as reservas são protegidas" },
              { icon: DollarSign, title: "Preços justos", desc: "Até 40% mais barato que locadoras" },
              { icon: Star, title: "Avaliações reais", desc: "Reviews verificados de locatários" },
              { icon: Clock, title: "Reserva rápida", desc: "Alugue em minutos" },
            ].map((b) => (
              <div key={b.title} className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center mx-auto mb-3">
                  <b.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-sm sm:text-base text-foreground mb-1">{b.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
