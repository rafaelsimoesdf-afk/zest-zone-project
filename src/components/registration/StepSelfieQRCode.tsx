import { useEffect, useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Camera, Check, Loader2, Smartphone, User, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface SelfieData {
  selfie_image: File | null;
  selfie_preview: string;
}

interface StepSelfieQRCodeProps {
  data: SelfieData;
  onChange: (data: SelfieData) => void;
  errors: Record<string, string>;
}

export const StepSelfieQRCode = ({ data, onChange, errors }: StepSelfieQRCodeProps) => {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [useDirectUpload, setUseDirectUpload] = useState(false);

  const generateSession = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Generate unique token
      const token = crypto.randomUUID();
      
      // Create session in database
      const { error } = await supabase
        .from("selfie_upload_sessions")
        .insert({
          user_id: user.id,
          session_token: token,
          status: "pending",
        });

      if (error) throw error;

      setSessionToken(token);
      const url = `${window.location.origin}/selfie-upload/${token}`;
      setQrUrl(url);
    } catch (err) {
      console.error("Error creating session:", err);
      toast.error("Erro ao gerar QR code");
    } finally {
      setLoading(false);
    }
  };

  // Listen for realtime updates
  useEffect(() => {
    if (!sessionToken) return;

    const channel = supabase
      .channel(`selfie-session-${sessionToken}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "selfie_upload_sessions",
          filter: `session_token=eq.${sessionToken}`,
        },
        async (payload: any) => {
          if (payload.new.status === "completed" && payload.new.selfie_url) {
            // Fetch the image and convert to File for consistency
            try {
              const response = await fetch(payload.new.selfie_url);
              const blob = await response.blob();
              const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
              
              onChange({
                selfie_image: file,
                selfie_preview: payload.new.selfie_url,
              });
              
              toast.success("Selfie recebida do celular!");
            } catch (err) {
              // Just use the URL directly
              onChange({
                selfie_image: null,
                selfie_preview: payload.new.selfie_url,
              });
              toast.success("Selfie recebida do celular!");
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionToken, onChange]);

  // Generate session on mount
  useEffect(() => {
    if (!data.selfie_preview && !useDirectUpload) {
      generateSession();
    }
  }, [user, useDirectUpload]);

  const handleFileChange = (file: File | null) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange({
          selfie_image: file,
          selfie_preview: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // If already has selfie, show it
  if (data.selfie_preview) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-foreground">Selfie de Verificação</h2>
          <p className="text-muted-foreground mt-2">
            Selfie recebida com sucesso!
          </p>
        </div>

        <Card className="max-w-md mx-auto">
          <CardContent className="p-6">
            <div className="relative">
              <img
                src={data.selfie_preview}
                alt="Selfie de verificação"
                className="w-full h-64 object-cover rounded-lg"
              />
              <div className="absolute bottom-2 right-2 bg-green-500 text-white p-1 rounded-full">
                <Check className="h-4 w-4" />
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full mt-4"
              onClick={() => {
                onChange({ selfie_image: null, selfie_preview: "" });
                setSessionToken(null);
                setQrUrl(null);
                generateSession();
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Tirar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Direct upload mode
  if (useDirectUpload) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-foreground">Selfie de Verificação</h2>
          <p className="text-muted-foreground mt-2">
            Tire uma selfie segurando seu documento
          </p>
        </div>

        <Card className={`max-w-md mx-auto ${errors.selfie_image ? "border-destructive" : ""}`}>
          <CardContent className="p-6">
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
            />

            <div
              className="border-2 border-dashed border-border rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => inputRef.current?.click()}
            >
              <div className="relative inline-block">
                <User className="h-16 w-16 text-muted-foreground mb-4" />
                <Camera className="h-6 w-6 text-primary absolute -bottom-1 -right-1 bg-background rounded-full p-1" />
              </div>
              <p className="text-muted-foreground mb-2">
                Clique para tirar uma selfie
              </p>
              <p className="text-xs text-muted-foreground">
                Segure seu documento próximo ao rosto
              </p>
            </div>

            {errors.selfie_image && (
              <p className="text-sm text-destructive flex items-center gap-1 mt-4">
                <AlertCircle className="h-4 w-4" />
                {errors.selfie_image}
              </p>
            )}

            <Button
              type="button"
              variant="link"
              className="w-full mt-4"
              onClick={() => {
                setUseDirectUpload(false);
                generateSession();
              }}
            >
              <Smartphone className="h-4 w-4 mr-2" />
              Usar QR code no celular
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // QR Code mode
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground">Selfie de Verificação</h2>
        <p className="text-muted-foreground mt-2">
          Escaneie o QR code com seu celular para tirar a selfie
        </p>
      </div>

      <Card className={`max-w-md mx-auto ${errors.selfie_image ? "border-destructive" : ""}`}>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Gerando QR code...</p>
            </div>
          ) : qrUrl ? (
            <div className="flex flex-col items-center">
              <div className="bg-white p-4 rounded-lg mb-4">
                <QRCodeSVG value={qrUrl} size={200} />
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Aguardando selfie do celular...</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateSession}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Gerar novo QR code
              </Button>
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
              <p className="text-muted-foreground">Erro ao gerar QR code</p>
              <Button
                type="button"
                variant="outline"
                className="mt-4"
                onClick={generateSession}
              >
                Tentar novamente
              </Button>
            </div>
          )}

          {errors.selfie_image && (
            <p className="text-sm text-destructive flex items-center justify-center gap-1 mt-4">
              <AlertCircle className="h-4 w-4" />
              {errors.selfie_image}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="bg-muted/50 p-4 rounded-lg max-w-md mx-auto">
        <div className="flex items-start gap-2">
          <Smartphone className="h-5 w-5 text-primary mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Como funciona:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Escaneie o QR code com a câmera do celular</li>
              <li>Tire a selfie segurando seu documento</li>
              <li>A selfie aparecerá automaticamente aqui</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="text-center">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setUseDirectUpload(true)}
        >
          <Camera className="h-4 w-4 mr-2" />
          Prefiro enviar diretamente deste dispositivo
        </Button>
      </div>
    </div>
  );
};
