import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ZAPSIGN_API_URL = "https://sandbox.api.zapsign.com.br/api/v1";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const payload = await req.json();
    console.log("ZapSign webhook received:", JSON.stringify(payload));

    const eventType = payload.event_type || payload.status;
    const docToken = payload.doc?.token || payload.token;

    if (!docToken) {
      return new Response(JSON.stringify({ error: "Missing doc token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find contract by zapsign_doc_token
    const { data: contract, error: contractErr } = await supabase
      .from("rental_contracts")
      .select("*, bookings(customer_id, owner_id, vehicles(brand, model))")
      .eq("zapsign_doc_token", docToken)
      .maybeSingle();

    if (contractErr || !contract) {
      console.error("Contract not found for token:", docToken);
      return new Response(JSON.stringify({ error: "Contract not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const booking = contract.bookings as any;
    const vehicleName = booking?.vehicles
      ? `${booking.vehicles.brand} ${booking.vehicles.model}`
      : "veículo";

    // Handle signer events
    if (payload.signer) {
      const signerToken = payload.signer.token;
      const signerStatus = payload.signer.status;

      // Update signature record
      const updateData: any = {};
      if (signerStatus === "signed" || signerStatus === "completed") {
        updateData.status = "signed";
        updateData.signed_at = new Date().toISOString();
        updateData.ip_address = payload.signer.ip_address || null;
      } else if (signerStatus === "refused") {
        updateData.status = "refused";
      }

      if (Object.keys(updateData).length > 0) {
        await supabase
          .from("contract_signatures")
          .update(updateData)
          .eq("zapsign_signer_token", signerToken);
      }

      // Check which signer signed
      const { data: signature } = await supabase
        .from("contract_signatures")
        .select("signer_role, signer_id")
        .eq("zapsign_signer_token", signerToken)
        .maybeSingle();

      if (signature) {
        if (
          signature.signer_role === "renter" &&
          (signerStatus === "signed" || signerStatus === "completed")
        ) {
          // Renter signed, update contract status and notify owner
          await supabase
            .from("rental_contracts")
            .update({ status: "waiting_owner_signature" })
            .eq("id", contract.id);

          await supabase.from("notifications").insert({
            user_id: booking.owner_id,
            notification_type: "booking",
            title: "Contrato assinado pelo locatário",
            message: `O locatário assinou o contrato do ${vehicleName}. Revise a inspeção e assine para confirmar.`,
            action_url: `/booking/${contract.booking_id}`,
          });
        } else if (
          signature.signer_role === "owner" &&
          (signerStatus === "signed" || signerStatus === "completed")
        ) {
          // Owner signed - check if doc is complete
          await checkAndCompleteContract(
            supabase,
            contract,
            booking,
            vehicleName
          );
        }
      }
    }

    // Handle document completion event
    if (
      eventType === "doc_completed" ||
      eventType === "signed" ||
      payload.doc?.status === "signed"
    ) {
      await checkAndCompleteContract(
        supabase,
        contract,
        booking,
        vehicleName
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function checkAndCompleteContract(
  supabase: any,
  contract: any,
  booking: any,
  vehicleName: string
) {
  // Check all signatures are done
  const { data: sigs } = await supabase
    .from("contract_signatures")
    .select("status")
    .eq("contract_id", contract.id);

  const allSigned = sigs?.every(
    (s: any) => s.status === "signed"
  );

  if (!allSigned) return;

  // Download signed PDF and audit trail from ZapSign
  const ZAPSIGN_API_KEY = Deno.env.get("ZAPSIGN_API_KEY");
  let signedPdfUrl = null;
  let auditTrailUrl = null;
  let documentHash = null;

  if (ZAPSIGN_API_KEY) {
    try {
      // Get doc details with signed file
      const docResponse = await fetch(
        `${ZAPSIGN_API_URL}/docs/${contract.zapsign_doc_token}/`,
        {
          headers: { Authorization: `Bearer ${ZAPSIGN_API_KEY}` },
        }
      );

      if (docResponse.ok) {
        const docData = await docResponse.json();
        signedPdfUrl = docData.signed_file || docData.original_file;
        auditTrailUrl = docData.extra_docs?.find(
          (d: any) => d.type === "audit_trail"
        )?.url;

        // Generate a simple hash from the signed file URL + timestamp
        const encoder = new TextEncoder();
        const data = encoder.encode(
          `${signedPdfUrl}-${contract.id}-${new Date().toISOString()}`
        );
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        documentHash = hashArray
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
      }
    } catch (e) {
      console.error("Error fetching signed doc:", e);
    }
  }

  // Update contract as completed
  await supabase
    .from("rental_contracts")
    .update({
      status: "completed",
      signed_pdf_url: signedPdfUrl,
      audit_trail_url: auditTrailUrl,
      document_hash: documentHash,
      completed_at: new Date().toISOString(),
    })
    .eq("id", contract.id);

  // Notify both parties
  for (const userId of [booking.customer_id, booking.owner_id]) {
    await supabase.from("notifications").insert({
      user_id: userId,
      notification_type: "booking",
      title: "Contrato assinado com sucesso!",
      message: `O contrato de locação do ${vehicleName} foi assinado por ambas as partes. O documento está disponível para download.`,
      action_url: `/booking/${contract.booking_id}`,
    });
  }
}
