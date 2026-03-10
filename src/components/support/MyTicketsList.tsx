import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSupportTickets, categoryLabels, priorityLabels, statusLabels, type TicketPriority } from "@/hooks/useSupportTickets";
import { Clock, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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

const MyTicketsList = () => {
  const { data: tickets, isLoading } = useSupportTickets();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (!tickets || tickets.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Você ainda não possui chamados.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tickets.map((ticket) => (
        <Card
          key={ticket.id}
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate(`/support/ticket/${ticket.id}`)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-mono text-muted-foreground">
                    {ticket.ticket_number}
                  </span>
                  <Badge className={statusColor[ticket.status] || ""} variant="secondary">
                    {statusLabels[ticket.status] || ticket.status}
                  </Badge>
                  <Badge className={priorityColor[ticket.priority] || ""} variant="secondary">
                    {priorityLabels[ticket.priority as TicketPriority] || ticket.priority}
                  </Badge>
                </div>
                <h3 className="font-medium truncate">{ticket.subject}</h3>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <span>{categoryLabels[ticket.category] || ticket.category}</span>
                  <span>•</span>
                  <Clock className="h-3 w-3" />
                  <span>{new Date(ticket.created_at).toLocaleDateString("pt-BR")}</span>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 mt-2" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MyTicketsList;
