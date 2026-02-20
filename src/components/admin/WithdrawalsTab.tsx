import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAllWithdrawals, useUpdateWithdrawalStatus } from "@/hooks/useWithdrawals";
import { useProcessWithdrawalTransfer } from "@/hooks/useStripeConnect";
import { CheckCircle, XCircle, Clock, Banknote, ArrowRight, Zap } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrencyBRL } from "@/lib/validators";

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  approved: "Aprovado",
  processing: "Processando",
  completed: "Concluído",
  rejected: "Rejeitado",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500",
  approved: "bg-blue-500",
  processing: "bg-purple-500",
  completed: "bg-green-500",
  rejected: "bg-red-500",
};

const WithdrawalsTab = () => {
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionDialog, setActionDialog] = useState<{
    type: "approve" | "reject" | "complete" | null;
    withdrawalId: string | null;
  }>({ type: null, withdrawalId: null });
  const [reason, setReason] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  const { data: withdrawals, isLoading } = useAllWithdrawals(statusFilter);
  const updateStatus = useUpdateWithdrawalStatus();
  const processTransfer = useProcessWithdrawalTransfer();

  const handleAction = () => {
    if (!actionDialog.withdrawalId || !actionDialog.type) return;

    const statusMap: Record<string, string> = {
      approve: "approved",
      reject: "rejected",
      complete: "completed",
    };

    updateStatus.mutate({
      withdrawalId: actionDialog.withdrawalId,
      status: statusMap[actionDialog.type],
      rejectionReason: actionDialog.type === "reject" ? reason : undefined,
      adminNotes: adminNotes || undefined,
    });

    setActionDialog({ type: null, withdrawalId: null });
    setReason("");
    setAdminNotes("");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Gerenciar Saques</CardTitle>
            <CardDescription>Aprove, rejeite ou conclua solicitações de saque dos proprietários</CardDescription>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="approved">Aprovados</SelectItem>
              <SelectItem value="processing">Processando</SelectItem>
              <SelectItem value="completed">Concluídos</SelectItem>
              <SelectItem value="rejected">Rejeitados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : !withdrawals || withdrawals.length === 0 ? (
          <div className="text-center py-12">
            <Banknote className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhuma solicitação de saque encontrada.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Proprietário</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>PIX (CPF)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Auto</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {withdrawals.map((w) => (
                <TableRow key={w.id}>
                  <TableCell className="font-medium">
                    {w.owner?.first_name} {w.owner?.last_name}
                    <br />
                    <span className="text-xs text-muted-foreground">{w.owner?.email}</span>
                  </TableCell>
                  <TableCell>
                    <div>
                      <span className="font-semibold">{formatCurrencyBRL(w.net_amount)}</span>
                      {w.platform_fee > 0 && (
                        <p className="text-xs text-muted-foreground">Taxa: {formatCurrencyBRL(w.platform_fee)}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{w.pix_key}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[w.status]}>{statusLabels[w.status]}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(w.requested_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    {w.auto_approved ? (
                      <Badge variant="outline" className="text-xs">Sim</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">Não</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      {(w.status === "pending") && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 border-green-600 hover:bg-green-50"
                            onClick={() => {
                              // Try automatic Stripe transfer first
                              processTransfer.mutate(w.id);
                            }}
                            disabled={processTransfer.isPending}
                          >
                            <Zap className="w-3.5 h-3.5 mr-1" />
                            {processTransfer.isPending ? "..." : "Aprovar + Transferir"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 border-green-600 hover:bg-green-50"
                            onClick={() => setActionDialog({ type: "approve", withdrawalId: w.id })}
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                            Aprovar Manual
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-600 hover:bg-red-50"
                            onClick={() => setActionDialog({ type: "reject", withdrawalId: w.id })}
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" />
                            Rejeitar
                          </Button>
                        </>
                      )}
                      {(w.status === "approved" || w.status === "processing") && (
                        <Button
                          size="sm"
                          onClick={() => setActionDialog({ type: "complete", withdrawalId: w.id })}
                        >
                          <ArrowRight className="w-3.5 h-3.5 mr-1" />
                          Concluir
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Action Dialog */}
      <Dialog open={!!actionDialog.type} onOpenChange={(open) => !open && setActionDialog({ type: null, withdrawalId: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === "approve" && "Aprovar Saque"}
              {actionDialog.type === "reject" && "Rejeitar Saque"}
              {actionDialog.type === "complete" && "Concluir Saque"}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.type === "approve" && "Confirme a aprovação deste saque. O proprietário será notificado."}
              {actionDialog.type === "reject" && "Informe o motivo da rejeição. O proprietário será notificado."}
              {actionDialog.type === "complete" && "Confirme que a transferência PIX foi realizada com sucesso."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {actionDialog.type === "reject" && (
              <div className="space-y-2">
                <Label>Motivo da rejeição *</Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ex: Dados bancários inconsistentes..."
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Notas internas (opcional)</Label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Notas visíveis apenas para administradores..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ type: null, withdrawalId: null })}>
              Cancelar
            </Button>
            <Button
              onClick={handleAction}
              disabled={updateStatus.isPending || (actionDialog.type === "reject" && !reason.trim())}
              variant={actionDialog.type === "reject" ? "destructive" : "default"}
            >
              {updateStatus.isPending ? "Processando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default WithdrawalsTab;
