import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useMyVehicles } from "@/hooks/useVehicles";
import { useCreateListing } from "@/hooks/useClassifieds";
import { useProfile } from "@/hooks/useProfile";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Car, Zap, ArrowLeft } from "lucide-react";
import { Vehicle } from "@/hooks/useVehicles";

const CreateListing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: myVehicles, isLoading: loadingVehicles } = useMyVehicles();
  const { data: profile } = useProfile();
  const createListing = useCreateListing();

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("manual");
  const [formData, setFormData] = useState({
    brand: "",
    model: "",
    year: new Date().getFullYear(),
    color: "",
    mileage: 0,
    vehicle_type: "sedan",
    transmission_type: "automatic",
    fuel_type: "flex",
    doors: 4,
    seats: 5,
    has_air_conditioning: false,
    sale_price: 0,
    description: "",
    condition: "used",
    accepts_trade: false,
    license_plate: "",
    city: "",
    state: "",
    whatsapp_number: "",
    show_phone: true,
    allow_chat: true,
  });
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  // Pre-fill from selected vehicle
  useEffect(() => {
    if (selectedVehicleId === "manual" || !myVehicles) return;
    const vehicle = myVehicles.find(v => v.id === selectedVehicleId);
    if (!vehicle) return;

    const vehicleImages = vehicle.vehicle_images?.sort((a, b) => {
      if (a.is_primary) return -1;
      if (b.is_primary) return 1;
      return a.display_order - b.display_order;
    }).map(img => img.image_url) || [];

    // Build rich description from vehicle data
    const v = vehicle as any;
    const accessories: string[] = [];
    const accessoryMap: Record<string, string> = {
      ar_digital: "Ar digital", has_air_conditioning: "Ar-condicionado",
      airbag_frontal: "Airbag frontal", airbag_lateral: "Airbag lateral",
      freios_abs: "Freios ABS", controle_tracao: "Controle de tração",
      controle_estabilidade: "Controle de estabilidade", alarme: "Alarme",
      sensor_estacionamento: "Sensor de estacionamento", sensor_chuva: "Sensor de chuva",
      sensor_crepuscular: "Sensor crepuscular", camera_re: "Câmera de ré",
      piloto_automatico: "Piloto automático", start_stop: "Start/Stop",
      banco_couro: "Bancos de couro", banco_eletrico: "Bancos elétricos",
      retrovisores_eletricos: "Retrovisores elétricos", vidros_eletricos: "Vidros elétricos",
      direcao_eletrica: "Direção elétrica", direcao_hidraulica: "Direção hidráulica",
      multimidia: "Central multimídia", bluetooth: "Bluetooth",
      apple_carplay: "Apple CarPlay", android_auto: "Android Auto",
      gps: "GPS", wifi: "Wi-Fi", entrada_usb: "Entrada USB",
      carregador_inducao: "Carregador por indução",
      farol_led: "Farol LED", farol_milha: "Farol de milha",
      rodas_liga_leve: "Rodas de liga leve", rack_teto: "Rack de teto",
      engate: "Engate", chave_reserva: "Chave reserva",
      manual_veiculo: "Manual do veículo",
    };

    for (const [key, label] of Object.entries(accessoryMap)) {
      if (v[key]) accessories.push(label);
    }

    const descParts: string[] = [];
    descParts.push(`${vehicle.brand} ${vehicle.model} ${vehicle.year} - ${vehicle.color}`);
    if (v.versao) descParts.push(`Versão: ${v.versao}`);
    if (v.motor) descParts.push(`Motor: ${v.motor}`);
    if (v.direcao) descParts.push(`Direção: ${v.direcao}`);
    descParts.push(`${vehicle.mileage.toLocaleString("pt-BR")} km rodados`);
    if (accessories.length > 0) {
      descParts.push(`\nAcessórios: ${accessories.join(", ")}`);
    }
    if (vehicle.description) {
      descParts.push(`\n${vehicle.description}`);
    }

    setFormData(prev => ({
      ...prev,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      color: vehicle.color,
      mileage: vehicle.mileage,
      vehicle_type: vehicle.vehicle_type,
      transmission_type: vehicle.transmission_type,
      fuel_type: vehicle.fuel_type,
      doors: vehicle.doors,
      seats: vehicle.seats,
      has_air_conditioning: vehicle.has_air_conditioning,
      license_plate: vehicle.license_plate || "",
      city: vehicle.city || "",
      state: vehicle.state || "",
      description: descParts.join("\n"),
    }));
    setImageUrls(vehicleImages);
  }, [selectedVehicleId, myVehicles]);

  // Pre-fill WhatsApp from profile
  useEffect(() => {
    if (profile?.phone_number) {
      setFormData(prev => ({ ...prev, whatsapp_number: prev.whatsapp_number || profile.phone_number || "" }));
    }
  }, [profile]);

  if (!user) {
    navigate("/auth");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.sale_price <= 0) return;

    await createListing.mutateAsync({
      ...formData,
      vehicle_id: selectedVehicleId !== "manual" ? selectedVehicleId : undefined,
      image_urls: imageUrls,
    });

    navigate("/classifieds");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-3 sm:px-4 py-16 sm:py-24">
        <div className="max-w-3xl mx-auto">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          <h1 className="text-2xl sm:text-4xl font-display font-bold text-primary mb-6">
            Criar Anúncio de Venda
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Quick fill from existing vehicle */}
            {myVehicles && myVehicles.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Zap className="w-5 h-5 text-primary" />
                    Preenchimento Rápido
                  </CardTitle>
                  <CardDescription>
                    Selecione um veículo já cadastrado para preencher automaticamente
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um veículo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Preencher manualmente</SelectItem>
                      {myVehicles.map(v => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.brand} {v.model} {v.year} - {v.color}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            )}

            {/* Vehicle Data */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Car className="w-5 h-5" />
                  Dados do Veículo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Marca *</Label>
                    <Input required value={formData.brand} onChange={e => setFormData(p => ({ ...p, brand: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Modelo *</Label>
                    <Input required value={formData.model} onChange={e => setFormData(p => ({ ...p, model: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Ano *</Label>
                    <Input type="number" required value={formData.year} onChange={e => setFormData(p => ({ ...p, year: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <Label>Cor *</Label>
                    <Input required value={formData.color} onChange={e => setFormData(p => ({ ...p, color: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Quilometragem *</Label>
                    <Input type="number" required value={formData.mileage} onChange={e => setFormData(p => ({ ...p, mileage: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <Label>Placa</Label>
                    <Input value={formData.license_plate} onChange={e => setFormData(p => ({ ...p, license_plate: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Tipo</Label>
                    <Select value={formData.vehicle_type} onValueChange={v => setFormData(p => ({ ...p, vehicle_type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sedan">Sedan</SelectItem>
                        <SelectItem value="hatchback">Hatch</SelectItem>
                        <SelectItem value="suv">SUV</SelectItem>
                        <SelectItem value="pickup">Picape</SelectItem>
                        <SelectItem value="van">Van</SelectItem>
                        <SelectItem value="coupe">Cupê</SelectItem>
                        <SelectItem value="convertible">Conversível</SelectItem>
                        <SelectItem value="wagon">Perua</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Câmbio</Label>
                    <Select value={formData.transmission_type} onValueChange={v => setFormData(p => ({ ...p, transmission_type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="automatic">Automático</SelectItem>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="cvt">CVT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Combustível</Label>
                    <Select value={formData.fuel_type} onValueChange={v => setFormData(p => ({ ...p, fuel_type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="flex">Flex</SelectItem>
                        <SelectItem value="gasoline">Gasolina</SelectItem>
                        <SelectItem value="ethanol">Etanol</SelectItem>
                        <SelectItem value="diesel">Diesel</SelectItem>
                        <SelectItem value="electric">Elétrico</SelectItem>
                        <SelectItem value="hybrid">Híbrido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Portas</Label>
                    <Input type="number" value={formData.doors} onChange={e => setFormData(p => ({ ...p, doors: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <Label>Lugares</Label>
                    <Input type="number" value={formData.seats} onChange={e => setFormData(p => ({ ...p, seats: Number(e.target.value) }))} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox checked={formData.has_air_conditioning} onCheckedChange={(c) => setFormData(p => ({ ...p, has_air_conditioning: !!c }))} />
                  <Label>Ar-condicionado</Label>
                </div>
              </CardContent>
            </Card>

            {/* Sale Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Detalhes da Venda</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Preço de Venda *</Label>
                    <CurrencyInput value={formData.sale_price} onChange={v => setFormData(p => ({ ...p, sale_price: v }))} />
                  </div>
                  <div>
                    <Label>Condição</Label>
                    <Select value={formData.condition} onValueChange={v => setFormData(p => ({ ...p, condition: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">Novo</SelectItem>
                        <SelectItem value="semi-new">Seminovo</SelectItem>
                        <SelectItem value="used">Usado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Cidade</Label>
                    <Input value={formData.city} onChange={e => setFormData(p => ({ ...p, city: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Estado</Label>
                    <Input value={formData.state} onChange={e => setFormData(p => ({ ...p, state: e.target.value }))} maxLength={2} placeholder="SP" />
                  </div>
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Textarea
                    value={formData.description}
                    onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                    placeholder="Descreva o veículo, estado de conservação, itens extras, motivo da venda..."
                    rows={4}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={formData.accepts_trade} onCheckedChange={c => setFormData(p => ({ ...p, accepts_trade: c }))} />
                  <Label>Aceita troca</Label>
                </div>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>WhatsApp</Label>
                  <Input
                    value={formData.whatsapp_number}
                    onChange={e => setFormData(p => ({ ...p, whatsapp_number: e.target.value }))}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={formData.show_phone} onCheckedChange={c => setFormData(p => ({ ...p, show_phone: c }))} />
                  <Label>Exibir telefone no anúncio</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={formData.allow_chat} onCheckedChange={c => setFormData(p => ({ ...p, allow_chat: c }))} />
                  <Label>Permitir mensagens pela plataforma</Label>
                </div>
              </CardContent>
            </Card>

            {/* Images preview if from vehicle */}
            {imageUrls.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Fotos do Veículo</CardTitle>
                  <CardDescription>Fotos importadas do veículo cadastrado</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {imageUrls.map((url, i) => (
                      <img key={i} src={url} alt={`Foto ${i + 1}`} className="w-full h-20 sm:h-28 object-cover rounded-lg" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={createListing.isPending}>
              {createListing.isPending ? "Criando anúncio..." : "Publicar Anúncio"}
            </Button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CreateListing;
