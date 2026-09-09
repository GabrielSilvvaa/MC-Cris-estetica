// ============================================================================
// PONTO DE INTEGRAÇÃO COM BANCO DE DADOS — IMPLEMENTAÇÃO EM MEMÓRIA (MOCK)
// TODO: [DB TEAM] Substituir a implementação em memória abaixo pela conexão
// com o banco de dados oficial (ex: PostgreSQL com Prisma/TypeORM/Drizzle).
// As assinaturas dos métodos das interfaces devem ser estritamente mantidas
// para preservar as regras de negócio e contratos de API.
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

import {
  IUsuarioRepository,
  IClienteRepository,
  IAnamneseRepository,
  IProcedimentoRepository,
  IAtendimentoRepository,
  IAgendamentoRepository,
  ICancelamentoRepository,
  ILeadRepository,
  IFAQRepository,
  IConfiguracaoRepository,
  INotificacaoRepository,
  ISolicitacaoLGPDRepository
} from './interfaces';

import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// DADOS DE SEED INICIAIS (Para testes e demonstração imediata)
// ============================================================================
// DADOS DE SEED INICIAIS (Exemplos neutros para testes e desenvolvimento)
// ============================================================================

const usuariosSeed: Usuario[] = [
  {
    id: 'user-admin-1',
    nome: 'Dra. Márcia Cristina',
    email: 'esteticabemestarmc@gmail.com',
    role: 'admin',
    google_id: 'google-oauth2|marcia-admin',
    ativo: true
  },
  {
    id: 'user-recep-1',
    nome: 'Recepcionista',
    email: 'esteticabemestarmc@gmail.com',
    role: 'recepcionista',
    google_id: 'google-oauth2|recepcao',
    ativo: true
  }
];

const clientesSeed: Cliente[] = [
  {
    id: 'cli-1',
    nome: 'Cliente Exemplo 1',
    telefone: '(11) 90000-0001',
    email: 'cliente1@exemplo.com',
    data_nascimento: '1990-01-01',
    status_lgpd_consentimento: 'assinado',
    data_consentimento: '2026-08-10T14:30:00Z',
    url_termo_assinado: 'https://drive.google.com/file/d/exemplo-termo-cliente1/view',
    criado_em: '2026-05-10T10:00:00Z',
    atualizado_em: '2026-08-10T14:30:00Z'
  },
  {
    id: 'cli-2',
    nome: 'Cliente Exemplo 2',
    telefone: '(11) 90000-0002',
    email: 'cliente2@exemplo.com',
    data_nascimento: '1992-06-15',
    status_lgpd_consentimento: 'assinado',
    data_consentimento: '2026-08-01T09:15:00Z',
    url_termo_assinado: 'https://drive.google.com/file/d/exemplo-termo-cliente2/view',
    criado_em: '2026-07-20T11:00:00Z',
    atualizado_em: '2026-08-01T09:15:00Z'
  },
  {
    id: 'cli-3',
    nome: 'Cliente Exemplo 3',
    telefone: '(11) 90000-0003',
    email: 'cliente3@exemplo.com',
    data_nascimento: '1985-03-20',
    status_lgpd_consentimento: 'pendente',
    criado_em: '2026-08-20T16:00:00Z',
    atualizado_em: '2026-08-20T16:00:00Z'
  }
];

const anamnesesSeed: Anamnese[] = [
  {
    id: 'anam-1',
    cliente_id: 'cli-1',
    alergias: 'Exemplo: Nenhuma alergia conhecida informada.',
    medicamentos: 'Exemplo: Suplementação vitamínica.',
    cirurgias_previas: 'Exemplo: Nenhuma.',
    gestante_lactante: false,
    contraindicacoes: 'Exemplo: Nenhuma contraindicação.',
    observacoes: 'Registro de exemplo de ficha de anamnese.',
    atualizado_em: '2026-08-10T14:30:00Z'
  },
  {
    id: 'anam-2',
    cliente_id: 'cli-2',
    alergias: 'Exemplo: Nenhuma.',
    medicamentos: 'Exemplo: Nenhum.',
    cirurgias_previas: 'Exemplo: Nenhuma.',
    gestante_lactante: false,
    contraindicacoes: 'Exemplo: Nenhuma.',
    observacoes: 'Registro de exemplo de ficha de anamnese.',
    atualizado_em: '2026-08-01T09:15:00Z'
  }
];

const procedimentosSeed: Procedimento[] = [
  {
    id: 'proc-1',
    nome: 'Harmonização Facial & Preenchimento Labial',
    descricao: 'Aplicação de ácido hialurônico para contorno e volume natural.',
    preco_padrao: 1800.00,
    duracao_minutos: 120, // 2h fixas
    ativo: true
  },
  {
    id: 'proc-2',
    nome: 'Aplicação de Toxina Botulínica (Botox Completo)',
    descricao: 'Tratamento de linhas de expressão facial.',
    preco_padrao: 1350.00,
    duracao_minutos: 120, // 2h fixas
    ativo: true
  },
  {
    id: 'proc-3',
    nome: 'Bioestimulador de Colágeno',
    descricao: 'Estímulo de firmeza, elasticidade e volumização natural.',
    preco_padrao: 2200.00,
    duracao_minutos: 120, // 2h fixas
    ativo: true
  },
  {
    id: 'proc-4',
    nome: 'Limpeza de Pele Profunda',
    descricao: 'Higienização profunda, extração e hidratação calmante.',
    preco_padrao: 450.00,
    duracao_minutos: 120, // 2h fixas
    ativo: true
  },
  {
    id: 'proc-5',
    nome: 'Protocolo Rejuvenescimento Facial',
    descricao: 'Protocolo avançado de cuidados faciais e estímulo dérmico.',
    preco_padrao: 1600.00,
    duracao_minutos: 120, // 2h fixas
    ativo: true
  }
];

const atendimentosSeed: Atendimento[] = [
  {
    id: 'atend-1',
    cliente_id: 'cli-1',
    procedimento_id: 'proc-1',
    profissional: 'Dra. Márcia Cristina',
    data_hora: '2026-08-10T14:00:00Z',
    valor_cobrado: 1800.00,
    forma_pagamento: 'pix',
    status_pagamento: 'pago',
    observacoes_sessao: 'Atendimento de exemplo realizado com sucesso.',
    fotos_urls: [],
    criado_em: '2026-08-10T16:00:00Z'
  },
  {
    id: 'atend-2',
    cliente_id: 'cli-2',
    procedimento_id: 'proc-3',
    profissional: 'Dra. Márcia Cristina',
    data_hora: '2026-08-15T10:00:00Z',
    valor_cobrado: 2000.00,
    forma_pagamento: 'cartao_credito',
    status_pagamento: 'pago',
    observacoes_sessao: 'Atendimento de exemplo realizado com sucesso.',
    fotos_urls: [],
    criado_em: '2026-08-15T12:00:00Z'
  }
];

const agendamentosSeed: Agendamento[] = [
  {
    id: 'agend-1',
    cliente_id: 'cli-1',
    procedimento_id: 'proc-2',
    data_hora_inicio: '2026-08-26T16:00:00Z',
    data_hora_fim: '2026-08-26T18:00:00Z',
    status: 'agendado',
    profissional: 'Dra. Márcia Cristina',
    observacoes: 'Agendamento de exemplo.',
    criado_em: '2026-08-20T10:00:00Z'
  },
  {
    id: 'agend-2',
    cliente_id: 'cli-2',
    procedimento_id: 'proc-1',
    data_hora_inicio: '2026-08-27T09:00:00Z',
    data_hora_fim: '2026-08-27T11:00:00Z',
    status: 'agendado',
    profissional: 'Dra. Márcia Cristina',
    observacoes: 'Agendamento de exemplo.',
    criado_em: '2026-08-22T14:00:00Z'
  },
  {
    id: 'agend-3',
    cliente_id: 'cli-3',
    procedimento_id: 'proc-4',
    data_hora_inicio: '2026-08-25T14:00:00Z',
    data_hora_fim: '2026-08-25T16:00:00Z',
    status: 'cancelado',
    profissional: 'Dra. Márcia Cristina',
    observacoes: 'Cancelado pelo cliente fora do prazo de 48h.',
    criado_em: '2026-08-18T11:00:00Z'
  }
];

const cancelamentosSeed: Cancelamento[] = [
  {
    id: 'canc-1',
    agendamento_id: 'agend-3',
    cliente_id: 'cli-3',
    motivo: 'Exemplo de motivo de cancelamento informado pelo cliente.',
    data_solicitacao: '2026-08-25T10:00:00Z',
    dentro_do_prazo: false // Cancelamento tardio (< 48h)
  }
];

const leadsSeed: Lead[] = [];

const faqSeed: FAQ[] = [
  {
    id: 'faq-1',
    pergunta: 'Quais são os horários de funcionamento da clínica?',
    resposta: 'Atendemos de Segunda a Sexta das 09h às 18h e aos Sábados das 09h às 14h, sempre com agendamento prévio.',
    categoria: 'horarios',
    ativo: true
  },
  {
    id: 'faq-2',
    pergunta: 'Quais formas de pagamento são aceitas?',
    resposta: 'Aceitamos Pix, cartões de crédito, débito e dinheiro.',
    categoria: 'pagamentos',
    ativo: true
  },
  {
    id: 'faq-3',
    pergunta: 'Qual a política de cancelamento ou reagendamento?',
    resposta: 'Cancelamentos ou reagendamentos devem ser comunicados com antecedência mínima de 48 horas.',
    categoria: 'cancelamentos',
    ativo: true
  }
];

const configuracoesHorarioSeed: ConfiguracaoHorario[] = [
  { id: 'hor-0', dia_semana: 0, nome_dia: 'Domingo', hora_inicio: '00:00', hora_fim: '00:00', ativo: false },
  { id: 'hor-1', dia_semana: 1, nome_dia: 'Segunda-feira', hora_inicio: '09:00', hora_fim: '18:00', ativo: true },
  { id: 'hor-2', dia_semana: 2, nome_dia: 'Terça-feira', hora_inicio: '09:00', hora_fim: '18:00', ativo: true },
  { id: 'hor-3', dia_semana: 3, nome_dia: 'Quarta-feira', hora_inicio: '09:00', hora_fim: '18:00', ativo: true },
  { id: 'hor-4', dia_semana: 4, nome_dia: 'Quinta-feira', hora_inicio: '09:00', hora_fim: '18:00', ativo: true },
  { id: 'hor-5', dia_semana: 5, nome_dia: 'Sexta-feira', hora_inicio: '09:00', hora_fim: '18:00', ativo: true },
  { id: 'hor-6', dia_semana: 6, nome_dia: 'Sábado', hora_inicio: '09:00', hora_fim: '14:00', ativo: true }
];

const bloqueiosDataSeed: BloqueioData[] = [
  { id: 'bloq-1', data: '2026-09-07', motivo: 'Feriado Nacional - Independência do Brasil', dia_inteiro: true },
  { id: 'bloq-2', data: '2026-10-12', motivo: 'Feriado Nacional - N. Sra. Aparecida', dia_inteiro: true }
];

// Notificações começam vazias conforme Item 3 (sem notificações fictícias)
const notificacoesSeed: Notificacao[] = [];

// ============================================================================
// IMPLEMENTAÇÕES CONCRETAS DOS REPOSITÓRIOS
// ============================================================================

export class InMemoryUsuarioRepository implements IUsuarioRepository {
  private usuarios: Usuario[] = [...usuariosSeed];

  async buscarPorId(id: string): Promise<Usuario | null> {
    // TODO: [DB TEAM] SELECT * FROM usuarios WHERE id = $1
    return this.usuarios.find(u => u.id === id) || null;
  }

  async buscarPorEmail(email: string): Promise<Usuario | null> {
    // TODO: [DB TEAM] SELECT * FROM usuarios WHERE email = $1
    return this.usuarios.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  async buscarPorGoogleId(googleId: string): Promise<Usuario | null> {
    // TODO: [DB TEAM] SELECT * FROM usuarios WHERE google_id = $1
    return this.usuarios.find(u => u.google_id === googleId) || null;
  }

  async listar(): Promise<Usuario[]> {
    // TODO: [DB TEAM] SELECT * FROM usuarios ORDER BY nome ASC
    return [...this.usuarios];
  }

  async salvar(usuario: Usuario): Promise<Usuario> {
    // TODO: [DB TEAM] INSERT INTO usuarios (id, nome, email, role, google_id, ativo) VALUES ($1, $2, $3, $4, $5, $6)
    this.usuarios.push(usuario);
    return usuario;
  }

  async atualizar(id: string, dados: Partial<Usuario>): Promise<Usuario | null> {
    // TODO: [DB TEAM] UPDATE usuarios SET ... WHERE id = $1
    const index = this.usuarios.findIndex(u => u.id === id);
    if (index === -1) return null;
    this.usuarios[index] = { ...this.usuarios[index], ...dados };
    return this.usuarios[index];
  }

  async remover(id: string): Promise<boolean> {
    // TODO: [DB TEAM] DELETE FROM usuarios WHERE id = $1
    const index = this.usuarios.findIndex(u => u.id === id);
    if (index === -1) return false;
    this.usuarios.splice(index, 1);
    return true;
  }
}

export class InMemoryClienteRepository implements IClienteRepository {
  private clientes: Cliente[] = [...clientesSeed];

  async buscarPorId(id: string): Promise<Cliente | null> {
    // TODO: [DB TEAM] SELECT * FROM clientes WHERE id = $1
    return this.clientes.find(c => c.id === id) || null;
  }

  async buscarPorEmailOuTelefone(email?: string, telefone?: string): Promise<Cliente | null> {
    // TODO: [DB TEAM] SELECT * FROM clientes WHERE email = $1 OR telefone = $2
    return this.clientes.find(c => (email && c.email === email) || (telefone && c.telefone === telefone)) || null;
  }

  async listar(filtroBusca?: string): Promise<Cliente[]> {
    // TODO: [DB TEAM] SELECT * FROM clientes WHERE nome ILIKE $1 OR telefone ILIKE $1 OR email ILIKE $1
    if (!filtroBusca) return [...this.clientes];
    const termo = filtroBusca.toLowerCase();
    return this.clientes.filter(
      c => c.nome.toLowerCase().includes(termo) ||
           c.telefone.includes(termo) ||
           c.email.toLowerCase().includes(termo)
    );
  }

  async salvar(cliente: Cliente): Promise<Cliente> {
    // TODO: [DB TEAM] INSERT INTO clientes (...) VALUES (...)
    this.clientes.push(cliente);
    return cliente;
  }

  async atualizar(id: string, dados: Partial<Cliente>): Promise<Cliente | null> {
    // TODO: [DB TEAM] UPDATE clientes SET ... WHERE id = $1
    const index = this.clientes.findIndex(c => c.id === id);
    if (index === -1) return null;
    this.clientes[index] = { ...this.clientes[index], ...dados, atualizado_em: new Date().toISOString() };
    return this.clientes[index];
  }

  async remover(id: string): Promise<boolean> {
    // TODO: [DB TEAM] LGPD DELETE: Deletar em cascata ou anonimizar todos os dados pessoais do cliente
    // DELETE FROM clientes WHERE id = $1
    const index = this.clientes.findIndex(c => c.id === id);
    if (index === -1) return false;
    this.clientes.splice(index, 1);
    return true;
  }

  async buscarInativosHaMaisDe5Anos(): Promise<Cliente[]> {
    // TODO: [DB TEAM] Consulta para job de retenção LGPD:
    // SELECT c.* FROM clientes c
    // LEFT JOIN atendimentos a ON a.cliente_id = c.id
    // GROUP BY c.id
    // HAVING MAX(a.data_hora) < NOW() - INTERVAL '5 years' OR (MAX(a.data_hora) IS NULL AND c.criado_em < NOW() - INTERVAL '5 years')
    const cincoAnosAtras = new Date();
    cincoAnosAtras.setFullYear(cincoAnosAtras.getFullYear() - 5);
    return this.clientes.filter(c => new Date(c.atualizado_em) < cincoAnosAtras);
  }
}

export class InMemoryAnamneseRepository implements IAnamneseRepository {
  private anamneses: Anamnese[] = [...anamnesesSeed];

  async buscarPorClienteId(clienteId: string): Promise<Anamnese | null> {
    // ========================================================================
    // TODO: [DB TEAM / SEGURANÇA] SELECT * FROM anamneses WHERE cliente_id = $1
    // CRIPTOGRAFIA EM REPOUSO OBRIGATÓRIA: Aplicar criptografia de coluna
    // (ex: AES-256 / pgcrypto) para os dados sensíveis de saúde da Anamnese
    // (alergias, medicamentos, cirurgias, contraindicações), conforme
    // exigências do Art. 11 e Art. 46 da LGPD.
    // ========================================================================
    return this.anamneses.find(a => a.cliente_id === clienteId) || null;
  }

  async salvarOuAtualizar(anamnese: Anamnese): Promise<Anamnese> {
    // ========================================================================
    // TODO: [DB TEAM / SEGURANÇA] INSERT INTO anamneses (...) VALUES (...)
    // ON CONFLICT (cliente_id) DO UPDATE SET ...
    // Garantir encriptação prévia dos campos sensíveis antes da persistência.
    // ========================================================================
    const index = this.anamneses.findIndex(a => a.cliente_id === anamnese.cliente_id);
    if (index >= 0) {
      this.anamneses[index] = { ...anamnese, atualizado_em: new Date().toISOString() };
      return this.anamneses[index];
    }
    this.anamneses.push(anamnese);
    return anamnese;
  }

  async removerPorClienteId(clienteId: string): Promise<boolean> {
    // TODO: [DB TEAM] DELETE FROM anamneses WHERE cliente_id = $1 (LGPD Exclusão)
    const index = this.anamneses.findIndex(a => a.cliente_id === clienteId);
    if (index === -1) return false;
    this.anamneses.splice(index, 1);
    return true;
  }
}

export class InMemoryProcedimentoRepository implements IProcedimentoRepository {
  private procedimentos: Procedimento[] = [...procedimentosSeed];

  async buscarPorId(id: string): Promise<Procedimento | null> {
    // TODO: [DB TEAM] SELECT * FROM procedimentos WHERE id = $1
    return this.procedimentos.find(p => p.id === id) || null;
  }

  async listar(apenasAtivos = true): Promise<Procedimento[]> {
    // TODO: [DB TEAM] SELECT * FROM procedimentos WHERE ($1 = false OR ativo = true) ORDER BY nome ASC
    if (!apenasAtivos) return [...this.procedimentos];
    return this.procedimentos.filter(p => p.ativo);
  }

  async salvar(procedimento: Procedimento): Promise<Procedimento> {
    // TODO: [DB TEAM] INSERT INTO procedimentos (...) VALUES (...)
    this.procedimentos.push(procedimento);
    return procedimento;
  }

  async atualizar(id: string, dados: Partial<Procedimento>): Promise<Procedimento | null> {
    // TODO: [DB TEAM] UPDATE procedimentos SET ... WHERE id = $1
    const index = this.procedimentos.findIndex(p => p.id === id);
    if (index === -1) return null;
    this.procedimentos[index] = { ...this.procedimentos[index], ...dados };
    return this.procedimentos[index];
  }

  async remover(id: string): Promise<boolean> {
    // TODO: [DB TEAM] UPDATE procedimentos SET ativo = false WHERE id = $1 (soft delete)
    const index = this.procedimentos.findIndex(p => p.id === id);
    if (index === -1) return false;
    this.procedimentos.splice(index, 1);
    return true;
  }
}

export class InMemoryAtendimentoRepository implements IAtendimentoRepository {
  private atendimentos: Atendimento[] = [...atendimentosSeed];

  async buscarPorId(id: string): Promise<Atendimento | null> {
    // TODO: [DB TEAM] SELECT * FROM atendimentos WHERE id = $1
    return this.atendimentos.find(a => a.id === id) || null;
  }

  async listarPorCliente(clienteId: string): Promise<Atendimento[]> {
    // TODO: [DB TEAM] SELECT * FROM atendimentos WHERE cliente_id = $1 ORDER BY data_hora DESC
    return this.atendimentos
      .filter(a => a.cliente_id === clienteId)
      .sort((a, b) => new Date(b.data_hora).getTime() - new Date(a.data_hora).getTime());
  }

  async listarPorPeriodo(dataInicio: string, dataFim: string): Promise<Atendimento[]> {
    // TODO: [DB TEAM] SELECT * FROM atendimentos WHERE data_hora BETWEEN $1 AND $2 ORDER BY data_hora ASC
    const inicio = new Date(dataInicio).getTime();
    const fim = new Date(dataFim).getTime();
    return this.atendimentos.filter(a => {
      const dt = new Date(a.data_hora).getTime();
      return dt >= inicio && dt <= fim;
    });
  }

  async salvar(atendimento: Atendimento): Promise<Atendimento> {
    // TODO: [DB TEAM] INSERT INTO atendimentos (...) VALUES (...)
    this.atendimentos.push(atendimento);
    return atendimento;
  }

  async atualizar(id: string, dados: Partial<Atendimento>): Promise<Atendimento | null> {
    // TODO: [DB TEAM] UPDATE atendimentos SET ... WHERE id = $1
    const index = this.atendimentos.findIndex(a => a.id === id);
    if (index === -1) return null;
    this.atendimentos[index] = { ...this.atendimentos[index], ...dados };
    return this.atendimentos[index];
  }

  async removerPorClienteId(clienteId: string): Promise<boolean> {
    // TODO: [DB TEAM] DELETE FROM atendimentos WHERE cliente_id = $1 (LGPD)
    this.atendimentos = this.atendimentos.filter(a => a.cliente_id !== clienteId);
    return true;
  }
}

export class InMemoryAgendamentoRepository implements IAgendamentoRepository {
  private agendamentos: Agendamento[] = [...agendamentosSeed];

  async buscarPorId(id: string): Promise<Agendamento | null> {
    // TODO: [DB TEAM] SELECT * FROM agendamentos WHERE id = $1
    return this.agendamentos.find(a => a.id === id) || null;
  }

  async listar(dataInicio?: string, dataFim?: string): Promise<Agendamento[]> {
    // TODO: [DB TEAM] SELECT * FROM agendamentos WHERE data_hora_inicio BETWEEN $1 AND $2 ORDER BY data_hora_inicio ASC
    if (!dataInicio && !dataFim) return [...this.agendamentos];
    const inicio = dataInicio ? new Date(dataInicio).getTime() : 0;
    const fim = dataFim ? new Date(dataFim).getTime() : Infinity;
    return this.agendamentos.filter(a => {
      const dt = new Date(a.data_hora_inicio).getTime();
      return dt >= inicio && dt <= fim;
    });
  }

  async listarPorCliente(clienteId: string): Promise<Agendamento[]> {
    // TODO: [DB TEAM] SELECT * FROM agendamentos WHERE cliente_id = $1 ORDER BY data_hora_inicio DESC
    return this.agendamentos.filter(a => a.cliente_id === clienteId);
  }

  async buscarPorDataHora(dataHoraInicio: string): Promise<Agendamento | null> {
    // TODO: [DB TEAM] SELECT * FROM agendamentos WHERE data_hora_inicio = $1 AND status != 'cancelado'
    return this.agendamentos.find(
      a => a.data_hora_inicio === dataHoraInicio && a.status !== 'cancelado'
    ) || null;
  }

  async salvar(agendamento: Agendamento): Promise<Agendamento> {
    // TODO: [DB TEAM] INSERT INTO agendamentos (...) VALUES (...)
    this.agendamentos.push(agendamento);
    return agendamento;
  }

  async atualizar(id: string, dados: Partial<Agendamento>): Promise<Agendamento | null> {
    // TODO: [DB TEAM] UPDATE agendamentos SET ... WHERE id = $1
    const index = this.agendamentos.findIndex(a => a.id === id);
    if (index === -1) return null;
    this.agendamentos[index] = { ...this.agendamentos[index], ...dados };
    return this.agendamentos[index];
  }

  async remover(id: string): Promise<boolean> {
    // TODO: [DB TEAM] DELETE FROM agendamentos WHERE id = $1
    const index = this.agendamentos.findIndex(a => a.id === id);
    if (index === -1) return false;
    this.agendamentos.splice(index, 1);
    return true;
  }
}

export class InMemoryCancelamentoRepository implements ICancelamentoRepository {
  private cancelamentos: Cancelamento[] = [...cancelamentosSeed];

  async buscarPorId(id: string): Promise<Cancelamento | null> {
    // TODO: [DB TEAM] SELECT * FROM cancelamentos WHERE id = $1
    return this.cancelamentos.find(c => c.id === id) || null;
  }

  async listarPorCliente(clienteId: string): Promise<Cancelamento[]> {
    // TODO: [DB TEAM] SELECT * FROM cancelamentos WHERE cliente_id = $1 ORDER BY data_solicitacao DESC
    return this.cancelamentos.filter(c => c.cliente_id === clienteId);
  }

  async listarRecentes(limite = 10): Promise<Cancelamento[]> {
    // TODO: [DB TEAM] SELECT * FROM cancelamentos ORDER BY data_solicitacao DESC LIMIT $1
    return [...this.cancelamentos]
      .sort((a, b) => new Date(b.data_solicitacao).getTime() - new Date(a.data_solicitacao).getTime())
      .slice(0, limite);
  }

  async contarTardiosUltimos6Meses(clienteId: string): Promise<number> {
    // TODO: [DB TEAM] SELECT COUNT(*) FROM cancelamentos WHERE cliente_id = $1 AND dentro_do_prazo = false AND data_solicitacao >= NOW() - INTERVAL '6 months'
    const seisMesesAtras = new Date();
    seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 6);

    return this.cancelamentos.filter(c => {
      const dt = new Date(c.data_solicitacao);
      return c.cliente_id === clienteId && !c.dentro_do_prazo && dt >= seisMesesAtras;
    }).length;
  }

  async salvar(cancelamento: Cancelamento): Promise<Cancelamento> {
    // TODO: [DB TEAM] INSERT INTO cancelamentos (...) VALUES (...)
    this.cancelamentos.push(cancelamento);
    return cancelamento;
  }
}

export class InMemoryLeadRepository implements ILeadRepository {
  private leads: Lead[] = [...leadsSeed];

  async buscarPorId(id: string): Promise<Lead | null> {
    // TODO: [DB TEAM] SELECT * FROM leads WHERE id = $1
    return this.leads.find(l => l.id === id) || null;
  }

  async listar(data?: string): Promise<Lead[]> {
    // TODO: [DB TEAM] SELECT * FROM leads WHERE ($1 IS NULL OR DATE(data_recebimento) = $1) ORDER BY data_recebimento DESC
    if (!data) {
      return [...this.leads].sort(
        (a, b) => new Date(b.data_recebimento).getTime() - new Date(a.data_recebimento).getTime()
      );
    }
    return this.leads.filter(l => l.data_recebimento.startsWith(data));
  }

  async salvar(lead: Lead): Promise<Lead> {
    // TODO: [DB TEAM] INSERT INTO leads (...) VALUES (...)
    this.leads.unshift(lead);
    return lead;
  }
}

export class InMemoryFAQRepository implements IFAQRepository {
  private faqs: FAQ[] = [...faqSeed];

  async buscarPorId(id: string): Promise<FAQ | null> {
    // TODO: [DB TEAM] SELECT * FROM faqs WHERE id = $1
    return this.faqs.find(f => f.id === id) || null;
  }

  async listar(categoria?: string): Promise<FAQ[]> {
    // TODO: [DB TEAM] SELECT * FROM faqs WHERE ($1 IS NULL OR categoria = $1) AND ativo = true
    if (!categoria) return [...this.faqs];
    return this.faqs.filter(f => f.categoria === categoria);
  }

  async salvar(faq: FAQ): Promise<FAQ> {
    // TODO: [DB TEAM] INSERT INTO faqs (...) VALUES (...)
    this.faqs.push(faq);
    return faq;
  }

  async atualizar(id: string, dados: Partial<FAQ>): Promise<FAQ | null> {
    // TODO: [DB TEAM] UPDATE faqs SET ... WHERE id = $1
    const index = this.faqs.findIndex(f => f.id === id);
    if (index === -1) return null;
    this.faqs[index] = { ...this.faqs[index], ...dados };
    return this.faqs[index];
  }

  async remover(id: string): Promise<boolean> {
    // TODO: [DB TEAM] DELETE FROM faqs WHERE id = $1
    const index = this.faqs.findIndex(f => f.id === id);
    if (index === -1) return false;
    this.faqs.splice(index, 1);
    return true;
  }
}

export class InMemoryConfiguracaoRepository implements IConfiguracaoRepository {
  private horarios: ConfiguracaoHorario[] = [...configuracoesHorarioSeed];
  private bloqueios: BloqueioData[] = [...bloqueiosDataSeed];

  async listarHorarios(): Promise<ConfiguracaoHorario[]> {
    // TODO: [DB TEAM] SELECT * FROM configuracoes_horarios ORDER BY dia_semana ASC
    return [...this.horarios];
  }

  async obterHorarioPorDia(diaSemana: number): Promise<ConfiguracaoHorario | null> {
    // TODO: [DB TEAM] SELECT * FROM configuracoes_horarios WHERE dia_semana = $1
    return this.horarios.find(h => h.dia_semana === diaSemana) || null;
  }

  async salvarHorarios(horarios: ConfiguracaoHorario[]): Promise<ConfiguracaoHorario[]> {
    // TODO: [DB TEAM] UPSERT em configuracoes_horarios
    this.horarios = [...horarios];
    return this.horarios;
  }

  async listarBloqueios(): Promise<BloqueioData[]> {
    // TODO: [DB TEAM] SELECT * FROM bloqueios_datas ORDER BY data ASC
    return [...this.bloqueios];
  }

  async salvarBloqueio(bloqueio: BloqueioData): Promise<BloqueioData> {
    // TODO: [DB TEAM] INSERT INTO bloqueios_datas (...) VALUES (...)
    this.bloqueios.push(bloqueio);
    return bloqueio;
  }

  async removerBloqueio(id: string): Promise<boolean> {
    // TODO: [DB TEAM] DELETE FROM bloqueios_datas WHERE id = $1
    const index = this.bloqueios.findIndex(b => b.id === id);
    if (index === -1) return false;
    this.bloqueios.splice(index, 1);
    return true;
  }
}

export class InMemoryNotificacaoRepository implements INotificacaoRepository {
  private notificacoes: Notificacao[] = [...notificacoesSeed];

  async listar(apenasNaoLidas = false): Promise<Notificacao[]> {
    // TODO: [DB TEAM] SELECT * FROM notificacoes WHERE ($1 = false OR lida = false) ORDER BY data_hora DESC
    if (!apenasNaoLidas) {
      return [...this.notificacoes].sort(
        (a, b) => new Date(b.data_hora).getTime() - new Date(a.data_hora).getTime()
      );
    }
    return this.notificacoes.filter(n => !n.lida);
  }

  async salvar(notificacao: Notificacao): Promise<Notificacao> {
    // TODO: [DB TEAM] INSERT INTO notificacoes (...) VALUES (...)
    this.notificacoes.unshift(notificacao);
    return notificacao;
  }

  async marcarComoLida(id: string): Promise<boolean> {
    // TODO: [DB TEAM] UPDATE notificacoes SET lida = true WHERE id = $1
    const notif = this.notificacoes.find(n => n.id === id);
    if (!notif) return false;
    notif.lida = true;
    return true;
  }

  async marcarTodasComoLidas(): Promise<boolean> {
    // TODO: [DB TEAM] UPDATE notificacoes SET lida = true
    this.notificacoes.forEach(n => (n.lida = true));
    return true;
  }
}

const solicitacoesLGPDSeed: SolicitacaoLGPD[] = [
  {
    id: 'solic-lgpd-1',
    cliente_id: 'cli-2',
    cliente_nome: 'Juliana Costa Martins',
    cliente_telefone: '(11) 99123-8877',
    tipo: 'exportacao',
    status: 'pendente',
    motivo: 'Solicitação de cópia completa do histórico e anamnese para consulta médica externa.',
    solicitado_por: 'Camila Santos (Recepção)',
    data_solicitacao: '2026-08-27T11:30:00Z'
  }
];

export class InMemorySolicitacaoLGPDRepository implements ISolicitacaoLGPDRepository {
  private solicitacoes: SolicitacaoLGPD[] = [...solicitacoesLGPDSeed];

  async listar(status?: StatusSolicitacaoLGPD): Promise<SolicitacaoLGPD[]> {
    // ========================================================================
    // TODO: [DB TEAM] SELECT * FROM solicitacoes_lgpd WHERE ($1 IS NULL OR status = $1) ORDER BY data_solicitacao DESC
    // ========================================================================
    if (status) {
      return this.solicitacoes.filter(s => s.status === status);
    }
    return [...this.solicitacoes].sort(
      (a, b) => new Date(b.data_solicitacao).getTime() - new Date(a.data_solicitacao).getTime()
    );
  }

  async buscarPorId(id: string): Promise<SolicitacaoLGPD | null> {
    // ========================================================================
    // TODO: [DB TEAM] SELECT * FROM solicitacoes_lgpd WHERE id = $1
    // ========================================================================
    return this.solicitacoes.find(s => s.id === id) || null;
  }

  async salvar(solicitacao: SolicitacaoLGPD): Promise<SolicitacaoLGPD> {
    // ========================================================================
    // TODO: [DB TEAM] INSERT INTO solicitacoes_lgpd (id, cliente_id, cliente_nome, cliente_telefone, tipo, status, motivo, solicitado_por, data_solicitacao) VALUES (...)
    // ========================================================================
    this.solicitacoes.unshift(solicitacao);
    return solicitacao;
  }

  async atualizar(id: string, dados: Partial<SolicitacaoLGPD>): Promise<SolicitacaoLGPD | null> {
    // ========================================================================
    // TODO: [DB TEAM] UPDATE solicitacoes_lgpd SET ... WHERE id = $1
    // ========================================================================
    const index = this.solicitacoes.findIndex(s => s.id === id);
    if (index === -1) return null;
    this.solicitacoes[index] = { ...this.solicitacoes[index], ...dados };
    return this.solicitacoes[index];
  }
}
