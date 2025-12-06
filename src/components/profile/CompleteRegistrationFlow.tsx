import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Profile, useUpdateProfile } from "@/hooks/useProfile";
import { useDefaultAddress, useCreateAddress, useUpdateAddress } from "@/hooks/useAddresses";
import {
  useSaveCNHDetails,
  useSaveIdentityDocument,
  useSaveSelfieVerification,
  useSaveProofOfResidence,
  useSubmitVerification,
  uploadDocument,
} from "@/hooks/useUserVerification";
import { validateCPF, validatePhone, validateCEP, calculateAge, isCNHExpired } from "@/lib/validators";

import { ProgressBar } from "@/components/registration/ProgressBar";
import { StepPersonalData } from "@/components/registration/StepPersonalData";
import { StepAddress } from "@/components/registration/StepAddress";
import { StepIdentityDocuments } from "@/components/registration/StepIdentityDocuments";
import { StepCNH } from "@/components/registration/StepCNH";
import { StepSelfie } from "@/components/registration/StepSelfie";
import { StepProofOfResidence } from "@/components/registration/StepProofOfResidence";
import { StepReview } from "@/components/registration/StepReview";

const STEPS = [
  "Dados Pessoais",
  "Endereço",
  "Documentos",
  "CNH",
  "Selfie",
  "Comprovante",
  "Revisão",
];

interface CompleteRegistrationFlowProps {
  profile: Profile;
  onBack: () => void;
}

const CompleteRegistrationFlow = ({ profile, onBack }: CompleteRegistrationFlowProps) => {
  const { data: existingAddress } = useDefaultAddress();
  const updateProfile = useUpdateProfile();
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();
  const saveCNH = useSaveCNHDetails();
  const saveIdentity = useSaveIdentityDocument();
  const saveSelfie = useSaveSelfieVerification();
  const saveProof = useSaveProofOfResidence();
  const submitVerification = useSubmitVerification();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [personalData, setPersonalData] = useState({
    first_name: profile.first_name || "",
    last_name: profile.last_name || "",
    birth_date: profile.birth_date || "",
    cpf: profile.cpf || "",
    phone_number: profile.phone_number || "",
  });

  const [addressData, setAddressData] = useState({
    zip_code: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
  });

  const [identityData, setIdentityData] = useState({
    document_type: "rg" as "rg" | "cnh",
    front_image: null as File | null,
    back_image: null as File | null,
    front_preview: "",
    back_preview: "",
  });

  const [cnhData, setCnhData] = useState({
    cnh_number: "",
    category: "",
    issue_date: "",
    expiry_date: "",
    front_image: null as File | null,
    back_image: null as File | null,
    front_preview: "",
    back_preview: "",
  });

  const [selfieData, setSelfieData] = useState({
    selfie_image: null as File | null,
    selfie_preview: "",
  });

  const [proofData, setProofData] = useState({
    document_type: "",
    document_image: null as File | null,
    document_preview: "",
  });

  const [confirmations, setConfirmations] = useState({
    data_accuracy: false,
    lgpd: false,
    terms: false,
  });

  useEffect(() => {
    if (existingAddress) {
      setAddressData({
        zip_code: existingAddress.zip_code || "",
        street: existingAddress.street || "",
        number: existingAddress.number || "",
        complement: existingAddress.complement || "",
        neighborhood: existingAddress.neighborhood || "",
        city: existingAddress.city || "",
        state: existingAddress.state || "",
      });
    }
  }, [existingAddress]);

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!personalData.first_name.trim()) newErrors.first_name = "Nome é obrigatório";
        if (!personalData.last_name.trim()) newErrors.last_name = "Sobrenome é obrigatório";
        if (!personalData.birth_date) {
          newErrors.birth_date = "Data de nascimento é obrigatória";
        } else {
          const age = calculateAge(new Date(personalData.birth_date));
          if (age < 18) newErrors.birth_date = "Você deve ter pelo menos 18 anos";
        }
        if (!personalData.cpf) {
          newErrors.cpf = "CPF é obrigatório";
        } else if (!validateCPF(personalData.cpf)) {
          newErrors.cpf = "CPF inválido";
        }
        if (!personalData.phone_number) {
          newErrors.phone_number = "Telefone é obrigatório";
        } else if (!validatePhone(personalData.phone_number)) {
          newErrors.phone_number = "Telefone inválido";
        }
        break;

      case 2:
        if (!addressData.zip_code) {
          newErrors.zip_code = "CEP é obrigatório";
        } else if (!validateCEP(addressData.zip_code)) {
          newErrors.zip_code = "CEP inválido";
        }
        if (!addressData.street.trim()) newErrors.street = "Rua é obrigatória";
        if (!addressData.number.trim()) newErrors.number = "Número é obrigatório";
        if (!addressData.neighborhood.trim()) newErrors.neighborhood = "Bairro é obrigatório";
        if (!addressData.city.trim()) newErrors.city = "Cidade é obrigatória";
        if (!addressData.state.trim()) newErrors.state = "Estado é obrigatório";
        break;

      case 3:
        if (!identityData.front_image) newErrors.front_image = "Frente do documento é obrigatória";
        if (!identityData.back_image) newErrors.back_image = "Verso do documento é obrigatório";
        break;

      case 4:
        if (!cnhData.cnh_number.trim()) newErrors.cnh_number = "Número da CNH é obrigatório";
        if (!cnhData.category) newErrors.category = "Categoria é obrigatória";
        if (!cnhData.issue_date) newErrors.issue_date = "Data de emissão é obrigatória";
        if (!cnhData.expiry_date) {
          newErrors.expiry_date = "Data de validade é obrigatória";
        } else if (isCNHExpired(new Date(cnhData.expiry_date))) {
          newErrors.expiry_date = "CNH está vencida";
        }
        if (!cnhData.front_image) newErrors.front_image = "Frente da CNH é obrigatória";
        if (!cnhData.back_image) newErrors.back_image = "Verso da CNH é obrigatório";
        break;

      case 5:
        if (!selfieData.selfie_image) newErrors.selfie_image = "Selfie é obrigatória";
        break;

      case 6:
        if (!proofData.document_type) newErrors.document_type = "Tipo de comprovante é obrigatório";
        if (!proofData.document_image) newErrors.document_image = "Comprovante é obrigatório";
        break;

      case 7:
        if (!confirmations.data_accuracy) newErrors.data_accuracy = "Confirmação obrigatória";
        if (!confirmations.lgpd) newErrors.lgpd = "Confirmação obrigatória";
        if (!confirmations.terms) newErrors.terms = "Confirmação obrigatória";
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  };

  const handleBack = () => {
    if (currentStep === 1) {
      onBack();
    } else {
      setCurrentStep((prev) => Math.max(prev - 1, 1));
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(7)) return;

    setIsSubmitting(true);
    try {
      // 1. Update profile
      await updateProfile.mutateAsync({
        first_name: personalData.first_name,
        last_name: personalData.last_name,
        birth_date: personalData.birth_date,
        cpf: personalData.cpf.replace(/\D/g, ""),
        phone_number: personalData.phone_number.replace(/\D/g, ""),
      });

      // 2. Save address
      const addressPayload = {
        street: addressData.street,
        number: addressData.number,
        complement: addressData.complement || null,
        neighborhood: addressData.neighborhood,
        city: addressData.city,
        state: addressData.state,
        zip_code: addressData.zip_code.replace(/\D/g, ""),
        is_default: true,
        latitude: null,
        longitude: null,
      };

      if (existingAddress) {
        await updateAddress.mutateAsync({ id: existingAddress.id, updates: addressPayload });
      } else {
        await createAddress.mutateAsync(addressPayload);
      }

      // 3. Upload and save identity documents
      const identityFrontUrl = await uploadDocument(identityData.front_image!, "identity");
      const identityBackUrl = await uploadDocument(identityData.back_image!, "identity");
      await saveIdentity.mutateAsync({
        document_type: identityData.document_type,
        front_image_url: identityFrontUrl,
        back_image_url: identityBackUrl,
      });

      // 4. Upload and save CNH
      const cnhFrontUrl = await uploadDocument(cnhData.front_image!, "cnh");
      const cnhBackUrl = await uploadDocument(cnhData.back_image!, "cnh");
      await saveCNH.mutateAsync({
        cnh_number: cnhData.cnh_number,
        category: cnhData.category,
        issue_date: cnhData.issue_date,
        expiry_date: cnhData.expiry_date,
        front_image_url: cnhFrontUrl,
        back_image_url: cnhBackUrl,
      });

      // 5. Upload and save selfie
      const selfieUrl = await uploadDocument(selfieData.selfie_image!, "selfie");
      await saveSelfie.mutateAsync(selfieUrl);

      // 6. Upload and save proof of residence
      const proofUrl = await uploadDocument(proofData.document_image!, "proof");
      await saveProof.mutateAsync({
        document_type: proofData.document_type,
        document_url: proofUrl,
      });

      // 7. Submit for verification
      await submitVerification.mutateAsync();

      setIsSuccess(true);
    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error(error.message || "Erro ao enviar cadastro. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Cadastro Enviado!</h2>
          <p className="text-muted-foreground mb-6">
            Seu cadastro foi enviado para análise. Você será notificado quando for aprovado.
          </p>
          <Button onClick={onBack}>Voltar ao Perfil</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={handleBack} size="icon">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Complete seu Cadastro</h2>
          <p className="text-muted-foreground">
            Para alugar ou anunciar veículos, complete sua verificação
          </p>
        </div>
      </div>

      <ProgressBar currentStep={currentStep} totalSteps={STEPS.length} steps={STEPS} />

      <Card>
        <CardContent className="p-6">
          {currentStep === 1 && (
            <StepPersonalData data={personalData} onChange={setPersonalData} errors={errors} />
          )}
          {currentStep === 2 && (
            <StepAddress data={addressData} onChange={setAddressData} errors={errors} />
          )}
          {currentStep === 3 && (
            <StepIdentityDocuments data={identityData} onChange={setIdentityData} errors={errors} />
          )}
          {currentStep === 4 && (
            <StepCNH data={cnhData} onChange={setCnhData} errors={errors} />
          )}
          {currentStep === 5 && (
            <StepSelfie data={selfieData} onChange={setSelfieData} errors={errors} />
          )}
          {currentStep === 6 && (
            <StepProofOfResidence data={proofData} onChange={setProofData} errors={errors} />
          )}
          {currentStep === 7 && (
            <StepReview
              data={{
                personalData,
                addressData,
                identityData,
                cnhData,
                selfieData,
                proofData,
              }}
              confirmations={confirmations}
              onConfirmationsChange={setConfirmations}
              errors={errors}
            />
          )}

          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={isSubmitting}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {currentStep === 1 ? "Cancelar" : "Anterior"}
            </Button>

            {currentStep < STEPS.length ? (
              <Button onClick={handleNext}>
                Próximo
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar Cadastro"
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompleteRegistrationFlow;