import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Shield, 
  ExternalLink, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Clock,
  Fingerprint,
  FileText,
  Camera,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StepDiditVerificationProps {
  onVerificationComplete: () => void;
  errors: Record<string, string>;
}

type VerificationStatus = "idle" | "loading" | "pending" | "approved" | "declined" | "in_review";

export const StepDiditVerification = ({ onVerificationComplete, errors }: StepDiditVerificationProps) => {
  const [status, setStatus] = useState<VerificationStatus>("idle");
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [sessionUrl, setSessionUrl] = useState<string | null>(null);

  // Check for existing verification session on mount
  useEffect(() => {
    checkExistingSession();
  }, []);

  // Check URL params for callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("didit_verification") === "complete") {
      setStatus("pending");
      // Clean URL
      const url = new URL(window.location.href);
      url.searchParams.delete("didit_verification");
      url.searchParams.delete("verificationSessionId");
      url.searchParams.delete("status");
      window.history.replaceState({}, "", url.toString());
      // Poll for status
      pollVerificationStatus();
    }
  }, []);

  const checkExistingSession = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .rpc("get_didit_session_status" as never, { _user_id: user.id } as never) as { data: { status: string; session_url: string } | null; error: unknown };

      if (error || !data) return;

      const sessionStatus = data.status;
      const url = data.session_url;
      if (sessionStatus === "Approved") {
        setStatus("approved");
        onVerificationComplete();
      } else if (sessionStatus === "Declined") {
        setStatus("declined");
      } else if (sessionStatus === "In Review") {
        setStatus("in_review");
      } else if (sessionStatus === "In Progress" || sessionStatus === "Not Started") {
        setStatus("pending");
        setSessionUrl(url);
      }
    } catch (err) {
      console.error("Error checking existing session:", err);
    }
  };

  const pollVerificationStatus = async () => {
    let attempts = 0;
    const maxAttempts = 30;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const poll = async () => {
      attempts++;
      const { data } = await supabase
        .rpc("get_didit_session_status" as never, { _user_id: user.id } as never) as { data: { status: string } | null; error: unknown };

      if (data) {
        const sessionStatus = data.status;
        if (sessionStatus === "Approved") {
          setStatus("approved");
          onVerificationComplete();
          return;
        } else if (sessionStatus === "Declined") {
          setStatus("declined");
          return;
        } else if (sessionStatus === "In Review") {
          setStatus("in_review");
          return;
        }
      }

      if (attempts < maxAttempts) {
        setTimeout(poll, 5000);
      }
    };

    poll();
  };

  const handleStartVerification = async () => {
    setIsCreatingSession(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-didit-session");

      if (error) throw error;
      if (!data?.url) throw new Error("URL de verificação não recebida");

      setSessionUrl(data.url);
      setStatus("pending");
      
      // Open in new tab
      window.open(data.url, "_blank");
      
      toast.info("Verificação aberta em nova aba. Complete o processo e volte aqui.");
      
      // Start polling
      pollVerificationStatus();
    } catch (error: unknown) {
      console.error("Error creating session:", error);
      const msg = error instanceof Error ? error.message : "Erro ao iniciar verificação";
      toast.error(msg);
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleRetry = () => {
    setStatus("idle");
    setSessionUrl(null);
  };

  if (status === "approved") {
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-foreground">Verificação de Identidade</h2>
          <p className="text-muted-foreground mt-2">Sua identidade foi verificada com sucesso</p>
        </div>

        <Card className="max-w-md mx-auto border-green-500/50">
          <CardContent className="p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Verificação Aprovada!</h3>
            <p className="text-sm text-muted-foreground">
              Seus documentos e selfie foram validados com sucesso pelo Datavalid.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "declined") {
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-foreground">Verificação de Identidade</h2>
          <p className="text-muted-foreground mt-2">Houve um problema com sua verificação</p>
        </div>

        <Card className="max-w-md mx-auto border-destructive/50">
          <CardContent className="p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mb-4">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Verificação Recusada</h3>
            <p className="text-sm text-muted-foreground mb-4">
              A verificação não foi aprovada. Isso pode ocorrer por fotos de baixa qualidade ou dados inconsistentes.
            </p>
            <Button onClick={handleRetry} variant="outline">
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "in_review") {
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-foreground">Verificação de Identidade</h2>
          <p className="text-muted-foreground mt-2">Sua verificação está sendo analisada</p>
        </div>

        <Card className="max-w-md mx-auto border-yellow-500/50">
          <CardContent className="p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Em Análise</h3>
            <p className="text-sm text-muted-foreground">
              Seus documentos estão sendo analisados. Você será notificado quando a verificação for concluída.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-foreground">Verificação de Identidade</h2>
          <p className="text-muted-foreground mt-2">Complete a verificação na janela aberta</p>
        </div>

        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Aguardando Verificação</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Complete o processo de verificação na aba que foi aberta. Esta página será atualizada automaticamente.
            </p>
            {sessionUrl && (
              <Button variant="outline" onClick={() => window.open(sessionUrl, "_blank")}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Reabrir Verificação
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground">Verificação de Identidade</h2>
        <p className="text-muted-foreground mt-2">
          Valide seu documento e selfie com verificação automática
        </p>
      </div>

      <Card className="max-w-md mx-auto">
        <CardContent className="p-6 space-y-6">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Verificação Segura via Didit
            </h3>
            <p className="text-sm text-muted-foreground">
              Utilizamos a Didit com Datavalid (Serpro) para validar sua identidade de forma rápida e segura.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <FileText className="h-5 w-5 text-primary flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Documento de Identidade</p>
                <p className="text-xs text-muted-foreground">RG, CNH ou outro documento com foto</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Camera className="h-5 w-5 text-primary flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Selfie com Liveness</p>
                <p className="text-xs text-muted-foreground">Prova de vida para garantir sua segurança</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Fingerprint className="h-5 w-5 text-primary flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Validação Datavalid</p>
                <p className="text-xs text-muted-foreground">Consulta aos dados oficiais do governo</p>
              </div>
            </div>
          </div>

          {errors.didit_verification && (
            <p className="text-sm text-destructive text-center">{errors.didit_verification}</p>
          )}

          <Button 
            onClick={handleStartVerification} 
            className="w-full" 
            size="lg"
            disabled={isCreatingSession}
          >
            {isCreatingSession ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Iniciando...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Iniciar Verificação
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Ao continuar, você concorda com a{" "}
            <a href="https://didit.me/terms/verification-privacy-notice" target="_blank" rel="noopener noreferrer" className="underline">
              Política de Privacidade da Didit
            </a>{" "}
            e os{" "}
            <a href="https://didit.me/terms/identity-verification" target="_blank" rel="noopener noreferrer" className="underline">
              Termos de Verificação
            </a>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
