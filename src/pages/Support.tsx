import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HelpCircle, Plus, List, Bot } from "lucide-react";
import FaqSection from "@/components/support/FaqSection";
import CreateTicketForm from "@/components/support/CreateTicketForm";
import MyTicketsList from "@/components/support/MyTicketsList";
import SupportBot from "@/components/support/SupportBot";

const Support = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("bot");

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="flex flex-col bg-background">
      <main className="flex-1 container mx-auto px-4 py-8 mt-16">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Central de Ajuda</h1>
            <p className="text-muted-foreground mt-2">
              Como podemos ajudar você hoje?
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="bot" className="flex items-center gap-2">
                <Bot className="h-4 w-4" />
                <span className="hidden sm:inline">Assistente</span>
              </TabsTrigger>
              <TabsTrigger value="faq" className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                <span className="hidden sm:inline">FAQ</span>
              </TabsTrigger>
              <TabsTrigger value="create" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Abrir Chamado</span>
              </TabsTrigger>
              <TabsTrigger value="tickets" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">Meus Chamados</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="bot">
              <SupportBot onOpenTicket={() => setActiveTab("create")} />
            </TabsContent>

            <TabsContent value="faq">
              <FaqSection />
            </TabsContent>

            <TabsContent value="create">
              <CreateTicketForm onSuccess={() => setActiveTab("tickets")} />
            </TabsContent>

            <TabsContent value="tickets">
              <MyTicketsList />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Support;
