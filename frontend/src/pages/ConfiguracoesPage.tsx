import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { ConfiguracaoHorario, BloqueioData, Usuario } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Settings,
  Clock,
  Calendar,
  Users,
  Plus,
  Trash2,
  Lock,
  CheckCircle2,
  Check,
  X,
  ShieldCheck,
  FolderOpen
} from 'lucide-react';

export const ConfiguracoesPage: React.FC = () => {
  const { isAdmin, alternarPerfil } = useAuth();

  const [abaAtiva, setAbaAtiva] = useState<'horarios' | 'bloqueios' | 'usuarios' | 'google'>('horarios');
  const [horarios, setHorarios] = useState<ConfiguracaoHorario[]>([]);
  const [bloqueios, setBloqueios] = useState<BloqueioData[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [, setGoogleStatus] = useState<any>(null);
  const [, setCarregando] = useState<boolean>(true);

  // Modais e formulários
  const [modalBloqueioAberto, setModalBloqueioAberto] = useState<boolean>(false);
  const [formBloqueio, setFormBloqueio] = useState({
    data: new Date().toISOString().split('T')[0],
    motivo: '',
    dia_inteiro: true
  });

  const [modalUsuarioAberto, setModalUsuarioAberto] = useState<boolean>(false);
  const [formUsuario, setFormUsuario] = useState<{
    nome: string;
    email: string;
    role: 'admin' | 'recepcionista';
  }>({
    nome: '',
    email: '',
    role: 'recepcionista'
  });

  const [salvando, setSalvando] = useState<boolean>(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string>('');

  const carregarDados = async () => {
    if (!isAdmin) return;
    try {
      setCarregando(true);
      const [hors, bloqs, usrs, gStatus] = await Promise.all([
        api.getHorarios(),
        api.getBloqueios(),
        api.getUsuarios(),
        api.getGoogleStatus()
      ]);
      setHorarios(hors);
      setBloqueios(bloqs);
      setUsuarios(usrs);
      setGoogleStatus(gStatus);
    } catch (err) {
      console.error('Erro ao carregar configurações:', err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [isAdmin]);

  // Atualização dos horários por dia
  const handleAlterarHorario = (diaSemana: number, campo: 'hora_inicio' | 'hora_fim' | 'ativo', valor: any) => {
    setHorarios(prev =>
      prev.map(h => (h.dia_semana === diaSemana ? { ...h, [campo]: valor } : h))
    );
  };

  const handleSalvarHorarios = async () => {
    try {
      setSalvando(true);
      await api.salvarHorarios(horarios);
      setMensagemSucesso('Horários de funcionamento atualizados com sucesso.');
      setTimeout(() => setMensagemSucesso(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar horários.');
    } finally {
      setSalvando(false);
    }
  };

  const handleSalvarBloqueio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formBloqueio.data || !formBloqueio.motivo) {
      alert('Preencha a data e o motivo do bloqueio.');
      return;
    }

    try {
      setSalvando(true);
      await api.criarBloqueio(formBloqueio);
      setModalBloqueioAberto(false);
      setFormBloqueio({ data: new Date().toISOString().split('T')[0], motivo: '', dia_inteiro: true });
      await carregarDados();
      setMensagemSucesso('Data bloqueada com sucesso na agenda.');
      setTimeout(() => setMensagemSucesso(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Erro ao criar bloqueio.');
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluirBloqueio = async (id: string) => {
    try {
      setSalvando(true);
      await api.excluirBloqueio(id);
      await carregarDados();
      setMensagemSucesso('Bloqueio removido da agenda.');
      setTimeout(() => setMensagemSucesso(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Erro ao remover bloqueio.');
    } finally {
      setSalvando(false);
    }
  };

  const handleSalvarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUsuario.nome || !formUsuario.email) {
      alert('Nome e e-mail são obrigatórios.');
      return;
    }

    try {
      setSalvando(true);
      await api.criarUsuario(formUsuario);
      setModalUsuarioAberto(false);
      setFormUsuario({ nome: '', email: '', role: 'recepcionista' });
      await carregarDados();
      setMensagemSucesso('Nova conta de usuário criada com sucesso.');
      setTimeout(() => setMensagemSucesso(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Erro ao criar usuário.');
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluirUsuario = async (id: string, nome: string) => {
    if (!window.confirm(`Deseja realmente remover o acesso de "${nome}"?`)) return;
    try {
      setSalvando(true);
      await api.excluirUsuario(id);
      await carregarDados();
      setMensagemSucesso(`Acesso de "${nome}" revogado.`);
      setTimeout(() => setMensagemSucesso(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir usuário.');
    } finally {
      setSalvando(false);
    }
  };

  // ===========================================================================
  // BLOQUEIO RBAC PARA RECEPCIONISTA
  // ===========================================================================
  if (!isAdmin) {
    return (
      <div className="bg-white rounded-3xl p-12 border border-[#E8DFD5] shadow-xs text-center max-w-xl mx-auto my-12 space-y-4 animate-in fade-in">
        <div className="w-16 h-16 rounded-full bg-[#FCF4F4] border border-[#F2D6D6] flex items-center justify-center mx-auto text-[#C25953]">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-[#2D241E] font-serif">
          Acesso Exclusivo da Administradora
        </h2>
        <p className="text-xs text-[#7A6C60] leading-relaxed">
          O módulo de configurações institucionais da clínica (horários, usuários e integrações Google) é restrito à Dra. Márcia Cristina.
        </p>
        <div className="pt-4 border-t border-[#F2ECE4]">
          <p className="text-[11px] text-[#8C7D70] mb-3">Ambiente de teste e homologação:</p>
          <button
            onClick={() => alternarPerfil('admin')}
            className="px-5 py-2.5 bg-[#C4A883] hover:bg-[#B39670] text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
          >
            Alternar para Administradora (Dra. Márcia)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Topo com Navegação de Abas */}
      <div className="bg-white p-5 rounded-3xl border border-[#E8DFD5] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#FAF6F0] border border-[#E8DFD5] text-[#C4A883]">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#2D241E] font-serif">
              Configurações da Clínica
            </h2>
            <p className="text-xs text-[#7A6C60]">
              Gestão de horários de funcionamento, bloqueios da agenda, usuários e credenciais Google.
            </p>
          </div>
        </div>

        <div className="flex items-center bg-[#FAF6F0] p-1 rounded-2xl border border-[#E8DFD5] overflow-x-auto w-full md:w-auto">
          <button
            onClick={() => setAbaAtiva('horarios')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
              abaAtiva === 'horarios' ? 'bg-white text-[#2D241E] shadow-2xs' : 'text-[#7A6C60] hover:text-[#2D241E]'
            }`}
          >
            Horários de Atendimento
          </button>
          <button
            onClick={() => setAbaAtiva('bloqueios')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
              abaAtiva === 'bloqueios' ? 'bg-white text-[#2D241E] shadow-2xs' : 'text-[#7A6C60] hover:text-[#2D241E]'
            }`}
          >
            Bloqueios de Agenda
          </button>
          <button
            onClick={() => setAbaAtiva('usuarios')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
              abaAtiva === 'usuarios' ? 'bg-white text-[#2D241E] shadow-2xs' : 'text-[#7A6C60] hover:text-[#2D241E]'
            }`}
          >
            Usuários & Equipe
          </button>
          <button
            onClick={() => setAbaAtiva('google')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
              abaAtiva === 'google' ? 'bg-white text-[#2D241E] shadow-2xs' : 'text-[#7A6C60] hover:text-[#2D241E]'
            }`}
          >
            Google Institucional
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
      {/* ABA 1: HORÁRIOS DE ATENDIMENTO                                            */}
      {/* ========================================================================= */}
      {abaAtiva === 'horarios' && (
        <div className="bg-white rounded-3xl p-6 border border-[#E8DFD5] shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#F2ECE4]">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#C4A883]" />
              <h3 className="text-base font-semibold text-[#2D241E] font-serif">
                Horário de Funcionamento Semanal
              </h3>
            </div>
            <p className="text-xs text-[#7A6C60]">
              Horários respeitados na consulta de disponibilidade do Bot e na agenda de 2h.
            </p>
          </div>

          <div className="space-y-3">
            {horarios.map(h => (
              <div
                key={h.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  h.ativo ? 'bg-[#FCFAF7] border-[#E8DFD5]' : 'bg-[#FAF8F5] border-[#E8DFD5] opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={h.ativo}
                    onChange={e => handleAlterarHorario(h.dia_semana, 'ativo', e.target.checked)}
                    className="w-4 h-4 rounded text-[#C4A883] focus:ring-[#C4A883] cursor-pointer"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-[#2D241E]">{h.nome_dia}</h4>
                    <span className="text-[11px] text-[#7A6C60]">
                      {h.ativo ? 'Atendimento ativo' : 'Clínica fechada'}
                    </span>
                  </div>
                </div>

                {h.ativo && (
                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#7A6C60]">Início:</span>
                      <input
                        type="time"
                        value={h.hora_inicio}
                        onChange={e => handleAlterarHorario(h.dia_semana, 'hora_inicio', e.target.value)}
                        className="px-2.5 py-1 bg-white border border-[#E8DFD5] rounded-xl font-semibold text-[#2D241E]"
                      />
                    </div>

                    <span className="text-[#8C7D70]">até</span>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[#7A6C60]">Término:</span>
                      <input
                        type="time"
                        value={h.hora_fim}
                        onChange={e => handleAlterarHorario(h.dia_semana, 'hora_fim', e.target.value)}
                        className="px-2.5 py-1 bg-white border border-[#E8DFD5] rounded-xl font-semibold text-[#2D241E]"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-[#F2ECE4] flex justify-end">
            <button
              onClick={handleSalvarHorarios}
              disabled={salvando}
              className="px-6 py-2.5 bg-[#C4A883] hover:bg-[#B39670] text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer disabled:opacity-50"
            >
              {salvando ? 'Salvando...' : 'Salvar Alterações de Horário'}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: BLOQUEIOS DE AGENDA                                                */}
      {/* ========================================================================= */}
      {abaAtiva === 'bloqueios' && (
        <div className="bg-white rounded-3xl p-6 border border-[#E8DFD5] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F2ECE4]">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#C4A883]" />
              <h3 className="text-base font-semibold text-[#2D241E] font-serif">
                Bloqueio de Datas Específicas
              </h3>
            </div>
            <button
              onClick={() => setModalBloqueioAberto(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#C4A883] hover:bg-[#B39670] text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Bloqueio</span>
            </button>
          </div>

          {bloqueios.length === 0 ? (
            <div className="py-16 text-center text-[#8C7D70]">
              <Calendar className="w-10 h-10 mx-auto mb-2 text-[#C4A883]/60" />
              <p className="text-sm font-semibold text-[#4A3F35]">Nenhum bloqueio cadastrado.</p>
              <p className="text-xs text-[#8C7D70]">Todos os dias de funcionamento estão livres para agendamento.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bloqueios.map(b => (
                <div
                  key={b.id}
                  className="p-4 rounded-2xl bg-[#FCFAF7] border border-[#E8DFD5] flex items-center justify-between gap-4"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#2D241E]">
                        {new Date(b.data + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-[#FCF4F4] text-[#C25953] rounded-full border border-[#F2D6D6]">
                        Bloqueado
                      </span>
                    </div>
                    <p className="text-xs text-[#7A6C60]">Motivo: {b.motivo}</p>
                  </div>

                  <button
                    onClick={() => handleExcluirBloqueio(b.id)}
                    className="p-2 text-[#C25953] hover:bg-[#FCF4F4] rounded-xl transition-colors cursor-pointer"
                    title="Remover bloqueio"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 3: GESTÃO DE USUÁRIOS (RECEPCIONISTAS)                                */}
      {/* ========================================================================= */}
      {abaAtiva === 'usuarios' && (
        <div className="bg-white rounded-3xl p-6 border border-[#E8DFD5] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F2ECE4]">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#C4A883]" />
              <h3 className="text-base font-semibold text-[#2D241E] font-serif">
                Usuários do Sistema & Níveis de Acesso
              </h3>
            </div>
            <button
              onClick={() => setModalUsuarioAberto(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#C4A883] hover:bg-[#B39670] text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Usuário</span>
            </button>
          </div>

          <div className="space-y-3">
            {usuarios.map(u => (
              <div
                key={u.id}
                className="p-4 rounded-2xl bg-[#FCFAF7] border border-[#E8DFD5] flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#EADECF] text-[#4A3F35] font-bold text-xs flex items-center justify-center border border-[#C4A883]/60 shrink-0">
                    {u.role === 'admin' ? 'MC' : 'RC'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-[#2D241E]">{u.nome}</h4>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                          u.role === 'admin'
                            ? 'bg-[#EADECF] text-[#5C4A38]'
                            : 'bg-[#FAF6F0] text-[#8C6D4F] border border-[#E8DFD5]'
                        }`}
                      >
                        {u.role === 'admin' ? 'Administradora' : 'Recepcionista'}
                      </span>
                    </div>
                    <p className="text-xs text-[#7A6C60]">{u.email}</p>
                  </div>
                </div>

                {u.role !== 'admin' && (
                  <button
                    onClick={() => handleExcluirUsuario(u.id, u.nome)}
                    className="p-2 text-[#C25953] hover:bg-[#FCF4F4] rounded-xl transition-colors cursor-pointer"
                    title="Remover usuário"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 4: INTEGRAÇÃO GOOGLE INSTITUCIONAL                                     */}
      {/* ========================================================================= */}
      {abaAtiva === 'google' && (
        <div className="bg-white rounded-3xl p-6 border border-[#E8DFD5] shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#F2ECE4]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#C4A883]" />
              <h3 className="text-base font-semibold text-[#2D241E] font-serif">
                Conta Institucional Google (Calendar & Drive)
              </h3>
            </div>
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#EBF5EC] text-[#3D7342] font-semibold border border-[#D1EBD4]">
              Conta Institucional Conectada
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Google Calendar */}
            <div className="p-5 rounded-2xl bg-[#FCFAF7] border border-[#E8DFD5] space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#EBF5EC] text-[#3D7342]">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#2D241E]">Google Calendar API</h4>
                  <p className="text-[11px] text-[#7A6C60]">Agenda oficial da Dra. Márcia Cristina</p>
                </div>
              </div>

              <div className="space-y-1 text-[#5C4D40] bg-white p-3 rounded-xl border border-[#E8DFD5]">
                <p><strong>E-mail Institucional:</strong> esteticabemestarmc@gmail.com</p>
                <p><strong>Escopo:</strong> https://www.googleapis.com/auth/calendar</p>
                <p><strong>Duração Padrão:</strong> 2 horas fixas por atendimento</p>
              </div>

              <div className="flex items-center gap-1.5 text-[#3D7342] font-semibold text-[11px]">
                <Check className="w-4 h-4" />
                <span>Sincronização Ativa em Tempo Real</span>
              </div>
            </div>

            {/* Google Drive */}
            <div className="p-5 rounded-2xl bg-[#FCFAF7] border border-[#E8DFD5] space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#FAF6F0] text-[#A68A64]">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#2D241E]">Google Drive API</h4>
                  <p className="text-[11px] text-[#7A6C60]">Armazenamento seguro de fotos e termos</p>
                </div>
              </div>

              <div className="space-y-1 text-[#5C4D40] bg-white p-3 rounded-xl border border-[#E8DFD5]">
                <p><strong>Estrutura de Pastas:</strong> /Clientes/{"{nome_cliente}_{id}"}/</p>
                <p><strong>Escopo:</strong> https://www.googleapis.com/auth/drive.file</p>
                <p><strong>Armazenamento:</strong> Apenas referências seguras (IDs/URLs)</p>
              </div>

              <div className="flex items-center gap-1.5 text-[#3D7342] font-semibold text-[11px]">
                <Check className="w-4 h-4" />
                <span>Armazenamento em Nuvem Ativo</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADICIONAR BLOQUEIO */}
      {modalBloqueioAberto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#E8DFD5] shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[#F2ECE4] mb-4">
              <h3 className="text-lg font-semibold text-[#2D241E] font-serif">Novo Bloqueio de Agenda</h3>
              <button onClick={() => setModalBloqueioAberto(false)} className="p-1 rounded-full text-[#8C7D70]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarBloqueio} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#3D332A] mb-1">Data do Bloqueio *</label>
                <input
                  type="date"
                  required
                  value={formBloqueio.data}
                  onChange={e => setFormBloqueio({ ...formBloqueio, data: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#E8DFD5] rounded-xl focus:bg-white focus:outline-none focus:border-[#C4A883]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#3D332A] mb-1">Motivo do Bloqueio *</label>
                <input
                  type="text"
                  required
                  value={formBloqueio.motivo}
                  onChange={e => setFormBloqueio({ ...formBloqueio, motivo: e.target.value })}
                  placeholder="Ex: Feriado Nacional, Congresso de Estética..."
                  className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#E8DFD5] rounded-xl focus:bg-white focus:outline-none focus:border-[#C4A883]"
                />
              </div>

              <div className="pt-3 border-t border-[#F2ECE4] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalBloqueioAberto(false)}
                  className="px-4 py-2 text-xs font-medium text-[#7A6C60] hover:bg-[#FAF6F0] rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-5 py-2 text-xs font-semibold bg-[#C4A883] hover:bg-[#B39670] text-white rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {salvando ? 'Salvando...' : 'Confirmar Bloqueio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADICIONAR USUÁRIO */}
      {modalUsuarioAberto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#E8DFD5] shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[#F2ECE4] mb-4">
              <h3 className="text-lg font-semibold text-[#2D241E] font-serif">Novo Usuário / Recepcionista</h3>
              <button onClick={() => setModalUsuarioAberto(false)} className="p-1 rounded-full text-[#8C7D70]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarUsuario} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#3D332A] mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={formUsuario.nome}
                  onChange={e => setFormUsuario({ ...formUsuario, nome: e.target.value })}
                  placeholder="Nome do colaborador"
                  className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#E8DFD5] rounded-xl focus:bg-white focus:outline-none focus:border-[#C4A883]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#3D332A] mb-1">E-mail de Login Google *</label>
                <input
                  type="email"
                  required
                  value={formUsuario.email}
                  onChange={e => setFormUsuario({ ...formUsuario, email: e.target.value })}
                  placeholder="usuario@mcestetica.com.br"
                  className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#E8DFD5] rounded-xl focus:bg-white focus:outline-none focus:border-[#C4A883]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#3D332A] mb-1">Nível de Acesso (Papel) *</label>
                <select
                  value={formUsuario.role}
                  onChange={e => setFormUsuario({ ...formUsuario, role: e.target.value as any })}
                  className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#E8DFD5] rounded-xl focus:bg-white focus:outline-none focus:border-[#C4A883]"
                >
                  <option value="recepcionista">Recepcionista (Operacional)</option>
                  <option value="admin">Administrador (Dra. Márcia - Acesso Total)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-[#F2ECE4] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalUsuarioAberto(false)}
                  className="px-4 py-2 text-xs font-medium text-[#7A6C60] hover:bg-[#FAF6F0] rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-5 py-2 text-xs font-semibold bg-[#C4A883] hover:bg-[#B39670] text-white rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {salvando ? 'Salvando...' : 'Cadastrar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
