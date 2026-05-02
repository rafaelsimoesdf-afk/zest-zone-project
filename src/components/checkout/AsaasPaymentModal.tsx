import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, CheckCircle2, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { formatCurrencyBRL } from "@/lib/validators";

interface AsaasPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chargeId: string | null;
  asaasPaymentId: string | null;
  billingType: "PIX" | "BOLETO" | "CREDIT_CARD" | "UNDEFINED";
  pixQrCode: string | null;
  pixCopyPaste: string | null;
  invoiceUrl: string | null;
  bankSlipUrl: string | null;
  boletoIdentificationField?: string | null;
  initialStatus?: string;
  value: number;
}

export function AsaasPaymentModal({
  open,
  onOpenChange,
  chargeId,
  billingType,
  pixQrCode,
  pixCopyPaste,
  invoiceUrl,
  bankSlipUrl,
  boletoIdentificationField,
  initialStatus,
  value,
}: AsaasPaymentModalProps) {
  const navigate = useNavigate();
  const [status, setStatus] = useState<string>(initialStatus ?? "PENDING");
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (initialStatus && ["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"].includes(initialStatus)) {
      setConfirmed(true);
    }
  }, [initialStatus]);

  // Quando confirmado (por polling ou initialStatus), fecha modal e redireciona
  useEffect(() => {
    if (!confirmed || !open) return;
    const t = setTimeout(() => {
      onOpenChange(false);
      navigate("/my-bookings");
    }, 1800);
    return () => clearTimeout(t);
  }, [confirmed, open, onOpenChange, navigate]);

  // Polling status
  useEffect(() => {
    if (!open || !chargeId || confirmed) return;
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("asaas_charges")
        .select("status")
        .eq("id", chargeId)
        .maybeSingle();
      if (data) {
        setStatus(data.status);
        if (["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"].includes(data.status)) {
          setConfirmed(true);
          toast.success("Pagamento confirmado! Sua reserva foi criada.");
        }
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [open, chargeId, confirmed, navigate]);

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {billingType === "PIX" && "Pagar com PIX"}
            {billingType === "BOLETO" && "Pagar com Boleto"}
            {billingType === "CREDIT_CARD" && "Pagamento com Cartão"}
          </DialogTitle>
          <DialogDescription>
            Total: <span className="font-bold text-foreground">{formatCurrencyBRL(value)}</span>
          </DialogDescription>
        </DialogHeader>

        {confirmed ? (
          <div className="flex flex-col items-center py-8 gap-4">
            <CheckCircle2 className="w-16 h-16 text-green-500" />
            <p className="text-center font-semibold">Pagamento confirmado!</p>
            <p className="text-center text-sm text-muted-foreground">
              Redirecionando para suas reservas...
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {billingType === "PIX" && (
              <>
                {pixQrCode && (
                  <div className="flex justify-center">
                    <img src={pixQrCode} alt="QR Code PIX" className="w-64 h-64 border rounded-lg" />
                  </div>
                )}
                {pixCopyPaste && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">PIX Copia e Cola:</p>
                    <div className="flex gap-2">
                      <Input value={pixCopyPaste} readOnly className="font-mono text-xs" />
                      <Button size="icon" variant="outline" onClick={() => copy(pixCopyPaste, "Código PIX")}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground text-center">
                  Após o pagamento, sua reserva será criada automaticamente.
                </p>
              </>
            )}

            {billingType === "BOLETO" && (
              <>
                {boletoIdentificationField && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Linha digitável:</p>
                    <div className="flex gap-2">
                      <Input
                        value={boletoIdentificationField}
                        readOnly
                        className="font-mono text-xs"
                      />
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => copy(boletoIdentificationField, "Linha digitável")}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Copie e pague no app do seu banco. A confirmação leva até 3 dias úteis.
                    </p>
                  </div>
                )}

                {bankSlipUrl && (
                  <Button asChild variant="outline" className="w-full">
                    <a href={bankSlipUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Baixar PDF do boleto
                    </a>
                  </Button>
                )}
              </>
            )}

            {billingType === "CREDIT_CARD" && (
              <>
                <div className="flex flex-col items-center py-4 gap-3">
                  <Loader2 className="w-10 h-10 animate-spin text-primary" />
                  <p className="text-center font-medium">Processando pagamento…</p>
                  <p className="text-center text-xs text-muted-foreground">
                    Aguardando confirmação da operadora do cartão.
                  </p>
                </div>
                {invoiceUrl && (
                  <Button asChild variant="link" className="w-full text-xs">
                    <a href={invoiceUrl} target="_blank" rel="noopener noreferrer">
                      Ver comprovante (opcional)
                    </a>
                  </Button>
                )}
              </>
            )}

            {billingType !== "CREDIT_CARD" && (
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                Aguardando confirmação… (Status: {status})
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
