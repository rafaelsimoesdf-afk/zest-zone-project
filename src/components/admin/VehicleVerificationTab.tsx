import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePendingVehicles, useUpdateVehicleStatus } from "@/hooks/useAdmin";
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  Car,
  FileText, 
  Calendar,
  MapPin,
  Fuel,
  Settings,
  User,
  Shield,
  Thermometer,
  Wifi,
  Gauge,
  ExternalLink,
  AlertTriangle,
  Clock,
  DollarSign,
  Palette,
  Users,
  Image
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrencyBRL } from "@/lib/validators";
import { translateVehicleType, translateTransmission, translateFuel } from "@/lib/translations";

const VehicleVerificationTab = () => {
  const { data: pendingVehicles, isLoading } = usePendingVehicles();
  const updateVehicleStatus = useUpdateVehicleStatus();
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleViewDetails = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setIsDialogOpen(true);
  };

  const handleApprove = (vehicleId: string) => {
    updateVehicleStatus.mutate({ vehicleId, status: "approved" });
    setIsDialogOpen(false);
    setSelectedVehicle(null);
  };

  const handleReject = (vehicleId: string) => {
    updateVehicleStatus.mutate({ vehicleId, status: "rejected" });
    setIsDialogOpen(false);
    setSelectedVehicle(null);
  };

  const formatDateTime = (date: string | null) => {
    if (!date) return "N/A";
    return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const DocumentImage = ({ url, label }: { url: string | null; label: string }) => {
    if (!url) {
      return (
        <div className="flex flex-col items-center justify-center p-4 border border-dashed border-muted-foreground/30 rounded-lg bg-muted/20 min-h-[200px]">
          <AlertTriangle className="h-8 w-8 text-muted-foreground mb-2" />
          <span className="text-sm text-muted-foreground">{label} não enviado</span>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">{label}</span>
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="relative group"
        >
          <img 
            src={url} 
            alt={label} 
            className="w-full h-48 object-cover rounded-lg border border-border hover:opacity-90 transition-opacity"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
            <ExternalLink className="h-8 w-8 text-white" />
          </div>
        </a>
      </div>
    );
  };

  const getBooleanBadge = (value: boolean | null) => {
    if (value === null || value === undefined) return <Badge variant="outline">N/A</Badge>;
    return value ? (
      <Badge className="bg-green-500">Sim</Badge>
    ) : (
      <Badge variant="outline">Não</Badge>
    );
  };

  const getVehicleTypeLabel = translateVehicleType;
  const getTransmissionLabel = translateTransmission;
  const getFuelTypeLabel = translateFuel;

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
            <Car className="h-5 w-5" />
            Veículos Pendentes
          </CardTitle>
          <CardDescription>
            Analise e aprove os cadastros de veículos aguardando verificação. Verifique o documento do veículo antes de aprovar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingVehicles?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p className="text-lg font-medium">Nenhum veículo pendente</p>
              <p className="text-sm">Todos os veículos foram analisados</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Proprietário</TableHead>
                  <TableHead>Placa</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Preço/Dia</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingVehicles?.map((vehicle: any) => (
                  <TableRow key={vehicle.id}>
                    <TableCell className="font-medium">
                      {vehicle.brand} {vehicle.model} ({vehicle.year})
                    </TableCell>
                    <TableCell>
                      {vehicle.profiles?.first_name} {vehicle.profiles?.last_name}
                      <div className="text-xs text-muted-foreground">{vehicle.profiles?.email}</div>
                    </TableCell>
                    <TableCell>{vehicle.license_plate}</TableCell>
                    <TableCell>
                      {vehicle.document_url ? (
                        <div className="flex items-center gap-2">
                          <a 
                            href={vehicle.document_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline"
                          >
                            <FileText className="h-4 w-4" />
                            Ver documento
                            <ExternalLink className="h-3 w-3" />
                          </a>
                          {vehicle.document_verified ? (
                            <Badge className="bg-green-500">Verificado</Badge>
                          ) : (
                            <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pendente</Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Não enviado</span>
                      )}
                    </TableCell>
                    <TableCell>{formatCurrencyBRL(vehicle.daily_price)}</TableCell>
                    <TableCell>{format(new Date(vehicle.created_at), "dd/MM/yyyy")}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(vehicle)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Detalhes
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleApprove(vehicle.id)}
                          disabled={updateVehicleStatus.isPending}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(vehicle.id)}
                          disabled={updateVehicleStatus.isPending}
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

      {/* Vehicle Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Análise de Veículo
            </DialogTitle>
            <DialogDescription>
              Revise todos os dados, documentos e fotos do veículo cadastrado
            </DialogDescription>
          </DialogHeader>

          {selectedVehicle ? (
            <ScrollArea className="max-h-[70vh] pr-4">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="basic">Dados Básicos</TabsTrigger>
                  <TabsTrigger value="specs">Especificações</TabsTrigger>
                  <TabsTrigger value="accessories">Acessórios</TabsTrigger>
                  <TabsTrigger value="images">Imagens</TabsTrigger>
                  <TabsTrigger value="documents">Documentos</TabsTrigger>
                </TabsList>

                {/* Basic Data Tab */}
                <TabsContent value="basic" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Car className="h-4 w-4" />
                        Informações do Veículo
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-3 gap-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Marca</span>
                        <p className="font-medium">{selectedVehicle.brand}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Modelo</span>
                        <p className="font-medium">{selectedVehicle.model}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Versão</span>
                        <p className="font-medium">{selectedVehicle.versao || "N/A"}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> Ano Fabricação
                        </span>
                        <p className="font-medium">{selectedVehicle.ano_fabricacao || selectedVehicle.year}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> Ano Modelo
                        </span>
                        <p className="font-medium">{selectedVehicle.ano_modelo || selectedVehicle.year}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Palette className="h-3 w-3" /> Cor
                        </span>
                        <p className="font-medium">{selectedVehicle.color}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Placa</span>
                        <p className="font-medium">{selectedVehicle.license_plate}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Tipo de Veículo</span>
                        <p className="font-medium">{getVehicleTypeLabel(selectedVehicle.vehicle_type)}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Situação</span>
                        <p className="font-medium">{selectedVehicle.situacao_veiculo || "N/A"}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Proprietário
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Nome</span>
                        <p className="font-medium">
                          {selectedVehicle.profiles?.first_name} {selectedVehicle.profiles?.last_name}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Email</span>
                        <p className="font-medium">{selectedVehicle.profiles?.email}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Preço e Localização
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-3 gap-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Preço/Dia</span>
                        <p className="font-medium text-lg text-primary">{formatCurrencyBRL(selectedVehicle.daily_price)}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Caução</span>
                        <p className="font-medium">{selectedVehicle.caucao ? formatCurrencyBRL(selectedVehicle.caucao) : "N/A"}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> Localização
                        </span>
                        <p className="font-medium">
                          {selectedVehicle.city ? `${selectedVehicle.city}, ${selectedVehicle.state}` : "N/A"}
                        </p>
                      </div>
                      <div className="col-span-3">
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Cadastrado em
                        </span>
                        <p className="font-medium">{formatDateTime(selectedVehicle.created_at)}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {selectedVehicle.description && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Descrição</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">{selectedVehicle.description}</p>
                      </CardContent>
                    </Card>
                  )}

                  {selectedVehicle.regras && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Regras de Uso</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">{selectedVehicle.regras}</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Specs Tab */}
                <TabsContent value="specs" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Especificações Técnicas
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-3 gap-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Motor</span>
                        <p className="font-medium">{selectedVehicle.motor || "N/A"}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Fuel className="h-3 w-3" /> Combustível
                        </span>
                        <p className="font-medium">{getFuelTypeLabel(selectedVehicle.fuel_type)}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Transmissão</span>
                        <p className="font-medium">{getTransmissionLabel(selectedVehicle.transmission_type)}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Direção</span>
                        <p className="font-medium">{selectedVehicle.direcao || "N/A"}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Users className="h-3 w-3" /> Lugares
                        </span>
                        <p className="font-medium">{selectedVehicle.seats}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Portas</span>
                        <p className="font-medium">{selectedVehicle.doors}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Gauge className="h-3 w-3" /> Quilometragem
                        </span>
                        <p className="font-medium">{selectedVehicle.mileage?.toLocaleString('pt-BR')} km</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Chassi (Mascarado)</span>
                        <p className="font-medium">{selectedVehicle.chassi_mascarado || "N/A"}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Thermometer className="h-3 w-3" /> Ar Condicionado
                        </span>
                        {getBooleanBadge(selectedVehicle.has_air_conditioning)}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Accessories Tab */}
                <TabsContent value="accessories" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Segurança
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 gap-3">
                        <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <span className="text-sm">Airbag Frontal</span>
                          {getBooleanBadge(selectedVehicle.airbag_frontal)}
                        </div>
                        <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <span className="text-sm">Airbag Lateral</span>
                          {getBooleanBadge(selectedVehicle.airbag_lateral)}
                        </div>
                        <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <span className="text-sm">Alarme</span>
                          {getBooleanBadge(selectedVehicle.alarme)}
                        </div>
                        <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <span className="text-sm">Freios ABS</span>
                          {getBooleanBadge(selectedVehicle.freios_abs)}
                        </div>
                        <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <span className="text-sm">Controle Estabilidade</span>
                          {getBooleanBadge(selectedVehicle.controle_estabilidade)}
                        </div>
                        <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <span className="text-sm">Controle Tração</span>
                          {getBooleanBadge(selectedVehicle.controle_tracao)}
                        </div>
                        <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <span className="text-sm">Sensor Estacionamento</span>
                          {getBooleanBadge(selectedVehicle.sensor_estacionamento)}
                        </div>
                        <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <span className="text-sm">Câmera de Ré</span>
                          {getBooleanBadge(selectedVehicle.camera_re)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Thermometer className="h-4 w-4" />
                        Conforto
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 gap-3">
                        <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <span className="text-sm">Ar Digital</span>
                          {getBooleanBadge(selectedVehicle.ar_digital)}
                        </div>
                        <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <span className="text-sm">Banco Couro</span>
                          {getBooleanBadge(selectedVehicle.banco_couro)}
                        </div>
                        <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <span className="text-sm">Banco Elétrico</span>
                          {getBooleanBadge(selectedVehicle.banco_eletrico)}
                        </div>
                        <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <span className="text-sm">Vidros Elétricos</span>
                          {getBooleanBadge(selectedVehicle.vidros_eletricos)}
                        </div>
                        <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <span className="text-sm">Retrovisores Elétricos</span>
                          {getBooleanBadge(selectedVehicle.retrovisores_eletricos)}
                        </div>
                        <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <span className="text-sm">Direção Elétrica</span>
                          {getBooleanBadge(selectedVehicle.direcao_eletrica)}
                        </div>
                        <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <span className="text-sm">Direção Hidráulica</span>
                          {getBooleanBadge(selectedVehicle.direcao_hidraulica)}
                        </div>
                        <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <span className="text-sm">Piloto Automático</span>
                          {getBooleanBadge(selectedVehicle.piloto_automatico)}
                        </div>
                        <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <span className="text-sm">Sensor Chuva</span>
                          {getBooleanBadge(selectedVehicle.sensor_chuva)}
                        </div>
                        <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <span className="text-sm">Sensor Crepuscular</span>
                          {getBooleanBadge(selectedVehicle.sensor_crepuscular)}
                        </div>
                        <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <span className="text-sm">Start/Stop</span>
                          {getBooleanBadge(selectedVehicle.start_stop)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Wifi className="h-4 w-4" />
                        Tecnologia
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 gap-3">
                        <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <span className="text-sm">Bluetooth</span>
                          {getBooleanBadge(selectedVehicle.bluetooth)}
                        </div>
                        <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <span className="text-sm">Multimídia</span>
                          {getBooleanBadge(selectedVehicle.multimidia)}
                        </div>
                        <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <span className="text-sm">GPS</span>
                          {getBooleanBadge(selectedVehicle.gps)}
                        </div>
                        <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <span className="text-sm">Wi-Fi</span>
                          {getBooleanBadge(selectedVehicle.wifi)}
                        </div>
                        <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <span className="text-sm">Apple CarPlay</span>
                          {getBooleanBadge(selectedVehicle.apple_carplay)}
                        </div>
                        <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <span className="text-sm">Android Auto</span>
                          {getBooleanBadge(selectedVehicle.android_auto)}
                        </div>
                        <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <span className="text-sm">Entrada USB</span>
                          {getBooleanBadge(selectedVehicle.entrada_usb)}
                        </div>
                        <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <span className="text-sm">Carregador Indução</span>
                          {getBooleanBadge(selectedVehicle.carregador_inducao)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Exterior e Outros</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 gap-3">
                        <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <span className="text-sm">Farol LED</span>
                          {getBooleanBadge(selectedVehicle.farol_led)}
                        </div>
                        <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <span className="text-sm">Farol de Milha</span>
                          {getBooleanBadge(selectedVehicle.farol_milha)}
                        </div>
                        <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <span className="text-sm">Rodas Liga Leve</span>
                          {getBooleanBadge(selectedVehicle.rodas_liga_leve)}
                        </div>
                        <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <span className="text-sm">Rack Teto</span>
                          {getBooleanBadge(selectedVehicle.rack_teto)}
                        </div>
                        <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <span className="text-sm">Engate</span>
                          {getBooleanBadge(selectedVehicle.engate)}
                        </div>
                        <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <span className="text-sm">Chave Reserva</span>
                          {getBooleanBadge(selectedVehicle.chave_reserva)}
                        </div>
                        <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <span className="text-sm">Manual do Veículo</span>
                          {getBooleanBadge(selectedVehicle.manual_veiculo)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Images Tab */}
                <TabsContent value="images" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Image className="h-4 w-4" />
                        Fotos do Veículo
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedVehicle.vehicle_images && selectedVehicle.vehicle_images.length > 0 ? (
                        <div className="grid grid-cols-3 gap-4">
                          {selectedVehicle.vehicle_images.map((img: any, index: number) => (
                            <div key={index} className="relative">
                              <DocumentImage 
                                url={img.image_url} 
                                label={img.is_primary ? "Foto Principal" : `Foto ${index + 1}`} 
                              />
                              {img.is_primary && (
                                <Badge className="absolute top-2 right-2 bg-primary">Principal</Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Image className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>Nenhuma imagem cadastrada</p>
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
                        Documento do Veículo (CRLV)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedVehicle.document_url ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-4">
                            <div>
                              <span className="text-sm text-muted-foreground">Status de Verificação</span>
                              <div className="mt-1">
                                {selectedVehicle.document_verified ? (
                                  <Badge className="bg-green-500">Verificado</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pendente</Badge>
                                )}
                              </div>
                            </div>
                            {selectedVehicle.document_verified_at && (
                              <div>
                                <span className="text-sm text-muted-foreground">Verificado em</span>
                                <p className="font-medium">{formatDateTime(selectedVehicle.document_verified_at)}</p>
                              </div>
                            )}
                          </div>
                          <DocumentImage 
                            url={selectedVehicle.document_url} 
                            label="Documento do Veículo" 
                          />
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
                          <p className="text-lg font-medium">Documento não enviado</p>
                          <p className="text-sm">O proprietário ainda não enviou o documento do veículo</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Fechar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleReject(selectedVehicle.id)}
                  disabled={updateVehicleStatus.isPending}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Rejeitar
                </Button>
                <Button
                  variant="default"
                  onClick={() => handleApprove(selectedVehicle.id)}
                  disabled={updateVehicleStatus.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Aprovar Veículo
                </Button>
              </div>
            </ScrollArea>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VehicleVerificationTab;
