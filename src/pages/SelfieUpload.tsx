import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Check, Upload, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

const SelfieUpload = () => {
  const { sessionToken } = useParams<{ sessionToken: string }>();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [sessionValid, setSessionValid] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      if (!sessionToken) {
        setError("Token de sessão inválido");
        setLoading(false);
        return;
      }

      try {
        // Use edge function instead of direct table query (no public access to table)
        const { data, error: fnError } = await supabase.functions.invoke("check-selfie-session", {
          body: { sessionToken },
        });

        if (fnError || !data) {
          setError("Sessão não encontrada ou expirada");
          setLoading(false);
          return;
        }

        if (data.completed) {
          setSuccess(true);
          setLoading(false);
          return;
        }

        if (data.expired) {
          setError("Sessão expirada. Por favor, gere um novo QR code.");
          setLoading(false);
          return;
        }

        if (data.error) {
          setError(data.error);
          setLoading(false);
          return;
        }

        setSessionValid(true);
        setLoading(false);
      } catch {
        setError("Erro ao verificar sessão");
        setLoading(false);
      }
    };

    checkSession();
  }, [sessionToken]);

  const handleFileChange = async (file: File | null) => {
    if (!file || !sessionValid) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!preview || !sessionValid) return;

    setUploading(true);

    try {
      const response = await fetch(preview);
      const blob = await response.blob();

      const formData = new FormData();
      formData.append("file", blob, "selfie.jpg");
      formData.append("sessionToken", sessionToken || "");

      const uploadResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-selfie`,
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(result.error || "Falha no upload");
      }

      setSuccess(true);
      toast.success("Selfie enviada com sucesso!");
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error("Erro ao enviar selfie. Tente novamente.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h1 className="text-xl font-bold text-foreground mb-2">Erro</h1>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-xl font-bold text-foreground mb-2">Selfie Enviada!</h1>
            <p className="text-muted-foreground">
              Você pode fechar esta página. O cadastro continuará automaticamente no computador.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <Camera className="h-12 w-12 text-primary mx-auto mb-4" />
            <h1 className="text-xl font-bold text-foreground">Selfie de Verificação</h1>
            <p className="text-muted-foreground text-sm mt-2">
              Tire uma selfie segurando seu documento
            </p>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
          />

          {preview ? (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={preview}
                  alt="Preview da selfie"
                  className="w-full h-64 object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setPreview(null);
                    inputRef.current?.click();
                  }}
                >
                  Tirar novamente
                </Button>
              </div>
              <Button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Enviar Selfie
                  </>
                )}
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => inputRef.current?.click()}
              className="w-full h-32 flex-col gap-2"
              variant="outline"
            >
              <Camera className="h-8 w-8" />
              <span>Tirar Selfie</span>
            </Button>
          )}

          <div className="bg-muted/50 p-4 rounded-lg mt-6">
            <p className="text-sm text-muted-foreground font-medium mb-2">Instruções:</p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>Segure seu documento ao lado do rosto</li>
              <li>Certifique-se de que o documento está legível</li>
              <li>Seu rosto deve estar bem visível</li>
              <li>Use boa iluminação</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SelfieUpload;
