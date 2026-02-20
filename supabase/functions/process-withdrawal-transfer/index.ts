import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const adminId = claimsData.claims.sub as string;

    // Verify admin role using service role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
      _user_id: adminId,
      _role: "admin",
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden: Admin only" }), {
        status: 403, headers: corsHeaders,
      });
    }

    const { withdrawalId } = await req.json();
    if (!withdrawalId) {
      return new Response(JSON.stringify({ error: "Missing withdrawalId" }), {
        status: 400, headers: corsHeaders,
      });
    }

    // Get withdrawal details
    const { data: withdrawal, error: wErr } = await supabaseAdmin
      .from("withdrawals")
      .select("*")
      .eq("id", withdrawalId)
      .single();

    if (wErr || !withdrawal) {
      return new Response(JSON.stringify({ error: "Withdrawal not found" }), {
        status: 404, headers: corsHeaders,
      });
    }

    if (withdrawal.status !== "pending" && withdrawal.status !== "approved") {
      return new Response(JSON.stringify({ error: `Cannot process withdrawal with status: ${withdrawal.status}` }), {
        status: 400, headers: corsHeaders,
      });
    }

    // Get owner's Stripe Connect account
    const { data: ownerProfile } = await supabaseAdmin
      .from("profiles")
      .select("stripe_account_id, stripe_onboarding_complete, first_name, last_name")
      .eq("id", withdrawal.owner_id)
      .single();

    if (!ownerProfile?.stripe_account_id || !ownerProfile.stripe_onboarding_complete) {
      // Update withdrawal status to approved but can't transfer
      await supabaseAdmin.from("withdrawals").update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminId,
        admin_notes: "Aprovado, mas proprietário não completou onboarding Stripe Connect. Transferência manual necessária.",
      }).eq("id", withdrawalId);

      return new Response(JSON.stringify({
        success: false,
        error: "Owner has not completed Stripe Connect onboarding. Withdrawal approved but transfer must be done manually.",
        manual_transfer_required: true,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Process Stripe Transfer
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const amountInCents = Math.round(withdrawal.net_amount * 100);

    console.log(`[WITHDRAWAL-TRANSFER] Processing transfer of ${amountInCents} cents to ${ownerProfile.stripe_account_id} for withdrawal ${withdrawalId}`);

    const transfer = await stripe.transfers.create({
      amount: amountInCents,
      currency: "brl",
      destination: ownerProfile.stripe_account_id,
      description: `Saque #${withdrawalId.slice(0, 8)} - ${ownerProfile.first_name} ${ownerProfile.last_name}`,
      metadata: {
        withdrawal_id: withdrawalId,
        owner_id: withdrawal.owner_id,
      },
    });

    console.log(`[WITHDRAWAL-TRANSFER] Transfer created: ${transfer.id}`);

    // Update withdrawal to completed
    await supabaseAdmin.from("withdrawals").update({
      status: "completed",
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminId,
      completed_at: new Date().toISOString(),
      transfer_proof_url: transfer.id,
      admin_notes: `Transferência Stripe automática: ${transfer.id}`,
    }).eq("id", withdrawalId);

    // Notify owner
    await supabaseAdmin.from("notifications").insert({
      user_id: withdrawal.owner_id,
      notification_type: "payment",
      title: "Saque concluído!",
      message: `Seu saque de R$ ${Number(withdrawal.net_amount).toFixed(2)} foi transferido para sua conta Stripe Connect.`,
      action_url: "/owner-withdrawals",
    });

    return new Response(JSON.stringify({
      success: true,
      transfer_id: transfer.id,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("[WITHDRAWAL-TRANSFER] Error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
