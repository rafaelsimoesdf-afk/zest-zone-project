import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Phone, MessageSquare, Share2, Eye, Clock, Wrench, Send, Users, Sparkles, Car, Navigation, Truck, Camera, Shield, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useServiceListing, useServiceMessages, useSendServiceMessage, getCategoryLabel } from "@/hooks/useServices";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const categoryIcons: Record<string, any> = {
  motorista_particular: Users,
  polimento: Sparkles,
  lavagem: Car,
  turismo: Navigation,
  mecanico: Wrench,
  guincho: Truck,
  fotografo: Camera,
  seguro: Shield,
  documentacao: FileText,
  transporte: Truck,
  outros: Wrench,
};

const ServiceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: service, isLoading } = useServiceListing(id || "");
  const [chatOpen, setChatOpen] = useState(false);
  const [message, setMessage] = useState("");

  const { data: messages } = useServiceMessages(
    id || "",
    service?.provider_id || ""
  );
  const sendMessage = useSendServiceMessage();

  const handleSendMessage = () => {
    if (!message.trim() || !service || !user) return;
    sendMessage.mutate(
      { serviceId: service.id, receiverId: service.provider_id, content: message.trim() },
      { onSuccess: () => setMessage("") }
    );
  };

  const handleWhatsApp = () => {
    if (!service?.whatsapp_number) return;
    const phone = service.whatsapp_number.replace(/\D/g, "");
    const text = encodeURIComponent(`Olá! Vi seu anúncio "${service.title}" na InfiniteDrive e gostaria de mais informações.`);
    window.open(`https://wa.me/55${phone}?text=${text}`, "_blank");
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copiado!");
  };

  if (isLoading) {
    return (
      <div className="bg-background">
        <div className="pt-24 container mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="bg-background">
        <div className="pt-24 container mx-auto px-4 text-center py-20">
          <h2 className="text-2xl font-bold text-foreground mb-4">Serviço não encontrado</h2>
          <Button asChild><Link to="/services">Voltar aos serviços</Link></Button>
        </div>
      </div>
    );
  }

  const Icon = categoryIcons[service.category] || Wrench;
  const providerName = service.profiles
    ? `${service.profiles.first_name} ${service.profiles.last_name}`
    : "Prestador";
  const isOwner = user?.id === service.provider_id;

  return (
    <div className="bg-background">
      <div className="pt-20 pb-12">
        <div className="container mx-auto px-4">
          {/* Back */}
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Image */}
              {service.image_url && (
                <div className="rounded-xl overflow-hidden aspect-video">
                  <img src={service.image_url} alt={service.title} className="w-full h-full object-cover" />
                </div>
              )}

              {/* Title & Category */}
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <Badge variant="secondary" className="flex items-center gap-1.5 text-sm px-3 py-1">
                    <Icon className="w-4 h-4" />
                    {getCategoryLabel(service.category)}
                  </Badge>
                  {service.category === "outros" && service.custom_category && (
                    <Badge variant="outline">{service.custom_category}</Badge>
                  )}
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{service.title}</h1>
                {service.city && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    {service.city}{service.state ? `, ${service.state}` : ""}
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4" />
                  {service.views_count} visualizações
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  Publicado em {format(new Date(service.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </div>
              </div>

              <Separator />

              {/* Description */}
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-3">Sobre o serviço</h2>
                <div className="text-muted-foreground whitespace-pre-line leading-relaxed">
                  {service.description || "Nenhuma descrição fornecida."}
                </div>
              </div>

              {service.price_range && (
                <>
                  <Separator />
                  <div>
                    <h2 className="text-lg font-semibold text-foreground mb-2">Faixa de preço</h2>
                    <p className="text-xl font-bold text-primary">{service.price_range}</p>
                  </div>
                </>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Provider card */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={service.profiles?.profile_image || undefined} />
                      <AvatarFallback>{providerName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-foreground">{providerName}</p>
                      <p className="text-sm text-muted-foreground">Prestador de serviço</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* WhatsApp */}
                    {service.show_phone && service.whatsapp_number && (
                      <Button className="w-full bg-[hsl(142,71%,35%)] hover:bg-[hsl(142,71%,30%)] text-white" onClick={handleWhatsApp}>
                        <Phone className="w-4 h-4 mr-2" />
                        WhatsApp
                      </Button>
                    )}

                    {/* Chat */}
                    {service.allow_chat && !isOwner && user && (
                      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="w-full">
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Enviar mensagem
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Chat com {providerName}</DialogTitle>
                          </DialogHeader>
                          <ScrollArea className="h-64 border rounded-lg p-3 mb-3">
                            {messages && messages.length > 0 ? (
                              <div className="space-y-2">
                                {messages.map((msg: any) => (
                                  <div
                                    key={msg.id}
                                    className={`p-2 rounded-lg text-sm max-w-[80%] ${
                                      msg.sender_id === user.id
                                        ? "ml-auto bg-primary text-primary-foreground"
                                        : "bg-muted"
                                    }`}
                                  >
                                    {msg.content}
                                    <div className="text-[10px] opacity-70 mt-1">
                                      {format(new Date(msg.created_at), "HH:mm")}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-center text-muted-foreground text-sm py-8">
                                Inicie a conversa
                              </p>
                            )}
                          </ScrollArea>
                          <div className="flex gap-2">
                            <Textarea
                              value={message}
                              onChange={(e) => setMessage(e.target.value)}
                              placeholder="Digite sua mensagem..."
                              className="flex-1 min-h-[40px] max-h-24"
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSendMessage();
                                }
                              }}
                            />
                            <Button size="icon" onClick={handleSendMessage} disabled={!message.trim()}>
                              <Send className="w-4 h-4" />
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}

                    {!user && (
                      <Button variant="outline" className="w-full" asChild>
                        <Link to="/auth">Faça login para contato</Link>
                      </Button>
                    )}

                    <Button variant="ghost" className="w-full" onClick={handleShare}>
                      <Share2 className="w-4 h-4 mr-2" />
                      Compartilhar
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Info card */}
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    A InfiniteDrive é uma vitrine para prestadores de serviço. Negociações e pagamentos são realizados diretamente entre as partes.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetails;
