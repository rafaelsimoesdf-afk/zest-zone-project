import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, MessageSquare, CreditCard, Car, Settings, ArrowRight, Search, User, AlertTriangle, Users, Zap, HelpCircle } from "lucide-react";
import { useFaqArticles, categoryLabels, type TicketCategory } from "@/hooks/useSupportTickets";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

interface SupportBotProps {
  onOpenTicket: () => void;
}

const botOptions = [
  { id: "booking" as TicketCategory, label: "Problema com reserva", icon: MessageSquare },
  { id: "payment" as TicketCategory, label: "Problema com pagamento", icon: CreditCard },
  { id: "vehicle_issue" as TicketCategory, label: "Problema com veículo", icon: Car },
  { id: "technical" as TicketCategory, label: "Problema com o app", icon: Settings },
  { id: "account" as TicketCategory, label: "Problema com conta", icon: User },
  { id: "accident" as TicketCategory, label: "Acidente ou dano", icon: AlertTriangle },
  { id: "owner_issue" as TicketCategory, label: "Problema com proprietário", icon: Users },
  { id: "renter_issue" as TicketCategory, label: "Problema com locatário", icon: Users },
];

const quickTips: Record<string, string[]> = {
  booking: [
    "Para cancelar uma reserva, acesse 'Minhas Reservas' e clique em 'Cancelar'.",
    "Problemas com vistoria? O proprietário e o locatário devem ambos confirmar.",
  ],
  payment: [
    "Pagamentos são processados pelo Stripe com total segurança.",
    "Reembolsos podem levar de 5 a 10 dias úteis.",
  ],
  vehicle_issue: [
    "Entre em contato imediatamente com o proprietário via chat.",
    "Documente qualquer dano com fotos antes e depois da reserva.",
  ],
  technical: [
    "Limpe o cache do navegador (Ctrl+Shift+Del) e recarregue.",
    "Verifique se seu navegador está atualizado.",
  ],
  account: [
    "Acesse seu perfil para editar dados pessoais e documentos.",
    "Para redefinir senha, use a opção 'Esqueci minha senha' na tela de login.",
  ],
  accident: [
    "Garanta a segurança de todos e acione a polícia se necessário.",
    "Registre o ocorrido com fotos e abra um chamado emergencial.",
  ],
  owner_issue: [
    "Tente resolver pelo chat da reserva primeiro.",
    "Se necessário, abra um chamado para mediação da plataforma.",
  ],
  renter_issue: [
    "Comunique-se pelo chat da reserva.",
    "Documente qualquer problema e abra um chamado se necessário.",
  ],
};

const SupportBot = ({ onOpenTicket }: SupportBotProps) => {
  const [selectedTopic, setSelectedTopic] = useState<TicketCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: faqArticles } = useFaqArticles(selectedTopic || undefined);

  // Filter FAQ articles relevant to the selected topic or search
  const relevantArticles = useMemo(() => {
    if (!faqArticles) return [];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return faqArticles.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.content.toLowerCase().includes(q) ||
          (a.keywords && a.keywords.some((k: string) => k.toLowerCase().includes(q)))
      );
    }
    return faqArticles.slice(0, 5);
  }, [faqArticles, searchQuery]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          Assistente Virtual
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!selectedTopic ? (
          <>
            <p className="text-muted-foreground">
              Olá! Sou o assistente da Infinite Drive. Qual é o seu problema?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {botOptions.map((opt) => (
                <Button
                  key={opt.id}
                  variant="outline"
                  className="h-auto py-4 flex flex-col items-center gap-2"
                  onClick={() => setSelectedTopic(opt.id)}
                >
                  <opt.icon className="h-6 w-6 text-primary" />
                  <span>{opt.label}</span>
                </Button>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Quick tips */}
            <div className="bg-muted rounded-lg p-4 space-y-3">
              <p className="font-medium flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Dicas rápidas para "{categoryLabels[selectedTopic]}":
              </p>
              {(quickTips[selectedTopic] || []).map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <ArrowRight className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                  <span>{s}</span>
                </div>
              ))}
            </div>

            {/* Smart FAQ search */}
            <div className="space-y-3">
              <p className="font-medium flex items-center gap-2 text-sm">
                <HelpCircle className="h-4 w-4 text-primary" />
                Artigos que podem ajudar:
              </p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar no FAQ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              {relevantArticles.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                  {relevantArticles.map((article, i) => (
                    <AccordionItem key={article.id || i} value={`faq-${i}`}>
                      <AccordionTrigger className="text-left text-sm py-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px] shrink-0">
                            {categoryLabels[article.category]}
                          </Badge>
                          <span>{article.title}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground text-sm whitespace-pre-wrap">
                        {article.content}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : searchQuery ? (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Nenhum artigo encontrado. Abra um chamado para falar com o suporte.
                </p>
              ) : null}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" onClick={() => { setSelectedTopic(null); setSearchQuery(""); }}>
                Voltar
              </Button>
              <Button onClick={onOpenTicket} className="flex-1">
                <MessageSquare className="h-4 w-4 mr-2" />
                Falar com suporte humano
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SupportBot;
