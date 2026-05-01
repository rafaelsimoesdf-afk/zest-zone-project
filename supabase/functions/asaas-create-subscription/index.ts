import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { asaasFetch, getAsaasEnv, getOrCreateAsaasCustomer } from "../_shared/asaas.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const log = (s: string, d?: unknown) =>
  console.log(`[ASAAS-SUB] ${s}${d ? " - " + JSON.stringify(d) : ""}`);

const SERVICE_PROVIDER_VALUE = 59.90;

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
    const { data: claims } = await supabaseAuth.auth.getClaims(token);
    if (!claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claims.claims.sub as string;

    const body = await req.json().catch(() => ({}));
    const billingType = (body.billingType ?? "PIX") as "PIX" | "BOLETO" | "CREDIT_CARD";

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Verifica se já tem assinatura ativa
    const { data: existingSub } = await supabaseAdmin
      .from("asaas_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "ACTIVE")
      .maybeSingle();

    if (existingSub) {
      return new Response(
        JSON.stringify({ error: "Você já possui uma assinatura ativa" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: profile, error: profileErr } = await supabaseAdmin
      .from("profiles")
      .select("id, first_name, last_name, email, cpf, phone_number")
      .eq("id", userId)
      .single();
    if (profileErr || !profile) throw new Error("Perfil não encontrado");

    const { asaasCustomerId } = await getOrCreateAsaasCustomer(supabaseAdmin, profile);

    const nextDueDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const subscription = await asaasFetch<any>("/subscriptions", {
      method: "POST",
      body: JSON.stringify({
        customer: asaasCustomerId,
        billingType,
        value: SERVICE_PROVIDER_VALUE,
        nextDueDate,
        cycle: "MONTHLY",
        description: "Assinatura Prestador de Serviços InfiniteDrive",
        externalReference: `service_provider:${userId}`,
      }),
    });

    log("Subscription created", { id: subscription.id });

    const { data: stored } = await supabaseAdmin
      .from("asaas_subscriptions")
      .insert({
        user_id: userId,
        asaas_subscription_id: subscription.id,
        asaas_customer_id: asaasCustomerId,
        status: "PENDING",
        value: SERVICE_PROVIDER_VALUE,
        cycle: "MONTHLY",
        billing_type: billingType,
        next_due_date: nextDueDate,
        description: "Assinatura Prestador de Serviços",
        plan_type: "service_provider",
        environment: getAsaasEnv(),
        metadata: subscription,
      })
      .select()
      .single();

    // Busca primeira cobrança da assinatura para retornar invoice/PIX ao usuário
    let firstChargeUrl: string | null = null;
    try {
      const charges = await asaasFetch<any>(
        `/subscriptions/${subscription.id}/payments?limit=1`,
      );
      firstChargeUrl = charges?.data?.[0]?.invoiceUrl ?? null;
    } catch (e) {
      log("first charge fetch failed", { error: String(e) });
    }

    return new Response(
      JSON.stringify({
        subscriptionId: stored?.id,
        asaasSubscriptionId: subscription.id,
        invoiceUrl: firstChargeUrl,
        nextDueDate,
        value: SERVICE_PROVIDER_VALUE,
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
