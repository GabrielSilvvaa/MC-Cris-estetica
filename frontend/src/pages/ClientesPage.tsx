import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Cliente, Anamnese, Atendimento, SolicitacaoLGPD } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  Calendar,
  AlertTriangle,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Download,
  Trash2,
  X,
  Sparkles,
  Send,
  Lock,
  RefreshCw,
  Copy,
  Check,
  Eye
} from 'lucide-react';

export const ClientesPage: React.FC = () => {
  const { isAdmin } = useAuth();

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [solicitacoesLGPD, setSolicitacoesLGPD] = useState<SolicitacaoLGPD[]>([]);
  const [termoBusca, setTermoBusca] = useState<string>('');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'pendente_lgpd' | 'com_cancelamento'>('todos');
  const [abaPrincipal, setAbaPrincipal] = useState<'clientes' | 'fila_lgpd'>('clientes');
  const [carregando, setCarregando] = useState<boolean>(true);

  // Cliente selecionado e Ficha Detalhada
  const [clienteSelecionadoId, setClienteSelecionadoId] = useState<string | null>(null);
  const [fichaCliente, setFichaCliente] = useState<{
    cliente: Cliente;
    anamnese: Anamnese | null;
    historicoAtendimentos: Atendimento[];
    cancelamentosTardios6Meses: number;
  } | null>(null);
  const [, setCarregandoFicha] = useState<boolean>(false);
  const [abaFicha, setAbaFicha] = useState<'dados' | 'anamnese' | 'historico' | 'lgpd'>('dados');

  // Modais
  const [modalNovoClienteAberto, setModalNovoClienteAberto] = useState<boolean>(false);
  const [modalSolicitarLGPDAberto, setModalSolicitarLGPDAberto] = useState<boolean>(false);
  const [modalVisualizarDossieAberto, setModalVisualizarDossieAberto] = useState<boolean>(false);
  const [modalFotoZoom, setModalFotoZoom] = useState<string | null>(null);

  // Dados para Dossiê Exportado
  const [dossieExportado, setDossieExportado] = useState<any>(null);

  // Formulário de Novo Cliente
  const [formNovoCliente, setFormNovoCliente] = useState({
    nome: '',
    telefone: '',
    email: '',
    data_nascimento: ''
  });

  // Formulário de Solicitação LGPD
  const [formSolicitacaoLGPD, setFormSolicitacaoLGPD] = useState<{
    tipo: 'exportacao' | 'exclusao';
    motivo: string;
  }>({
    tipo: 'exportacao',
    motivo: ''
  });

  // Formulário de Anamnese
  const [formAnamnese, setFormAnamnese] = useState<Omit<Anamnese, 'id' | 'cliente_id' | 'atualizado_em'>>({
    alergias: '',
    medicamentos: '',
    cirurgias_previas: '',
    gestante_lactante: false,
    contraindicacoes: '',
    observacoes: ''
  });

  const [salvando, setSalvando] = useState<boolean>(false);
  const [copiadoLink, setCopiadoLink] = useState<boolean>(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string>('');

  const carregarDados = async () => {
    try {
      setCarregando(true);
      const [listaClientes, listaSolicitacoes] = await Promise.all([
        api.getClientes(termoBusca),
        api.getSolicitacoesLGPD()
      ]);
      setClientes(listaClientes);
      setSolicitacoesLGPD(listaSolicitacoes);
    } catch (err) {
      console.error('Erro ao carregar clientes:', err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [termoBusca]);

  // Carrega ficha do cliente ao selecionar
  const abrirFichaCliente = async (clienteId: string) => {
    try {
      setClienteSelecionadoId(clienteId);
      setCarregandoFicha(true);
      const ficha = await api.getClienteFicha(clienteId);
      setFichaCliente(ficha);
      if (ficha.anamnese) {
        setFormAnamnese({
          alergias: ficha.anamnese.alergias || '',
          medicamentos: ficha.anamnese.medicamentos || '',
          cirurgias_previas: ficha.anamnese.cirurgias_previas || '',
          gestante_lactante: ficha.anamnese.gestante_lactante || false,
          contraindicacoes: ficha.anamnese.contraindicacoes || '',
          observacoes: ficha.anamnese.observacoes || ''
        });
      } else {
        setFormAnamnese({
          alergias: '',
          medicamentos: '',
          cirurgias_previas: '',
          gestante_lactante: false,
          contraindicacoes: '',
          observacoes: ''
        });
      }
      setAbaFicha('dados');
    } catch (err) {
      console.error('Erro ao carregar ficha do cliente:', err);
    } finally {
      setCarregandoFicha(false);
    }
  };

  const handleSalvarNovoCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNovoCliente.nome || !formNovoCliente.telefone) {
      alert('Nome e telefone são obrigatórios.');
      return;
    }

    try {
      setSalvando(true);
      const novo = await api.criarCliente(formNovoCliente);
      await carregarDados();
      setModalNovoClienteAberto(false);
      setFormNovoCliente({ nome: '', telefone: '', email: '', data_nascimento: '' });
      abrirFichaCliente(novo.id);
    } catch (err: any) {
      alert(err.message || 'Erro ao criar cliente.');
    } finally {
      setSalvando(false);
    }
  };

  const handleSalvarAnamnese = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteSelecionadoId) return;

    try {
      setSalvando(true);
      const anamneseSalva = await api.salvarAnamnese(clienteSelecionadoId, formAnamnese);
      if (fichaCliente) {
        setFichaCliente({ ...fichaCliente, anamnese: anamneseSalva });
      }
      setMensagemSucesso('Anamnese de saúde atualizada e protegida com sucesso.');
      setTimeout(() => setMensagemSucesso(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar anamnese.');
    } finally {
      setSalvando(false);
    }
  };

  const handleRegistrarSolicitacaoLGPD = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteSelecionadoId) return;

    try {
      setSalvando(true);
      const res = await api.solicitarAcaoLGPD(
        clienteSelecionadoId,
        formSolicitacaoLGPD.tipo,
        formSolicitacaoLGPD.motivo
      );
      setModalSolicitarLGPDAberto(false);
      setFormSolicitacaoLGPD({ tipo: 'exportacao', motivo: '' });
      await carregarDados();
      setMensagemSucesso(res.mensagem || 'Solicitação LGPD registrada com sucesso.');
      setTimeout(() => setMensagemSucesso(''), 5000);
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar solicitação LGPD.');
    } finally {
      setSalvando(false);
    }
  };

  const handleExportarDadosAdmin = async (clienteId: string) => {
    if (!isAdmin) {
      alert('Ação restrita à Dra. Márcia (Administradora). Registre uma solicitação na fila LGPD.');
      return;
    }

    try {
      setSalvando(true);
      const dados = await api.exportarDadosLGPD(clienteId);
      setDossieExportado(dados);
      setModalVisualizarDossieAberto(true);
      await carregarDados();
    } catch (err: any) {
      alert(err.message || 'Erro ao exportar dados.');
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluirClienteAdmin = async (clienteId: string) => {
    if (!isAdmin) {
      alert('Ação restrita à Dra. Márcia (Administradora).');
      return;
    }

    const confirmacao = window.confirm(
      '⚠️ ATENÇÃO: Esta ação é definitiva e irreversível conforme a LGPD.\n\nTodos os dados cadastrais, formulários de anamnese e referências clínicas da cliente serão excluídos do sistema.\n\nDeseja confirmar a exclusão permanente?'
    );

    if (!confirmacao) return;

    try {
      setSalvando(true);
      await api.excluirClienteLGPD(clienteId);
      setClienteSelecionadoId(null);
      setFichaCliente(null);
      await carregarDados();
      alert('Cliente excluído com sucesso conforme diretrizes da LGPD.');
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir cliente.');
    } finally {
      setSalvando(false);
    }
  };

  const copiarLinkTermo = (clienteId: string) => {
    const url = `${window.location.origin}/#termo=${clienteId}`;
    navigator.clipboard.writeText(url);
    setCopiadoLink(true);
    setTimeout(() => setCopiadoLink(false), 3000);
  };

  // Filtragem da lista
  const clientesFiltrados = clientes.filter(c => {
    if (filtroStatus === 'pendente_lgpd') return c.status_lgpd_consentimento === 'pendente';
    if (filtroStatus === 'com_cancelamento') return (c.cancelamentos_tardios_6_meses || 0) > 0;
    return true;
  });

  const totalSolicitacoesPendentes = solicitacoesLGPD.filter(s => s.status === 'pendente').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Topo / Barra de Navegação de Abas da Tela */}
      <div className="bg-white p-5 rounded-3xl border border-[#E8DFD5] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#FAF6F0] border border-[#E8DFD5] text-[#C4A883]">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#2D241E] font-serif">
              Gestão de Clientes & Conformidade LGPD
            </h2>
            <p className="text-xs text-[#7A6C60]">
              Fichas completas, anamneses de saúde, histórico de fotos e triagem de solicitações LGPD.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          {/* Alternador de Abas */}
          <div className="flex items-center bg-[#FAF6F0] p-1 rounded-2xl border border-[#E8DFD5]">
            <button
              onClick={() => setAbaPrincipal('clientes')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                abaPrincipal === 'clientes'
                  ? 'bg-white text-[#2D241E] shadow-2xs'
                  : 'text-[#7A6C60] hover:text-[#2D241E]'
              }`}
            >
              Clientes ({clientes.length})
            </button>
            <button
              onClick={() => setAbaPrincipal('fila_lgpd')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                abaPrincipal === 'fila_lgpd'
                  ? 'bg-white text-[#2D241E] shadow-2xs'
                  : 'text-[#7A6C60] hover:text-[#2D241E]'
              }`}
            >
              <span>Fila LGPD</span>
              {totalSolicitacoesPendentes > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] font-bold bg-[#C25953] text-white rounded-full">
                  {totalSolicitacoesPendentes}
                </span>
              )}
            </button>
          </div>

          <button
            onClick={() => setModalNovoClienteAberto(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#C4A883] hover:bg-[#B39670] text-white rounded-2xl text-xs font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Cliente</span>
          </button>
        </div>
      </div>

      {mensagemSucesso && (
        <div className="p-4 bg-[#F2F8F3] border border-[#C8E4CD] text-[#2E5E35] text-xs rounded-2xl flex items-center justify-between shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#3D7342]" />
            <span>{mensagemSucesso}</span>
          </div>
          <button onClick={() => setMensagemSucesso('')} className="p-1 hover:text-black">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 1: LISTAGEM DE CLIENTES & FICHA LATERAL                                */}
      {/* ========================================================================= */}
      {abaPrincipal === 'clientes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Coluna Esquerda: Listagem e Filtros (5 colunas se ficha aberta, 12 se fechada) */}
          <div className={`${clienteSelecionadoId ? 'lg:col-span-5' : 'lg:col-span-12'} space-y-4`}>
            {/* Barra de Busca e Filtros */}
            <div className="bg-white p-4 rounded-3xl border border-[#E8DFD5] shadow-xs flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-[#A68A64] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por nome, telefone ou e-mail..."
                  value={termoBusca}
                  onChange={e => setTermoBusca(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-[#FAF6F0] border border-[#E8DFD5] rounded-xl focus:bg-white focus:outline-none focus:border-[#C4A883]"
                />
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <select
                  value={filtroStatus}
                  onChange={e => setFiltroStatus(e.target.value as any)}
                  className="px-3 py-2 text-xs bg-[#FAF6F0] border border-[#E8DFD5] rounded-xl text-[#3D332A] focus:outline-none focus:border-[#C4A883] cursor-pointer"
                >
                  <option value="todos">Todos os Clientes</option>
                  <option value="pendente_lgpd">Termo LGPD Pendente</option>
                  <option value="com_cancelamento">Com Cancelamento Tardio</option>
                </select>
              </div>
            </div>

            {/* Lista de Clientes */}
            <div className="bg-white rounded-3xl p-4 border border-[#E8DFD5] shadow-xs space-y-2.5 max-h-[750px] overflow-y-auto">
              {carregando ? (
                <div className="py-16 text-center text-[#8C7D70]">
                  <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin text-[#C4A883]" />
                  <p className="text-xs">Carregando lista de clientes...</p>
                </div>
              ) : clientesFiltrados.length === 0 ? (
                <div className="py-16 text-center text-[#8C7D70]">
                  <Users className="w-10 h-10 mx-auto mb-2 text-[#C4A883]/60" />
                  <p className="text-sm font-semibold text-[#4A3F35]">Nenhum cliente encontrado.</p>
                  <p className="text-xs text-[#8C7D70] mt-0.5">Tente outro termo de busca ou cadastre uma nova cliente.</p>
                </div>
              ) : (
                clientesFiltrados.map(c => {
                  const isSelecionado = clienteSelecionadoId === c.id;
                  const temCancelamentoTardio = (c.cancelamentos_tardios_6_meses || 0) > 0;
                  const isLGPDAssinado = c.status_lgpd_consentimento === 'assinado';

                  return (
                    <div
                      key={c.id}
                      onClick={() => abrirFichaCliente(c.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                        isSelecionado
                          ? 'bg-[#FAF6F0] border-[#C4A883] shadow-xs ring-1 ring-[#C4A883]'
                          : 'bg-[#FCFAF7] border-[#E8DFD5] hover:border-[#C4A883] hover:bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-[#2D241E]">{c.nome}</h4>
                            {isLGPDAssinado ? (
                              <span
                                className="px-2 py-0.5 text-[10px] font-semibold bg-[#EBF5EC] text-[#3D7342] border border-[#D1EBD4] rounded-full flex items-center gap-1"
                                title="Termo de consentimento LGPD assinado"
                              >
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                LGPD OK
                              </span>
                            ) : (
                              <span
                                className="px-2 py-0.5 text-[10px] font-bold bg-[#FDF8F0] text-[#D9822B] border border-[#EADECF] rounded-full flex items-center gap-1"
                                title="Consentimento LGPD pendente de assinatura"
                              >
                                <Clock className="w-2.5 h-2.5" />
                                LGPD Pendente
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-[#7A6C60]">
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-[#A68A64]" />
                              {c.telefone}
                            </span>
                            {c.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3 text-[#A68A64]" />
                                {c.email}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Tag de Cancelamento Tardio com Contador de Reincidência */}
                        {temCancelamentoTardio && (
                          <div className="shrink-0 text-right">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-[#FCF4F4] text-[#C25953] border border-[#F2D6D6] rounded-lg">
                              <AlertTriangle className="w-3 h-3 text-[#C25953]" />
                              <span>{c.cancelamentos_tardios_6_meses}º tardio (6m)</span>
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-[#E8DFD5]/60 flex items-center justify-between text-[11px] text-[#8C7D70]">
                        <span>{c.total_atendimentos || 0} atendimento{(c.total_atendimentos || 0) !== 1 ? 's' : ''}</span>
                        <span className="text-[#C4A883] font-semibold flex items-center gap-1">
                          Ver Ficha Completa &rarr;
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Coluna Direita: Ficha Completa da Cliente */}
          {clienteSelecionadoId && fichaCliente && (
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-[#E8DFD5] shadow-md animate-in slide-in-from-right-4 duration-200 space-y-5 sticky top-20">
              {/* Cabeçalho da Ficha */}
              <div className="flex items-start justify-between pb-4 border-b border-[#F2ECE4]">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-xl font-bold text-[#2D241E] font-serif">
                      {fichaCliente.cliente.nome}
                    </h3>
                    {fichaCliente.cancelamentosTardios6Meses > 0 && (
                      <span className="px-2.5 py-0.5 text-xs font-bold bg-[#FCF4F4] text-[#C25953] border border-[#F2D6D6] rounded-full flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {fichaCliente.cancelamentosTardios6Meses}º Cancelamento Tardio (6 meses)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#7A6C60] mt-0.5">
                    Cadastrada em {new Date(fichaCliente.cliente.criado_em).toLocaleDateString('pt-BR')}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setClienteSelecionadoId(null);
                    setFichaCliente(null);
                  }}
                  className="p-1.5 rounded-full text-[#8C7D70] hover:text-[#2D241E] hover:bg-[#FAF6F0]"
                  title="Fechar ficha"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Abas da Ficha */}
              <div className="flex items-center gap-2 border-b border-[#F2ECE4] pb-2 overflow-x-auto">
                <button
                  onClick={() => setAbaFicha('dados')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                    abaFicha === 'dados'
                      ? 'bg-[#C4A883] text-white shadow-2xs'
                      : 'text-[#7A6C60] hover:bg-[#FAF6F0]'
                  }`}
                >
                  Dados Pessoais
                </button>
                <button
                  onClick={() => setAbaFicha('anamnese')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                    abaFicha === 'anamnese'
                      ? 'bg-[#C4A883] text-white shadow-2xs'
                      : 'text-[#7A6C60] hover:bg-[#FAF6F0]'
                  }`}
                >
                  Anamnese de Saúde
                </button>
                <button
                  onClick={() => setAbaFicha('historico')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                    abaFicha === 'historico'
                      ? 'bg-[#C4A883] text-white shadow-2xs'
                      : 'text-[#7A6C60] hover:bg-[#FAF6F0]'
                  }`}
                >
                  Procedimentos & Fotos ({fichaCliente.historicoAtendimentos.length})
                </button>
                <button
                  onClick={() => setAbaFicha('lgpd')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                    abaFicha === 'lgpd'
                      ? 'bg-[#C4A883] text-white shadow-2xs'
                      : 'text-[#7A6C60] hover:bg-[#FAF6F0]'
                  }`}
                >
                  Termo & LGPD
                </button>
              </div>

              {/* CONTEÚDO DA ABA: DADOS PESSOAIS */}
              {abaFicha === 'dados' && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="p-3.5 rounded-2xl bg-[#FAF6F0] border border-[#E8DFD5]">
                      <span className="text-[11px] text-[#8C7D70] block mb-0.5">Telefone / WhatsApp</span>
                      <span className="font-semibold text-[#2D241E] flex items-center gap-1.5 text-sm">
                        <Phone className="w-4 h-4 text-[#A68A64]" />
                        {fichaCliente.cliente.telefone}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[#FAF6F0] border border-[#E8DFD5]">
                      <span className="text-[11px] text-[#8C7D70] block mb-0.5">E-mail</span>
                      <span className="font-semibold text-[#2D241E] flex items-center gap-1.5 text-sm">
                        <Mail className="w-4 h-4 text-[#A68A64]" />
                        {fichaCliente.cliente.email || 'Não informado'}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[#FAF6F0] border border-[#E8DFD5]">
                      <span className="text-[11px] text-[#8C7D70] block mb-0.5">Data de Nascimento</span>
                      <span className="font-semibold text-[#2D241E] flex items-center gap-1.5 text-sm">
                        <Calendar className="w-4 h-4 text-[#A68A64]" />
                        {fichaCliente.cliente.data_nascimento
                          ? new Date(fichaCliente.cliente.data_nascimento + 'T00:00:00').toLocaleDateString('pt-BR')
                          : 'Não informada'}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[#FAF6F0] border border-[#E8DFD5]">
                      <span className="text-[11px] text-[#8C7D70] block mb-0.5">Status Consentimento LGPD</span>
                      <span className="font-semibold text-[#2D241E] flex items-center gap-1.5 text-sm">
                        <ShieldCheck className="w-4 h-4 text-[#3D7342]" />
                        {fichaCliente.cliente.status_lgpd_consentimento === 'assinado' ? 'Assinado' : 'Pendente'}
                      </span>
                    </div>
                  </div>

                  {/* Resumo de Cancelamentos Tardios */}
                  <div className="p-4 rounded-2xl bg-[#FCFAF7] border border-[#E8DFD5]">
                    <h4 className="font-bold text-sm text-[#2D241E] mb-1">
                      Histórico de Pontualidade (Regra 48h)
                    </h4>
                    <p className="text-[#7A6C60] leading-relaxed">
                      {fichaCliente.cancelamentosTardios6Meses === 0
                        ? 'A cliente cumpre a política de antecedência mínima de 48 horas para cancelamentos.'
                        : `A cliente possui ${fichaCliente.cancelamentosTardios6Meses} registro(s) de cancelamento realizado fora do prazo mínimo de 48 horas nos últimos 6 meses.`}
                    </p>
                  </div>
                </div>
              )}

              {/* CONTEÚDO DA ABA: ANAMNESE FIXA */}
              {abaFicha === 'anamnese' && (
                <form onSubmit={handleSalvarAnamnese} className="space-y-3.5 text-xs">
                  <div className="p-3 bg-[#FAF6F0] rounded-xl border border-[#EADECF] text-[#635345] flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#A68A64] shrink-0" />
                    <span>
                      Formulário padrão de saúde. Os dados de saúde são sensíveis e protegidos sob a LGPD com sigilo clínico.
                    </span>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#3D332A] mb-1">
                      Alergias (Medicamentosas, Cosméticos, Látex, etc.)
                    </label>
                    <textarea
                      rows={2}
                      value={formAnamnese.alergias}
                      onChange={e => setFormAnamnese({ ...formAnamnese, alergias: e.target.value })}
                      placeholder="Ex: Alergia a dipirona, esparadrapo..."
                      className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#E8DFD5] rounded-xl focus:bg-white focus:outline-none focus:border-[#C4A883]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#3D332A] mb-1">
                      Medicamentos em Uso Contínuo
                    </label>
                    <textarea
                      rows={2}
                      value={formAnamnese.medicamentos}
                      onChange={e => setFormAnamnese({ ...formAnamnese, medicamentos: e.target.value })}
                      placeholder="Ex: Anticoagulantes, anti-hipertensivos, Roacutan..."
                      className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#E8DFD5] rounded-xl focus:bg-white focus:outline-none focus:border-[#C4A883]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-[#3D332A] mb-1">
                        Cirurgias Prévias / Procedimentos Anteriores
                      </label>
                      <input
                        type="text"
                        value={formAnamnese.cirurgias_previas}
                        onChange={e => setFormAnamnese({ ...formAnamnese, cirurgias_previas: e.target.value })}
                        placeholder="Ex: Rinoplastia (2022), PMMA..."
                        className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#E8DFD5] rounded-xl focus:bg-white focus:outline-none focus:border-[#C4A883]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#3D332A] mb-1">
                        Gestante ou Lactante?
                      </label>
                      <select
                        value={formAnamnese.gestante_lactante ? 'true' : 'false'}
                        onChange={e => setFormAnamnese({ ...formAnamnese, gestante_lactante: e.target.value === 'true' })}
                        className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#E8DFD5] rounded-xl focus:bg-white focus:outline-none focus:border-[#C4A883]"
                      >
                        <option value="false">Não</option>
                        <option value="true">Sim (Contraindicação para determinados procedimentos)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#3D332A] mb-1">
                      Contraindicações e Cuidados Especiais
                    </label>
                    <input
                      type="text"
                      value={formAnamnese.contraindicacoes}
                      onChange={e => setFormAnamnese({ ...formAnamnese, contraindicacoes: e.target.value })}
                      placeholder="Ex: Doença autoimune ativa, queloide..."
                      className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#E8DFD5] rounded-xl focus:bg-white focus:outline-none focus:border-[#C4A883]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#3D332A] mb-1">
                      Observações Gerais de Saúde
                    </label>
                    <textarea
                      rows={2}
                      value={formAnamnese.observacoes}
                      onChange={e => setFormAnamnese({ ...formAnamnese, observacoes: e.target.value })}
                      placeholder="Histórico clínico relevante, tipo de pele, expectativas..."
                      className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#E8DFD5] rounded-xl focus:bg-white focus:outline-none focus:border-[#C4A883]"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={salvando}
                      className="px-5 py-2.5 bg-[#C4A883] hover:bg-[#B39670] text-white rounded-xl font-semibold shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {salvando ? 'Salvando...' : 'Salvar Alterações na Anamnese'}
                    </button>
                  </div>
                </form>
              )}

              {/* CONTEÚDO DA ABA: HISTÓRICO & FOTOS */}
              {abaFicha === 'historico' && (
                <div className="space-y-4 text-xs">
                  {fichaCliente.historicoAtendimentos.length === 0 ? (
                    <div className="py-12 text-center text-[#8C7D70]">
                      <Sparkles className="w-8 h-8 mx-auto mb-2 text-[#C4A883]/60" />
                      <p className="text-sm font-semibold text-[#4A3F35]">Nenhum procedimento registrado ainda.</p>
                      <p className="text-xs text-[#8C7D70]">Os registros de sessões e fotos aparecerão aqui.</p>
                    </div>
                  ) : (
                    fichaCliente.historicoAtendimentos.map(at => (
                      <div
                        key={at.id}
                        className="p-4 rounded-2xl bg-[#FCFAF7] border border-[#E8DFD5] space-y-3"
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-[#E8DFD5]/60">
                          <div>
                            <span className="font-bold text-sm text-[#2D241E]">
                              {new Date(at.data_hora).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </span>
                            <p className="text-[11px] text-[#7A6C60]">
                              Profissional: <strong className="text-[#4A3F35]">{at.profissional}</strong>
                            </p>
                          </div>
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#EADECF] text-[#5C4A38]">
                            R$ {at.valor_cobrado.toFixed(2)} ({at.status_pagamento.toUpperCase()})
                          </span>
                        </div>

                        {at.observacoes_sessao && (
                          <p className="text-[#5C4D40] leading-relaxed">
                            <strong className="text-[#3D332A]">Evolução clínica:</strong> {at.observacoes_sessao}
                          </p>
                        )}

                        {/* Galeria de Fotos Antes/Depois armazenadas no Google Drive */}
                        {at.fotos_urls && at.fotos_urls.length > 0 && (
                          <div>
                            <span className="text-[11px] font-bold text-[#A68A64] uppercase tracking-wider block mb-2">
                              Acompanhamento Fotográfico (Google Drive):
                            </span>
                            <div className="grid grid-cols-2 gap-3">
                              {at.fotos_urls.map((f, idx) => (
                                <div
                                  key={idx}
                                  onClick={() => setModalFotoZoom(f.url)}
                                  className="group relative rounded-xl overflow-hidden border border-[#E8DFD5] bg-white cursor-pointer"
                                >
                                  <img
                                    src={f.url}
                                    alt={f.descricao || f.tipo}
                                    className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-200"
                                  />
                                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                    <Eye className="w-5 h-5" />
                                  </div>
                                  <div className="p-1.5 bg-[#FAF6F0] flex items-center justify-between text-[10px] text-[#5C4D40]">
                                    <span className="font-bold uppercase text-[#8C6D4F]">
                                      {f.tipo === 'antes' ? '📸 Antes' : '✨ Depois'}
                                    </span>
                                    <span className="truncate max-w-[120px]">{f.descricao}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* CONTEÚDO DA ABA: TERMO & GESTÃO LGPD */}
              {abaFicha === 'lgpd' && (
                <div className="space-y-4 text-xs">
                  {/* Status do Termo */}
                  <div className="p-4 rounded-2xl bg-[#FCFAF7] border border-[#E8DFD5] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-[#C4A883]" />
                        <div>
                          <h4 className="font-bold text-sm text-[#2D241E]">
                            Termo de Consentimento Livre e Esclarecido
                          </h4>
                          <p className="text-[11px] text-[#7A6C60]">
                            Documento legal assinado digitalmente para tratamento de dados e imagens.
                          </p>
                        </div>
                      </div>

                      <span
                        className={`px-3 py-1 text-xs font-bold rounded-full border ${
                          fichaCliente.cliente.status_lgpd_consentimento === 'assinado'
                            ? 'bg-[#EBF5EC] text-[#3D7342] border-[#D1EBD4]'
                            : 'bg-[#FDF8F0] text-[#D9822B] border-[#EADECF]'
                        }`}
                      >
                        {fichaCliente.cliente.status_lgpd_consentimento === 'assinado'
                          ? 'Assinado'
                          : 'Pendente de Assinatura'}
                      </span>
                    </div>

                    {fichaCliente.cliente.status_lgpd_consentimento === 'assinado' ? (
                      <div className="p-3 bg-white rounded-xl border border-[#E8DFD5] flex items-center justify-between">
                        <div>
                          <span className="text-[11px] text-[#8C7D70] block">Assinado em:</span>
                          <span className="font-semibold text-[#2D241E]">
                            {fichaCliente.cliente.data_consentimento
                              ? new Date(fichaCliente.cliente.data_consentimento).toLocaleString('pt-BR')
                              : 'Registrado no sistema'}
                          </span>
                        </div>
                        {fichaCliente.cliente.url_termo_assinado && (
                          <a
                            href={fichaCliente.cliente.url_termo_assinado}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-xs font-semibold text-[#A68A64] hover:underline"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Ver no Google Drive</span>
                          </a>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2 pt-2">
                        <p className="text-[#7A6C60]">
                          Envie o link público abaixo para a cliente assinar digitalmente via celular ou tablet antes do atendimento:
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => copiarLinkTermo(fichaCliente.cliente.id)}
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#C4A883] hover:bg-[#B39670] text-white rounded-xl font-semibold cursor-pointer shadow-2xs"
                          >
                            {copiadoLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiadoLink ? 'Link Copiado!' : 'Copiar Link de Assinatura'}</span>
                          </button>
                          <a
                            href={`/#termo=${fichaCliente.cliente.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#FAF6F0] hover:bg-[#F2ECE4] text-[#4A3F35] border border-[#E8DFD5] rounded-xl font-medium"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-[#A68A64]" />
                            <span>Abrir Página Pública</span>
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* DIREITOS DA TITULAR (LGPD ART. 18) - FILA E AÇÕES */}
                  <div className="p-4 rounded-2xl bg-white border border-[#E8DFD5] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#A68A64]" />
                        <h4 className="font-bold text-sm text-[#2D241E]">
                          Direitos da Titular (LGPD Art. 18)
                        </h4>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-[#8C7D70] bg-[#FAF6F0] px-2 py-0.5 rounded-md border border-[#E8DFD5]">
                        Retenção 5 anos
                      </span>
                    </div>

                    <p className="text-[#7A6C60] leading-relaxed">
                      Conforme a LGPD, a titular tem direito de solicitar o acesso/exportação integral de seus dados ou a exclusão/revogação do cadastro.
                    </p>

                    {/* Botões de Ação */}
                    <div className="pt-2 flex flex-wrap items-center gap-2">
                      {/* Botão Registrar Solicitação (Aberto para Recepção e Admin) */}
                      <button
                        onClick={() => {
                          setFormSolicitacaoLGPD({ tipo: 'exportacao', motivo: '' });
                          setModalSolicitarLGPDAberto(true);
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-[#FAF6F0] hover:bg-[#F2ECE4] text-[#4A3F35] border border-[#E8DFD5] rounded-xl font-medium cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5 text-[#C4A883]" />
                        <span>Registrar Pedido LGPD na Fila</span>
                      </button>

                      {/* Ações Restritas ao Administrador (Dra. Márcia) */}
                      {isAdmin ? (
                        <>
                          <button
                            onClick={() => handleExportarDadosAdmin(fichaCliente.cliente.id)}
                            disabled={salvando}
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#C4A883] hover:bg-[#B39670] text-white rounded-xl font-semibold cursor-pointer shadow-2xs disabled:opacity-50"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Exportar Dossiê Completo (Admin)</span>
                          </button>

                          <button
                            onClick={() => handleExcluirClienteAdmin(fichaCliente.cliente.id)}
                            disabled={salvando}
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#FCF4F4] hover:bg-[#F2D6D6] text-[#C25953] border border-[#F2D6D6] rounded-xl font-semibold cursor-pointer disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Excluir Cliente (LGPD)</span>
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center gap-1.5 text-[11px] text-[#8C7D70] bg-[#FAF6F0] p-2 rounded-xl border border-[#E8DFD5]">
                          <Lock className="w-3.5 h-3.5 text-[#A68A64]" />
                          <span>A aprovação e exportação do dossiê de saúde é restrita à Dra. Márcia.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: FILA DE SOLICITAÇÕES LGPD PENDENTES & AUDITORIA                    */}
      {/* ========================================================================= */}
      {abaPrincipal === 'fila_lgpd' && (
        <div className="bg-white rounded-3xl p-6 border border-[#E8DFD5] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-[#F2ECE4]">
            <div>
              <h3 className="text-base font-bold text-[#2D241E] font-serif">
                Fila de Solicitações LGPD & Auditoria
              </h3>
              <p className="text-xs text-[#7A6C60]">
                Pedidos de exportação de prontuário e exclusão de dados registrados pela equipe para aprovação da Dra. Márcia.
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#FAF6F0] border border-[#E8DFD5] text-[#5C4A38]">
              {solicitacoesLGPD.length} registro{solicitacoesLGPD.length !== 1 ? 's' : ''}
            </span>
          </div>

          {solicitacoesLGPD.length === 0 ? (
            <div className="py-16 text-center text-[#8C7D70]">
              <ShieldCheck className="w-10 h-10 mx-auto mb-2 text-[#4E8752]/60" />
              <p className="text-sm font-semibold text-[#4A3F35]">Nenhuma solicitação LGPD pendente.</p>
              <p className="text-xs text-[#8C7D70] mt-0.5">Todas as requisições de titulares foram atendidas.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {solicitacoesLGPD.map(sol => {
                const isPendente = sol.status === 'pendente';
                const isExclusao = sol.tipo === 'exclusao';

                return (
                  <div
                    key={sol.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                      isPendente
                        ? 'bg-[#FCFAF7] border-[#C4A883]/60 shadow-2xs'
                        : 'bg-[#FAF8F5] border-[#E8DFD5] opacity-80'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-[#2D241E]">{sol.cliente_nome}</h4>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                            isExclusao ? 'bg-[#FCF4F4] text-[#C25953]' : 'bg-[#FAF6F0] text-[#8C6D4F]'
                          }`}
                        >
                          {sol.tipo === 'exportacao' ? '📁 Exportação de Dossiê' : '🗑️ Exclusão de Cadastro'}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                            isPendente
                              ? 'bg-[#FDF8F0] text-[#D9822B] border-[#EADECF]'
                              : 'bg-[#EBF5EC] text-[#3D7342] border-[#D1EBD4]'
                          }`}
                        >
                          {sol.status.toUpperCase()}
                        </span>
                      </div>

                      <p className="text-xs text-[#7A6C60] flex items-center gap-2">
                        <span>Telefone: {sol.cliente_telefone}</span>
                        <span>•</span>
                        <span>Solicitado por: <strong>{sol.solicitado_por}</strong> em {new Date(sol.data_solicitacao).toLocaleString('pt-BR')}</span>
                      </p>

                      {sol.motivo && (
                        <p className="text-xs text-[#5C4D40] italic bg-white p-2 rounded-lg border border-[#E8DFD5] max-w-xl">
                          Motivo: {sol.motivo}
                        </p>
                      )}
                    </div>

                    {/* Ações de Aprovação pela Dra. Márcia */}
                    {isPendente && (
                      <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                        {isAdmin ? (
                          sol.tipo === 'exportacao' ? (
                            <button
                              onClick={() => handleExportarDadosAdmin(sol.cliente_id)}
                              className="px-4 py-2 bg-[#C4A883] hover:bg-[#B39670] text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
                            >
                              Aprovar & Gerar Dossiê
                            </button>
                          ) : (
                            <button
                              onClick={() => handleExcluirClienteAdmin(sol.cliente_id)}
                              className="px-4 py-2 bg-[#C25953] hover:bg-[#A8453F] text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
                            >
                              Aprovar & Excluir
                            </button>
                          )
                        ) : (
                          <span className="text-[11px] text-[#8C7D70] italic flex items-center gap-1">
                            <Lock className="w-3 h-3 text-[#A68A64]" />
                            Aguardando Dra. Márcia
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REGISTRAR NOVA CLIENTE                                             */}
      {/* ========================================================================= */}
      {modalNovoClienteAberto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#E8DFD5] shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[#F2ECE4] mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#C4A883]" />
                <h3 className="text-lg font-semibold text-[#2D241E] font-serif">Nova Cliente</h3>
              </div>
              <button
                onClick={() => setModalNovoClienteAberto(false)}
                className="p-1 rounded-full text-[#8C7D70] hover:text-[#2D241E]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarNovoCliente} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#3D332A] mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={formNovoCliente.nome}
                  onChange={e => setFormNovoCliente({ ...formNovoCliente, nome: e.target.value })}
                  placeholder="Nome da cliente"
                  className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#E8DFD5] rounded-xl focus:bg-white focus:outline-none focus:border-[#C4A883]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#3D332A] mb-1">Telefone / WhatsApp *</label>
                <input
                  type="text"
                  required
                  value={formNovoCliente.telefone}
                  onChange={e => setFormNovoCliente({ ...formNovoCliente, telefone: e.target.value })}
                  placeholder="(11) 98765-4321"
                  className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#E8DFD5] rounded-xl focus:bg-white focus:outline-none focus:border-[#C4A883]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#3D332A] mb-1">E-mail</label>
                <input
                  type="email"
                  value={formNovoCliente.email}
                  onChange={e => setFormNovoCliente({ ...formNovoCliente, email: e.target.value })}
                  placeholder="cliente@email.com"
                  className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#E8DFD5] rounded-xl focus:bg-white focus:outline-none focus:border-[#C4A883]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#3D332A] mb-1">Data de Nascimento</label>
                <input
                  type="date"
                  value={formNovoCliente.data_nascimento}
                  onChange={e => setFormNovoCliente({ ...formNovoCliente, data_nascimento: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#E8DFD5] rounded-xl focus:bg-white focus:outline-none focus:border-[#C4A883]"
                />
              </div>

              <div className="pt-3 border-t border-[#F2ECE4] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalNovoClienteAberto(false)}
                  className="px-4 py-2 text-xs font-medium text-[#7A6C60] hover:bg-[#FAF6F0] rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-5 py-2 text-xs font-semibold bg-[#C4A883] hover:bg-[#B39670] text-white rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {salvando ? 'Salvando...' : 'Cadastrar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REGISTRAR SOLICITAÇÃO LGPD NA FILA                                  */}
      {/* ========================================================================= */}
      {modalSolicitarLGPDAberto && fichaCliente && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#E8DFD5] shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[#F2ECE4] mb-4">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-[#C4A883]" />
                <h3 className="text-lg font-semibold text-[#2D241E] font-serif">Registrar Pedido LGPD</h3>
              </div>
              <button
                onClick={() => setModalSolicitarLGPDAberto(false)}
                className="p-1 rounded-full text-[#8C7D70] hover:text-[#2D241E]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegistrarSolicitacaoLGPD} className="space-y-4 text-xs">
              <p className="text-[#5C4D40]">
                Cliente: <strong className="text-[#2D241E]">{fichaCliente.cliente.nome}</strong> ({fichaCliente.cliente.telefone})
              </p>

              <div>
                <label className="block font-semibold text-[#3D332A] mb-1">
                  Tipo de Solicitação *
                </label>
                <select
                  value={formSolicitacaoLGPD.tipo}
                  onChange={e => setFormSolicitacaoLGPD({ ...formSolicitacaoLGPD, tipo: e.target.value as any })}
                  className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#E8DFD5] rounded-xl focus:bg-white focus:outline-none focus:border-[#C4A883]"
                >
                  <option value="exportacao">Exportação Completa de Dossiê (Direito de Acesso)</option>
                  <option value="exclusao">Exclusão Definitiva de Dados (Direito ao Esquecimento)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#3D332A] mb-1">
                  Motivo / Observação da Cliente
                </label>
                <textarea
                  rows={3}
                  value={formSolicitacaoLGPD.motivo}
                  onChange={e => setFormSolicitacaoLGPD({ ...formSolicitacaoLGPD, motivo: e.target.value })}
                  placeholder="Ex: Cópia para envio ao dermatologista, mudança de estado, etc."
                  className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#E8DFD5] rounded-xl focus:bg-white focus:outline-none focus:border-[#C4A883]"
                />
              </div>

              <div className="p-3 bg-[#FAF6F0] rounded-xl border border-[#EADECF] text-[11px] text-[#635345]">
                <p>
                  🔔 Esta solicitação entrará na fila de auditoria e notificará a Dra. Márcia para aprovação e geração do arquivo.
                </p>
              </div>

              <div className="pt-3 border-t border-[#F2ECE4] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalSolicitarLGPDAberto(false)}
                  className="px-4 py-2 text-xs font-medium text-[#7A6C60] hover:bg-[#FAF6F0] rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-5 py-2 text-xs font-semibold bg-[#C4A883] hover:bg-[#B39670] text-white rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {salvando ? 'Registrando...' : 'Registrar Solicitação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VISUALIZAR / BAIXAR DOSSIÊ LGPD EXPORTADO                          */}
      {/* ========================================================================= */}
      {modalVisualizarDossieAberto && dossieExportado && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 border border-[#E8DFD5] shadow-2xl animate-in zoom-in-95 duration-150 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#F2ECE4]">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#C4A883]" />
                <h3 className="text-lg font-bold text-[#2D241E] font-serif">
                  Dossiê Completo de Dados (LGPD Art. 18)
                </h3>
              </div>
              <button
                onClick={() => setModalVisualizarDossieAberto(false)}
                className="p-1 rounded-full text-[#8C7D70] hover:text-[#2D241E]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-[#FAF6F0] rounded-2xl border border-[#E8DFD5] text-xs font-mono text-[#3D332A] whitespace-pre-wrap">
              {JSON.stringify(dossieExportado, null, 2)}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#F2ECE4]">
              <span className="text-[11px] text-[#7A6C60]">
                Arquivo gerado com carimbo de integridade clínica da Dra. Márcia.
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(dossieExportado, null, 2)], {
                      type: 'application/json'
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `dossie_lgpd_${dossieExportado.dados_cadastrais?.nome?.replace(/\s+/g, '_')}_${Date.now()}.json`;
                    a.click();
                  }}
                  className="px-4 py-2 bg-[#C4A883] hover:bg-[#B39670] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar Arquivo JSON</span>
                </button>
                <button
                  onClick={() => setModalVisualizarDossieAberto(false)}
                  className="px-4 py-2 bg-white hover:bg-[#FAF6F0] text-[#4A3F35] border border-[#E8DFD5] rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ZOOM DE FOTO */}
      {modalFotoZoom && (
        <div
          onClick={() => setModalFotoZoom(null)}
          className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <img src={modalFotoZoom} alt="Foto Zoom" className="rounded-2xl max-h-[85vh] object-contain" />
            <button
              onClick={() => setModalFotoZoom(null)}
              className="absolute top-4 right-4 p-2 bg-black/60 text-white rounded-full hover:bg-black/90"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
