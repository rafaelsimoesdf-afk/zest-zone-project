import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  useSupportTicket,
  useTicketMessages,
  useSendTicketMessage,
  useRateTicket,
  categoryLabels,
  priorityLabels,
  statusLabels,
  slaLabels,
  type TicketPriority,
  type TicketCategory,
} from "@/hooks/useSupportTickets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Clock, Send, Star, MessageSquare } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const priorityColor: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  emergency: "bg-destructive/10 text-destructive",
};

const statusColor: Record<string, string> = {
  open: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  in_progress: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  waiting_customer: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  resolved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  closed: "bg-muted text-muted-foreground",
};

const TicketDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: ticket, isLoading } = useSupportTicket(id);
  const { data: messages } = useTicketMessages(id);
  const sendMessage = useSendTicketMessage();
  const rateTicket = useRateTicket();
  const [newMessage, setNewMessage] = useState("");
  const [rating, setRating] = useState(0);
  const [resolvedProblem, setResolvedProblem] = useState<"yes" | "partially" | "no">("yes");
  const [ratingComment, setRatingComment] = useState("");
  const [showRating, setShowRating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!user) {
    navigate("/auth");
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex flex-col bg-background">
        <main className="flex-1 container mx-auto px-4 py-8 mt-16">
          <Skeleton className="h-96 w-full max-w-4xl mx-auto" />
        </main>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex flex-col bg-background">
        <main className="flex-1 container mx-auto px-4 py-8 mt-16 text-center">
          <p className="text-muted-foreground">Chamado não encontrado.</p>
        </main>
      </div>
    );
  }

  const isClosedOrResolved = ticket.status === "resolved" || ticket.status === "closed";

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    await sendMessage.mutateAsync({ ticketId: ticket.id, content: newMessage });
    setNewMessage("");
  };

  const handleRate = async () => {
    if (rating === 0) return;
    await rateTicket.mutateAsync({
      ticketId: ticket.id,
      rating,
      resolvedProblem,
      comment: ratingComment || undefined,
    });
    setShowRating(false);
  };

  return (
    <div className="flex flex-col bg-background">
      <main className="flex-1 container mx-auto px-4 py-8 mt-16">
        <div className="max-w-4xl mx-auto space-y-4">
          <Button variant="ghost" onClick={() => navigate("/support")} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>

          {/* Ticket header */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <span className="text-xs font-mono text-muted-foreground">{ticket.ticket_number}</span>
                  <CardTitle className="text-lg mt-1">{ticket.subject}</CardTitle>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Badge className={statusColor[ticket.status] || ""} variant="secondary">
                    {statusLabels[ticket.status] || ticket.status}
                  </Badge>
                  <Badge className={priorityColor[ticket.priority] || ""} variant="secondary">
                    {priorityLabels[ticket.priority as TicketPriority] || ticket.priority}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span>Categoria: {categoryLabels[ticket.category as TicketCategory] || ticket.category}</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  SLA: {slaLabels[ticket.priority as TicketPriority]}
                </span>
                <span>Aberto: {new Date(ticket.created_at).toLocaleString("pt-BR")}</span>
              </div>
              <div className="mt-3 p-3 bg-muted rounded-md text-sm">
                {ticket.message}
              </div>
            </CardContent>
          </Card>

          {/* Chat */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Conversação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-3">
                  {messages && messages.length > 0 ? (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender_id === user.id ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 text-sm ${
                            msg.is_from_support
                              ? "bg-primary/10 text-foreground border border-primary/20"
                              : msg.sender_id === user.id
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-foreground"
                          }`}
                        >
                          {msg.is_from_support && (
                            <span className="text-xs font-semibold text-primary block mb-1">Suporte</span>
                          )}
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                          <span className="text-[10px] opacity-70 mt-1 block">
                            {new Date(msg.created_at).toLocaleString("pt-BR")}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground text-sm py-4">
                      Nenhuma mensagem ainda. O suporte responderá em breve.
                    </p>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {!isClosedOrResolved ? (
                <div className="flex gap-2 mt-4">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    className="min-h-[48px]"
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                  />
                  <Button onClick={handleSend} disabled={sendMessage.isPending || !newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4 space-y-3">
                  <p className="text-muted-foreground text-sm">
                    Este chamado foi {ticket.status === "resolved" ? "resolvido" : "fechado"}.
                  </p>
                  {ticket.status === "resolved" && !showRating && (
                    <Button variant="outline" onClick={() => setShowRating(true)}>
                      <Star className="h-4 w-4 mr-2" />
                      Avaliar atendimento
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Rating */}
          {showRating && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Avaliar Atendimento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Nota</Label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} onClick={() => setRating(n)} className="focus:outline-none">
                        <Star
                          className={`h-7 w-7 transition-colors ${
                            n <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>O atendimento resolveu seu problema?</Label>
                  <div className="flex gap-2">
                    {([["yes", "Sim"], ["partially", "Parcialmente"], ["no", "Não"]] as const).map(([val, label]) => (
                      <Button
                        key={val}
                        variant={resolvedProblem === val ? "default" : "outline"}
                        size="sm"
                        onClick={() => setResolvedProblem(val)}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Comentário (opcional)</Label>
                  <Input
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    placeholder="Deixe um comentário..."
                  />
                </div>

                <Button onClick={handleRate} disabled={rating === 0 || rateTicket.isPending}>
                  Enviar avaliação
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default TicketDetail;
