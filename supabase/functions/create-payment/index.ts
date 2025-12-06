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
      days, 
      dailyRate, 
      subtotal, 
      serviceFee, 
      insurance, 
      totalPrice,
      ownerId,
      pickupLocation,
      notes
    } = body;

    logStep("Payment details received", { vehicleId, vehicleName, days, totalPrice });

    if (!vehicleId || !totalPrice || !days) {
      throw new Error("Missing required payment information");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check if a Stripe customer record exists for this user
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing Stripe customer", { customerId });
    } else {
      logStep("No existing Stripe customer found");
    }

    // Create a one-time payment session with dynamic pricing
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: `Aluguel: ${vehicleName}`,
              description: `${days} ${days === 1 ? 'dia' : 'dias'} de aluguel`,
            },
            unit_amount: Math.round(subtotal * 100), // Convert to cents
          },
          quantity: 1,
        },
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: "Taxa de serviço",
              description: "Taxa de serviço da plataforma (15%)",
            },
            unit_amount: Math.round(serviceFee * 100),
          },
          quantity: 1,
        },
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: "Seguro",
              description: `Proteção básica (${days} ${days === 1 ? 'dia' : 'dias'})`,
            },
            unit_amount: Math.round(insurance * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}&vehicleId=${vehicleId}&startDate=${startDate}&endDate=${endDate}&days=${days}&dailyRate=${dailyRate}&totalPrice=${totalPrice}&ownerId=${ownerId}&pickupLocation=${encodeURIComponent(pickupLocation || '')}&notes=${encodeURIComponent(notes || '')}`,
      cancel_url: `${req.headers.get("origin")}/checkout?vehicleId=${vehicleId}&startDate=${startDate}&endDate=${endDate}`,
      metadata: {
        vehicleId,
        startDate,
        endDate,
        days: String(days),
        dailyRate: String(dailyRate),
        totalPrice: String(totalPrice),
        ownerId,
        userId: user.id,
        pickupLocation: pickupLocation || '',
        notes: notes || '',
      },
    });

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
