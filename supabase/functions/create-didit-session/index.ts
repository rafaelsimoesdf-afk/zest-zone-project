import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user profile for pre-filling
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("first_name, last_name, email, cpf, birth_date")
      .eq("id", user.id)
      .single();

    const DIDIT_API_KEY = Deno.env.get("DIDIT_API_KEY");
    const DIDIT_WORKFLOW_ID = Deno.env.get("DIDIT_WORKFLOW_ID");

    if (!DIDIT_API_KEY || !DIDIT_WORKFLOW_ID) {
      console.error("[DIDIT] Missing DIDIT_API_KEY or DIDIT_WORKFLOW_ID");
      return new Response(JSON.stringify({ error: "Configuração da Didit incompleta" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build callback URL
    const origin = req.headers.get("origin") || "https://zest-zone-project.lovable.app";
    const callbackUrl = `${origin}/profile?didit_verification=complete`;

    // Create Didit session
    const sessionPayload: Record<string, unknown> = {
      workflow_id: DIDIT_WORKFLOW_ID,
      vendor_data: user.id,
      callback: callbackUrl,
      callback_method: "both",
      language: "pt-BR",
      contact_details: {
        email: profile?.email || user.email,
        send_notification_emails: false,
        email_lang: "pt-BR",
      },
      expected_details: {} as Record<string, string>,
    };

    // Pre-fill expected details if available
    const expectedDetails: Record<string, string> = {};
    if (profile?.first_name) expectedDetails.first_name = profile.first_name;
    if (profile?.last_name) expectedDetails.last_name = profile.last_name;
    if (profile?.birth_date) expectedDetails.date_of_birth = profile.birth_date;
    if (profile?.cpf) expectedDetails.identification_number = profile.cpf;
    expectedDetails.id_country = "BRA";
    sessionPayload.expected_details = expectedDetails;

    console.log("[DIDIT] Creating session for user:", user.id);

    const diditResponse = await fetch("https://verification.didit.me/v3/session/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": DIDIT_API_KEY,
      },
      body: JSON.stringify(sessionPayload),
    });

    if (!diditResponse.ok) {
      const errorText = await diditResponse.text();
      console.error("[DIDIT] API error:", diditResponse.status, errorText);
      return new Response(JSON.stringify({ error: `Erro na API Didit: ${errorText}` }), {
        status: diditResponse.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const diditData = await diditResponse.json();
    console.log("[DIDIT] Session created:", diditData.session_id);

    // Store session in database
    const { error: insertError } = await supabaseAdmin
      .from("didit_verification_sessions")
      .insert({
        user_id: user.id,
        session_id: diditData.session_id,
        session_token: diditData.session_token,
        session_url: diditData.url,
        workflow_id: DIDIT_WORKFLOW_ID,
        status: diditData.status || "Not Started",
        vendor_data: user.id,
      });

    if (insertError) {
      console.error("[DIDIT] DB insert error:", insertError);
    }

    return new Response(JSON.stringify({
      session_id: diditData.session_id,
      url: diditData.url,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[DIDIT] Error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
