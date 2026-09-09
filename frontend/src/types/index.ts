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
  telefone: string;
  email: string;
  data_nascimento: string; // YYYY-MM-DD
  status_lgpd_consentimento: StatusLGPDConsentimento;
  data_consentimento?: string; // ISO 8601
  url_termo_assinado?: string;
  assinatura_base64?: string;
  criado_em: string;
  atualizado_em: string;
  total_atendimentos?: number;
  cancelamentos_tardios_6_meses?: number;
  ultimo_atendimento?: string | null;
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
  duracao_minutos: number; // Sempre 120 (2 horas)
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
  data_hora: string;
  valor_cobrado: number;
  forma_pagamento: FormaPagamento;
  status_pagamento: StatusPagamento;
  observacoes_sessao: string;
  fotos_urls: AtendimentoFoto[];
  criado_em: string;
  cliente_nome?: string;
  cliente_telefone?: string;
  procedimento_nome?: string;
  preco_padrao_sugerido?: number;
}

export type StatusAgendamento = 'agendado' | 'concluido' | 'cancelado';

export interface Agendamento {
  id: string;
  cliente_id: string;
  procedimento_id: string;
  atendimento_id?: string;
  google_event_id?: string;
  data_hora_inicio: string;
  data_hora_fim: string;
  status: StatusAgendamento;
  profissional: string;
  observacoes?: string;
  criado_em: string;
  cliente_nome?: string;
  cliente_telefone?: string;
  procedimento_nome?: string;
}

export interface Cancelamento {
  id: string;
  agendamento_id: string;
  cliente_id: string;
  motivo: string;
  data_solicitacao: string;
  dentro_do_prazo: boolean;
  cliente_nome?: string;
  cliente_telefone?: string;
  reincidencia_6_meses?: number;
}

export interface Lead {
  id: string;
  nome: string;
  telefone: string;
  procedimento_interesse: string;
  orcamento_estimado: number;
  data_recebimento: string;
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
  dia_semana: number;
  nome_dia: string;
  hora_inicio: string;
  hora_fim: string;
  ativo: boolean;
}

export interface BloqueioData {
  id: string;
  data: string;
  motivo: string;
  dia_inteiro: boolean;
}

export type TipoNotificacao = 'lembrete_1h' | 'novo_lead' | 'cancelamento_tardio';

export interface Notificacao {
  id: string;
  tipo: TipoNotificacao;
  titulo: string;
  mensagem: string;
  data_hora: string;
  lida: boolean;
  meta?: {
    cliente_id?: string;
    agendamento_id?: string;
    lead_id?: string;
  };
}

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
