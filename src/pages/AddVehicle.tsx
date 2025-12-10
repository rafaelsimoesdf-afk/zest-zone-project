import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsUserApproved } from "@/hooks/useProfile";
import { useCreateAddress } from "@/hooks/useAddresses";
import { useBrands, useModels } from "@/hooks/useBrands";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Upload, X, Shield, Sofa, Cpu, Car, Package, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { brazilianStates, getCitiesForState } from "@/hooks/useBrazilLocations";
import { VerificationRequired } from "@/components/VerificationRequired";
import { maskCurrency, parseCurrency } from "@/lib/validators";

const AddVehicle = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isApproved, verificationStatus, isLoading: isLoadingVerification } = useIsUserApproved();
  const createAddress = useCreateAddress();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentPreview, setDocumentPreview] = useState<string | null>(null);
  
  const { data: brands } = useBrands();
  const [selectedBrandId, setSelectedBrandId] = useState<string>("");
  const { data: models } = useModels(selectedBrandId);

  // Form data state
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 10) {
      toast.error("Máximo de 10 imagens permitidas");
      return;
    }

    setImages([...images, ...files]);
    
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImages(newImages);
    setImagePreviews(newPreviews);
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Você precisa estar logado");
      navigate("/auth");
      return;
    }

    if (images.length === 0) {
      toast.error("Adicione pelo menos uma foto do veículo");
      return;
    }

    if (!formData.city || !formData.state) {
      toast.error("Por favor, selecione a cidade e estado do veículo");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create address for vehicle location
      const addressResult = await createAddress.mutateAsync({
        street: "Localização do veículo",
        number: "S/N",
        complement: null,
        neighborhood: formData.city,
        city: formData.city,
        state: formData.state,
        zip_code: "00000-000",
        latitude: null,
        longitude: null,
        is_default: false,
      });

      // Get brand and model names for the text fields
      const selectedBrand = brands?.find(b => b.id === formData.brand_id);
      const selectedModel = models?.find(m => m.id === formData.model_id);

      // Insert vehicle with all fields
      const { data: vehicle, error: vehicleError } = await supabase
        .from("vehicles")
        .insert([{
          // Basic info
          brand_id: formData.brand_id,
          model_id: formData.model_id,
          brand: selectedBrand?.name || "",
          model: selectedModel?.name || "",
          versao: formData.versao || null,
          year: formData.ano_fabricacao, // Keep year for compatibility
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
          
          // Financial
          daily_price: formData.daily_price,
          caucao: formData.caucao,
          
          // Documentation
          chassi_mascarado: formData.chassi_mascarado || null,
          situacao_veiculo: formData.situacao_veiculo || null,
          
          // Description and rules
          description: formData.description || null,
          regras: formData.regras || null,
          
          // Security accessories
          airbag_frontal: formData.airbag_frontal,
          airbag_lateral: formData.airbag_lateral,
          freios_abs: formData.freios_abs,
          controle_tracao: formData.controle_tracao,
          controle_estabilidade: formData.controle_estabilidade,
          camera_re: formData.camera_re,
          sensor_estacionamento: formData.sensor_estacionamento,
          alarme: formData.alarme,
          
          // Comfort accessories
          has_air_conditioning: formData.has_air_conditioning,
          ar_digital: formData.ar_digital,
          direcao_hidraulica: formData.direcao_hidraulica,
          direcao_eletrica: formData.direcao_eletrica,
          vidros_eletricos: formData.vidros_eletricos,
          retrovisores_eletricos: formData.retrovisores_eletricos,
          banco_couro: formData.banco_couro,
          banco_eletrico: formData.banco_eletrico,
          
          // Technology accessories
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
          
          // Exterior accessories
          rodas_liga_leve: formData.rodas_liga_leve,
          farol_led: formData.farol_led,
          farol_milha: formData.farol_milha,
          rack_teto: formData.rack_teto,
          engate: formData.engate,
          
          // Other accessories
          chave_reserva: formData.chave_reserva,
          manual_veiculo: formData.manual_veiculo,
          sensor_chuva: formData.sensor_chuva,
          sensor_crepuscular: formData.sensor_crepuscular,
          
          // Owner and address
          owner_id: user.id,
          address_id: addressResult.id,
        }])
        .select()
        .single();

      if (vehicleError) throw vehicleError;

      // Upload vehicle document if provided
      let documentUrl = null;
      if (documentFile) {
        const fileExt = documentFile.name.split('.').pop();
        const documentFileName = `${user.id}/${vehicle.id}/document-${Date.now()}.${fileExt}`;
        
        const { error: docUploadError } = await supabase.storage
          .from('vehicle-images')
          .upload(documentFileName, documentFile);

        if (docUploadError) {
          console.error('Document upload error:', docUploadError);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('vehicle-images')
            .getPublicUrl(documentFileName);
          
          documentUrl = publicUrl;
          
          // Update vehicle with document URL
          await supabase
            .from("vehicles")
            .update({ document_url: documentUrl })
            .eq("id", vehicle.id);
        }
      }

      // Upload images to Supabase Storage
      const imagePromises = images.map(async (image, index) => {
        const fileExt = image.name.split('.').pop();
        const fileName = `${user.id}/${vehicle.id}/${Date.now()}-${index}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('vehicle-images')
          .upload(fileName, image);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('vehicle-images')
          .getPublicUrl(fileName);
        
        return supabase
          .from("vehicle_images")
          .insert({
            vehicle_id: vehicle.id,
            image_url: publicUrl,
            is_primary: index === 0,
            display_order: index,
          });
      });

      await Promise.all(imagePromises);

      toast.success("Veículo cadastrado com sucesso! Aguarde aprovação.");
      navigate("/my-vehicles");
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Erro ao cadastrar veículo");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-24 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="pt-6 text-center">
              <p className="mb-4">Você precisa estar logado para cadastrar um veículo</p>
              <Button asChild>
                <Link to="/auth">Fazer Login</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (isLoadingVerification) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-24 flex items-center justify-center">
          <p className="text-muted-foreground">Carregando...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isApproved) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-24 flex items-center justify-center">
          <VerificationRequired 
            action="cadastrar veículos" 
            verificationStatus={verificationStatus} 
          />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-24">
        <Button variant="ghost" className="mb-6" asChild>
          <Link to="/become-owner">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Link>
        </Button>

        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-display font-bold mb-8 text-primary">
            Cadastrar Veículo
          </h1>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Images */}
            <Card>
              <CardHeader>
                <CardTitle>Fotos do Veículo</CardTitle>
                <CardDescription>Adicione até 10 fotos do seu veículo. A primeira será a foto principal.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative aspect-square">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        {index === 0 && (
                          <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                            Principal
                          </div>
                        )}
                      </div>
                    ))}
                    {images.length < 10 && (
                      <label className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                        <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">Adicionar Foto</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brand">Marca *</Label>
                    <Select
                      value={formData.brand_id}
                      onValueChange={(value) => {
                        setFormData({ ...formData, brand_id: value, model_id: "" });
                        setSelectedBrandId(value);
                      }}
                      required
                    >
                      <SelectTrigger id="brand">
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
                  <div className="space-y-2">
                    <Label htmlFor="model">Modelo *</Label>
                    <Select
                      value={formData.model_id}
                      onValueChange={(value) => setFormData({ ...formData, model_id: value })}
                      disabled={!selectedBrandId}
                      required
                    >
                      <SelectTrigger id="model">
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

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="versao">Versão</Label>
                    <Input
                      id="versao"
                      value={formData.versao}
                      onChange={(e) => setFormData({ ...formData, versao: e.target.value })}
                      placeholder="Ex: LTZ, Premier, Limited"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="license_plate">Placa *</Label>
                    <Input
                      id="license_plate"
                      required
                      value={formData.license_plate}
                      onChange={(e) => setFormData({ ...formData, license_plate: e.target.value.toUpperCase() })}
                      placeholder="ABC1D23"
                      maxLength={7}
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ano_fabricacao">Ano de Fabricação *</Label>
                    <Input
                      id="ano_fabricacao"
                      type="number"
                      required
                      min="1900"
                      max={new Date().getFullYear() + 1}
                      value={formData.ano_fabricacao}
                      onChange={(e) => setFormData({ ...formData, ano_fabricacao: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ano_modelo">Ano do Modelo *</Label>
                    <Input
                      id="ano_modelo"
                      type="number"
                      required
                      min="1900"
                      max={new Date().getFullYear() + 2}
                      value={formData.ano_modelo}
                      onChange={(e) => setFormData({ ...formData, ano_modelo: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="color">Cor *</Label>
                    <Input
                      id="color"
                      required
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      placeholder="Ex: Preto, Prata, Branco"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehicle_type">Categoria *</Label>
                    <Select
                      value={formData.vehicle_type}
                      onValueChange={(value) => setFormData({ ...formData, vehicle_type: value })}
                    >
                      <SelectTrigger>
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
                  <div className="space-y-2">
                    <Label htmlFor="motor">Motor</Label>
                    <Input
                      id="motor"
                      value={formData.motor}
                      onChange={(e) => setFormData({ ...formData, motor: e.target.value })}
                      placeholder="Ex: 1.0, 1.6, 2.0 Turbo"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fuel_type">Combustível *</Label>
                    <Select
                      value={formData.fuel_type}
                      onValueChange={(value) => setFormData({ ...formData, fuel_type: value })}
                    >
                      <SelectTrigger>
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
                  <div className="space-y-2">
                    <Label htmlFor="transmission_type">Câmbio *</Label>
                    <Select
                      value={formData.transmission_type}
                      onValueChange={(value) => setFormData({ ...formData, transmission_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="automatic">Automático</SelectItem>
                        <SelectItem value="cvt">CVT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="direcao">Direção *</Label>
                    <Select
                      value={formData.direcao}
                      onValueChange={(value) => setFormData({ ...formData, direcao: value })}
                    >
                      <SelectTrigger>
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

                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="doors">Portas *</Label>
                    <Input
                      id="doors"
                      type="number"
                      required
                      min="2"
                      max="5"
                      value={formData.doors}
                      onChange={(e) => setFormData({ ...formData, doors: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="seats">Assentos *</Label>
                    <Input
                      id="seats"
                      type="number"
                      required
                      min="2"
                      max="9"
                      value={formData.seats}
                      onChange={(e) => setFormData({ ...formData, seats: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mileage">Quilometragem *</Label>
                    <Input
                      id="mileage"
                      type="number"
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
              <CardHeader>
                <CardTitle>Localização do Veículo</CardTitle>
                <CardDescription>Onde o veículo está disponível para retirada</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="state">Estado *</Label>
                    <Select
                      value={formData.state}
                      onValueChange={(value) => setFormData({ ...formData, state: value, city: "" })}
                    >
                      <SelectTrigger>
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
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade *</Label>
                    <Select
                      value={formData.city}
                      onValueChange={(value) => setFormData({ ...formData, city: value })}
                      disabled={!formData.state}
                    >
                      <SelectTrigger>
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
              <CardHeader>
                <CardTitle>Finanças</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="daily_price">Preço por Dia *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                      <Input
                        id="daily_price"
                        required
                        value={formData.daily_price ? maskCurrency(formData.daily_price) : ''}
                        onChange={(e) => {
                          const value = parseCurrency(e.target.value);
                          setFormData({ ...formData, daily_price: value });
                        }}
                        placeholder="150,00"
                        className="pl-10"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Sugerimos uma diária entre R$ 100 e R$ 300 para maior competitividade
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="caucao">Caução</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                      <Input
                        id="caucao"
                        value={formData.caucao ? maskCurrency(formData.caucao) : ''}
                        onChange={(e) => {
                          const value = parseCurrency(e.target.value);
                          setFormData({ ...formData, caucao: value });
                        }}
                        placeholder="500,00"
                        className="pl-10"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Valor do depósito de segurança (opcional)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Documentation/Status */}
            <Card>
              <CardHeader>
                <CardTitle>Documentação / Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="chassi_mascarado">Chassi (Mascarado)</Label>
                    <Input
                      id="chassi_mascarado"
                      value={formData.chassi_mascarado}
                      onChange={(e) => setFormData({ ...formData, chassi_mascarado: e.target.value.toUpperCase() })}
                      placeholder="Ex: 9BW***********1234"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="situacao_veiculo">Situação do Veículo</Label>
                    <Select
                      value={formData.situacao_veiculo}
                      onValueChange={(value) => setFormData({ ...formData, situacao_veiculo: value })}
                    >
                      <SelectTrigger>
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
              </CardContent>
            </Card>

            {/* Vehicle Document Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Documento do Veículo
                </CardTitle>
                <CardDescription>
                  Envie o CRLV (Certificado de Registro e Licenciamento de Veículo) ou documento equivalente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {documentPreview ? (
                    <div className="relative border rounded-lg p-4 bg-muted/50">
                      <div className="flex items-center gap-4">
                        <FileText className="w-12 h-12 text-primary" />
                        <div className="flex-1">
                          <p className="font-medium">{documentFile?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {documentFile ? `${(documentFile.size / 1024 / 1024).toFixed(2)} MB` : ''}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={removeDocument}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Remover
                        </Button>
                      </div>
                      {documentPreview && documentFile?.type.startsWith('image/') && (
                        <div className="mt-4">
                          <img 
                            src={documentPreview} 
                            alt="Preview do documento" 
                            className="max-h-48 rounded-lg object-contain"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <label className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                      <Upload className="w-10 h-10 text-muted-foreground mb-3" />
                      <span className="font-medium">Clique para enviar o documento</span>
                      <span className="text-sm text-muted-foreground mt-1">
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
                  <p className="text-sm text-muted-foreground">
                    O documento será analisado pela nossa equipe antes da aprovação do veículo.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Accessories - Security */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Segurança
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { id: "airbag_frontal", label: "Airbag Frontal" },
                    { id: "airbag_lateral", label: "Airbag Lateral" },
                    { id: "freios_abs", label: "Freios ABS" },
                    { id: "controle_tracao", label: "Controle de Tração" },
                    { id: "controle_estabilidade", label: "Controle de Estabilidade" },
                    { id: "camera_re", label: "Câmera de Ré" },
                    { id: "sensor_estacionamento", label: "Sensor de Estacionamento" },
                    { id: "alarme", label: "Alarme" },
                  ].map((item) => (
                    <div key={item.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={item.id}
                        checked={formData[item.id as keyof typeof formData] as boolean}
                        onCheckedChange={(checked) => handleCheckboxChange(item.id, checked as boolean)}
                      />
                      <Label htmlFor={item.id} className="cursor-pointer text-sm">
                        {item.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Accessories - Comfort */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sofa className="w-5 h-5" />
                  Conforto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { id: "has_air_conditioning", label: "Ar Condicionado" },
                    { id: "ar_digital", label: "Ar Digital" },
                    { id: "direcao_hidraulica", label: "Direção Hidráulica" },
                    { id: "direcao_eletrica", label: "Direção Elétrica" },
                    { id: "vidros_eletricos", label: "Vidros Elétricos" },
                    { id: "retrovisores_eletricos", label: "Retrovisores Elétricos" },
                    { id: "banco_couro", label: "Banco de Couro" },
                    { id: "banco_eletrico", label: "Banco Elétrico" },
                  ].map((item) => (
                    <div key={item.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={item.id}
                        checked={formData[item.id as keyof typeof formData] as boolean}
                        onCheckedChange={(checked) => handleCheckboxChange(item.id, checked as boolean)}
                      />
                      <Label htmlFor={item.id} className="cursor-pointer text-sm">
                        {item.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Accessories - Technology */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="w-5 h-5" />
                  Tecnologia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { id: "multimidia", label: "Multimídia" },
                    { id: "bluetooth", label: "Bluetooth" },
                    { id: "android_auto", label: "Android Auto" },
                    { id: "apple_carplay", label: "Apple CarPlay" },
                    { id: "gps", label: "GPS" },
                    { id: "wifi", label: "Wi-Fi" },
                    { id: "entrada_usb", label: "Entrada USB" },
                    { id: "carregador_inducao", label: "Carregador por Indução" },
                    { id: "piloto_automatico", label: "Piloto Automático" },
                    { id: "start_stop", label: "Start/Stop" },
                  ].map((item) => (
                    <div key={item.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={item.id}
                        checked={formData[item.id as keyof typeof formData] as boolean}
                        onCheckedChange={(checked) => handleCheckboxChange(item.id, checked as boolean)}
                      />
                      <Label htmlFor={item.id} className="cursor-pointer text-sm">
                        {item.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Accessories - Exterior */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="w-5 h-5" />
                  Exterior
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { id: "rodas_liga_leve", label: "Rodas de Liga Leve" },
                    { id: "farol_led", label: "Farol LED" },
                    { id: "farol_milha", label: "Farol de Milha" },
                    { id: "rack_teto", label: "Rack de Teto" },
                    { id: "engate", label: "Engate" },
                  ].map((item) => (
                    <div key={item.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={item.id}
                        checked={formData[item.id as keyof typeof formData] as boolean}
                        onCheckedChange={(checked) => handleCheckboxChange(item.id, checked as boolean)}
                      />
                      <Label htmlFor={item.id} className="cursor-pointer text-sm">
                        {item.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Accessories - Other */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Outros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { id: "chave_reserva", label: "Chave Reserva" },
                    { id: "manual_veiculo", label: "Manual do Veículo" },
                    { id: "sensor_chuva", label: "Sensor de Chuva" },
                    { id: "sensor_crepuscular", label: "Sensor Crepuscular" },
                  ].map((item) => (
                    <div key={item.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={item.id}
                        checked={formData[item.id as keyof typeof formData] as boolean}
                        onCheckedChange={(checked) => handleCheckboxChange(item.id, checked as boolean)}
                      />
                      <Label htmlFor={item.id} className="cursor-pointer text-sm">
                        {item.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Descrição</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição do Veículo</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descreva seu veículo, seu estado de conservação, manutenções recentes, diferenciais, etc."
                    rows={5}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Owner Rules */}
            <Card>
              <CardHeader>
                <CardTitle>Regras do Proprietário</CardTitle>
                <CardDescription>Defina as regras e condições para aluguel do seu veículo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="regras">Regras</Label>
                  <Textarea
                    id="regras"
                    value={formData.regras}
                    onChange={(e) => setFormData({ ...formData, regras: e.target.value })}
                    placeholder="Ex: Proibido fumar no veículo, devolução com tanque cheio, limite de quilometragem diária, idade mínima do condutor, etc."
                    rows={5}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="flex-1 gradient-accent text-accent-foreground"
              >
                {isSubmitting ? "Cadastrando..." : "Cadastrar Veículo"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => navigate("/become-owner")}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AddVehicle;
