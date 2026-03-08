import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    // Retrieve authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }
    
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user?.email) {
      throw new Error("User not authenticated or email not available");
    }
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Parse request body
    const body = await req.json();
    const { 
      vehicleId, 
      vehicleName, 
      startDate, 
      endDate,
      startTime,
      endTime,
      days, 
      dailyRate,
      dailySubtotal,
      extraHours,
      extraHoursCharge,
      subtotal, 
      insurance, 
      totalPrice,
      ownerId,
      pickupLocation,
      notes,
      acceptances,
      appDriver,
      appDriverPeriod,
    } = body;

    logStep("Payment details received", { vehicleId, vehicleName, days, totalPrice, subtotal, insurance, extraHours, extraHoursCharge });

    if (!vehicleId || !totalPrice || !days) {
      throw new Error("Missing required payment information");
    }

    // Calcular a taxa de serviço da plataforma (15% das diárias + horas extras)
    // A plataforma retém: 15% do rental + 100% do seguro
    const rentalAmount = dailySubtotal + (extraHoursCharge || 0);
    const platformFeeAmount = rentalAmount * 0.15;
    const ownerNetAmount = rentalAmount - platformFeeAmount;
    // application_fee_amount = taxa plataforma + seguro (tudo que a plataforma retém)
    const applicationFeeAmount = platformFeeAmount + (insurance || 0);
    const applicationFeeCents = Math.round(applicationFeeAmount * 100);
    logStep("Split calculation", { rentalAmount, platformFeeAmount, ownerNetAmount, insurance, applicationFeeAmount, totalPrice });

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Look up owner's Stripe Connect account for split payment
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    const { data: ownerProfile } = await supabaseAdmin
      .from("profiles")
      .select("stripe_account_id, stripe_onboarding_complete")
      .eq("id", ownerId)
      .single();

    const ownerStripeAccountId = ownerProfile?.stripe_account_id && ownerProfile?.stripe_onboarding_complete
      ? ownerProfile.stripe_account_id
      : null;
    logStep("Owner Stripe account", { ownerId, ownerStripeAccountId, onboardingComplete: ownerProfile?.stripe_onboarding_complete });

    // Check if a Stripe customer record exists for this user
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing Stripe customer", { customerId });
    } else {
      logStep("No existing Stripe customer found");
    }

    // Criar line items
    const periodLabel = appDriver
      ? (appDriverPeriod === 'weekly' ? 'Semanal' : 'Mensal')
      : null;
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price_data: {
          currency: "brl",
          product_data: {
            name: appDriver ? `Aluguel ${periodLabel}: ${vehicleName}` : `Aluguel: ${vehicleName}`,
            description: appDriver
              ? `Aluguel ${periodLabel?.toLowerCase()} para motorista de app (${days} dias)`
              : `${days} ${days === 1 ? 'dia' : 'dias'} de aluguel`,
          },
          unit_amount: Math.round(dailySubtotal * 100),
        },
        quantity: 1,
      },
    ];

    // Adicionar horas extras se existir
    if (extraHoursCharge && extraHoursCharge > 0) {
      lineItems.push({
        price_data: {
          currency: "brl",
          product_data: {
            name: "Horas adicionais",
            description: `${extraHours.toFixed(1)} horas extras`,
          },
          unit_amount: Math.round(extraHoursCharge * 100),
        },
        quantity: 1,
      });
    }

    // Adicionar seguro se existir
    if (insurance && insurance > 0) {
      lineItems.push({
        price_data: {
          currency: "brl",
          product_data: {
            name: "Seguro",
            description: `Proteção básica (${days} ${days === 1 ? 'dia' : 'dias'})`,
          },
          unit_amount: Math.round(insurance * 100),
        },
        quantity: 1,
      });
    }

    // Create a one-time payment session with split payment
    // Owner receives: rental amount - 15% platform fee (via transfer_data)
    // Platform keeps: 15% platform fee + insurance (for insurer)
    const acceptancesEncoded = acceptances ? encodeURIComponent(JSON.stringify(acceptances)) : '';
    
    const sessionParams: any = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: lineItems,
      mode: "payment",
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}&vehicleId=${vehicleId}&startDate=${startDate}&endDate=${endDate}&startTime=${startTime || ''}&endTime=${endTime || ''}&days=${days}&dailyRate=${dailyRate}&extraHours=${extraHours || 0}&extraHoursCharge=${extraHoursCharge || 0}&totalPrice=${totalPrice}&ownerId=${ownerId}&pickupLocation=${encodeURIComponent(pickupLocation || '')}&notes=${encodeURIComponent(notes || '')}&acceptances=${acceptancesEncoded}`,
      cancel_url: `${req.headers.get("origin")}/checkout?vehicleId=${vehicleId}&startDate=${startDate}&endDate=${endDate}&startTime=${startTime || ''}&endTime=${endTime || ''}`,
      metadata: {
        vehicleId,
        startDate,
        endDate,
        startTime: startTime || '',
        endTime: endTime || '',
        days: String(days),
        dailyRate: String(dailyRate),
        dailySubtotal: String(dailySubtotal),
        extraHours: String(extraHours || 0),
        extraHoursCharge: String(extraHoursCharge || 0),
        subtotal: String(subtotal),
        insurance: String(insurance),
        totalPrice: String(totalPrice),
        platformFee: String(platformFeeAmount),
        ownerNetAmount: String(ownerNetAmount),
        ownerId,
        userId: user.id,
        pickupLocation: pickupLocation || '',
        notes: notes || '',
        acceptances: acceptances ? JSON.stringify(acceptances) : '',
      },
    };

    // Try with split payment if owner has Stripe Connect
    let session;
    if (ownerStripeAccountId) {
      try {
        // Usar application_fee_amount para separar claramente no Stripe:
        // - Owner recebe: total - application_fee (diárias + horas extras - 15%)
        // - Plataforma retém: application_fee (15% + seguro)
        sessionParams.payment_intent_data = {
          application_fee_amount: applicationFeeCents,
          transfer_data: {
            destination: ownerStripeAccountId,
          },
        };
        logStep("Attempting split payment with application_fee", { 
          destination: ownerStripeAccountId, 
          applicationFeeCents,
          ownerWillReceive: Math.round(ownerNetAmount * 100)
        });
        session = await stripe.checkout.sessions.create(sessionParams);
        logStep("Split payment session created", { sessionId: session.id });
      } catch (splitError: any) {
        // If split fails, fallback without split
        logStep("Split payment failed, falling back to standard payment", { error: splitError.message });
        delete sessionParams.payment_intent_data;
        session = await stripe.checkout.sessions.create(sessionParams);
        logStep("Fallback session created (no split)", { sessionId: session.id });
      }
    } else {
      logStep("No Stripe Connect account for owner, standard payment");
      session = await stripe.checkout.sessions.create(sessionParams);
    }

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
