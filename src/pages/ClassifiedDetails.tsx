import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useListing, useListingMessages, useSendListingMessage, useUpdateListing, useDeleteListing } from "@/hooks/useClassifieds";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { formatCurrencyBRL } from "@/lib/validators";
import { translateVehicleType, translateTransmission, translateFuel } from "@/lib/translations";
import { ArrowLeft, MapPin, Eye, Phone, MessageSquare, Send, Users, DoorOpen, Gauge, Snowflake, Fuel, Settings, ArrowLeftRight, ChevronLeft, ChevronRight, Calendar, Trash2, Pause, Play } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const conditionLabels: Record<string, string> = {
  new: "Novo",
  "semi-new": "Seminovo",
  used: "Usado",
};

const ClassifiedDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: listing, isLoading } = useListing(id || "");
  const updateListing = useUpdateListing();
  const deleteListing = useDeleteListing();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [chatMessage, setChatMessage] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isOwner = user?.id === listing?.seller_id;
  const sellerId = listing?.seller_id || "";

  const { data: messages } = useListingMessages(id || "", sellerId);
  const sendMessage = useSendListingMessage();

  const images = listing?.listing_images?.sort((a, b) => {
    if (a.is_primary) return -1;
    if (b.is_primary) return 1;
    return a.display_order - b.display_order;
  }) || [];

  const imageUrls = images.length > 0 ? images.map(img => img.image_url) : ["https://images.unsplash.com/photo-1590362891991-f776e747a588"];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !listing || !user) return;
    await sendMessage.mutateAsync({
      listingId: listing.id,
      receiverId: listing.seller_id,
      content: chatMessage.trim(),
    });
    setChatMessage("");
  };

  const handleWhatsApp = () => {
    if (!listing?.whatsapp_number) return;
    const phone = listing.whatsapp_number.replace(/\D/g, "");
    const message = encodeURIComponent(`Olá! Vi seu anúncio do ${listing.brand} ${listing.model} ${listing.year} por ${formatCurrencyBRL(listing.sale_price)} na InfiniteDrive e gostaria de mais informações.`);
    window.open(`https://wa.me/55${phone}?text=${message}`, "_blank");
  };

  const handleDelete = async () => {
    if (!listing) return;
    await deleteListing.mutateAsync(listing.id);
    navigate("/classifieds");
  };

  const handleToggleStatus = async () => {
    if (!listing) return;
    const newStatus = listing.status === "active" ? "paused" : "active";
    await updateListing.mutateAsync({ id: listing.id, status: newStatus });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-24 flex items-center justify-center">
          <p className="text-muted-foreground">Carregando anúncio...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-24 flex items-center justify-center">
          <p className="text-muted-foreground">Anúncio não encontrado.</p>
        </main>
        <Footer />
      </div>
    );
  }

  const sellerProfile = listing.profiles;
  const sellerName = sellerProfile ? `${sellerProfile.first_name} ${sellerProfile.last_name}` : "Vendedor";

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20 sm:pt-24 pb-20">
        <div className="container mx-auto px-3 sm:px-6 lg:px-8">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Images + Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Image Gallery */}
              <Card className="overflow-hidden">
                <div className="relative h-64 sm:h-96">
                  {imageUrls.map((url, index) => (
                    <img
                      key={index}
                      src={url}
                      alt={`${listing.brand} ${listing.model} - Foto ${index + 1}`}
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'}`}
                    />
                  ))}
                  {imageUrls.length > 1 && (
                    <>
                      <button onClick={() => setCurrentImageIndex(p => p === 0 ? imageUrls.length - 1 : p - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur flex items-center justify-center hover:bg-background shadow-md">
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button onClick={() => setCurrentImageIndex(p => p === imageUrls.length - 1 ? 0 : p + 1)} className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur flex items-center justify-center hover:bg-background shadow-md">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  <div className="absolute bottom-3 right-3 bg-background/80 backdrop-blur rounded-full px-3 py-1 text-xs font-medium">
                    {currentImageIndex + 1} / {imageUrls.length}
                  </div>
                </div>
                {imageUrls.length > 1 && (
                  <div className="flex gap-1 p-2 overflow-x-auto">
                    {imageUrls.map((url, i) => (
                      <button key={i} onClick={() => setCurrentImageIndex(i)} className={`shrink-0 w-16 h-12 rounded overflow-hidden border-2 ${i === currentImageIndex ? 'border-primary' : 'border-transparent'}`}>
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </Card>

              {/* Vehicle Details */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl sm:text-2xl">
                        {listing.brand} {listing.model} {listing.year}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2 text-muted-foreground text-sm">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span>{listing.city && listing.state ? `${listing.city}, ${listing.state}` : "Localização não informada"}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary">{conditionLabels[listing.condition] || listing.condition}</Badge>
                      {listing.accepts_trade && (
                        <Badge variant="outline" className="border-primary text-primary">
                          <ArrowLeftRight className="w-3 h-3 mr-1" />
                          Aceita troca
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Specs grid */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                    {[
                      { icon: <Users className="w-5 h-5" />, label: `${listing.seats} lugares` },
                      { icon: <DoorOpen className="w-5 h-5" />, label: `${listing.doors} portas` },
                      { icon: <Gauge className="w-5 h-5" />, label: `${listing.mileage.toLocaleString()} km` },
                      { icon: <Snowflake className="w-5 h-5" />, label: listing.has_air_conditioning ? "Ar-cond." : "Sem A/C" },
                      { icon: <Settings className="w-5 h-5" />, label: translateTransmission(listing.transmission_type) },
                      { icon: <Fuel className="w-5 h-5" />, label: translateFuel(listing.fuel_type) },
                    ].map((spec, i) => (
                      <div key={i} className="flex flex-col items-center text-center p-3 rounded-lg bg-muted/50">
                        <span className="text-primary mb-1">{spec.icon}</span>
                        <span className="text-xs text-muted-foreground">{spec.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Description */}
                  {listing.description && (
                    <div>
                      <h3 className="font-semibold mb-2">Descrição</h3>
                      <p className="text-muted-foreground whitespace-pre-wrap">{listing.description}</p>
                    </div>
                  )}

                  {/* Meta */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Eye className="w-4 h-4" /> {listing.views_count} visualizações</span>
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Publicado em {format(new Date(listing.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-4">
              {/* Price Card */}
              <Card className="border-primary/30">
                <CardContent className="pt-6">
                  <div className="text-center mb-6">
                    <span className="text-3xl sm:text-4xl font-bold text-primary">
                      {formatCurrencyBRL(listing.sale_price)}
                    </span>
                  </div>

                  {/* Seller Info */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 mb-4">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={sellerProfile?.profile_image || undefined} />
                      <AvatarFallback>{sellerName[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{sellerName}</p>
                      <p className="text-xs text-muted-foreground">Vendedor</p>
                    </div>
                  </div>

                  {/* Actions */}
                  {!isOwner ? (
                    <div className="space-y-3">
                      {listing.show_phone && listing.whatsapp_number && (
                        <Button className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={handleWhatsApp}>
                          <Phone className="w-4 h-4 mr-2" />
                          WhatsApp
                        </Button>
                      )}
                      {listing.allow_chat && user && (
                        <Dialog open={chatOpen} onOpenChange={setChatOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="w-full">
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Enviar Mensagem
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Mensagem para {sellerName}</DialogTitle>
                            </DialogHeader>
                            <div className="max-h-64 overflow-y-auto space-y-2 p-2 border rounded-lg">
                              {messages && messages.length > 0 ? messages.map((msg: any) => (
                                <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                                  <div className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${msg.sender_id === user?.id ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                    {msg.content}
                                  </div>
                                </div>
                              )) : (
                                <p className="text-center text-muted-foreground text-sm py-4">Nenhuma mensagem ainda</p>
                              )}
                              <div ref={messagesEndRef} />
                            </div>
                            <div className="flex gap-2">
                              <Input
                                value={chatMessage}
                                onChange={e => setChatMessage(e.target.value)}
                                placeholder="Digite sua mensagem..."
                                onKeyDown={e => e.key === "Enter" && handleSendMessage()}
                              />
                              <Button size="icon" onClick={handleSendMessage} disabled={sendMessage.isPending}>
                                <Send className="w-4 h-4" />
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                      {!user && (
                        <Button variant="outline" className="w-full" onClick={() => navigate("/auth")}>
                          Faça login para entrar em contato
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full" onClick={handleToggleStatus} disabled={updateListing.isPending}>
                        {listing.status === "active" ? <><Pause className="w-4 h-4 mr-2" />Pausar Anúncio</> : <><Play className="w-4 h-4 mr-2" />Reativar Anúncio</>}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" className="w-full" disabled={deleteListing.isPending}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir Anúncio
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir anúncio?</AlertDialogTitle>
                            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ClassifiedDetails;
