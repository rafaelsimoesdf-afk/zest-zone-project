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
  value: number;
}

export function AsaasPaymentModal({
  open,
  onOpenChange,
  chargeId,
  asaasPaymentId,
  billingType,
  pixQrCode,
  pixCopyPaste,
  invoiceUrl,
  bankSlipUrl,
  value,
}: AsaasPaymentModalProps) {
  const navigate = useNavigate();
  const [status, setStatus] = useState<string>("PENDING");
  const [confirmed, setConfirmed] = useState(false);

  // Polling do status da cobrança
  useEffect(() => {
    if (!open || !chargeId || confirmed) return;

    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("asaas_charges")
        .select("status, booking_id")
        .eq("id", chargeId)
        .maybeSingle();

      if (data) {
        setStatus(data.status);
        if (["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"].includes(data.status)) {
          setConfirmed(true);
          toast.success("Pagamento confirmado! Sua reserva foi criada.");
          setTimeout(() => {
            navigate("/my-bookings");
          }, 1500);
        }
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [open, chargeId, confirmed, navigate]);

  const copyPix = () => {
    if (!pixCopyPaste) return;
    navigator.clipboard.writeText(pixCopyPaste);
    toast.success("Código PIX copiado!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {billingType === "PIX" && "Pagar com PIX"}
            {billingType === "BOLETO" && "Pagar com Boleto"}
            {billingType === "CREDIT_CARD" && "Pagar com Cartão"}
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
                      <Button size="icon" variant="outline" onClick={copyPix}>
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

            {billingType === "BOLETO" && bankSlipUrl && (
              <>
                <p className="text-sm text-muted-foreground">
                  Clique no botão abaixo para abrir e imprimir o boleto. O pagamento pode levar até 3 dias úteis para ser confirmado.
                </p>
                <Button asChild className="w-full">
                  <a href={bankSlipUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Abrir Boleto
                  </a>
                </Button>
              </>
            )}

            {billingType === "CREDIT_CARD" && invoiceUrl && (
              <>
                <p className="text-sm text-muted-foreground">
                  Você será redirecionado para a página segura de pagamento da Asaas.
                </p>
                <Button asChild className="w-full">
                  <a href={invoiceUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Pagar com Cartão
                  </a>
                </Button>
              </>
            )}

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              Aguardando confirmação do pagamento... (Status: {status})
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
