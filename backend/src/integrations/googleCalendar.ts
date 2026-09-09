// ============================================================================
// PONTO DE INTEGRAÇÃO COM GOOGLE CALENDAR
// ============================================================================
// TODO: [INTEGRAÇÃO GOOGLE CALENDAR]
// Configurar credenciais OAuth 2.0 da conta institucional da clínica (Dra. Márcia).
// Escopo necessário: https://www.googleapis.com/auth/calendar
// Job de sincronização bidirecional pode ser avaliado futuramente,
// mas o fluxo inicial é: sistema -> Google Calendar (a fonte da verdade fica no sistema).
//
// Variáveis de ambiente sugeridas:
// GOOGLE_CALENDAR_CLIENT_ID=...
// GOOGLE_CALENDAR_CLIENT_SECRET=...
// GOOGLE_CALENDAR_REFRESH_TOKEN=...
// GOOGLE_CALENDAR_ID=esteticabemestarmc@gmail.com
// ============================================================================

import { Agendamento, Cliente, Procedimento } from '../types';

export class GoogleCalendarIntegration {
  /**
   * Cria um evento na Google Agenda da conta institucional da clínica.
   * Duração fixa de 2 horas (120 minutos).
   */
  static async criarEvento(
    agendamento: Agendamento,
    cliente: Cliente,
    procedimento: Procedimento
  ): Promise<string> {
    console.log(`[Google Calendar Sync] Criando evento para ${cliente.nome} - ${procedimento.nome}`);
    console.log(`[Google Calendar Sync] Horário: ${agendamento.data_hora_inicio} até ${agendamento.data_hora_fim} (Duração fixa de 2h)`);

    // TODO: [INTEGRAÇÃO GOOGLE CALENDAR]
    // const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    // const res = await calendar.events.insert({
    //   calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
    //   requestBody: {
    //     summary: `Atendimento: ${cliente.nome} (${procedimento.nome})`,
    //     description: `Cliente: ${cliente.nome}\nTelefone: ${cliente.telefone}\nProcedimento: ${procedimento.nome}\nObs: ${agendamento.observacoes || 'Nenhuma'}`,
    //     start: { dateTime: agendamento.data_hora_inicio, timeZone: 'America/Sao_Paulo' },
    //     end: { dateTime: agendamento.data_hora_fim, timeZone: 'America/Sao_Paulo' },
    //   }
    // });
    // return res.data.id!;

    // Retorno simulado de eventId do Google Calendar
    return `gcal_event_${agendamento.id}_${Date.now()}`;
  }

  /**
   * Atualiza um evento existente no Google Calendar.
   */
  static async atualizarEvento(
    googleEventId: string,
    agendamento: Agendamento,
    cliente: Cliente,
    procedimento: Procedimento
  ): Promise<boolean> {
    console.log(`[Google Calendar Sync] Atualizando evento ${googleEventId} para ${agendamento.data_hora_inicio}`);

    // TODO: [INTEGRAÇÃO GOOGLE CALENDAR]
    // const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    // await calendar.events.patch({ calendarId: 'primary', eventId: googleEventId, requestBody: { ... } });
    return true;
  }

  /**
   * Remove/cancela um evento no Google Calendar.
   */
  static async cancelarEvento(googleEventId: string, motivo: string): Promise<boolean> {
    console.log(`[Google Calendar Sync] Removendo/Cancelando evento ${googleEventId}. Motivo: ${motivo}`);

    // TODO: [INTEGRAÇÃO GOOGLE CALENDAR]
    // const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    // await calendar.events.delete({ calendarId: 'primary', eventId: googleEventId });
    return true;
  }
}
