import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

const sendEmail = async (payload: EmailPayload) => {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("EMAIL_FROM") || "InfiniteDrive <noreply@infinitedrive.com.br>";

  if (!apiKey) {
    throw new Error("RESEND_API_KEY not configured");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [payload.to],
      subject: payload.subject,
      html: payload.html,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Resend API error: ${JSON.stringify(error)}`);
  }

  return await response.json();
};

// ============================================================
// BASE TEMPLATE — Premium InfiniteDrive Design
// ============================================================

const SITE_URL = "https://zest-zone-project.lovable.app";

const baseTemplate = (content: string, title: string, preheader?: string) => `
<!DOCTYPE html>
<html lang="pt-BR" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${title}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    /* Reset */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }

    /* Base */
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f0f4f8; color: #1a2332; margin: 0; padding: 0; width: 100%; }
    
    /* Container */
    .email-wrapper { width: 100%; background-color: #f0f4f8; padding: 40px 16px; }
    .email-container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 40px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04); }

    /* Header */
    .email-header { 
      background: linear-gradient(135deg, #1a2332 0%, #2563eb 50%, #0ea5e9 100%);
      padding: 40px 40px 36px;
      text-align: center;
      position: relative;
    }
    .email-header::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #f97316, #ef4444, #f97316);
    }
    .brand-name { 
      color: #ffffff; 
      font-size: 32px; 
      font-weight: 800; 
      letter-spacing: -1px; 
      margin: 0;
      text-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    .brand-tagline { 
      color: rgba(255,255,255,0.7); 
      font-size: 13px; 
      margin-top: 6px; 
      letter-spacing: 0.5px;
      font-weight: 400;
    }

    /* Content */
    .email-content { padding: 40px; }

    /* Typography */
    .greeting { 
      font-size: 22px; 
      font-weight: 700; 
      margin-bottom: 16px; 
      color: #1a2332;
      line-height: 1.3;
    }
    .message { 
      font-size: 15px; 
      line-height: 1.75; 
      color: #4b5563; 
      margin-bottom: 24px; 
    }

    /* Info Box */
    .info-box { 
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border: 1px solid #e2e8f0;
      border-radius: 12px; 
      padding: 24px; 
      margin: 24px 0; 
    }
    .info-box-title { 
      font-size: 12px; 
      font-weight: 700; 
      text-transform: uppercase; 
      letter-spacing: 1px; 
      color: #2563eb; 
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .info-row { 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
      padding: 10px 0; 
      border-bottom: 1px solid #e2e8f0; 
      font-size: 14px; 
    }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: #6b7280; font-weight: 400; }
    .info-value { font-weight: 600; color: #1a2332; text-align: right; }
    
    /* Highlight */
    .highlight { color: #2563eb; font-weight: 700; }
    .highlight-accent { color: #f97316; font-weight: 700; }

    /* Status Badges */
    .status-badge { 
      display: inline-block; 
      padding: 5px 14px; 
      border-radius: 100px; 
      font-size: 12px; 
      font-weight: 700; 
      letter-spacing: 0.3px;
    }
    .status-pending { background: #fef3c7; color: #92400e; }
    .status-confirmed { background: #d1fae5; color: #065f46; }
    .status-cancelled { background: #fee2e2; color: #991b1b; }
    .status-completed { background: #dbeafe; color: #1e40af; }

    /* Alert Boxes */
    .alert-box { 
      background: linear-gradient(135deg, #fff5f5, #fef2f2);
      border: 1px solid #fecaca; 
      border-left: 4px solid #ef4444;
      border-radius: 0 12px 12px 0; 
      padding: 18px 22px; 
      margin: 20px 0; 
      font-size: 14px; 
      color: #991b1b;
      line-height: 1.6;
    }
    .success-box { 
      background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
      border: 1px solid #86efac; 
      border-left: 4px solid #22c55e;
      border-radius: 0 12px 12px 0; 
      padding: 18px 22px; 
      margin: 20px 0; 
      font-size: 14px; 
      color: #166534;
      line-height: 1.6;
    }
    .tip-box { 
      background: linear-gradient(135deg, #eff6ff, #eef2ff);
      border: 1px solid #93c5fd; 
      border-left: 4px solid #2563eb;
      border-radius: 0 12px 12px 0; 
      padding: 18px 22px; 
      margin: 20px 0; 
      font-size: 14px; 
      color: #1e40af;
      line-height: 1.6;
    }
    .warning-box {
      background: linear-gradient(135deg, #fffbeb, #fefce8);
      border: 1px solid #fcd34d;
      border-left: 4px solid #f59e0b;
      border-radius: 0 12px 12px 0;
      padding: 18px 22px;
      margin: 20px 0;
      font-size: 14px;
      color: #92400e;
      line-height: 1.6;
    }

    /* CTA Button */
    .cta-button { 
      display: block; 
      width: fit-content; 
      margin: 32px auto 0; 
      padding: 16px 48px; 
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: #ffffff !important; 
      text-decoration: none; 
      border-radius: 12px; 
      font-weight: 700; 
      font-size: 15px; 
      text-align: center;
      box-shadow: 0 4px 14px rgba(37,99,235,0.35);
      transition: all 0.2s;
    }
    .cta-button-secondary {
      display: block;
      width: fit-content;
      margin: 16px auto 0;
      padding: 12px 36px;
      background: transparent;
      color: #2563eb !important;
      text-decoration: none;
      border: 2px solid #2563eb;
      border-radius: 12px;
      font-weight: 600;
      font-size: 14px;
      text-align: center;
    }

    /* Divider */
    .divider { border: none; border-top: 1px solid #e2e8f0; margin: 32px 0; }

    /* Footer */
    .email-footer { 
      background: #f8fafc;
      padding: 28px 40px; 
      text-align: center; 
      border-top: 1px solid #e2e8f0; 
    }
    .email-footer p { font-size: 12px; color: #9ca3af; line-height: 1.8; }
    .email-footer a { color: #2563eb; text-decoration: none; font-weight: 500; }
    .footer-links { margin-top: 12px; }
    .footer-links a { margin: 0 8px; font-size: 12px; }

    /* Preheader — hidden preview text */
    .preheader { display: none !important; max-height: 0; overflow: hidden; mso-hide: all; font-size: 1px; color: #f0f4f8; line-height: 1px; }

    /* Message quote */
    .message-quote {
      padding: 20px;
      background: #ffffff;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
      margin-top: 12px;
      font-size: 15px;
      line-height: 1.65;
      color: #374151;
      font-style: italic;
    }

    /* Star rating */
    .star-rating { text-align: center; padding: 24px 0; }
    .star-rating .stars { font-size: 36px; letter-spacing: 4px; }
    .star-rating .score { font-size: 32px; font-weight: 800; color: #f59e0b; margin-top: 4px; }

    /* Feature grid */
    .feature-item {
      display: inline-block;
      width: 48%;
      padding: 14px;
      margin-bottom: 8px;
      background: #f8fafc;
      border-radius: 10px;
      vertical-align: top;
      text-align: center;
    }
    .feature-icon { font-size: 24px; margin-bottom: 6px; }
    .feature-label { font-size: 12px; color: #6b7280; font-weight: 500; }

    /* Responsive */
    @media only screen and (max-width: 620px) {
      .email-wrapper { padding: 16px 8px !important; }
      .email-container { border-radius: 12px !important; }
      .email-header { padding: 28px 24px 24px !important; }
      .brand-name { font-size: 26px !important; }
      .email-content { padding: 28px 24px !important; }
      .greeting { font-size: 20px !important; }
      .info-box { padding: 18px !important; }
      .info-row { flex-direction: column; align-items: flex-start; gap: 4px; }
      .info-value { text-align: left !important; }
      .cta-button { padding: 14px 32px !important; width: 100% !important; }
      .cta-button-secondary { padding: 12px 24px !important; width: 100% !important; }
      .email-footer { padding: 24px 20px !important; }
      .feature-item { width: 100% !important; display: block !important; }
    }
  </style>
</head>
<body>
  ${preheader ? `<div class="preheader">${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>` : ''}
  <div class="email-wrapper">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center">
          <div class="email-container">
            <div class="email-header">
              <h1 class="brand-name">InfiniteDrive</h1>
              <p class="brand-tagline">Aluguel de veículos entre pessoas</p>
            </div>
            <div class="email-content">
              ${content}
            </div>
            <div class="email-footer">
              <p>Este é um email automático da plataforma InfiniteDrive.</p>
              <div class="footer-links">
                <a href="${SITE_URL}">Acessar plataforma</a> ·
                <a href="${SITE_URL}/browse">Explorar veículos</a>
              </div>
              <p style="margin-top: 16px; font-size: 11px; color: #c0c7cf;">
                © ${new Date().getFullYear()} InfiniteDrive — Todos os direitos reservados
              </p>
            </div>
          </div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
`;

const templates: Record<string, (data: Record<string, string>) => { subject: string; html: string }> = {

  // ============================================================
  // RESERVAS — LOCATÁRIO
  // ============================================================

  booking_created_customer: (data) => ({
    subject: `Reserva solicitada — ${data.vehicleName}`,
    html: baseTemplate(`
      <p class="greeting">Olá, ${data.customerName}!</p>
      <p class="message">
        Sua reserva do <strong>${data.vehicleName}</strong> foi enviada com sucesso e está aguardando a aprovação do proprietário.
      </p>
      <div class="info-box">
        <div class="info-box-title">📋 Detalhes da reserva</div>
        <div class="info-row"><span class="info-label">Veículo</span><span class="info-value">${data.vehicleName}</span></div>
        <div class="info-row"><span class="info-label">Período</span><span class="info-value">${data.startDate} → ${data.endDate}</span></div>
        <div class="info-row"><span class="info-label">Duração</span><span class="info-value">${data.totalDays} ${parseInt(data.totalDays) === 1 ? 'dia' : 'dias'}</span></div>
        <div class="info-row"><span class="info-label">Diária</span><span class="info-value">${data.dailyRate}</span></div>
        ${data.pickupLocation ? `<div class="info-row"><span class="info-label">Local de retirada</span><span class="info-value">${data.pickupLocation}</span></div>` : ''}
        <div class="info-row"><span class="info-label">Total pago</span><span class="info-value highlight">${data.totalPrice}</span></div>
        <div class="info-row"><span class="info-label">Status</span><span class="info-value"><span class="status-badge status-pending">Aguardando aprovação</span></span></div>
      </div>
      <div class="tip-box">
        <strong>Próximos passos:</strong> O proprietário tem até 24h para aprovar sua reserva. Fique atento às notificações!
      </div>
      <a href="${data.bookingUrl}" class="cta-button">Ver minha reserva</a>
    `, `Reserva solicitada — ${data.vehicleName}`, `Sua reserva do ${data.vehicleName} foi enviada e está aguardando aprovação.`),
  }),

  booking_confirmed_customer: (data) => ({
    subject: `Reserva confirmada! — ${data.vehicleName}`,
    html: baseTemplate(`
      <p class="greeting">Reserva confirmada, ${data.customerName}! 🎉</p>
      <p class="message">
        <strong>${data.ownerName}</strong> aprovou sua reserva do <strong>${data.vehicleName}</strong>.
        Sua viagem está garantida!
      </p>
      <div class="success-box">
        ✅ Reserva aprovada e confirmada com sucesso!
      </div>
      <div class="info-box">
        <div class="info-box-title">🚗 Detalhes da viagem</div>
        <div class="info-row"><span class="info-label">Veículo</span><span class="info-value">${data.vehicleName}</span></div>
        <div class="info-row"><span class="info-label">Período</span><span class="info-value">${data.startDate} → ${data.endDate}</span></div>
        <div class="info-row"><span class="info-label">Duração</span><span class="info-value">${data.totalDays} ${parseInt(data.totalDays) === 1 ? 'dia' : 'dias'}</span></div>
        ${data.pickupLocation ? `<div class="info-row"><span class="info-label">Local de retirada</span><span class="info-value">${data.pickupLocation}</span></div>` : ''}
        <div class="info-row"><span class="info-label">Status</span><span class="info-value"><span class="status-badge status-confirmed">Confirmada</span></span></div>
      </div>
      <div class="info-box">
        <div class="info-box-title">👤 Contato do proprietário</div>
        <div class="info-row"><span class="info-label">Nome</span><span class="info-value">${data.ownerName}</span></div>
        ${data.ownerPhone ? `<div class="info-row"><span class="info-label">Telefone</span><span class="info-value">${data.ownerPhone}</span></div>` : ''}
      </div>
      <div class="tip-box">
        <strong>Dica:</strong> Use o chat do app para combinar os detalhes de retirada com o proprietário.
      </div>
      <a href="${data.bookingUrl}" class="cta-button">Ver detalhes da reserva</a>
    `, `Reserva confirmada — ${data.vehicleName}`, `${data.ownerName} aprovou sua reserva do ${data.vehicleName}.`),
  }),

  booking_cancelled_customer: (data) => ({
    subject: `Reserva cancelada — ${data.vehicleName}`,
    html: baseTemplate(`
      <p class="greeting">Olá, ${data.customerName}</p>
      <p class="message">
        Infelizmente, sua reserva do <strong>${data.vehicleName}</strong> foi cancelada.
      </p>
      <div class="alert-box">
        ❌ Reserva cancelada
        ${data.reason ? `<br><br><strong>Motivo:</strong> ${data.reason}` : ''}
      </div>
      <div class="info-box">
        <div class="info-box-title">📋 Reserva cancelada</div>
        <div class="info-row"><span class="info-label">Veículo</span><span class="info-value">${data.vehicleName}</span></div>
        <div class="info-row"><span class="info-label">Período</span><span class="info-value">${data.startDate} → ${data.endDate}</span></div>
        <div class="info-row"><span class="info-label">Status</span><span class="info-value"><span class="status-badge status-cancelled">Cancelada</span></span></div>
      </div>
      <div class="tip-box">
        <strong>Não desanime!</strong> Há centenas de veículos disponíveis na plataforma. Encontre a opção perfeita para você.
      </div>
      <a href="${SITE_URL}/browse" class="cta-button">Buscar outros veículos</a>
    `, `Reserva cancelada — ${data.vehicleName}`, `Sua reserva do ${data.vehicleName} foi cancelada.`),
  }),

  booking_completed_customer: (data) => ({
    subject: `Como foi sua viagem com ${data.vehicleName}?`,
    html: baseTemplate(`
      <p class="greeting">Viagem concluída, ${data.customerName}! 🏁</p>
      <p class="message">
        Esperamos que sua experiência com o <strong>${data.vehicleName}</strong> tenha sido incrível!
        Que tal deixar uma avaliação para o proprietário <strong>${data.ownerName}</strong>?
      </p>
      <div class="success-box">
        🏁 Reserva finalizada com sucesso! Obrigado por escolher o InfiniteDrive.
      </div>
      <div class="info-box">
        <div class="info-box-title">📋 Resumo da viagem</div>
        <div class="info-row"><span class="info-label">Veículo</span><span class="info-value">${data.vehicleName}</span></div>
        <div class="info-row"><span class="info-label">Período</span><span class="info-value">${data.startDate} → ${data.endDate}</span></div>
        <div class="info-row"><span class="info-label">Duração</span><span class="info-value">${data.totalDays} ${parseInt(data.totalDays) === 1 ? 'dia' : 'dias'}</span></div>
        <div class="info-row"><span class="info-label">Status</span><span class="info-value"><span class="status-badge status-completed">Concluída</span></span></div>
      </div>
      <a href="${data.bookingUrl}" class="cta-button">⭐ Avaliar minha experiência</a>
      <a href="${SITE_URL}/browse" class="cta-button-secondary">Reservar outro veículo</a>
    `, `Avalie sua viagem — ${data.vehicleName}`, `Sua viagem com ${data.vehicleName} foi concluída. Deixe sua avaliação!`),
  }),

  // ============================================================
  // RESERVAS — PROPRIETÁRIO
  // ============================================================

  booking_created_owner: (data) => ({
    subject: `Nova reserva recebida — ${data.vehicleName}`,
    html: baseTemplate(`
      <p class="greeting">Nova reserva, ${data.ownerName}!</p>
      <p class="message">
        <strong>${data.customerName}</strong> quer alugar seu <strong>${data.vehicleName}</strong>.
        Revise os detalhes e responda à solicitação.
      </p>
      <div class="info-box">
        <div class="info-box-title">📋 Detalhes da solicitação</div>
        <div class="info-row"><span class="info-label">Locatário</span><span class="info-value">${data.customerName}</span></div>
        <div class="info-row"><span class="info-label">Veículo</span><span class="info-value">${data.vehicleName}</span></div>
        <div class="info-row"><span class="info-label">Período</span><span class="info-value">${data.startDate} → ${data.endDate}</span></div>
        <div class="info-row"><span class="info-label">Duração</span><span class="info-value">${data.totalDays} ${parseInt(data.totalDays) === 1 ? 'dia' : 'dias'}</span></div>
        <div class="info-row"><span class="info-label">Valor bruto</span><span class="info-value">${data.totalPrice}</span></div>
        <div class="info-row"><span class="info-label">Sua receita líquida</span><span class="info-value highlight">${data.netRevenue}</span></div>
        ${data.notes ? `<div class="info-row"><span class="info-label">Observações</span><span class="info-value">${data.notes}</span></div>` : ''}
        <div class="info-row"><span class="info-label">Status</span><span class="info-value"><span class="status-badge status-pending">Aguardando sua resposta</span></span></div>
      </div>
      <div class="warning-box">
        ⚠️ <strong>Importante:</strong> O locatário já realizou o pagamento. Ao aprovar, você confirma a disponibilidade do veículo.
      </div>
      <a href="${SITE_URL}/owner-dashboard" class="cta-button">Revisar e responder</a>
    `, `Nova reserva — ${data.vehicleName}`, `${data.customerName} quer alugar seu ${data.vehicleName}. Revise e responda.`),
  }),

  booking_completed_owner: (data) => ({
    subject: `Reserva finalizada — Receita ${data.netRevenue}`,
    html: baseTemplate(`
      <p class="greeting">Parabéns, ${data.ownerName}! 💰</p>
      <p class="message">
        A reserva do seu <strong>${data.vehicleName}</strong> com <strong>${data.customerName}</strong> foi concluída e sua receita foi registrada.
      </p>
      <div class="success-box">
        💰 Receita registrada com sucesso!
      </div>
      <div class="info-box">
        <div class="info-box-title">💳 Resumo financeiro</div>
        <div class="info-row"><span class="info-label">Valor bruto</span><span class="info-value">${data.totalPrice}</span></div>
        <div class="info-row"><span class="info-label">Taxa da plataforma (15%)</span><span class="info-value" style="color: #dc2626;">${data.platformFee}</span></div>
        <div class="info-row"><span class="info-label">Sua receita líquida</span><span class="info-value highlight" style="font-size: 16px;">${data.netRevenue}</span></div>
      </div>
      <div class="info-box">
        <div class="info-box-title">📋 Detalhes da reserva</div>
        <div class="info-row"><span class="info-label">Veículo</span><span class="info-value">${data.vehicleName}</span></div>
        <div class="info-row"><span class="info-label">Locatário</span><span class="info-value">${data.customerName}</span></div>
        <div class="info-row"><span class="info-label">Período</span><span class="info-value">${data.startDate} → ${data.endDate}</span></div>
        <div class="info-row"><span class="info-label">Duração</span><span class="info-value">${data.totalDays} ${parseInt(data.totalDays) === 1 ? 'dia' : 'dias'}</span></div>
      </div>
      <a href="${SITE_URL}/owner-dashboard" class="cta-button">Ver painel do proprietário</a>
    `, `Reserva finalizada — ${data.vehicleName}`, `Sua reserva de ${data.netRevenue} foi concluída e registrada.`),
  }),

  booking_confirmed_owner: (data) => ({
    subject: `Reserva aprovada — ${data.vehicleName}`,
    html: baseTemplate(`
      <p class="greeting">Reserva confirmada, ${data.ownerName}! ✅</p>
      <p class="message">
        Você aprovou a reserva do seu <strong>${data.vehicleName}</strong> com <strong>${data.customerName}</strong>.
        O locatário já foi notificado.
      </p>
      <div class="success-box">
        ✅ Reserva confirmada com sucesso! O locatário será informado.
      </div>
      <div class="info-box">
        <div class="info-box-title">📋 Detalhes da reserva</div>
        <div class="info-row"><span class="info-label">Locatário</span><span class="info-value">${data.customerName}</span></div>
        <div class="info-row"><span class="info-label">Veículo</span><span class="info-value">${data.vehicleName}</span></div>
        <div class="info-row"><span class="info-label">Período</span><span class="info-value">${data.startDate} → ${data.endDate}</span></div>
        <div class="info-row"><span class="info-label">Duração</span><span class="info-value">${data.totalDays} ${parseInt(data.totalDays) === 1 ? 'dia' : 'dias'}</span></div>
        <div class="info-row"><span class="info-label">Valor bruto</span><span class="info-value">${data.totalPrice}</span></div>
        <div class="info-row"><span class="info-label">Sua receita líquida</span><span class="info-value highlight">${data.netRevenue}</span></div>
      </div>
      <div class="tip-box">
        <strong>Próximos passos:</strong> Entre em contato com o locatário pelo chat para combinar os detalhes de entrega do veículo.
      </div>
      <a href="${SITE_URL}/owner-dashboard" class="cta-button">Ver painel do proprietário</a>
    `, `Reserva aprovada — ${data.vehicleName}`, `Você confirmou a reserva do ${data.vehicleName} com ${data.customerName}.`),
  }),

  // ============================================================
  // MENSAGENS
  // ============================================================

  new_message: (data) => ({
    subject: `Nova mensagem de ${data.senderName}`,
    html: baseTemplate(`
      <p class="greeting">Olá, ${data.receiverName}!</p>
      <p class="message">
        <strong>${data.senderName}</strong> enviou uma mensagem sobre o <strong>${data.vehicleName}</strong>.
      </p>
      <div class="info-box">
        <div class="info-box-title">💬 Mensagem recebida</div>
        <div class="message-quote">"${data.messageContent}"</div>
        <div style="margin-top: 12px; font-size: 12px; color: #9ca3af;">De: ${data.senderName} · ${data.sentAt}</div>
      </div>
      <div class="tip-box">
        Responda pelo app para manter a comunicação organizada e protegida.
      </div>
      <a href="${data.bookingUrl}" class="cta-button">Responder mensagem</a>
    `, `Nova mensagem — ${data.vehicleName}`, `${data.senderName} enviou uma mensagem sobre ${data.vehicleName}.`),
  }),

  // ============================================================
  // AVALIAÇÕES
  // ============================================================

  review_received: (data) => ({
    subject: `Nova avaliação de ${data.reviewerName}`,
    html: baseTemplate(`
      <p class="greeting">Olá, ${data.reviewedName}!</p>
      <p class="message">
        <strong>${data.reviewerName}</strong> deixou uma avaliação sobre a reserva do <strong>${data.vehicleName}</strong>.
      </p>
      <div class="info-box">
        <div class="info-box-title">⭐ Sua avaliação</div>
        <div class="star-rating">
          <div class="stars">${'★'.repeat(parseInt(data.rating))}${'☆'.repeat(5 - parseInt(data.rating))}</div>
          <div class="score">${data.rating}/5</div>
        </div>
        ${data.comment ? `
        <div class="message-quote">"${data.comment}"</div>
        <div style="margin-top: 8px; font-size: 12px; color: #9ca3af; text-align: right;">— ${data.reviewerName}</div>
        ` : ''}
      </div>
      <p class="message" style="text-align: center;">Avaliações ajudam a construir sua reputação na plataforma!</p>
      <a href="${SITE_URL}/profile" class="cta-button">Ver meu perfil</a>
    `, `Nova avaliação recebida`, `${data.reviewerName} te avaliou com ${data.rating} estrela(s).`),
  }),

  // ============================================================
  // VERIFICAÇÃO DE CADASTRO
  // ============================================================

  verification_approved: (data) => ({
    subject: `Cadastro aprovado! Bem-vindo(a) ao InfiniteDrive`,
    html: baseTemplate(`
      <p class="greeting">Parabéns, ${data.userName}! 🎉</p>
      <p class="message">
        Seu cadastro foi verificado e aprovado! Agora você tem acesso completo ao InfiniteDrive.
      </p>
      <div class="success-box">
        ✅ Identidade verificada — conta ativa com todas as funcionalidades.
      </div>
      <div class="info-box">
        <div class="info-box-title">🚀 O que você pode fazer agora</div>
        <div style="text-align: center; padding: 8px 0;">
          <div class="feature-item">
            <div class="feature-icon">🔍</div>
            <div class="feature-label">Explorar veículos</div>
          </div>
          <div class="feature-item">
            <div class="feature-icon">📅</div>
            <div class="feature-label">Fazer reservas</div>
          </div>
          <div class="feature-item">
            <div class="feature-icon">🚗</div>
            <div class="feature-label">Anunciar veículo</div>
          </div>
          <div class="feature-item">
            <div class="feature-icon">💬</div>
            <div class="feature-label">Chat integrado</div>
          </div>
        </div>
      </div>
      <a href="${SITE_URL}/browse" class="cta-button">Explorar veículos disponíveis</a>
    `, `Cadastro aprovado — InfiniteDrive`, `Seu cadastro foi aprovado! Acesse todas as funcionalidades do InfiniteDrive.`),
  }),

  verification_rejected: (data) => ({
    subject: `Cadastro pendente — Ação necessária`,
    html: baseTemplate(`
      <p class="greeting">Olá, ${data.userName}</p>
      <p class="message">
        Analisamos seu cadastro e identificamos que alguns documentos precisam ser reenviados ou corrigidos.
      </p>
      <div class="alert-box">
        ⚠️ Cadastro não aprovado neste momento. Revise as informações abaixo.
      </div>
      ${data.reason ? `
      <div class="info-box">
        <div class="info-box-title">📋 Motivo</div>
        <p style="font-size: 14px; color: #4b5563; line-height: 1.7; padding: 8px 0;">${data.reason}</p>
      </div>
      ` : ''}
      <div class="tip-box">
        <strong>O que fazer:</strong> Acesse seu perfil, revise os documentos e reenvie as informações corretas. Nossa equipe analisará novamente em até 24h.
      </div>
      <a href="${SITE_URL}/profile" class="cta-button">Atualizar meu cadastro</a>
    `, `Cadastro pendente — InfiniteDrive`, `Seu cadastro precisa de ajustes. Revise os documentos enviados.`),
  }),

  // ============================================================
  // VEÍCULOS
  // ============================================================

  vehicle_approved: (data) => ({
    subject: `Veículo aprovado! — ${data.vehicleName}`,
    html: baseTemplate(`
      <p class="greeting">Ótima notícia, ${data.ownerName}! 🚗</p>
      <p class="message">
        Seu <strong>${data.vehicleName}</strong> foi aprovado e já está visível para locatários.
      </p>
      <div class="success-box">
        ✅ Veículo aprovado e disponível para reservas!
      </div>
      <div class="info-box">
        <div class="info-box-title">🚗 Dados do veículo</div>
        <div class="info-row"><span class="info-label">Veículo</span><span class="info-value">${data.vehicleName}</span></div>
        <div class="info-row"><span class="info-label">Placa</span><span class="info-value">${data.licensePlate}</span></div>
        <div class="info-row"><span class="info-label">Diária</span><span class="info-value highlight">${data.dailyPrice}</span></div>
        <div class="info-row"><span class="info-label">Status</span><span class="info-value"><span class="status-badge status-confirmed">Aprovado</span></span></div>
      </div>
      <div class="tip-box">
        <strong>Dicas para mais reservas:</strong><br>
        • Adicione fotos de alta qualidade<br>
        • Mantenha o calendário atualizado<br>
        • Responda rápido às solicitações
      </div>
      <a href="${SITE_URL}/my-vehicles" class="cta-button">Gerenciar meus veículos</a>
    `, `Veículo aprovado — ${data.vehicleName}`, `Seu ${data.vehicleName} foi aprovado e está disponível para reservas.`),
  }),

  vehicle_rejected: (data) => ({
    subject: `Veículo pendente — ${data.vehicleName}`,
    html: baseTemplate(`
      <p class="greeting">Olá, ${data.ownerName}</p>
      <p class="message">
        O cadastro do seu <strong>${data.vehicleName}</strong> precisa de ajustes antes da aprovação.
      </p>
      <div class="alert-box">
        ⚠️ Veículo não aprovado — documentação precisa de revisão.
      </div>
      ${data.reason ? `
      <div class="info-box">
        <div class="info-box-title">📋 Motivo</div>
        <p style="font-size: 14px; color: #4b5563; line-height: 1.7; padding: 8px 0;">${data.reason}</p>
      </div>
      ` : ''}
      <div class="info-box">
        <div class="info-box-title">🚗 Veículo</div>
        <div class="info-row"><span class="info-label">Veículo</span><span class="info-value">${data.vehicleName}</span></div>
        <div class="info-row"><span class="info-label">Placa</span><span class="info-value">${data.licensePlate}</span></div>
      </div>
      <a href="${SITE_URL}/my-vehicles" class="cta-button">Revisar e corrigir</a>
    `, `Veículo pendente — ${data.vehicleName}`, `O cadastro do ${data.vehicleName} precisa de ajustes.`),
  }),

  // ============================================================
  // PAGAMENTO
  // ============================================================

  payment_confirmed: (data) => ({
    subject: `Pagamento confirmado — ${data.vehicleName}`,
    html: baseTemplate(`
      <p class="greeting">Pagamento confirmado, ${data.customerName}!</p>
      <p class="message">
        Seu pagamento para a reserva do <strong>${data.vehicleName}</strong> foi processado com sucesso.
      </p>
      <div class="success-box">
        💳 Pagamento aprovado! Sua reserva está garantida.
      </div>
      <div class="info-box">
        <div class="info-box-title">💳 Comprovante de pagamento</div>
        <div class="info-row"><span class="info-label">Veículo</span><span class="info-value">${data.vehicleName}</span></div>
        <div class="info-row"><span class="info-label">Período</span><span class="info-value">${data.startDate} → ${data.endDate}</span></div>
        <div class="info-row"><span class="info-label">Diárias</span><span class="info-value">${data.dailySubtotal}</span></div>
        ${data.extraHoursCharge && data.extraHoursCharge !== 'R$ 0,00' ? `<div class="info-row"><span class="info-label">Horas extras</span><span class="info-value">${data.extraHoursCharge}</span></div>` : ''}
        ${data.insurance && data.insurance !== 'R$ 0,00' ? `<div class="info-row"><span class="info-label">Seguro</span><span class="info-value">${data.insurance}</span></div>` : ''}
        <div class="info-row" style="border-top: 2px solid #2563eb; padding-top: 14px; margin-top: 8px;">
          <span class="info-label" style="font-weight: 600; color: #1a2332;">Total pago</span>
          <span class="info-value highlight" style="font-size: 18px;">${data.totalPrice}</span>
        </div>
      </div>
      <div style="background: #f8fafc; border-radius: 8px; padding: 12px 16px; text-align: center; margin-top: 16px;">
        <span style="font-size: 11px; color: #9ca3af;">ID da transação: ${data.sessionId}</span>
      </div>
      <div class="tip-box">
        Guarde este email como comprovante do seu pagamento.
      </div>
      <a href="${data.bookingUrl}" class="cta-button">Ver minha reserva</a>
    `, `Pagamento confirmado — ${data.vehicleName}`, `Pagamento de ${data.totalPrice} confirmado para ${data.vehicleName}.`),
  }),

  // ============================================================
  // LEMBRETE DE RETIRADA (NOVO)
  // ============================================================

  pickup_reminder_customer: (data) => ({
    subject: `Lembrete: retirada amanhã — ${data.vehicleName}`,
    html: baseTemplate(`
      <p class="greeting">Lembrete, ${data.customerName}! 📅</p>
      <p class="message">
        Sua reserva do <strong>${data.vehicleName}</strong> começa <strong>amanhã</strong>!
        Confira os detalhes abaixo e prepare-se para sua viagem.
      </p>
      <div class="warning-box">
        ⏰ A retirada do veículo é <strong>amanhã, ${data.startDate}</strong>${data.startTime ? ` às <strong>${data.startTime}</strong>` : ''}.
      </div>
      <div class="info-box">
        <div class="info-box-title">🚗 Detalhes da retirada</div>
        <div class="info-row"><span class="info-label">Veículo</span><span class="info-value">${data.vehicleName}</span></div>
        <div class="info-row"><span class="info-label">Proprietário</span><span class="info-value">${data.ownerName}</span></div>
        ${data.pickupLocation ? `<div class="info-row"><span class="info-label">Local</span><span class="info-value">${data.pickupLocation}</span></div>` : ''}
        ${data.startTime ? `<div class="info-row"><span class="info-label">Horário</span><span class="info-value">${data.startTime}</span></div>` : ''}
      </div>
      <div class="tip-box">
        <strong>Não esqueça:</strong><br>
        • Leve um documento com foto (CNH)<br>
        • Verifique as condições do veículo na entrega<br>
        • Registre qualquer avaria existente
      </div>
      <a href="${data.bookingUrl}" class="cta-button">Ver reserva completa</a>
    `, `Lembrete de retirada — ${data.vehicleName}`, `Sua retirada do ${data.vehicleName} é amanhã!`),
  }),

  // ============================================================
  // LEMBRETE DE DEVOLUÇÃO (NOVO)
  // ============================================================

  return_reminder_customer: (data) => ({
    subject: `Lembrete: devolução amanhã — ${data.vehicleName}`,
    html: baseTemplate(`
      <p class="greeting">Lembrete, ${data.customerName}! 📅</p>
      <p class="message">
        A devolução do <strong>${data.vehicleName}</strong> é <strong>amanhã</strong>.
        Certifique-se de devolver o veículo no horário combinado.
      </p>
      <div class="warning-box">
        ⏰ Devolução prevista para <strong>${data.endDate}</strong>${data.endTime ? ` às <strong>${data.endTime}</strong>` : ''}.
      </div>
      <div class="info-box">
        <div class="info-box-title">🚗 Detalhes da devolução</div>
        <div class="info-row"><span class="info-label">Veículo</span><span class="info-value">${data.vehicleName}</span></div>
        <div class="info-row"><span class="info-label">Proprietário</span><span class="info-value">${data.ownerName}</span></div>
        ${data.returnLocation ? `<div class="info-row"><span class="info-label">Local</span><span class="info-value">${data.returnLocation}</span></div>` : ''}
      </div>
      <div class="tip-box">
        <strong>Checklist de devolução:</strong><br>
        • Devolva o veículo com o mesmo nível de combustível<br>
        • Verifique se não esqueceu objetos pessoais<br>
        • Atrasos podem gerar cobranças adicionais
      </div>
      <a href="${data.bookingUrl}" class="cta-button">Ver reserva</a>
    `, `Lembrete de devolução — ${data.vehicleName}`, `A devolução do ${data.vehicleName} é amanhã!`),
  }),

  // ============================================================
  // BOAS-VINDAS (NOVO)
  // ============================================================

  welcome: (data) => ({
    subject: `Bem-vindo(a) ao InfiniteDrive, ${data.userName}!`,
    html: baseTemplate(`
      <p class="greeting">Bem-vindo(a), ${data.userName}! 👋</p>
      <p class="message">
        Ficamos muito felizes em ter você na comunidade InfiniteDrive! 
        Somos a maior plataforma de aluguel de veículos entre pessoas do Brasil.
      </p>
      <div class="info-box">
        <div class="info-box-title">🚀 Primeiros passos</div>
        <div style="text-align: center; padding: 8px 0;">
          <div class="feature-item">
            <div class="feature-icon">📝</div>
            <div class="feature-label">Complete seu perfil</div>
          </div>
          <div class="feature-item">
            <div class="feature-icon">✅</div>
            <div class="feature-label">Verifique sua identidade</div>
          </div>
          <div class="feature-item">
            <div class="feature-icon">🔍</div>
            <div class="feature-label">Explore os veículos</div>
          </div>
          <div class="feature-item">
            <div class="feature-icon">📅</div>
            <div class="feature-label">Faça sua 1ª reserva</div>
          </div>
        </div>
      </div>
      <div class="tip-box">
        <strong>Dica:</strong> Complete seu cadastro e verificação para desbloquear todas as funcionalidades da plataforma.
      </div>
      <a href="${SITE_URL}/profile" class="cta-button">Completar meu perfil</a>
      <a href="${SITE_URL}/browse" class="cta-button-secondary">Explorar veículos</a>
    `, `Bem-vindo(a) ao InfiniteDrive`, `Bem-vindo(a) ao InfiniteDrive! Complete seu perfil para começar.`),
  }),

  // ============================================================
  // SAQUE SOLICITADO (NOVO)
  // ============================================================

  withdrawal_requested: (data) => ({
    subject: `Saque solicitado — ${data.netAmount}`,
    html: baseTemplate(`
      <p class="greeting">Saque registrado, ${data.ownerName}!</p>
      <p class="message">
        Sua solicitação de saque foi recebida e está sendo processada pela nossa equipe.
      </p>
      <div class="info-box">
        <div class="info-box-title">💳 Detalhes do saque</div>
        <div class="info-row"><span class="info-label">Valor bruto</span><span class="info-value">${data.amount}</span></div>
        <div class="info-row"><span class="info-label">Taxa</span><span class="info-value" style="color: #dc2626;">${data.platformFee}</span></div>
        <div class="info-row"><span class="info-label">Valor líquido</span><span class="info-value highlight" style="font-size: 16px;">${data.netAmount}</span></div>
        <div class="info-row"><span class="info-label">Chave Pix</span><span class="info-value">${data.pixKey}</span></div>
        <div class="info-row"><span class="info-label">Status</span><span class="info-value"><span class="status-badge status-pending">Em processamento</span></span></div>
      </div>
      <div class="tip-box">
        O prazo para transferência é de até <strong>3 dias úteis</strong>. Você será notificado quando o valor for depositado.
      </div>
      <a href="${SITE_URL}/owner-withdrawals" class="cta-button">Ver meus saques</a>
    `, `Saque solicitado`, `Seu saque de ${data.netAmount} está sendo processado.`),
  }),

  // ============================================================
  // SAQUE APROVADO (NOVO)
  // ============================================================

  withdrawal_completed: (data) => ({
    subject: `Saque concluído — ${data.netAmount} depositado`,
    html: baseTemplate(`
      <p class="greeting">Saque concluído, ${data.ownerName}! 💰</p>
      <p class="message">
        O valor do seu saque foi transferido com sucesso para sua conta.
      </p>
      <div class="success-box">
        ✅ Transferência realizada! O valor de <strong>${data.netAmount}</strong> foi depositado na sua conta.
      </div>
      <div class="info-box">
        <div class="info-box-title">💳 Comprovante</div>
        <div class="info-row"><span class="info-label">Valor depositado</span><span class="info-value highlight" style="font-size: 16px;">${data.netAmount}</span></div>
        <div class="info-row"><span class="info-label">Chave Pix</span><span class="info-value">${data.pixKey}</span></div>
        <div class="info-row"><span class="info-label">Status</span><span class="info-value"><span class="status-badge status-confirmed">Concluído</span></span></div>
      </div>
      <a href="${SITE_URL}/owner-withdrawals" class="cta-button">Ver histórico de saques</a>
    `, `Saque concluído`, `Seu saque de ${data.netAmount} foi depositado na sua conta.`),
  }),

  // ============================================================
  // SUPORTE — TICKET EMAILS
  // ============================================================

  ticket_opened: (data) => ({
    subject: `Chamado aberto — ${data.ticketNumber}`,
    html: baseTemplate(`
      <p class="greeting">Olá, ${data.userName}!</p>
      <p class="message">
        Seu chamado foi aberto com sucesso. Nossa equipe analisará sua solicitação o mais breve possível.
      </p>
      <div class="info-box">
        <div class="info-box-title">🎫 Detalhes do chamado</div>
        <div class="info-row"><span class="info-label">Número</span><span class="info-value" style="font-family: monospace;">${data.ticketNumber}</span></div>
        <div class="info-row"><span class="info-label">Assunto</span><span class="info-value">${data.subject}</span></div>
        <div class="info-row"><span class="info-label">Categoria</span><span class="info-value">${data.category}</span></div>
        <div class="info-row"><span class="info-label">Prioridade</span><span class="info-value">${data.priority}</span></div>
        <div class="info-row"><span class="info-label">Tempo estimado</span><span class="info-value highlight">${data.slaTime}</span></div>
      </div>
      <div class="tip-box">
        Você pode acompanhar o status e enviar mensagens diretamente pelo app.
      </div>
      <a href="${data.ticketUrl}" class="cta-button">Acompanhar chamado</a>
    `, `Chamado aberto — ${data.ticketNumber}`, `Seu chamado ${data.ticketNumber} foi aberto com sucesso.`),
  }),

  ticket_replied: (data) => ({
    subject: `Nova resposta do suporte — ${data.ticketNumber}`,
    html: baseTemplate(`
      <p class="greeting">Olá, ${data.userName}!</p>
      <p class="message">
        O suporte respondeu ao seu chamado <strong>${data.ticketNumber}</strong>.
      </p>
      <div class="info-box">
        <div class="info-box-title">💬 Resposta do suporte</div>
        <div class="message-quote">"${data.messageContent}"</div>
        <div style="margin-top: 12px; font-size: 12px; color: #9ca3af;">Equipe de Suporte · ${data.repliedAt}</div>
      </div>
      <div class="tip-box">
        Responda diretamente pelo app para manter a conversa organizada.
      </div>
      <a href="${data.ticketUrl}" class="cta-button">Responder</a>
    `, `Resposta do suporte — ${data.ticketNumber}`, `O suporte respondeu ao seu chamado ${data.ticketNumber}.`),
  }),

  ticket_status_updated: (data) => ({
    subject: `Chamado ${data.statusLabel} — ${data.ticketNumber}`,
    html: baseTemplate(`
      <p class="greeting">Olá, ${data.userName}!</p>
      <p class="message">
        O status do seu chamado <strong>${data.ticketNumber}</strong> foi atualizado.
      </p>
      <div class="${data.status === 'resolved' ? 'success-box' : 'tip-box'}">
        ${data.status === 'resolved' ? '✅ Seu chamado foi resolvido!' : `📋 Status atualizado para: <strong>${data.statusLabel}</strong>`}
      </div>
      <div class="info-box">
        <div class="info-box-title">🎫 Chamado</div>
        <div class="info-row"><span class="info-label">Número</span><span class="info-value" style="font-family: monospace;">${data.ticketNumber}</span></div>
        <div class="info-row"><span class="info-label">Assunto</span><span class="info-value">${data.subject}</span></div>
        <div class="info-row"><span class="info-label">Novo status</span><span class="info-value"><span class="status-badge ${data.status === 'resolved' ? 'status-confirmed' : 'status-pending'}">${data.statusLabel}</span></span></div>
      </div>
      ${data.status === 'resolved' ? `
      <div class="tip-box">
        Se o problema foi resolvido, por favor avalie o atendimento! Sua opinião nos ajuda a melhorar.
      </div>
      ` : ''}
      <a href="${data.ticketUrl}" class="cta-button">${data.status === 'resolved' ? 'Avaliar atendimento' : 'Ver chamado'}</a>
    `, `Chamado ${data.statusLabel} — ${data.ticketNumber}`, `Seu chamado ${data.ticketNumber} foi atualizado para ${data.statusLabel}.`),
  }),
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { template, data, to } = await req.json();

    if (!template || !data || !to) {
      throw new Error("Missing required fields: template, data, to");
    }

    const templateFn = templates[template];
    if (!templateFn) {
      throw new Error(`Unknown email template: ${template}`);
    }

    const { subject, html } = templateFn(data);

    await sendEmail({ to, subject, html });

    console.log(`[SEND-EMAIL] Email sent successfully: template=${template}, to=${to}`);

    return new Response(JSON.stringify({ success: true, message: "Email sent successfully" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[SEND-EMAIL] Error:`, errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
