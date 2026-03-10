import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateTicket, categoryLabels, priorityLabels, type TicketCategory, type TicketPriority, slaLabels } from "@/hooks/useSupportTickets";
// Bookings are optional for ticket creation
import { AlertCircle, Clock } from "lucide-react";

interface CreateTicketFormProps {
  onSuccess?: () => void;
}

const CreateTicketForm = ({ onSuccess }: CreateTicketFormProps) => {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState<TicketCategory>("other");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [bookingId, setBookingId] = useState<string>("");
  const createTicket = useCreateTicket();
  const { data: bookings } = useBookings();

  const showBookingSelect = ["booking", "vehicle_issue", "owner_issue", "renter_issue", "accident"].includes(category);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    await createTicket.mutateAsync({
      subject,
      message,
      category,
      priority,
      booking_id: bookingId || undefined,
    });

    setSubject("");
    setMessage("");
    setCategory("other");
    setPriority("medium");
    setBookingId("");
    onSuccess?.();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-primary" />
          Abrir Novo Chamado
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria do problema</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as TicketCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(categoryLabels) as [TicketCategory, string][]).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Urgência</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TicketPriority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(priorityLabels) as [TicketPriority, string][]).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                Tempo estimado de resposta: {slaLabels[priority]}
              </div>
            </div>
          </div>

          {showBookingSelect && bookings && bookings.length > 0 && (
            <div className="space-y-2">
              <Label>Reserva relacionada (opcional)</Label>
              <Select value={bookingId} onValueChange={setBookingId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar reserva" />
                </SelectTrigger>
                <SelectContent>
                  {bookings.map((b: any) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.vehicle?.brand} {b.vehicle?.model} — {new Date(b.start_date).toLocaleDateString("pt-BR")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Título do problema</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Descreva brevemente o problema"
              required
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label>Descrição detalhada</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Explique detalhadamente o que aconteceu..."
              required
              rows={5}
              maxLength={2000}
            />
          </div>

          <Button type="submit" className="w-full" disabled={createTicket.isPending}>
            {createTicket.isPending ? "Enviando..." : "Abrir Chamado"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateTicketForm;
