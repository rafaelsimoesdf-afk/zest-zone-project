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
  const from = Deno.env.get("EMAIL_FROM") || "ZestZone <noreply@zestzone.com.br>";

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
// EMAIL TEMPLATES
// ============================================================

const baseTemplate = (content: string, title: string) => `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f4f4; color: #333; }
    .container { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 32px 40px; text-align: center; }
    .header img { width: 48px; height: 48px; margin-bottom: 12px; }
    .header h1 { color: #f5c518; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { color: #a0aec0; font-size: 14px; margin-top: 4px; }
    .content { padding: 40px; }
    .greeting { font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #1a202c; }
    .message { font-size: 15px; line-height: 1.7; color: #4a5568; margin-bottom: 24px; }
    .info-box { background: #f7fafc; border-left: 4px solid #f5c518; border-radius: 0 8px 8px 0; padding: 20px 24px; margin: 24px 0; }
    .info-box h3 { font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #718096; margin-bottom: 12px; }
    .info-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: #718096; }
    .info-value { font-weight: 600; color: #2d3748; }
    .status-badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; }
    .status-pending { background: #fef3c7; color: #92400e; }
    .status-confirmed { background: #d1fae5; color: #065f46; }
    .status-cancelled { background: #fee2e2; color: #991b1b; }
    .status-completed { background: #dbeafe; color: #1e40af; }
    .cta-button { display: block; width: fit-content; margin: 32px auto 0; padding: 16px 40px; background: linear-gradient(135deg, #f5c518, #e5a500); color: #1a1a2e; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px; text-align: center; }
    .divider { border: none; border-top: 1px solid #e2e8f0; margin: 32px 0; }
    .footer { background: #f7fafc; padding: 24px 40px; text-align: center; border-top: 1px solid #e2e8f0; }
    .footer p { font-size: 12px; color: #a0aec0; line-height: 1.6; }
    .footer a { color: #f5c518; text-decoration: none; }
    .highlight { color: #e5a500; font-weight: 700; }
    .alert-box { background: #fff5f5; border: 1px solid #fed7d7; border-radius: 8px; padding: 16px 20px; margin: 20px 0; font-size: 14px; color: #c53030; }
    .success-box { background: #f0fff4; border: 1px solid #9ae6b4; border-radius: 8px; padding: 16px 20px; margin: 20px 0; font-size: 14px; color: #276749; }
    .tip-box { background: #ebf8ff; border: 1px solid #90cdf4; border-radius: 8px; padding: 16px 20px; margin: 20px 0; font-size: 14px; color: #2c5282; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚗 ZestZone</h1>
      <p>Plataforma de aluguel de veículos entre pessoas</p>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>Este é um email automático do sistema ZestZone. Por favor, não responda diretamente a este email.</p>
      <p style="margin-top: 8px;">
        Dúvidas? <a href="https://zest-zone-project.lovable.app">Acesse nossa plataforma</a>
      </p>
      <p style="margin-top: 8px; font-size: 11px;">© 2025 ZestZone — Todos os direitos reservados</p>
    </div>
  </div>
</body>
</html>
`;

const templates: Record<string, (data: Record<string, string>) => { subject: string; html: string }> = {

  // ============================================================
  // RESERVAS - PARA O LOCATÁRIO
  // ============================================================

  booking_created_customer: (data) => ({
    subject: `✅ Reserva solicitada — ${data.vehicleName}`,
    html: baseTemplate(`
      <p class="greeting">Olá, ${data.customerName}! 👋</p>
      <p class="message">
        Sua solicitação de reserva foi enviada com sucesso e está aguardando aprovação do proprietário.
        Você receberá uma notificação assim que ele responder.
      </p>
      <div class="info-box">
        <h3>📋 Detalhes da sua reserva</h3>
        <div class="info-row"><span class="info-label">Veículo</span><span class="info-value">${data.vehicleName}</span></div>
        <div class="info-row"><span class="info-label">Período</span><span class="info-value">${data.startDate} → ${data.endDate}</span></div>
        <div class="info-row"><span class="info-label">Duração</span><span class="info-value">${data.totalDays} ${parseInt(data.totalDays) === 1 ? 'dia' : 'dias'}</span></div>
        <div class="info-row"><span class="info-label">Diária</span><span class="info-value">${data.dailyRate}</span></div>
        ${data.pickupLocation ? `<div class="info-row"><span class="info-label">Local de retirada</span><span class="info-value">${data.pickupLocation}</span></div>` : ''}
        <div class="info-row"><span class="info-label">Total pago</span><span class="info-value highlight">${data.totalPrice}</span></div>
        <div class="info-row"><span class="info-label">Status</span><span class="info-value"><span class="status-badge status-pending">⏳ Aguardando aprovação</span></span></div>
      </div>
      <div class="tip-box">
        💡 <strong>O que acontece agora?</strong><br>
        O proprietário tem até 24h para aprovar ou recusar sua reserva. Fique atento ao seu email e às notificações do app!
      </div>
      <a href="${data.bookingUrl}" class="cta-button">Ver minha reserva →</a>
    `, `Reserva solicitada — ${data.vehicleName}`),
  }),

  booking_confirmed_customer: (data) => ({
    subject: `🎉 Reserva confirmada! — ${data.vehicleName}`,
    html: baseTemplate(`
      <p class="greeting">Ótima notícia, ${data.customerName}! 🎉</p>
      <p class="message">
        O proprietário <strong>${data.ownerName}</strong> aprovou sua reserva do <strong>${data.vehicleName}</strong>.
        Sua viagem está confirmada! Abaixo estão todos os detalhes que você precisa saber.
      </p>
      <div class="success-box">
        🎊 Reserva aprovada e confirmada com sucesso!
      </div>
      <div class="info-box">
        <h3>🚗 Detalhes da reserva confirmada</h3>
        <div class="info-row"><span class="info-label">Veículo</span><span class="info-value">${data.vehicleName}</span></div>
        <div class="info-row"><span class="info-label">Período</span><span class="info-value">${data.startDate} → ${data.endDate}</span></div>
        <div class="info-row"><span class="info-label">Duração</span><span class="info-value">${data.totalDays} ${parseInt(data.totalDays) === 1 ? 'dia' : 'dias'}</span></div>
        ${data.pickupLocation ? `<div class="info-row"><span class="info-label">Local de retirada</span><span class="info-value">${data.pickupLocation}</span></div>` : ''}
        <div class="info-row"><span class="info-label">Status</span><span class="info-value"><span class="status-badge status-confirmed">✅ Confirmada</span></span></div>
      </div>
      <div class="info-box">
        <h3>👤 Contato do proprietário</h3>
        <div class="info-row"><span class="info-label">Nome</span><span class="info-value">${data.ownerName}</span></div>
        ${data.ownerPhone ? `<div class="info-row"><span class="info-label">Telefone</span><span class="info-value">${data.ownerPhone}</span></div>` : ''}
      </div>
      <div class="tip-box">
        💡 <strong>Próximos passos:</strong><br>
        Entre em contato com o proprietário para combinar os detalhes de retirada do veículo. 
        Você pode usar o chat do app para se comunicar diretamente com ele.
      </div>
      <a href="${data.bookingUrl}" class="cta-button">Ver detalhes da reserva →</a>
    `, `Reserva confirmada — ${data.vehicleName}`),
  }),

  booking_cancelled_customer: (data) => ({
    subject: `😔 Reserva cancelada — ${data.vehicleName}`,
    html: baseTemplate(`
      <p class="greeting">Olá, ${data.customerName}</p>
      <p class="message">
        Lamentamos informar que sua reserva do <strong>${data.vehicleName}</strong> foi cancelada.
        ${data.reason ? `O proprietário informou o seguinte motivo: <em>"${data.reason}"</em>` : ''}
      </p>
      <div class="alert-box">
        ❌ Sua reserva foi cancelada
        ${data.reason ? `<br><br><strong>Motivo:</strong> ${data.reason}` : ''}
      </div>
      <div class="info-box">
        <h3>📋 Reserva cancelada</h3>
        <div class="info-row"><span class="info-label">Veículo</span><span class="info-value">${data.vehicleName}</span></div>
        <div class="info-row"><span class="info-label">Período solicitado</span><span class="info-value">${data.startDate} → ${data.endDate}</span></div>
        <div class="info-row"><span class="info-label">Status</span><span class="info-value"><span class="status-badge status-cancelled">❌ Cancelada</span></span></div>
      </div>
      <div class="tip-box">
        💡 <strong>O que fazer agora?</strong><br>
        Não desanime! Você pode buscar outros veículos disponíveis para o mesmo período na nossa plataforma.
        Em caso de reembolso, o valor será estornado conforme a política de cancelamento.
      </div>
      <a href="https://zest-zone-project.lovable.app/browse" class="cta-button">Buscar outros veículos →</a>
    `, `Reserva cancelada — ${data.vehicleName}`),
  }),

  booking_completed_customer: (data) => ({
    subject: `⭐ Como foi sua viagem com ${data.vehicleName}?`,
    html: baseTemplate(`
      <p class="greeting">Olá, ${data.customerName}! Sua viagem foi concluída! 🎊</p>
      <p class="message">
        Esperamos que você tenha aproveitado sua experiência com o <strong>${data.vehicleName}</strong>!
        Sua opinião é muito importante para nós e para o proprietário.
      </p>
      <div class="success-box">
        🏁 Reserva finalizada com sucesso! Obrigado por usar o ZestZone.
      </div>
      <div class="info-box">
        <h3>📋 Resumo da sua viagem</h3>
        <div class="info-row"><span class="info-label">Veículo</span><span class="info-value">${data.vehicleName}</span></div>
        <div class="info-row"><span class="info-label">Período</span><span class="info-value">${data.startDate} → ${data.endDate}</span></div>
        <div class="info-row"><span class="info-label">Duração</span><span class="info-value">${data.totalDays} ${parseInt(data.totalDays) === 1 ? 'dia' : 'dias'}</span></div>
        <div class="info-row"><span class="info-label">Status</span><span class="info-value"><span class="status-badge status-completed">✅ Concluída</span></span></div>
      </div>
      <p class="message">
        Que tal avaliar o proprietário <strong>${data.ownerName}</strong>? Sua avaliação ajuda outros usuários 
        a tomarem melhores decisões e incentiva bons proprietários a continuarem na plataforma.
      </p>
      <a href="${data.bookingUrl}" class="cta-button">⭐ Avaliar minha experiência →</a>
    `, `Avalie sua viagem — ${data.vehicleName}`),
  }),

  // ============================================================
  // RESERVAS - PARA O PROPRIETÁRIO
  // ============================================================

  booking_created_owner: (data) => ({
    subject: `🔔 Nova solicitação de reserva — ${data.vehicleName}`,
    html: baseTemplate(`
      <p class="greeting">Olá, ${data.ownerName}! 👋</p>
      <p class="message">
        Você recebeu uma nova solicitação de reserva para o seu <strong>${data.vehicleName}</strong>!
        Acesse o painel do proprietário para aprovar ou recusar a solicitação.
      </p>
      <div class="info-box">
        <h3>📋 Detalhes da solicitação</h3>
        <div class="info-row"><span class="info-label">Locatário</span><span class="info-value">${data.customerName}</span></div>
        <div class="info-row"><span class="info-label">Veículo</span><span class="info-value">${data.vehicleName}</span></div>
        <div class="info-row"><span class="info-label">Período</span><span class="info-value">${data.startDate} → ${data.endDate}</span></div>
        <div class="info-row"><span class="info-label">Duração</span><span class="info-value">${data.totalDays} ${parseInt(data.totalDays) === 1 ? 'dia' : 'dias'}</span></div>
        <div class="info-row"><span class="info-label">Valor bruto</span><span class="info-value">${data.totalPrice}</span></div>
        <div class="info-row"><span class="info-label">Sua receita líquida (85%)</span><span class="info-value highlight">${data.netRevenue}</span></div>
        ${data.notes ? `<div class="info-row"><span class="info-label">Observações do locatário</span><span class="info-value">${data.notes}</span></div>` : ''}
        <div class="info-row"><span class="info-label">Status</span><span class="info-value"><span class="status-badge status-pending">⏳ Aguardando sua resposta</span></span></div>
      </div>
      <div class="alert-box">
        ⚠️ <strong>Importante:</strong> O locatário já realizou o pagamento. 
        Ao aprovar, você confirma a disponibilidade do veículo para o período solicitado.
      </div>
      <a href="https://zest-zone-project.lovable.app/owner-dashboard" class="cta-button">Revisar e responder →</a>
    `, `Nova reserva — ${data.vehicleName}`),
  }),

  booking_completed_owner: (data) => ({
    subject: `💰 Reserva finalizada — Receita de ${data.netRevenue}`,
    html: baseTemplate(`
      <p class="greeting">Parabéns, ${data.ownerName}! 🎊</p>
      <p class="message">
        A reserva do seu <strong>${data.vehicleName}</strong> com ${data.customerName} foi concluída com sucesso!
        Sua receita já foi registrada no sistema.
      </p>
      <div class="success-box">
        💰 Reserva concluída! Sua receita foi registrada.
      </div>
      <div class="info-box">
        <h3>💳 Resumo financeiro</h3>
        <div class="info-row"><span class="info-label">Valor bruto da reserva</span><span class="info-value">${data.totalPrice}</span></div>
        <div class="info-row"><span class="info-label">Taxa da plataforma (15%)</span><span class="info-value" style="color: #c53030">${data.platformFee}</span></div>
        <div class="info-row"><span class="info-label">Sua receita líquida</span><span class="info-value highlight">${data.netRevenue}</span></div>
      </div>
      <div class="info-box">
        <h3>📋 Detalhes da reserva</h3>
        <div class="info-row"><span class="info-label">Veículo</span><span class="info-value">${data.vehicleName}</span></div>
        <div class="info-row"><span class="info-label">Locatário</span><span class="info-value">${data.customerName}</span></div>
        <div class="info-row"><span class="info-label">Período</span><span class="info-value">${data.startDate} → ${data.endDate}</span></div>
        <div class="info-row"><span class="info-label">Duração</span><span class="info-value">${data.totalDays} ${parseInt(data.totalDays) === 1 ? 'dia' : 'dias'}</span></div>
      </div>
      <p class="message">Que tal avaliar o locatário <strong>${data.customerName}</strong>? 
        Avaliações ajudam a construir confiança na comunidade ZestZone.</p>
      <a href="https://zest-zone-project.lovable.app/owner-dashboard" class="cta-button">Ver painel e avaliar locatário →</a>
    `, `Reserva finalizada — ${data.vehicleName}`),
  }),

  // ============================================================
  // MENSAGENS
  // ============================================================

  new_message: (data) => ({
    subject: `💬 Nova mensagem de ${data.senderName} — ${data.vehicleName}`,
    html: baseTemplate(`
      <p class="greeting">Olá, ${data.receiverName}! 👋</p>
      <p class="message">
        Você recebeu uma nova mensagem de <strong>${data.senderName}</strong> 
        referente à reserva do <strong>${data.vehicleName}</strong>.
      </p>
      <div class="info-box">
        <h3>💬 Mensagem recebida</h3>
        <div style="padding: 16px; background: #fff; border-radius: 8px; border: 1px solid #e2e8f0; margin-top: 8px; font-size: 15px; line-height: 1.6; color: #2d3748; font-style: italic;">
          "${data.messageContent}"
        </div>
        <div style="margin-top: 12px; font-size: 12px; color: #a0aec0;">De: ${data.senderName} · ${data.sentAt}</div>
      </div>
      <div class="tip-box">
        💡 Responda pelo app para manter toda a comunicação organizada e protegida.
      </div>
      <a href="${data.bookingUrl}" class="cta-button">Responder mensagem →</a>
    `, `Nova mensagem — ${data.vehicleName}`),
  }),

  // ============================================================
  // AVALIAÇÕES
  // ============================================================

  review_received: (data) => ({
    subject: `⭐ Você recebeu uma avaliação de ${data.reviewerName}`,
    html: baseTemplate(`
      <p class="greeting">Olá, ${data.reviewedName}! 🌟</p>
      <p class="message">
        <strong>${data.reviewerName}</strong> te avaliou após a reserva do <strong>${data.vehicleName}</strong>!
      </p>
      <div class="info-box">
        <h3>⭐ Sua avaliação</h3>
        <div style="text-align: center; padding: 20px 0;">
          <div style="font-size: 48px; margin-bottom: 8px;">${'⭐'.repeat(parseInt(data.rating))}${'☆'.repeat(5 - parseInt(data.rating))}</div>
          <div style="font-size: 28px; font-weight: 700; color: #f5c518;">${data.rating}/5</div>
        </div>
        ${data.comment ? `
        <div style="padding: 16px; background: #fff; border-radius: 8px; border: 1px solid #e2e8f0; margin-top: 12px; font-size: 15px; line-height: 1.6; color: #2d3748; font-style: italic;">
          "${data.comment}"
        </div>
        <div style="margin-top: 8px; font-size: 12px; color: #a0aec0;">— ${data.reviewerName}</div>
        ` : ''}
      </div>
      <p class="message">Avaliações são fundamentais para construir sua reputação na plataforma!</p>
      <a href="https://zest-zone-project.lovable.app/profile" class="cta-button">Ver meu perfil completo →</a>
    `, `Nova avaliação recebida`),
  }),

  // ============================================================
  // VERIFICAÇÃO DE CADASTRO
  // ============================================================

  verification_approved: (data) => ({
    subject: `🎉 Cadastro aprovado! Bem-vindo(a) ao ZestZone, ${data.userName}!`,
    html: baseTemplate(`
      <p class="greeting">Parabéns, ${data.userName}! 🎉</p>
      <p class="message">
        Seu cadastro foi verificado e aprovado com sucesso! Agora você tem acesso completo 
        à plataforma ZestZone e pode alugar e anunciar veículos.
      </p>
      <div class="success-box">
        ✅ Sua identidade foi verificada! Conta ativa com todas as funcionalidades.
      </div>
      <div class="info-box">
        <h3>🚀 O que você pode fazer agora</h3>
        <div class="info-row"><span class="info-label">🔍 Explorar veículos</span><span class="info-value">Busque entre centenas de opções</span></div>
        <div class="info-row"><span class="info-label">📅 Fazer reservas</span><span class="info-value">Reserve com segurança e facilidade</span></div>
        <div class="info-row"><span class="info-label">🚗 Anunciar veículo</span><span class="info-value">Cadastre seu veículo e ganhe dinheiro</span></div>
        <div class="info-row"><span class="info-label">💬 Chat integrado</span><span class="info-value">Comunicação direta com proprietários</span></div>
      </div>
      <a href="https://zest-zone-project.lovable.app/browse" class="cta-button">Explorar veículos disponíveis →</a>
    `, `Cadastro aprovado — ZestZone`),
  }),

  verification_rejected: (data) => ({
    subject: `⚠️ Cadastro pendente — Ação necessária`,
    html: baseTemplate(`
      <p class="greeting">Olá, ${data.userName}</p>
      <p class="message">
        Analisamos sua solicitação de cadastro e identificamos que alguns documentos precisam 
        ser reenviados ou corrigidos para concluir sua verificação.
      </p>
      <div class="alert-box">
        ⚠️ Seu cadastro não pôde ser aprovado neste momento. Veja abaixo o que precisa ser corrigido.
      </div>
      ${data.reason ? `
      <div class="info-box">
        <h3>📋 Motivo</h3>
        <p style="font-size: 14px; color: #4a5568; line-height: 1.7; padding: 8px 0;">${data.reason}</p>
      </div>
      ` : ''}
      <div class="tip-box">
        💡 <strong>O que fazer?</strong><br>
        Acesse seu perfil na plataforma, revise os documentos enviados e reenvie as informações corretas.
        Nossa equipe analisará novamente em até 24h.
      </div>
      <a href="https://zest-zone-project.lovable.app/profile" class="cta-button">Atualizar meu cadastro →</a>
    `, `Cadastro pendente — ZestZone`),
  }),

  // ============================================================
  // VEÍCULO APROVADO/REJEITADO
  // ============================================================

  vehicle_approved: (data) => ({
    subject: `🚗 Seu veículo foi aprovado! — ${data.vehicleName}`,
    html: baseTemplate(`
      <p class="greeting">Ótima notícia, ${data.ownerName}! 🎊</p>
      <p class="message">
        Seu veículo <strong>${data.vehicleName}</strong> foi analisado e aprovado pela nossa equipe!
        Ele já está visível para locatários em toda a plataforma.
      </p>
      <div class="success-box">
        ✅ Veículo aprovado e disponível para reservas!
      </div>
      <div class="info-box">
        <h3>🚗 Dados do veículo aprovado</h3>
        <div class="info-row"><span class="info-label">Veículo</span><span class="info-value">${data.vehicleName}</span></div>
        <div class="info-row"><span class="info-label">Placa</span><span class="info-value">${data.licensePlate}</span></div>
        <div class="info-row"><span class="info-label">Diária</span><span class="info-value highlight">${data.dailyPrice}</span></div>
        <div class="info-row"><span class="info-label">Status</span><span class="info-value"><span class="status-badge status-confirmed">✅ Aprovado</span></span></div>
      </div>
      <div class="tip-box">
        💡 <strong>Dicas para mais reservas:</strong><br>
        • Adicione fotos de alta qualidade do veículo<br>
        • Mantenha o calendário de disponibilidade atualizado<br>
        • Responda rapidamente às solicitações de reserva<br>
        • Complete seu perfil com mais informações
      </div>
      <a href="https://zest-zone-project.lovable.app/my-vehicles" class="cta-button">Gerenciar meus veículos →</a>
    `, `Veículo aprovado — ${data.vehicleName}`),
  }),

  vehicle_rejected: (data) => ({
    subject: `⚠️ Veículo pendente de revisão — ${data.vehicleName}`,
    html: baseTemplate(`
      <p class="greeting">Olá, ${data.ownerName}</p>
      <p class="message">
        Analisamos o cadastro do seu veículo <strong>${data.vehicleName}</strong> e identificamos 
        algumas pendências que precisam ser corrigidas antes da aprovação.
      </p>
      <div class="alert-box">
        ⚠️ Veículo não aprovado — documentação ou informações precisam de revisão.
      </div>
      ${data.reason ? `
      <div class="info-box">
        <h3>📋 Motivo da pendência</h3>
        <p style="font-size: 14px; color: #4a5568; line-height: 1.7; padding: 8px 0;">${data.reason}</p>
      </div>
      ` : ''}
      <div class="info-box">
        <h3>🚗 Veículo</h3>
        <div class="info-row"><span class="info-label">Veículo</span><span class="info-value">${data.vehicleName}</span></div>
        <div class="info-row"><span class="info-label">Placa</span><span class="info-value">${data.licensePlate}</span></div>
      </div>
      <a href="https://zest-zone-project.lovable.app/my-vehicles" class="cta-button">Revisar e corrigir →</a>
    `, `Veículo pendente — ${data.vehicleName}`),
  }),

  // ============================================================
  // PAGAMENTO CONFIRMADO
  // ============================================================

  payment_confirmed: (data) => ({
    subject: `💳 Pagamento confirmado — ${data.vehicleName}`,
    html: baseTemplate(`
      <p class="greeting">Olá, ${data.customerName}! 👋</p>
      <p class="message">
        Seu pagamento foi processado e confirmado com sucesso! 
        A reserva do <strong>${data.vehicleName}</strong> está garantida.
      </p>
      <div class="success-box">
        💳 Pagamento aprovado! Sua reserva está assegurada.
      </div>
      <div class="info-box">
        <h3>💳 Comprovante de pagamento</h3>
        <div class="info-row"><span class="info-label">Veículo</span><span class="info-value">${data.vehicleName}</span></div>
        <div class="info-row"><span class="info-label">Período</span><span class="info-value">${data.startDate} → ${data.endDate}</span></div>
        <div class="info-row"><span class="info-label">Diárias</span><span class="info-value">${data.dailySubtotal}</span></div>
        ${data.extraHoursCharge && data.extraHoursCharge !== 'R$ 0,00' ? `<div class="info-row"><span class="info-label">Horas extras</span><span class="info-value">${data.extraHoursCharge}</span></div>` : ''}
        ${data.insurance && data.insurance !== 'R$ 0,00' ? `<div class="info-row"><span class="info-label">Seguro</span><span class="info-value">${data.insurance}</span></div>` : ''}
        <div class="info-row"><span class="info-label">Total pago</span><span class="info-value highlight">${data.totalPrice}</span></div>
        <div class="info-row"><span class="info-label">ID da sessão</span><span class="info-value" style="font-size: 11px; word-break: break-all;">${data.sessionId}</span></div>
      </div>
      <div class="tip-box">
        💡 Guarde este email como comprovante do seu pagamento.
      </div>
      <a href="${data.bookingUrl}" class="cta-button">Ver minha reserva →</a>
    `, `Pagamento confirmado — ${data.vehicleName}`),
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
