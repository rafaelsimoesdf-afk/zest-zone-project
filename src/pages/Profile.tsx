import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useDefaultAddress, useCreateAddress, useUpdateAddress } from "@/hooks/useAddresses";
import { useAllUserReviews } from "@/hooks/useAllUserReviews";
import { useUserRoles } from "@/hooks/useUserRoles";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Mail, Phone, Calendar, Shield, Star, MessageSquare, Car, Users } from "lucide-react";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import type { AddressData } from "@/components/AddressAutocomplete";
import { toast } from "sonner";
import { VerificationSection } from "@/components/profile/VerificationSection";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Profile = () => {
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const { data: defaultAddress, isLoading: isLoadingAddress } = useDefaultAddress();
  const { data: reviewsStats, isLoading: isLoadingReviews } = useAllUserReviews(user?.id || "");
  const { data: userRoles } = useUserRoles(user?.id);
  const updateProfile = useUpdateProfile();
  const isOwner = userRoles?.some((r) => r.role === "owner");
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();
  const [isEditing, setIsEditing] = useState(false);
  
  // Determine default tab - prioritize URL param, fallback to verification
  const defaultTab = tabFromUrl && ["verification", "info", "reviews"].includes(tabFromUrl) 
    ? tabFromUrl 
    : "verification";
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
      <main className="flex-1 container mx-auto px-3 sm:px-4 py-20 sm:py-24">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl sm:text-4xl font-display font-bold mb-4 sm:mb-8 text-primary">
            Meu Perfil
          </h1>

          <Tabs defaultValue={defaultTab} className="space-y-4 sm:space-y-6">
            <TabsList className="grid w-full grid-cols-3 h-auto">
              <TabsTrigger value="verification" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-2.5 px-1 sm:px-3">
                <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Verificação</span>
                <span className="sm:hidden">Verif.</span>
              </TabsTrigger>
              <TabsTrigger value="info" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-2.5 px-1 sm:px-3">
                <User className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Informações</span>
                <span className="sm:hidden">Info</span>
              </TabsTrigger>
              <TabsTrigger value="reviews" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-2.5 px-1 sm:px-3">
                <Star className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Avaliações</span>
                <span className="sm:hidden">Aval.</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="verification">
              {profile && <VerificationSection profile={profile} />}
            </TabsContent>

            <TabsContent value="info">
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg">Informações Pessoais</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Gerencie suas informações de perfil</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4 sm:space-y-6">
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="email">
                        <Mail className="w-4 h-4 inline mr-2" />
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        inputMode="email"
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
                        inputMode="tel"
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

                  <div className="pt-4 sm:pt-6 border-t">
                    <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Endereço</h3>
                    <AddressAutocomplete
                      value={addressData}
                      onChange={setAddressData}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 sm:gap-3 pt-3 sm:pt-4">
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
            </TabsContent>

            <TabsContent value="reviews">
              <div className="space-y-6">
                {/* Avaliações como Locatário */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Avaliações como Locatário
                    </CardTitle>
                    <CardDescription>
                      Avaliações que você recebeu dos proprietários de veículos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingReviews ? (
                      <p className="text-muted-foreground">Carregando avaliações...</p>
                    ) : !reviewsStats || reviewsStats.as_customer.total_reviews === 0 ? (
                      <div className="text-center py-6">
                        <MessageSquare className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                        <p className="text-muted-foreground">
                          Você ainda não recebeu avaliações como locatário.
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Complete reservas para receber avaliações.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Summary */}
                        <div className="flex items-center gap-6 p-4 bg-muted/50 rounded-lg">
                          <div className="text-center">
                            <div className="flex items-center gap-1 justify-center">
                              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                              <span className="text-xl font-bold">
                                {reviewsStats.as_customer.average_rating.toFixed(1)}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">Média</p>
                          </div>
                          <div className="text-center">
                            <span className="text-xl font-bold">
                              {reviewsStats.as_customer.total_reviews}
                            </span>
                            <p className="text-xs text-muted-foreground">Avaliações</p>
                          </div>
                          <div className="text-center">
                            <span className="text-xl font-bold">
                              {reviewsStats.total_trips_as_customer}
                            </span>
                            <p className="text-xs text-muted-foreground">Viagens</p>
                          </div>
                        </div>

                        {/* Reviews list */}
                        <div className="space-y-3">
                          {reviewsStats.as_customer.reviews.map((review) => (
                            <div key={review.id} className="border rounded-lg p-4">
                              <div className="flex items-start gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={review.reviewer?.profile_image || undefined} />
                                  <AvatarFallback>
                                    {review.reviewer?.first_name?.[0] || "U"}
                                    {review.reviewer?.last_name?.[0] || ""}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between flex-wrap gap-2">
                                    <div>
                                      <p className="font-medium">
                                        {review.reviewer?.first_name} {review.reviewer?.last_name}
                                      </p>
                                      {review.booking?.vehicle && (
                                        <p className="text-xs text-muted-foreground">
                                          {review.booking.vehicle.brand} {review.booking.vehicle.model}
                                        </p>
                                      )}
                                    </div>
                                    <span className="text-sm text-muted-foreground">
                                      {format(new Date(review.created_at), "dd/MM/yyyy", { locale: ptBR })}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 mt-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className={`w-4 h-4 ${
                                          star <= review.rating
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "text-muted-foreground"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  {review.comment && (
                                    <p className="mt-2 text-muted-foreground text-sm">{review.comment}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Avaliações como Proprietário - mostra se o usuário for owner OU tiver avaliações como proprietário */}
                {(isOwner || (reviewsStats && reviewsStats.as_owner.total_reviews > 0)) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Car className="w-5 h-5" />
                        Avaliações como Proprietário
                      </CardTitle>
                      <CardDescription>
                        Avaliações que você recebeu dos locatários dos seus veículos
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoadingReviews ? (
                        <p className="text-muted-foreground">Carregando avaliações...</p>
                      ) : !reviewsStats || reviewsStats.as_owner.total_reviews === 0 ? (
                        <div className="text-center py-6">
                          <MessageSquare className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                          <p className="text-muted-foreground">
                            Você ainda não recebeu avaliações como proprietário.
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Complete aluguéis para receber avaliações dos locatários.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Summary */}
                          <div className="flex items-center gap-6 p-4 bg-muted/50 rounded-lg">
                            <div className="text-center">
                              <div className="flex items-center gap-1 justify-center">
                                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                <span className="text-xl font-bold">
                                  {reviewsStats.as_owner.average_rating.toFixed(1)}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">Média</p>
                            </div>
                            <div className="text-center">
                              <span className="text-xl font-bold">
                                {reviewsStats.as_owner.total_reviews}
                              </span>
                              <p className="text-xs text-muted-foreground">Avaliações</p>
                            </div>
                            <div className="text-center">
                              <span className="text-xl font-bold">
                                {reviewsStats.total_trips_as_owner}
                              </span>
                              <p className="text-xs text-muted-foreground">Aluguéis</p>
                            </div>
                          </div>

                          {/* Reviews list */}
                          <div className="space-y-3">
                            {reviewsStats.as_owner.reviews.map((review) => (
                              <div key={review.id} className="border rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage src={review.reviewer?.profile_image || undefined} />
                                    <AvatarFallback>
                                      {review.reviewer?.first_name?.[0] || "U"}
                                      {review.reviewer?.last_name?.[0] || ""}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                      <div>
                                        <p className="font-medium">
                                          {review.reviewer?.first_name} {review.reviewer?.last_name}
                                        </p>
                                        {review.booking?.vehicle && (
                                          <p className="text-xs text-muted-foreground">
                                            {review.booking.vehicle.brand} {review.booking.vehicle.model}
                                          </p>
                                        )}
                                      </div>
                                      <span className="text-sm text-muted-foreground">
                                        {format(new Date(review.created_at), "dd/MM/yyyy", { locale: ptBR })}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 mt-1">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                          key={star}
                                          className={`w-4 h-4 ${
                                            star <= review.rating
                                              ? "fill-yellow-400 text-yellow-400"
                                              : "text-muted-foreground"
                                          }`}
                                        />
                                      ))}
                                    </div>
                                    {review.comment && (
                                      <p className="mt-2 text-muted-foreground text-sm">{review.comment}</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;