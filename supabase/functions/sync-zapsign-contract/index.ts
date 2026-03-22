import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ZAPSIGN_API_URL = "https://sandbox.api.zapsign.com.br/api/v1";
const ZAPSIGN_SIGNER_URL_BASE = "https://sandbox.app.zapsign.com.br/verificar";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const ZAPSIGN_API_KEY = Deno.env.get("ZAPSIGN_API_KEY");
    if (!ZAPSIGN_API_KEY) throw new Error("ZAPSIGN_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const {
      data: { user },
      error: authError,
    } = await createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    }).auth.getUser();

    if (authError || !user) throw new Error("Unauthorized");

    const { contractId, bookingId } = await req.json();
    if (!contractId && !bookingId) {
      throw new Error("contractId or bookingId is required");
    }

    let contractQuery = supabase
      .from("rental_contracts")
      .select("*, bookings(customer_id, owner_id, vehicles(brand, model))");

    if (contractId) {
      contractQuery = contractQuery.eq("id", contractId);
    } else {
      contractQuery = contractQuery.eq("booking_id", bookingId);
    }

    const { data: contract, error: contractError } = await contractQuery.maybeSingle();
    if (contractError || !contract) throw new Error("Contract not found");

    const booking = contract.bookings as any;
    const isParticipant = user.id === booking?.customer_id || user.id === booking?.owner_id;
    if (!isParticipant) throw new Error("Unauthorized");
    if (!contract.zapsign_doc_token) throw new Error("Contract without ZapSign token");

    const docData = await fetchZapSignDocument(contract.zapsign_doc_token, ZAPSIGN_API_KEY);
    const result = await syncContractFromDocument(supabase, contract, booking, docData);

    return jsonResponse({
      success: true,
      contractId: contract.id,
      bookingId: contract.booking_id,
      contractStatus: result.contractStatus,
      currentSignerUrl: getCurrentSignerUrlForUser(result.signatureRows, user.id, result.contractStatus),
      signers: serializeSigners(result.signatureRows),
    });
  } catch (error: any) {
    console.error("Error syncing ZapSign contract:", error);
    return jsonResponse({ success: false, error: error.message }, 400);
  }
});

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function fetchZapSignDocument(docToken: string, apiKey: string) {
  const response = await fetch(`${ZAPSIGN_API_URL}/docs/${docToken}/`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch ZapSign document [${response.status}]: ${errorText}`);
  }

  return await response.json();
}

async function syncContractFromDocument(
  supabase: any,
  contract: any,
  booking: any,
  docData: any
) {
  const signatureRows = await replaceContractSignatures(
    supabase,
    contract.id,
    booking,
    docData.signers || []
  );

  const renterSigned = signatureRows.some(
    (signature) => signature.signer_role === "renter" && signature.status === "signed"
  );
  const ownerSigned = signatureRows.some(
    (signature) => signature.signer_role === "owner" && signature.status === "signed"
  );

  let contractStatus = "waiting_renter_signature";
  if (docData.status === "signed" || (renterSigned && ownerSigned)) {
    contractStatus = "completed";
  } else if (renterSigned) {
    contractStatus = "waiting_owner_signature";
  }

  if (contractStatus === "completed") {
    const signedPdfUrl = docData.signed_file || null;
    const auditTrailUrl =
      docData.signature_report ||
      docData.extra_docs?.find((doc: any) => {
        const label = `${doc?.name || ""} ${doc?.type || ""}`.toLowerCase();
        return label.includes("audit") || label.includes("relat") || label.includes("report");
      })?.signed_file ||
      docData.extra_docs?.find((doc: any) => {
        const label = `${doc?.name || ""} ${doc?.type || ""}`.toLowerCase();
        return label.includes("audit") || label.includes("relat") || label.includes("report");
      })?.original_file ||
      null;

    await supabase
      .from("rental_contracts")
      .update({
        status: "completed",
        signed_pdf_url: signedPdfUrl,
        audit_trail_url: auditTrailUrl,
        document_hash: await generateDocumentHash(contract.id, docData),
        completed_at: contract.completed_at || new Date().toISOString(),
      })
      .eq("id", contract.id);

    if (contract.status !== "completed") {
      const vehicleName = booking?.vehicles
        ? `${booking.vehicles.brand} ${booking.vehicles.model}`
        : "veículo";
      await Promise.all(
        [booking.customer_id, booking.owner_id].map((userId: string) =>
          supabase.from("notifications").insert({
            user_id: userId,
            notification_type: "booking",
            title: "Contrato assinado com sucesso!",
            message: `O contrato de locação do ${vehicleName} foi assinado por ambas as partes.`,
            action_url: `/booking/${contract.booking_id}`,
          })
        )
      );
    }
  } else {
    await supabase
      .from("rental_contracts")
      .update({ status: contractStatus })
      .eq("id", contract.id);

    if (contract.status !== contractStatus && contractStatus === "waiting_owner_signature") {
      const vehicleName = booking?.vehicles
        ? `${booking.vehicles.brand} ${booking.vehicles.model}`
        : "veículo";

      await supabase.from("notifications").insert({
        user_id: booking.owner_id,
        notification_type: "booking",
        title: "Contrato aguardando sua assinatura",
        message: `O locatário já assinou o contrato do ${vehicleName}. Agora falta a sua assinatura.`,
        action_url: `/booking/${contract.booking_id}`,
      });
    }
  }

  return { contractStatus, signatureRows };
}

async function replaceContractSignatures(
  supabase: any,
  contractId: string,
  booking: any,
  signers: any[]
) {
  const normalizedSigners = Array.isArray(signers) ? signers.slice(0, 2) : [];

  const { error: deleteError } = await supabase
    .from("contract_signatures")
    .delete()
    .eq("contract_id", contractId);
  if (deleteError) throw deleteError;

  const signatureRows = normalizedSigners.map((signer, index) => {
    const signerRole = getSignerRole(signer, index);
    const signerId = signerRole === "renter" ? booking.customer_id : booking.owner_id;

    return {
      contract_id: contractId,
      signer_id: signerId,
      signer_role: signerRole,
      sign_order: signerRole === "renter" ? 1 : 2,
      zapsign_signer_token: signer.token ?? null,
      zapsign_sign_url: signer.sign_url ?? buildSignerUrl(signer.token),
      status: mapSignerStatus(signer.status),
      signed_at: signer.signed_at ?? null,
    };
  });

  if (signatureRows.length > 0) {
    const { error: insertError } = await supabase
      .from("contract_signatures")
      .insert(signatureRows);
    if (insertError) throw insertError;
  }

  return signatureRows;
}

async function generateDocumentHash(contractId: string, docData: any) {
  const encoder = new TextEncoder();
  const data = encoder.encode(
    `${contractId}:${docData.token || ""}:${docData.signed_file || docData.original_file || ""}:${docData.last_update_at || ""}`
  );
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function getSignerRole(signer: any, index: number) {
  if (signer?.external_id === "owner") return "owner";
  if (signer?.external_id === "renter") return "renter";
  return index === 0 ? "renter" : "owner";
}

function buildSignerUrl(token?: string | null) {
  return token ? `${ZAPSIGN_SIGNER_URL_BASE}/${token}` : null;
}

function mapSignerStatus(status?: string | null) {
  if (status === "signed") return "signed";
  if (status === "refused") return "refused";
  return "pending";
}

function getCurrentSignerUrlForUser(
  signatureRows: Array<{ signer_id: string; signer_role: string; zapsign_sign_url: string | null; status: string }>,
  userId: string,
  contractStatus: string
) {
  return (
    signatureRows.find((signature) => {
      if (signature.signer_id !== userId || signature.status !== "pending") return false;
      if (contractStatus === "waiting_renter_signature") return signature.signer_role === "renter";
      if (contractStatus === "waiting_owner_signature") return signature.signer_role === "owner";
      return false;
    })?.zapsign_sign_url ?? null
  );
}

function serializeSigners(
  signatureRows: Array<{
    signer_id: string;
    signer_role: string;
    sign_order: number;
    zapsign_signer_token: string | null;
    zapsign_sign_url: string | null;
    status: string;
  }>
) {
  return signatureRows.map((signature) => ({
    signer_id: signature.signer_id,
    signer_role: signature.signer_role,
    sign_order: signature.sign_order,
    signer_token: signature.zapsign_signer_token,
    sign_url: signature.zapsign_sign_url,
    status: signature.status,
  }));
}
