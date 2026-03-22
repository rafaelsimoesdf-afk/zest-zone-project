import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ZAPSIGN_API_URL = "https://sandbox.api.zapsign.com.br/api/v1";
const PDF_PAGE_WIDTH = 595;
const PDF_PAGE_HEIGHT = 842;
const PDF_LEFT_MARGIN = 48;
const PDF_TOP_START = 790;
const PDF_LINE_HEIGHT = 16;
const PDF_FONT_SIZE = 11;
const PDF_MAX_CHARS_PER_LINE = 88;
const PDF_LINES_PER_PAGE = 44;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const ZAPSIGN_API_KEY = Deno.env.get("ZAPSIGN_API_KEY");
    if (!ZAPSIGN_API_KEY) throw new Error("ZAPSIGN_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const {
      data: { user },
      error: authError,
    } = await createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    }).auth.getUser();

    if (authError || !user) throw new Error("Unauthorized");

    const { bookingId, inspectionId } = await req.json();
    if (!bookingId) throw new Error("bookingId is required");

    // Get booking details
    const { data: booking, error: bookingErr } = await supabase
      .from("bookings")
      .select(
        "*, vehicles(brand, model, year, color, license_plate, mileage), customer:profiles!bookings_customer_id_fkey(first_name, last_name, email, cpf, phone_number), owner:profiles!bookings_owner_id_fkey(first_name, last_name, email, cpf, phone_number)"
      )
      .eq("id", bookingId)
      .single();

    if (bookingErr || !booking) throw new Error("Booking not found");

    // Only booking participants can create contracts
    if (user.id !== booking.customer_id && user.id !== booking.owner_id) {
      throw new Error("Only booking participants can create contracts");
    }

    // Check if contract already exists
    const { data: existingContract } = await supabase
      .from("rental_contracts")
      .select("id, status")
      .eq("booking_id", bookingId)
      .maybeSingle();

    if (existingContract && existingContract.status !== "draft") {
      return new Response(
        JSON.stringify({
          success: true,
          contractId: existingContract.id,
          message: "Contract already exists",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const customer = booking.customer as any;
    const owner = booking.owner as any;
    const vehicle = booking.vehicles as any;

    const customerName = `${customer.first_name} ${customer.last_name}`;
    const ownerName = `${owner.first_name} ${owner.last_name}`;
    const vehicleName = `${vehicle.brand} ${vehicle.model} ${vehicle.year}`;
    const startDate = new Date(booking.start_date).toLocaleDateString("pt-BR");
    const endDate = new Date(booking.end_date).toLocaleDateString("pt-BR");
    const totalPrice = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(booking.total_price);
    const dailyRate = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(booking.daily_rate);

    // Generate contract PDF content as base64 for ZapSign
    const contractPdfBase64 = generateContractPdfBase64({
      customerName,
      customerCpf: customer.cpf || "Não informado",
      customerEmail: customer.email,
      customerPhone: customer.phone_number || "Não informado",
      ownerName,
      ownerCpf: owner.cpf || "Não informado",
      ownerEmail: owner.email,
      ownerPhone: owner.phone_number || "Não informado",
      vehicleName,
      vehiclePlate: vehicle.license_plate,
      vehicleColor: vehicle.color,
      vehicleMileage: vehicle.mileage,
      startDate,
      endDate,
      totalDays: booking.total_days,
      dailyRate,
      totalPrice,
      bookingId,
    });

    // Create document in ZapSign
    const zapsignResponse = await fetch(`${ZAPSIGN_API_URL}/docs/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ZAPSIGN_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: `Contrato de Locação - ${vehicleName} - ${customerName}`,
        lang: "pt-br",
        disable_signer_emails: false,
        brand_primary_color: "#1a1a2e",
        external_id: bookingId,
        signers: [
          {
            name: customerName,
            email: customer.email,
            phone_country: "55",
            phone_number: (customer.phone_number || "").replace(/\D/g, ""),
            auth_mode: "assinaturaTela",
            send_automatic_email: false,
            send_automatic_whatsapp: false,
            order_group: 1,
            qualification: "Locatário",
          },
          {
            name: ownerName,
            email: owner.email,
            phone_country: "55",
            phone_number: (owner.phone_number || "").replace(/\D/g, ""),
            auth_mode: "assinaturaTela",
            send_automatic_email: false,
            send_automatic_whatsapp: false,
            order_group: 2,
            qualification: "Proprietário",
          },
        ],
        base64_pdf: contractPdfBase64,
      }),
    });

    if (!zapsignResponse.ok) {
      const errBody = await zapsignResponse.text();
      console.error("ZapSign API error:", errBody);
      throw new Error(
        `ZapSign API error [${zapsignResponse.status}]: ${errBody}`
      );
    }

    const zapsignDoc = await zapsignResponse.json();
    console.log("ZapSign response keys:", Object.keys(zapsignDoc));
    console.log("ZapSign signers:", JSON.stringify(zapsignDoc.signers));

    // Store contract data
    const contractData = {
      booking_id: bookingId,
      inspection_id: inspectionId || null,
      zapsign_doc_id: zapsignDoc.open_id?.toString() || zapsignDoc.token,
      zapsign_doc_token: zapsignDoc.token,
      status: "waiting_renter_signature",
      contract_data: {
        customerName,
        ownerName,
        vehicleName,
        vehiclePlate: vehicle.license_plate,
        startDate,
        endDate,
        totalDays: booking.total_days,
        dailyRate: booking.daily_rate,
        totalPrice: booking.total_price,
      },
    };

    let contractId: string;

    if (existingContract) {
      await supabase
        .from("rental_contracts")
        .update(contractData)
        .eq("id", existingContract.id);
      contractId = existingContract.id;
    } else {
      const { data: newContract, error: insertErr } = await supabase
        .from("rental_contracts")
        .insert(contractData)
        .select("id")
        .single();
      if (insertErr) throw insertErr;
      contractId = newContract.id;
    }

    // Store signer data from ZapSign response
    const signers = zapsignDoc.signers || [];
    console.log("Number of signers from ZapSign:", signers.length);
    
    if (signers.length === 0) {
      console.warn("No signers returned from ZapSign! Full response:", JSON.stringify(zapsignDoc).substring(0, 500));
    }

    for (let i = 0; i < signers.length; i++) {
      const signer = signers[i];
      const isRenter = i === 0; // First signer is always the renter (order_group 1)
      console.log(`Inserting signer ${i}: role=${isRenter ? 'renter' : 'owner'}, token=${signer.token}, sign_url=${signer.sign_url}`);
      
      const { error: sigError } = await supabase.from("contract_signatures").insert({
        contract_id: contractId,
        signer_id: isRenter ? booking.customer_id : booking.owner_id,
        signer_role: isRenter ? "renter" : "owner",
        sign_order: i + 1,
        zapsign_signer_token: signer.token,
        zapsign_sign_url: signer.sign_url,
        status: "pending",
      });
      
      if (sigError) {
        console.error(`Error inserting signer ${i}:`, sigError);
      }
    }

    // Create notification for renter to sign
    await supabase.from("notifications").insert({
      user_id: booking.customer_id,
      notification_type: "booking",
      title: "Contrato pronto para assinatura",
      message: `O contrato de locação do ${vehicleName} está pronto. Assine para prosseguir com a reserva.`,
      action_url: `/booking/${bookingId}`,
    });

    return new Response(
      JSON.stringify({
        success: true,
        contractId,
        signers: signers.map((s: any) => ({
          token: s.token,
          sign_url: s.sign_url,
          order_group: s.order_group,
        })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error creating ZapSign document:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function generateContractPdfBase64(data: {
  customerName: string;
  customerCpf: string;
  customerEmail: string;
  customerPhone: string;
  ownerName: string;
  ownerCpf: string;
  ownerEmail: string;
  ownerPhone: string;
  vehicleName: string;
  vehiclePlate: string;
  vehicleColor: string;
  vehicleMileage: number;
  startDate: string;
  endDate: string;
  totalDays: number;
  dailyRate: string;
  totalPrice: string;
  bookingId: string;
}): string {
  const today = new Date().toLocaleDateString("pt-BR");
  const lines = [
    "CONTRATO DE LOCAÇÃO DE VEÍCULO",
    "Plataforma Infinite Drive",
    `Contrato nº ${data.bookingId.slice(0, 8).toUpperCase()} | Data: ${today}`,
    "",
    "1. DAS PARTES",
    `LOCADOR (Proprietário): ${data.ownerName}`,
    `CPF: ${data.ownerCpf}`,
    `E-mail: ${data.ownerEmail}`,
    `Telefone: ${data.ownerPhone}`,
    "",
    `LOCATÁRIO: ${data.customerName}`,
    `CPF: ${data.customerCpf}`,
    `E-mail: ${data.customerEmail}`,
    `Telefone: ${data.customerPhone}`,
    "",
    "2. DO OBJETO",
    `Veículo: ${data.vehicleName}`,
    `Placa: ${data.vehiclePlate}`,
    `Cor: ${data.vehicleColor}`,
    `Quilometragem na entrega: ${data.vehicleMileage.toLocaleString("pt-BR")} km`,
    "",
    "3. DO PERÍODO",
    `Início: ${data.startDate}`,
    `Término: ${data.endDate}`,
    `Total: ${data.totalDays} dia(s)`,
    "",
    "4. DO VALOR",
    `Valor da diária: ${data.dailyRate}`,
    `Valor total: ${data.totalPrice}`,
    "",
    "5. OBRIGAÇÕES DO LOCATÁRIO",
    "• Utilizar o veículo de forma prudente e conforme a legislação.",
    "• Devolver o veículo nas mesmas condições, salvo desgaste natural.",
    "• Responder por multas, infrações e danos durante a locação.",
    "• Não sublocar ou ceder o veículo a terceiros.",
    "• Registrar a vistoria de entrega e devolução na plataforma.",
    "",
    "6. OBRIGAÇÕES DO LOCADOR",
    "• Entregar o veículo em perfeitas condições de uso.",
    "• Garantir documentação regular e seguro vigente.",
    "• Disponibilizar o veículo no local e horário acordados.",
    "",
    "7. DA VISTORIA",
    "As partes declaram que realizaram a vistoria do veículo com registro fotográfico e observações na plataforma Infinite Drive.",
    "",
    "8. DAS DISPOSIÇÕES GERAIS",
    "Este contrato observa a MP 2.200-2/2001, garantindo autenticidade, integridade e validade jurídica do documento eletrônico.",
    "As assinaturas eletrônicas apostas possuem validade jurídica equivalente à assinatura manuscrita.",
    "",
    "9. DO FORO",
    "Fica eleito o foro da comarca do domicílio do locatário para dirimir quaisquer questões oriundas deste contrato.",
    "",
    `Documento gerado eletronicamente pela plataforma Infinite Drive em ${today}.`,
  ];

  const wrappedLines = lines.flatMap((line) => wrapPdfText(line, PDF_MAX_CHARS_PER_LINE));
  const pages = chunkArray(wrappedLines, PDF_LINES_PER_PAGE);
  const objects: string[] = [];
  const pageObjectIds: number[] = [];
  const contentObjectIds: number[] = [];
  const fontObjectId = 3 + pages.length * 2;

  pages.forEach((pageLines, index) => {
    const pageObjectId = 3 + index * 2;
    const contentObjectId = pageObjectId + 1;
    pageObjectIds.push(pageObjectId);
    contentObjectIds.push(contentObjectId);

    const streamLines = ["BT", `/F1 ${PDF_FONT_SIZE} Tf`, `${PDF_LEFT_MARGIN} ${PDF_TOP_START} Td`];
    pageLines.forEach((line, lineIndex) => {
      if (lineIndex > 0) streamLines.push(`0 -${PDF_LINE_HEIGHT} Td`);
      streamLines.push(`(${escapePdfText(line)}) Tj`);
    });
    streamLines.push("ET");

    const stream = streamLines.join("\n");
    objects.push(`${pageObjectId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PDF_PAGE_WIDTH} ${PDF_PAGE_HEIGHT}] /Contents ${contentObjectId} 0 R /Resources << /Font << /F1 ${fontObjectId} 0 R >> >> >>\nendobj`);
    objects.push(`${contentObjectId} 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj`);
  });

  objects.unshift(`2 0 obj\n<< /Type /Pages /Count ${pages.length} /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] >>\nendobj`);
  objects.unshift(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj`);
  objects.push(`${fontObjectId} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj`);

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const object of objects) {
    offsets.push(pdf.length);
    pdf += `${object}\n`;
  }

  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${offsets[i].toString().padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  // Encode to base64 handling non-Latin1 chars
  const encoder = new TextEncoder();
  const uint8 = encoder.encode(pdf);
  let binary = "";
  for (let i = 0; i < uint8.length; i++) {
    binary += String.fromCharCode(uint8[i]);
  }
  return btoa(binary);
}

function wrapPdfText(text: string, maxChars: number): string[] {
  if (!text) return [""];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (candidate.length <= maxChars) {
      currentLine = candidate;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines.length ? lines : [text];
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function escapePdfText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}
