import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, MessageSquare, CreditCard, Car, Settings, ArrowRight } from "lucide-react";
import { categoryLabels, type TicketCategory } from "@/hooks/useSupportTickets";

interface SupportBotProps {
  onOpenTicket: () => void;
}

const botOptions = [
  { id: "booking" as TicketCategory, label: "Problema com reserva", icon: MessageSquare },
  { id: "payment" as TicketCategory, label: "Problema com pagamento", icon: CreditCard },
  { id: "vehicle_issue" as TicketCategory, label: "Problema com veículo", icon: Car },
  { id: "technical" as TicketCategory, label: "Problema com o app", icon: Settings },
];

const suggestions: Record<string, string[]> = {
  booking: [
    "Para cancelar uma reserva, acesse 'Minhas Reservas' e clique em 'Cancelar'.",
    "Se a reserva não aparece, tente recarregar a página ou verificar seus filtros.",
    "Problemas com vistoria? O proprietário e o locatário devem ambos confirmar a vistoria.",
  ],
  payment: [
    "Pagamentos são processados pelo Stripe com total segurança.",
    "Reembolsos podem levar de 5 a 10 dias úteis para aparecer na sua conta.",
    "Se o pagamento falhou, verifique os dados do cartão e tente novamente.",
  ],
  vehicle_issue: [
    "Em caso de problema mecânico, entre em contato imediatamente com o proprietário via chat.",
    "Documente qualquer dano com fotos antes e depois da reserva.",
    "Para problemas graves ou acidentes, abra um chamado emergencial.",
  ],
  technical: [
    "Tente limpar o cache do navegador (Ctrl+Shift+Del) e recarregar.",
    "Verifique se seu navegador está atualizado.",
    "Se o problema persistir, abra um chamado técnico com detalhes do erro.",
  ],
};

const SupportBot = ({ onOpenTicket }: SupportBotProps) => {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

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
            <div className="bg-muted rounded-lg p-4 space-y-3">
              <p className="font-medium flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary" />
                Aqui estão algumas sugestões para "{categoryLabels[selectedTopic as TicketCategory]}":
              </p>
              {(suggestions[selectedTopic] || []).map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <ArrowRight className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                  <span>{s}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" onClick={() => setSelectedTopic(null)}>
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
