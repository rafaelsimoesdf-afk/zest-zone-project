// Saque automático: dispara transferência PIX da subconta Asaas do
// proprietário para sua chave PIX (CPF) assim que a reserva é concluída
// e o saldo da subconta foi liberado pelo Asaas.
//
// Pode ser chamada com:
//   - { bookingId } -> processa uma reserva específica
//   - { ownerId }   -> processa todas as reservas concluídas pendentes do owner
//
// Idempotente: marca bookings.auto_withdraw_triggered_at após disparar.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { asaasFetch, getAsaasEnv } from "../_shared/asaas.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const log = (s: string, d?: unknown) =>
  console.log(`[ASAAS-AUTO-WITHDRAW] ${s}${d ? " - " + JSON.stringify(d) : ""}`);

interface AutoWithdrawBody {
  bookingId?: string;
  ownerId?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = (await req.json().catch(() => ({}))) as AutoWithdrawBody;

    // 1) Coleta as reservas elegíveis
    let bookingsQuery = supabaseAdmin
      .from("bookings")
      .select("id, owner_id, daily_rate, total_days, extra_hours_charge, total_price")
      .eq("status", "completed")
      .is("auto_withdraw_triggered_at", null);

    if (body.bookingId) bookingsQuery = bookingsQuery.eq("id", body.bookingId);
    if (body.ownerId) bookingsQuery = bookingsQuery.eq("owner_id", body.ownerId);

    const { data: bookings, error: bErr } = await bookingsQuery;
    if (bErr) throw bErr;
    if (!bookings || bookings.length === 0) {
      return json({ processed: 0, message: "Nenhuma reserva elegível" });
    }

    log("Eligible bookings", { count: bookings.length });

    const results: Array<Record<string, unknown>> = [];

    // Agrupa por owner para checar configuração e saldo uma vez por owner
    const byOwner = new Map<string, typeof bookings>();
    for (const b of bookings) {
      const arr = byOwner.get(b.owner_id) ?? [];
      arr.push(b);
      byOwner.set(b.owner_id, arr);
    }

    for (const [ownerId, ownerBookings] of byOwner) {
      try {
        // Verifica config de auto-saque do owner
        const { data: settings } = await supabaseAdmin
          .from("withdrawal_settings")
          .select("auto_withdraw_enabled, minimum_amount")
          .eq("owner_id", ownerId)
          .maybeSingle();

        if (!settings?.auto_withdraw_enabled) {
          log("Owner has auto-withdraw disabled", { ownerId });
          // Mesmo assim marca como processado para não reprocessar
          await markBookingsTriggered(supabaseAdmin, ownerBookings.map(b => b.id));
          results.push({ ownerId, skipped: "auto_withdraw_disabled" });
          continue;
        }

        // Carrega subconta Asaas
        const env = getAsaasEnv();
        const { data: subaccount } = await supabaseAdmin
          .from("asaas_customers")
          .select("asaas_wallet_id, asaas_subaccount_api_key")
          .eq("user_id", ownerId)
          .eq("environment", env)
          .eq("is_subaccount", true)
          .maybeSingle();

        if (!subaccount?.asaas_subaccount_api_key) {
          log("Owner has no Asaas subaccount yet", { ownerId });
          results.push({ ownerId, skipped: "no_subaccount" });
          continue;
        }

        // Consulta saldo da subconta no Asaas
        const balance = await asaasFetch<{ balance: number }>(
          "/finance/balance",
          { method: "GET" },
          subaccount.asaas_subaccount_api_key,
        );
        log("Subaccount balance", { ownerId, balance: balance.balance });

        if (!balance.balance || balance.balance < (settings.minimum_amount ?? 0)) {
          log("Balance below minimum, skip for now", { ownerId, balance: balance.balance });
          results.push({ ownerId, skipped: "balance_below_minimum", balance: balance.balance });
          continue;
        }

        // Carrega CPF para chave PIX
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("cpf")
          .eq("id", ownerId)
          .single();

        const cpf = (profile?.cpf ?? "").replace(/\D/g, "");
        if (cpf.length !== 11) {
          log("Invalid CPF for PIX", { ownerId });
          results.push({ ownerId, skipped: "invalid_cpf" });
          continue;
        }

        // Cria withdrawal interno
        const amount = Number(balance.balance.toFixed(2));
        const { data: withdrawal, error: wErr } = await supabaseAdmin
          .from("withdrawals")
          .insert({
            owner_id: ownerId,
            amount,
            platform_fee: 0,
            net_amount: amount,
            pix_key: cpf,
            status: "processing",
            auto_approved: true,
            reviewed_at: new Date().toISOString(),
            admin_notes: "Saque automático após conclusão de reserva (split Asaas)",
          })
          .select()
          .single();
        if (wErr) throw wErr;

        // Dispara transferência PIX a partir da subconta do owner
        const transfer = await asaasFetch<any>(
          "/transfers",
          {
            method: "POST",
            body: JSON.stringify({
              value: amount,
              pixAddressKey: cpf,
              pixAddressKeyType: "CPF",
              description: `Saque automático InfiniteDrive #${withdrawal.id.slice(0, 8)}`,
            }),
          },
          subaccount.asaas_subaccount_api_key,
        );

        log("Auto-transfer created", { ownerId, transferId: transfer.id, amount });

        await supabaseAdmin.from("asaas_transfers").insert({
          withdrawal_id: withdrawal.id,
          owner_id: ownerId,
          asaas_transfer_id: transfer.id,
          status: transfer.status ?? "PENDING",
          value: amount,
          net_value: transfer.netValue ?? null,
          pix_key: cpf,
          pix_key_type: "CPF",
          transfer_fee: transfer.transferFee ?? 0,
          scheduled_date: transfer.scheduledDate ?? null,
          effective_date: transfer.effectiveDate ?? null,
          environment: env,
          metadata: transfer,
        });

        await supabaseAdmin.from("notifications").insert({
          user_id: ownerId,
          notification_type: "payment",
          title: "Saque automático em andamento",
          message: `R$ ${amount.toFixed(2)} foram enviados via PIX automaticamente após a conclusão da reserva.`,
          action_url: "/owner-withdrawals",
        });

        await markBookingsTriggered(supabaseAdmin, ownerBookings.map(b => b.id));
        results.push({ ownerId, withdrawalId: withdrawal.id, transferId: transfer.id, amount });
      } catch (ownerErr) {
        const msg = ownerErr instanceof Error ? ownerErr.message : String(ownerErr);
        log("Owner processing failed", { ownerId, error: msg });
        results.push({ ownerId, error: msg });
      }
    }

    return json({ processed: results.length, results });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log("ERROR", { msg });
    return json({ error: msg }, 500);
  }
});

async function markBookingsTriggered(supabase: any, ids: string[]) {
  if (ids.length === 0) return;
  await supabase
    .from("bookings")
    .update({ auto_withdraw_triggered_at: new Date().toISOString() })
    .in("id", ids);
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
