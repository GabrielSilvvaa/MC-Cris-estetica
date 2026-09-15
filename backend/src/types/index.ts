export type UserRole = 'admin' | 'recepcionista';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  google_id?: string;
  ativo: boolean;
  avatar_url?: string;
}

export type StatusLGPDConsentimento = 'pendente' | 'assinado';

export type TipoSolicitacaoLGPD = 'exportacao' | 'exclusao';
export type StatusSolicitacaoLGPD = 'pendente' | 'concluida' | 'rejeitada';

export interface SolicitacaoLGPD {
  id: string;
  cliente_id: string;
  cliente_nome: string;
  cliente_telefone: string;
  tipo: TipoSolicitacaoLGPD;
  status: StatusSolicitacaoLGPD;
  motivo?: string;
  solicitado_por: string; // Nome da recepcionista ou admin
  data_solicitacao: string; // ISO 8601
  data_conclusao?: string;
  concluido_por?: string; // Dra. Márcia Cristina
}

export interface Cliente {
  id: string;
  nome: string;
  cpf: string; // Formato: 000.000.000-00 (Obrigatório e único)
  telefone: string;
  email: string;
  data_nascimento: string; // YYYY-MM-DD
  status_lgpd_consentimento: StatusLGPDConsentimento;
  data_consentimento?: string; // ISO 8601
  url_termo_assinado?: string; // URL / Google Drive ref
  assinatura_base64?: string;
  criado_em: string;
  atualizado_em: string;
}

export interface Anamnese {
  id: string;
  cliente_id: string;
  alergias: string;
  medicamentos: string;
  cirurgias_previas: string;
  gestante_lactante: boolean;
  contraindicacoes: string;
  observacoes: string;
  atualizado_em: string;
}

export interface Procedimento {
  id: string;
  nome: string;
  descricao: string;
  preco_padrao: number;
  duracao_minutos: number; // Sempre 120 (2 horas fixas)
  ativo: boolean;
}

export type StatusPagamento = 'pago' | 'pendente' | 'parcial';
export type FormaPagamento = 'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'transferencia' | 'outro';

export interface AtendimentoFoto {
  tipo: 'antes' | 'depois';
  url: string;
  descricao?: string;
  data_upload: string;
}

export interface Atendimento {
  id: string;
  cliente_id: string;
  procedimento_id: string;
  profissional: string;
  data_hora: string; // ISO 8601
  valor_cobrado: number;
  forma_pagamento: FormaPagamento;
  status_pagamento: StatusPagamento;
  observacoes_sessao: string;
  fotos_urls: AtendimentoFoto[];
  criado_em: string;
}

export type StatusAgendamento = 'agendado' | 'concluido' | 'cancelado';

export interface Agendamento {
  id: string;
  cliente_id: string;
  procedimento_id: string;
  atendimento_id?: string;
  google_event_id?: string;
  data_hora_inicio: string; // ISO 8601
  data_hora_fim: string; // ISO 8601 (sempre +2h)
  status: StatusAgendamento;
  profissional: string;
  observacoes?: string;
  criado_em: string;
}

export interface Cancelamento {
  id: string;
  agendamento_id: string;
  cliente_id: string;
  motivo: string;
  data_solicitacao: string; // ISO 8601
  dentro_do_prazo: boolean; // true se >= 48h antes do início
}

export interface Lead {
  id: string;
  nome: string;
  telefone: string;
  procedimento_interesse: string;
  orcamento_estimado: number;
  data_recebimento: string; // ISO 8601
}

export interface FAQ {
  id: string;
  pergunta: string;
  resposta: string;
  categoria: 'horarios' | 'pagamentos' | 'endereco' | 'cancelamentos' | 'procedimentos' | 'geral';
  ativo: boolean;
}

export interface ConfiguracaoHorario {
  id: string;
  dia_semana: number; // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  nome_dia: string;
  hora_inicio: string; // "09:00"
  hora_fim: string; // "18:00"
  ativo: boolean;
}

export interface BloqueioData {
  id: string;
  data: string; // YYYY-MM-DD
  motivo: string;
  dia_inteiro: boolean;
}

export type TipoNotificacao = 'lembrete_1h' | 'novo_lead' | 'cancelamento_tardio';

export interface Notificacao {
  id: string;
  tipo: TipoNotificacao;
  titulo: string;
  mensagem: string;
  data_hora: string; // ISO 8601
  lida: boolean;
  meta?: {
    cliente_id?: string;
    agendamento_id?: string;
    lead_id?: string;
  };
}

// DTOs para Relatórios Financeiros
export interface RelatorioFinanceiro {
  periodo: 'dia' | 'semana' | 'mes';
  data_inicio: string;
  data_fim: string;
  faturamento_total: number;
  total_atendimentos: number;
  total_pagos: number;
  total_pendentes: number;
  ticket_medio: number;
  detalhes_por_forma_pagamento: Record<FormaPagamento, number>;
}
