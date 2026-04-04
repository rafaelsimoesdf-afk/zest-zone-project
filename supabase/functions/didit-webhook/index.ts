import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-signature, x-signature-v2, x-signature-simple, x-timestamp",
};

// Process floats to match server-side behavior
function shortenFloats(data: unknown): unknown {
  if (Array.isArray(data)) {
    return data.map(shortenFloats);
  } else if (data !== null && typeof data === "object") {
    return Object.fromEntries(
      Object.entries(data as Record<string, unknown>).map(([key, value]) => [key, shortenFloats(value)])
    );
  } else if (typeof data === "number" && !Number.isInteger(data) && data % 1 === 0) {
    return Math.trunc(data);
  }
  return data;
}

// Sort keys recursively
function sortKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(sortKeys);
  } else if (obj !== null && typeof obj === "object") {
    return Object.keys(obj as Record<string, unknown>).sort().reduce((result: Record<string, unknown>, key: string) => {
      result[key] = sortKeys((obj as Record<string, unknown>)[key]);
      return result;
    }, {});
  }
  return obj;
}

// Verify X-Signature-Simple (most reliable for Deno)
function verifySignatureSimple(
  jsonBody: Record<string, unknown>,
  signatureHeader: string,
  timestampHeader: string,
  secretKey: string
): boolean {
  const currentTime = Math.floor(Date.now() / 1000);
  const incomingTime = parseInt(timestampHeader, 10);
  if (Math.abs(currentTime - incomingTime) > 300) {
    return false;
  }

  const canonicalString = [
    (jsonBody.timestamp as string) || "",
    (jsonBody.session_id as string) || "",
    (jsonBody.status as string) || "",
    (jsonBody.webhook_type as string) || "",
  ].join(":");

  const encoder = new TextEncoder();
  const key = encoder.encode(secretKey);
  const data = encoder.encode(canonicalString);

  // Use Web Crypto API for HMAC
  return crypto.subtle.importKey(
    "raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  ).then(async (cryptoKey) => {
    const signature = await crypto.subtle.sign("HMAC", cryptoKey, data);
    const expectedSignature = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
    return expectedSignature === signatureHeader;
  }).catch(() => false) as unknown as boolean;
}

async function verifySignatureSimpleAsync(
  jsonBody: Record<string, unknown>,
  signatureHeader: string,
  timestampHeader: string,
  secretKey: string
): Promise<boolean> {
  const currentTime = Math.floor(Date.now() / 1000);
  const incomingTime = parseInt(timestampHeader, 10);
  if (Math.abs(currentTime - incomingTime) > 300) {
    console.log("[DIDIT-WEBHOOK] Timestamp too old:", Math.abs(currentTime - incomingTime), "seconds");
    return false;
  }

  const canonicalString = [
    String(jsonBody.timestamp || ""),
    String(jsonBody.session_id || ""),
    String(jsonBody.status || ""),
    String(jsonBody.webhook_type || ""),
  ].join(":");

  const encoder = new TextEncoder();
  const key = encoder.encode(secretKey);
  const data = encoder.encode(canonicalString);

  try {
    const cryptoKey = await crypto.subtle.importKey(
      "raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", cryptoKey, data);
    const expectedSignature = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
    return expectedSignature === signatureHeader;
  } catch (e) {
    console.error("[DIDIT-WEBHOOK] Signature verification error:", e);
    return false;
  }
}

async function verifySignatureV2Async(
  jsonBody: Record<string, unknown>,
  signatureHeader: string,
  timestampHeader: string,
  secretKey: string
): Promise<boolean> {
  const currentTime = Math.floor(Date.now() / 1000);
  const incomingTime = parseInt(timestampHeader, 10);
  if (Math.abs(currentTime - incomingTime) > 300) {
    return false;
  }

  const processedData = shortenFloats(jsonBody);
  const canonicalJson = JSON.stringify(sortKeys(processedData));

  const encoder = new TextEncoder();
  const key = encoder.encode(secretKey);
  const data = encoder.encode(canonicalJson);

  try {
    const cryptoKey = await crypto.subtle.importKey(
      "raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", cryptoKey, data);
    const expectedSignature = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
    return expectedSignature === signatureHeader;
  } catch {
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const WEBHOOK_SECRET = Deno.env.get("DIDIT_WEBHOOK_SECRET");
    if (!WEBHOOK_SECRET) {
      console.error("[DIDIT-WEBHOOK] Missing DIDIT_WEBHOOK_SECRET");
      return new Response(JSON.stringify({ error: "Webhook secret not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const signatureV2 = req.headers.get("x-signature-v2");
    const signatureSimple = req.headers.get("x-signature-simple");
    const timestamp = req.headers.get("x-timestamp");

    const jsonBody = await req.json();

    console.log("[DIDIT-WEBHOOK] Received:", JSON.stringify({
      session_id: jsonBody.session_id,
      status: jsonBody.status,
      webhook_type: jsonBody.webhook_type,
    }));

    // Verify signature
    if (!timestamp) {
      console.error("[DIDIT-WEBHOOK] Missing timestamp header");
      return new Response(JSON.stringify({ error: "Missing timestamp" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let verified = false;
    if (signatureV2) {
      verified = await verifySignatureV2Async(jsonBody, signatureV2, timestamp, WEBHOOK_SECRET);
      if (verified) console.log("[DIDIT-WEBHOOK] Verified with X-Signature-V2");
    }
    if (!verified && signatureSimple) {
      verified = await verifySignatureSimpleAsync(jsonBody, signatureSimple, timestamp, WEBHOOK_SECRET);
      if (verified) console.log("[DIDIT-WEBHOOK] Verified with X-Signature-Simple");
    }

    if (!verified) {
      console.error("[DIDIT-WEBHOOK] Invalid signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { session_id, status, vendor_data, decision } = jsonBody;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Update session status
    const { error: updateError } = await supabaseAdmin
      .from("didit_verification_sessions")
      .update({
        status,
        decision: decision || null,
      })
      .eq("session_id", session_id);

    if (updateError) {
      console.error("[DIDIT-WEBHOOK] DB update error:", updateError);
    }

    // If approved, update the user's verification status
    if (status === "Approved" && vendor_data) {
      console.log("[DIDIT-WEBHOOK] User approved, updating profile:", vendor_data);

      // Update profile verification status
      await supabaseAdmin
        .from("profiles")
        .update({
          verification_status: "approved",
          verification_validated_at: new Date().toISOString(),
        })
        .eq("id", vendor_data);

      // Mark selfie as verified if we have liveness data
      if (decision?.liveness_checks?.length > 0) {
        const livenessCheck = decision.liveness_checks[0];
        if (livenessCheck.reference_image) {
          // Upsert selfie verification record
          const { data: existingSelfie } = await supabaseAdmin
            .from("selfie_verifications")
            .select("id")
            .eq("user_id", vendor_data)
            .maybeSingle();

          if (existingSelfie) {
            await supabaseAdmin
              .from("selfie_verifications")
              .update({
                selfie_url: livenessCheck.reference_image,
                verified: true,
                verified_at: new Date().toISOString(),
              })
              .eq("user_id", vendor_data);
          } else {
            await supabaseAdmin
              .from("selfie_verifications")
              .insert({
                user_id: vendor_data,
                selfie_url: livenessCheck.reference_image,
                verified: true,
                verified_at: new Date().toISOString(),
              });
          }
        }
      }

      // Mark identity document as verified if we have ID verification data
      if (decision?.id_verifications?.length > 0) {
        const idVerification = decision.id_verifications[0];
        const { data: existingDoc } = await supabaseAdmin
          .from("identity_documents")
          .select("id")
          .eq("user_id", vendor_data)
          .maybeSingle();

        const docPayload = {
          document_type: idVerification.document_type?.includes("Driver") ? "cnh" : "rg",
          front_image_url: idVerification.front_image || "",
          back_image_url: idVerification.back_image || "",
          verified: true,
          verified_at: new Date().toISOString(),
        };

        if (existingDoc) {
          await supabaseAdmin
            .from("identity_documents")
            .update(docPayload)
            .eq("user_id", vendor_data);
        } else {
          await supabaseAdmin
            .from("identity_documents")
            .insert({ ...docPayload, user_id: vendor_data });
        }
      }
    }

    // If declined, update profile
    if (status === "Declined" && vendor_data) {
      console.log("[DIDIT-WEBHOOK] User declined:", vendor_data);
      await supabaseAdmin
        .from("profiles")
        .update({
          verification_status: "rejected",
        })
        .eq("id", vendor_data);
    }

    return new Response(JSON.stringify({ message: "Webhook event dispatched" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[DIDIT-WEBHOOK] Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
