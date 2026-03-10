import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAdminStats, usePendingVehicles, useAllVehicles, useAllUsers, useAllBookings, useUpdateVehicleStatus, useUpdateUserStatus, useUpdateUserVerificationStatus, useDeleteUser, useUpdateBookingStatus, useDeleteBooking } from "@/hooks/useAdmin";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDeleteVehicle } from "@/hooks/useVehicles";
import CollaboratorsTab from "@/components/admin/CollaboratorsTab";
import UserVerificationTab from "@/components/admin/UserVerificationTab";
import VehicleVerificationTab from "@/components/admin/VehicleVerificationTab";
import EditVehicleModal from "@/components/admin/EditVehicleModal";
import { CheckCircle, XCircle, Users, Car, Calendar, Clock, Trash2, Edit, UserCheck, Shield, FileCheck, FileText, ExternalLink, Banknote, Headphones } from "lucide-react";
import WithdrawalsTab from "@/components/admin/WithdrawalsTab";
import SupportTab from "@/components/admin/SupportTab";
import { toast } from "sonner";
import { format } from "date-fns";
import { formatCurrencyBRL } from "@/lib/validators";

const Admin = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  const { data: stats } = useAdminStats();
  const { data: pendingVehicles } = usePendingVehicles();
  const { data: allVehicles } = useAllVehicles();
  const { data: allUsers } = useAllUsers();
  const { data: allBookings } = useAllBookings();
  
  const updateVehicleStatus = useUpdateVehicleStatus();
  const updateUserStatus = useUpdateUserStatus();
  const updateUserVerificationStatus = useUpdateUserVerificationStatus();
  const deleteVehicle = useDeleteVehicle();
  const deleteUser = useDeleteUser();
  const updateBookingStatus = useUpdateBookingStatus();
  const deleteBooking = useDeleteBooking();

  const [editVehicleModalOpen, setEditVehicleModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);

  const handleEditVehicle = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setEditVehicleModalOpen(true);
  };

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!loading && !user) {
        navigate("/auth");
        return;
      }

      if (user) {
        const { data, error } = await supabase.rpc("has_role", {
          _user_id: user.id,
          _role: "admin",
        });

        if (error || !data) {
          toast.error("Acesso negado. Apenas administradores podem acessar esta página.");
          navigate("/");
        }
      }
    };

    checkAdminRole();
  }, [user, loading, navigate]);

  const handleApproveVehicle = (vehicleId: string) => {
    updateVehicleStatus.mutate({ vehicleId, status: "approved" });
  };

  const handleRejectVehicle = (vehicleId: string) => {
    updateVehicleStatus.mutate({ vehicleId, status: "rejected" });
  };

  const handleDeleteVehicle = (vehicleId: string) => {
    deleteVehicle.mutate(vehicleId);
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      pending: "bg-yellow-500",
      approved: "bg-green-500",
      rejected: "bg-red-500",
      suspended: "bg-orange-500",
      verified: "bg-blue-500",
      confirmed: "bg-green-500",
      in_progress: "bg-blue-500",
      completed: "bg-gray-500",
      cancelled: "bg-red-500",
    };

    const statusLabels: Record<string, string> = {
      pending: "Pendente",
      approved: "Aprovado",
      rejected: "Rejeitado",
      suspended: "Suspenso",
      verified: "Verificado",
      confirmed: "Confirmado",
      in_progress: "Em Andamento",
      completed: "Concluído",
      cancelled: "Cancelado",
    };

    return (
      <Badge className={statusColors[status] || "bg-gray-500"}>
        {statusLabels[status] || status}
      </Badge>
    );
  };

  const getVerificationStatusBadge = (status: string | null) => {
    const statusColors: Record<string, string> = {
      pending: "bg-yellow-500",
      approved: "bg-green-500",
      rejected: "bg-red-500",
    };

    const statusLabels: Record<string, string> = {
      pending: "Pendente",
      approved: "Aprovado",
      rejected: "Rejeitado",
    };

    if (!status) {
      return <Badge variant="outline">Não enviado</Badge>;
    }

    return (
      <Badge className={statusColors[status] || "bg-gray-500"}>
        {statusLabels[status] || status}
      </Badge>
    );
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 pt-24 pb-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            <h1 className="text-2xl sm:text-4xl font-bold">Painel Administrativo</h1>
          </div>
          <p className="text-xs sm:text-base text-muted-foreground">Gerencie veículos, usuários, verificações e reservas da plataforma</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Veículos</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalVehicles || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Veículos Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats?.pendingVehicles || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            </CardContent>
          </Card>

          <Card className="border-yellow-500/50 bg-yellow-500/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verificações Pendentes</CardTitle>
              <UserCheck className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats?.pendingVerifications || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Reservas</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalBookings || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reservas Ativas</CardTitle>
              <Calendar className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats?.activeBookings || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different sections */}
        <Tabs defaultValue="verifications" className="w-full">
          <TabsList className="flex flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="verifications" className="flex items-center gap-1 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2">
              <FileCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Verificações</span>
              <span className="sm:hidden">Verific.</span>
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center gap-1 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2">
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Veículos Pendentes</span>
              <span className="sm:hidden">Pend.</span>
            </TabsTrigger>
            <TabsTrigger value="vehicles" className="flex items-center gap-1 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2">
              <Car className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Veículos</span>
              <span className="sm:hidden">Veíc.</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-1 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2">
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Usuários</span>
              <span className="sm:hidden">Usuár.</span>
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex items-center gap-1 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2">
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Reservas</span>
              <span className="sm:hidden">Reserv.</span>
            </TabsTrigger>
            <TabsTrigger value="withdrawals" className="flex items-center gap-1 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2">
              <Banknote className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Saques</span>
              <span className="sm:hidden">Saques</span>
            </TabsTrigger>
            <TabsTrigger value="collaborators" className="flex items-center gap-1 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2">
              <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Colaboradores</span>
              <span className="sm:hidden">Colab.</span>
            </TabsTrigger>
            <TabsTrigger value="support" className="flex items-center gap-1 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2">
              <Headphones className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Suporte</span>
              <span className="sm:hidden">Suporte</span>
            </TabsTrigger>
          </TabsList>

          {/* User Verifications */}
          <TabsContent value="verifications">
            <UserVerificationTab />
          </TabsContent>

          {/* Pending Vehicles */}
          <TabsContent value="pending">
            <VehicleVerificationTab />
          </TabsContent>

          {/* All Vehicles */}
          <TabsContent value="vehicles">
            <Card>
              <CardHeader>
                <CardTitle>Todos os Veículos</CardTitle>
                <CardDescription>Visualize e gerencie todos os veículos da plataforma</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Veículo</TableHead>
                      <TableHead>Proprietário</TableHead>
                      <TableHead>Placa</TableHead>
                      <TableHead>Documento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Preço/Dia</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allVehicles?.map((vehicle: any) => (
                      <TableRow key={vehicle.id}>
                        <TableCell className="font-medium">
                          {vehicle.brand} {vehicle.model} ({vehicle.year})
                        </TableCell>
                        <TableCell>
                          {vehicle.profiles?.first_name} {vehicle.profiles?.last_name}
                        </TableCell>
                        <TableCell>{vehicle.license_plate}</TableCell>
                        <TableCell>
                          {vehicle.document_url ? (
                            <a 
                              href={vehicle.document_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-primary hover:underline"
                            >
                              <FileText className="h-4 w-4" />
                              Ver
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(vehicle.status)}</TableCell>
                        <TableCell>{formatCurrencyBRL(vehicle.daily_price)}</TableCell>
                        <TableCell>{format(new Date(vehicle.created_at), "dd/MM/yyyy")}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button variant="outline" size="sm" onClick={() => handleEditVehicle(vehicle)}>
                              <Edit className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" disabled={deleteVehicle.isPending}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir este veículo? Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteVehicle(vehicle.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Usuários</CardTitle>
                <CardDescription>Gerencie todos os usuários da plataforma - altere status, verificação ou exclua cadastros</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Verificação</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Data de Cadastro</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allUsers?.map((userItem) => (
                      <TableRow key={userItem.id}>
                        <TableCell className="font-medium">
                          {userItem.first_name} {userItem.last_name}
                        </TableCell>
                        <TableCell>{userItem.email}</TableCell>
                        <TableCell>
                          <Select
                            value={userItem.status}
                            onValueChange={(value) => 
                              updateUserStatus.mutate({ userId: userItem.id, status: value })
                            }
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">
                                <Badge className="bg-yellow-500">Pendente</Badge>
                              </SelectItem>
                              <SelectItem value="verified">
                                <Badge className="bg-blue-500">Verificado</Badge>
                              </SelectItem>
                              <SelectItem value="suspended">
                                <Badge className="bg-orange-500">Suspenso</Badge>
                              </SelectItem>
                              <SelectItem value="banned">
                                <Badge className="bg-red-500">Banido</Badge>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={userItem.verification_status || "pending"}
                            onValueChange={(value) => 
                              updateUserVerificationStatus.mutate({ 
                                userId: userItem.id, 
                                verificationStatus: value as 'approved' | 'rejected' | 'pending' 
                              })
                            }
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">
                                <Badge className="bg-yellow-500">Pendente</Badge>
                              </SelectItem>
                              <SelectItem value="approved">
                                <Badge className="bg-green-500">Aprovado</Badge>
                              </SelectItem>
                              <SelectItem value="rejected">
                                <Badge className="bg-red-500">Rejeitado</Badge>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>{userItem.cpf || "N/A"}</TableCell>
                        <TableCell>{userItem.phone_number || "N/A"}</TableCell>
                        <TableCell>{format(new Date(userItem.created_at), "dd/MM/yyyy")}</TableCell>
                        <TableCell className="text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-destructive hover:text-destructive"
                                disabled={deleteUser.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar exclusão de usuário</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir o usuário <strong>{userItem.first_name} {userItem.last_name}</strong>? 
                                  <br /><br />
                                  Esta ação irá remover todos os dados do usuário, incluindo documentos, endereços e verificações. 
                                  O usuário poderá se cadastrar novamente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deleteUser.mutate(userItem.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Excluir Usuário
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bookings */}
          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <CardTitle>Reservas</CardTitle>
                <CardDescription>Gerencie todas as reservas da plataforma - altere status, aprove ou exclua</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Veículo</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Data Início</TableHead>
                      <TableHead>Data Fim</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Valor Total</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allBookings?.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">
                          {booking.vehicles?.brand} {booking.vehicles?.model}
                          <div className="text-xs text-muted-foreground">{booking.vehicles?.license_plate}</div>
                        </TableCell>
                        <TableCell>
                          {booking.profiles?.first_name} {booking.profiles?.last_name}
                          <div className="text-xs text-muted-foreground">{booking.profiles?.email}</div>
                        </TableCell>
                        <TableCell>{format(new Date(booking.start_date), "dd/MM/yyyy")}</TableCell>
                        <TableCell>{format(new Date(booking.end_date), "dd/MM/yyyy")}</TableCell>
                        <TableCell>
                          <Select
                            value={booking.status}
                            onValueChange={(value) => updateBookingStatus.mutate({ bookingId: booking.id, status: value })}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pendente</SelectItem>
                              <SelectItem value="confirmed">Confirmada</SelectItem>
                              <SelectItem value="in_progress">Em Andamento</SelectItem>
                              <SelectItem value="completed">Concluída</SelectItem>
                              <SelectItem value="cancelled">Cancelada</SelectItem>
                              <SelectItem value="disputed">Em Disputa</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>R$ {booking.total_price}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            {booking.status === "pending" && (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => updateBookingStatus.mutate({ bookingId: booking.id, status: "confirmed" })}
                                disabled={updateBookingStatus.isPending}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Aprovar
                              </Button>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" disabled={deleteBooking.isPending}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir esta reserva? Esta ação não pode ser desfeita e também excluirá pagamentos e avaliações relacionadas.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => deleteBooking.mutate(booking.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!allBookings?.length && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          Nenhuma reserva encontrada
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Withdrawals */}
          <TabsContent value="withdrawals">
            <WithdrawalsTab />
          </TabsContent>

          {/* Collaborators */}
          <TabsContent value="collaborators">
            <CollaboratorsTab />
          </TabsContent>
        </Tabs>
      </main>

      <Footer />

      <EditVehicleModal
        vehicle={selectedVehicle}
        open={editVehicleModalOpen}
        onOpenChange={setEditVehicleModalOpen}
        isAdmin={true}
      />
    </div>
  );
};

export default Admin;