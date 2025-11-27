import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAllUsers } from "@/hooks/useAdmin";
import { useUserRoles, useAddUserRole, useRemoveUserRole } from "@/hooks/useUserRoles";
import { UserPlus, Shield, UserCog, ShoppingBag } from "lucide-react";
import { format } from "date-fns";

const CollaboratorsTab = () => {
  const { data: allUsers } = useAllUsers();
  const addUserRole = useAddUserRole();
  const removeUserRole = useRemoveUserRole();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");
  
  const { data: userRoles } = useUserRoles(selectedUserId || undefined);

  const handleAddRole = () => {
    if (selectedUserId && selectedRole) {
      addUserRole.mutate({ userId: selectedUserId, role: selectedRole });
      setSelectedRole("");
    }
  };

  const handleRemoveRole = (userId: string, role: string) => {
    removeUserRole.mutate({ userId, role });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="h-4 w-4" />;
      case "owner":
        return <UserCog className="h-4 w-4" />;
      case "customer":
        return <ShoppingBag className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getRoleBadge = (role: string) => {
    const roleColors: Record<string, string> = {
      admin: "bg-red-500",
      owner: "bg-blue-500",
      customer: "bg-green-500",
    };

    const roleLabels: Record<string, string> = {
      admin: "Administrador",
      owner: "Proprietário",
      customer: "Cliente",
    };

    return (
      <Badge className={`${roleColors[role] || "bg-gray-500"} flex items-center gap-1`}>
        {getRoleIcon(role)}
        {roleLabels[role] || role}
      </Badge>
    );
  };

  const getUserRoles = (userId: string) => {
    // For now, we'll need to fetch this data separately
    // This is a placeholder that should be replaced with actual role data
    return [];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento de Colaboradores</CardTitle>
        <CardDescription>Adicione ou remova perfis de acesso aos usuários</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 p-4 border border-border rounded-lg bg-muted/50">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Adicionar Perfil de Acesso
          </h3>
          <div className="flex gap-3 flex-wrap">
            <Select value={selectedUserId || ""} onValueChange={setSelectedUserId}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Selecione um usuário" />
              </SelectTrigger>
              <SelectContent>
                {allUsers?.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.first_name} {user.last_name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Selecione um perfil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Administrador
                  </div>
                </SelectItem>
                <SelectItem value="owner">
                  <div className="flex items-center gap-2">
                    <UserCog className="h-4 w-4" />
                    Proprietário
                  </div>
                </SelectItem>
                <SelectItem value="customer">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4" />
                    Cliente
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            <Button 
              onClick={handleAddRole} 
              disabled={!selectedUserId || !selectedRole || addUserRole.isPending}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Adicionar Perfil
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data de Cadastro</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allUsers?.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {user.first_name} {user.last_name}
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant={user.status === "verified" ? "default" : "secondary"}>
                    {user.status === "verified" ? "Verificado" : user.status}
                  </Badge>
                </TableCell>
                <TableCell>{format(new Date(user.created_at), "dd/MM/yyyy")}</TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedUserId(user.id)}
                  >
                    Gerenciar Perfis
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {selectedUserId && userRoles && userRoles.length > 0 && (
          <div className="mt-6 p-4 border border-border rounded-lg">
            <h4 className="font-semibold mb-3">
              Perfis de {allUsers?.find(u => u.id === selectedUserId)?.first_name}
            </h4>
            <div className="flex gap-2 flex-wrap">
              {userRoles.map((roleData) => (
                <div key={roleData.id} className="flex items-center gap-2">
                  {getRoleBadge(roleData.role)}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveRole(selectedUserId, roleData.role)}
                    disabled={removeUserRole.isPending}
                  >
                    ✕
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CollaboratorsTab;
