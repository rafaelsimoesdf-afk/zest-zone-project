import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Star,
  MapPin,
  Users,
  Fuel,
  Settings,
  Calendar,
  Shield,
  MessageSquare,
  Share2,
  Heart,
  CheckCircle2,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

const CarDetails = () => {
  const { id } = useParams();
  const [mainImage, setMainImage] = useState(0);

  // Mock data - will be replaced with real data from backend
  const car = {
    id: id,
    name: "Honda Civic 2023",
    category: "Sedan",
    price: 150,
    rating: 4.9,
    reviews: 127,
    location: "Jardim Paulista, São Paulo - SP",
    images: [
      "https://images.unsplash.com/photo-1590362891991-f776e747a588",
      "https://images.unsplash.com/photo-1583121274602-3e2820c69888",
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d",
      "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb",
    ],
    owner: {
      name: "Carlos Silva",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos",
      rating: 4.9,
      trips: 45,
    },
    specs: {
      year: 2023,
      transmission: "Automático",
      fuel: "Flex",
      seats: 5,
      doors: 4,
      mileage: "15.000 km",
    },
    features: [
      "Ar-condicionado",
      "Direção hidráulica",
      "Vidros elétricos",
      "Travas elétricas",
      "Alarme",
      "Air bag",
      "Freios ABS",
      "Bluetooth",
      "USB",
      "Câmera de ré",
    ],
    description:
      "Honda Civic 2023 em perfeito estado de conservação. Revisões em dia na concessionária, único dono. Carro ideal para viagens e uso diário. Sempre guardado em garagem coberta.",
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24 pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Button
            variant="ghost"
            className="mb-6"
            asChild
          >
            <Link to="/browse">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para busca
            </Link>
          </Button>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Images Gallery */}
              <div className="space-y-4">
                <div className="relative h-[400px] sm:h-[500px] rounded-2xl overflow-hidden">
                  <img
                    src={car.images[mainImage]}
                    alt={car.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 right-4 flex gap-2">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="backdrop-blur-sm bg-background/80"
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="backdrop-blur-sm bg-background/80"
                    >
                      <Heart className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  {car.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setMainImage(index)}
                      className={`relative h-24 rounded-lg overflow-hidden border-2 transition-all ${
                        mainImage === index
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${car.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Car Info */}
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <Badge className="mb-3">{car.category}</Badge>
                    <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2">
                      {car.name}
                    </h1>
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Star className="w-5 h-5 fill-accent text-accent" />
                        <span className="font-semibold text-foreground">
                          {car.rating}
                        </span>
                        <span>({car.reviews} avaliações)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{car.location}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Specs */}
                <div>
                  <h2 className="font-bold text-xl mb-4">Especificações</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
                      <Calendar className="w-5 h-5 text-primary" />
                      <div>
                        <div className="text-sm text-muted-foreground">Ano</div>
                        <div className="font-semibold">{car.specs.year}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
                      <Settings className="w-5 h-5 text-primary" />
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Câmbio
                        </div>
                        <div className="font-semibold">
                          {car.specs.transmission}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
                      <Fuel className="w-5 h-5 text-primary" />
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Combustível
                        </div>
                        <div className="font-semibold">{car.specs.fuel}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
                      <Users className="w-5 h-5 text-primary" />
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Passageiros
                        </div>
                        <div className="font-semibold">{car.specs.seats}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Description */}
                <div>
                  <h2 className="font-bold text-xl mb-4">Descrição</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {car.description}
                  </p>
                </div>

                <Separator className="my-6" />

                {/* Features */}
                <div>
                  <h2 className="font-bold text-xl mb-4">
                    Recursos e Acessórios
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {car.features.map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-sm"
                      >
                        <CheckCircle2 className="w-4 h-4 text-secondary" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Owner Info */}
                <div>
                  <h2 className="font-bold text-xl mb-4">Proprietário</h2>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <Avatar className="w-16 h-16">
                          <AvatarImage src={car.owner.avatar} />
                          <AvatarFallback>
                            {car.owner.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg">
                            {car.owner.name}
                          </h3>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-accent text-accent" />
                              <span>{car.owner.rating}</span>
                            </div>
                            <span>•</span>
                            <span>{car.owner.trips} viagens</span>
                          </div>
                        </div>
                        <Button variant="outline">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Conversar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            {/* Booking Card - Sticky */}
            <div className="lg:sticky lg:top-24 h-fit">
              <Card className="border-2 shadow-xl">
                <CardContent className="p-6">
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-4xl font-display font-bold text-primary">
                        R$ {car.price}
                      </span>
                      <span className="text-muted-foreground">/dia</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      * Valor pode variar conforme o período
                    </p>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Data de Retirada
                      </label>
                      <Input type="date" className="h-12" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Data de Devolução
                      </label>
                      <Input type="date" className="h-12" />
                    </div>
                  </div>

                  <div className="space-y-3 mb-6 p-4 bg-muted/50 rounded-xl">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        R$ {car.price} x 3 dias
                      </span>
                      <span className="font-semibold">R$ {car.price * 3}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Taxa de serviço</span>
                      <span className="font-semibold">R$ 45</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Seguro</span>
                      <span className="font-semibold">R$ 60</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span className="text-primary text-lg">
                        R$ {car.price * 3 + 45 + 60}
                      </span>
                    </div>
                  </div>

                  <Button
                    size="lg"
                    className="w-full bg-gradient-accent hover:opacity-90 transition-smooth mb-4"
                  >
                    Reservar Agora
                  </Button>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
                    <Shield className="w-4 h-4 text-secondary" />
                    <span>Pagamento seguro e protegido</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

// Missing Input component import
import { Input } from "@/components/ui/input";

export default CarDetails;
