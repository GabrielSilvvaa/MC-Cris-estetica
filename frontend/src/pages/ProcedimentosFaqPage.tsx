import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Procedimento } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  Lock,
  X,
  CheckCircle2,
  RefreshCw,
  Search,
  Clock
} from 'lucide-react';

export const ProcedimentosFaqPage: React.FC = () => {
  const { isAdmin } = useAuth();

  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([]);
  const [carregando, setCarregando] = useState<boolean>(true);
  const [termoBusca, setTermoBusca] = useState<string>('');

  // Modal de Procedimento
  const [modalProcedimentoAberto, setModalProcedimentoAberto] = useState<boolean>(false);
  const [procedimentoEdicao, setProcedimentoEdicao] = useState<Procedimento | null>(null);
  const [formProcedimento, setFormProcedimento] = useState({
    nome: '',
    descricao: '',
    preco_padrao: 0
  });

  const [salvando, setSalvando] = useState<boolean>(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string>('');

  const carregarDados = async () => {
    try {
      setCarregando(true);
      const procs = await api.getProcedimentos(true);
      setProcedimentos(procs);
    } catch (err) {
      console.error('Erro ao carregar procedimentos:', err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const abrirModalNovoProcedimento = () => {
    setProcedimentoEdicao(null);
    setFormProcedimento({ nome: '', descricao: '', preco_padrao: 0 });
    setModalProcedimentoAberto(true);
  };

  const abrirModalEditarProcedimento = (proc: Procedimento) => {
    setProcedimentoEdicao(proc);
    setFormProcedimento({
      nome: proc.nome,
      descricao: proc.descricao,
      preco_padrao: proc.preco_padrao
    });
    setModalProcedimentoAberto(true);
  };

  const handleSalvarProcedimento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('Apenas administradores podem cadastrar/editar procedimentos.');
      return;
    }

    if (!formProcedimento.nome.trim() || formProcedimento.preco_padrao <= 0) {
      alert('Nome e preço padrão válido são obrigatórios.');
      return;
    }

    try {
      setSalvando(true);
      if (procedimentoEdicao) {
        await api.atualizarProcedimento(procedimentoEdicao.id, {
          nome: formProcedimento.nome,
          descricao: formProcedimento.descricao,
          preco_padrao: Number(formProcedimento.preco_padrao)
        });
        setMensagemSucesso(`Procedimento "${formProcedimento.nome}" atualizado com sucesso.`);
      } else {
        await api.criarProcedimento({
          nome: formProcedimento.nome,
          descricao: formProcedimento.descricao,
          preco_padrao: Number(formProcedimento.preco_padrao)
        });
        setMensagemSucesso(`Procedimento "${formProcedimento.nome}" cadastrado com sucesso.`);
      }
      setModalProcedimentoAberto(false);
      await carregarDados();
      setTimeout(() => setMensagemSucesso(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar procedimento.');
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluirProcedimento = async (id: string, nome: string) => {
    if (!isAdmin) return;
    if (!window.confirm(`Deseja realmente excluir o procedimento "${nome}"?`)) return;

    try {
      setSalvando(true);
      await api.excluirProcedimento(id);
      setMensagemSucesso(`Procedimento "${nome}" removido com sucesso.`);
      await carregarDados();
      setTimeout(() => setMensagemSucesso(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir procedimento.');
    } finally {
      setSalvando(false);
    }
  };

  const procedimentosFiltrados = procedimentos.filter(p =>
    p.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
    p.descricao.toLowerCase().includes(termoBusca.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Banner Superior e Ações */}
      <div className="bg-white p-6 rounded-3xl border border-[#E8DFD5] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2
              className="text-2xl font-semibold text-[#2D241E] font-serif"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Catálogo de Procedimentos
            </h2>
          </div>
          <p className="text-xs text-[#7A6C60] mt-1">
            Tabela de procedimentos clínicos, descrições e valores padrão da clínica.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {isAdmin ? (
            <button
              onClick={abrirModalNovoProcedimento}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#C4A883] hover:bg-[#B39670] text-white rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Procedimento</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-2 bg-[#FAF6F0] text-[#7A6C60] border border-[#E8DFD5] rounded-xl text-xs">
              <Lock className="w-3.5 h-3.5 text-[#C4A883]" />
              <span>Apenas visualização de valores</span>
            </div>
          )}

          <button
            onClick={carregarDados}
            disabled={carregando}
            className="p-2.5 bg-[#FAF6F0] hover:bg-[#F2ECE4] text-[#4A3F35] border border-[#E8DFD5] rounded-xl text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-4 h-4 text-[#C4A883] ${carregando ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mensagem de Feedback */}
      {mensagemSucesso && (
        <div className="p-4 bg-[#F2F8F3] border border-[#D1E7D5] text-[#2D6A4F] text-xs font-medium rounded-2xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#4E8752] shrink-0" />
          <span>{mensagemSucesso}</span>
        </div>
      )}

      {/* Barra de Busca */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#A6998C] absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Buscar procedimento por nome ou descrição..."
          value={termoBusca}
          onChange={(e) => setTermoBusca(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white border border-[#E8DFD5] rounded-2xl text-xs text-[#2D241E] placeholder-[#A6998C] focus:outline-none focus:border-[#C4A883] focus:ring-2 focus:ring-[#C4A883]/20 transition-all shadow-2xs"
        />
      </div>

      {/* Grid de Procedimentos */}
      {carregando ? (
        <div className="py-16 text-center text-[#7A6C60]">
          <div className="w-8 h-8 border-3 border-[#C4A883] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <span className="text-xs font-medium">Carregando catálogo de procedimentos...</span>
        </div>
      ) : procedimentosFiltrados.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#E8DFD5] text-[#8C7D70]">
          <Sparkles className="w-10 h-10 text-[#C4A883]/60 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-[#2D241E]">Nenhum procedimento encontrado</h3>
          <p className="text-xs text-[#A6998C] mt-1">
            {termoBusca ? 'Tente ajustar os termos da sua pesquisa.' : 'Cadastre seu primeiro procedimento clínico.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {procedimentosFiltrados.map((proc) => (
            <div
              key={proc.id}
              className="bg-white rounded-3xl p-6 border border-[#E8DFD5] hover:border-[#C4A883] transition-all shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="p-2.5 rounded-2xl bg-[#FAF6F0] border border-[#E8DFD5] text-[#A68A64]">
                    <Sparkles className="w-5 h-5" />
                  </div>

                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FAF6F0] text-[#8C6D4F] border border-[#E8DFD5]">
                    R$ {proc.preco_padrao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <h3 className="text-base font-bold text-[#2D241E] font-serif mb-1.5 leading-snug">
                  {proc.nome}
                </h3>

                <p className="text-xs text-[#7A6C60] leading-relaxed mb-4 line-clamp-3">
                  {proc.descricao || 'Sem descrição cadastrada.'}
                </p>
              </div>

              <div>
                <div className="pt-3 border-t border-[#F2ECE4] flex items-center justify-between text-xs text-[#8C7D70]">
                  <span className="flex items-center gap-1 text-[#7A6C60]">
                    <Clock className="w-3.5 h-3.5 text-[#C4A883]" />
                    2h fixas de atendimento
                  </span>

                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => abrirModalEditarProcedimento(proc)}
                        className="p-1.5 hover:bg-[#FAF6F0] text-[#7A6C60] hover:text-[#2D241E] rounded-lg transition-colors cursor-pointer"
                        title="Editar procedimento"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleExcluirProcedimento(proc.id, proc.nome)}
                        className="p-1.5 hover:bg-[#FAF6F0] text-[#7A6C60] hover:text-[#C25953] rounded-lg transition-colors cursor-pointer"
                        title="Excluir procedimento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Cadastro / Edição de Procedimento */}
      {modalProcedimentoAberto && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E8DFD5] animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-[#F2ECE4] mb-5">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#FAF6F0] text-[#A68A64]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-[#2D241E] font-serif">
                  {procedimentoEdicao ? 'Editar Procedimento' : 'Novo Procedimento'}
                </h3>
              </div>
              <button
                onClick={() => setModalProcedimentoAberto(false)}
                className="p-1.5 text-[#8C7D70] hover:text-[#2D241E] rounded-full hover:bg-[#FAF6F0] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSalvarProcedimento} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#4A3F35] mb-1">
                  Nome do Procedimento *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Preenchimento Labial"
                  value={formProcedimento.nome}
                  onChange={(e) => setFormProcedimento({ ...formProcedimento, nome: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#FAF6F0]/50 border border-[#E8DFD5] rounded-xl text-xs text-[#2D241E] focus:outline-none focus:border-[#C4A883]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A3F35] mb-1">
                  Preço Padrão (R$) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#8C7D70] font-semibold">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="0.00"
                    value={formProcedimento.preco_padrao || ''}
                    onChange={(e) => setFormProcedimento({ ...formProcedimento, preco_padrao: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-[#FAF6F0]/50 border border-[#E8DFD5] rounded-xl text-xs text-[#2D241E] font-semibold focus:outline-none focus:border-[#C4A883]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A3F35] mb-1">
                  Descrição e Detalhes
                </label>
                <textarea
                  rows={3}
                  placeholder="Descreva o procedimento, indicações e substâncias aplicadas..."
                  value={formProcedimento.descricao}
                  onChange={(e) => setFormProcedimento({ ...formProcedimento, descricao: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#FAF6F0]/50 border border-[#E8DFD5] rounded-xl text-xs text-[#2D241E] focus:outline-none focus:border-[#C4A883] resize-none"
                />
              </div>

              <div className="p-3 bg-[#FAF6F0] rounded-xl border border-[#E8DFD5] text-[11px] text-[#7A6C60] flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#C4A883] shrink-0" />
                <span>A duração padrão de todos os agendamentos é fixa em 2 horas.</span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#F2ECE4]">
                <button
                  type="button"
                  onClick={() => setModalProcedimentoAberto(false)}
                  className="px-4 py-2 text-xs font-medium text-[#7A6C60] hover:text-[#2D241E] hover:bg-[#FAF6F0] rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#C4A883] hover:bg-[#B39670] rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {salvando ? 'Salvando...' : procedimentoEdicao ? 'Salvar Alterações' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
