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
    const userId = claimsData.claims.sub as string;

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const { action } = await req.json();

    // Use service role to read/write stripe_account_id
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get profile
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("stripe_account_id, stripe_onboarding_complete, email, first_name, last_name, cpf")
      .eq("id", userId)
      .single();

    if (action === "status") {
      // Return current onboarding status
      let stripeStatus = null;
      if (profile?.stripe_account_id) {
        try {
          const account = await stripe.accounts.retrieve(profile.stripe_account_id);
          stripeStatus = {
            charges_enabled: account.charges_enabled,
            payouts_enabled: account.payouts_enabled,
            details_submitted: account.details_submitted,
          };
          // Update onboarding status if complete
          if (account.charges_enabled && account.payouts_enabled && !profile.stripe_onboarding_complete) {
            await supabaseAdmin
              .from("profiles")
              .update({ stripe_onboarding_complete: true })
              .eq("id", userId);
          }
        } catch (e) {
          console.error("Error retrieving Stripe account:", e);
        }
      }
      return new Response(JSON.stringify({
        has_account: !!profile?.stripe_account_id,
        onboarding_complete: profile?.stripe_onboarding_complete || false,
        stripe_status: stripeStatus,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "create_or_link") {
      let accountId = profile?.stripe_account_id;

      if (!accountId) {
        // Create Stripe Connect Express account
        const account = await stripe.accounts.create({
          type: "express",
          country: "BR",
          email: profile?.email,
          capabilities: {
            transfers: { requested: true },
          },
          business_type: "individual",
          individual: {
            first_name: profile?.first_name || undefined,
            last_name: profile?.last_name || undefined,
            email: profile?.email,
          },
          metadata: { user_id: userId },
        });
        accountId = account.id;

        await supabaseAdmin
          .from("profiles")
          .update({ stripe_account_id: accountId })
          .eq("id", userId);

        console.log(`[STRIPE-CONNECT] Created account ${accountId} for user ${userId}`);
      }

      // Create onboarding link
      const origin = req.headers.get("origin") || "https://zest-zone-project.lovable.app";
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${origin}/owner-withdrawals?stripe_refresh=true`,
        return_url: `${origin}/owner-withdrawals?stripe_onboarding=complete`,
        type: "account_onboarding",
      });

      return new Response(JSON.stringify({ url: accountLink.url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[STRIPE-CONNECT] Error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
