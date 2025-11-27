import { useState } from "react";
import { Search, SlidersHorizontal, MapPin, Star } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "react-router-dom";

const Browse = () => {
  const [showFilters, setShowFilters] = useState(false);

  const cars = [
    {
      id: 1,
      name: "Honda Civic 2023",
      category: "Sedan",
      price: 150,
      rating: 4.9,
      reviews: 127,
      image: "https://images.unsplash.com/photo-1590362891991-f776e747a588",
      location: "São Paulo, SP",
      transmission: "Automático",
      fuel: "Flex",
    },
    {
      id: 2,
      name: "Jeep Compass 2022",
      category: "SUV",
      price: 220,
      rating: 4.8,
      reviews: 94,
      image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf",
      location: "Rio de Janeiro, RJ",
      transmission: "Automático",
      fuel: "Flex",
    },
    {
      id: 3,
      name: "Toyota Corolla 2024",
      category: "Sedan",
      price: 170,
      rating: 5.0,
      reviews: 203,
      image: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb",
      location: "Brasília, DF",
      transmission: "Automático",
      fuel: "Híbrido",
    },
    {
      id: 4,
      name: "Volkswagen T-Cross 2023",
      category: "SUV",
      price: 180,
      rating: 4.7,
      reviews: 156,
      image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d",
      location: "São Paulo, SP",
      transmission: "Automático",
      fuel: "Flex",
    },
    {
      id: 5,
      name: "Hyundai HB20 2023",
      category: "Hatchback",
      price: 120,
      rating: 4.6,
      reviews: 89,
      image: "https://images.unsplash.com/photo-1583121274602-3e2820c69888",
      location: "Curitiba, PR",
      transmission: "Manual",
      fuel: "Flex",
    },
    {
      id: 6,
      name: "Fiat Argo 2022",
      category: "Hatchback",
      price: 110,
      rating: 4.5,
      reviews: 71,
      image: "https://images.unsplash.com/photo-1609521263047-f8f205293f24",
      location: "Belo Horizonte, MG",
      transmission: "Manual",
      fuel: "Flex",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24 pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4">
              Encontre o Carro Perfeito
            </h1>
            <p className="text-lg text-muted-foreground">
              Mais de 10.000 carros disponíveis para você
            </p>
          </div>

          {/* Search and Filters */}
          <div className="bg-card border rounded-2xl p-6 mb-8 shadow-md">
            <div className="grid lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2 relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Cidade ou endereço..."
                  className="pl-10 h-12"
                />
              </div>
              <Select>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Tipo de Veículo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="sedan">Sedan</SelectItem>
                  <SelectItem value="suv">SUV</SelectItem>
                  <SelectItem value="hatchback">Hatchback</SelectItem>
                  <SelectItem value="pickup">Pickup</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Transmissão" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="automatic">Automático</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1 lg:flex-none"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <SlidersHorizontal className="w-5 h-5 mr-2" />
                  Filtros
                </Button>
                <Button
                  size="lg"
                  className="flex-1 bg-gradient-primary hover:opacity-90 transition-smooth"
                >
                  <Search className="w-5 h-5 mr-2" />
                  Buscar
                </Button>
              </div>
            </div>

            {showFilters && (
              <div className="mt-6 pt-6 border-t grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Preço Máximo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="100">Até R$ 100/dia</SelectItem>
                    <SelectItem value="150">Até R$ 150/dia</SelectItem>
                    <SelectItem value="200">Até R$ 200/dia</SelectItem>
                    <SelectItem value="300">Até R$ 300/dia</SelectItem>
                  </SelectContent>
                </Select>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Combustível" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="flex">Flex</SelectItem>
                    <SelectItem value="gasoline">Gasolina</SelectItem>
                    <SelectItem value="diesel">Diesel</SelectItem>
                    <SelectItem value="electric">Elétrico</SelectItem>
                    <SelectItem value="hybrid">Híbrido</SelectItem>
                  </SelectContent>
                </Select>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Ano" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2023">2023</SelectItem>
                    <SelectItem value="2022">2022</SelectItem>
                    <SelectItem value="2021">2021 ou anterior</SelectItem>
                  </SelectContent>
                </Select>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevância</SelectItem>
                    <SelectItem value="price-low">Menor Preço</SelectItem>
                    <SelectItem value="price-high">Maior Preço</SelectItem>
                    <SelectItem value="rating">Melhor Avaliado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Results */}
          <div className="mb-4">
            <p className="text-muted-foreground">
              Mostrando <span className="font-semibold text-foreground">{cars.length}</span> resultados
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cars.map((car) => (
              <Link key={car.id} to={`/cars/${car.id}`}>
                <Card className="overflow-hidden group hover:shadow-xl transition-smooth border-2 hover:border-primary h-full">
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={car.image}
                      alt={car.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-smooth"
                    />
                    <Badge className="absolute top-4 right-4 bg-background/90 backdrop-blur">
                      {car.category}
                    </Badge>
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-xl">{car.name}</h3>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-accent text-accent" />
                        <span className="font-semibold">{car.rating}</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      📍 {car.location}
                    </p>
                    <div className="flex gap-2 mb-4">
                      <Badge variant="secondary" className="text-xs">
                        {car.transmission}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {car.fuel}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-2xl font-bold text-primary">
                          R$ {car.price}
                        </span>
                        <span className="text-muted-foreground text-sm">/dia</span>
                      </div>
                      <Button size="sm" className="bg-gradient-accent">
                        Ver Detalhes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Browse;
