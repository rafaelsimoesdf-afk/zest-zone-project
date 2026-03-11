import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  FileText,
  Pen,
  CheckCircle,
  Clock,
  Download,
  Shield,
  Loader2,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import {
  useBookingContract,
  useContractSignatures,
  useCreateContract,
} from "@/hooks/useContracts";
import { supabase } from "@/integrations/supabase/client";

interface ContractSectionProps {
  bookingId: string;
  bookingStatus: string;
  isOwner: boolean;
  isCustomer: boolean;
  userId: string;
  pickupInspectionId?: string;
  pickupInspectionStatus?: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
  draft: { label: "Rascunho", variant: "outline", icon: FileText },
  waiting_renter_signature: { label: "Aguardando Assinatura do Locatário", variant: "secondary", icon: Pen },
  waiting_owner_signature: { label: "Aguardando Assinatura do Proprietário", variant: "secondary", icon: Pen },
  completed: { label: "Assinado", variant: "default", icon: CheckCircle },
  cancelled: { label: "Cancelado", variant: "destructive", icon: AlertCircle },
};

const ContractSection = ({
  bookingId,
  bookingStatus,
  isOwner,
  isCustomer,
  userId,
  pickupInspectionId,
  pickupInspectionStatus,
}: ContractSectionProps) => {
  const { data: contract, isLoading } = useBookingContract(bookingId);
  const { data: signatures } = useContractSignatures(contract?.id || "");
  const createContract = useCreateContract();
  const [signDialogOpen, setSignDialogOpen] = useState(false);
  const [currentSignUrl, setCurrentSignUrl] = useState<string | null>(null);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!contract?.id) return;

    const channel = supabase
      .channel(`contract-${contract.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rental_contracts", filter: `id=eq.${contract.id}` },
        () => {
          // Refetch will happen via react-query invalidation
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [contract?.id]);

  if (!["confirmed", "in_progress", "completed"].includes(bookingStatus)) return null;

  // Only show after pickup inspection is submitted
  if (!pickupInspectionId) return null;

  if (isLoading) return null;

  const config = contract ? statusConfig[contract.status] || statusConfig.draft : null;

  const canCreateContract =
    !contract &&
    pickupInspectionStatus === "pending" &&
    (isCustomer || isOwner);

  const mySignature = signatures?.find((s) => s.signer_id === userId);
  const canSign =
    contract &&
    mySignature?.status === "pending" &&
    ((isCustomer && contract.status === "waiting_renter_signature") ||
      (isOwner && contract.status === "waiting_owner_signature"));

  const handleCreateContract = async () => {
    await createContract.mutateAsync({
      bookingId,
      inspectionId: pickupInspectionId,
    });
  };

  const handleSign = () => {
    if (mySignature?.zapsign_sign_url) {
      setCurrentSignUrl(mySignature.zapsign_sign_url);
      setSignDialogOpen(true);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-3 sm:p-4 flex items-start gap-3">
          <Shield className="w-5 h-5 text-primary mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold text-sm sm:text-base">Contrato Digital</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Contrato de locação com assinatura digital válida conforme MP 2.200-2/2001.
            </p>
          </div>
        </CardContent>
      </Card>

      {!contract && canCreateContract && (
        <Card className="border-dashed border-primary/30">
          <CardContent className="p-4 sm:p-6 text-center space-y-3">
            <FileText className="w-10 h-10 text-primary mx-auto" />
            <div>
              <h4 className="font-semibold text-sm sm:text-base">Gerar Contrato de Locação</h4>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Após a inspeção de entrega, gere o contrato digital para assinatura de ambas as partes.
              </p>
            </div>
            <Button onClick={handleCreateContract} disabled={createContract.isPending} className="w-full sm:w-auto">
              {createContract.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gerando contrato...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Gerar Contrato
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {contract && config && (
        <Card className={contract.status === "completed" ? "border-green-500/30 bg-green-500/5" : "border-amber-500/30 bg-amber-500/5"}>
          <CardHeader className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                <config.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                Contrato de Locação
              </CardTitle>
              <Badge variant={config.variant} className="text-xs flex items-center gap-1">
                <config.icon className="w-3 h-3" />
                {config.label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0 space-y-4">
            {/* Signatures status */}
            {signatures && signatures.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Assinaturas:</p>
                {signatures.map((sig) => (
                  <div
                    key={sig.id}
                    className="flex items-center justify-between bg-muted/50 rounded-lg p-2 sm:p-3"
                  >
                    <div className="flex items-center gap-2">
                      {sig.status === "signed" ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <Clock className="w-4 h-4 text-amber-500" />
                      )}
                      <span className="text-xs sm:text-sm font-medium">
                        {sig.signer_role === "renter" ? "Locatário" : "Proprietário"}
                        {sig.signer_id === userId && " (Você)"}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {sig.status === "signed" && sig.signed_at
                        ? `Assinado em ${new Date(sig.signed_at).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}`
                        : "Pendente"}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Sign button */}
            {canSign && (
              <Button onClick={handleSign} className="w-full">
                <Pen className="w-4 h-4 mr-2" />
                Assinar Contrato
              </Button>
            )}

            {/* Waiting message */}
            {contract.status === "waiting_renter_signature" && isOwner && (
              <p className="text-xs sm:text-sm text-muted-foreground text-center">
                Aguardando o locatário assinar o contrato.
              </p>
            )}
            {contract.status === "waiting_owner_signature" && isCustomer && (
              <p className="text-xs sm:text-sm text-muted-foreground text-center">
                Aguardando o proprietário revisar a inspeção e assinar o contrato.
              </p>
            )}

            {/* Completed - download options */}
            {contract.status === "completed" && (
              <div className="space-y-2">
                {contract.signed_pdf_url && (
                  <a
                    href={contract.signed_pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs sm:text-sm text-primary hover:underline"
                  >
                    <Download className="w-4 h-4" />
                    Baixar contrato assinado (PDF)
                  </a>
                )}
                {contract.audit_trail_url && (
                  <a
                    href={contract.audit_trail_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs sm:text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Trilha de auditoria
                  </a>
                )}
                {contract.document_hash && (
                  <div className="bg-muted/50 rounded-lg p-2 sm:p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Hash do documento (SHA-256):</p>
                    <p className="text-[10px] sm:text-xs font-mono break-all text-foreground/80">
                      {contract.document_hash}
                    </p>
                  </div>
                )}
                {contract.completed_at && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Contrato concluído em{" "}
                    {new Date(contract.completed_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sign Dialog with embedded ZapSign */}
      <Dialog open={signDialogOpen} onOpenChange={setSignDialogOpen}>
        <DialogContent className="max-w-3xl h-[85vh] p-0">
          <DialogHeader className="p-4 pb-2">
            <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Pen className="w-5 h-5 text-primary" />
              Assinar Contrato de Locação
            </DialogTitle>
          </DialogHeader>
          {currentSignUrl && (
            <iframe
              src={currentSignUrl}
              className="w-full flex-1 border-0"
              style={{ height: "calc(85vh - 60px)" }}
              title="Assinatura Digital ZapSign"
              allow="camera; microphone"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContractSection;
