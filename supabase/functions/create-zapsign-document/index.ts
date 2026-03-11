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

    // Generate contract HTML content
    const contractHtml = generateContractHtml({
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
        sandbox: true,
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
        doc_html: contractHtml,
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

    // Store signer data
    const signers = zapsignDoc.signers || [];
    for (const signer of signers) {
      const isRenter = signer.order_group === 1;
      await supabase.from("contract_signatures").insert({
        contract_id: contractId,
        signer_id: isRenter ? booking.customer_id : booking.owner_id,
        signer_role: isRenter ? "renter" : "owner",
        sign_order: signer.order_group,
        zapsign_signer_token: signer.token,
        zapsign_sign_url: signer.sign_url,
        status: "pending",
      });
    }

    // Create notification for renter to sign
    await supabase.from("notifications").insert({
      user_id: booking.customer_id,
      notification_type: "booking",
      title: "Contrato pronto para assinatura",
      message: `O contrato de locação do ${vehicleName} está pronto. Assine para prosseguir com a reserva.`,
      action_url: `/booking/${bookingId}`,
    });

    // Log in audit
    await supabase.from("ticket_audit_log").insert({
      ticket_id: contractId,
      action: "contract_created",
      new_value: `Contract created for booking ${bookingId}`,
      performed_by: user.id,
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

function generateContractHtml(data: {
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

  return `
<html>
<body style="font-family: Arial, sans-serif; font-size: 12px; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
<h1 style="text-align: center; color: #1a1a2e; font-size: 18px;">CONTRATO DE LOCAÇÃO DE VEÍCULO</h1>
<h2 style="text-align: center; color: #666; font-size: 14px;">Plataforma Infinite Drive</h2>
<p style="text-align: center; color: #999; font-size: 11px;">Contrato nº ${data.bookingId.slice(0, 8).toUpperCase()} | Data: ${today}</p>
<hr style="border: 1px solid #ddd;">

<h3>1. DAS PARTES</h3>
<p><strong>LOCADOR (Proprietário):</strong></p>
<ul>
  <li>Nome: ${data.ownerName}</li>
  <li>CPF: ${data.ownerCpf}</li>
  <li>E-mail: ${data.ownerEmail}</li>
  <li>Telefone: ${data.ownerPhone}</li>
</ul>

<p><strong>LOCATÁRIO:</strong></p>
<ul>
  <li>Nome: ${data.customerName}</li>
  <li>CPF: ${data.customerCpf}</li>
  <li>E-mail: ${data.customerEmail}</li>
  <li>Telefone: ${data.customerPhone}</li>
</ul>

<h3>2. DO OBJETO</h3>
<p>O presente contrato tem por objeto a locação do veículo:</p>
<ul>
  <li>Veículo: ${data.vehicleName}</li>
  <li>Placa: ${data.vehiclePlate}</li>
  <li>Cor: ${data.vehicleColor}</li>
  <li>Quilometragem na entrega: ${data.vehicleMileage.toLocaleString("pt-BR")} km</li>
</ul>

<h3>3. DO PERÍODO</h3>
<p>A locação terá início em <strong>${data.startDate}</strong> e término em <strong>${data.endDate}</strong>, totalizando <strong>${data.totalDays} dia(s)</strong>.</p>

<h3>4. DO VALOR</h3>
<p>O valor da diária é de <strong>${data.dailyRate}</strong>, totalizando <strong>${data.totalPrice}</strong> pelo período contratado.</p>

<h3>5. DAS OBRIGAÇÕES DO LOCATÁRIO</h3>
<ul>
  <li>Utilizar o veículo de forma prudente e em conformidade com a legislação de trânsito;</li>
  <li>Devolver o veículo nas mesmas condições em que o recebeu, salvo desgaste natural;</li>
  <li>Responsabilizar-se por multas, infrações e danos ocorridos durante o período de locação;</li>
  <li>Não sublocar ou ceder o veículo a terceiros;</li>
  <li>Registrar a inspeção de entrega e devolução na plataforma Infinite Drive.</li>
</ul>

<h3>6. DAS OBRIGAÇÕES DO LOCADOR</h3>
<ul>
  <li>Entregar o veículo em perfeitas condições de uso e com documentação regular;</li>
  <li>Garantir que o veículo possua seguro vigente;</li>
  <li>Disponibilizar o veículo no local e horário acordados.</li>
</ul>

<h3>7. DA VISTORIA</h3>
<p>As partes declaram que realizaram a vistoria do veículo por meio da plataforma Infinite Drive, com registro fotográfico e observações sobre o estado do veículo, servindo como prova documental das condições na entrega.</p>

<h3>8. DAS DISPOSIÇÕES GERAIS</h3>
<p>Este contrato é celebrado em conformidade com a Medida Provisória nº 2.200-2/2001, que institui a Infraestrutura de Chaves Públicas Brasileira - ICP-Brasil, garantindo a autenticidade, integridade e validade jurídica dos documentos em forma eletrônica.</p>
<p>As assinaturas eletrônicas apostas neste documento têm validade jurídica e são equivalentes às assinaturas manuscritas para todos os fins de direito.</p>

<h3>9. DO FORO</h3>
<p>Fica eleito o foro da comarca do domicílio do locatário para dirimir quaisquer questões oriundas deste contrato.</p>

<br>
<p style="text-align: center; color: #999; font-size: 10px;">Documento gerado eletronicamente pela plataforma Infinite Drive em ${today}.</p>
</body>
</html>`;
}
