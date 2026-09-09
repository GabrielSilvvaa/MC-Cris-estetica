import { ILeadRepository, INotificacaoRepository } from '../repositories/interfaces';
import { Lead, Notificacao } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class LeadService {
  constructor(
    private leadRepo: ILeadRepository,
    private notificacaoRepo: INotificacaoRepository
  ) {}

  async listarLeads(data?: string): Promise<Lead[]> {
    return this.leadRepo.listar(data);
  }

  /**
   * Ponto de recepção de leads vindos do WhatsApp (Bot externo via Webhook).
   */
  async receberLeadDoBot(dados: {
    nome: string;
    telefone: string;
    procedimento_interesse: string;
    orcamento_estimado?: number;
    data_recebimento?: string;
  }): Promise<Lead> {
    const novoLead: Lead = {
      id: `lead-${uuidv4().slice(0, 8)}`,
      nome: dados.nome,
      telefone: dados.telefone,
      procedimento_interesse: dados.procedimento_interesse,
      orcamento_estimado: dados.orcamento_estimado || 0,
      data_recebimento: dados.data_recebimento || new Date().toISOString()
    };

    const leadSalvo = await this.leadRepo.salvar(novoLead);

    // Dispara notificação interna no painel (Sino + Web Push)
    const orcamentoFormatado = novoLead.orcamento_estimado > 0
      ? ` (Orçamento: R$ ${novoLead.orcamento_estimado.toFixed(2)})`
      : '';

    const notificacao: Notificacao = {
      id: `notif-${uuidv4().slice(0, 8)}`,
      tipo: 'novo_lead',
      titulo: 'Novo Lead do WhatsApp',
      mensagem: `${novoLead.nome} se interessou por "${novoLead.procedimento_interesse}"${orcamentoFormatado}.`,
      data_hora: new Date().toISOString(),
      lida: false,
      meta: { lead_id: leadSalvo.id }
    };

    await this.notificacaoRepo.salvar(notificacao);

    return leadSalvo;
  }
}
