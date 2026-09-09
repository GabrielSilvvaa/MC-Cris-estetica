import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Agendamento, Cliente, Procedimento, Cancelamento } from '../types';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  User,
  AlertTriangle,
  CheckCircle2,
  X,
  Sparkles,
  CalendarCheck,
  RefreshCw
} from 'lucide-react';

export const AgendaPage: React.FC = () => {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([]);
  const [carregando, setCarregando] = useState<boolean>(true);

  // Filtro de data / visualização
  const [dataSelecionada, setDataSelecionada] = useState<string>(new Date().toISOString().split('T')[0]);
  const [modoVisualizacao] = useState<'dia' | 'semana' | 'mes'>('dia');

  // Modais
  const [modalNovoAberto, setModalNovoAberto] = useState<boolean>(false);
  const [modalCancelarAberto, setModalCancelarAberto] = useState<boolean>(false);
  const [agendamentoParaCancelar, setAgendamentoParaCancelar] = useState<Agendamento | null>(null);
  const [motivoCancelamento, setMotivoCancelamento] = useState<string>('');
  const [resultadoCancelamento, setResultadoCancelamento] = useState<{
    cancelamento: Cancelamento;
    dentroDoPrazo: boolean;
    reincidenciaTardios6Meses: number;
  } | null>(null);

  // Formulário de Novo Agendamento
  const [formNovo, setFormNovo] = useState({
    cliente_id: '',
    procedimento_id: '',
    data: new Date().toISOString().split('T')[0],
    hora_inicio: '09:00',
    observacoes: ''
  });

  const [erroForm, setErroForm] = useState<string>('');
  const [salvando, setSalvando] = useState<boolean>(false);

  const carregarDados = async () => {
    try {
      setCarregando(true);
      const [agends, clis, procs] = await Promise.all([
        api.getAgendamentos(),
        api.getClientes(),
        api.getProcedimentos(true)
      ]);
      setAgendamentos(agends);
      setClientes(clis);
      setProcedimentos(procs);
    } catch (err) {
      console.error('Erro ao carregar dados da agenda:', err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const handleSalvarNovoAgendamento = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroForm('');

    if (!formNovo.cliente_id || !formNovo.procedimento_id || !formNovo.data || !formNovo.hora_inicio) {
      setErroForm('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      setSalvando(true);
      const dataHoraInicio = `${formNovo.data}T${formNovo.hora_inicio}:00Z`;

      await api.criarAgendamento({
        cliente_id: formNovo.cliente_id,
        procedimento_id: formNovo.procedimento_id,
        data_hora_inicio: dataHoraInicio,
        observacoes: formNovo.observacoes
      });

      await carregarDados();
      setModalNovoAberto(false);
      setFormNovo({
        cliente_id: '',
        procedimento_id: '',
        data: new Date().toISOString().split('T')[0],
        hora_inicio: '09:00',
        observacoes: ''
      });
    } catch (err: any) {
      setErroForm(err.message || 'Erro ao criar agendamento.');
    } finally {
      setSalvando(false);
    }
  };

  const handleAbrirCancelar = (ag: Agendamento) => {
    setAgendamentoParaCancelar(ag);
    setMotivoCancelamento('');
    setResultadoCancelamento(null);
    setModalCancelarAberto(true);
  };

  const handleConfirmarCancelamento = async () => {
    if (!agendamentoParaCancelar || !motivoCancelamento.trim()) {
      alert('Por favor, informe o motivo do cancelamento.');
      return;
    }

    try {
      setSalvando(true);
      const res = await api.cancelarAgendamento(agendamentoParaCancelar.id, motivoCancelamento);
      setResultadoCancelamento(res);
      await carregarDados();
    } catch (err: any) {
      alert(err.message || 'Erro ao cancelar agendamento.');
    } finally {
      setSalvando(false);
    }
  };

  // Filtrar agendamentos para exibição
  const agendamentosFiltrados = agendamentos.filter(a => {
    if (modoVisualizacao === 'dia') {
      return a.data_hora_inicio.startsWith(dataSelecionada);
    }
    return true; // Na visualização geral
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Barra de Controles e Sincronização */}
      <div className="bg-white p-5 rounded-3xl border border-[#E8DFD5] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#FAF6F0] border border-[#E8DFD5] text-[#C4A883]">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-[#2D241E] font-serif">Google Agenda Institucional</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EBF5EC] text-[#3D7342] font-semibold flex items-center gap-1 border border-[#D1EBD4]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4E8752] animate-pulse"></span>
                Sincronizado
              </span>
            </div>
            <p className="text-xs text-[#7A6C60]">
              Atendimentos com duração <span className="font-semibold text-[#4A3F35]">fixa de 2 horas</span> na agenda da Dra. Márcia Cristina.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Seletor de Data */}
          <div className="flex items-center gap-1.5 bg-[#FAF6F0] p-1 rounded-2xl border border-[#E8DFD5]">
            <input
              type="date"
              value={dataSelecionada}
              onChange={e => setDataSelecionada(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold text-[#3D332A] bg-transparent border-0 focus:outline-none cursor-pointer"
            />
          </div>

          {/* Botão Novo Agendamento */}
          <button
            onClick={() => setModalNovoAberto(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#C4A883] hover:bg-[#B39670] text-white rounded-2xl text-xs font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Agendamento</span>
          </button>
        </div>
      </div>

      {/* Grid de Horários e Atendimentos do Dia */}
      <div className="bg-white rounded-3xl p-6 border border-[#E8DFD5] shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-[#F2ECE4] mb-6">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-[#C4A883]" />
            <h3 className="text-base font-semibold text-[#2D241E] font-serif">
              Grade de Atendimentos — {new Date(dataSelecionada + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
            </h3>
          </div>
          <span className="text-xs text-[#7A6C60]">
            {agendamentosFiltrados.length} agendamento{agendamentosFiltrados.length !== 1 ? 's' : ''}
          </span>
        </div>

        {carregando ? (
          <div className="py-16 text-center text-[#8C7D70]">
            <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin text-[#C4A883]" />
            <p className="text-xs">Carregando horários da agenda...</p>
          </div>
        ) : agendamentosFiltrados.length === 0 ? (
          <div className="py-16 text-center text-[#8C7D70]">
            <Sparkles className="w-10 h-10 mx-auto mb-2 text-[#C4A883]/60" />
            <p className="text-sm font-semibold text-[#4A3F35]">Nenhum agendamento para esta data.</p>
            <p className="text-xs text-[#8C7D70] mt-1">Clique no botão "Novo Agendamento" para reservar um bloco de 2h.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {agendamentosFiltrados.map(ag => {
              const isCancelado = ag.status === 'cancelado';
              const horaInicio = new Date(ag.data_hora_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
              const horaFim = new Date(ag.data_hora_fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

              return (
                <div
                  key={ag.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                    isCancelado
                      ? 'bg-[#FAF8F8] border-[#E8DFDF] opacity-75'
                      : 'bg-[#FCFAF7] border-[#E8DFD5] hover:border-[#C4A883] hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Bloco de Horário (2 Horas Fixas) */}
                    <div className="flex flex-col items-center justify-center min-w-[110px] p-2.5 rounded-xl bg-white border border-[#E8DFD5] shadow-2xs">
                      <span className="text-xs font-bold text-[#2D241E]">{horaInicio} - {horaFim}</span>
                      <span className="text-[10px] font-semibold text-[#A68A64] mt-0.5">2h fixas</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-[#2D241E]">{ag.cliente_nome}</h4>
                        {isCancelado ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-[#F2D6D6] text-[#A63A34] rounded-full">
                            Cancelado
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-semibold bg-[#EADECF] text-[#5C4A38] rounded-full">
                            Confirmado
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-semibold text-[#8C6D4F] mt-1">
                        {ag.procedimento_nome}
                      </p>

                      {ag.observacoes && (
                        <p className="text-xs text-[#7A6C60] mt-0.5 italic">
                          Obs: {ag.observacoes}
                        </p>
                      )}

                      <div className="flex items-center gap-3 mt-2 text-[11px] text-[#8C7D70]">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-[#A68A64]" />
                          {ag.profissional}
                        </span>
                        {ag.google_event_id && (
                          <span className="text-[#3D7342] font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Google Event Sync
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Ações */}
                  {!isCancelado && (
                    <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                      <button
                        onClick={() => handleAbrirCancelar(ag)}
                        className="px-3.5 py-1.5 text-xs font-medium text-[#C25953] hover:bg-[#FCF4F4] border border-[#F2D6D6] rounded-xl transition-colors cursor-pointer"
                      >
                        Cancelar Atendimento
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: NOVO AGENDAMENTO (2H FIXAS)                                        */}
      {/* ========================================================================= */}
      {modalNovoAberto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-[#E8DFD5] shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[#F2ECE4] mb-4">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-[#C4A883]" />
                <h3 className="text-lg font-semibold text-[#2D241E] font-serif">Novo Agendamento</h3>
              </div>
              <button
                onClick={() => setModalNovoAberto(false)}
                className="p-1 rounded-full text-[#8C7D70] hover:text-[#2D241E] hover:bg-[#FAF6F0]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {erroForm && (
              <div className="mb-4 p-3 bg-[#FCF4F4] border border-[#F2D6D6] text-[#C25953] text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{erroForm}</span>
              </div>
            )}

            <form onSubmit={handleSalvarNovoAgendamento} className="space-y-4">
              {/* Seleção de Cliente */}
              <div>
                <label className="block text-xs font-semibold text-[#3D332A] mb-1">
                  Cliente *
                </label>
                <select
                  required
                  value={formNovo.cliente_id}
                  onChange={e => setFormNovo({ ...formNovo, cliente_id: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#FAF6F0] border border-[#E8DFD5] rounded-xl focus:bg-white focus:outline-none focus:border-[#C4A883]"
                >
                  <option value="">Selecione a cliente...</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nome} ({c.telefone})
                    </option>
                  ))}
                </select>
              </div>

              {/* Seleção de Procedimento */}
              <div>
                <label className="block text-xs font-semibold text-[#3D332A] mb-1">
                  Procedimento *
                </label>
                <select
                  required
                  value={formNovo.procedimento_id}
                  onChange={e => setFormNovo({ ...formNovo, procedimento_id: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#FAF6F0] border border-[#E8DFD5] rounded-xl focus:bg-white focus:outline-none focus:border-[#C4A883]"
                >
                  <option value="">Selecione o procedimento...</option>
                  {procedimentos.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nome} — R$ {p.preco_padrao.toFixed(2)} (2h)
                    </option>
                  ))}
                </select>
              </div>

              {/* Data e Horário */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#3D332A] mb-1">Data *</label>
                  <input
                    type="date"
                    required
                    value={formNovo.data}
                    onChange={e => setFormNovo({ ...formNovo, data: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF6F0] border border-[#E8DFD5] rounded-xl focus:bg-white focus:outline-none focus:border-[#C4A883]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#3D332A] mb-1">Hora de Início *</label>
                  <select
                    value={formNovo.hora_inicio}
                    onChange={e => setFormNovo({ ...formNovo, hora_inicio: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF6F0] border border-[#E8DFD5] rounded-xl focus:bg-white focus:outline-none focus:border-[#C4A883]"
                  >
                    <option value="09:00">09:00 (até 11:00)</option>
                    <option value="11:00">11:00 (até 13:00)</option>
                    <option value="14:00">14:00 (até 16:00)</option>
                    <option value="16:00">16:00 (até 18:00)</option>
                  </select>
                </div>
              </div>

              {/* Aviso de 2 horas fixas */}
              <div className="p-3 bg-[#FAF6F0] rounded-xl border border-[#EADECF] flex items-center gap-2 text-xs text-[#635345]">
                <Clock className="w-4 h-4 text-[#A68A64] shrink-0" />
                <span>
                  Regra de Atendimento: Duração <strong className="text-[#3D332A]">fixa e padrão de 2 horas</strong> com sincronização automática na Google Agenda institucional.
                </span>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-xs font-semibold text-[#3D332A] mb-1">
                  Observações
                </label>
                <textarea
                  rows={2}
                  value={formNovo.observacoes}
                  onChange={e => setFormNovo({ ...formNovo, observacoes: e.target.value })}
                  placeholder="Instruções ou preparo prévio..."
                  className="w-full px-3 py-2 text-xs bg-[#FAF6F0] border border-[#E8DFD5] rounded-xl focus:bg-white focus:outline-none focus:border-[#C4A883]"
                />
              </div>

              {/* Botões */}
              <div className="pt-3 border-t border-[#F2ECE4] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalNovoAberto(false)}
                  className="px-4 py-2 text-xs font-medium text-[#7A6C60] hover:bg-[#FAF6F0] rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-5 py-2 text-xs font-semibold bg-[#C4A883] hover:bg-[#B39670] text-white rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {salvando ? 'Salvando...' : 'Confirmar e Sincronizar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CANCELAR AGENDAMENTO COM REGRA DE 48H                              */}
      {/* ========================================================================= */}
      {modalCancelarAberto && agendamentoParaCancelar && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#E8DFD5] shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[#F2ECE4] mb-4">
              <div className="flex items-center gap-2 text-[#C25953]">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-lg font-semibold text-[#2D241E] font-serif">Cancelar Agendamento</h3>
              </div>
              <button
                onClick={() => setModalCancelarAberto(false)}
                className="p-1 rounded-full text-[#8C7D70] hover:text-[#2D241E] hover:bg-[#FAF6F0]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {resultadoCancelamento ? (
              <div className="space-y-4">
                <div
                  className={`p-4 rounded-2xl border text-xs leading-relaxed ${
                    resultadoCancelamento.dentroDoPrazo
                      ? 'bg-[#F2F8F3] border-[#C8E4CD] text-[#2E5E35]'
                      : 'bg-[#FCF4F4] border-[#F2D6D6] text-[#A63A34]'
                  }`}
                >
                  <h4 className="font-bold text-sm mb-1">
                    {resultadoCancelamento.dentroDoPrazo
                      ? 'Cancelamento Dentro do Prazo'
                      : 'Cancelamento Tardio Registrado (< 48h)'}
                  </h4>
                  <p>
                    {resultadoCancelamento.dentroDoPrazo
                      ? 'O cancelamento foi solicitado com mais de 48 horas de antecedência. Nenhuma sinalização negativa foi gerada.'
                      : `A solicitação foi realizada com menos de 48h de antecedência. Foi gerada uma tag de cancelamento tardio na ficha da cliente (${resultadoCancelamento.reincidenciaTardios6Meses}º cancelamento nos últimos 6 meses).`}
                  </p>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setModalCancelarAberto(false)}
                    className="px-4 py-2 bg-[#C4A883] text-white rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Concluir
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-[#5C4D40]">
                  Você está cancelando o atendimento de{' '}
                  <strong className="text-[#2D241E]">{agendamentoParaCancelar.cliente_nome}</strong> programado para{' '}
                  <strong className="text-[#2D241E]">
                    {new Date(agendamentoParaCancelar.data_hora_inicio).toLocaleString('pt-BR')}
                  </strong>.
                </p>

                <div className="p-3 bg-[#FAF6F0] rounded-xl border border-[#EADECF] text-xs text-[#635345]">
                  <p className="font-semibold text-[#3D332A] mb-0.5">Política de 48 horas da clínica:</p>
                  <p className="text-[11px] leading-relaxed">
                    O sistema verificará o prazo automaticamente. Cancelamentos com menos de 48h gerarão alerta no dashboard e tag de reincidência na ficha.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#3D332A] mb-1">
                    Motivo do Cancelamento (Obrigatório) *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={motivoCancelamento}
                    onChange={e => setMotivoCancelamento(e.target.value)}
                    placeholder="Ex: Imprevisto de trabalho, motivo de saúde, etc."
                    className="w-full px-3 py-2 text-xs bg-[#FAF6F0] border border-[#E8DFD5] rounded-xl focus:bg-white focus:outline-none focus:border-[#C4A883]"
                  />
                </div>

                <div className="pt-3 border-t border-[#F2ECE4] flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalCancelarAberto(false)}
                    className="px-4 py-2 text-xs font-medium text-[#7A6C60] hover:bg-[#FAF6F0] rounded-xl cursor-pointer"
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    disabled={salvando || !motivoCancelamento.trim()}
                    onClick={handleConfirmarCancelamento}
                    className="px-5 py-2 text-xs font-semibold bg-[#C25953] hover:bg-[#A8453F] text-white rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {salvando ? 'Processando...' : 'Confirmar Cancelamento'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
