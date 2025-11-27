import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateAddress } from "@/hooks/useAddresses";
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
import { ArrowLeft, Upload, X } from "lucide-react";
import { Link } from "react-router-dom";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import type { AddressData } from "@/components/AddressAutocomplete";

const AddVehicle = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const createAddress = useCreateAddress();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    brand: "",
    model: "",
    year: new Date().getFullYear(),
    vehicle_type: "sedan",
    transmission_type: "manual",
    fuel_type: "flex",
    color: "",
    seats: 5,
    doors: 4,
    mileage: 0,
    license_plate: "",
    daily_price: 0,
    description: "",
    has_air_conditioning: false,
  });

  const [addressData, setAddressData] = useState<AddressData>({
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zip_code: "",
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

    // Validate address is filled
    if (!addressData.street || !addressData.number || !addressData.neighborhood || 
        !addressData.city || !addressData.state || !addressData.zip_code) {
      toast.error("Por favor, preencha o endereço completo do veículo");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create address for vehicle
      const addressResult = await createAddress.mutateAsync({
        ...addressData,
        complement: addressData.complement || null,
        latitude: addressData.latitude || null,
        longitude: addressData.longitude || null,
        is_default: false,
      });

      // Insert vehicle
      const { data: vehicle, error: vehicleError } = await supabase
        .from("vehicles")
        .insert([{
          brand: formData.brand,
          model: formData.model,
          year: formData.year,
          vehicle_type: formData.vehicle_type as any,
          transmission_type: formData.transmission_type as any,
          fuel_type: formData.fuel_type as any,
          color: formData.color,
          seats: formData.seats,
          doors: formData.doors,
          mileage: formData.mileage,
          license_plate: formData.license_plate,
          daily_price: formData.daily_price,
          description: formData.description || null,
          has_air_conditioning: formData.has_air_conditioning,
          owner_id: user.id,
          address_id: addressResult.id,
        }])
        .select()
        .single();

      if (vehicleError) throw vehicleError;

      // Upload images (mock - storage would need to be configured)
      // For now, we'll use placeholder URLs
      const imagePromises = images.map(async (_, index) => {
        // In a real implementation, you would upload to Supabase Storage here
        const mockImageUrl = `https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800&q=80`;
        
        return supabase
          .from("vehicle_images")
          .insert({
            vehicle_id: vehicle.id,
            image_url: mockImageUrl,
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
          <h1 className="text-4xl font-display font-bold mb-8 bg-gradient-primary bg-clip-text text-transparent">
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
                    <Input
                      id="brand"
                      required
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      placeholder="Ex: Honda, Toyota, Volkswagen"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Modelo *</Label>
                    <Input
                      id="model"
                      required
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      placeholder="Ex: Civic, Corolla, Gol"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="year">Ano *</Label>
                    <Input
                      id="year"
                      type="number"
                      required
                      min="1900"
                      max={new Date().getFullYear() + 1}
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    />
                  </div>
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
                    <Label htmlFor="license_plate">Placa *</Label>
                    <Input
                      id="license_plate"
                      required
                      value={formData.license_plate}
                      onChange={(e) => setFormData({ ...formData, license_plate: e.target.value.toUpperCase() })}
                      placeholder="ABC1234"
                      maxLength={7}
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vehicle_type">Tipo *</Label>
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
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
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

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has_air_conditioning"
                    checked={formData.has_air_conditioning}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, has_air_conditioning: checked as boolean })
                    }
                  />
                  <Label htmlFor="has_air_conditioning" className="cursor-pointer">
                    Possui ar-condicionado
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Pricing & Description */}
            <Card>
              <CardHeader>
                <CardTitle>Preço e Descrição</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="daily_price">Preço por Dia (R$) *</Label>
                  <Input
                    id="daily_price"
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.daily_price}
                    onChange={(e) => setFormData({ ...formData, daily_price: parseFloat(e.target.value) })}
                    placeholder="150.00"
                  />
                  <p className="text-sm text-muted-foreground">
                    Sugerimos uma diária entre R$ 100 e R$ 300 para maior competitividade
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descreva seu veículo, seu estado de conservação, manutenções recentes, etc."
                    rows={5}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Location */}
            <Card>
              <CardHeader>
                <CardTitle>Localização do Veículo</CardTitle>
                <CardDescription>Onde o veículo está disponível para retirada</CardDescription>
              </CardHeader>
              <CardContent>
                <AddressAutocomplete
                  value={addressData}
                  onChange={setAddressData}
                />
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="flex-1 bg-gradient-accent"
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
