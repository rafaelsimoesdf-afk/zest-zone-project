import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle, Clock, XCircle } from "lucide-react";

interface VerificationRequiredProps {
  action: string; // e.g., "cadastrar veículos" or "fazer reservas"
  verificationStatus: 'pending' | 'approved' | 'rejected' | null;
}

export const VerificationRequired = ({ action, verificationStatus }: VerificationRequiredProps) => {
  const getContent = () => {
    if (verificationStatus === 'pending') {
      return {
        icon: Clock,
        iconClass: "text-yellow-500 bg-yellow-500/20",
        title: "Cadastro em Análise",
        description: `Seu cadastro está sendo analisado. Você poderá ${action} assim que for aprovado.`,
        showButton: false,
      };
    }
    
    if (verificationStatus === 'rejected') {
      return {
        icon: XCircle,
        iconClass: "text-red-500 bg-red-500/20",
        title: "Cadastro Rejeitado",
        description: `Seu cadastro foi rejeitado. Atualize seus documentos para ${action}.`,
        showButton: true,
        buttonText: "Atualizar Documentos",
      };
    }

    return {
      icon: AlertTriangle,
      iconClass: "text-primary bg-primary/20",
      title: "Verificação Necessária",
      description: `Para ${action}, você precisa completar seu cadastro primeiro.`,
      showButton: true,
      buttonText: "Completar Cadastro",
    };
  };

  const content = getContent();
  const Icon = content.icon;

  return (
    <Card className="max-w-md mx-auto">
      <CardContent className="pt-8 pb-8 text-center">
        <div className={`w-16 h-16 rounded-full ${content.iconClass} mx-auto flex items-center justify-center mb-4`}>
          <Icon className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold mb-2">{content.title}</h2>
        <p className="text-muted-foreground mb-6">{content.description}</p>
        
        {content.showButton && (
          <Button asChild>
            <Link to="/profile">{content.buttonText}</Link>
          </Button>
        )}

        <div className="mt-6 pt-6 border-t">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Shield className="w-4 h-4" />
            <span>Sua segurança é nossa prioridade</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};