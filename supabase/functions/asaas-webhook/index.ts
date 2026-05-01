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

  if (req.method === "GET") {
    return new Response(
      JSON.stringify({ ok: true, service: "asaas-webhook", ts: new Date().toISOString() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  }

  try {
    const expectedToken = Deno.env.get("ASAAS_WEBHOOK_TOKEN");
    const receivedToken = req.headers.get("asaas-access-token");

    if (!expectedToken) {
      log("Missing ASAAS_WEBHOOK_TOKEN");
      return new Response(JSON.stringify({ error: "Webhook não configurado" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (receivedToken !== expectedToken) {
      log("Invalid token");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = await req.json();
    const event: string = payload?.event ?? "UNKNOWN";
    log("Event received", { event });

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1) Loga o evento
    const { data: logRow } = await supabaseAdmin
      .from("asaas_webhook_logs")
      .insert({ event, payload, processed: false })
      .select()
      .single();

    try {
      // 2) Roteia
      if (event.startsWith("PAYMENT_")) {
        await handlePaymentEvent(supabaseAdmin, event, payload.payment);
      } else if (event.startsWith("TRANSFER_")) {
        await handleTransferEvent(supabaseAdmin, event, payload.transfer);
      } else if (event.startsWith("SUBSCRIPTION_")) {
        await handleSubscriptionEvent(supabaseAdmin, event, payload.subscription);
      } else {
        log("Event not handled", { event });
      }

      if (logRow) {
        await supabaseAdmin
          .from("asaas_webhook_logs")
          .update({ processed: true })
          .eq("id", logRow.id);
      }
    } catch (handlerErr) {
      const msg = handlerErr instanceof Error ? handlerErr.message : String(handlerErr);
      log("Handler error", { event, msg });
      if (logRow) {
        await supabaseAdmin
          .from("asaas_webhook_logs")
          .update({ processed: false, processing_error: msg })
          .eq("id", logRow.id);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log("ERROR", { msg });
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ============= HANDLERS =============

async function handlePaymentEvent(supabase: any, event: string, payment: any) {
  if (!payment?.id) return;
  log("Payment event", { event, id: payment.id, status: payment.status });

  // Atualiza charge
  const { data: charge } = await supabase
    .from("asaas_charges")
    .select("*")
    .eq("asaas_payment_id", payment.id)
    .maybeSingle();

  const updates: any = {
    status: payment.status,
    net_value: payment.netValue ?? null,
  };
  if (payment.status === "RECEIVED" || payment.status === "CONFIRMED") {
    updates.paid_at = new Date().toISOString();
  }

  if (charge) {
    await supabase.from("asaas_charges").update(updates).eq("id", charge.id);
  }

  // Pagamento confirmado e ainda sem booking criado → cria a reserva
  if (
    (event === "PAYMENT_CONFIRMED" || event === "PAYMENT_RECEIVED") &&
    charge && !charge.booking_id && charge.metadata?.bookingPayload
  ) {
    const bp = charge.metadata.bookingPayload;
    log("Creating booking from confirmed payment", { chargeId: charge.id });

    const { data: bookingId, error: rpcErr } = await supabase.rpc("create_booking_atomic", {
      p_customer_id: charge.customer_id,
      p_vehicle_id: bp.vehicleId,
      p_owner_id: bp.ownerId,
      p_start_date: `${bp.startDate}T12:00:00Z`,
      p_end_date: `${bp.endDate}T12:00:00Z`,
      p_start_time: bp.startTime ?? null,
      p_end_time: bp.endTime ?? null,
      p_total_days: bp.days,
      p_daily_rate: bp.dailyRate,
      p_total_price: bp.totalPrice,
      p_extra_hours: bp.extraHours ?? 0,
      p_extra_hours_charge: bp.extraHoursCharge ?? 0,
      p_pickup_location: bp.pickupLocation ?? null,
      p_return_location: null,
      p_notes: bp.notes ?? null,
    });

    if (rpcErr) {
      log("Booking creation failed", { error: rpcErr.message });
    } else {
      await supabase.from("asaas_charges").update({ booking_id: bookingId }).eq("id", charge.id);
      // confirmar booking
      await supabase.from("bookings").update({ status: "confirmed" }).eq("id", bookingId);

      await supabase.from("notifications").insert([
        {
          user_id: charge.customer_id,
          notification_type: "booking",
          title: "Pagamento confirmado!",
          message: "Sua reserva foi criada com sucesso.",
          action_url: "/my-bookings",
        },
        {
          user_id: bp.ownerId,
          notification_type: "booking",
          title: "Nova reserva confirmada!",
          message: "Você recebeu uma nova reserva paga.",
          action_url: "/owner-dashboard",
        },
      ]);
    }
  }
}

async function handleTransferEvent(supabase: any, event: string, transfer: any) {
  if (!transfer?.id) return;
  log("Transfer event", { event, id: transfer.id, status: transfer.status });

  const { data: row } = await supabase
    .from("asaas_transfers")
    .select("*")
    .eq("asaas_transfer_id", transfer.id)
    .maybeSingle();

  if (!row) return;

  const updates: any = {
    status: transfer.status,
    effective_date: transfer.effectiveDate ?? null,
    failure_reason: transfer.failReason ?? null,
  };
  await supabase.from("asaas_transfers").update(updates).eq("id", row.id);

  if (event === "TRANSFER_DONE" && row.withdrawal_id) {
    await supabase.from("withdrawals").update({
      status: "completed",
      completed_at: new Date().toISOString(),
      transfer_proof_url: transfer.id,
      admin_notes: `Transferência Asaas concluída: ${transfer.id}`,
    }).eq("id", row.withdrawal_id);

    await supabase.from("notifications").insert({
      user_id: row.owner_id,
      notification_type: "payment",
      title: "Saque concluído!",
      message: `Seu saque de R$ ${Number(row.value).toFixed(2)} foi transferido via PIX.`,
      action_url: "/owner-withdrawals",
    });
  } else if (event === "TRANSFER_FAILED" && row.withdrawal_id) {
    await supabase.from("withdrawals").update({
      status: "rejected",
      admin_notes: `Transferência Asaas falhou: ${transfer.failReason ?? "sem detalhes"}`,
    }).eq("id", row.withdrawal_id);

    await supabase.from("notifications").insert({
      user_id: row.owner_id,
      notification_type: "payment",
      title: "Falha no saque",
      message: `Sua transferência falhou: ${transfer.failReason ?? "Verifique os dados"}.`,
      action_url: "/owner-withdrawals",
    });
  }
}

async function handleSubscriptionEvent(supabase: any, event: string, subscription: any) {
  if (!subscription?.id) return;
  log("Subscription event", { event, id: subscription.id, status: subscription.status });

  await supabase
    .from("asaas_subscriptions")
    .update({
      status: subscription.status,
      next_due_date: subscription.nextDueDate ?? null,
      cancelled_at: event === "SUBSCRIPTION_DELETED" ? new Date().toISOString() : null,
    })
    .eq("asaas_subscription_id", subscription.id);
}
