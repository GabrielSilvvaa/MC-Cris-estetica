// ============================================================================
// PONTO DE INTEGRAÇÃO COM BOT DO WHATSAPP (META API EXTERNA)
// ============================================================================
// TODO: [INTEGRAÇÃO WHATSAPP/BOT]
// O bot de atendimento roda como serviço externo independente via Meta Cloud API.
// Este módulo define os disparos e notificações para o serviço do bot quando
// necessário (ex: envio de lembrete 24h antes para o WhatsApp do cliente).
// ============================================================================

export interface LembreteBotPayload {
  telefoneCliente: string;
  nomeCliente: string;
  procedimentoNome: string;
  dataHoraInicio: string;
  linkConfirmacao?: string;
}

export class WhatsAppBotIntegration {
  /**
   * Notifica o serviço externo do Bot do WhatsApp para disparar a mensagem de
   * lembrete 24h antes do atendimento para a cliente.
   */
  static async notificarBotLembrete24h(payload: LembreteBotPayload): Promise<boolean> {
    console.log(`[WhatsApp Bot Trigger] Solicitando envio de lembrete 24h para ${payload.telefoneCliente} (${payload.nomeCliente})`);
    console.log(`[WhatsApp Bot Trigger] Procedimento: ${payload.procedimentoNome} em ${payload.dataHoraInicio}`);

    // TODO: [INTEGRAÇÃO WHATSAPP/BOT]
    // Chamada HTTP para a API externa do bot:
    // await fetch(`${process.env.BOT_API_URL}/api/bot/enviar-lembrete`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${process.env.BOT_SERVICE_SECRET}`
    //   },
    //   body: JSON.stringify(payload)
    // });

    return true;
  }
}
