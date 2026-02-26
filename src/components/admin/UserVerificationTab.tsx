import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { usePendingUserVerifications, useUserVerificationDetails, useUpdateUserVerificationStatus } from "@/hooks/useAdmin";
import SecureDocumentImage from "@/components/admin/SecureDocumentImage";
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  User, 
  FileText, 
  Camera, 
  MapPin, 
  Car, 
  Calendar,
  Phone,
  Mail,
  CreditCard,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const UserVerificationTab = () => {
  const { data: pendingVerifications, isLoading } = usePendingUserVerifications();
  const updateVerificationStatus = useUpdateUserVerificationStatus();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: verificationDetails, isLoading: isLoadingDetails } = useUserVerificationDetails(selectedUserId);

  const handleViewDetails = (userId: string) => {
    setSelectedUserId(userId);
    setIsDialogOpen(true);
  };

  const handleApprove = (userId: string) => {
    updateVerificationStatus.mutate({ userId, verificationStatus: "approved" });
    setIsDialogOpen(false);
    setSelectedUserId(null);
  };

  const handleReject = (userId: string) => {
    updateVerificationStatus.mutate({ userId, verificationStatus: "rejected" });
    setIsDialogOpen(false);
    setSelectedUserId(null);
  };

  const formatDate = (date: string | null) => {
    if (!date) return "N/A";
    return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
  };

  const formatDateTime = (date: string | null) => {
    if (!date) return "N/A";
    return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const isCNHExpired = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Verificações Pendentes
          </CardTitle>
          <CardDescription>
            Analise e aprove os cadastros de usuários aguardando verificação
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingVerifications?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p className="text-lg font-medium">Nenhuma verificação pendente</p>
              <p className="text-sm">Todos os cadastros foram analisados</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Enviado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingVerifications?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.first_name} {user.last_name}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.cpf || "N/A"}</TableCell>
                    <TableCell>{user.phone_number || "N/A"}</TableCell>
                    <TableCell>{formatDateTime(user.verification_submitted_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(user.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Detalhes
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleApprove(user.id)}
                          disabled={updateVerificationStatus.isPending}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(user.id)}
                          disabled={updateVerificationStatus.isPending}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Rejeitar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Análise de Cadastro
            </DialogTitle>
            <DialogDescription>
              Revise todos os dados e documentos enviados pelo usuário
            </DialogDescription>
          </DialogHeader>

          {isLoadingDetails ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : verificationDetails ? (
            <ScrollArea className="max-h-[70vh] pr-4">
              <Tabs defaultValue="personal" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="personal">Dados Pessoais</TabsTrigger>
                  <TabsTrigger value="address">Endereço</TabsTrigger>
                  <TabsTrigger value="documents">Documentos</TabsTrigger>
                  <TabsTrigger value="cnh">CNH</TabsTrigger>
                  <TabsTrigger value="verification">Verificação</TabsTrigger>
                </TabsList>

                {/* Personal Data Tab */}
                <TabsContent value="personal" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Informações Pessoais
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Nome Completo</span>
                        <p className="font-medium">
                          {verificationDetails.profile?.first_name} {verificationDetails.profile?.last_name}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" /> Email
                        </span>
                        <p className="font-medium">{verificationDetails.profile?.email}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <CreditCard className="h-3 w-3" /> CPF
                        </span>
                        <p className="font-medium">{verificationDetails.profile?.cpf || "N/A"}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" /> Telefone
                        </span>
                        <p className="font-medium">{verificationDetails.profile?.phone_number || "N/A"}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> Data de Nascimento
                        </span>
                        <p className="font-medium">{formatDate(verificationDetails.profile?.birth_date)}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Cadastro Enviado em
                        </span>
                        <p className="font-medium">{formatDateTime(verificationDetails.profile?.verification_submitted_at)}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Termos e Consentimentos</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2">
                        {verificationDetails.profile?.terms_accepted ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span>Termos de Uso aceitos</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {verificationDetails.profile?.lgpd_accepted ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span>LGPD aceito</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {verificationDetails.profile?.data_accuracy_declared ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span>Veracidade dos dados declarada</span>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Address Tab */}
                <TabsContent value="address" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Endereço
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {verificationDetails.address ? (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-sm text-muted-foreground">CEP</span>
                            <p className="font-medium">{verificationDetails.address.zip_code}</p>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">Rua</span>
                            <p className="font-medium">{verificationDetails.address.street}</p>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">Número</span>
                            <p className="font-medium">{verificationDetails.address.number}</p>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">Complemento</span>
                            <p className="font-medium">{verificationDetails.address.complement || "N/A"}</p>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">Bairro</span>
                            <p className="font-medium">{verificationDetails.address.neighborhood}</p>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">Cidade</span>
                            <p className="font-medium">{verificationDetails.address.city}</p>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">Estado</span>
                            <p className="font-medium">{verificationDetails.address.state}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>Endereço não cadastrado</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Documents Tab */}
                <TabsContent value="documents" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Documento de Identidade
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {verificationDetails.identityDoc ? (
                        <div className="space-y-4">
                          <div>
                            <span className="text-sm text-muted-foreground">Tipo de Documento</span>
                            <p className="font-medium uppercase">{verificationDetails.identityDoc.document_type}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <SecureDocumentImage 
                              url={verificationDetails.identityDoc.front_image_url} 
                              label="Frente do Documento" 
                            />
                            <SecureDocumentImage 
                              url={verificationDetails.identityDoc.back_image_url} 
                              label="Verso do Documento" 
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>Documento de identidade não enviado</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Comprovante de Residência
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {verificationDetails.proofOfResidence ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-sm text-muted-foreground">Tipo de Comprovante</span>
                              <p className="font-medium">{verificationDetails.proofOfResidence.document_type}</p>
                            </div>
                            <div>
                              <span className="text-sm text-muted-foreground">Data de Emissão</span>
                              <p className="font-medium">{formatDate(verificationDetails.proofOfResidence.issue_date)}</p>
                            </div>
                          </div>
                          <SecureDocumentImage 
                            url={verificationDetails.proofOfResidence.document_url} 
                            label="Comprovante de Residência" 
                          />
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>Comprovante de residência não enviado</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* CNH Tab */}
                <TabsContent value="cnh" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Car className="h-4 w-4" />
                        Carteira Nacional de Habilitação
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {verificationDetails.cnh ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <span className="text-sm text-muted-foreground">Número da CNH</span>
                              <p className="font-medium">{verificationDetails.cnh.cnh_number}</p>
                            </div>
                            <div>
                              <span className="text-sm text-muted-foreground">Categoria</span>
                              <p className="font-medium uppercase">{verificationDetails.cnh.category}</p>
                            </div>
                            <div>
                              <span className="text-sm text-muted-foreground">Data de Emissão</span>
                              <p className="font-medium">{formatDate(verificationDetails.cnh.issue_date)}</p>
                            </div>
                            <div>
                              <span className="text-sm text-muted-foreground">Data de Validade</span>
                              <div className="flex items-center gap-2">
                                <p className={`font-medium ${isCNHExpired(verificationDetails.cnh.expiry_date) ? 'text-destructive' : ''}`}>
                                  {formatDate(verificationDetails.cnh.expiry_date)}
                                </p>
                                {isCNHExpired(verificationDetails.cnh.expiry_date) && (
                                  <Badge variant="destructive">Vencida</Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          <Separator />

                          {verificationDetails.cnh.digital_image_url ? (
                            <div>
                              <SecureDocumentImage 
                                url={verificationDetails.cnh.digital_image_url} 
                                label="CNH Digital" 
                              />
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-4">
                              <SecureDocumentImage 
                                url={verificationDetails.cnh.front_image_url} 
                                label="CNH Frente" 
                              />
                              <SecureDocumentImage 
                                url={verificationDetails.cnh.back_image_url} 
                                label="CNH Verso" 
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Car className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>CNH não enviada</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Verification Tab (Selfie) */}
                <TabsContent value="verification" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Camera className="h-4 w-4" />
                        Selfie com Documento
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {verificationDetails.selfie ? (
                        <SecureDocumentImage 
                          url={verificationDetails.selfie.selfie_url} 
                          label="Selfie segurando documento" 
                        />
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Camera className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>Selfie não enviada</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-6 sticky bottom-0 bg-background pt-4 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Fechar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => selectedUserId && handleReject(selectedUserId)}
                  disabled={updateVerificationStatus.isPending}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Rejeitar Cadastro
                </Button>
                <Button
                  onClick={() => selectedUserId && handleApprove(selectedUserId)}
                  disabled={updateVerificationStatus.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Aprovar Cadastro
                </Button>
              </div>
            </ScrollArea>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserVerificationTab;
