import { useEffect } from "react";
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
import { useAdminStats, usePendingVehicles, useAllVehicles, useAllUsers, useAllBookings, useUpdateVehicleStatus, useUpdateUserStatus, useUpdateUserVerificationStatus } from "@/hooks/useAdmin";
import { useDeleteVehicle } from "@/hooks/useVehicles";
import CollaboratorsTab from "@/components/admin/CollaboratorsTab";
import UserVerificationTab from "@/components/admin/UserVerificationTab";
import { CheckCircle, XCircle, Users, Car, Calendar, Clock, Trash2, Edit, UserCheck, Shield, FileCheck } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

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
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Painel Administrativo</h1>
          </div>
          <p className="text-muted-foreground">Gerencie veículos, usuários, verificações e reservas da plataforma</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
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
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="verifications" className="flex items-center gap-1">
              <FileCheck className="h-4 w-4" />
              Verificações
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Veículos Pendentes
            </TabsTrigger>
            <TabsTrigger value="vehicles" className="flex items-center gap-1">
              <Car className="h-4 w-4" />
              Veículos
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Reservas
            </TabsTrigger>
            <TabsTrigger value="collaborators" className="flex items-center gap-1">
              <Shield className="h-4 w-4" />
              Colaboradores
            </TabsTrigger>
          </TabsList>

          {/* User Verifications */}
          <TabsContent value="verifications">
            <UserVerificationTab />
          </TabsContent>

          {/* Pending Vehicles */}
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Veículos Aguardando Aprovação</CardTitle>
                <CardDescription>Aprove ou rejeite cadastros de veículos</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Veículo</TableHead>
                      <TableHead>Proprietário</TableHead>
                      <TableHead>Placa</TableHead>
                      <TableHead>Preço/Dia</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingVehicles?.map((vehicle) => (
                      <TableRow key={vehicle.id}>
                        <TableCell className="font-medium">
                          {vehicle.brand} {vehicle.model} ({vehicle.year})
                        </TableCell>
                        <TableCell>
                          {vehicle.profiles?.first_name} {vehicle.profiles?.last_name}
                          <div className="text-xs text-muted-foreground">{vehicle.profiles?.email}</div>
                        </TableCell>
                        <TableCell>{vehicle.license_plate}</TableCell>
                        <TableCell>R$ {vehicle.daily_price}</TableCell>
                        <TableCell>{format(new Date(vehicle.created_at), "dd/MM/yyyy")}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleApproveVehicle(vehicle.id)}
                              disabled={updateVehicleStatus.isPending}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Aprovar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRejectVehicle(vehicle.id)}
                              disabled={updateVehicleStatus.isPending}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Rejeitar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!pendingVehicles?.length && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          Nenhum veículo pendente
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
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
                      <TableHead>Status</TableHead>
                      <TableHead>Preço/Dia</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allVehicles?.map((vehicle) => (
                      <TableRow key={vehicle.id}>
                        <TableCell className="font-medium">
                          {vehicle.brand} {vehicle.model} ({vehicle.year})
                        </TableCell>
                        <TableCell>
                          {vehicle.profiles?.first_name} {vehicle.profiles?.last_name}
                        </TableCell>
                        <TableCell>{vehicle.license_plate}</TableCell>
                        <TableCell>{getStatusBadge(vehicle.status)}</TableCell>
                        <TableCell>R$ {vehicle.daily_price}</TableCell>
                        <TableCell>{format(new Date(vehicle.created_at), "dd/MM/yyyy")}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button variant="outline" size="sm" disabled>
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
                <CardDescription>Gerencie todos os usuários da plataforma</CardDescription>
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allUsers?.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.first_name} {user.last_name}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{getStatusBadge(user.status)}</TableCell>
                        <TableCell>{getVerificationStatusBadge(user.verification_status)}</TableCell>
                        <TableCell>{user.cpf || "N/A"}</TableCell>
                        <TableCell>{user.phone_number || "N/A"}</TableCell>
                        <TableCell>{format(new Date(user.created_at), "dd/MM/yyyy")}</TableCell>
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
                <CardDescription>Visualize todas as reservas da plataforma</CardDescription>
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
                        <TableCell>{getStatusBadge(booking.status)}</TableCell>
                        <TableCell>R$ {booking.total_price}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Collaborators */}
          <TabsContent value="collaborators">
            <CollaboratorsTab />
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default Admin;