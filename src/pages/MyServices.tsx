import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Plus, Wrench, Pause, Play, Trash2, Eye, CreditCard, Crown,
  Upload, Edit, RefreshCw, AlertCircle, CheckCircle2
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {
  useMyServices, useCreateService, useUpdateService, useDeleteService,
  useServiceSubscription, useSubscribeToServices,
  SERVICE_CATEGORIES, getCategoryLabel, ServiceListing,
} from "@/hooks/useServices";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const MAX_SERVICES = 5;

const emptyForm = {
  title: "", description: "", category: "", custom_category: "",
  price_range: "", city: "", state: "", whatsapp_number: "",
  show_phone: true, allow_chat: true, image_url: "",
};

const MyServices = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const { data: services, isLoading: loadingServices } = useMyServices();
  const { data: subscription, isLoading: loadingSub, refetch: refetchSub } = useServiceSubscription();
  const subscribeMutation = useSubscribeToServices();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceListing | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    if (searchParams.get("subscribed") === "true") {
      toast.success("Assinatura ativada com sucesso! Agora você pode anunciar serviços.");
      refetchSub();
      window.history.replaceState({}, "", "/my-services");
    }
  }, [searchParams]);

  const isSubscribed = subscription?.subscribed === true;
  const serviceCount = services?.length || 0;
  const activeCount = services?.filter(s => s.status === "active").length || 0;
  const pausedCount = services?.filter(s => s.status === "paused").length || 0;
  const canCreateMore = serviceCount < MAX_SERVICES;
  const quotaPercent = (serviceCount / MAX_SERVICES) * 100;

  const handleSubscribe = async () => {
    try {
      const result = await subscribeMutation.mutateAsync("PIX");
      if (result?.invoiceUrl) {
        window.open(result.invoiceUrl, "_blank");
        toast.success("Assinatura criada! Pague via PIX para ativar.");
      } else {
        toast.success("Assinatura criada! Verifique seu e-mail para o link de pagamento.");
      }
      refetchSub();
    } catch {}
  };

  const handleRefreshSubscription = async () => {
    await refetchSub();
    toast.success("Status da assinatura atualizado!");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Imagem deve ter no máximo 5MB"); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `service-images/${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("vehicle-images").upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("vehicle-images").getPublicUrl(path);
      setFormData(prev => ({ ...prev, image_url: urlData.publicUrl }));
      toast.success("Imagem enviada!");
    } catch (err: any) {
      toast.error("Erro ao enviar imagem: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleCreate = () => {
    if (!formData.title.trim()) { toast.error("Preencha o título"); return; }
    if (!formData.category) { toast.error("Selecione uma categoria"); return; }
    if (formData.category === "outros" && !formData.custom_category.trim()) {
      toast.error("Descreva a categoria personalizada"); return;
    }
    createService.mutate(
      {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        category: formData.category,
        custom_category: formData.category === "outros" ? formData.custom_category.trim() : undefined,
        price_range: formData.price_range.trim() || undefined,
        city: formData.city.trim() || undefined,
        state: formData.state.trim().toUpperCase() || undefined,
        whatsapp_number: formData.whatsapp_number.trim() || undefined,
        show_phone: formData.show_phone,
        allow_chat: formData.allow_chat,
        image_url: formData.image_url || undefined,
      },
      { onSuccess: () => { setCreateOpen(false); setFormData(emptyForm); } }
    );
  };

  const openEdit = (service: ServiceListing) => {
    setEditingService(service);
    setFormData({
      title: service.title,
      description: service.description || "",
      category: service.category,
      custom_category: service.custom_category || "",
      price_range: service.price_range || "",
      city: service.city || "",
      state: service.state || "",
      whatsapp_number: service.whatsapp_number || "",
      show_phone: service.show_phone,
      allow_chat: service.allow_chat,
      image_url: service.image_url || "",
    });
    setEditOpen(true);
  };

  const handleUpdate = () => {
    if (!editingService) return;
    if (!formData.title.trim()) { toast.error("Preencha o título"); return; }
    if (!formData.category) { toast.error("Selecione uma categoria"); return; }
    updateService.mutate(
      {
        id: editingService.id,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        category: formData.category,
        custom_category: formData.category === "outros" ? formData.custom_category.trim() : null,
        price_range: formData.price_range.trim() || null,
        city: formData.city.trim() || null,
        state: formData.state.trim().toUpperCase() || null,
        whatsapp_number: formData.whatsapp_number.trim() || null,
        show_phone: formData.show_phone,
        allow_chat: formData.allow_chat,
        image_url: formData.image_url || null,
      },
      { onSuccess: () => { setEditOpen(false); setEditingService(null); setFormData(emptyForm); } }
    );
  };

  const handleToggleStatus = (service: ServiceListing) => {
    updateService.mutate({ id: service.id, status: service.status === "active" ? "paused" : "active" });
  };

  // Inline form fields — NOT a component, just JSX to avoid remounting
  const formFields = (
    <div className="space-y-4">
      <div>
        <Label htmlFor="svc-title">Título do serviço *</Label>
        <Input
          id="svc-title"
          value={formData.title}
          onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
          placeholder="Ex: Polimento automotivo profissional"
          maxLength={100}
        />
        <p className="text-xs text-muted-foreground mt-1">{formData.title.length}/100</p>
      </div>
      <div>
        <Label htmlFor="svc-category">Categoria *</Label>
        <Select value={formData.category} onValueChange={(v) => setFormData(p => ({ ...p, category: v }))}>
          <SelectTrigger id="svc-category"><SelectValue placeholder="Selecione a categoria" /></SelectTrigger>
          <SelectContent>
            {SERVICE_CATEGORIES.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {formData.category === "outros" && (
        <div>
          <Label htmlFor="svc-custom-cat">Categoria personalizada *</Label>
          <Input
            id="svc-custom-cat"
            value={formData.custom_category}
            onChange={(e) => setFormData(p => ({ ...p, custom_category: e.target.value }))}
            placeholder="Descreva o tipo de serviço"
          />
        </div>
      )}
      <div>
        <Label htmlFor="svc-desc">Descrição</Label>
        <Textarea
          id="svc-desc"
          value={formData.description}
          onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
          placeholder="Descreva seu serviço em detalhes, experiência, diferenciais..."
          rows={4}
          maxLength={1000}
        />
        <p className="text-xs text-muted-foreground mt-1">{formData.description.length}/1000</p>
      </div>
      <div>
        <Label htmlFor="svc-price">Faixa de preço</Label>
        <Input
          id="svc-price"
          value={formData.price_range}
          onChange={(e) => setFormData(p => ({ ...p, price_range: e.target.value }))}
          placeholder="Ex: R$ 150 - R$ 300 ou A combinar"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="svc-city">Cidade</Label>
          <Input
            id="svc-city"
            value={formData.city}
            onChange={(e) => setFormData(p => ({ ...p, city: e.target.value }))}
            placeholder="Sua cidade"
          />
        </div>
        <div>
          <Label htmlFor="svc-state">Estado</Label>
          <Input
            id="svc-state"
            value={formData.state}
            onChange={(e) => setFormData(p => ({ ...p, state: e.target.value }))}
            placeholder="UF"
            maxLength={2}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="svc-whatsapp">WhatsApp</Label>
        <Input
          id="svc-whatsapp"
          value={formData.whatsapp_number}
          onChange={(e) => setFormData(p => ({ ...p, whatsapp_number: e.target.value }))}
          placeholder="(11) 99999-9999"
        />
      </div>
      <div>
        <Label>Imagem do serviço</Label>
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => document.getElementById('svc-image-input')?.click()}>
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? "Enviando..." : "Enviar imagem"}
          </Button>
          <input id="svc-image-input" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          {formData.image_url && (
            <div className="relative">
              <img src={formData.image_url} alt="Preview" className="h-16 w-16 rounded-lg object-cover" />
              <button
                type="button"
                className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs"
                onClick={() => setFormData(p => ({ ...p, image_url: "" }))}
              >×</button>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between py-2">
        <div>
          <Label>Mostrar WhatsApp no anúncio</Label>
          <p className="text-xs text-muted-foreground">Clientes poderão ver seu número</p>
        </div>
        <Switch checked={formData.show_phone} onCheckedChange={(v) => setFormData(p => ({ ...p, show_phone: v }))} />
      </div>
      <div className="flex items-center justify-between py-2">
        <div>
          <Label>Permitir chat interno</Label>
          <p className="text-xs text-muted-foreground">Receba mensagens pela plataforma</p>
        </div>
        <Switch checked={formData.allow_chat} onCheckedChange={(v) => setFormData(p => ({ ...p, allow_chat: v }))} />
      </div>
    </div>
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 pt-24 container mx-auto px-4 text-center py-20">
          <Wrench className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <h2 className="text-2xl font-bold mb-4 text-foreground">Faça login para gerenciar seus serviços</h2>
          <Button asChild><Link to="/auth">Entrar</Link></Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Meus Serviços</h1>
              <p className="text-muted-foreground">Gerencie seus anúncios de serviços profissionais</p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/services">Ver marketplace</Link>
            </Button>
          </div>

          {/* Subscription Section */}
          {loadingSub ? (
            <Card className="mb-8 animate-pulse">
              <CardContent className="p-6"><div className="h-8 bg-muted rounded w-1/2" /></CardContent>
            </Card>
          ) : isSubscribed ? (
            <div className="space-y-4 mb-8">
              {/* Subscription card */}
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        <Crown className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground">Assinatura Ativa</p>
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          R$ 59,90/mês
                          {subscription?.subscription_end && (
                            <> • Renova em {format(new Date(subscription.subscription_end), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</>
                          )}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleRefreshSubscription}>
                      <RefreshCw className="w-4 h-4 mr-1" /> Atualizar
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quota card */}
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium text-foreground">Uso do pacote</p>
                      <p className="text-sm text-muted-foreground">
                        {serviceCount} de {MAX_SERVICES} anúncios utilizados
                        {activeCount > 0 && <> • <span className="text-primary">{activeCount} ativo{activeCount > 1 ? "s" : ""}</span></>}
                        {pausedCount > 0 && <> • <span className="text-amber-500">{pausedCount} pausado{pausedCount > 1 ? "s" : ""}</span></>}
                      </p>
                    </div>
                    {canCreateMore ? (
                      <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) setFormData(emptyForm); }}>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <Plus className="w-4 h-4 mr-2" /> Novo Serviço
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Anunciar Novo Serviço</DialogTitle>
                            <DialogDescription>Preencha os dados do seu serviço. Campos com * são obrigatórios.</DialogDescription>
                          </DialogHeader>
                          {formFields}
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
                            <Button onClick={handleCreate} disabled={createService.isPending}>
                              {createService.isPending ? "Publicando..." : "Publicar Serviço"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Limite atingido
                      </Badge>
                    )}
                  </div>
                  <Progress value={quotaPercent} className="h-2" />
                  {!canCreateMore && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Exclua um serviço existente para liberar espaço.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="border-amber-500/30 bg-amber-500/5 mb-8">
              <CardContent className="p-8 text-center">
                <CreditCard className="w-14 h-14 mx-auto text-amber-500 mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-2">Anuncie seus serviços profissionais</h3>
                <p className="text-muted-foreground mb-2 max-w-md mx-auto">
                  Por apenas <span className="font-bold text-foreground">R$ 59,90/mês</span>, anuncie seus serviços automotivos para milhares de clientes.
                </p>
                <ul className="text-sm text-muted-foreground mb-6 space-y-1.5 max-w-sm mx-auto text-left">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> Até 5 anúncios ativos simultaneamente</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> Contato via WhatsApp e chat interno</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> Visibilidade para clientes de locação e venda</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> Cancele quando quiser, sem multa</li>
                </ul>
                <div className="space-y-3">
                  <Button size="lg" onClick={handleSubscribe} disabled={subscribeMutation.isPending}>
                    <CreditCard className="w-4 h-4 mr-2" />
                    {subscribeMutation.isPending ? "Redirecionando..." : "Assinar agora — R$ 59,90/mês"}
                  </Button>
                  <div>
                    <Button variant="link" size="sm" onClick={handleRefreshSubscription} className="text-muted-foreground">
                      <RefreshCw className="w-3 h-3 mr-1" /> Já paguei? Verificar assinatura
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Service Listings */}
          {isSubscribed && (
            <>
              {loadingServices ? (
                <div className="space-y-4">
                  {[1, 2].map(i => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="flex gap-4">
                          <div className="h-20 w-20 bg-muted rounded-lg shrink-0" />
                          <div className="flex-1 space-y-2">
                            <div className="h-5 bg-muted rounded w-1/3" />
                            <div className="h-4 bg-muted rounded w-1/2" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : services && services.length > 0 ? (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  {services.map((service) => (
                    <Card key={service.id} className={`overflow-hidden ${service.status === "paused" ? "opacity-75" : ""}`}>
                      {/* Image */}
                      {service.image_url ? (
                        <div className="relative h-40 sm:h-48 overflow-hidden">
                          <img src={service.image_url} alt={service.title} className="w-full h-full object-cover" />
                          <Badge
                            variant={service.status === "active" ? "default" : "secondary"}
                            className="absolute top-3 right-3"
                          >
                            {service.status === "active" ? "Ativo" : "Pausado"}
                          </Badge>
                        </div>
                      ) : (
                        <div className="relative h-40 sm:h-48 bg-muted flex items-center justify-center">
                          <Wrench className="w-12 h-12 text-muted-foreground/20" />
                          <Badge
                            variant={service.status === "active" ? "default" : "secondary"}
                            className="absolute top-3 right-3"
                          >
                            {service.status === "active" ? "Ativo" : "Pausado"}
                          </Badge>
                        </div>
                      )}

                      {/* Info */}
                      <CardContent className="p-4 space-y-3">
                        <div>
                          <h3 className="font-bold text-foreground text-base sm:text-lg leading-tight line-clamp-2">{service.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {getCategoryLabel(service.category)}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-muted-foreground">
                          {service.city && (
                            <span>{service.city}{service.state ? `/${service.state}` : ""}</span>
                          )}
                          <span className="flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5" /> {service.views_count} visualizações
                          </span>
                          <span>Criado em {format(new Date(service.created_at), "dd/MM/yyyy")}</span>
                        </div>

                        {service.price_range && (
                          <p className="font-semibold text-primary text-sm sm:text-base">{service.price_range}</p>
                        )}

                        {/* Action buttons with labels */}
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-9 text-xs sm:text-sm"
                            asChild
                          >
                            <Link to={`/services/${service.id}`}>Visualizar</Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-9 text-xs sm:text-sm"
                            onClick={() => openEdit(service)}
                          >
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-9 text-xs sm:text-sm text-amber-600 border-amber-500/40 hover:bg-amber-500/10 hover:text-amber-700"
                            onClick={() => handleToggleStatus(service)}
                            disabled={updateService.isPending}
                          >
                            {service.status === "active" ? "Pausar" : "Reativar"}
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-9 text-xs sm:text-sm text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                              >
                                Excluir
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir serviço?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  O anúncio "{service.title}" será removido permanentemente. Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteService.mutate(service.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Wrench className="w-16 h-16 mx-auto text-muted-foreground/20 mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum serviço anunciado</h3>
                  <p className="text-muted-foreground mb-6">Crie seu primeiro anúncio e alcance milhares de clientes!</p>
                  <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) setFormData(emptyForm); }}>
                    <DialogTrigger asChild>
                      <Button><Plus className="w-4 h-4 mr-2" /> Criar Primeiro Anúncio</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Anunciar Novo Serviço</DialogTitle>
                        <DialogDescription>Preencha os dados do seu serviço. Campos com * são obrigatórios.</DialogDescription>
                      </DialogHeader>
                      {formFields}
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
                        <Button onClick={handleCreate} disabled={createService.isPending}>
                          {createService.isPending ? "Publicando..." : "Publicar Serviço"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </>
          )}

          {/* Edit Dialog */}
          <Dialog open={editOpen} onOpenChange={(open) => { setEditOpen(open); if (!open) { setEditingService(null); setFormData(emptyForm); } }}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Editar Serviço</DialogTitle>
                <DialogDescription>Atualize as informações do seu anúncio.</DialogDescription>
              </DialogHeader>
              {formFields}
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
                <Button onClick={handleUpdate} disabled={updateService.isPending}>
                  {updateService.isPending ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MyServices;
