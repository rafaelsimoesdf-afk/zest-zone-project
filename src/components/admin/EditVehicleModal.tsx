import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Shield, Sofa, Cpu, Car, Package, FileText, Upload, X, ExternalLink } from "lucide-react";
import { useBrands, useModels } from "@/hooks/useBrands";
import { brazilianStates, getCitiesForState } from "@/hooks/useBrazilLocations";
import { CurrencyInput } from "@/components/ui/currency-input";
import { useAuth } from "@/contexts/AuthContext";

interface Vehicle {
  id: string;
  owner_id?: string;
  brand: string;
  model: string;
  brand_id?: string;
  model_id?: string;
  year: number;
  ano_fabricacao?: number;
  ano_modelo?: number;
  versao?: string;
  color: string;
  license_plate: string;
  daily_price: number;
  caucao?: number;
  seats: number;
  doors: number;
  mileage: number;
  motor?: string;
  direcao?: string;
  fuel_type: string;
  transmission_type: string;
  vehicle_type: string;
  description: string | null;
  regras?: string | null;
  status: string;
  city: string | null;
  state: string | null;
  chassi_mascarado?: string;
  situacao_veiculo?: string;
  document_url?: string | null;
  // Security accessories
  airbag_frontal?: boolean;
  airbag_lateral?: boolean;
  freios_abs?: boolean;
  controle_tracao?: boolean;
  controle_estabilidade?: boolean;
  camera_re?: boolean;
  sensor_estacionamento?: boolean;
  alarme?: boolean;
  // Comfort accessories
  has_air_conditioning?: boolean;
  ar_digital?: boolean;
  direcao_hidraulica?: boolean;
  direcao_eletrica?: boolean;
  vidros_eletricos?: boolean;
  retrovisores_eletricos?: boolean;
  banco_couro?: boolean;
  banco_eletrico?: boolean;
  // Technology accessories
  multimidia?: boolean;
  bluetooth?: boolean;
  android_auto?: boolean;
  apple_carplay?: boolean;
  gps?: boolean;
  wifi?: boolean;
  entrada_usb?: boolean;
  carregador_inducao?: boolean;
  piloto_automatico?: boolean;
  start_stop?: boolean;
  // Exterior accessories
  rodas_liga_leve?: boolean;
  farol_led?: boolean;
  farol_milha?: boolean;
  rack_teto?: boolean;
  engate?: boolean;
  // Other accessories
  chave_reserva?: boolean;
  manual_veiculo?: boolean;
  sensor_chuva?: boolean;
  sensor_crepuscular?: boolean;
}

interface EditVehicleModalProps {
  vehicle: Vehicle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAdmin?: boolean;
}

const VEHICLE_STATUSES = [
  { value: "pending", label: "Pendente" },
  { value: "approved", label: "Aprovado" },
  { value: "rejected", label: "Rejeitado" },
  { value: "suspended", label: "Suspenso" },
  { value: "inactive", label: "Inativo" },
];

export default function EditVehicleModal({ vehicle, open, onOpenChange, isAdmin = false }: EditVehicleModalProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  const { data: brands } = useBrands();
  const [selectedBrandId, setSelectedBrandId] = useState<string>("");
  const { data: models } = useModels(selectedBrandId);

  // Document upload state
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentPreview, setDocumentPreview] = useState<string | null>(null);
  const [existingDocumentUrl, setExistingDocumentUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    // Basic info
    brand_id: "",
    model_id: "",
    versao: "",
    ano_fabricacao: new Date().getFullYear(),
    ano_modelo: new Date().getFullYear(),
    color: "",
    vehicle_type: "sedan",
    motor: "",
    fuel_type: "flex",
    transmission_type: "manual",
    doors: 4,
    direcao: "hidraulica",
    mileage: 0,
    license_plate: "",
    seats: 5,
    
    // Location
    city: "",
    state: "",
    
    // Financial
    daily_price: 0,
    caucao: 0,
    
    // Documentation
    chassi_mascarado: "",
    situacao_veiculo: "regular",
    
    // Description and rules
    description: "",
    regras: "",
    
    // Status (only for admin)
    status: "pending",
    
    // Security accessories
    airbag_frontal: false,
    airbag_lateral: false,
    freios_abs: false,
    controle_tracao: false,
    controle_estabilidade: false,
    camera_re: false,
    sensor_estacionamento: false,
    alarme: false,
    
    // Comfort accessories
    has_air_conditioning: false,
    ar_digital: false,
    direcao_hidraulica: false,
    direcao_eletrica: false,
    vidros_eletricos: false,
    retrovisores_eletricos: false,
    banco_couro: false,
    banco_eletrico: false,
    
    // Technology accessories
    multimidia: false,
    bluetooth: false,
    android_auto: false,
    apple_carplay: false,
    gps: false,
    wifi: false,
    entrada_usb: false,
    carregador_inducao: false,
    piloto_automatico: false,
    start_stop: false,
    
    // Exterior accessories
    rodas_liga_leve: false,
    farol_led: false,
    farol_milha: false,
    rack_teto: false,
    engate: false,
    
    // Other accessories
    chave_reserva: false,
    manual_veiculo: false,
    sensor_chuva: false,
    sensor_crepuscular: false,
  });

  useEffect(() => {
    if (vehicle) {
      console.log('EditVehicleModal - vehicle data:', vehicle);
      console.log('EditVehicleModal - document_url:', vehicle.document_url);
      
      const brandId = vehicle.brand_id || "";
      setSelectedBrandId(brandId);
      
      // Reset document state
      setDocumentFile(null);
      setDocumentPreview(null);
      setExistingDocumentUrl(vehicle.document_url || null);
      console.log('EditVehicleModal - existingDocumentUrl set to:', vehicle.document_url || null);
      
      setFormData({
        brand_id: brandId,
        model_id: vehicle.model_id || "",
        versao: vehicle.versao || "",
        ano_fabricacao: vehicle.ano_fabricacao || vehicle.year || new Date().getFullYear(),
        ano_modelo: vehicle.ano_modelo || vehicle.year || new Date().getFullYear(),
        color: vehicle.color || "",
        vehicle_type: vehicle.vehicle_type || "sedan",
        motor: vehicle.motor || "",
        fuel_type: vehicle.fuel_type || "flex",
        transmission_type: vehicle.transmission_type || "manual",
        doors: vehicle.doors || 4,
        direcao: vehicle.direcao || "hidraulica",
        mileage: vehicle.mileage || 0,
        license_plate: vehicle.license_plate || "",
        seats: vehicle.seats || 5,
        city: vehicle.city || "",
        state: vehicle.state || "",
        daily_price: vehicle.daily_price || 0,
        caucao: vehicle.caucao || 0,
        chassi_mascarado: vehicle.chassi_mascarado || "",
        situacao_veiculo: vehicle.situacao_veiculo || "regular",
        description: vehicle.description || "",
        regras: vehicle.regras || "",
        status: vehicle.status || "pending",
        airbag_frontal: vehicle.airbag_frontal || false,
        airbag_lateral: vehicle.airbag_lateral || false,
        freios_abs: vehicle.freios_abs || false,
        controle_tracao: vehicle.controle_tracao || false,
        controle_estabilidade: vehicle.controle_estabilidade || false,
        camera_re: vehicle.camera_re || false,
        sensor_estacionamento: vehicle.sensor_estacionamento || false,
        alarme: vehicle.alarme || false,
        has_air_conditioning: vehicle.has_air_conditioning || false,
        ar_digital: vehicle.ar_digital || false,
        direcao_hidraulica: vehicle.direcao_hidraulica || false,
        direcao_eletrica: vehicle.direcao_eletrica || false,
        vidros_eletricos: vehicle.vidros_eletricos || false,
        retrovisores_eletricos: vehicle.retrovisores_eletricos || false,
        banco_couro: vehicle.banco_couro || false,
        banco_eletrico: vehicle.banco_eletrico || false,
        multimidia: vehicle.multimidia || false,
        bluetooth: vehicle.bluetooth || false,
        android_auto: vehicle.android_auto || false,
        apple_carplay: vehicle.apple_carplay || false,
        gps: vehicle.gps || false,
        wifi: vehicle.wifi || false,
        entrada_usb: vehicle.entrada_usb || false,
        carregador_inducao: vehicle.carregador_inducao || false,
        piloto_automatico: vehicle.piloto_automatico || false,
        start_stop: vehicle.start_stop || false,
        rodas_liga_leve: vehicle.rodas_liga_leve || false,
        farol_led: vehicle.farol_led || false,
        farol_milha: vehicle.farol_milha || false,
        rack_teto: vehicle.rack_teto || false,
        engate: vehicle.engate || false,
        chave_reserva: vehicle.chave_reserva || false,
        manual_veiculo: vehicle.manual_veiculo || false,
        sensor_chuva: vehicle.sensor_chuva || false,
        sensor_crepuscular: vehicle.sensor_crepuscular || false,
      });
    }
  }, [vehicle]);

  const handleCheckboxChange = (field: string, checked: boolean) => {
    setFormData({ ...formData, [field]: checked });
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Arquivo muito grande. Máximo de 10MB.");
        return;
      }
      setDocumentFile(file);
      setDocumentPreview(URL.createObjectURL(file));
    }
  };

  const removeDocument = () => {
    setDocumentFile(null);
    setDocumentPreview(null);
  };

  const handleSaveClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setShowConfirmDialog(true);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!vehicle) return;

    setIsLoading(true);

    try {
      // Get brand and model names for the text fields
      const selectedBrand = brands?.find(b => b.id === formData.brand_id);
      const selectedModel = models?.find(m => m.id === formData.model_id);

      // Upload new document if provided
      let documentUrl = existingDocumentUrl;
      if (documentFile && user) {
        const fileExt = documentFile.name.split('.').pop();
        const documentFileName = `${vehicle.owner_id || user.id}/${vehicle.id}/document-${Date.now()}.${fileExt}`;
        
        const { error: docUploadError } = await supabase.storage
          .from('vehicle-images')
          .upload(documentFileName, documentFile);

        if (docUploadError) {
          console.error('Document upload error:', docUploadError);
          toast.error('Erro ao enviar documento');
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('vehicle-images')
            .getPublicUrl(documentFileName);
          
          documentUrl = publicUrl;
        }
      }

      const updateData: any = {
        brand_id: formData.brand_id || null,
        model_id: formData.model_id || null,
        brand: selectedBrand?.name || vehicle.brand,
        model: selectedModel?.name || vehicle.model,
        versao: formData.versao || null,
        year: formData.ano_fabricacao,
        ano_fabricacao: formData.ano_fabricacao,
        ano_modelo: formData.ano_modelo,
        color: formData.color,
        vehicle_type: formData.vehicle_type as any,
        motor: formData.motor || null,
        fuel_type: formData.fuel_type as any,
        transmission_type: formData.transmission_type as any,
        doors: formData.doors,
        direcao: formData.direcao || null,
        mileage: formData.mileage,
        license_plate: formData.license_plate,
        seats: formData.seats,
        city: formData.city || null,
        state: formData.state || null,
        daily_price: formData.daily_price,
        caucao: formData.caucao,
        chassi_mascarado: formData.chassi_mascarado || null,
        situacao_veiculo: formData.situacao_veiculo || null,
        description: formData.description || null,
        regras: formData.regras || null,
        document_url: documentUrl,
        airbag_frontal: formData.airbag_frontal,
        airbag_lateral: formData.airbag_lateral,
        freios_abs: formData.freios_abs,
        controle_tracao: formData.controle_tracao,
        controle_estabilidade: formData.controle_estabilidade,
        camera_re: formData.camera_re,
        sensor_estacionamento: formData.sensor_estacionamento,
        alarme: formData.alarme,
        has_air_conditioning: formData.has_air_conditioning,
        ar_digital: formData.ar_digital,
        direcao_hidraulica: formData.direcao_hidraulica,
        direcao_eletrica: formData.direcao_eletrica,
        vidros_eletricos: formData.vidros_eletricos,
        retrovisores_eletricos: formData.retrovisores_eletricos,
        banco_couro: formData.banco_couro,
        banco_eletrico: formData.banco_eletrico,
        multimidia: formData.multimidia,
        bluetooth: formData.bluetooth,
        android_auto: formData.android_auto,
        apple_carplay: formData.apple_carplay,
        gps: formData.gps,
        wifi: formData.wifi,
        entrada_usb: formData.entrada_usb,
        carregador_inducao: formData.carregador_inducao,
        piloto_automatico: formData.piloto_automatico,
        start_stop: formData.start_stop,
        rodas_liga_leve: formData.rodas_liga_leve,
        farol_led: formData.farol_led,
        farol_milha: formData.farol_milha,
        rack_teto: formData.rack_teto,
        engate: formData.engate,
        chave_reserva: formData.chave_reserva,
        manual_veiculo: formData.manual_veiculo,
        sensor_chuva: formData.sensor_chuva,
        sensor_crepuscular: formData.sensor_crepuscular,
      };

      // If admin, keep the status they selected; otherwise set to pending
      if (isAdmin) {
        updateData.status = formData.status as any;
      } else {
        updateData.status = "pending";
      }

      const { error } = await supabase
        .from("vehicles")
        .update(updateData)
        .eq("id", vehicle.id);

      if (error) throw error;

      toast.success(isAdmin ? "Veículo atualizado com sucesso!" : "Veículo atualizado! Aguardando aprovação.");
      queryClient.invalidateQueries({ queryKey: ["admin-all-vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-pending-vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["myVehicles"] });
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      onOpenChange(false);
      setShowConfirmDialog(false);
    } catch (error: any) {
      toast.error("Erro ao atualizar veículo: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="pb-2 sm:pb-4">
            <DialogTitle className="text-base sm:text-lg">Editar Veículo</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Edite as informações do veículo {vehicle?.brand} {vehicle?.model}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveClick} className="space-y-4 sm:space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-4">
                <CardTitle className="text-sm sm:text-lg">Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0 space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="brand" className="text-xs sm:text-sm">Marca *</Label>
                    <Select
                      value={formData.brand_id}
                      onValueChange={(value) => {
                        setFormData({ ...formData, brand_id: value, model_id: "" });
                        setSelectedBrandId(value);
                      }}
                    >
                      <SelectTrigger id="brand" className="h-9 sm:h-10 text-xs sm:text-sm">
                        <SelectValue placeholder="Selecione a marca" />
                      </SelectTrigger>
                      <SelectContent>
                        {brands?.map((brand) => (
                          <SelectItem key={brand.id} value={brand.id}>
                            {brand.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="model" className="text-xs sm:text-sm">Modelo *</Label>
                    <Select
                      value={formData.model_id}
                      onValueChange={(value) => setFormData({ ...formData, model_id: value })}
                      disabled={!selectedBrandId}
                    >
                      <SelectTrigger id="model" className="h-9 sm:h-10 text-xs sm:text-sm">
                        <SelectValue placeholder={selectedBrandId ? "Selecione o modelo" : "Selecione a marca primeiro"} />
                      </SelectTrigger>
                      <SelectContent>
                        {models?.map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            {model.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="versao" className="text-xs sm:text-sm">Versão</Label>
                    <Input
                      id="versao"
                      className="h-9 sm:h-10 text-xs sm:text-sm"
                      value={formData.versao}
                      onChange={(e) => setFormData({ ...formData, versao: e.target.value })}
                      placeholder="Ex: LTZ, Premier, Limited"
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="license_plate" className="text-xs sm:text-sm">Placa *</Label>
                    <Input
                      id="license_plate"
                      className="h-9 sm:h-10 text-xs sm:text-sm"
                      required
                      value={formData.license_plate}
                      onChange={(e) => setFormData({ ...formData, license_plate: e.target.value.toUpperCase() })}
                      placeholder="ABC1D23"
                      maxLength={7}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="ano_fabricacao" className="text-xs sm:text-sm">Ano Fabricação *</Label>
                    <Input
                      id="ano_fabricacao"
                      className="h-9 sm:h-10 text-xs sm:text-sm"
                      type="number"
                      inputMode="numeric"
                      required
                      min="1900"
                      max={new Date().getFullYear() + 1}
                      value={formData.ano_fabricacao}
                      onChange={(e) => setFormData({ ...formData, ano_fabricacao: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="ano_modelo" className="text-xs sm:text-sm">Ano Modelo *</Label>
                    <Input
                      id="ano_modelo"
                      className="h-9 sm:h-10 text-xs sm:text-sm"
                      type="number"
                      inputMode="numeric"
                      required
                      min="1900"
                      max={new Date().getFullYear() + 2}
                      value={formData.ano_modelo}
                      onChange={(e) => setFormData({ ...formData, ano_modelo: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="color" className="text-xs sm:text-sm">Cor *</Label>
                    <Input
                      id="color"
                      className="h-9 sm:h-10 text-xs sm:text-sm"
                      required
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      placeholder="Ex: Preto"
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="vehicle_type" className="text-xs sm:text-sm">Categoria *</Label>
                    <Select
                      value={formData.vehicle_type}
                      onValueChange={(value) => setFormData({ ...formData, vehicle_type: value })}
                    >
                      <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sedan">Sedan</SelectItem>
                        <SelectItem value="hatchback">Hatchback</SelectItem>
                        <SelectItem value="suv">SUV</SelectItem>
                        <SelectItem value="pickup">Pickup</SelectItem>
                        <SelectItem value="van">Van</SelectItem>
                        <SelectItem value="convertible">Conversível</SelectItem>
                        <SelectItem value="coupe">Cupê</SelectItem>
                        <SelectItem value="wagon">Perua</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 sm:space-y-2 col-span-2 sm:col-span-1">
                    <Label htmlFor="motor" className="text-xs sm:text-sm">Motor</Label>
                    <Input
                      id="motor"
                      className="h-9 sm:h-10 text-xs sm:text-sm"
                      value={formData.motor}
                      onChange={(e) => setFormData({ ...formData, motor: e.target.value })}
                      placeholder="Ex: 1.0, 2.0 Turbo"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="fuel_type" className="text-xs sm:text-sm">Combustível *</Label>
                    <Select
                      value={formData.fuel_type}
                      onValueChange={(value) => setFormData({ ...formData, fuel_type: value })}
                    >
                      <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gasoline">Gasolina</SelectItem>
                        <SelectItem value="ethanol">Etanol</SelectItem>
                        <SelectItem value="flex">Flex</SelectItem>
                        <SelectItem value="diesel">Diesel</SelectItem>
                        <SelectItem value="electric">Elétrico</SelectItem>
                        <SelectItem value="hybrid">Híbrido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="transmission_type" className="text-xs sm:text-sm">Câmbio *</Label>
                    <Select
                      value={formData.transmission_type}
                      onValueChange={(value) => setFormData({ ...formData, transmission_type: value })}
                    >
                      <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="automatic">Automático</SelectItem>
                        <SelectItem value="cvt">CVT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 sm:space-y-2 col-span-2 sm:col-span-1">
                    <Label htmlFor="direcao" className="text-xs sm:text-sm">Direção *</Label>
                    <Select
                      value={formData.direcao}
                      onValueChange={(value) => setFormData({ ...formData, direcao: value })}
                    >
                      <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mecanica">Mecânica</SelectItem>
                        <SelectItem value="hidraulica">Hidráulica</SelectItem>
                        <SelectItem value="eletrica">Elétrica</SelectItem>
                        <SelectItem value="eletrohidraulica">Eletrohidráulica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="doors" className="text-xs sm:text-sm">Portas *</Label>
                    <Input
                      id="doors"
                      className="h-9 sm:h-10 text-xs sm:text-sm"
                      type="number"
                      inputMode="numeric"
                      required
                      min="2"
                      max="5"
                      value={formData.doors}
                      onChange={(e) => setFormData({ ...formData, doors: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="seats" className="text-xs sm:text-sm">Assentos *</Label>
                    <Input
                      id="seats"
                      className="h-9 sm:h-10 text-xs sm:text-sm"
                      type="number"
                      inputMode="numeric"
                      required
                      min="2"
                      max="9"
                      value={formData.seats}
                      onChange={(e) => setFormData({ ...formData, seats: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="mileage" className="text-xs sm:text-sm">KM *</Label>
                    <Input
                      id="mileage"
                      className="h-9 sm:h-10 text-xs sm:text-sm"
                      type="number"
                      inputMode="numeric"
                      required
                      min="0"
                      value={formData.mileage}
                      onChange={(e) => setFormData({ ...formData, mileage: parseInt(e.target.value) })}
                      placeholder="Em km"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location */}
            <Card>
              <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-4">
                <CardTitle className="text-sm sm:text-lg">Localização do Veículo</CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0 space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="state" className="text-xs sm:text-sm">Estado *</Label>
                    <Select
                      value={formData.state}
                      onValueChange={(value) => setFormData({ ...formData, state: value, city: "" })}
                    >
                      <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                        <SelectValue placeholder="Selecione o estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {brazilianStates.map((state) => (
                          <SelectItem key={state.code} value={state.code}>
                            {state.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="city" className="text-xs sm:text-sm">Cidade *</Label>
                    <Select
                      value={formData.city}
                      onValueChange={(value) => setFormData({ ...formData, city: value })}
                      disabled={!formData.state}
                    >
                      <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                        <SelectValue placeholder={formData.state ? "Selecione a cidade" : "Selecione o estado primeiro"} />
                      </SelectTrigger>
                      <SelectContent>
                        {getCitiesForState(formData.state).map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial */}
            <Card>
              <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-4">
                <CardTitle className="text-sm sm:text-lg">Finanças</CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0 space-y-3 sm:space-y-4">
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="daily_price" className="text-xs sm:text-sm">Preço/Dia *</Label>
                    <CurrencyInput
                      id="daily_price"
                      className="h-9 sm:h-10 text-xs sm:text-sm"
                      required
                      value={formData.daily_price}
                      onChange={(value) => setFormData({ ...formData, daily_price: value })}
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="caucao" className="text-xs sm:text-sm">Caução</Label>
                    <CurrencyInput
                      id="caucao"
                      className="h-9 sm:h-10 text-xs sm:text-sm"
                      value={formData.caucao}
                      onChange={(value) => setFormData({ ...formData, caucao: value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Documentation */}
            <Card>
              <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-4">
                <CardTitle className="text-sm sm:text-lg">Documentação / Status</CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0 space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="chassi_mascarado" className="text-xs sm:text-sm">Chassi (Mascarado)</Label>
                    <Input
                      id="chassi_mascarado"
                      className="h-9 sm:h-10 text-xs sm:text-sm"
                      value={formData.chassi_mascarado}
                      onChange={(e) => setFormData({ ...formData, chassi_mascarado: e.target.value.toUpperCase() })}
                      placeholder="Ex: 9BW***1234"
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="situacao_veiculo" className="text-xs sm:text-sm">Situação</Label>
                    <Select
                      value={formData.situacao_veiculo}
                      onValueChange={(value) => setFormData({ ...formData, situacao_veiculo: value })}
                    >
                      <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="regular">Regular</SelectItem>
                        <SelectItem value="financiado">Financiado</SelectItem>
                        <SelectItem value="alienado">Alienado</SelectItem>
                        <SelectItem value="quitado">Quitado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {isAdmin && (
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="status" className="text-xs sm:text-sm">Status do Anúncio</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VEHICLE_STATUSES.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Vehicle Document Upload */}
            <Card>
              <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-4">
                <CardTitle className="text-sm sm:text-lg flex items-center gap-1.5 sm:gap-2">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                  Documento do Veículo
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Envie o CRLV ou documento equivalente
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                <div className="space-y-3 sm:space-y-4">
                  {/* Existing document */}
                  {existingDocumentUrl && !documentFile && (
                    <div className="border rounded-lg p-3 sm:p-4 bg-muted/50">
                      <div className="flex items-center gap-2 sm:gap-4">
                        <FileText className="w-8 h-8 sm:w-12 sm:h-12 text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-xs sm:text-sm">Documento enviado</p>
                          <p className="text-[10px] sm:text-sm text-muted-foreground truncate">
                            Envie um novo para substituir
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs h-7 sm:h-8 px-2 sm:px-3"
                          onClick={() => window.open(existingDocumentUrl, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                          <span className="hidden sm:inline">Ver</span>
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* New document preview */}
                  {documentPreview ? (
                    <div className="relative border rounded-lg p-3 sm:p-4 bg-muted/50">
                      <div className="flex items-center gap-2 sm:gap-4">
                        <FileText className="w-8 h-8 sm:w-12 sm:h-12 text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-xs sm:text-sm truncate">{documentFile?.name}</p>
                          <p className="text-[10px] sm:text-sm text-muted-foreground">
                            {documentFile ? `${(documentFile.size / 1024 / 1024).toFixed(2)} MB` : ''}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="text-xs h-7 sm:h-8 px-2 sm:px-3"
                          onClick={removeDocument}
                        >
                          <X className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                          <span className="hidden sm:inline">Remover</span>
                        </Button>
                      </div>
                      {documentPreview && documentFile?.type.startsWith('image/') && (
                        <div className="mt-3 sm:mt-4">
                          <img 
                            src={documentPreview} 
                            alt="Preview do documento" 
                            className="max-h-32 sm:max-h-48 rounded-lg object-contain"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <label className="border-2 border-dashed rounded-lg p-4 sm:p-8 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                      <Upload className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground mb-2 sm:mb-3" />
                      <span className="font-medium text-xs sm:text-base text-center">Clique para enviar documento</span>
                      <span className="text-[10px] sm:text-sm text-muted-foreground mt-1">
                        PDF, JPG ou PNG (máx. 10MB)
                      </span>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleDocumentChange}
                        className="hidden"
                      />
                    </label>
                  )}
                  <p className="text-[10px] sm:text-sm text-muted-foreground">
                    O documento será analisado antes da aprovação.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Security Accessories */}
            <Card>
              <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-4">
                <CardTitle className="text-sm sm:text-lg flex items-center gap-1.5 sm:gap-2">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
                  Segurança
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                  {[
                    { id: "airbag_frontal", label: "Airbag Frontal" },
                    { id: "airbag_lateral", label: "Airbag Lateral" },
                    { id: "freios_abs", label: "Freios ABS" },
                    { id: "controle_tracao", label: "Controle Tração" },
                    { id: "controle_estabilidade", label: "Estabilidade" },
                    { id: "camera_re", label: "Câmera de Ré" },
                    { id: "sensor_estacionamento", label: "Sensor Estac." },
                    { id: "alarme", label: "Alarme" },
                  ].map((item) => (
                    <div key={item.id} className="flex items-center space-x-1.5 sm:space-x-2">
                      <Checkbox
                        id={item.id}
                        checked={formData[item.id as keyof typeof formData] as boolean}
                        onCheckedChange={(checked) => handleCheckboxChange(item.id, checked as boolean)}
                      />
                      <Label htmlFor={item.id} className="cursor-pointer text-[10px] sm:text-sm leading-tight">
                        {item.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Comfort Accessories */}
            <Card>
              <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-4">
                <CardTitle className="text-sm sm:text-lg flex items-center gap-1.5 sm:gap-2">
                  <Sofa className="w-4 h-4 sm:w-5 sm:h-5" />
                  Conforto
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                  {[
                    { id: "has_air_conditioning", label: "Ar Cond." },
                    { id: "ar_digital", label: "Ar Digital" },
                    { id: "direcao_hidraulica", label: "Dir. Hidráulica" },
                    { id: "direcao_eletrica", label: "Dir. Elétrica" },
                    { id: "vidros_eletricos", label: "Vidros Elét." },
                    { id: "retrovisores_eletricos", label: "Retrov. Elét." },
                    { id: "banco_couro", label: "Banco Couro" },
                    { id: "banco_eletrico", label: "Banco Elétrico" },
                  ].map((item) => (
                    <div key={item.id} className="flex items-center space-x-1.5 sm:space-x-2">
                      <Checkbox
                        id={item.id}
                        checked={formData[item.id as keyof typeof formData] as boolean}
                        onCheckedChange={(checked) => handleCheckboxChange(item.id, checked as boolean)}
                      />
                      <Label htmlFor={item.id} className="cursor-pointer text-[10px] sm:text-sm leading-tight">
                        {item.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Technology Accessories */}
            <Card>
              <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-4">
                <CardTitle className="text-sm sm:text-lg flex items-center gap-1.5 sm:gap-2">
                  <Cpu className="w-4 h-4 sm:w-5 sm:h-5" />
                  Tecnologia
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                  {[
                    { id: "multimidia", label: "Multimídia" },
                    { id: "bluetooth", label: "Bluetooth" },
                    { id: "android_auto", label: "Android Auto" },
                    { id: "apple_carplay", label: "Apple CarPlay" },
                    { id: "gps", label: "GPS" },
                    { id: "wifi", label: "Wi-Fi" },
                    { id: "entrada_usb", label: "Entrada USB" },
                    { id: "carregador_inducao", label: "Carreg. Indução" },
                    { id: "piloto_automatico", label: "Piloto Autom." },
                    { id: "start_stop", label: "Start/Stop" },
                  ].map((item) => (
                    <div key={item.id} className="flex items-center space-x-1.5 sm:space-x-2">
                      <Checkbox
                        id={item.id}
                        checked={formData[item.id as keyof typeof formData] as boolean}
                        onCheckedChange={(checked) => handleCheckboxChange(item.id, checked as boolean)}
                      />
                      <Label htmlFor={item.id} className="cursor-pointer text-[10px] sm:text-sm leading-tight">
                        {item.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Exterior Accessories */}
            <Card>
              <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-4">
                <CardTitle className="text-sm sm:text-lg flex items-center gap-1.5 sm:gap-2">
                  <Car className="w-4 h-4 sm:w-5 sm:h-5" />
                  Exterior
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                  {[
                    { id: "rodas_liga_leve", label: "Rodas Liga Leve" },
                    { id: "farol_led", label: "Farol LED" },
                    { id: "farol_milha", label: "Farol Milha" },
                    { id: "rack_teto", label: "Rack Teto" },
                    { id: "engate", label: "Engate" },
                  ].map((item) => (
                    <div key={item.id} className="flex items-center space-x-1.5 sm:space-x-2">
                      <Checkbox
                        id={item.id}
                        checked={formData[item.id as keyof typeof formData] as boolean}
                        onCheckedChange={(checked) => handleCheckboxChange(item.id, checked as boolean)}
                      />
                      <Label htmlFor={item.id} className="cursor-pointer text-[10px] sm:text-sm leading-tight">
                        {item.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Other Accessories */}
            <Card>
              <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-4">
                <CardTitle className="text-sm sm:text-lg flex items-center gap-1.5 sm:gap-2">
                  <Package className="w-4 h-4 sm:w-5 sm:h-5" />
                  Outros
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                  {[
                    { id: "chave_reserva", label: "Chave Reserva" },
                    { id: "manual_veiculo", label: "Manual Veículo" },
                    { id: "sensor_chuva", label: "Sensor Chuva" },
                    { id: "sensor_crepuscular", label: "Sensor Crep." },
                  ].map((item) => (
                    <div key={item.id} className="flex items-center space-x-1.5 sm:space-x-2">
                      <Checkbox
                        id={item.id}
                        checked={formData[item.id as keyof typeof formData] as boolean}
                        onCheckedChange={(checked) => handleCheckboxChange(item.id, checked as boolean)}
                      />
                      <Label htmlFor={item.id} className="cursor-pointer text-[10px] sm:text-sm leading-tight">
                        {item.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-4">
                <CardTitle className="text-sm sm:text-lg">Descrição</CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="description" className="text-xs sm:text-sm">Descrição do Veículo</Label>
                  <Textarea
                    id="description"
                    className="text-xs sm:text-sm min-h-[80px] sm:min-h-[100px]"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descreva seu veículo, estado de conservação, manutenções, etc."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Owner Rules */}
            <Card>
              <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-4">
                <CardTitle className="text-sm sm:text-lg">Regras do Proprietário</CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="regras" className="text-xs sm:text-sm">Regras</Label>
                  <Textarea
                    id="regras"
                    className="text-xs sm:text-sm min-h-[80px] sm:min-h-[100px]"
                    value={formData.regras}
                    onChange={(e) => setFormData({ ...formData, regras: e.target.value })}
                    placeholder="Ex: Proibido fumar, devolução com tanque cheio, etc."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="text-xs sm:text-sm h-9 sm:h-10">
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading} className="text-xs sm:text-sm h-9 sm:h-10">
                {isLoading && <Loader2 className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />}
                Salvar Alterações
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for non-admin users */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-lg p-4 sm:p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">Confirmar Alterações</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-xs sm:text-sm">
              <p>
                Ao salvar, seu veículo ficará <strong>pendente de validação</strong> por um administrador.
              </p>
              <p>
                O veículo <strong>não ficará visível</strong> até a validação ser concluída.
              </p>
              <p className="text-muted-foreground">
                Validação em até <strong>24 horas</strong>.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel className="text-xs sm:text-sm h-9 sm:h-10">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit} disabled={isLoading} className="text-xs sm:text-sm h-9 sm:h-10">
              {isLoading && <Loader2 className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />}
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
