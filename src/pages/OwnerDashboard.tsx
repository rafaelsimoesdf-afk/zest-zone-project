import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { VehicleBookingsChart } from "@/components/owner/VehicleBookingsChart";
import { CustomerReputationModal } from "@/components/reviews/CustomerReputationModal";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { useExistingReview } from "@/hooks/useReviews";
import { 
  useOwnerDashboardStats, 
  useOwnerVehicleStats, 
  useOwnerBookings,
  useHasVehicles,
  useUpdateOwnerBookingStatus,
  type OwnerBooking 
} from "@/hooks/useOwnerDashboard";
import { 
  Car, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Phone,
  Mail,
  MapPin,
  Eye,
  Star,
  Wallet
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmada",
  in_progress: "Em Andamento",
  completed: "Concluída",
  cancelled: "Cancelada",
  disputed: "Em Disputa",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  confirmed: "bg-green-500/10 text-green-600 border-green-500/20",
  in_progress: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  completed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  cancelled: "bg-red-500/10 text-red-600 border-red-500/20",
  disputed: "bg-orange-500/10 text-orange-600 border-orange-500/20",
};

const OwnerDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState<OwnerBooking | null>(null);
  const [reviewDialog, setReviewDialog] = useState<{ open: boolean; booking: OwnerBooking | null }>({
    open: false,
    booking: null,
  });
  const [actionDialog, setActionDialog] = useState<{ type: "reject" | "cancel" | null; booking: OwnerBooking | null }>({ type: null, booking: null });
  const [actionReason, setActionReason] = useState("");
  const [customerReputationModal, setCustomerReputationModal] = useState<{ open: boolean; customer: OwnerBooking["customer"] | null }>({ open: false, customer: null });

  const { data: hasVehicles, isLoading: checkingVehicles } = useHasVehicles();
  const { data: stats, isLoading: loadingStats } = useOwnerDashboardStats();
  const { data: vehicleStats, isLoading: loadingVehicleStats } = useOwnerVehicleStats();
  const { data: bookings, isLoading: loadingBookings } = useOwnerBookings(statusFilter);
  const updateStatus = useUpdateOwnerBookingStatus();

  const { data: selectedBookingReview } = useExistingReview(selectedBooking?.id ?? "", user?.id ?? "");

  if (authLoading || checkingVehicles) {
    return (
      <div className="bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!hasVehicles) {
    return <Navigate to="/my-vehicles" replace />;
  }

  const handleApprove = (booking: OwnerBooking) => {
    updateStatus.mutate({ bookingId: booking.id, status: "confirmed" });
  };

  const handleComplete = (booking: OwnerBooking) => {
    updateStatus.mutate({ bookingId: booking.id, status: "completed" });
  };

  const handleRejectOrCancel = () => {
    if (!actionDialog.booking || !actionDialog.type) return;
    
    const status = "cancelled";
    updateStatus.mutate({ 
      bookingId: actionDialog.booking.id, 
      status,
      reason: actionReason || undefined 
    });
    setActionDialog({ type: null, booking: null });
    setActionReason("");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="bg-background flex flex-col">
      <main className="flex-1 container mx-auto px-3 sm:px-4 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-4xl font-display font-bold text-primary mb-1 sm:mb-2">
                Dashboard do Proprietário
              </h1>
              <p className="text-xs sm:text-base text-muted-foreground">
                Gerencie suas reservas e acompanhe o desempenho dos seus veículos
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="w-fit">
              <Link to="/owner-withdrawals">
                <Wallet className="w-4 h-4 mr-2" />
                Saques
              </Link>
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4 mb-6 sm:mb-8">
            {loadingStats ? (
              Array(4).fill(0).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2 p-3 sm:p-6">
                    <Skeleton className="h-3 sm:h-4 w-16 sm:w-24" />
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6 pt-0">
                    <Skeleton className="h-6 sm:h-8 w-20 sm:w-32" />
                  </CardContent>
                </Card>
              ))
            ) : stats && (
              <>
                <Card className="border-green-500/20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-6">
                    <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground">
                      Receita Líquida
                    </CardTitle>
                    <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6 pt-0">
                    <div className="text-base sm:text-2xl font-bold text-green-600">{formatCurrency(stats.net_revenue)}</div>
                    <div className="flex items-center text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                      {stats.revenue_growth >= 0 ? (
                        <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-500 mr-0.5 sm:mr-1" />
                      ) : (
                        <TrendingDown className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-red-500 mr-0.5 sm:mr-1" />
                      )}
                      <span className={stats.revenue_growth >= 0 ? "text-green-500" : "text-red-500"}>
                        {stats.revenue_growth.toFixed(1)}%
                      </span>
                      <span className="ml-0.5 sm:ml-1 hidden sm:inline">vs mês anterior</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-red-500/20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-6">
                    <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground">
                      Taxa (15%)
                    </CardTitle>
                    <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6 pt-0">
                    <div className="text-base sm:text-2xl font-bold text-red-600">{formatCurrency(stats.platform_fees)}</div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 hidden sm:block">
                      Descontado das suas reservas
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-6">
                    <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground">
                      Pendentes
                    </CardTitle>
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6 pt-0">
                    <div className="text-base sm:text-2xl font-bold">{stats.pending_bookings}</div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 hidden sm:block">
                      Aguardando sua aprovação
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-6">
                    <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground">
                      Média/Reserva
                    </CardTitle>
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6 pt-0">
                    <div className="text-base sm:text-2xl font-bold">{formatCurrency(stats.average_booking_value)}</div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 hidden sm:block">
                      ~{stats.average_days_per_booking.toFixed(1)} dias por reserva
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Resumo Financeiro Detalhado - Hidden on mobile */}
          {stats && (
            <Card className="mb-6 sm:mb-8 hidden sm:block">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Resumo Financeiro</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Detalhamento das suas receitas e taxas</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
                  <div className="p-3 sm:p-4 bg-muted rounded-lg">
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1">Receita Bruta</p>
                    <p className="text-lg sm:text-xl font-semibold">{formatCurrency(stats.gross_revenue)}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Total pago pelos locatários</p>
                  </div>
                  <div className="p-3 sm:p-4 bg-red-500/10 rounded-lg">
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1">Taxa da Plataforma (15%)</p>
                    <p className="text-lg sm:text-xl font-semibold text-red-600">- {formatCurrency(stats.platform_fees)}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Comissão sobre o valor da diária</p>
                  </div>
                  <div className="p-3 sm:p-4 bg-green-500/10 rounded-lg">
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1">Você Recebe</p>
                    <p className="text-lg sm:text-xl font-semibold text-green-600">{formatCurrency(stats.net_revenue)}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Seu lucro líquido</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Vehicle Bookings Chart - Hidden on mobile */}
          <div className="hidden md:block mb-6">
            <VehicleBookingsChart 
              vehicleStats={vehicleStats || []} 
              isLoading={loadingVehicleStats} 
            />
          </div>

          <Tabs defaultValue="bookings" className="space-y-4 sm:space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
              <TabsTrigger value="bookings" className="text-xs sm:text-sm">Reservas</TabsTrigger>
              <TabsTrigger value="vehicles" className="text-xs sm:text-sm">Desempenho</TabsTrigger>
            </TabsList>

            {/* Bookings Tab */}
            <TabsContent value="bookings" className="space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                <h2 className="text-base sm:text-xl font-semibold">Gerenciar Reservas</h2>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px] h-9 sm:h-10 text-xs sm:text-sm">
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs sm:text-sm">Todas</SelectItem>
                    <SelectItem value="pending" className="text-xs sm:text-sm">Pendentes</SelectItem>
                    <SelectItem value="confirmed" className="text-xs sm:text-sm">Confirmadas</SelectItem>
                    <SelectItem value="completed" className="text-xs sm:text-sm">Concluídas</SelectItem>
                    <SelectItem value="cancelled" className="text-xs sm:text-sm">Canceladas</SelectItem>
                    <SelectItem value="in_progress" className="text-xs sm:text-sm">Em Andamento</SelectItem>
                    <SelectItem value="disputed" className="text-xs sm:text-sm">Em Disputa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {loadingBookings ? (
                <div className="space-y-3 sm:space-y-4">
                  {Array(3).fill(0).map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-4 sm:p-6">
                        <Skeleton className="h-20 sm:h-24 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : !bookings || bookings.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-10 sm:py-16 px-4">
                    <Calendar className="w-10 h-10 sm:w-16 sm:h-16 text-muted-foreground mb-3 sm:mb-4" />
                    <h3 className="text-base sm:text-xl font-semibold mb-2 text-center">Nenhuma reserva encontrada</h3>
                    <p className="text-muted-foreground text-center text-xs sm:text-base">
                      {statusFilter === "all" 
                        ? "Você ainda não recebeu nenhuma reserva."
                        : `Não há reservas com status "${statusLabels[statusFilter]}".`}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {bookings.map((booking) => {
                    const vehicle = booking.vehicles;
                    const customer = booking.customer;
                    const primaryImage = vehicle?.vehicle_images?.find(img => img.is_primary) || vehicle?.vehicle_images?.[0];

                    return (
                      <Card key={booking.id} className="overflow-hidden">
                        <CardContent className="p-0">
                          <div className="flex flex-col lg:flex-row">
                            {/* Vehicle Image */}
                            <div className="lg:w-48 h-28 sm:h-32 lg:h-auto bg-muted flex-shrink-0">
                              {primaryImage ? (
                                <img
                                  src={primaryImage.image_url}
                                  alt={`${vehicle?.brand} ${vehicle?.model}`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Car className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground" />
                                </div>
                              )}
                            </div>

                            {/* Booking Info */}
                            <div className="flex-1 p-3 sm:p-4 lg:p-6">
                              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 sm:gap-4">
                                <div className="space-y-2 sm:space-y-3">
                                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                    <h3 className="font-semibold text-sm sm:text-lg">
                                      {vehicle?.brand} {vehicle?.model} ({vehicle?.year})
                                    </h3>
                                    <Badge className={`${statusColors[booking.status]} text-[10px] sm:text-xs`}>
                                      {statusLabels[booking.status]}
                                    </Badge>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 text-xs sm:text-sm">
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                                      <span className="truncate">
                                        {format(new Date(booking.start_date), "dd/MM/yyyy", { locale: ptBR })} - {format(new Date(booking.end_date), "dd/MM/yyyy", { locale: ptBR })}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                      <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                                      <span>{booking.total_days} dias</span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="flex items-center gap-1.5 sm:gap-2 p-0 h-auto hover:bg-transparent text-xs sm:text-sm"
                                      onClick={() => setCustomerReputationModal({ open: true, customer })}
                                    >
                                      <User className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                                      <span className="hover:underline truncate max-w-[100px] sm:max-w-none">{customer?.first_name} {customer?.last_name}</span>
                                      <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-accent" />
                                    </Button>
                                    {customer?.phone_number && (
                                      <div className="hidden sm:flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-muted-foreground" />
                                        <span>{customer.phone_number}</span>
                                      </div>
                                    )}
                                  </div>

                                  {booking.pickup_location && (
                                    <div className="hidden sm:flex items-center gap-2 text-sm">
                                      <MapPin className="w-4 h-4 text-muted-foreground" />
                                      <span className="text-muted-foreground">{booking.pickup_location}</span>
                                    </div>
                                  )}
                                </div>

                                <div className="flex flex-col items-start sm:items-end gap-2 sm:gap-3">
                                  <div className="sm:text-right">
                                    <p className="text-[10px] sm:text-sm text-muted-foreground">Valor Total</p>
                                    <p className="text-lg sm:text-2xl font-bold text-primary">
                                      {formatCurrency(booking.total_price)}
                                    </p>
                                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                                      {formatCurrency(booking.daily_rate)}/dia
                                    </p>
                                  </div>

                                  <div className="flex flex-wrap gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setSelectedBooking(booking)}
                                      className="text-xs h-9 px-3"
                                    >
                                      <Eye className="w-4 h-4 mr-1" />
                                      Detalhes
                                    </Button>

                                    {booking.status === "completed" && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setReviewDialog({ open: true, booking })}
                                        className="text-xs h-9 px-3"
                                      >
                                        <Star className="w-4 h-4 mr-1" />
                                        Avaliar
                                      </Button>
                                    )}

                                    {booking.status === "pending" && (
                                      <>
                                        <Button
                                          size="sm"
                                          className="bg-green-600 hover:bg-green-700 text-xs h-9 px-3"
                                          onClick={() => handleApprove(booking)}
                                          disabled={updateStatus.isPending}
                                        >
                                          <CheckCircle className="w-4 h-4 mr-1" />
                                          Aprovar
                                        </Button>
                                        <Button
                                          variant="destructive"
                                          size="sm"
                                          onClick={() => setActionDialog({ type: "reject", booking })}
                                          disabled={updateStatus.isPending}
                                          className="text-xs h-9 px-3"
                                        >
                                          <XCircle className="w-4 h-4 mr-1" />
                                          Rejeitar
                                        </Button>
                                      </>
                                    )}

                                    {booking.status === "confirmed" && (
                                      <>
                                        <Button
                                          size="sm"
                                          className="bg-blue-600 hover:bg-blue-700 text-xs h-9 px-3"
                                          asChild
                                        >
                                          <Link to={`/booking/${booking.id}`}>
                                            <CheckCircle className="w-4 h-4 mr-1" />
                                            Finalizar
                                          </Link>
                                        </Button>
                                        <Button
                                          variant="destructive"
                                          size="sm"
                                          onClick={() => setActionDialog({ type: "cancel", booking })}
                                          disabled={updateStatus.isPending}
                                          className="text-xs h-9 px-3"
                                        >
                                          <XCircle className="w-4 h-4 mr-1" />
                                          Cancelar
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Vehicle Performance Tab */}
            <TabsContent value="vehicles" className="space-y-3 sm:space-y-4">
              <h2 className="text-base sm:text-xl font-semibold">Desempenho por Veículo</h2>

              {loadingVehicleStats ? (
                <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
                  {Array(2).fill(0).map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-4 sm:p-6">
                        <Skeleton className="h-36 sm:h-48 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : !vehicleStats || vehicleStats.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-10 sm:py-16">
                    <Car className="w-10 h-10 sm:w-16 sm:h-16 text-muted-foreground mb-3 sm:mb-4" />
                    <h3 className="text-base sm:text-xl font-semibold mb-2">Nenhum veículo cadastrado</h3>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
                  {vehicleStats.map((vehicle) => (
                    <Card key={vehicle.vehicle_id}>
                      <CardHeader className="pb-2 p-3 sm:p-6">
                        <div className="flex items-start gap-3 sm:gap-4">
                          {vehicle.image_url ? (
                            <img
                              src={vehicle.image_url}
                              alt={`${vehicle.brand} ${vehicle.model}`}
                              className="w-14 h-14 sm:w-20 sm:h-20 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-14 h-14 sm:w-20 sm:h-20 bg-muted rounded-lg flex items-center justify-center">
                              <Car className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <CardTitle className="text-sm sm:text-lg">
                              {vehicle.brand} {vehicle.model}
                            </CardTitle>
                            <CardDescription className="text-xs sm:text-sm">
                              {vehicle.year} • {vehicle.license_plate}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-3 sm:p-6 pt-0">
                        <div className="space-y-3 sm:space-y-4">
                          {/* Resumo Financeiro do Veículo */}
                          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 p-2 sm:p-3 bg-muted rounded-lg">
                            <div className="text-center">
                              <p className="text-[10px] sm:text-xs text-muted-foreground">Bruto</p>
                              <p className="font-semibold text-[10px] sm:text-sm">{formatCurrency(vehicle.gross_revenue)}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] sm:text-xs text-muted-foreground">Taxa</p>
                              <p className="font-semibold text-[10px] sm:text-sm text-red-600">-{formatCurrency(vehicle.platform_fee)}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] sm:text-xs text-muted-foreground">Líquido</p>
                              <p className="font-semibold text-[10px] sm:text-sm text-green-600">{formatCurrency(vehicle.net_revenue)}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            <div className="space-y-2 sm:space-y-3">
                              <div>
                                <p className="text-[10px] sm:text-sm text-muted-foreground">Você Recebe</p>
                                <p className="text-base sm:text-xl font-bold text-green-600">
                                  {formatCurrency(vehicle.net_revenue)}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] sm:text-sm text-muted-foreground">Média Diária</p>
                                <p className="font-semibold text-xs sm:text-base">
                                  {formatCurrency(vehicle.average_daily_rate)}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] sm:text-sm text-muted-foreground">Total Dias</p>
                                <p className="font-semibold text-xs sm:text-base">{vehicle.total_days_rented} dias</p>
                              </div>
                            </div>
                            <div className="space-y-2 sm:space-y-3">
                              <div>
                                <p className="text-[10px] sm:text-sm text-muted-foreground">Total Reservas</p>
                                <p className="font-semibold text-xs sm:text-base">{vehicle.total_bookings}</p>
                              </div>
                              <div className="flex items-center gap-1.5 sm:gap-2">
                                <div className="flex items-center gap-0.5 sm:gap-1">
                                  <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-yellow-500"></div>
                                  <span className="text-[10px] sm:text-sm">{vehicle.pending_bookings}</span>
                                </div>
                                <div className="flex items-center gap-0.5 sm:gap-1">
                                  <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500"></div>
                                  <span className="text-[10px] sm:text-sm">{vehicle.confirmed_bookings}</span>
                                </div>
                                <div className="flex items-center gap-0.5 sm:gap-1">
                                  <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-500"></div>
                                  <span className="text-[10px] sm:text-sm">{vehicle.cancelled_bookings}</span>
                                </div>
                              </div>
                              <div className="text-[10px] sm:text-xs text-muted-foreground">
                                P / C / X
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Booking Details Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedBooking && (
            <>
              <DialogHeader>
                <DialogTitle>Detalhes da Reserva</DialogTitle>
                <DialogDescription>
                  Reserva #{selectedBooking.id.slice(0, 8)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Vehicle Info */}
                <div className="flex items-start gap-4 p-4 bg-muted rounded-lg">
                  {selectedBooking.vehicles?.vehicle_images?.[0] && (
                    <img
                      src={selectedBooking.vehicles.vehicle_images[0].image_url}
                      alt="Veículo"
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold text-lg">
                      {selectedBooking.vehicles?.brand} {selectedBooking.vehicles?.model}
                    </h3>
                    <p className="text-muted-foreground">
                      {selectedBooking.vehicles?.year} • {selectedBooking.vehicles?.license_plate}
                    </p>
                    <Badge className={`mt-2 ${statusColors[selectedBooking.status]}`}>
                      {statusLabels[selectedBooking.status]}
                    </Badge>
                  </div>
                </div>

                {/* Customer Info */}
                <div>
                  <h4 className="font-semibold mb-3">Informações do Cliente</h4>
                  <div className="grid gap-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedBooking.customer?.first_name} {selectedBooking.customer?.last_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedBooking.customer?.email}</span>
                    </div>
                    {selectedBooking.customer?.phone_number && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{selectedBooking.customer.phone_number}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Booking Details */}
                <div>
                  <h4 className="font-semibold mb-3">Detalhes da Reserva</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Data de Retirada</p>
                      <p className="font-medium">
                        {format(new Date(selectedBooking.start_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Data de Devolução</p>
                      <p className="font-medium">
                        {format(new Date(selectedBooking.end_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Duração</p>
                      <p className="font-medium">{selectedBooking.total_days} dias</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Criada em</p>
                      <p className="font-medium">
                        {format(new Date(selectedBooking.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Location */}
                {(selectedBooking.pickup_location || selectedBooking.return_location) && (
                  <div>
                    <h4 className="font-semibold mb-3">Local</h4>
                    <div className="grid gap-2">
                      {selectedBooking.pickup_location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span>Retirada: {selectedBooking.pickup_location}</span>
                        </div>
                      )}
                      {selectedBooking.return_location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span>Devolução: {selectedBooking.return_location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedBooking.notes && (
                  <div>
                    <h4 className="font-semibold mb-3">Observações</h4>
                    <p className="text-muted-foreground bg-muted p-3 rounded-lg">
                      {selectedBooking.notes}
                    </p>
                  </div>
                )}

                {/* Payment Summary */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Resumo Financeiro</h4>
                  {(() => {
                    const dailySubtotal = selectedBooking.daily_rate * selectedBooking.total_days;
                    const extraHoursCharge = Number((selectedBooking as any).extra_hours_charge) || 0;
                    const extraHours = Number((selectedBooking as any).extra_hours) || 0;
                    const rentalAmount = dailySubtotal + extraHoursCharge;
                    const platformFee = rentalAmount * 0.15;
                    const ownerReceives = rentalAmount - platformFee;
                    
                    return (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Diária</span>
                          <span>{formatCurrency(selectedBooking.daily_rate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Dias</span>
                          <span>× {selectedBooking.total_days}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Subtotal diárias</span>
                          <span>{formatCurrency(dailySubtotal)}</span>
                        </div>
                        {extraHoursCharge > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Horas extras ({extraHours.toFixed(1)}h)</span>
                            <span>{formatCurrency(extraHoursCharge)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-medium border-t pt-2">
                          <span className="text-muted-foreground">Total do aluguel</span>
                          <span>{formatCurrency(rentalAmount)}</span>
                        </div>
                        <div className="flex justify-between text-red-600">
                          <span>Taxa da Plataforma (15%)</span>
                          <span>- {formatCurrency(platformFee)}</span>
                        </div>
                        <div className="flex justify-between font-semibold text-lg border-t pt-2 text-green-600">
                          <span>Você Recebe</span>
                          <span>{formatCurrency(ownerReceives)}</span>
                        </div>
                       </div>
                     );
                   })()}
                 </div>

                {selectedBooking.status === "completed" && selectedBooking.customer && (
                  <div className="border-t pt-4">
                    <Button
                      className="w-full"
                      variant={selectedBookingReview ? "outline" : "default"}
                      onClick={() => setReviewDialog({ open: true, booking: selectedBooking })}
                    >
                      <Star className={
                        selectedBookingReview
                          ? "w-4 h-4 mr-2 fill-accent text-accent"
                          : "w-4 h-4 mr-2"
                      } />
                      {selectedBookingReview ? "Editar avaliação do locatário" : "Avaliar locatário"}
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject/Cancel Dialog */}
      <Dialog open={!!actionDialog.type} onOpenChange={() => setActionDialog({ type: null, booking: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === "reject" ? "Rejeitar Reserva" : "Cancelar Reserva"}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.type === "reject" 
                ? "Informe o motivo da rejeição para o cliente."
                : "Informe o motivo do cancelamento para o cliente."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Motivo (obrigatório)</Label>
              <Textarea
                id="reason"
                placeholder={
                  actionDialog.type === "reject"
                    ? "Ex: Veículo indisponível para as datas solicitadas..."
                    : "Ex: Manutenção inesperada do veículo..."
                }
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                className="mt-2"
                rows={4}
              />
            </div>

            {actionDialog.booking && (
              <div className="p-3 bg-muted rounded-lg text-sm">
                <p className="font-medium">
                  {actionDialog.booking.vehicles?.brand} {actionDialog.booking.vehicles?.model}
                </p>
                <p className="text-muted-foreground">
                  {format(new Date(actionDialog.booking.start_date), "dd/MM/yyyy")} - {format(new Date(actionDialog.booking.end_date), "dd/MM/yyyy")}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ type: null, booking: null })}>
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectOrCancel}
              disabled={!actionReason.trim() || updateStatus.isPending}
            >
              {actionDialog.type === "reject" ? "Rejeitar" : "Cancelar"} Reserva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Modal (owner -> customer) */}
      {reviewDialog.booking && reviewDialog.booking.customer && (
        <ReviewForm
          open={reviewDialog.open}
          onOpenChange={(open) =>
            setReviewDialog(open ? reviewDialog : { open: false, booking: null })
          }
          bookingId={reviewDialog.booking.id}
          reviewerId={user?.id ?? ""}
          reviewedId={reviewDialog.booking.customer_id}
          reviewedName={`${reviewDialog.booking.customer.first_name} ${reviewDialog.booking.customer.last_name}`}
        />
      )}

      {/* Customer Reputation Modal */}
      {customerReputationModal.customer && (
        <CustomerReputationModal
          open={customerReputationModal.open}
          onOpenChange={(open) => setCustomerReputationModal({ ...customerReputationModal, open })}
          customerId={customerReputationModal.customer.id}
          customerName={`${customerReputationModal.customer.first_name} ${customerReputationModal.customer.last_name}`}
          customerImage={customerReputationModal.customer.profile_image}
        />
      )}
    </div>
  );
};

export default OwnerDashboard;
