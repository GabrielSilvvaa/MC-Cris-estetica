import {
  IAtendimentoRepository,
  IClienteRepository,
  IProcedimentoRepository
} from '../repositories/interfaces';

import {
  Atendimento,
  RelatorioFinanceiro,
  FormaPagamento,
  StatusPagamento
} from '../types';

import { v4 as uuidv4 } from 'uuid';

export class FinanceiroService {
  constructor(
    private atendimentoRepo: IAtendimentoRepository,
    private clienteRepo: IClienteRepository,
    private procedimentoRepo: IProcedimentoRepository
  ) {}

  /**
   * Gera relatório financeiro consolidado por período (Dia, Semana, Mês).
   * SOMENTE ADMINISTRADOR.
   */
  async gerarRelatorioPeriodo(
    tipoPeriodo: 'dia' | 'semana' | 'mes',
    dataReferencia?: string
  ): Promise<RelatorioFinanceiro> {
    const ref = dataReferencia ? new Date(dataReferencia) : new Date();
    let dataInicio: Date;
    let dataFim: Date;

    if (tipoPeriodo === 'dia') {
      dataInicio = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 0, 0, 0);
      dataFim = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 23, 59, 59);
    } else if (tipoPeriodo === 'semana') {
      const day = ref.getDay();
      const diff = ref.getDate() - day + (day === 0 ? -6 : 1); // Segunda-feira
      dataInicio = new Date(ref.setDate(diff));
      dataInicio.setHours(0, 0, 0, 0);
      dataFim = new Date(dataInicio);
      dataFim.setDate(dataInicio.getDate() + 6);
      dataFim.setHours(23, 59, 59, 999);
    } else {
      // Mês
      dataInicio = new Date(ref.getFullYear(), ref.getMonth(), 1, 0, 0, 0);
      dataFim = new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59, 59);
    }

    const atendimentos = await this.atendimentoRepo.listarPorPeriodo(
      dataInicio.toISOString(),
      dataFim.toISOString()
    );

    let faturamentoTotal = 0;
    let totalPagos = 0;
    let totalPendentes = 0;

    const porForma: Record<FormaPagamento, number> = {
      pix: 0,
      cartao_credito: 0,
      cartao_debito: 0,
      dinheiro: 0,
      transferencia: 0,
      outro: 0
    };

    for (const a of atendimentos) {
      if (a.status_pagamento === 'pago') {
        faturamentoTotal += a.valor_cobrado;
        totalPagos++;
        if (porForma[a.forma_pagamento] !== undefined) {
          porForma[a.forma_pagamento] += a.valor_cobrado;
        } else {
          porForma.outro += a.valor_cobrado;
        }
      } else {
        totalPendentes++;
      }
    }

    const totalAtendimentos = atendimentos.length;
    const ticketMedio = totalPagos > 0 ? faturamentoTotal / totalPagos : 0;

    return {
      periodo: tipoPeriodo,
      data_inicio: dataInicio.toISOString(),
      data_fim: dataFim.toISOString(),
      faturamento_total: faturamentoTotal,
      total_atendimentos: totalAtendimentos,
      total_pagos: totalPagos,
      total_pendentes: totalPendentes,
      ticket_medio: Math.round(ticketMedio * 100) / 100,
      detalhes_por_forma_pagamento: porForma
    };
  }

  /**
   * Lista atendimentos com detalhes completos de pagamento.
   */
  async listarAtendimentosComPagamento(dataInicio?: string, dataFim?: string): Promise<any[]> {
    const inicio = dataInicio || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const fim = dataFim || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59).toISOString();

    const atendimentos = await this.atendimentoRepo.listarPorPeriodo(inicio, fim);
    const resultado = [];

    for (const a of atendimentos) {
      const cliente = await this.clienteRepo.buscarPorId(a.cliente_id);
      const procedimento = await this.procedimentoRepo.buscarPorId(a.procedimento_id);

      resultado.push({
        ...a,
        cliente_nome: cliente?.nome || 'Cliente',
        cliente_telefone: cliente?.telefone || '',
        procedimento_nome: procedimento?.nome || 'Procedimento',
        preco_padrao_sugerido: procedimento?.preco_padrao || a.valor_cobrado
      });
    }

    return resultado;
  }

  /**
   * Registra ou atualiza o pagamento de um atendimento.
   */
  async registrarPagamento(dados: {
    atendimento_id?: string;
    cliente_id: string;
    procedimento_id: string;
    profissional?: string;
    data_hora?: string;
    valor_cobrado: number;
    forma_pagamento: FormaPagamento;
    status_pagamento: StatusPagamento;
    observacoes_sessao?: string;
  }): Promise<Atendimento> {
    if (dados.atendimento_id) {
      const atualizado = await this.atendimentoRepo.atualizar(dados.atendimento_id, {
        valor_cobrado: dados.valor_cobrado,
        forma_pagamento: dados.forma_pagamento,
        status_pagamento: dados.status_pagamento,
        observacoes_sessao: dados.observacoes_sessao
      });
      if (!atualizado) throw new Error('Atendimento não encontrado.');
      return atualizado;
    }

    const novoAtendimento: Atendimento = {
      id: `atend-${uuidv4().slice(0, 8)}`,
      cliente_id: dados.cliente_id,
      procedimento_id: dados.procedimento_id,
      profissional: dados.profissional || 'Dra. Márcia Cristina',
      data_hora: dados.data_hora || new Date().toISOString(),
      valor_cobrado: dados.valor_cobrado,
      forma_pagamento: dados.forma_pagamento,
      status_pagamento: dados.status_pagamento,
      observacoes_sessao: dados.observacoes_sessao || '',
      fotos_urls: [],
      criado_em: new Date().toISOString()
    };

    return this.atendimentoRepo.salvar(novoAtendimento);
  }
}
