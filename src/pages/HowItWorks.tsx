import { Link } from "react-router-dom";
import {
  Search,
  CreditCard,
  Key,
  Star,
  Shield,
  Clock,
  CheckCircle2,
  Users,
  Car,
  DollarSign,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const HowItWorks = () => {
  const renterSteps = [
    {
      icon: Search,
      title: "Busque o Carro Ideal",
      description:
        "Use nossos filtros avançados para encontrar o veículo perfeito por localização, tipo, preço e mais.",
      details: [
        "Busca por cidade ou endereço específico",
        "Filtros por categoria, transmissão e combustível",
        "Visualização em mapa interativo",
        "Compare preços e avaliações",
      ],
    },
    {
      icon: CreditCard,
      title: "Reserve com Segurança",
      description:
        "Selecione as datas, converse com o proprietário e faça o pagamento protegido pela plataforma.",
      details: [
        "Calendário de disponibilidade em tempo real",
        "Chat direto com o proprietário",
        "Pagamento 100% seguro via cartão ou PIX",
        "Confirmação instantânea",
      ],
    },
    {
      icon: Key,
      title: "Retire e Dirija",
      description:
        "Encontre o proprietário no local combinado, faça a vistoria e pegue as chaves.",
      details: [
        "Vistoria com registro fotográfico",
        "Check-list de itens do veículo",
        "Assinatura digital do contrato",
        "Suporte 24h durante toda a viagem",
      ],
    },
    {
      icon: Star,
      title: "Devolva e Avalie",
      description:
        "Retorne o veículo, faça a vistoria final e compartilhe sua experiência.",
      details: [
        "Vistoria final com fotos",
        "Devolução das chaves",
        "Avaliação mútua proprietário/locatário",
        "Resolução rápida de problemas",
      ],
    },
  ];

  const ownerSteps = [
    {
      icon: Car,
      title: "Cadastre seu Veículo",
      description:
        "Adicione fotos, informações e documentos do seu carro em poucos minutos.",
      details: [
        "Upload de fotos de todos os ângulos",
        "Informações técnicas e acessórios",
        "Documentos CRLV e seguro",
        "Verificação em até 24 horas",
      ],
    },
    {
      icon: DollarSign,
      title: "Defina seu Preço",
      description:
        "Você tem controle total sobre o valor da diária e disponibilidade do veículo.",
      details: [
        "Sugestão de preço baseada no mercado",
        "Ajuste de preços por período",
        "Bloqueio de datas indisponíveis",
        "Desconto para aluguéis longos",
      ],
    },
    {
      icon: Users,
      title: "Receba Solicitações",
      description:
        "Locatários interessados farão pedidos de reserva. Você decide aceitar ou não.",
      details: [
        "Perfil completo do locatário",
        "Histórico de aluguéis e avaliações",
        "Chat para tirar dúvidas",
        "Aceite ou recuse pedidos",
      ],
    },
    {
      icon: Shield,
      title: "Ganhe com Segurança",
      description:
        "Entregue o carro, receba o pagamento automaticamente e tenha proteção total.",
      details: [
        "Seguro completo contra danos e roubos",
        "Pagamento garantido após cada aluguel",
        "Suporte 24h para emergências",
        "Reputação protegida por avaliações",
      ],
    },
  ];

  const safety = [
    {
      icon: Shield,
      title: "Seguro Completo",
      description:
        "Todos os aluguéis incluem seguro contra danos, roubos, acidentes e responsabilidade civil.",
    },
    {
      icon: CheckCircle2,
      title: "Verificação de Usuários",
      description:
        "CNH válida, CPF e documentos verificados antes de qualquer reserva.",
    },
    {
      icon: Clock,
      title: "Suporte 24/7",
      description:
        "Equipe dedicada disponível 24 horas por dia para ajudar com qualquer problema.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-6">Processo Simples e Seguro</Badge>
          <h1 className="font-display text-5xl sm:text-6xl font-bold mb-6">
            Como Funciona o{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              InfiniteDrive
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Alugar ou anunciar um carro nunca foi tão fácil. Veja como funciona
            para locatários e proprietários.
          </p>
        </div>
      </section>

      {/* Tabs */}
      <section className="pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs defaultValue="renter" className="max-w-6xl mx-auto">
            <TabsList className="grid w-full grid-cols-2 mb-12 h-14">
              <TabsTrigger value="renter" className="text-base">
                🚗 Para Locatários
              </TabsTrigger>
              <TabsTrigger value="owner" className="text-base">
                💰 Para Proprietários
              </TabsTrigger>
            </TabsList>

            {/* Renter Flow */}
            <TabsContent value="renter">
              <div className="space-y-12">
                {renterSteps.map((step, index) => (
                  <div
                    key={index}
                    className={`flex flex-col ${
                      index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
                    } gap-8 items-center`}
                  >
                    <div className="flex-1">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mb-6 shadow-glow">
                        <step.icon className="w-8 h-8 text-white" />
                      </div>
                      <div className="text-5xl font-display font-bold text-muted mb-4">
                        0{index + 1}
                      </div>
                      <h3 className="font-display text-3xl font-bold mb-4">
                        {step.title}
                      </h3>
                      <p className="text-lg text-muted-foreground mb-6">
                        {step.description}
                      </p>
                      <ul className="space-y-2">
                        {step.details.map((detail, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex-1">
                      <Card className="border-2 overflow-hidden">
                        <CardContent className="p-0">
                          <div className="aspect-video bg-gradient-hero opacity-20" />
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center mt-12">
                <Button size="lg" asChild>
                  <Link to="/browse">Começar a Buscar Carros</Link>
                </Button>
              </div>
            </TabsContent>

            {/* Owner Flow */}
            <TabsContent value="owner">
              <div className="space-y-12">
                {ownerSteps.map((step, index) => (
                  <div
                    key={index}
                    className={`flex flex-col ${
                      index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
                    } gap-8 items-center`}
                  >
                    <div className="flex-1">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-accent flex items-center justify-center mb-6 shadow-glow">
                        <step.icon className="w-8 h-8 text-white" />
                      </div>
                      <div className="text-5xl font-display font-bold text-muted mb-4">
                        0{index + 1}
                      </div>
                      <h3 className="font-display text-3xl font-bold mb-4">
                        {step.title}
                      </h3>
                      <p className="text-lg text-muted-foreground mb-6">
                        {step.description}
                      </p>
                      <ul className="space-y-2">
                        {step.details.map((detail, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex-1">
                      <Card className="border-2 overflow-hidden">
                        <CardContent className="p-0">
                          <div className="aspect-video bg-gradient-accent opacity-20" />
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center mt-12">
                <Button size="lg" asChild>
                  <Link to="/become-owner">Cadastrar Meu Carro</Link>
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Safety */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4">Segurança em Primeiro Lugar</Badge>
            <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4">
              Sua Proteção é Nossa Prioridade
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Implementamos múltiplas camadas de segurança para proteger
              locatários e proprietários
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {safety.map((item, index) => (
              <Card key={index} className="border-2 text-center">
                <CardContent className="pt-8 pb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-4 shadow-glow">
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-xl mb-3">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HowItWorks;
