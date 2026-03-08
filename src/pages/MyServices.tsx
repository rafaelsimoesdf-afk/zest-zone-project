import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Plus, Wrench, Pause, Play, Trash2, Eye, CreditCard, Crown, AlertCircle, Upload } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  useMyServices,
  useCreateService,
  useUpdateService,
  useDeleteService,
  useServiceSubscription,
  useSubscribeToServices,
  SERVICE_CATEGORIES,
  getCategoryLabel,
} from "@/hooks/useServices";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    custom_category: "",
    price_range: "",
    city: "",
    state: "",
    whatsapp_number: "",
    show_phone: true,
    allow_chat: true,
    image_url: "",
  });

  // Check if just subscribed
  useEffect(() => {
    if (searchParams.get("subscribed") === "true") {
      toast.success("Assinatura ativada com sucesso! Agora você pode anunciar serviços.");
      refetchSub();
    }
  }, [searchParams]);

  const isSubscribed = subscription?.subscribed === true;
  const serviceCount = services?.length || 0;
  const canCreateMore = serviceCount < 5;

  const handleSubscribe = async () => {
    const result = await subscribeMutation.mutateAsync();
    if (result?.url) {
      window.open(result.url, "_blank");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

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
    if (!formData.title || !formData.category) {
      toast.error("Preencha título e categoria");
      return;
    }
    createService.mutate(
      {
        title: formData.title,
        description: formData.description || undefined,
        category: formData.category,
        custom_category: formData.category === "outros" ? formData.custom_category : undefined,
        price_range: formData.price_range || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        whatsapp_number: formData.whatsapp_number || undefined,
        show_phone: formData.show_phone,
        allow_chat: formData.allow_chat,
        image_url: formData.image_url || undefined,
      },
      {
        onSuccess: () => {
          setCreateOpen(false);
          setFormData({
            title: "", description: "", category: "", custom_category: "",
            price_range: "", city: "", state: "", whatsapp_number: "",
            show_phone: true, allow_chat: true, image_url: "",
          });
        },
      }
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 container mx-auto px-4 text-center py-20">
          <h2 className="text-2xl font-bold mb-4">Faça login para gerenciar seus serviços</h2>
          <Button asChild><Link to="/auth">Entrar</Link></Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Meus Serviços</h1>
              <p className="text-muted-foreground">Gerencie seus anúncios de serviço</p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/services">Ver todos os serviços</Link>
            </Button>
          </div>

          {/* Subscription Status */}
          {!loadingSub && (
            <div className="mb-8">
              {isSubscribed ? (
                <Card className="border-primary/30 bg-primary/5">
                  <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Crown className="w-6 h-6 text-primary" />
                      <div>
                        <p className="font-semibold text-foreground">Assinatura Ativa</p>
                        <p className="text-sm text-muted-foreground">
                          Você pode anunciar até 5 serviços • {serviceCount}/5 utilizados
                          {subscription?.subscription_end && (
                            <> • Renova em {format(new Date(subscription.subscription_end), "dd/MM/yyyy", { locale: ptBR })}</>
                          )}
                        </p>
                      </div>
                    </div>
                    {canCreateMore && (
                      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Novo Serviço
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Anunciar Novo Serviço</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Título *</Label>
                              <Input
                                value={formData.title}
                                onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                                placeholder="Ex: Polimento automotivo profissional"
                              />
                            </div>
                            <div>
                              <Label>Categoria *</Label>
                              <Select value={formData.category} onValueChange={(v) => setFormData(p => ({ ...p, category: v }))}>
                                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                                <SelectContent>
                                  {SERVICE_CATEGORIES.map(cat => (
                                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            {formData.category === "outros" && (
                              <div>
                                <Label>Categoria personalizada</Label>
                                <Input
                                  value={formData.custom_category}
                                  onChange={(e) => setFormData(p => ({ ...p, custom_category: e.target.value }))}
                                  placeholder="Descreva o tipo de serviço"
                                />
                              </div>
                            )}
                            <div>
                              <Label>Descrição</Label>
                              <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                                placeholder="Descreva seu serviço em detalhes..."
                                rows={4}
                              />
                            </div>
                            <div>
                              <Label>Faixa de preço</Label>
                              <Input
                                value={formData.price_range}
                                onChange={(e) => setFormData(p => ({ ...p, price_range: e.target.value }))}
                                placeholder="Ex: R$ 150 - R$ 300 ou A combinar"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label>Cidade</Label>
                                <Input
                                  value={formData.city}
                                  onChange={(e) => setFormData(p => ({ ...p, city: e.target.value }))}
                                  placeholder="Cidade"
                                />
                              </div>
                              <div>
                                <Label>Estado</Label>
                                <Input
                                  value={formData.state}
                                  onChange={(e) => setFormData(p => ({ ...p, state: e.target.value }))}
                                  placeholder="UF"
                                  maxLength={2}
                                />
                              </div>
                            </div>
                            <div>
                              <Label>WhatsApp</Label>
                              <Input
                                value={formData.whatsapp_number}
                                onChange={(e) => setFormData(p => ({ ...p, whatsapp_number: e.target.value }))}
                                placeholder="(11) 99999-9999"
                              />
                            </div>
                            <div>
                              <Label>Imagem do serviço</Label>
                              <div className="flex items-center gap-3">
                                <Button variant="outline" size="sm" asChild disabled={uploading}>
                                  <label className="cursor-pointer">
                                    <Upload className="w-4 h-4 mr-2" />
                                    {uploading ? "Enviando..." : "Enviar imagem"}
                                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                  </label>
                                </Button>
                                {formData.image_url && (
                                  <img src={formData.image_url} alt="Preview" className="h-12 w-12 rounded object-cover" />
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <Label>Mostrar WhatsApp</Label>
                              <Switch checked={formData.show_phone} onCheckedChange={(v) => setFormData(p => ({ ...p, show_phone: v }))} />
                            </div>
                            <div className="flex items-center justify-between">
                              <Label>Permitir chat interno</Label>
                              <Switch checked={formData.allow_chat} onCheckedChange={(v) => setFormData(p => ({ ...p, allow_chat: v }))} />
                            </div>
                            <Button className="w-full" onClick={handleCreate} disabled={createService.isPending}>
                              {createService.isPending ? "Criando..." : "Publicar Serviço"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-amber-500/30 bg-amber-500/5">
                  <CardContent className="p-6 text-center">
                    <CreditCard className="w-12 h-12 mx-auto text-amber-500 mb-4" />
                    <h3 className="text-xl font-bold text-foreground mb-2">Anuncie seus serviços</h3>
                    <p className="text-muted-foreground mb-2">
                      Por apenas <span className="font-bold text-foreground">R$ 59,90/mês</span>, anuncie até 5 serviços para milhares de clientes.
                    </p>
                    <ul className="text-sm text-muted-foreground mb-6 space-y-1">
                      <li>✅ Até 5 anúncios ativos</li>
                      <li>✅ Contato via WhatsApp e chat</li>
                      <li>✅ Visibilidade para clientes de locação e venda</li>
                      <li>✅ Cancele quando quiser</li>
                    </ul>
                    <Button size="lg" onClick={handleSubscribe} disabled={subscribeMutation.isPending}>
                      <CreditCard className="w-4 h-4 mr-2" />
                      {subscribeMutation.isPending ? "Redirecionando..." : "Assinar agora - R$ 59,90/mês"}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Service list */}
          {isSubscribed && (
            <>
              {loadingServices ? (
                <div className="space-y-4">
                  {[1, 2].map(i => (
                    <Card key={i} className="animate-pulse"><CardContent className="p-6"><div className="h-6 bg-muted rounded w-1/2" /></CardContent></Card>
                  ))}
                </div>
              ) : services && services.length > 0 ? (
                <div className="space-y-4">
                  {services.map((service) => (
                    <Card key={service.id}>
                      <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1">
                          {service.image_url && (
                            <img src={service.image_url} alt="" className="h-16 w-16 rounded-lg object-cover shrink-0" />
                          )}
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-foreground">{service.title}</h3>
                              <Badge variant={service.status === "active" ? "default" : "secondary"}>
                                {service.status === "active" ? "Ativo" : "Pausado"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {getCategoryLabel(service.category)} • {service.views_count} visualizações
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/services/${service.id}`}>
                              <Eye className="w-4 h-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateService.mutate({
                              id: service.id,
                              status: service.status === "active" ? "paused" : "active",
                            })}
                          >
                            {service.status === "active" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              if (confirm("Excluir este serviço?")) {
                                deleteService.mutate(service.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Wrench className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">Você ainda não tem serviços anunciados.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default MyServices;
