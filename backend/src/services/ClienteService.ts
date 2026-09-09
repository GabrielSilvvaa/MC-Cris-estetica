import {
  IClienteRepository,
  IAnamneseRepository,
  IAtendimentoRepository,
  IAgendamentoRepository,
  ICancelamentoRepository
} from '../repositories/interfaces';

import {
  Cliente,
  Anamnese,
  Atendimento
} from '../types';

import { GoogleDriveIntegration } from '../integrations/googleDrive';
import { v4 as uuidv4 } from 'uuid';

export class ClienteService {
  constructor(
    private clienteRepo: IClienteRepository,
    private anamneseRepo: IAnamneseRepository,
    private atendimentoRepo: IAtendimentoRepository,
    private agendamentoRepo: IAgendamentoRepository,
    private cancelamentoRepo: ICancelamentoRepository
  ) {}

  async listarClientes(filtro?: string): Promise<any[]> {
    const clientes = await this.clienteRepo.listar(filtro);
    const clientesComMetricas = [];

    for (const c of clientes) {
      const cancelamentosTardios6Meses = await this.cancelamentoRepo.contarTardiosUltimos6Meses(c.id);
      const atendimentos = await this.atendimentoRepo.listarPorCliente(c.id);

      clientesComMetricas.push({
        ...c,
        total_atendimentos: atendimentos.length,
        cancelamentos_tardios_6_meses: cancelamentosTardios6Meses,
        ultimo_atendimento: atendimentos[0]?.data_hora || null
      });
    }

    return clientesComMetricas;
  }

  async obterFichaCompleta(clienteId: string): Promise<{
    cliente: Cliente;
    anamnese: Anamnese | null;
    historicoAtendimentos: Atendimento[];
    cancelamentosTardios6Meses: number;
  }> {
    const cliente = await this.clienteRepo.buscarPorId(clienteId);
    if (!cliente) {
      throw new Error('Cliente não encontrado.');
    }

    const anamnese = await this.anamneseRepo.buscarPorClienteId(clienteId);
    const historicoAtendimentos = await this.atendimentoRepo.listarPorCliente(clienteId);
    const cancelamentosTardios6Meses = await this.cancelamentoRepo.contarTardiosUltimos6Meses(clienteId);

    return {
      cliente,
      anamnese,
      historicoAtendimentos,
      cancelamentosTardios6Meses
    };
  }

  async criarCliente(dados: {
    nome: string;
    telefone: string;
    email: string;
    data_nascimento: string;
  }): Promise<Cliente> {
    const existe = await this.clienteRepo.buscarPorEmailOuTelefone(dados.email, dados.telefone);
    if (existe) {
      throw new Error('Já existe um cliente cadastrado com este e-mail ou telefone.');
    }

    const novoCliente: Cliente = {
      id: `cli-${uuidv4().slice(0, 8)}`,
      nome: dados.nome,
      telefone: dados.telefone,
      email: dados.email,
      data_nascimento: dados.data_nascimento,
      status_lgpd_consentimento: 'pendente',
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString()
    };

    return this.clienteRepo.salvar(novoCliente);
  }

  async atualizarCliente(id: string, dados: Partial<Cliente>): Promise<Cliente | null> {
    return this.clienteRepo.atualizar(id, dados);
  }

  async salvarAnamnese(dados: {
    cliente_id: string;
    alergias: string;
    medicamentos: string;
    cirurgias_previas: string;
    gestante_lactante: boolean;
    contraindicacoes: string;
    observacoes: string;
  }): Promise<Anamnese> {
    const cliente = await this.clienteRepo.buscarPorId(dados.cliente_id);
    if (!cliente) {
      throw new Error('Cliente não encontrado.');
    }

    const anamneseExistente = await this.anamneseRepo.buscarPorClienteId(dados.cliente_id);

    const anamnese: Anamnese = {
      id: anamneseExistente?.id || `anam-${uuidv4().slice(0, 8)}`,
      cliente_id: dados.cliente_id,
      alergias: dados.alergias || '',
      medicamentos: dados.medicamentos || '',
      cirurgias_previas: dados.cirurgias_previas || '',
      gestante_lactante: !!dados.gestante_lactante,
      contraindicacoes: dados.contraindicacoes || '',
      observacoes: dados.observacoes || '',
      atualizado_em: new Date().toISOString()
    };

    return this.anamneseRepo.salvarOuAtualizar(anamnese);
  }

  /**
   * Assina digitalmente o termo de consentimento LGPD da cliente.
   */
  async registrarConsentimentoLGPD(
    clienteId: string,
    assinaturaBase64: string
  ): Promise<Cliente> {
    const cliente = await this.clienteRepo.buscarPorId(clienteId);
    if (!cliente) {
      throw new Error('Cliente não encontrado.');
    }

    const agora = new Date().toISOString();
    // Armazena no Google Drive da clínica
    const uploadRes = await GoogleDriveIntegration.uploadTermoLGPD(
      cliente.id,
      cliente.nome,
      assinaturaBase64
    );

    const atualizado = await this.clienteRepo.atualizar(clienteId, {
      status_lgpd_consentimento: 'assinado',
      data_consentimento: agora,
      url_termo_assinado: uploadRes.urlVisualizacao,
      assinatura_base64: assinaturaBase64
    });

    return atualizado!;
  }

  /**
   * LGPD: Exportação completa dos dados do titular (Direito de Acesso e Portabilidade).
   */
  async exportarDadosCompletosLGPD(clienteId: string): Promise<any> {
    const ficha = await this.obterFichaCompleta(clienteId);
    const agendamentos = await this.agendamentoRepo.listarPorCliente(clienteId);
    const cancelamentos = await this.cancelamentoRepo.listarPorCliente(clienteId);

    return {
      titulo: 'RELATÓRIO DE DADOS PESSOAIS E CLÍNICOS (LGPD - ART. 18)',
      gerado_em: new Date().toISOString(),
      clinica: 'MC Estética & Bem-Estar - Dra. Márcia Cristina',
      dados_cadastrais: ficha.cliente,
      dados_sensíveis_anamnese: ficha.anamnese,
      historico_procedimentos_e_fotos: ficha.historicoAtendimentos,
      historico_agendamentos: agendamentos,
      historico_cancelamentos: cancelamentos,
      termo_lgpd: {
        status: ficha.cliente.status_lgpd_consentimento,
        data_assinatura: ficha.cliente.data_consentimento || null,
        url_documento: ficha.cliente.url_termo_assinado || null
      }
    };
  }

  /**
   * LGPD: Exclusão completa do cliente (Direito ao Esquecimento).
   */
  async excluirClienteCompletoLGPD(clienteId: string): Promise<boolean> {
    console.log(`[LGPD / Compliance] Executando exclusão total do titular: ${clienteId}`);

    // Remove anamnese (dados sensíveis de saúde)
    await this.anamneseRepo.removerPorClienteId(clienteId);

    // Remove atendimentos ou despersonaliza referências
    await this.atendimentoRepo.removerPorClienteId(clienteId);

    // Remove cadastro do cliente
    return this.clienteRepo.remover(clienteId);
  }

  /**
   * LGPD: Rotina de retenção de dados (5 anos após o último atendimento).
   */
  async executarRotinaRetencao5Anos(): Promise<{ clientesAnonimizados: number }> {
    // ============================================================================
    // TODO: [DB TEAM / LGPD]
    // Rotina agendada (Cron job) de retenção: Clientes sem atendimento há mais de 5 anos
    // devem ser anonimizados, preservando apenas registros fiscais/financeiros despersonalizados.
    // ============================================================================
    const inativos = await this.clienteRepo.buscarInativosHaMaisDe5Anos();
    console.log(`[LGPD Retenção 5 Anos] Encontrados ${inativos.length} clientes elegíveis para anonimização.`);

    for (const c of inativos) {
      await this.clienteRepo.atualizar(c.id, {
        nome: `Cliente Anonimizado (${c.id.slice(0, 6)})`,
        email: `anonimizado_${c.id.slice(0, 6)}@retencao.lgpd`,
        telefone: '(00) 00000-0000',
        url_termo_assinado: undefined,
        assinatura_base64: undefined
      });
      await this.anamneseRepo.removerPorClienteId(c.id);
    }

    return { clientesAnonimizados: inativos.length };
  }
}
