import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useHasVehicles } from "@/hooks/useOwnerDashboard";
import {
  useOwnerBalance,
  useWithdrawalConfig,
  useOwnerWithdrawals,
  useWithdrawalSettings,
  useRequestWithdrawal,
  useSaveWithdrawalSettings,
} from "@/hooks/useWithdrawals";
import { useStripeConnectStatus, useStartStripeOnboarding, useStripeBalance } from "@/hooks/useStripeConnect";
import { useProfile } from "@/hooks/useProfile";
import {
  Wallet,
  ArrowDownToLine,
  Clock,
  CheckCircle,
  XCircle,
  Banknote,
  Settings,
  TrendingUp,
  AlertCircle,
  ExternalLink,
  CreditCard,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  approved: "Aprovado",
  processing: "Processando",
  completed: "Concluído",
  rejected: "Rejeitado",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  approved: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  processing: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  completed: "bg-green-500/10 text-green-600 border-green-500/20",
  rejected: "bg-red-500/10 text-red-600 border-red-500/20",
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const OwnerWithdrawals = () => {
  const { user, loading: authLoading } = useAuth();
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchParams] = useSearchParams();

  const { data: hasVehicles, isLoading: checkingVehicles } = useHasVehicles();
  const { data: balance, isLoading: loadingBalance } = useOwnerBalance();
  const { data: config } = useWithdrawalConfig();
  const { data: withdrawals, isLoading: loadingWithdrawals } = useOwnerWithdrawals();
  const { data: settings } = useWithdrawalSettings();
  const { data: profile } = useProfile();
  const { data: stripeStatus, refetch: refetchStripe } = useStripeConnectStatus();
  const { data: stripeBalance, isLoading: loadingStripeBalance } = useStripeBalance();
  const startOnboarding = useStartStripeOnboarding();
  const requestWithdrawal = useRequestWithdrawal();
  const saveSettings = useSaveWithdrawalSettings();

  const [autoEnabled, setAutoEnabled] = useState(settings?.auto_withdraw_enabled ?? false);
  const [frequency, setFrequency] = useState(settings?.frequency ?? "monthly");
  const [minAutoAmount, setMinAutoAmount] = useState(String(settings?.minimum_amount ?? 100));

  // Refetch Stripe status after onboarding return
  useEffect(() => {
    if (searchParams.get("stripe_onboarding") === "complete") {
      refetchStripe();
    }
  }, [searchParams, refetchStripe]);

  useEffect(() => {
    if (settings) {
      setAutoEnabled(settings.auto_withdraw_enabled);
      setFrequency(settings.frequency);
      setMinAutoAmount(String(settings.minimum_amount));
    }
  }, [settings]);

  if (authLoading || checkingVehicles) {
    return (
      <div className="bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!hasVehicles) return <Navigate to="/my-vehicles" replace />;

  const handleRequestWithdrawal = () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      return;
    }
    requestWithdrawal.mutate(amount, {
      onSuccess: () => {
        setWithdrawAmount("");
        setDialogOpen(false);
      },
    });
  };

  const handleSaveSettings = () => {
    saveSettings.mutate({
      auto_withdraw_enabled: autoEnabled,
      frequency,
      minimum_amount: parseFloat(minAutoAmount) || 100,
    });
  };

  const hasCpf = !!profile?.cpf;

  return (
    <div className="bg-background flex flex-col">
      <main className="flex-1 container mx-auto px-3 sm:px-4 py-16 sm:py-24">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-4xl font-display font-bold text-primary mb-1 sm:mb-2">
              Saques e Retiradas
            </h1>
            <p className="text-xs sm:text-base text-muted-foreground">
              Gerencie seus saques via PIX (CPF cadastrado)
            </p>
          </div>

          {/* Stripe Connect Onboarding Card */}
          {stripeStatus && !stripeStatus.onboarding_complete && (
            <Card className="mb-6 border-primary/30 bg-primary/5">
              <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <CreditCard className="h-6 w-6 text-primary flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-sm">Configure sua conta Stripe Connect</p>
                  <p className="text-xs text-muted-foreground">
                    Para receber transferências automáticas, vincule sua conta bancária ao Stripe Connect.
                    {stripeStatus.has_account && " Seu cadastro está incompleto."}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => startOnboarding.mutate()}
                  disabled={startOnboarding.isPending}
                >
                  <ExternalLink className="w-4 h-4 mr-1.5" />
                  {startOnboarding.isPending ? "Abrindo..." : stripeStatus.has_account ? "Continuar Cadastro" : "Vincular Conta"}
                </Button>
              </CardContent>
            </Card>
          )}

          {stripeStatus?.onboarding_complete && (
            <Card className="mb-6 border-green-500/30 bg-green-500/5">
              <CardContent className="p-4 flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm text-green-700">Stripe Connect ativo</p>
                  <p className="text-xs text-muted-foreground">Transferências automáticas habilitadas para sua conta.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Balance Cards */}
          <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-5 mb-6 sm:mb-8">
            {(loadingBalance || loadingStripeBalance) ? (
              Array(5).fill(0).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2 p-3 sm:p-6"><Skeleton className="h-4 w-24" /></CardHeader>
                  <CardContent className="p-3 sm:p-6 pt-0"><Skeleton className="h-8 w-32" /></CardContent>
                </Card>
              ))
            ) : balance && (
              <>
                <Card className="border-green-500/20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-6">
                    <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground">Disponível para Saque</CardTitle>
                    <Wallet className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6 pt-0">
                    <div className="text-base sm:text-2xl font-bold text-green-600">
                      {stripeBalance?.has_stripe ? formatCurrency(stripeBalance.available) : formatCurrency(0)}
                    </div>
                    {!stripeBalance?.has_stripe && (
                      <p className="text-[10px] text-muted-foreground mt-1">Configure o Stripe Connect</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-yellow-500/20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-6">
                    <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground">Pendente de Liberação</CardTitle>
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6 pt-0">
                    <div className="text-base sm:text-2xl font-bold text-yellow-600">
                      {formatCurrency(balance.available_balance + (stripeBalance?.has_stripe ? stripeBalance.pending : 0))}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Aguardando liberação no Stripe
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-6">
                    <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground">Total Ganho</CardTitle>
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6 pt-0">
                    <div className="text-base sm:text-2xl font-bold">{formatCurrency(balance.total_earnings)}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-6">
                    <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground">Já Sacado</CardTitle>
                    <ArrowDownToLine className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6 pt-0">
                    <div className="text-base sm:text-2xl font-bold">{formatCurrency(balance.total_withdrawn)}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-6">
                    <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground">Saques Pendentes</CardTitle>
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6 pt-0">
                    <div className="text-base sm:text-2xl font-bold">{formatCurrency(balance.pending_withdrawals)}</div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Request Withdrawal Button */}
          <div className="mb-6">
            {!hasCpf ? (
              <Card className="border-destructive/30 bg-destructive/5">
                <CardContent className="p-4 flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">CPF não cadastrado</p>
                    <p className="text-xs text-muted-foreground">Cadastre seu CPF no perfil para poder solicitar saques via PIX.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="w-full sm:w-auto">
                    <Banknote className="w-5 h-5 mr-2" />
                    Solicitar Saque
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Solicitar Saque via PIX</DialogTitle>
                    <DialogDescription>
                      O valor será transferido para o PIX vinculado ao seu CPF: {profile?.cpf}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label>Saldo disponível para saque</Label>
                      <p className="text-lg font-bold text-green-600">
                        {stripeBalance?.has_stripe ? formatCurrency(stripeBalance.available) : formatCurrency(0)}
                      </p>
                      {!stripeBalance?.has_stripe && (
                        <p className="text-xs text-destructive">Configure o Stripe Connect para sacar.</p>
                      )}
                      {balance && balance.available_balance > 0 && (
                        <p className="text-xs text-yellow-600 mt-1">
                          Pendente de liberação: {formatCurrency(balance.available_balance)}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="amount">Valor do saque (R$)</Label>
                      <Input
                        id="amount"
                        type="number"
                        min={config?.minimum_withdrawal ?? 50}
                        max={stripeBalance?.has_stripe ? stripeBalance.available : 0}
                        step="0.01"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder={`Mínimo: R$ ${config?.minimum_withdrawal?.toFixed(2) ?? "50.00"}`}
                      />
                      {config && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Saques até {formatCurrency(config.auto_approval_limit)} são aprovados automaticamente.
                          Acima desse valor, requerem aprovação da equipe.
                        </p>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                    <Button
                      onClick={handleRequestWithdrawal}
                      disabled={requestWithdrawal.isPending || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
                    >
                      {requestWithdrawal.isPending ? "Solicitando..." : "Confirmar Saque"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <Tabs defaultValue="history" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
              <TabsTrigger value="history" className="text-xs sm:text-sm">Histórico</TabsTrigger>
              <TabsTrigger value="settings" className="text-xs sm:text-sm">
                <Settings className="w-3.5 h-3.5 mr-1.5" />
                Configurações
              </TabsTrigger>
            </TabsList>

            {/* History */}
            <TabsContent value="history" className="space-y-3">
              {loadingWithdrawals ? (
                Array(3).fill(0).map((_, i) => (
                  <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
                ))
              ) : !withdrawals || withdrawals.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Wallet className="w-12 h-12 text-muted-foreground mb-3" />
                    <h3 className="text-lg font-semibold mb-1">Nenhum saque realizado</h3>
                    <p className="text-muted-foreground text-sm text-center">Seus saques aparecerão aqui.</p>
                  </CardContent>
                </Card>
              ) : (
                withdrawals.map((w) => (
                  <Card key={w.id}>
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-base">{formatCurrency(w.net_amount)}</span>
                            <Badge className={statusColors[w.status]}>{statusLabels[w.status]}</Badge>
                            {w.auto_approved && <Badge variant="outline" className="text-xs">Auto</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            PIX: {w.pix_key} • Solicitado em {format(new Date(w.requested_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                          {w.completed_at && (
                            <p className="text-xs text-green-600">
                              Concluído em {format(new Date(w.completed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                          )}
                          {w.rejection_reason && (
                            <p className="text-xs text-red-600">Motivo: {w.rejection_reason}</p>
                          )}
                        </div>
                        <div className="flex items-center">
                          {w.status === "completed" && <CheckCircle className="w-5 h-5 text-green-500" />}
                          {w.status === "rejected" && <XCircle className="w-5 h-5 text-red-500" />}
                          {w.status === "pending" && <Clock className="w-5 h-5 text-yellow-500" />}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Settings */}
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Saque Automático</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Configure saques automáticos periódicos quando seu saldo atingir o valor mínimo definido
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Ativar saque automático</Label>
                      <p className="text-xs text-muted-foreground">Saques serão solicitados automaticamente</p>
                    </div>
                    <Switch checked={autoEnabled} onCheckedChange={setAutoEnabled} />
                  </div>

                  {autoEnabled && (
                    <>
                      <div className="space-y-2">
                        <Label>Frequência</Label>
                        <Select value={frequency} onValueChange={setFrequency}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="weekly">Semanal</SelectItem>
                            <SelectItem value="biweekly">Quinzenal</SelectItem>
                            <SelectItem value="monthly">Mensal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Valor mínimo para saque automático (R$)</Label>
                        <Input
                          type="number"
                          min="50"
                          step="10"
                          value={minAutoAmount}
                          onChange={(e) => setMinAutoAmount(e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  <Button onClick={handleSaveSettings} disabled={saveSettings.isPending}>
                    {saveSettings.isPending ? "Salvando..." : "Salvar Configurações"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default OwnerWithdrawals;
