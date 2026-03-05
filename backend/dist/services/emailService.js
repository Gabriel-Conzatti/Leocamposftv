import transporter from '../utils/email.js';
/**
 * Envia um email genérico
 */
export const enviarEmail = async (opcoes) => {
    try {
        if (!process.env.SMTP_USER) {
            console.warn('⚠️  Email não configurado. Pulando envio de email.');
            return false;
        }
        const resultado = await transporter.sendMail({
            from: `"FutevoleiPro" <${process.env.SMTP_USER}>`,
            to: opcoes.para,
            subject: opcoes.assunto,
            html: opcoes.html,
        });
        console.log(`✅ Email enviado para ${opcoes.para}:`, resultado.messageId);
        return true;
    }
    catch (erro) {
        console.error('❌ Erro ao enviar email:', erro);
        return false;
    }
};
/**
 * Template: Confirmação de Nova Inscrição
 */
export const emailNovaInscricao = (nomeAluno, nomeAula, dataAula, horarioAula, localAula, preco) => {
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .aula-info { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #667eea; border-radius: 4px; }
          .aula-info div { margin: 10px 0; }
          .label { font-weight: bold; color: #667eea; }
          .button { background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Inscrição Confirmada!</h1>
          </div>
          <div class="content">
            <p>Olá <strong>${nomeAluno}</strong>,</p>
            
            <p>Sua inscrição foi <strong>recebida com sucesso</strong> na aula:</p>
            
            <div class="aula-info">
              <div><span class="label">📚 Aula:</span> ${nomeAula}</div>
              <div><span class="label">📅 Data:</span> ${dataAula}</div>
              <div><span class="label">⏰ Horário:</span> ${horarioAula}</div>
              <div><span class="label">📍 Local:</span> ${localAula}</div>
              <div><span class="label">💵 Valor:</span> R$ ${preco.toFixed(2)}</div>
            </div>
            
            <p>Você receberá em breve um email sobre a <strong>confirmação de pagamento</strong>.</p>
            
            <p>Se tiver dúvidas, entre em contato conosco!</p>
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" class="button">Acessar sua conta</a>
            
            <div class="footer">
              <p>FutevoleiPro © 2026 | Todos os direitos reservados</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
};
/**
 * Template: Confirmação de Pagamento
 */
export const emailConfirmacaoPagamento = (nomeAluno, nomeAula, dataAula, horarioAula, localAula, preco) => {
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #34a853 0%, #24a147 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .aula-info { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #34a853; border-radius: 4px; }
          .aula-info div { margin: 10px 0; }
          .label { font-weight: bold; color: #34a853; }
          .button { background: #34a853; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #999; font-size: 12px; }
          .sucesso { color: #34a853; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Pagamento Confirmado!</h1>
          </div>
          <div class="content">
            <p>Oi <strong>${nomeAluno}</strong>,</p>
            
            <p>Seu pagamento foi <span class="sucesso">CONFIRMADO</span> com sucesso!</p>
            
            <div class="aula-info">
              <div><span class="label">📚 Aula:</span> ${nomeAula}</div>
              <div><span class="label">📅 Data:</span> ${dataAula}</div>
              <div><span class="label">⏰ Horário:</span> ${horarioAula}</div>
              <div><span class="label">📍 Local:</span> ${localAula}</div>
              <div><span class="label">💰 Valor Pago:</span> R$ ${preco.toFixed(2)}</div>
            </div>
            
            <p>Você está oficialmente inscrito! 🎉</p>
            
            <p><strong>Lembrete importante:</strong> Chegue 10 minutos antes da aula começar!</p>
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/aulas" class="button">Ver minhas aulas</a>
            
            <div class="footer">
              <p>FutevoleiPro © 2026 | Todos os direitos reservados</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
};
/**
 * Template: Nova Aula Disponível
 */
export const emailNovaAulaDisponivel = (nomeAluno, nomeAula, dataAula, horarioAula, localAula, descricao, preco) => {
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .aula-info { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #ff6b6b; border-radius: 4px; }
          .aula-info div { margin: 10px 0; }
          .label { font-weight: bold; color: #ff6b6b; }
          .descricao { font-style: italic; color: #666; margin: 15px 0; }
          .button { background: #ff6b6b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🆕 Nova Aula Disponível!</h1>
          </div>
          <div class="content">
            <p>Olá <strong>${nomeAluno}</strong>,</p>
            
            <p>Uma <strong>nova aula</strong> foi disponibilizada! 📢</p>
            
            <div class="aula-info">
              <div><span class="label">📚 Aula:</span> ${nomeAula}</div>
              <div><span class="label">📅 Data:</span> ${dataAula}</div>
              <div><span class="label">⏰ Horário:</span> ${horarioAula}</div>
              <div><span class="label">📍 Local:</span> ${localAula}</div>
              <div><span class="label">💵 Valor:</span> R$ ${preco.toFixed(2)}</div>
              <p class="descricao">${descricao}</p>
            </div>
            
            <p>Vagas limitadas! Se tem interesse, <strong>não perca tempo</strong> em se inscrever!</p>
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/aulas" class="button">Inscrever-se Agora</a>
            
            <div class="footer">
              <p>FutevoleiPro © 2026 | Todos os direitos reservados</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
};
/**
 * Template: Aviso de Agendamento / Lembrete 24h Antes
 */
export const emailLembreteAula = (nomeAluno, nomeAula, dataAula, horarioAula, localAula, professorNome) => {
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f6a622 0%, #f59c19 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .aula-info { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #f6a622; border-radius: 4px; }
          .aula-info div { margin: 10px 0; }
          .label { font-weight: bold; color: #f6a622; }
          .destaque { background: #fff3cd; padding: 15px; border-radius: 4px; margin: 15px 0; }
          .button { background: #f6a622; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Lembrete: Sua Aula é Amanhã!</h1>
          </div>
          <div class="content">
            <p>Oi <strong>${nomeAluno}</strong>,</p>
            
            <p>Só para <strong>confirmar sua presença</strong> - sua aula é <strong>amanhã</strong>! 💪</p>
            
            <div class="aula-info">
              <div><span class="label">📚 Aula:</span> ${nomeAula}</div>
              <div><span class="label">📅 Data:</span> ${dataAula}</div>
              <div><span class="label">⏰ Horário:</span> ${horarioAula}</div>
              <div><span class="label">📍 Local:</span> ${localAula}</div>
              <div><span class="label">👨‍🏫 Professor:</span> ${professorNome}</div>
            </div>
            
            <div class="destaque">
              <strong>⚠️ Atenção:</strong> Chegue com 10 minutos de antecedência. Traga sua chuteira e roupas confortáveis!
            </div>
            
            <p>Nos vemos lá! 🏐</p>
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/aulas" class="button">Ver detalhes da aula</a>
            
            <div class="footer">
              <p>FutevoleiPro © 2026 | Todos os direitos reservados</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
};
/**
 * Template: Cancelamento de Aula
 */
export const emailAulaCancelada = (nomeAluno, nomeAula, dataAula, horarioAula, motivo = 'Motivos não previstos') => {
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #c0392b 0%, #a93226 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .aula-info { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #c0392b; border-radius: 4px; }
          .aula-info div { margin: 10px 0; }
          .label { font-weight: bold; color: #c0392b; }
          .button { background: #c0392b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ Aula Cancelada</h1>
          </div>
          <div class="content">
            <p>Olá <strong>${nomeAluno}</strong>,</p>
            
            <p>Lamentamos informar que a aula foi <strong>CANCELADA</strong>.</p>
            
            <div class="aula-info">
              <div><span class="label">📚 Aula:</span> ${nomeAula}</div>
              <div><span class="label">📅 Data:</span> ${dataAula}</div>
              <div><span class="label">⏰ Horário:</span> ${horarioAula}</div>
              <div><span class="label">📝 Motivo:</span> ${motivo}</div>
            </div>
            
            <p>Seu pagamento será <strong>reembolsado</strong> em até 5 dias úteis.</p>
            
            <p>Confira novas aulas disponíveis e escolha uma que combina com você!</p>
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/aulas" class="button">Ver outras aulas</a>
            
            <div class="footer">
              <p>FutevoleiPro © 2026 | Todos os direitos reservados</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
};
/**
 * Template: Aula Confirmada (enviado pelo professor)
 */
export const emailAulaConfirmada = (nomeAluno, nomeAula, dataAula, horarioAula, localAula, professorNome, observacoes = '') => {
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #00b894 0%, #00cec9 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .aula-info { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #00b894; border-radius: 4px; }
          .aula-info div { margin: 10px 0; }
          .label { font-weight: bold; color: #00b894; }
          .destaque { background: #d4edda; padding: 15px; border-radius: 4px; margin: 15px 0; text-align: center; }
          .observacoes { background: #fff3cd; padding: 15px; border-radius: 4px; margin: 15px 0; font-style: italic; }
          .button { background: #00b894; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Aula Confirmada!</h1>
          </div>
          <div class="content">
            <p>Olá <strong>${nomeAluno}</strong>,</p>
            
            <div class="destaque">
              <strong>🎉 Sua aula está CONFIRMADA!</strong>
            </div>
            
            <p>O professor <strong>${professorNome}</strong> confirmou a realização da aula. Veja os detalhes:</p>
            
            <div class="aula-info">
              <div><span class="label">📚 Aula:</span> ${nomeAula}</div>
              <div><span class="label">📅 Data:</span> ${dataAula}</div>
              <div><span class="label">⏰ Horário:</span> ${horarioAula}</div>
              <div><span class="label">📍 Local:</span> ${localAula}</div>
              <div><span class="label">👨‍🏫 Professor:</span> ${professorNome}</div>
            </div>
            
            ${observacoes ? `
            <div class="observacoes">
              <strong>📝 Observações do professor:</strong><br>
              ${observacoes}
            </div>
            ` : ''}
            
            <p><strong>⚠️ Lembrete importante:</strong> Chegue 10 minutos antes do horário!</p>
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" class="button">Ver minha conta</a>
            
            <div class="footer">
              <p>FutevoleiPro © 2026 | Todos os direitos reservados</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
};
/**
 * Template: Confirmação de Inscrição (Alerta Genérico)
 */
export const emailAvisoAgendamento = (nomeAluno, nomeAula, dataAula, horarioAula) => {
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 4px; }
          .label { font-weight: bold; color: #667eea; }
          .footer { text-align: center; margin-top: 30px; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📅 Você foi agendado!</h1>
          </div>
          <div class="content">
            <p>Olá <strong>${nomeAluno}</strong>,</p>
            
            <p>Você foi agendado para a aula:</p>
            
            <div class="info-box">
              <div><span class="label">📚 Aula:</span> ${nomeAula}</div>
              <div><span class="label">📅 Data:</span> ${dataAula}</div>
              <div><span class="label">⏰ Horário:</span> ${horarioAula}</div>
            </div>
            
            <p>Você receberá um lembrete antes da aula começar.</p>
            
            <div class="footer">
              <p>FutevoleiPro © 2026 | Todos os direitos reservados</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
};
/**
 * Template: Recuperação de Senha
 */
export const emailRecuperacaoSenha = (nomeUsuario, tokenReset, urlFrontend = process.env.FRONTEND_URL || 'http://localhost:5173') => {
    const linkReset = `${urlFrontend}/recuperar-senha?token=${tokenReset}`;
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .warning-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .button { background: #4facfe; color: white; padding: 14px 28px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0; font-weight: bold; }
          .token-box { background: white; padding: 15px; margin: 20px 0; border: 2px dashed #ccc; border-radius: 4px; font-family: monospace; word-break: break-all; }
          .footer { text-align: center; margin-top: 30px; color: #999; font-size: 12px; }
          .expiry { color: #dc3545; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Recuperação de Senha</h1>
          </div>
          <div class="content">
            <p>Olá <strong>${nomeUsuario}</strong>,</p>
            
            <p>Recebemos uma solicitação para <strong>redefinir sua senha</strong> no FutevoleiPro.</p>
            
            <p>Clique no botão abaixo para criar uma nova senha:</p>
            
            <a href="${linkReset}" class="button">Redefinir Minha Senha</a>
            
            <div class="warning-box">
              <strong>⚠️ Atenção:</strong> Este link expira em <span class="expiry">1 hora</span> por motivos de segurança.
            </div>
            
            <p><strong>Se você não conseguir clicar no botão</strong>, copie e cole este link no seu navegador:</p>
            <div class="token-box">${linkReset}</div>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
            
            <p style="color: #666; font-size: 14px;">
              <strong>Não solicitou esta redefinição?</strong><br>
              Ignore este email. Sua senha permanecerá a mesma e nenhuma alteração será feita.
            </p>
            
            <p style="color: #666; font-size: 14px;">
              <strong>Dica de segurança:</strong> Nunca compartilhe este link com ninguém.
            </p>
            
            <div class="footer">
              <p>FutevoleiPro © 2026 | Todos os direitos reservados</p>
              <p>Este é um email automático. Por favor, não responda.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
};
/**
 * Template: Confirmação de Senha Alterada
 */
export const emailSenhaAlterada = (nomeUsuario, dataHora) => {
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #34a853 0%, #24a147 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .success-box { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 4px; color: #155724; }
          .warning-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .footer { text-align: center; margin-top: 30px; color: #999; font-size: 12px; }
          .info { color: #666; font-size: 14px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Senha Alterada com Sucesso!</h1>
          </div>
          <div class="content">
            <p>Olá <strong>${nomeUsuario}</strong>,</p>
            
            <div class="success-box">
              <strong>✅ Confirmação:</strong> Sua senha foi alterada com sucesso!
            </div>
            
            <p>Sua senha do FutevoleiPro foi redefinida em:</p>
            <p class="info"><strong>📅 Data/Hora:</strong> ${dataHora}</p>
            
            <p>Você já pode fazer login com sua nova senha.</p>
            
            <div class="warning-box">
              <strong>⚠️ Não foi você?</strong><br>
              Se você não realizou esta alteração, entre em contato conosco <strong>imediatamente</strong> para proteger sua conta.
            </div>
            
            <p style="color: #666; font-size: 14px;">
              <strong>Dicas de segurança:</strong>
            </p>
            <ul style="color: #666; font-size: 14px;">
              <li>Use uma senha forte e única</li>
              <li>Não compartilhe sua senha com ninguém</li>
              <li>Altere sua senha regularmente</li>
            </ul>
            
            <div class="footer">
              <p>FutevoleiPro © 2026 | Todos os direitos reservados</p>
              <p>Este é um email automático. Por favor, não responda.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
};
//# sourceMappingURL=emailService.js.map