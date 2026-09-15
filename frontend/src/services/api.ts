import type {
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
  RelatorioFinanceiro
} from '../types';

const API_BASE = '/api';

class ApiService {
  private getHeaders(): Record<string, string> {
    const token = localStorage.getItem('mc_auth_token') || 'token_admin';
    const userId = localStorage.getItem('mc_user_id') || 'user-admin-1';
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'x-user-id': userId
    };
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...(options.headers || {})
        }
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ erro: 'Erro na requisição' }));
        throw new Error(errorData.erro || `Erro HTTP ${res.status}`);
      }

      return res.json();
    } catch (err: any) {
      console.warn(`[API] Erro ao chamar ${endpoint}:`, err.message);
      throw err;
    }
  }

  // --- Auth ---
  async getMe(): Promise<{ usuario: Usuario }> {
    return this.request<{ usuario: Usuario }>('/auth/me');
  }

  async loginGoogle(role: 'admin' | 'recepcionista'): Promise<{ token: string; usuario: Usuario }> {
    return this.request<{ token: string; usuario: Usuario }>('/auth/login-google', {
      method: 'POST',
      body: JSON.stringify({ role })
    });
  }

  async alternarPerfil(role: 'admin' | 'recepcionista'): Promise<{ token: string; usuario: Usuario }> {
    return this.request<{ token: string; usuario: Usuario }>('/auth/alternar-perfil', {
      method: 'POST',
      body: JSON.stringify({ role })
    });
  }

  // --- Dashboard / Alertas ---
  async getAlertasProximos(): Promise<any[]> {
    return this.request<any[]>('/agenda/alertas-proximos');
  }

  async getCancelamentosTardios(): Promise<any[]> {
    return this.request<any[]>('/agenda/cancelamentos-tardios');
  }

  // --- Agenda ---
  async getAgendamentos(dataInicio?: string, dataFim?: string): Promise<Agendamento[]> {
    const params = new URLSearchParams();
    if (dataInicio) params.append('dataInicio', dataInicio);
    if (dataFim) params.append('dataFim', dataFim);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<Agendamento[]>(`/agenda${query}`);
  }

  async criarAgendamento(dados: {
    cliente_id: string;
    procedimento_id: string;
    data_hora_inicio: string;
    profissional?: string;
    observacoes?: string;
  }): Promise<Agendamento> {
    return this.request<Agendamento>('/agenda', {
      method: 'POST',
      body: JSON.stringify(dados)
    });
  }

  async cancelarAgendamento(id: string, motivo: string): Promise<{
    cancelamento: Cancelamento;
    dentroDoPrazo: boolean;
    reincidenciaTardios6Meses: number;
  }> {
    return this.request('/agenda/' + id + '/cancelar', {
      method: 'POST',
      body: JSON.stringify({ motivo })
    });
  }

  async getDisponibilidadeDia(data: string): Promise<any> {
    return this.request<any>(`/agenda/disponibilidade?data=${data}`);
  }

  // --- Clientes ---
  async getClientes(busca?: string): Promise<Cliente[]> {
    const query = busca ? `?busca=${encodeURIComponent(busca)}` : '';
    return this.request<Cliente[]>(`/clientes${query}`);
  }

  async getClienteFicha(id: string): Promise<{
    cliente: Cliente;
    anamnese: Anamnese | null;
    historicoAtendimentos: Atendimento[];
    cancelamentosTardios6Meses: number;
  }> {
    return this.request(`/clientes/${id}`);
  }

  async criarCliente(dados: {
    nome: string;
    cpf: string;
    telefone: string;
    email?: string;
    data_nascimento?: string;
  }): Promise<Cliente> {
    return this.request<Cliente>('/clientes', {
      method: 'POST',
      body: JSON.stringify(dados)
    });
  }

  async atualizarCliente(id: string, dados: Partial<Cliente>): Promise<Cliente> {
    return this.request<Cliente>(`/clientes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dados)
    });
  }

  async salvarAnamnese(clienteId: string, dados: Omit<Anamnese, 'id' | 'cliente_id' | 'atualizado_em'>): Promise<Anamnese> {
    return this.request<Anamnese>(`/clientes/${clienteId}/anamnese`, {
      method: 'POST',
      body: JSON.stringify(dados)
    });
  }

  async exportarDadosLGPD(clienteId: string): Promise<any> {
    return this.request(`/clientes/${clienteId}/lgpd-exportar`);
  }

  async excluirClienteLGPD(clienteId: string): Promise<{ sucesso: boolean; mensagem: string }> {
    return this.request(`/clientes/${clienteId}/lgpd-excluir`, {
      method: 'DELETE'
    });
  }

  async solicitarAcaoLGPD(clienteId: string, tipo: 'exportacao' | 'exclusao', motivo?: string): Promise<any> {
    return this.request(`/clientes/${clienteId}/lgpd-solicitar`, {
      method: 'POST',
      body: JSON.stringify({ tipo, motivo })
    });
  }

  async getSolicitacoesLGPD(status?: string): Promise<any[]> {
    const query = status ? `?status=${status}` : '';
    return this.request<any[]>(`/clientes/lgpd-solicitacoes${query}`);
  }

  // --- Leads WhatsApp ---
  async getLeads(data?: string): Promise<Lead[]> {
    const query = data ? `?data=${data}` : '';
    return this.request<Lead[]>(`/leads${query}`);
  }

  // Simulação de envio de lead pelo bot para testar webhook
  async simularEnvioLeadBot(lead: {
    nome: string;
    telefone: string;
    procedimento_interesse: string;
    orcamento_estimado: number;
  }): Promise<any> {
    return this.request('/bot/leads', {
      method: 'POST',
      headers: {
        'x-bot-service-token': 'mc_bot_secret_token_2026',
        'x-dev-bypass': 'true'
      },
      body: JSON.stringify(lead)
    });
  }

  // --- Procedimentos ---
  async getProcedimentos(todos = false): Promise<Procedimento[]> {
    const query = todos ? '?todos=true' : '';
    return this.request<Procedimento[]>(`/procedimentos${query}`);
  }

  async criarProcedimento(dados: { nome: string; descricao: string; preco_padrao: number }): Promise<Procedimento> {
    return this.request<Procedimento>('/procedimentos', {
      method: 'POST',
      body: JSON.stringify(dados)
    });
  }

  async atualizarProcedimento(id: string, dados: Partial<Procedimento>): Promise<Procedimento> {
    return this.request<Procedimento>(`/procedimentos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dados)
    });
  }

  async excluirProcedimento(id: string): Promise<any> {
    return this.request(`/procedimentos/${id}`, {
      method: 'DELETE'
    });
  }

  // --- FAQ ---
  async getFAQs(categoria?: string): Promise<FAQ[]> {
    const query = categoria ? `?categoria=${categoria}` : '';
    return this.request<FAQ[]>(`/faq${query}`);
  }

  async criarFAQ(dados: { pergunta: string; resposta: string; categoria?: string }): Promise<FAQ> {
    return this.request<FAQ>('/faq', {
      method: 'POST',
      body: JSON.stringify(dados)
    });
  }

  async atualizarFAQ(id: string, dados: Partial<FAQ>): Promise<FAQ> {
    return this.request<FAQ>(`/faq/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dados)
    });
  }

  async excluirFAQ(id: string): Promise<any> {
    return this.request(`/faq/${id}`, {
      method: 'DELETE'
    });
  }

  // --- Financeiro ---
  async getRelatorioFinanceiro(periodo: 'dia' | 'semana' | 'mes', data?: string): Promise<RelatorioFinanceiro> {
    const params = new URLSearchParams({ periodo });
    if (data) params.append('data', data);
    return this.request<RelatorioFinanceiro>(`/financeiro/relatorio?${params.toString()}`);
  }

  async getAtendimentosFinanceiro(dataInicio?: string, dataFim?: string): Promise<Atendimento[]> {
    const params = new URLSearchParams();
    if (dataInicio) params.append('dataInicio', dataInicio);
    if (dataFim) params.append('dataFim', dataFim);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<Atendimento[]>(`/financeiro/atendimentos${query}`);
  }

  async registrarPagamento(dados: any): Promise<Atendimento> {
    return this.request<Atendimento>('/financeiro/pagamento', {
      method: 'POST',
      body: JSON.stringify(dados)
    });
  }

  // --- Configurações ---
  async getHorarios(): Promise<ConfiguracaoHorario[]> {
    return this.request<ConfiguracaoHorario[]>('/configuracoes/horarios');
  }

  async salvarHorarios(horarios: ConfiguracaoHorario[]): Promise<ConfiguracaoHorario[]> {
    return this.request<ConfiguracaoHorario[]>('/configuracoes/horarios', {
      method: 'POST',
      body: JSON.stringify({ horarios })
    });
  }

  async getBloqueios(): Promise<BloqueioData[]> {
    return this.request<BloqueioData[]>('/configuracoes/bloqueios');
  }

  async criarBloqueio(dados: { data: string; motivo: string; dia_inteiro?: boolean }): Promise<BloqueioData> {
    return this.request<BloqueioData>('/configuracoes/bloqueios', {
      method: 'POST',
      body: JSON.stringify(dados)
    });
  }

  async excluirBloqueio(id: string): Promise<any> {
    return this.request(`/configuracoes/bloqueios/${id}`, {
      method: 'DELETE'
    });
  }

  async getUsuarios(): Promise<Usuario[]> {
    return this.request<Usuario[]>('/configuracoes/usuarios');
  }

  async criarUsuario(dados: { nome: string; email: string; role: 'admin' | 'recepcionista' }): Promise<Usuario> {
    return this.request<Usuario>('/configuracoes/usuarios', {
      method: 'POST',
      body: JSON.stringify(dados)
    });
  }

  async excluirUsuario(id: string): Promise<any> {
    return this.request(`/configuracoes/usuarios/${id}`, {
      method: 'DELETE'
    });
  }

  async getGoogleStatus(): Promise<any> {
    return this.request('/configuracoes/google-status');
  }

  // --- Notificações ---
  async getNotificacoes(apenasNaoLidas = false): Promise<Notificacao[]> {
    return this.request<Notificacao[]>(`/notificacoes?naoLidas=${apenasNaoLidas}`);
  }

  async marcarNotificacaoLida(id: string): Promise<any> {
    return this.request(`/notificacoes/${id}/lida`, { method: 'PUT' });
  }

  async marcarTodasNotificacoesLidas(): Promise<any> {
    return this.request('/notificacoes/marcar-todas-lidas', { method: 'PUT' });
  }

  // --- Consentimento Público LGPD ---
  async getTermoPublico(clienteId: string): Promise<any> {
    return this.request(`/consentimento/${clienteId}`);
  }

  async assinarTermoPublico(clienteId: string, assinaturaBase64: string): Promise<any> {
    return this.request(`/consentimento/${clienteId}/assinar`, {
      method: 'POST',
      body: JSON.stringify({ assinaturaBase64 })
    });
  }
}

export const api = new ApiService();
