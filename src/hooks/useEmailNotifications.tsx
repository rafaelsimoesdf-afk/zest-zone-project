import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

const sendEmail = async (to: string, template: string, data: Record<string, string>) => {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/send-email`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ to, template, data }),
      }
    );
    if (!response.ok) {
      const err = await response.json();
      console.error("[EMAIL] Failed to send:", err);
    }
  } catch (e) {
    console.error("[EMAIL] Error sending email:", e);
  }
};

// ============================================================
// BOOKING EMAILS
// ============================================================

export const sendBookingCreatedEmails = async (params: {
  customerEmail: string;
  customerName: string;
  ownerEmail: string;
  ownerName: string;
  vehicleName: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  dailyRate: number;
  totalPrice: number;
  netRevenue: number;
  pickupLocation?: string | null;
  notes?: string | null;
  bookingId: string;
}) => {
  const bookingUrl = `${window.location.origin}/my-bookings`;

  // Email para o locatário
  sendEmail(params.customerEmail, "booking_created_customer", {
    customerName: params.customerName,
    vehicleName: params.vehicleName,
    startDate: formatDate(params.startDate),
    endDate: formatDate(params.endDate),
    totalDays: String(params.totalDays),
    dailyRate: formatCurrency(params.dailyRate),
    totalPrice: formatCurrency(params.totalPrice),
    pickupLocation: params.pickupLocation || "",
    notes: params.notes || "",
    bookingUrl,
  });

  // Email para o proprietário
  sendEmail(params.ownerEmail, "booking_created_owner", {
    ownerName: params.ownerName,
    customerName: params.customerName,
    vehicleName: params.vehicleName,
    startDate: formatDate(params.startDate),
    endDate: formatDate(params.endDate),
    totalDays: String(params.totalDays),
    totalPrice: formatCurrency(params.totalPrice),
    netRevenue: formatCurrency(params.netRevenue),
    notes: params.notes || "",
    bookingUrl: `${window.location.origin}/owner-dashboard`,
  });
};

export const sendBookingStatusEmail = async (params: {
  status: string;
  customerEmail: string;
  customerName: string;
  ownerEmail: string;
  ownerName: string;
  ownerPhone?: string | null;
  vehicleName: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  totalPrice: number;
  dailyRate: number;
  reason?: string;
  bookingId: string;
}) => {
  const bookingUrl = `${window.location.origin}/my-bookings`;
  const netRevenue = params.totalPrice * 0.85;
  const platformFee = params.totalPrice * 0.15;

  switch (params.status) {
    case "confirmed":
      sendEmail(params.customerEmail, "booking_confirmed_customer", {
        customerName: params.customerName,
        ownerName: params.ownerName,
        ownerPhone: params.ownerPhone || "",
        vehicleName: params.vehicleName,
        startDate: formatDate(params.startDate),
        endDate: formatDate(params.endDate),
        totalDays: String(params.totalDays),
        bookingUrl,
      });
      break;

    case "cancelled":
      sendEmail(params.customerEmail, "booking_cancelled_customer", {
        customerName: params.customerName,
        vehicleName: params.vehicleName,
        startDate: formatDate(params.startDate),
        endDate: formatDate(params.endDate),
        reason: params.reason || "",
        bookingUrl,
      });
      break;

    case "completed":
      sendEmail(params.customerEmail, "booking_completed_customer", {
        customerName: params.customerName,
        ownerName: params.ownerName,
        vehicleName: params.vehicleName,
        startDate: formatDate(params.startDate),
        endDate: formatDate(params.endDate),
        totalDays: String(params.totalDays),
        bookingUrl,
      });
      sendEmail(params.ownerEmail, "booking_completed_owner", {
        ownerName: params.ownerName,
        customerName: params.customerName,
        vehicleName: params.vehicleName,
        startDate: formatDate(params.startDate),
        endDate: formatDate(params.endDate),
        totalDays: String(params.totalDays),
        totalPrice: formatCurrency(params.totalPrice),
        platformFee: formatCurrency(platformFee),
        netRevenue: formatCurrency(netRevenue),
      });
      break;
  }
};

// ============================================================
// MESSAGE EMAILS
// ============================================================

export const sendNewMessageEmail = async (params: {
  receiverEmail: string;
  receiverName: string;
  senderName: string;
  vehicleName: string;
  messageContent: string;
  bookingId: string;
}) => {
  const bookingUrl = `${window.location.origin}/messages`;
  const sentAt = new Date().toLocaleString("pt-BR");

  sendEmail(params.receiverEmail, "new_message", {
    receiverName: params.receiverName,
    senderName: params.senderName,
    vehicleName: params.vehicleName,
    messageContent: params.messageContent.substring(0, 300) + (params.messageContent.length > 300 ? "..." : ""),
    sentAt,
    bookingUrl,
  });
};

// ============================================================
// REVIEW EMAILS
// ============================================================

export const sendReviewReceivedEmail = async (params: {
  reviewedEmail: string;
  reviewedName: string;
  reviewerName: string;
  vehicleName: string;
  rating: number;
  comment?: string | null;
}) => {
  sendEmail(params.reviewedEmail, "review_received", {
    reviewedName: params.reviewedName,
    reviewerName: params.reviewerName,
    vehicleName: params.vehicleName,
    rating: String(params.rating),
    comment: params.comment || "",
  });
};

// ============================================================
// VERIFICATION EMAILS
// ============================================================

export const sendVerificationEmail = async (params: {
  userEmail: string;
  userName: string;
  approved: boolean;
  reason?: string;
}) => {
  const template = params.approved ? "verification_approved" : "verification_rejected";
  sendEmail(params.userEmail, template, {
    userName: params.userName,
    reason: params.reason || "",
  });
};

// ============================================================
// VEHICLE EMAILS
// ============================================================

export const sendVehicleStatusEmail = async (params: {
  ownerEmail: string;
  ownerName: string;
  vehicleName: string;
  licensePlate: string;
  dailyPrice: number;
  approved: boolean;
  reason?: string;
}) => {
  const template = params.approved ? "vehicle_approved" : "vehicle_rejected";
  sendEmail(params.ownerEmail, template, {
    ownerName: params.ownerName,
    vehicleName: params.vehicleName,
    licensePlate: params.licensePlate,
    dailyPrice: formatCurrency(params.dailyPrice),
    reason: params.reason || "",
  });
};

// ============================================================
// PAYMENT EMAILS
// ============================================================

export const sendPaymentConfirmedEmail = async (params: {
  customerEmail: string;
  customerName: string;
  vehicleName: string;
  startDate: string;
  endDate: string;
  dailySubtotal: number;
  extraHoursCharge: number;
  insurance: number;
  totalPrice: number;
  sessionId: string;
  bookingId?: string;
}) => {
  const bookingUrl = `${window.location.origin}/my-bookings`;

  sendEmail(params.customerEmail, "payment_confirmed", {
    customerName: params.customerName,
    vehicleName: params.vehicleName,
    startDate: formatDate(params.startDate),
    endDate: formatDate(params.endDate),
    dailySubtotal: formatCurrency(params.dailySubtotal),
    extraHoursCharge: formatCurrency(params.extraHoursCharge),
    insurance: formatCurrency(params.insurance),
    totalPrice: formatCurrency(params.totalPrice),
    sessionId: params.sessionId,
    bookingUrl,
  });
};

// ============================================================
// WITHDRAWAL EMAILS
// ============================================================

export const sendWithdrawalRequestedEmail = async (params: {
  ownerEmail: string;
  ownerName: string;
  amount: number;
  platformFee: number;
  netAmount: number;
  pixKey: string;
}) => {
  sendEmail(params.ownerEmail, "withdrawal_requested", {
    ownerName: params.ownerName,
    amount: formatCurrency(params.amount),
    platformFee: formatCurrency(params.platformFee),
    netAmount: formatCurrency(params.netAmount),
    pixKey: params.pixKey,
  });
};

export const sendWithdrawalCompletedEmail = async (params: {
  ownerEmail: string;
  ownerName: string;
  netAmount: number;
  pixKey: string;
}) => {
  sendEmail(params.ownerEmail, "withdrawal_completed", {
    ownerName: params.ownerName,
    netAmount: formatCurrency(params.netAmount),
    pixKey: params.pixKey,
  });
};

// ============================================================
// WELCOME EMAIL
// ============================================================

export const sendWelcomeEmail = async (params: {
  userEmail: string;
  userName: string;
}) => {
  sendEmail(params.userEmail, "welcome", {
    userName: params.userName,
  });
};

// ============================================================
// BOOKING CONFIRMED — OWNER
// ============================================================

export const sendBookingConfirmedOwnerEmail = async (params: {
  ownerEmail: string;
  ownerName: string;
  customerName: string;
  vehicleName: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  totalPrice: number;
  netRevenue: number;
}) => {
  sendEmail(params.ownerEmail, "booking_confirmed_owner", {
    ownerName: params.ownerName,
    customerName: params.customerName,
    vehicleName: params.vehicleName,
    startDate: formatDate(params.startDate),
    endDate: formatDate(params.endDate),
    totalDays: String(params.totalDays),
    totalPrice: formatCurrency(params.totalPrice),
    netRevenue: formatCurrency(params.netRevenue),
  });
};

// ============================================================
// HELPER: busca dados do usuário para email
// ============================================================

// ============================================================
// SUPPORT TICKET EMAILS
// ============================================================

export const sendTicketOpenedEmail = async (params: {
  userEmail: string;
  userName: string;
  ticketNumber: string;
  subject: string;
  category: string;
  priority: string;
  slaTime: string;
  ticketId: string;
}) => {
  sendEmail(params.userEmail, "ticket_opened", {
    userName: params.userName,
    ticketNumber: params.ticketNumber,
    subject: params.subject,
    category: params.category,
    priority: params.priority,
    slaTime: params.slaTime,
    ticketUrl: `${window.location.origin}/support/ticket/${params.ticketId}`,
  });
};

export const sendTicketRepliedEmail = async (params: {
  userEmail: string;
  userName: string;
  ticketNumber: string;
  messageContent: string;
  ticketId: string;
}) => {
  sendEmail(params.userEmail, "ticket_replied", {
    userName: params.userName,
    ticketNumber: params.ticketNumber,
    messageContent: params.messageContent.substring(0, 300) + (params.messageContent.length > 300 ? "..." : ""),
    repliedAt: new Date().toLocaleString("pt-BR"),
    ticketUrl: `${window.location.origin}/support/ticket/${params.ticketId}`,
  });
};

export const sendTicketStatusEmail = async (params: {
  userEmail: string;
  userName: string;
  ticketNumber: string;
  subject: string;
  status: string;
  statusLabel: string;
  ticketId: string;
}) => {
  sendEmail(params.userEmail, "ticket_status_updated", {
    userName: params.userName,
    ticketNumber: params.ticketNumber,
    subject: params.subject,
    status: params.status,
    statusLabel: params.statusLabel,
    ticketUrl: `${window.location.origin}/support/ticket/${params.ticketId}`,
  });
};

// ============================================================
// HELPER: busca dados do usuário para email
// ============================================================

export const getUserEmailData = async (userId: string): Promise<{ email: string; name: string; phone?: string | null } | null> => {
  try {
    const { data } = await supabase
      .from("profiles")
      .select("email, first_name, last_name, phone_number")
      .eq("id", userId)
      .single();

    if (!data) return null;
    return {
      email: data.email,
      name: `${data.first_name} ${data.last_name}`,
      phone: data.phone_number,
    };
  } catch {
    return null;
  }
};
