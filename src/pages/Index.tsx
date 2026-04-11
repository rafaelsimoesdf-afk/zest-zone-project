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
  Zap,
  Key,
  Search,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BottomTabBar from "@/components/BottomTabBar";
import { Button } from "@/components/ui/button";
import { TuroSearchBar } from "@/components/TuroSearchBar";
import { useFeaturedVehicles } from "@/hooks/useFeaturedVehicles";
import { Skeleton } from "@/components/ui/skeleton";
import { VehicleCard } from "@/components/browse/VehicleCard";
import { useRef } from "react";

const Index = () => {
  const { data: featuredVehicles, isLoading: isLoadingVehicles } = useFeaturedVehicles(8);
  const carouselRef = useRef<HTMLDivElement>(null);

  const categories = [
    { label: "Veículos", to: "/browse" },
    { label: "Motoristas de App", to: "/app-driver-rentals" },
    { label: "Classificados", to: "/classifieds" },
    { label: "Serviços", to: "/services" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Mobile: Pill Search Bar (Airbnb style) */}
      <div className="md:hidden pt-[72px] px-4 py-3">
        <Link
          to="/browse"
          className="flex items-center gap-3 w-full bg-background border border-border rounded-full px-5 py-3.5 shadow-airbnb"
        >
          <Search className="w-5 h-5 text-foreground" />
          <span className="text-sm text-muted-foreground">Inicie sua busca</span>
        </Link>
      </div>

      {/* Mobile: Category Tabs with icons */}
      <div className="md:hidden border-b border-border">
        <div className="grid grid-cols-4 gap-1.5 px-3 py-3">
          {categories.map((cat) => (
            <Link
              key={cat.to}
              to={cat.to}
              className="flex items-center justify-center px-1 py-2 rounded-full border border-border text-[11px] font-medium text-muted-foreground hover:text-foreground hover:border-foreground text-center transition-fast"
            >
              {cat.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Desktop Hero */}
      <section className="hidden md:block pt-[72px]">
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
            <div className="max-w-4xl mx-auto">
              <TuroSearchBar />
            </div>
          </div>
        </div>

        <div className="border-b border-border">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 py-4 overflow-x-auto scrollbar-hide">
              {categories.map((cat) => (
                <Link
                  key={cat.to}
                  to={cat.to}
                  className="px-5 py-2 rounded-full border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground whitespace-nowrap transition-fast"
                >
                  {cat.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Cars */}
      <section className="py-6 md:py-12 flex-1">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg md:text-2xl font-semibold text-foreground">
              Carros em destaque
            </h2>
            <Link
              to="/browse"
              className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:shadow-md transition-fast md:w-auto md:h-auto md:border-0 md:rounded-none"
            >
              <ArrowRight className="w-4 h-4 md:hidden" />
              <span className="hidden md:flex items-center gap-1 text-sm font-semibold text-foreground hover:underline">
                Mostrar todos
                <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </div>

          {/* Mobile: 2-column grid like Airbnb */}
          <div className="grid grid-cols-2 gap-3 md:hidden">
            {isLoadingVehicles ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index}>
                  <Skeleton className="aspect-[4/3] rounded-xl mb-2" />
                  <Skeleton className="h-3.5 w-3/4 mb-1" />
                  <Skeleton className="h-3 w-1/2 mb-1" />
                  <Skeleton className="h-3.5 w-1/3" />
                </div>
              ))
            ) : featuredVehicles && featuredVehicles.length > 0 ? (
              featuredVehicles.slice(0, 6).map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} />
              ))
            ) : (
              <div className="col-span-2 text-center py-12">
                <Car className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Nenhum veículo disponível no momento.</p>
                <Button className="mt-4" asChild>
                  <Link to="/become-owner">Seja o primeiro a anunciar!</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Desktop grid */}
          <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-6">
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
        </div>
      </section>

      {/* How it works - Desktop only */}
      <section className="hidden md:block py-10 sm:py-16 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-8 sm:mb-10">
            Como funciona
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12">
            {[
              { step: "1", title: "Busque o carro ideal", description: "Encontre por localização, data e tipo de veículo" },
              { step: "2", title: "Reserve com segurança", description: "Pagamento protegido e comunicação direta com o proprietário" },
              { step: "3", title: "Retire e dirija", description: "Encontre o proprietário, faça a vistoria e pegue as chaves" },
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

      {/* CTA for Owners - Desktop only */}
      <section className="hidden md:block py-10 sm:py-16">
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
                  {["Cadastro gratuito e rápido", "Você define o preço e disponibilidade", "Seguro completo incluído", "Suporte dedicado 24/7"].map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm sm:text-base text-background/90">
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button size="lg" className="bg-background text-foreground hover:bg-background/90 rounded-lg font-semibold" asChild>
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

      {/* Benefits - Desktop only */}
      <section className="hidden md:block py-10 sm:py-16 border-t border-border">
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

      <div className="hidden md:block">
        <Footer />
      </div>

      {/* Mobile bottom spacing for tab bar */}
      <div className="h-14 md:hidden" />
      <BottomTabBar />
    </div>
  );
};

export default Index;
