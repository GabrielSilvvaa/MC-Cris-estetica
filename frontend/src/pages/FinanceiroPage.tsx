import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { RelatorioFinanceiro, Atendimento, Procedimento, Cliente } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  DollarSign,
  TrendingUp,
  Calendar,
  CreditCard,
  PieChart,
  Lock,
  Plus,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  X
} from 'lucide-react';

export const FinanceiroPage: React.FC = () => {
  const { isAdmin, alternarPerfil } = useAuth();

  const [periodo, setPeriodo] = useState<'dia' | 'semana' | 'mes'>('mes');
  const [relatorio, setRelatorio] = useState<RelatorioFinanceiro | null>(null);
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([]);
  const [carregando, setCarregando] = useState<boolean>(true);

  // Modal Registro de Pagamento
  const [modalPagamentoAberto, setModalPagamentoAberto] = useState<boolean>(false);
  const [formPagamento, setFormPagamento] = useState({
    cliente_id: '',
    procedimento_id: '',
    data_hora: new Date().toISOString().split('T')[0] + 'T14:00:00Z',
    valor_cobrado: 0,
    forma_pagamento: 'pix',
    status_pagamento: 'pago',
    observacoes_sessao: ''
  });

  const [salvando, setSalvando] = useState<boolean>(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string>('');

  const carregarDadosFinanceiros = async () => {
    if (!isAdmin) return;
    try {
      setCarregando(true);
      const [rel, atends, clis, procs] = await Promise.all([
        api.getRelatorioFinanceiro(periodo),
        api.getAtendimentosFinanceiro(),
        api.getClientes(),
        api.getProcedimentos(true)
      ]);
      setRelatorio(rel);
      setAtendimentos(atends);
      setClientes(clis);
      setProcedimentos(procs);
    } catch (err) {
      console.error('Erro ao carregar dados financeiros:', err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDadosFinanceiros();
  }, [periodo, isAdmin]);

  // Atualiza o valor sugerido ao mudar o procedimento selecionado
  const handleProcedimentoChange = (procId: string) => {
    const proc = procedimentos.find(p => p.id === procId);
    setFormPagamento(prev => ({
      ...prev,
      procedimento_id: procId,
      valor_cobrado: proc ? proc.preco_padrao : 0
    }));
  };

  const handleSalvarPagamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPagamento.cliente_id || !formPagamento.procedimento_id || formPagamento.valor_cobrado <= 0) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      setSalvando(true);
      await api.registrarPagamento({
        cliente_id: formPagamento.cliente_id,
        procedimento_id: formPagamento.procedimento_id,
        profissional: 'Dra. Márcia Cristina',
        data_hora: formPagamento.data_hora,
        valor_cobrado: Number(formPagamento.valor_cobrado),
        forma_pagamento: formPagamento.forma_pagamento,
        status_pagamento: formPagamento.status_pagamento,
        observacoes_sessao: formPagamento.observacoes_sessao
      });

      setMensagemSucesso('Pagamento registrado com sucesso no fluxo financeiro.');
      setModalPagamentoAberto(false);
      await carregarDadosFinanceiros();
      setTimeout(() => setMensagemSucesso(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar pagamento.');
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
          O módulo financeiro consolidado (faturamento, relatórios e métricas de lucro) é restrito à Dra. Márcia Cristina.
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
      {/* Topo / Filtro de Período */}
      <div className="bg-white p-5 rounded-3xl border border-[#E8DFD5] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#FAF6F0] border border-[#E8DFD5] text-[#C4A883]">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#2D241E] font-serif">
              Relatório Financeiro & Faturamento
            </h2>
            <p className="text-xs text-[#7A6C60]">
              Controle de receitas, atendimentos faturados e formas de pagamento da clínica.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Seletor de Período */}
          <div className="flex items-center bg-[#FAF6F0] p-1 rounded-2xl border border-[#E8DFD5]">
            <button
              onClick={() => setPeriodo('dia')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                periodo === 'dia' ? 'bg-white text-[#2D241E] shadow-2xs' : 'text-[#7A6C60] hover:text-[#2D241E]'
              }`}
            >
              Hoje
            </button>
            <button
              onClick={() => setPeriodo('semana')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                periodo === 'semana' ? 'bg-white text-[#2D241E] shadow-2xs' : 'text-[#7A6C60] hover:text-[#2D241E]'
              }`}
            >
              Esta Semana
            </button>
            <button
              onClick={() => setPeriodo('mes')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                periodo === 'mes' ? 'bg-white text-[#2D241E] shadow-2xs' : 'text-[#7A6C60] hover:text-[#2D241E]'
              }`}
            >
              Este Mês
            </button>
          </div>

          <button
            onClick={() => {
              setFormPagamento({
                cliente_id: '',
                procedimento_id: '',
                data_hora: new Date().toISOString().split('T')[0] + 'T14:00:00Z',
                valor_cobrado: 0,
                forma_pagamento: 'pix',
                status_pagamento: 'pago',
                observacoes_sessao: ''
              });
              setModalPagamentoAberto(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#C4A883] hover:bg-[#B39670] text-white rounded-2xl text-xs font-semibold shadow-xs cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Pagamento</span>
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

      {/* Cards de Métricas Consolidadas */}
      {relatorio && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-[#E8DFD5] shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] text-[#7A6C60] uppercase font-bold tracking-wider block">
                Faturamento Total
              </span>
              <span className="text-2xl font-bold text-[#3D7342] font-serif mt-1 block">
                R$ {relatorio.faturamento_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-[#8C7D70] mt-0.5 block">Período selecionado</span>
            </div>
            <div className="p-3 rounded-2xl bg-[#EBF5EC] text-[#3D7342]">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-[#E8DFD5] shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] text-[#7A6C60] uppercase font-bold tracking-wider block">
                Atendimentos Realizados
              </span>
              <span className="text-2xl font-bold text-[#2D241E] font-serif mt-1 block">
                {relatorio.total_atendimentos}
              </span>
              <span className="text-[10px] text-[#8C7D70] mt-0.5 block">Sessões concluídas (2h fixas)</span>
            </div>
            <div className="p-3 rounded-2xl bg-[#FAF6F0] text-[#A68A64]">
              <Calendar className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-[#E8DFD5] shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] text-[#7A6C60] uppercase font-bold tracking-wider block">
                Ticket Médio
              </span>
              <span className="text-2xl font-bold text-[#8C6D4F] font-serif mt-1 block">
                R$ {relatorio.ticket_medio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-[#8C7D70] mt-0.5 block">Média por atendimento</span>
            </div>
            <div className="p-3 rounded-2xl bg-[#F5EFE6] text-[#8C6D4F]">
              <PieChart className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-[#E8DFD5] shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] text-[#7A6C60] uppercase font-bold tracking-wider block">
                Pagamentos Pagos vs Pendentes
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-bold text-[#3D7342]">
                  {relatorio.total_pagos} Pagos
                </span>
                <span className="text-xs text-[#8C7D70]">/</span>
                <span className="text-sm font-bold text-[#D9822B]">
                  {relatorio.total_pendentes} Pendentes
                </span>
              </div>
              <span className="text-[10px] text-[#8C7D70] mt-0.5 block">Status de cobrança</span>
            </div>
            <div className="p-3 rounded-2xl bg-[#FAF6F0] text-[#5C4A38]">
              <CreditCard className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      {/* Tabela de Atendimentos Financeiros */}
      <div className="bg-white rounded-3xl p-6 border border-[#E8DFD5] shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#F2ECE4]">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#C4A883]" />
            <h3 className="text-base font-semibold text-[#2D241E] font-serif">
              Histórico de Atendimentos & Recebimentos
            </h3>
          </div>
          <span className="text-xs text-[#7A6C60]">
            {atendimentos.length} atendimento{atendimentos.length !== 1 ? 's' : ''} registrado{atendimentos.length !== 1 ? 's' : ''}
          </span>
        </div>

        {carregando ? (
          <div className="py-16 text-center text-[#8C7D70]">
            <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin text-[#C4A883]" />
            <p className="text-xs">Carregando registros financeiros...</p>
          </div>
        ) : atendimentos.length === 0 ? (
          <div className="py-16 text-center text-[#8C7D70]">
            <Sparkles className="w-10 h-10 mx-auto mb-2 text-[#C4A883]/60" />
            <p className="text-sm font-semibold text-[#4A3F35]">Nenhum atendimento faturado no período.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#F2ECE4] text-[#8C7D70] uppercase font-bold text-[10px]">
                  <th className="pb-3 px-3">Data / Hora</th>
                  <th className="pb-3 px-3">Cliente</th>
                  <th className="pb-3 px-3">Procedimento</th>
                  <th className="pb-3 px-3">Valor Sugerido</th>
                  <th className="pb-3 px-3">Valor Cobrado</th>
                  <th className="pb-3 px-3">Forma de Pagamento</th>
                  <th className="pb-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2ECE4]">
                {atendimentos.map(at => {
                  const isPago = at.status_pagamento === 'pago';
                  const valorSugerido = at.preco_padrao_sugerido || at.valor_cobrado;
                  const temDesconto = at.valor_cobrado < valorSugerido;

                  return (
                    <tr key={at.id} className="hover:bg-[#FCFAF7] transition-colors">
                      <td className="py-3.5 px-3 text-[#5C4D40] font-medium">
                        {new Date(at.data_hora).toLocaleDateString('pt-BR')} às{' '}
                        {new Date(at.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="font-bold text-[#2D241E] block">{at.cliente_nome}</span>
                        <span className="text-[11px] text-[#7A6C60]">{at.cliente_telefone}</span>
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-[#8C6D4F]">
                        {at.procedimento_nome}
                      </td>
                      <td className="py-3.5 px-3 text-[#7A6C60]">
                        R$ {valorSugerido.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="font-bold text-[#2D241E]">R$ {at.valor_cobrado.toFixed(2)}</span>
                        {temDesconto && (
                          <span className="block text-[10px] text-[#3D7342] font-semibold">
                            (Desconto aplicado)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 uppercase font-semibold text-[#5C4A38]">
                        {at.forma_pagamento.replace('_', ' ')}
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            isPago
                              ? 'bg-[#EBF5EC] text-[#3D7342] border border-[#D1EBD4]'
                              : 'bg-[#FDF8F0] text-[#D9822B] border border-[#EADECF]'
                          }`}
                        >
                          {at.status_pagamento.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: REGISTRAR / EDITAR PAGAMENTO                                       */}
      {/* ========================================================================= */}
      {modalPagamentoAberto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#E8DFD5] shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[#F2ECE4] mb-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#C4A883]" />
                <h3 className="text-lg font-semibold text-[#2D241E] font-serif">
                  Registrar Pagamento de Atendimento
                </h3>
              </div>
              <button
                onClick={() => setModalPagamentoAberto(false)}
                className="p-1 rounded-full text-[#8C7D70] hover:text-[#2D241E]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarPagamento} className="space-y-3.5 text-xs">
              {/* Seleção de Cliente */}
              <div>
                <label className="block font-semibold text-[#3D332A] mb-1">Cliente *</label>
                <select
                  required
                  value={formPagamento.cliente_id}
                  onChange={e => setFormPagamento({ ...formPagamento, cliente_id: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#E8DFD5] rounded-xl focus:bg-white focus:outline-none focus:border-[#C4A883]"
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
                <label className="block font-semibold text-[#3D332A] mb-1">Procedimento *</label>
                <select
                  required
                  value={formPagamento.procedimento_id}
                  onChange={e => handleProcedimentoChange(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#E8DFD5] rounded-xl focus:bg-white focus:outline-none focus:border-[#C4A883]"
                >
                  <option value="">Selecione o procedimento...</option>
                  {procedimentos.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nome} — R$ {p.preco_padrao.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Valor Cobrado (Sugerido mas Editável) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#3D332A] mb-1">
                    Valor Cobrado (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formPagamento.valor_cobrado}
                    onChange={e => setFormPagamento({ ...formPagamento, valor_cobrado: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#E8DFD5] rounded-xl focus:bg-white focus:outline-none focus:border-[#C4A883] font-bold text-[#2D241E]"
                  />
                  <span className="text-[10px] text-[#8C7D70] mt-0.5 block">
                    Preenchido via tabela, editável para desconto.
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-[#3D332A] mb-1">Forma de Pagamento *</label>
                  <select
                    value={formPagamento.forma_pagamento}
                    onChange={e => setFormPagamento({ ...formPagamento, forma_pagamento: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#E8DFD5] rounded-xl focus:bg-white focus:outline-none focus:border-[#C4A883]"
                  >
                    <option value="pix">Pix</option>
                    <option value="cartao_credito">Cartão de Crédito</option>
                    <option value="cartao_debito">Cartão de Débito</option>
                    <option value="dinheiro">Dinheiro</option>
                    <option value="transferencia">Transferência</option>
                  </select>
                </div>
              </div>

              {/* Status do Pagamento */}
              <div>
                <label className="block font-semibold text-[#3D332A] mb-1">Status do Pagamento *</label>
                <select
                  value={formPagamento.status_pagamento}
                  onChange={e => setFormPagamento({ ...formPagamento, status_pagamento: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#E8DFD5] rounded-xl focus:bg-white focus:outline-none focus:border-[#C4A883]"
                >
                  <option value="pago">Pago (Totalmente Quitado)</option>
                  <option value="pendente">Pendente de Pagamento</option>
                  <option value="parcial">Pagamento Parcial / Sinal</option>
                </select>
              </div>

              {/* Observações da Sessão */}
              <div>
                <label className="block font-semibold text-[#3D332A] mb-1">Observações da Sessão</label>
                <textarea
                  rows={2}
                  value={formPagamento.observacoes_sessao}
                  onChange={e => setFormPagamento({ ...formPagamento, observacoes_sessao: e.target.value })}
                  placeholder="Detalhes clínicos ou condições de pagamento acordadas..."
                  className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#E8DFD5] rounded-xl focus:bg-white focus:outline-none focus:border-[#C4A883]"
                />
              </div>

              <div className="pt-3 border-t border-[#F2ECE4] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalPagamentoAberto(false)}
                  className="px-4 py-2 text-xs font-medium text-[#7A6C60] hover:bg-[#FAF6F0] rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-5 py-2 text-xs font-semibold bg-[#C4A883] hover:bg-[#B39670] text-white rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {salvando ? 'Salvando...' : 'Confirmar e Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
