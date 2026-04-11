import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Send, MessageSquare, ArrowLeft, Car, Calendar, User, Search, Settings } from "lucide-react";
import Navbar from "@/components/Navbar";
import BottomTabBar from "@/components/BottomTabBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import {
  useConversations,
  useBookingMessages,
  useSendMessage,
  useMarkMessagesAsRead,
  Conversation
} from "@/hooks/useMessages";
import { useBooking } from "@/hooks/useBookings";
import { cn } from "@/lib/utils";

const Messages = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedBookingId = searchParams.get("booking");
  const [messageInput, setMessageInput] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations, isLoading: loadingConversations } = useConversations();
  const { data: messages, isLoading: loadingMessages } = useBookingMessages(selectedBookingId || "");
  const { data: bookingDetails } = useBooking(selectedBookingId || "");
  const sendMessage = useSendMessage();
  const markAsRead = useMarkMessagesAsRead();

  const selectedConversation = conversations?.find(c => c.booking_id === selectedBookingId);

  const filteredConversations = conversations?.filter(c => {
    if (filter === "unread") return c.unread_count > 0;
    return true;
  });

  useEffect(() => {
    if (selectedBookingId && selectedConversation?.unread_count) {
      markAsRead.mutate(selectedBookingId);
    }
  }, [selectedBookingId, selectedConversation?.unread_count]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedBookingId || !selectedConversation) return;

    await sendMessage.mutateAsync({
      bookingId: selectedBookingId,
      receiverId: selectedConversation.other_user.id,
      content: messageInput,
    });

    setMessageInput("");
  };

  const selectConversation = (conversation: Conversation) => {
    setSearchParams({ booking: conversation.booking_id });
  };

  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return format(date, "HH:mm", { locale: ptBR });
    if (diffDays === 1) return "Ontem";
    if (diffDays < 7) return format(date, "EEEE", { locale: ptBR });
    return format(date, "dd/MM/yy", { locale: ptBR });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Faça login para ver suas mensagens</h1>
          <p className="text-muted-foreground">Você precisa estar logado para acessar suas conversas.</p>
        </div>
        <BottomTabBar />
      </div>
    );
  }

  // Mobile conversation list (no booking selected)
  const MobileConversationList = () => (
    <div className="md:hidden min-h-screen bg-background pb-16">
      {/* Header */}
      <div className="px-4 pt-14 pb-2">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-foreground">Mensagens</h1>
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 rounded-full border border-border flex items-center justify-center">
              <Search className="w-5 h-5 text-foreground" />
            </button>
            <button className="w-10 h-10 rounded-full border border-border flex items-center justify-center">
              <Settings className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {[
            { key: "all", label: "Todas" },
            { key: "unread", label: "Não lidas" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as "all" | "unread")}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                filter === f.key
                  ? "bg-foreground text-background"
                  : "bg-muted text-foreground border border-border"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation list */}
      {loadingConversations ? (
        <div className="px-4 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-14 w-14 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredConversations?.length === 0 ? (
        <div className="px-4 py-12 text-center text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhuma conversa encontrada</p>
        </div>
      ) : (
        <div>
          {filteredConversations?.map(conversation => (
            <button
              key={conversation.booking_id}
              onClick={() => selectConversation(conversation)}
              className="w-full px-4 py-3 flex gap-3 hover:bg-muted/50 transition-colors text-left"
            >
              <div className="relative">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={conversation.other_user.profile_image || undefined} />
                  <AvatarFallback className="text-sm">
                    {getInitials(conversation.other_user.first_name, conversation.other_user.last_name)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-0.5">
                  <span className={cn("font-medium text-sm truncate", conversation.unread_count > 0 && "font-bold")}>
                    {conversation.other_user.first_name} {conversation.other_user.last_name}
                  </span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                    {conversation.last_message && formatMessageDate(conversation.last_message.created_at)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {conversation.last_message?.content || "Nenhuma mensagem ainda"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {conversation.vehicle.brand} {conversation.vehicle.model}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      <BottomTabBar />
    </div>
  );

  // Mobile chat view (booking selected)
  const MobileChatView = () => (
    <div className="md:hidden flex flex-col h-screen bg-background">
      {/* Chat Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background pt-14">
        <button onClick={() => setSearchParams({})}>
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <Avatar className="h-10 w-10">
          <AvatarImage src={selectedConversation?.other_user.profile_image || undefined} />
          <AvatarFallback>
            {selectedConversation ? getInitials(selectedConversation.other_user.first_name, selectedConversation.other_user.last_name) : ""}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h2 className="font-medium text-sm truncate">
            {selectedConversation?.other_user.first_name} {selectedConversation?.other_user.last_name}
          </h2>
          <p className="text-xs text-muted-foreground truncate">
            {selectedConversation?.vehicle.brand} {selectedConversation?.vehicle.model}
          </p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-3">
        {loadingMessages ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className={cn("flex", i % 2 === 0 ? "justify-end" : "justify-start")}>
                <Skeleton className="h-16 w-48 rounded-lg" />
              </div>
            ))}
          </div>
        ) : messages?.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma mensagem ainda</p>
              <p className="text-sm">Envie a primeira mensagem!</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages?.map((message, index) => {
              const isOwn = message.sender_id === user?.id;
              const showDate = index === 0 ||
                format(new Date(message.created_at), "yyyy-MM-dd") !==
                format(new Date(messages[index - 1].created_at), "yyyy-MM-dd");

              return (
                <div key={message.id}>
                  {showDate && (
                    <div className="text-center my-3">
                      <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                        {format(new Date(message.created_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </span>
                    </div>
                  )}
                  <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[75%] rounded-2xl px-4 py-2",
                      isOwn
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted rounded-bl-sm"
                    )}>
                      <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
                      <div className={cn(
                        "text-[10px] mt-1 flex items-center gap-1",
                        isOwn ? "text-primary-foreground/70 justify-end" : "text-muted-foreground"
                      )}>
                        {format(new Date(message.created_at), "HH:mm")}
                        {isOwn && message.is_read && <span>✓✓</span>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-border bg-background pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="flex gap-2">
          <Input
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1 rounded-full"
          />
          <Button type="submit" size="icon" className="rounded-full" disabled={!messageInput.trim() || sendMessage.isPending}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );

  return (
    <>
      {/* Mobile */}
      <div className="md:hidden">
        {selectedBookingId && selectedConversation ? <MobileChatView /> : <MobileConversationList />}
      </div>

      {/* Desktop */}
      <div className="hidden md:flex min-h-screen bg-background flex-col">
        <Navbar />
        <div className="flex-1 flex overflow-hidden pt-16">
          {/* Conversations List */}
          <div className="w-80 lg:w-96 border-r border-border flex flex-col bg-card">
            <div className="p-4 border-b border-border">
              <h1 className="text-xl font-bold mb-4">Mensagens</h1>
              <div className="flex gap-4">
                <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>Todas</Button>
                <Button variant={filter === "unread" ? "default" : "outline"} size="sm" onClick={() => setFilter("unread")}>Não lidas</Button>
              </div>
            </div>
            <ScrollArea className="flex-1">
              {loadingConversations ? (
                <div className="p-4 space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-3">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredConversations?.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma conversa encontrada</p>
                </div>
              ) : (
                filteredConversations?.map(conversation => (
                  <button
                    key={conversation.booking_id}
                    onClick={() => selectConversation(conversation)}
                    className={cn(
                      "w-full p-4 flex gap-3 hover:bg-accent/50 transition-colors text-left border-b border-border",
                      selectedBookingId === conversation.booking_id && "bg-accent"
                    )}
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={conversation.other_user.profile_image || undefined} />
                      <AvatarFallback>{getInitials(conversation.other_user.first_name, conversation.other_user.last_name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium truncate">{conversation.other_user.first_name} {conversation.other_user.last_name}</span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                          {conversation.last_message && formatMessageDate(conversation.last_message.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{conversation.vehicle.brand} {conversation.vehicle.model}</p>
                      <p className="text-sm truncate">{conversation.last_message?.content || "Nenhuma mensagem ainda"}</p>
                      {conversation.unread_count > 0 && (
                        <Badge variant="default" className="mt-1">{conversation.unread_count} nova{conversation.unread_count > 1 ? "s" : ""}</Badge>
                      )}
                    </div>
                  </button>
                ))
              )}
            </ScrollArea>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedBookingId && selectedConversation ? (
              <>
                <div className="p-4 border-b border-border bg-card flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={selectedConversation.other_user.profile_image || undefined} />
                    <AvatarFallback>{getInitials(selectedConversation.other_user.first_name, selectedConversation.other_user.last_name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h2 className="font-medium">{selectedConversation.other_user.first_name} {selectedConversation.other_user.last_name}</h2>
                    <p className="text-sm text-muted-foreground">{selectedConversation.vehicle.brand} {selectedConversation.vehicle.model} {selectedConversation.vehicle.year}</p>
                  </div>
                </div>
                <ScrollArea className="flex-1 p-4">
                  {loadingMessages ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className={cn("flex", i % 2 === 0 ? "justify-end" : "justify-start")}>
                          <Skeleton className="h-16 w-48 rounded-lg" />
                        </div>
                      ))}
                    </div>
                  ) : messages?.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhuma mensagem ainda</p>
                        <p className="text-sm">Envie a primeira mensagem!</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages?.map((message, index) => {
                        const isOwn = message.sender_id === user?.id;
                        const showDate = index === 0 ||
                          format(new Date(message.created_at), "yyyy-MM-dd") !==
                          format(new Date(messages[index - 1].created_at), "yyyy-MM-dd");
                        return (
                          <div key={message.id}>
                            {showDate && (
                              <div className="text-center my-4">
                                <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                                  {format(new Date(message.created_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                </span>
                              </div>
                            )}
                            <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
                              <div className={cn(
                                "max-w-[70%] rounded-2xl px-4 py-2",
                                isOwn ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted rounded-bl-sm"
                              )}>
                                <p className="whitespace-pre-wrap break-words">{message.content}</p>
                                <div className={cn("text-[10px] mt-1 flex items-center gap-1", isOwn ? "text-primary-foreground/70 justify-end" : "text-muted-foreground")}>
                                  {format(new Date(message.created_at), "HH:mm")}
                                  {isOwn && message.is_read && <span>✓✓</span>}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>
                <form onSubmit={handleSendMessage} className="p-4 border-t border-border bg-card">
                  <div className="flex gap-2">
                    <Input value={messageInput} onChange={(e) => setMessageInput(e.target.value)} placeholder="Digite sua mensagem..." className="flex-1" />
                    <Button type="submit" size="icon" disabled={!messageInput.trim() || sendMessage.isPending}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h2 className="text-xl font-medium mb-2">Selecione uma conversa</h2>
                  <p>Escolha uma conversa na lista para começar</p>
                </div>
              </div>
            )}
          </div>

          {/* Booking Details Sidebar */}
          {selectedBookingId && bookingDetails && (
            <div className="hidden lg:block w-80 border-l border-border bg-card p-4 overflow-y-auto">
              <h3 className="font-bold text-lg mb-4">Reserva</h3>
              {bookingDetails.vehicles?.vehicle_images?.[0] && (
                <div className="rounded-lg overflow-hidden mb-4">
                  <img src={bookingDetails.vehicles.vehicle_images[0].image_url} alt="Veículo" className="w-full h-40 object-cover" />
                </div>
              )}
              <div className="mb-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1"><Car className="h-4 w-4" /><span className="text-sm">Veículo</span></div>
                <p className="font-medium">{bookingDetails.vehicles?.brand} {bookingDetails.vehicles?.model} {bookingDetails.vehicles?.year}</p>
              </div>
              <div className="mb-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1"><Calendar className="h-4 w-4" /><span className="text-sm">Período</span></div>
                <p className="font-medium">{format(new Date(bookingDetails.start_date), "dd/MM/yyyy")} - {format(new Date(bookingDetails.end_date), "dd/MM/yyyy")}</p>
                <p className="text-sm text-muted-foreground">{bookingDetails.total_days} dias</p>
              </div>
              <div className="mb-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1"><User className="h-4 w-4" /><span className="text-sm">{bookingDetails.owner_id === user?.id ? "Locatário" : "Proprietário"}</span></div>
                <p className="font-medium">{bookingDetails.profiles?.first_name} {bookingDetails.profiles?.last_name}</p>
              </div>
              <div className="mb-4">
                <Badge variant={
                  bookingDetails.status === "confirmed" ? "default" :
                  bookingDetails.status === "in_progress" ? "secondary" :
                  bookingDetails.status === "completed" ? "outline" : "destructive"
                }>
                  {bookingDetails.status === "confirmed" && "Confirmada"}
                  {bookingDetails.status === "in_progress" && "Em andamento"}
                  {bookingDetails.status === "completed" && "Concluída"}
                  {bookingDetails.status === "cancelled" && "Cancelada"}
                </Badge>
              </div>
              <div className="pt-4 border-t border-border">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-bold">R$ {bookingDetails.total_price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Messages;
