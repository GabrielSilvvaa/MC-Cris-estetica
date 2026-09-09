// ============================================================================
// PONTO DE INTEGRAÇÃO COM BANCO DE DADOS — INTERFACES DE REPOSITÓRIO
// TODO: [DB TEAM] Estas interfaces definem o contrato que qualquer driver/ORM
// (PostgreSQL, Prisma, TypeORM, Drizzle, etc.) deve implementar para garantir
// desacoplamento total entre o banco e a camada de serviços/regras de negócio.
// ============================================================================

import {
  Usuario,
  Cliente,
  Anamnese,
  Procedimento,
  Atendimento,
  Agendamento,
  Cancelamento,
  Lead,
  FAQ,
  ConfiguracaoHorario,
  BloqueioData,
  Notificacao,
  SolicitacaoLGPD,
  StatusSolicitacaoLGPD
} from '../types';

export interface IUsuarioRepository {
  buscarPorId(id: string): Promise<Usuario | null>;
  buscarPorEmail(email: string): Promise<Usuario | null>;
  buscarPorGoogleId(googleId: string): Promise<Usuario | null>;
  listar(): Promise<Usuario[]>;
  salvar(usuario: Usuario): Promise<Usuario>;
  atualizar(id: string, usuario: Partial<Usuario>): Promise<Usuario | null>;
  remover(id: string): Promise<boolean>;
}

export interface IClienteRepository {
  buscarPorId(id: string): Promise<Cliente | null>;
  buscarPorEmailOuTelefone(email?: string, telefone?: string): Promise<Cliente | null>;
  listar(filtroBusca?: string): Promise<Cliente[]>;
  salvar(cliente: Cliente): Promise<Cliente>;
  atualizar(id: string, cliente: Partial<Cliente>): Promise<Cliente | null>;
  remover(id: string): Promise<boolean>;
  buscarInativosHaMaisDe5Anos(): Promise<Cliente[]>; // Para job de retenção LGPD
}

// ============================================================================
// TODO: [DB TEAM / SEGURANÇA] IAnamneseRepository
// Todos os campos de texto médico (alergias, medicamentos, cirurgias, observações)
// representam dados de saúde sensíveis (Art. 11 LGPD) e exigem criptografia
// em repouso na implementação final do banco.
// ============================================================================
export interface IAnamneseRepository {
  buscarPorClienteId(clienteId: string): Promise<Anamnese | null>;
  salvarOuAtualizar(anamnese: Anamnese): Promise<Anamnese>;
  removerPorClienteId(clienteId: string): Promise<boolean>;
}

export interface IProcedimentoRepository {
  buscarPorId(id: string): Promise<Procedimento | null>;
  listar(apenasAtivos?: boolean): Promise<Procedimento[]>;
  salvar(procedimento: Procedimento): Promise<Procedimento>;
  atualizar(id: string, procedimento: Partial<Procedimento>): Promise<Procedimento | null>;
  remover(id: string): Promise<boolean>;
}

export interface IAtendimentoRepository {
  buscarPorId(id: string): Promise<Atendimento | null>;
  listarPorCliente(clienteId: string): Promise<Atendimento[]>;
  listarPorPeriodo(dataInicio: string, dataFim: string): Promise<Atendimento[]>;
  salvar(atendimento: Atendimento): Promise<Atendimento>;
  atualizar(id: string, atendimento: Partial<Atendimento>): Promise<Atendimento | null>;
  removerPorClienteId(clienteId: string): Promise<boolean>;
}

export interface IAgendamentoRepository {
  buscarPorId(id: string): Promise<Agendamento | null>;
  listar(dataInicio?: string, dataFim?: string): Promise<Agendamento[]>;
  listarPorCliente(clienteId: string): Promise<Agendamento[]>;
  buscarPorDataHora(dataHoraInicio: string): Promise<Agendamento | null>;
  salvar(agendamento: Agendamento): Promise<Agendamento>;
  atualizar(id: string, agendamento: Partial<Agendamento>): Promise<Agendamento | null>;
  remover(id: string): Promise<boolean>;
}

export interface ICancelamentoRepository {
  buscarPorId(id: string): Promise<Cancelamento | null>;
  listarPorCliente(clienteId: string): Promise<Cancelamento[]>;
  listarRecentes(limite?: number): Promise<Cancelamento[]>;
  contarTardiosUltimos6Meses(clienteId: string): Promise<number>;
  salvar(cancelamento: Cancelamento): Promise<Cancelamento>;
}

export interface ILeadRepository {
  buscarPorId(id: string): Promise<Lead | null>;
  listar(data?: string): Promise<Lead[]>;
  salvar(lead: Lead): Promise<Lead>;
}

export interface IFAQRepository {
  buscarPorId(id: string): Promise<FAQ | null>;
  listar(categoria?: string): Promise<FAQ[]>;
  salvar(faq: FAQ): Promise<FAQ>;
  atualizar(id: string, faq: Partial<FAQ>): Promise<FAQ | null>;
  remover(id: string): Promise<boolean>;
}

export interface IConfiguracaoRepository {
  listarHorarios(): Promise<ConfiguracaoHorario[]>;
  obterHorarioPorDia(diaSemana: number): Promise<ConfiguracaoHorario | null>;
  salvarHorarios(horarios: ConfiguracaoHorario[]): Promise<ConfiguracaoHorario[]>;
  listarBloqueios(): Promise<BloqueioData[]>;
  salvarBloqueio(bloqueio: BloqueioData): Promise<BloqueioData>;
  removerBloqueio(id: string): Promise<boolean>;
}

export interface INotificacaoRepository {
  listar(apenasNaoLidas?: boolean): Promise<Notificacao[]>;
  salvar(notificacao: Notificacao): Promise<Notificacao>;
  marcarComoLida(id: string): Promise<boolean>;
  marcarTodasComoLidas(): Promise<boolean>;
}

// ============================================================================
// TODO: [DB TEAM] ISolicitacaoLGPDRepository
// Tabela de auditoria e fila de solicitações LGPD (exportação de dados ou exclusão)
// registradas pela equipe e aprovadas/executadas pela Dra. Márcia (Admin).
// ============================================================================
export interface ISolicitacaoLGPDRepository {
  listar(status?: StatusSolicitacaoLGPD): Promise<SolicitacaoLGPD[]>;
  buscarPorId(id: string): Promise<SolicitacaoLGPD | null>;
  salvar(solicitacao: SolicitacaoLGPD): Promise<SolicitacaoLGPD>;
  atualizar(id: string, dados: Partial<SolicitacaoLGPD>): Promise<SolicitacaoLGPD | null>;
}
