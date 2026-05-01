import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { asaasFetch, getAsaasEnv } from "../_shared/asaas.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const log = (s: string, d?: unknown) =>
  console.log(`[ASAAS-TRANSFER] ${s}${d ? " - " + JSON.stringify(d) : ""}`);

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
    const adminId = claims.claims.sub as string;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
      _user_id: adminId, _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { withdrawalId } = await req.json();
    if (!withdrawalId) {
      return new Response(JSON.stringify({ error: "Missing withdrawalId" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: withdrawal, error: wErr } = await supabaseAdmin
      .from("withdrawals")
      .select("*")
      .eq("id", withdrawalId)
      .single();

    if (wErr || !withdrawal) {
      return new Response(JSON.stringify({ error: "Withdrawal not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!["pending", "approved"].includes(withdrawal.status)) {
      return new Response(JSON.stringify({ error: `Status inválido: ${withdrawal.status}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Chave PIX = CPF do proprietário (regra atual da plataforma).
    // O campo withdrawal.pix_key já contém o CPF (vide useRequestWithdrawal).
    const rawPixKey = (withdrawal.pix_key || "").replace(/\D/g, "");
    const pixKeyType = "CPF";

    if (!rawPixKey || rawPixKey.length !== 11) {
      return new Response(
        JSON.stringify({ error: "CPF (chave PIX) do proprietário inválido ou ausente." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const pixKey = rawPixKey;

    log("Creating transfer", { withdrawalId, value: withdrawal.net_amount, pixKeyType });

    const transfer = await asaasFetch<any>("/transfers", {
      method: "POST",
      body: JSON.stringify({
        value: Number(Number(withdrawal.net_amount).toFixed(2)),
        pixAddressKey: pixKey,
        pixAddressKeyType: pixKeyType,
        description: `Saque InfiniteDrive #${withdrawalId.slice(0, 8)}`,
      }),
    });

    log("Transfer created", { id: transfer.id, status: transfer.status });

    await supabaseAdmin.from("asaas_transfers").insert({
      withdrawal_id: withdrawalId,
      owner_id: withdrawal.owner_id,
      asaas_transfer_id: transfer.id,
      status: transfer.status ?? "PENDING",
      value: withdrawal.net_amount,
      net_value: transfer.netValue ?? null,
      pix_key: pixKey,
      pix_key_type: pixKeyType,
      transfer_fee: transfer.transferFee ?? 0,
      scheduled_date: transfer.scheduledDate ?? null,
      effective_date: transfer.effectiveDate ?? null,
      environment: getAsaasEnv(),
      metadata: transfer,
    });

    await supabaseAdmin.from("withdrawals").update({
      status: "processing",
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminId,
      admin_notes: `Transferência Asaas iniciada: ${transfer.id}`,
    }).eq("id", withdrawalId);

    await supabaseAdmin.from("notifications").insert({
      user_id: withdrawal.owner_id,
      notification_type: "payment",
      title: "Saque em processamento",
      message: `Seu saque de R$ ${Number(withdrawal.net_amount).toFixed(2)} foi enviado via PIX (Asaas).`,
      action_url: "/owner-withdrawals",
    });

    return new Response(
      JSON.stringify({ success: true, transferId: transfer.id, status: transfer.status }),
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
