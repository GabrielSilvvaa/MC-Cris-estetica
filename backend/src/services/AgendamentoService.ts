import {
  IAgendamentoRepository,
  ICancelamentoRepository,
  IConfiguracaoRepository,
  IClienteRepository,
  IProcedimentoRepository,
  INotificacaoRepository
} from '../repositories/interfaces';

import {
  Agendamento,
  Cancelamento,
  Notificacao
} from '../types';

import { GoogleCalendarIntegration } from '../integrations/googleCalendar';
import { v4 as uuidv4 } from 'uuid';

export class AgendamentoService {
  constructor(
    private agendamentoRepo: IAgendamentoRepository,
    private cancelamentoRepo: ICancelamentoRepository,
    private configRepo: IConfiguracaoRepository,
    private clienteRepo: IClienteRepository,
    private procedimentoRepo: IProcedimentoRepository,
    private notificacaoRepo: INotificacaoRepository
  ) {}

  /**
   * Cria um novo agendamento respeitando a regra inegociável de 2h de duração fixa.
   */
  async criarAgendamento(dados: {
    cliente_id: string;
    procedimento_id: string;
    data_hora_inicio: string; // ISO 8601
    profissional?: string;
    observacoes?: string;
  }): Promise<Agendamento> {
    const inicio = new Date(dados.data_hora_inicio);
    if (isNaN(inicio.getTime())) {
      throw new Error('Data e hora de início inválidas.');
    }

    // REGRA DE NEGÓCIO 1: Duração fixa de 2 horas (120 minutos)
    const fim = new Date(inicio.getTime() + 120 * 60 * 1000);
    const dataHoraFim = fim.toISOString();

    // Valida dia de bloqueio
    const dataStr = dados.data_hora_inicio.split('T')[0];
    const bloqueios = await this.configRepo.listarBloqueios();
    const bloqueado = bloqueios.find(b => b.data === dataStr);
    if (bloqueado) {
      throw new Error(`Data bloqueada na agenda: ${bloqueado.motivo}`);
    }

    // Valida horário de funcionamento do dia da semana
    const diaSemana = inicio.getDay();
    const configHorario = await this.configRepo.obterHorarioPorDia(diaSemana);
    if (!configHorario || !configHorario.ativo) {
      throw new Error('A clínica não possui atendimento configurado para este dia da semana.');
    }

    // Valida conflito de horário
    const agendamentoExistente = await this.agendamentoRepo.buscarPorDataHora(dados.data_hora_inicio);
    if (agendamentoExistente) {
      throw new Error('Já existe um atendimento confirmado para este horário na agenda da Dra. Márcia.');
    }

    const cliente = await this.clienteRepo.buscarPorId(dados.cliente_id);
    if (!cliente) {
      throw new Error('Cliente não encontrado.');
    }

    const procedimento = await this.procedimentoRepo.buscarPorId(dados.procedimento_id);
    if (!procedimento) {
      throw new Error('Procedimento não encontrado.');
    }

    const novoAgendamento: Agendamento = {
      id: `agend-${uuidv4().slice(0, 8)}`,
      cliente_id: dados.cliente_id,
      procedimento_id: dados.procedimento_id,
      data_hora_inicio: dados.data_hora_inicio,
      data_hora_fim: dataHoraFim,
      status: 'agendado',
      profissional: dados.profissional || 'Dra. Márcia Cristina',
      observacoes: dados.observacoes || '',
      criado_em: new Date().toISOString()
    };

    // Sincronização com Google Calendar
    try {
      const googleEventId = await GoogleCalendarIntegration.criarEvento(
        novoAgendamento,
        cliente,
        procedimento
      );
      novoAgendamento.google_event_id = googleEventId;
    } catch (err) {
      console.warn('[AgendamentoService] Falha ao sincronizar com Google Calendar (mock):', err);
    }

    return this.agendamentoRepo.salvar(novoAgendamento);
  }

  /**
   * Cancela um agendamento com cálculo automático da regra de 48h de antecedência.
   */
  async cancelarAgendamento(agendamentoId: string, motivo: string): Promise<{
    cancelamento: Cancelamento;
    dentroDoPrazo: boolean;
    reincidenciaTardios6Meses: number;
  }> {
    if (!motivo || motivo.trim().length === 0) {
      throw new Error('É obrigatório informar o motivo do cancelamento.');
    }

    const agendamento = await this.agendamentoRepo.buscarPorId(agendamentoId);
    if (!agendamento) {
      throw new Error('Agendamento não encontrado.');
    }

    if (agendamento.status === 'cancelado') {
      throw new Error('Este agendamento já foi cancelado.');
    }

    const agora = new Date();
    const dataInicioAtendimento = new Date(agendamento.data_hora_inicio);
    const diferencaMs = dataInicioAtendimento.getTime() - agora.getTime();
    const diferencaHoras = diferencaMs / (1000 * 60 * 60);

    // REGRA DE NEGÓCIO 2: Prazo mínimo de 48h de antecedência
    const dentroDoPrazo = diferencaHoras >= 48;

    // Atualiza status do agendamento
    await this.agendamentoRepo.atualizar(agendamentoId, { status: 'cancelado' });

    // Sincroniza cancelamento com Google Calendar
    if (agendamento.google_event_id) {
      await GoogleCalendarIntegration.cancelarEvento(agendamento.google_event_id, motivo);
    }

    // Registra o cancelamento
    const novoCancelamento: Cancelamento = {
      id: `canc-${uuidv4().slice(0, 8)}`,
      agendamento_id: agendamentoId,
      cliente_id: agendamento.cliente_id,
      motivo,
      data_solicitacao: agora.toISOString(),
      dentro_do_prazo: dentroDoPrazo
    };

    await this.cancelamentoRepo.salvar(novoCancelamento);

    // Conta reincidência de cancelamentos tardios nos últimos 6 meses
    const reincidenciaTardios6Meses = await this.cancelamentoRepo.contarTardiosUltimos6Meses(
      agendamento.cliente_id
    );

    // Se foi cancelamento tardio, dispara notificação no painel
    if (!dentroDoPrazo) {
      const cliente = await this.clienteRepo.buscarPorId(agendamento.cliente_id);
      const nomeCliente = cliente ? cliente.nome : 'Cliente';

      const notificacao: Notificacao = {
        id: `notif-${uuidv4().slice(0, 8)}`,
        tipo: 'cancelamento_tardio',
        titulo: 'Alerta: Cancelamento Tardio (< 48h)',
        mensagem: `${nomeCliente} cancelou atendimento com ${Math.max(0, Math.round(diferencaHoras))}h de antecedência (${reincidenciaTardios6Meses}º cancelamento tardio nos últimos 6 meses).`,
        data_hora: agora.toISOString(),
        lida: false,
        meta: {
          cliente_id: agendamento.cliente_id,
          agendamento_id: agendamento.id
        }
      };

      await this.notificacaoRepo.salvar(notificacao);
    }

    return {
      cancelamento: novoCancelamento,
      dentroDoPrazo,
      reincidenciaTardios6Meses
    };
  }

  /**
   * Retorna horários disponíveis do dia para consulta pelo Bot do WhatsApp ou recepcionista.
   * Duração fixa de 2h (ex: 09:00 - 11:00, 11:00 - 13:00, 14:00 - 16:00, 16:00 - 18:00).
   */
  async obterDisponibilidadeDia(dataStr: string): Promise<{
    data: string;
    disponivel: boolean;
    motivoIndisponibilidade?: string;
    horariosLivres: { hora_inicio: string; hora_fim: string; slot_iso: string }[];
  }> {
    const data = new Date(dataStr + 'T00:00:00');
    if (isNaN(data.getTime())) {
      throw new Error('Data inválida. Formato esperado: YYYY-MM-DD');
    }

    // 1. Verifica bloqueio de data
    const bloqueios = await this.configRepo.listarBloqueios();
    const bloqueio = bloqueios.find(b => b.data === dataStr);
    if (bloqueio) {
      return {
        data: dataStr,
        disponivel: false,
        motivoIndisponibilidade: `Data bloqueada: ${bloqueio.motivo}`,
        horariosLivres: []
      };
    }

    // 2. Verifica horário de funcionamento
    const diaSemana = data.getDay();
    const config = await this.configRepo.obterHorarioPorDia(diaSemana);
    if (!config || !config.ativo) {
      return {
        data: dataStr,
        disponivel: false,
        motivoIndisponibilidade: 'Clínica fechada neste dia da semana.',
        horariosLivres: []
      };
    }

    // 3. Gera slots de 2h
    const [horaIni, minIni] = config.hora_inicio.split(':').map(Number);
    const [horaFim, minFim] = config.hora_fim.split(':').map(Number);

    const inicioMinutos = horaIni * 60 + minIni;
    const fimMinutos = horaFim * 60 + minFim;

    const agendamentos = await this.agendamentoRepo.listar(
      `${dataStr}T00:00:00Z`,
      `${dataStr}T23:59:59Z`
    );

    const agendadosNaoCancelados = agendamentos.filter(a => a.status !== 'cancelado');
    const horariosLivres: { hora_inicio: string; hora_fim: string; slot_iso: string }[] = [];

    for (let m = inicioMinutos; m + 120 <= fimMinutos; m += 120) {
      const hStart = Math.floor(m / 60).toString().padStart(2, '0');
      const mStart = (m % 60).toString().padStart(2, '0');
      const hEnd = Math.floor((m + 120) / 60).toString().padStart(2, '0');
      const mEnd = ((m + 120) % 60).toString().padStart(2, '0');

      const horaInicioStr = `${hStart}:${mStart}`;
      const horaFimStr = `${hEnd}:${mEnd}`;
      const slotIso = `${dataStr}T${horaInicioStr}:00Z`;

      // Verifica se o slot está ocupado
      const ocupado = agendadosNaoCancelados.some(a => {
        return a.data_hora_inicio.includes(`${dataStr}T${horaInicioStr}`) ||
               a.data_hora_inicio.startsWith(`${dataStr}T${horaInicioStr}`);
      });

      if (!ocupado) {
        horariosLivres.push({
          hora_inicio: horaInicioStr,
          hora_fim: horaFimStr,
          slot_iso: slotIso
        });
      }
    }

    return {
      data: dataStr,
      disponivel: horariosLivres.length > 0,
      horariosLivres
    };
  }

  /**
   * Retorna alertas de atendimentos próximos (dentro das próximas 2 horas).
   */
  async obterAtendimentosProximos(): Promise<any[]> {
    const agora = new Date();
    const daquiADuasHoras = new Date(agora.getTime() + 2 * 60 * 60 * 1000);

    const agendamentos = await this.agendamentoRepo.listar();
    const proximos = agendamentos.filter(a => {
      if (a.status !== 'agendado') return false;
      const dt = new Date(a.data_hora_inicio);
      return dt >= agora && dt <= daquiADuasHoras;
    });

    const resultados = [];
    for (const ag of proximos) {
      const cliente = await this.clienteRepo.buscarPorId(ag.cliente_id);
      const procedimento = await this.procedimentoRepo.buscarPorId(ag.procedimento_id);
      const minutosRestantes = Math.round((new Date(ag.data_hora_inicio).getTime() - agora.getTime()) / (60 * 1000));

      resultados.push({
        ...ag,
        cliente_nome: cliente?.nome || 'Cliente',
        cliente_telefone: cliente?.telefone || '',
        procedimento_nome: procedimento?.nome || 'Procedimento',
        minutos_restantes: minutosRestantes
      });
    }

    return resultados;
  }

  /**
   * Retorna cancelamentos tardios recentes para o Dashboard.
   */
  async obterCancelamentosTardiosRecentes(): Promise<any[]> {
    const cancelamentos = await this.cancelamentoRepo.listarRecentes(20);
    const tardios = cancelamentos.filter(c => !c.dentro_do_prazo);

    const resultados = [];
    for (const c of tardios) {
      const cliente = await this.clienteRepo.buscarPorId(c.cliente_id);
      const reincidencia = await this.cancelamentoRepo.contarTardiosUltimos6Meses(c.cliente_id);
      resultados.push({
        ...c,
        cliente_nome: cliente?.nome || 'Cliente',
        cliente_telefone: cliente?.telefone || '',
        reincidencia_6_meses: reincidencia
      });
    }

    return resultados;
  }
}
