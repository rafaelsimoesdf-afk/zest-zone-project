import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Bell, 
  CheckCircle, 
  Car, 
  MessageSquare, 
  CreditCard, 
  Calendar, 
  ShieldCheck, 
  AlertCircle,
  Clock,
  CheckCheck,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { 
  useNotifications, 
  useMarkNotificationAsRead, 
  useMarkAllNotificationsAsRead 
} from "@/hooks/useNotifications";
import type { Database } from "@/integrations/supabase/types";

type NotificationType = Database["public"]["Enums"]["notification_type"];

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case "booking":
      return <Calendar className="h-5 w-5" />;
    case "payment":
      return <CreditCard className="h-5 w-5" />;
    case "reminder":
      return <Clock className="h-5 w-5" />;
    case "promotion":
      return <Bell className="h-5 w-5" />;
    case "system":
      return <ShieldCheck className="h-5 w-5" />;
    case "support":
      return <MessageSquare className="h-5 w-5" />;
    default:
      return <Bell className="h-5 w-5" />;
  }
};

const getNotificationColor = (type: NotificationType) => {
  switch (type) {
    case "booking":
      return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    case "payment":
      return "bg-green-500/10 text-green-500 border-green-500/20";
    case "reminder":
      return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    case "promotion":
      return "bg-purple-500/10 text-purple-500 border-purple-500/20";
    case "system":
      return "bg-orange-500/10 text-orange-500 border-orange-500/20";
    case "support":
      return "bg-cyan-500/10 text-cyan-500 border-cyan-500/20";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const getNotificationTypeLabel = (type: NotificationType) => {
  switch (type) {
    case "booking":
      return "Reserva";
    case "payment":
      return "Pagamento";
    case "reminder":
      return "Lembrete";
    case "promotion":
      return "Promoção";
    case "system":
      return "Sistema";
    case "support":
      return "Suporte";
    default:
      return "Notificação";
  }
};

const Notifications = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: notifications, isLoading } = useNotifications();
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="bg-background">
        <div className="container mx-auto px-4 pt-24 pb-16">
          <Skeleton className="h-10 w-48 mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  return (
    <div className="bg-background">
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
                <Bell className="h-8 w-8 text-primary" />
                Notificações
              </h1>
              <p className="text-muted-foreground mt-1">
                {unreadCount > 0 
                  ? `Você tem ${unreadCount} notificação${unreadCount > 1 ? 'ões' : ''} não lida${unreadCount > 1 ? 's' : ''}`
                  : "Todas as notificações foram lidas"
                }
              </p>
            </div>
            {unreadCount > 0 && (
              <Button 
                variant="outline" 
                onClick={() => markAllAsRead.mutate()}
                disabled={markAllAsRead.isPending}
                className="flex items-center gap-2"
              >
                <CheckCheck className="h-4 w-4" />
                Marcar todas como lidas
              </Button>
            )}
          </div>

          {/* Notifications List */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-lg" />
              ))}
            </div>
          ) : notifications && notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <Card 
                  key={notification.id}
                  className={`transition-all hover:shadow-md ${
                    !notification.read 
                      ? "border-primary/30 bg-primary/5" 
                      : "opacity-80 hover:opacity-100"
                  } ${notification.action_url ? "cursor-pointer" : ""}`}
                  onClick={() => {
                    if (notification.action_url) {
                      if (!notification.read) {
                        markAsRead.mutate(notification.id);
                      }
                      navigate(notification.action_url);
                    }
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`p-3 rounded-full border shrink-0 ${getNotificationColor(notification.notification_type)}`}>
                        {getNotificationIcon(notification.notification_type)}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-foreground">
                                {notification.title}
                              </h3>
                              {!notification.read && (
                                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                              )}
                            </div>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`shrink-0 text-xs ${getNotificationColor(notification.notification_type)}`}
                          >
                            {getNotificationTypeLabel(notification.notification_type)}
                          </Badge>
                        </div>
                        
                        {/* Full message - always visible */}
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {notification.message}
                        </p>

                        {/* Action hint */}
                        {notification.action_url && (
                          <p className="text-xs text-primary mt-2 flex items-center gap-1">
                            <ExternalLink className="h-3 w-3" />
                            Clique para abrir
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-border/50">
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(notification.created_at), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                          </span>
                          <div className="flex items-center gap-2">
                            {notification.read ? (
                              <span className="flex items-center gap-1 text-xs text-green-600">
                                <CheckCircle className="h-3 w-3" />
                                Lida
                              </span>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead.mutate(notification.id);
                                }}
                                disabled={markAsRead.isPending}
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Marcar como lida
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <Bell className="h-8 w-8 text-muted-foreground" />
                </div>
                <CardTitle className="text-lg mb-2">Nenhuma notificação</CardTitle>
                <CardDescription>
                  Você será notificado sobre reservas, mensagens, validações e mais.
                </CardDescription>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Notifications;
