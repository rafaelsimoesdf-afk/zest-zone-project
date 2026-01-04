import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  DollarSign,
  Shield,
  Clock,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Car,
  Users,
  Star,
  Calendar,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";

const BecomeOwner = () => {
  const [dailyPrice, setDailyPrice] = useState(150);
  const [availableDays, setAvailableDays] = useState(20);
  const [availableDaysInput, setAvailableDaysInput] = useState("20");
  
  const estimatedEarnings = useMemo(() => {
    const gross = dailyPrice * availableDays;
    const netEarnings = gross * 0.85; // 15% platform fee
    return netEarnings;
  }, [dailyPrice, availableDays]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    const numericValue = Math.min(parseInt(rawValue) || 0, 31);
    setAvailableDays(numericValue);
    setAvailableDaysInput(rawValue === '' ? '' : numericValue.toString());
  };

  const handleDaysBlur = () => {
    if (availableDays > 0) {
      setAvailableDaysInput(availableDays.toString());
    } else {
      setAvailableDaysInput('');
    }
  };

  const benefits = [
    {
      icon: DollarSign,
      title: "Ganhe Dinheiro Extra",
      description:
        "Transforme seu carro parado em fonte de renda. Proprietários ganham em média R$ 2.000 por mês.",
    },
    {
      icon: Shield,
      title: "Proteção Completa",
      description:
        "Seguro contra danos, roubos e acidentes incluído em todas as reservas.",
    },
    {
      icon: Clock,
      title: "Você Decide Quando",
      description:
        "Controle total sobre disponibilidade, preços e quem pode alugar seu carro.",
    },
    {
      icon: TrendingUp,
      title: "Crescimento Garantido",
      description:
        "Nossa plataforma tem crescimento constante com milhares de novos usuários mensais.",
    },
  ];

  const steps = [
    {
      number: "1",
      title: "Cadastre-se Grátis",
      description: "Crie sua conta em menos de 2 minutos",
    },
    {
      number: "2",
      title: "Adicione seu Carro",
      description: "Tire fotos, adicione informações e documentos",
    },
    {
      number: "3",
      title: "Defina seu Preço",
      description: "Você escolhe quanto quer cobrar por dia",
    },
    {
      number: "4",
      title: "Comece a Ganhar",
      description: "Aceite reservas e receba o pagamento automaticamente",
    },
  ];

  const faqs = [
    {
      question: "Quanto posso ganhar?",
      answer:
        "A média dos proprietários é R$ 2.000/mês, mas depende do modelo do carro, localização e disponibilidade.",
    },
    {
      question: "O que acontece se o carro for danificado?",
      answer:
        "Todos os aluguéis têm seguro completo. Você está protegido contra danos, roubos e acidentes.",
    },
    {
      question: "Posso escolher quem aluga meu carro?",
      answer:
        "Sim! Você pode aceitar ou recusar qualquer solicitação de reserva.",
    },
    {
      question: "Qual é a taxa cobrada?",
      answer:
        "Cobramos 15% do valor da reserva para manter a plataforma e cobrir seguros.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-5" />
        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 bg-accent text-accent-foreground">
              💰 Ganhe até R$ 3.000/mês
            </Badge>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Transforme seu Carro em{" "}
              <span className="text-primary">
                Fonte de Renda
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Milhares de proprietários já estão lucrando com seus veículos
              ociosos. Junte-se a eles e comece a ganhar hoje mesmo.
            </p>

            {/* Earnings Calculator */}
            <Card className="max-w-2xl mx-auto border-2 shadow-xl">
              <CardContent className="p-8">
                <h3 className="font-bold text-xl mb-6">
                  Calcule quanto você pode ganhar
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block text-left">
                      Preço da diária
                    </label>
                    <CurrencyInput
                      className="h-12"
                      value={dailyPrice}
                      onChange={setDailyPrice}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block text-left">
                      Dias disponíveis por mês
                    </label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      className="h-12"
                      value={availableDaysInput}
                      onChange={handleDaysChange}
                      onBlur={handleDaysBlur}
                    />
                  </div>
                  <div className="p-6 gradient-primary rounded-xl text-white">
                    <div className="text-sm mb-1 opacity-90">
                      Ganhos estimados por mês
                    </div>
                    <div className="text-4xl font-display font-bold">
                      {formatCurrency(estimatedEarnings)}
                    </div>
                    <div className="text-sm mt-2 opacity-90">
                      * Após taxa da plataforma
                    </div>
                  </div>
                </div>
                <Button
                  size="lg"
                  className="w-full mt-6 bg-accent hover:opacity-90 transition-smooth"
                  asChild
                >
                  <Link to="/add-vehicle">
                    Começar Agora
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4">Vantagens</Badge>
            <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4">
              Por que Anunciar no InfiniteDrive?
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <Card
                key={index}
                className="border-2 hover:border-primary transition-smooth hover:shadow-lg"
              >
                <CardContent className="pt-6 text-center">
                  <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-glow">
                    <benefit.icon className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h3 className="font-bold text-xl mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4">Processo Simples</Badge>
            <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4">
              Como Começar
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Em 4 passos simples você já estará ganhando dinheiro
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4 text-2xl font-display font-bold text-primary-foreground shadow-glow">
                    {step.number}
                  </div>
                  <h3 className="font-bold text-xl mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-0.5 gradient-primary opacity-30" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
            <Card className="text-center border-2">
              <CardContent className="pt-6">
                <Car className="w-10 h-10 mx-auto mb-3 text-primary" />
                <div className="text-4xl font-display font-bold mb-2">
                  10K+
                </div>
                <div className="text-muted-foreground">
                  Carros Cadastrados
                </div>
              </CardContent>
            </Card>
            <Card className="text-center border-2">
              <CardContent className="pt-6">
                <Users className="w-10 h-10 mx-auto mb-3 text-secondary" />
                <div className="text-4xl font-display font-bold mb-2">
                  50K+
                </div>
                <div className="text-muted-foreground">Locatários Ativos</div>
              </CardContent>
            </Card>
            <Card className="text-center border-2">
              <CardContent className="pt-6">
                <DollarSign className="w-10 h-10 mx-auto mb-3 text-accent" />
                <div className="text-4xl font-display font-bold mb-2">
                  R$ 2k
                </div>
                <div className="text-muted-foreground">Ganho Médio/Mês</div>
              </CardContent>
            </Card>
            <Card className="text-center border-2">
              <CardContent className="pt-6">
                <Star className="w-10 h-10 mx-auto mb-3 text-accent" />
                <div className="text-4xl font-display font-bold mb-2">4.9</div>
                <div className="text-muted-foreground">Avaliação Média</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4">Dúvidas Frequentes</Badge>
            <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4">
              Perguntas e Respostas
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index} className="border-2">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-secondary" />
                    {faq.question}
                  </h3>
                  <p className="text-muted-foreground ml-7">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 gradient-hero text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-4xl sm:text-5xl font-bold mb-6">
            Pronto para Começar a Ganhar?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Cadastre-se gratuitamente e comece a lucrar com seu carro hoje mesmo
          </p>
          <Button size="lg" className="bg-white text-primary hover:bg-white/90" asChild>
            <Link to="/add-vehicle">
              Cadastrar Meu Carro
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BecomeOwner;
