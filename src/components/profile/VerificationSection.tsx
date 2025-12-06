import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileText,
  Car,
  Calendar
} from "lucide-react";
import { Profile } from "@/hooks/useProfile";
import CompleteRegistrationFlow from "./CompleteRegistrationFlow";

interface VerificationSectionProps {
  profile: Profile;
}

export const VerificationSection = ({ profile }: VerificationSectionProps) => {
  const [showRegistration, setShowRegistration] = useState(false);

  const getStatusBadge = () => {
    switch (profile.verification_status) {
      case 'approved':
        return (
          <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Verificado
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
            <Clock className="w-3 h-3 mr-1" />
            Em Análise
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-500/20 text-red-500 border-red-500/30">
            <XCircle className="w-3 h-3 mr-1" />
            Rejeitado
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Não Verificado
          </Badge>
        );
    }
  };

  const getStatusMessage = () => {
    switch (profile.verification_status) {
      case 'approved':
        return (
          <Alert className="border-green-500/30 bg-green-500/10">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-700 dark:text-green-300">
              Seu cadastro foi aprovado! Você pode alugar e cadastrar veículos.
            </AlertDescription>
          </Alert>
        );
      case 'pending':
        return (
          <Alert className="border-yellow-500/30 bg-yellow-500/10">
            <Clock className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="text-yellow-700 dark:text-yellow-300">
              Seu cadastro está em análise. Você será notificado quando for aprovado.
            </AlertDescription>
          </Alert>
        );
      case 'rejected':
        return (
          <Alert className="border-red-500/30 bg-red-500/10">
            <XCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-700 dark:text-red-300">
              Seu cadastro foi rejeitado. Por favor, atualize seus documentos e envie novamente.
            </AlertDescription>
          </Alert>
        );
      default:
        return (
          <Alert className="border-primary/30 bg-primary/10">
            <AlertTriangle className="h-4 w-4 text-primary" />
            <AlertDescription>
              Complete seu cadastro para poder alugar e cadastrar veículos na plataforma.
            </AlertDescription>
          </Alert>
        );
    }
  };

  const getFeatures = () => {
    const isApproved = profile.verification_status === 'approved';
    return [
      {
        icon: Car,
        title: "Cadastrar Veículos",
        description: "Anuncie seus veículos para aluguel",
        enabled: isApproved,
      },
      {
        icon: Calendar,
        title: "Fazer Reservas",
        description: "Alugue veículos de outros usuários",
        enabled: isApproved,
      },
      {
        icon: FileText,
        title: "Contratos Digitais",
        description: "Assine contratos de forma digital",
        enabled: isApproved,
      },
    ];
  };

  if (showRegistration) {
    return (
      <CompleteRegistrationFlow 
        profile={profile} 
        onBack={() => setShowRegistration(false)} 
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Verificação de Cadastro</CardTitle>
            <CardDescription>Complete seu cadastro para usar todas as funcionalidades</CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {getStatusMessage()}

        <div className="grid gap-4 sm:grid-cols-3">
          {getFeatures().map((feature, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                feature.enabled
                  ? "bg-card border-border"
                  : "bg-muted/50 border-dashed"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <feature.icon
                  className={`w-5 h-5 ${
                    feature.enabled ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                <span
                  className={`font-medium ${
                    !feature.enabled && "text-muted-foreground"
                  }`}
                >
                  {feature.title}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>

        {(!profile.verification_status || profile.verification_status === 'rejected') && (
          <Button 
            onClick={() => setShowRegistration(true)}
            className="w-full"
            size="lg"
          >
            {profile.verification_status === 'rejected' 
              ? "Atualizar Documentos" 
              : "Iniciar Verificação"
            }
          </Button>
        )}
      </CardContent>
    </Card>
  );
};