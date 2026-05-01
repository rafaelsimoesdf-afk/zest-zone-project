import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, asaas-access-token",
};

const log = (step: string, details?: unknown) => {
  console.log(`[ASAAS-WEBHOOK] ${step}${details ? " - " + JSON.stringify(details) : ""}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check (GET) — útil para validar a URL ao cadastrar no Asaas
  if (req.method === "GET") {
    return new Response(
      JSON.stringify({ ok: true, service: "asaas-webhook", ts: new Date().toISOString() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  }

  try {
    // Validar token enviado pelo Asaas
    const expectedToken = Deno.env.get("ASAAS_WEBHOOK_TOKEN");
    const receivedToken = req.headers.get("asaas-access-token");

    if (!expectedToken) {
      log("Missing ASAAS_WEBHOOK_TOKEN secret");
      return new Response(JSON.stringify({ error: "Webhook não configurado" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (receivedToken !== expectedToken) {
      log("Invalid token");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = await req.json();
    log("Event received", { event: payload?.event, id: payload?.payment?.id });

    // TODO: rotear evento (PAYMENT_CONFIRMED, PAYMENT_RECEIVED, TRANSFER_DONE, etc.)
    // Por enquanto, apenas registramos para validar a entrega.
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // (Opcional) gravar log bruto se a tabela existir — silencioso se não existir
    try {
      await supabaseAdmin.from("asaas_webhook_logs").insert({
        event: payload?.event ?? null,
        payload,
      });
    } catch (_e) {
      // tabela ainda não existe — será criada na próxima etapa
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log("ERROR", { msg });
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
