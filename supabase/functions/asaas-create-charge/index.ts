import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { asaasFetch, getAsaasEnv, getOrCreateAsaasCustomer } from "../_shared/asaas.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const log = (step: string, details?: unknown) =>
  console.log(`[ASAAS-CHARGE] ${step}${details ? " - " + JSON.stringify(details) : ""}`);

interface CreditCardData {
  holderName: string;
  number: string;       // só dígitos
  expiryMonth: string;  // MM
  expiryYear: string;   // YYYY
  ccv: string;
}

interface CreditCardHolderInfo {
  name: string;
  email: string;
  cpfCnpj: string;
  postalCode: string;
  addressNumber: string;
  phone?: string;
}

interface ChargeBody {
  bookingPayload: {
    vehicleId: string;
    ownerId: string;
    startDate: string;
    endDate: string;
    days: number;
    dailyRate: number;
    totalPrice: number;
    pickupLocation?: string;
    notes?: string;
    startTime?: string;
    endTime?: string;
    extraHours?: number;
    extraHoursCharge?: number;
    acceptances?: any;
  };
  billingType: "PIX" | "BOLETO" | "CREDIT_CARD" | "UNDEFINED";
  dueDate?: string; // YYYY-MM-DD
  // Apenas quando billingType = CREDIT_CARD:
  creditCard?: CreditCardData;
  creditCardHolderInfo?: CreditCardHolderInfo;
  creditCardToken?: string;   // pagamento "1-clique"
  remoteIp?: string;
  saveCard?: boolean;         // tokeniza após cobrança bem-sucedida
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supabaseAuth.auth.getClaims(token);
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claims.claims.sub as string;

    const body = (await req.json()) as ChargeBody;
    if (!body?.bookingPayload || !body?.billingType) {
      return new Response(JSON.stringify({ error: "Payload inválido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Carrega perfil do usuário
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from("profiles")
      .select("id, first_name, last_name, email, cpf, phone_number, status, verification_status")
      .eq("id", userId)
      .single();

    if (profileErr || !profile) throw new Error("Perfil não encontrado");
    if (profile.verification_status !== "approved") {
      throw new Error("Apenas usuários verificados podem realizar reservas");
    }

    log("Profile loaded", { userId, verification_status: profile.verification_status });

    const { asaasCustomerId } = await getOrCreateAsaasCustomer(supabaseAdmin, profile);
    log("Customer ready", { asaasCustomerId });

    // Cria cobrança
    const dueDate = body.dueDate ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const description = `Reserva InfiniteDrive — ${body.bookingPayload.days} diária(s)`;

    const chargePayload: Record<string, unknown> = {
      customer: asaasCustomerId,
      billingType: body.billingType,
      value: Number(body.bookingPayload.totalPrice.toFixed(2)),
      dueDate,
      description,
      externalReference: `vehicle:${body.bookingPayload.vehicleId}|user:${userId}`,
    };

    // Cartão de crédito embutido (sem redirect): envia dados ou token
    if (body.billingType === "CREDIT_CARD") {
      if (body.creditCardToken) {
        chargePayload.creditCardToken = body.creditCardToken;
      } else if (body.creditCard && body.creditCardHolderInfo) {
        chargePayload.creditCard = {
          holderName: body.creditCard.holderName,
          number: body.creditCard.number.replace(/\D/g, ""),
          expiryMonth: body.creditCard.expiryMonth,
          expiryYear: body.creditCard.expiryYear,
          ccv: body.creditCard.ccv,
        };
        chargePayload.creditCardHolderInfo = {
          name: body.creditCardHolderInfo.name,
          email: body.creditCardHolderInfo.email,
          cpfCnpj: body.creditCardHolderInfo.cpfCnpj.replace(/\D/g, ""),
          postalCode: body.creditCardHolderInfo.postalCode.replace(/\D/g, ""),
          addressNumber: body.creditCardHolderInfo.addressNumber,
          phone: body.creditCardHolderInfo.phone?.replace(/\D/g, ""),
        };
      } else {
        throw new Error("Dados do cartão são obrigatórios");
      }
      chargePayload.remoteIp = body.remoteIp ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
    }

    const charge = await asaasFetch<any>("/payments", {
      method: "POST",
      body: JSON.stringify(chargePayload),
    });

    log("Charge created", { id: charge.id, billingType: charge.billingType, status: charge.status });

    // Se PIX, busca QR code
    let pixQrCode: string | null = null;
    let pixCopyPaste: string | null = null;
    let pixExpiration: string | null = null;
    if (body.billingType === "PIX") {
      try {
        const qr = await asaasFetch<any>(`/payments/${charge.id}/pixQrCode`);
        pixQrCode = qr.encodedImage ? `data:image/png;base64,${qr.encodedImage}` : null;
        pixCopyPaste = qr.payload ?? null;
        pixExpiration = qr.expirationDate ?? null;
      } catch (e) {
        log("PIX QR fetch failed", { error: String(e) });
      }
    }

    // Tokeniza cartão para próximas compras (se solicitado e foi cobrança nova com cartão)
    if (
      body.billingType === "CREDIT_CARD" &&
      body.saveCard &&
      !body.creditCardToken &&
      charge.creditCard?.creditCardToken
    ) {
      try {
        await supabaseAdmin.from("asaas_saved_cards").insert({
          user_id: userId,
          asaas_customer_id: asaasCustomerId,
          credit_card_token: charge.creditCard.creditCardToken,
          credit_card_brand: charge.creditCard.creditCardBrand ?? null,
          credit_card_last_digits: charge.creditCard.creditCardNumber ?? null,
          holder_name: body.creditCard?.holderName ?? null,
          environment: getAsaasEnv(),
        });
        log("Card tokenized and saved");
      } catch (e) {
        log("Save card failed (non-fatal)", { error: String(e) });
      }
    }

    // Salva charge no banco com metadata da reserva (cria o booking depois do pagamento)
    const { data: stored, error: storeErr } = await supabaseAdmin
      .from("asaas_charges")
      .insert({
        booking_id: null, // será preenchido após confirmação de pagamento
        customer_id: userId,
        asaas_payment_id: charge.id,
        asaas_customer_id: asaasCustomerId,
        billing_type: body.billingType,
        status: charge.status,
        value: charge.value,
        net_value: charge.netValue ?? null,
        due_date: charge.dueDate,
        description,
        invoice_url: charge.invoiceUrl ?? null,
        bank_slip_url: charge.bankSlipUrl ?? null,
        pix_qr_code: pixQrCode,
        pix_copy_paste: pixCopyPaste,
        pix_expiration_date: pixExpiration,
        environment: getAsaasEnv(),
        metadata: { bookingPayload: body.bookingPayload },
      })
      .select()
      .single();

    if (storeErr) throw storeErr;

    return new Response(
      JSON.stringify({
        chargeId: stored.id,
        asaasPaymentId: charge.id,
        billingType: charge.billingType,
        status: charge.status,
        value: charge.value,
        invoiceUrl: charge.invoiceUrl,
        bankSlipUrl: charge.bankSlipUrl,
        pixQrCode,
        pixCopyPaste,
        pixExpiration,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log("ERROR", { msg });
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
