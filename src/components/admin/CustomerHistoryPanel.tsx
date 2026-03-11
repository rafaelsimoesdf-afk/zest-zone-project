import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Car, CreditCard, MessageSquare, Star, User } from "lucide-react";

interface CustomerHistoryPanelProps {
  userId: string;
}

const useCustomerHistory = (userId: string) => {
  return useQuery({
    queryKey: ["customer-history", userId],
    enabled: !!userId,
    queryFn: async () => {
      const [profileRes, bookingsRes, ticketsRes, reviewsRes] = await Promise.all([
        supabase.from("profiles").select("first_name, last_name, email, phone_number, created_at, verification_status").eq("id", userId).single(),
        supabase.from("bookings").select("id, status, start_date, end_date, total_price, daily_rate, total_days, vehicle_id, vehicles!bookings_vehicle_id_fkey(brand, model)").or(`customer_id.eq.${userId},owner_id.eq.${userId}`).order("created_at", { ascending: false }).limit(10),
        supabase.from("support_tickets").select("id, ticket_number, subject, status, priority, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(10),
        supabase.from("reviews").select("id, rating, comment, created_at, reviewer_id").eq("reviewed_id", userId).order("created_at", { ascending: false }).limit(5),
      ]);

      return {
        profile: profileRes.data,
        bookings: (bookingsRes.data || []) as any[],
        tickets: (ticketsRes.data || []) as any[],
        reviews: (reviewsRes.data || []) as any[],
      };
    },
  });
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  in_progress: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  cancelled: "bg-destructive/10 text-destructive",
};

const formatCurrency = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const CustomerHistoryPanel = ({ userId }: CustomerHistoryPanelProps) => {
  const { data, isLoading } = useCustomerHistory(userId);

  if (isLoading) return <Skeleton className="h-60 w-full" />;
  if (!data?.profile) return <p className="text-sm text-muted-foreground">Dados não encontrados.</p>;

  const avgRating = data.reviews.length > 0
    ? (data.reviews.reduce((s: number, r: any) => s + r.rating, 0) / data.reviews.length).toFixed(1)
    : null;

  return (
    <div className="space-y-3">
      {/* Profile Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium">{data.profile.first_name} {data.profile.last_name}</p>
              <p className="text-xs text-muted-foreground">{data.profile.email}</p>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              {data.profile.verification_status === "approved" ? (
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Verificado</Badge>
              ) : (
                <Badge variant="secondary">Não verificado</Badge>
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3 text-center">
            <div className="bg-muted rounded-md p-2">
              <p className="text-lg font-bold">{data.bookings.length}</p>
              <p className="text-[10px] text-muted-foreground">Reservas</p>
            </div>
            <div className="bg-muted rounded-md p-2">
              <p className="text-lg font-bold">{data.tickets.length}</p>
              <p className="text-[10px] text-muted-foreground">Chamados</p>
            </div>
            <div className="bg-muted rounded-md p-2">
              <p className="text-lg font-bold">{avgRating ? `${avgRating}★` : "—"}</p>
              <p className="text-[10px] text-muted-foreground">Avaliação</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bookings */}
      {data.bookings.length > 0 && (
        <Card>
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <Car className="h-3.5 w-3.5" /> Reservas recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <ScrollArea className="max-h-[150px]">
              <div className="space-y-1.5">
                {data.bookings.map((b: any) => (
                  <div key={b.id} className="flex items-center justify-between text-xs py-1 border-b last:border-0">
                    <div>
                      <span className="font-medium">{b.vehicles?.brand} {b.vehicles?.model}</span>
                      <span className="text-muted-foreground ml-2">
                        {new Date(b.start_date).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>{formatCurrency(b.total_price)}</span>
                      <Badge className={`text-[10px] px-1.5 py-0 ${statusColors[b.status] || ""}`} variant="secondary">
                        {b.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Past Tickets */}
      {data.tickets.length > 0 && (
        <Card>
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" /> Chamados anteriores
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <ScrollArea className="max-h-[120px]">
              <div className="space-y-1.5">
                {data.tickets.map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between text-xs py-1 border-b last:border-0">
                    <div>
                      <span className="font-mono text-muted-foreground mr-1">{t.ticket_number}</span>
                      <span className="font-medium">{t.subject}</span>
                    </div>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{t.status}</Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Reviews */}
      {data.reviews.length > 0 && (
        <Card>
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5" /> Avaliações recebidas
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="space-y-1.5">
              {data.reviews.map((r: any) => (
                <div key={r.id} className="text-xs py-1 border-b last:border-0">
                  <div className="flex items-center gap-1">
                    {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                    <span className="text-muted-foreground ml-1">{new Date(r.created_at).toLocaleDateString("pt-BR")}</span>
                  </div>
                  {r.comment && <p className="text-muted-foreground mt-0.5 truncate">{r.comment}</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CustomerHistoryPanel;
