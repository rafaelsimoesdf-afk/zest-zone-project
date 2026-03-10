import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { useFaqArticles, categoryLabels, type TicketCategory } from "@/hooks/useSupportTickets";

const categories: TicketCategory[] = ["account", "payment", "booking", "vehicle_issue", "owner_issue", "renter_issue", "accident", "technical", "other"];

// Fallback FAQ if no articles in DB
const defaultFaq = [
  { category: "booking" as TicketCategory, title: "Como faço uma reserva?", content: "Para reservar um veículo, navegue até a página de busca, selecione o veículo desejado, escolha as datas e horários, e clique em 'Reservar'. Você será redirecionado para o checkout." },
  { category: "booking" as TicketCategory, title: "Como cancelo uma reserva?", content: "Acesse 'Minhas Reservas', selecione a reserva que deseja cancelar e clique em 'Cancelar Reserva'. Lembre-se que políticas de cancelamento podem se aplicar." },
  { category: "payment" as TicketCategory, title: "Quais formas de pagamento são aceitas?", content: "Aceitamos cartões de crédito e débito processados pelo Stripe. O pagamento é realizado de forma segura durante o checkout." },
  { category: "payment" as TicketCategory, title: "Como funciona o reembolso?", content: "Reembolsos são processados automaticamente de acordo com a política de cancelamento. O prazo pode variar de 5 a 10 dias úteis dependendo do seu banco." },
  { category: "vehicle_issue" as TicketCategory, title: "O que fazer em caso de problema com o veículo?", content: "Entre em contato imediatamente com o proprietário via chat da reserva. Se não resolver, abra um chamado de suporte com prioridade alta." },
  { category: "account" as TicketCategory, title: "Como altero meus dados pessoais?", content: "Acesse seu perfil clicando no ícone do usuário e selecione 'Perfil'. Lá você pode editar seus dados pessoais, endereço e documentos." },
  { category: "accident" as TicketCategory, title: "O que fazer em caso de acidente?", content: "Em caso de acidente: 1) Garanta a segurança de todos. 2) Acione a polícia se necessário. 3) Registre o ocorrido com fotos. 4) Abra um chamado emergencial no suporte." },
  { category: "technical" as TicketCategory, title: "O app não está funcionando corretamente", content: "Tente limpar o cache do navegador e recarregar a página. Se o problema persistir, abra um chamado técnico descrevendo o erro." },
];

const FaqSection = () => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<TicketCategory | null>(null);
  const { data: dbArticles } = useFaqArticles();

  const articles = dbArticles && dbArticles.length > 0 ? dbArticles : defaultFaq;

  const filtered = articles.filter((a) => {
    const matchCategory = !selectedCategory || a.category === selectedCategory;
    const matchSearch = !search ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.content.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar perguntas frequentes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge
          variant={selectedCategory === null ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => setSelectedCategory(null)}
        >
          Todos
        </Badge>
        {categories.map((cat) => (
          <Badge
            key={cat}
            variant={selectedCategory === cat ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setSelectedCategory(cat)}
          >
            {categoryLabels[cat]}
          </Badge>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          Nenhuma pergunta encontrada. Tente abrir um chamado de suporte.
        </p>
      ) : (
        <Accordion type="single" collapsible className="w-full">
          {filtered.map((article, i) => (
            <AccordionItem key={article.title + i} value={`item-${i}`}>
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {categoryLabels[article.category]}
                  </Badge>
                  <span>{article.title}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground whitespace-pre-wrap">
                {article.content}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
};

export default FaqSection;
