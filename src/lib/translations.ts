// Traduções para status e tipos do sistema

export const bookingStatusLabels: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmada",
  in_progress: "Em Andamento",
  completed: "Concluída",
  cancelled: "Cancelada",
  disputed: "Em Disputa",
};

export const vehicleStatusLabels: Record<string, string> = {
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Rejeitado",
  suspended: "Suspenso",
};

export const verificationStatusLabels: Record<string, string> = {
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Rejeitado",
};

export const userStatusLabels: Record<string, string> = {
  pending: "Pendente",
  verified: "Verificado",
  suspended: "Suspenso",
  banned: "Banido",
};

export const vehicleTypeLabels: Record<string, string> = {
  sedan: "Sedan",
  hatch: "Hatch",
  hatchback: "Hatch",
  suv: "SUV",
  pickup: "Picape",
  convertible: "Conversível",
  coupe: "Cupê",
  van: "Van",
  minivan: "Minivan",
  wagon: "Perua",
  sport: "Esportivo",
};

export const transmissionLabels: Record<string, string> = {
  automatic: "Automático",
  manual: "Manual",
  cvt: "CVT",
};

export const fuelLabels: Record<string, string> = {
  flex: "Flex",
  gasoline: "Gasolina",
  ethanol: "Etanol",
  diesel: "Diesel",
  electric: "Elétrico",
  hybrid: "Híbrido",
};

// Helper functions
export const translateBookingStatus = (status: string): string => 
  bookingStatusLabels[status] || status;

export const translateVehicleStatus = (status: string): string => 
  vehicleStatusLabels[status] || status;

export const translateVerificationStatus = (status: string | null): string => 
  status ? (verificationStatusLabels[status] || status) : "Não enviado";

export const translateUserStatus = (status: string): string => 
  userStatusLabels[status] || status;

export const translateVehicleType = (type: string): string => 
  vehicleTypeLabels[type] || type;

export const translateTransmission = (type: string): string => 
  transmissionLabels[type] || type;

export const translateFuel = (type: string): string => 
  fuelLabels[type] || type;
