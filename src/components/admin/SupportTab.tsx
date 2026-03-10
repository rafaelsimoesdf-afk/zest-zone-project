import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAllSupportTickets,
  useUpdateTicketStatus,
  useSendAdminTicketMessage,
  useTicketMessages,
  categoryLabels,
  priorityLabels,
  statusLabels,
  type TicketCategory,
  type TicketPriority,
} from "@/hooks/useSupportTickets";
import { MessageSquare, Send, Filter, Clock } from "lucide-react";

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

const SupportTab = () => {
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterPriority, setFilterPriority] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const { data: tickets, isLoading } = useAllSupportTickets({
    status: filterStatus || undefined,
    priority: filterPriority || undefined,
    category: filterCategory || undefined,
  });
  const updateStatus = useUpdateTicketStatus();
  const sendReply = useSendAdminTicketMessage();
  const { data: messages } = useTicketMessages(selectedTicketId || undefined);

  const selectedTicket = tickets?.find((t: any) => t.id === selectedTicketId);

  const handleReply = async () => {
    if (!replyContent.trim() || !selectedTicketId) return;
    await sendReply.mutateAsync({ ticketId: selectedTicketId, content: replyContent });
    setReplyContent("");
  };

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    await updateStatus.mutateAsync({ ticketId, status: newStatus });
  };

  if (isLoading) {
    return <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(statusLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Prioridade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {Object.entries(priorityLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {Object.entries(categoryLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {Object.entries(statusLabels).map(([key, label]) => {
          const count = tickets?.filter((t: any) => t.status === key).length || 0;
          return (
            <Card key={key} className="cursor-pointer" onClick={() => setFilterStatus(key)}>
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tickets list */}
      <div className="space-y-2">
        {tickets && tickets.length > 0 ? (
          tickets.map((ticket: any) => {
            const slaExpired = ticket.sla_deadline && new Date(ticket.sla_deadline) < new Date() && !["resolved", "closed"].includes(ticket.status);
            return (
              <Card
                key={ticket.id}
                className={`cursor-pointer hover:shadow-md transition-shadow ${slaExpired ? "border-destructive" : ""}`}
                onClick={() => setSelectedTicketId(ticket.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-mono text-muted-foreground">{ticket.ticket_number}</span>
                        <Badge className={statusColor[ticket.status] || ""} variant="secondary">
                          {statusLabels[ticket.status] || ticket.status}
                        </Badge>
                        <Badge className={priorityColor[ticket.priority] || ""} variant="secondary">
                          {priorityLabels[ticket.priority as TicketPriority] || ticket.priority}
                        </Badge>
                        {slaExpired && <Badge variant="destructive">SLA Expirado</Badge>}
                      </div>
                      <h3 className="font-medium truncate">{ticket.subject}</h3>
                      <div className="text-xs text-muted-foreground mt-1">
                        {ticket.profiles?.first_name} {ticket.profiles?.last_name} ({ticket.profiles?.email}) •{" "}
                        {categoryLabels[ticket.category as TicketCategory] || ticket.category} •{" "}
                        {new Date(ticket.created_at).toLocaleString("pt-BR")}
                      </div>
                    </div>
                    <MessageSquare className="h-5 w-5 text-muted-foreground shrink-0" />
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <p className="text-center text-muted-foreground py-8">Nenhum chamado encontrado.</p>
        )}
      </div>

      {/* Ticket detail modal */}
      <Dialog open={!!selectedTicketId} onOpenChange={(open) => !open && setSelectedTicketId(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="font-mono text-sm text-muted-foreground">{selectedTicket?.ticket_number}</span>
              {selectedTicket?.subject}
            </DialogTitle>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={statusColor[selectedTicket.status] || ""} variant="secondary">
                  {statusLabels[selectedTicket.status] || selectedTicket.status}
                </Badge>
                <Badge className={priorityColor[selectedTicket.priority] || ""} variant="secondary">
                  {priorityLabels[selectedTicket.priority as TicketPriority] || selectedTicket.priority}
                </Badge>
                {selectedTicket.sla_deadline && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    SLA: {new Date(selectedTicket.sla_deadline).toLocaleString("pt-BR")}
                  </span>
                )}
              </div>

              <div className="p-3 bg-muted rounded-md text-sm">
                <p className="text-xs text-muted-foreground mb-1">
                  {selectedTicket.profiles?.first_name} {selectedTicket.profiles?.last_name}
                </p>
                {selectedTicket.message}
              </div>

              {/* Status actions */}
              <div className="flex gap-2 flex-wrap">
                {Object.entries(statusLabels).map(([key, label]) => (
                  <Button
                    key={key}
                    size="sm"
                    variant={selectedTicket.status === key ? "default" : "outline"}
                    onClick={() => handleStatusChange(selectedTicket.id, key)}
                    disabled={updateStatus.isPending}
                  >
                    {label}
                  </Button>
                ))}
              </div>

              {/* Messages */}
              <ScrollArea className="h-[200px] border rounded-md p-3">
                <div className="space-y-2">
                  {messages?.map((msg: any) => (
                    <div key={msg.id} className={`flex ${msg.is_from_support ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-lg p-2 text-sm ${
                        msg.is_from_support
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        <span className="text-[10px] opacity-70 block mt-1">
                          {new Date(msg.created_at).toLocaleString("pt-BR")}
                        </span>
                      </div>
                    </div>
                  ))}
                  {(!messages || messages.length === 0) && (
                    <p className="text-center text-muted-foreground text-xs">Nenhuma mensagem</p>
                  )}
                </div>
              </ScrollArea>

              {/* Reply */}
              <div className="flex gap-2">
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Responder ao chamado..."
                  rows={2}
                />
                <Button onClick={handleReply} disabled={sendReply.isPending || !replyContent.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupportTab;
