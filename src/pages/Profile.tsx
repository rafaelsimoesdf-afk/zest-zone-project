import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useDefaultAddress, useCreateAddress, useUpdateAddress } from "@/hooks/useAddresses";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { User, Mail, Phone, Calendar } from "lucide-react";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import type { AddressData } from "@/components/AddressAutocomplete";
import { toast } from "sonner";

const Profile = () => {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const { data: defaultAddress, isLoading: isLoadingAddress } = useDefaultAddress();
  const updateProfile = useUpdateProfile();
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    birth_date: "",
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

  // Update form when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        phone_number: profile.phone_number || "",
        birth_date: profile.birth_date || "",
      });
    }
  }, [profile]);

  // Update address form when default address loads
  useEffect(() => {
    if (defaultAddress) {
      setAddressData({
        street: defaultAddress.street,
        number: defaultAddress.number,
        complement: defaultAddress.complement || "",
        neighborhood: defaultAddress.neighborhood,
        city: defaultAddress.city,
        state: defaultAddress.state,
        zip_code: defaultAddress.zip_code,
        latitude: defaultAddress.latitude || undefined,
        longitude: defaultAddress.longitude || undefined,
      });
    }
  }, [defaultAddress]);

  const handleSave = async () => {
    // Validate address is filled
    if (!addressData.street || !addressData.number || !addressData.neighborhood || 
        !addressData.city || !addressData.state || !addressData.zip_code) {
      toast.error("Por favor, preencha todos os campos de endereço obrigatórios");
      return;
    }

    // Update profile
    updateProfile.mutate(formData, {
      onSuccess: async () => {
        // Save or update address
        if (defaultAddress) {
          await updateAddress.mutateAsync({
            id: defaultAddress.id,
            updates: {
              ...addressData,
              is_default: true,
            },
          });
        } else {
          await createAddress.mutateAsync({
            ...addressData,
            complement: addressData.complement || null,
            latitude: addressData.latitude || null,
            longitude: addressData.longitude || null,
            is_default: true,
          });
        }
        setIsEditing(false);
      },
    });
  };

  if (isLoading || isLoadingAddress) {
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-24">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-display font-bold mb-8 text-primary">
            Meu Perfil
          </h1>

          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>Gerencie suas informações de perfil</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile?.email || ""}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="firstName">
                    <User className="w-4 h-4 inline mr-2" />
                    Nome
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="Seu nome"
                    disabled={!isEditing}
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="lastName">
                    <User className="w-4 h-4 inline mr-2" />
                    Sobrenome
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Seu sobrenome"
                    disabled={!isEditing}
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="phone">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Telefone
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(00) 00000-0000"
                    disabled={!isEditing}
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="birthDate">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Data de Nascimento
                  </Label>
                  <Input
                    id="birthDate"
                    type="date"
                    disabled={!isEditing}
                    value={formData.birth_date}
                    onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="pt-6 border-t">
                <h3 className="text-lg font-semibold mb-4">Endereço</h3>
                <AddressAutocomplete
                  value={addressData}
                  onChange={setAddressData}
                  disabled={!isEditing}
                />
              </div>

              <div className="flex gap-3 pt-4">
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)}>
                    Editar Perfil
                  </Button>
                ) : (
                  <>
                    <Button 
                      onClick={handleSave}
                      disabled={updateProfile.isPending}
                    >
                      {updateProfile.isPending ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsEditing(false);
                        if (profile) {
                          setFormData({
                            first_name: profile.first_name || "",
                            last_name: profile.last_name || "",
                            phone_number: profile.phone_number || "",
                            birth_date: profile.birth_date || "",
                          });
                        }
                      }}
                    >
                      Cancelar
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
