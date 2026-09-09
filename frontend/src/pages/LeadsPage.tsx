import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Lead } from '../types';
import { useNotifications } from '../context/NotificationContext';
import {
  MessageSquare,
  Phone,
  Sparkles,
  ExternalLink,
  Send,
  RefreshCw,
  Clock,
  CheckCircle2,
  Bot
} from 'lucide-react';

export const LeadsPage: React.FC = () => {
  const { carregarNotificacoes } = useNotifications();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [dataFiltro, setDataFiltro] = useState<string>(new Date().toISOString().split('T')[0]);
  const [apenasHoje, setApenasHoje] = useState<boolean>(true);
  const [carregando, setCarregando] = useState<boolean>(true);

  // Simulador do Bot
  const [simuladorAberto, setSimuladorAberto] = useState<boolean>(false);
  const [formSimulador, setFormSimulador] = useState({
    nome: 'Mariana Duarte',
    telefone: '(11) 98111-2233',
    procedimento_interesse: 'Harmonização Facial e Botox',
    orcamento_estimado: 2500
  });
  const [enviandoSimulacao, setEnviandoSimulacao] = useState<boolean>(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string>('');

  const carregarLeads = async () => {
    try {
      setCarregando(true);
      const res = await api.getLeads(apenasHoje ? undefined : dataFiltro);
      setLeads(res);
    } catch (err) {
      console.error('Erro ao carregar leads:', err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarLeads();
  }, [dataFiltro, apenasHoje]);

  const handleSimularEnvioBot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setEnviandoSimulacao(true);
      await api.simularEnvioLeadBot({
        nome: formSimulador.nome,
        telefone: formSimulador.telefone,
        procedimento_interesse: formSimulador.procedimento_interesse,
        orcamento_estimado: Number(formSimulador.orcamento_estimado) || 0
      });

      await carregarLeads();
      await carregarNotificacoes();
      setMensagemSucesso(`Lead de "${formSimulador.nome}" recebido com sucesso via Webhook do Bot! Notificação interna disparada.`);
      setTimeout(() => setMensagemSucesso(''), 5000);
      setSimuladorAberto(false);
    } catch (err: any) {
      alert(err.message || 'Erro ao simular lead.');
    } finally {
      setEnviandoSimulacao(false);
    }
  };

  const abrirConversaWhatsApp = (lead: Lead) => {
    const numeroLimpo = lead.telefone.replace(/\D/g, '');
    const mensagem = encodeURIComponent(
      `Olá, ${lead.nome}! 🌸 Aqui é da equipe da Dra. Márcia Cristina (MC Estética & Bem-Estar). Recebemos sua mensagem sobre o procedimento de ${lead.procedimento_interesse}. Como podemos te ajudar hoje?`
    );
    window.open(`https://wa.me/55${numeroLimpo}?text=${mensagem}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Barra de Topo */}
      <div className="bg-white p-5 rounded-3xl border border-[#E8DFD5] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#FAF6F0] border border-[#E8DFD5] text-[#C4A883]">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-[#2D241E] font-serif">Leads Recebidos (WhatsApp)</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EBF5EC] text-[#3D7342] font-semibold flex items-center gap-1 border border-[#D1EBD4]">
                <Bot className="w-3 h-3" />
                Meta API Receptor Ativo
              </span>
            </div>
            <p className="text-xs text-[#7A6C60]">
              Contatos capturados pela recepcionista virtual. Lista direta para atendimento imediato via WhatsApp.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          {/* Botão Simulador do Bot para Teste */}
          <button
            onClick={() => setSimuladorAberto(!simuladorAberto)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#FAF6F0] hover:bg-[#F2ECE4] text-[#4A3F35] border border-[#E8DFD5] rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs"
          >
            <Bot className="w-3.5 h-3.5 text-[#A68A64]" />
            <span>Simular Lead do Bot</span>
          </button>

          <button
            onClick={carregarLeads}
            disabled={carregando}
            className="p-2.5 bg-white hover:bg-[#FAF6F0] border border-[#E8DFD5] rounded-xl text-[#7A6C60] hover:text-[#2D241E] cursor-pointer disabled:opacity-50"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-4 h-4 text-[#C4A883] ${carregando ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {mensagemSucesso && (
        <div className="p-4 bg-[#F2F8F3] border border-[#C8E4CD] text-[#2E5E35] text-xs rounded-2xl flex items-center justify-between shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#3D7342]" />
            <span>{mensagemSucesso}</span>
          </div>
        </div>
      )}

      {/* Painel Expansível do Simulador do Bot */}
      {simuladorAberto && (
        <div className="bg-white rounded-3xl p-6 border border-[#C4A883] shadow-md animate-in slide-in-from-top-2 duration-150 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F2ECE4]">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-[#C4A883]" />
              <div>
                <h3 className="text-sm font-bold text-[#2D241E] font-serif">
                  Simulador de Recepção de Lead (Webhook Meta WhatsApp)
                </h3>
                <p className="text-[11px] text-[#7A6C60]">
                  Gera uma chamada simulada para <code className="text-[#A68A64]">POST /api/bot/leads</code> com o token de serviço.
                </p>
              </div>
            </div>
            <button
              onClick={() => setSimuladorAberto(false)}
              className="text-xs text-[#8C7D70] hover:text-black"
            >
              Fechar
            </button>
          </div>

          <form onSubmit={handleSimularEnvioBot} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-[#3D332A] mb-1">Nome do Lead *</label>
              <input
                type="text"
                required
                value={formSimulador.nome}
                onChange={e => setFormSimulador({ ...formSimulador, nome: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#E8DFD5] rounded-xl focus:bg-white focus:outline-none focus:border-[#C4A883]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#3D332A] mb-1">Telefone WhatsApp *</label>
              <input
                type="text"
                required
                value={formSimulador.telefone}
                onChange={e => setFormSimulador({ ...formSimulador, telefone: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#E8DFD5] rounded-xl focus:bg-white focus:outline-none focus:border-[#C4A883]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#3D332A] mb-1">Procedimento de Interesse *</label>
              <input
                type="text"
                required
                value={formSimulador.procedimento_interesse}
                onChange={e => setFormSimulador({ ...formSimulador, procedimento_interesse: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#E8DFD5] rounded-xl focus:bg-white focus:outline-none focus:border-[#C4A883]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#3D332A] mb-1">Orçamento Estimado (R$)</label>
              <input
                type="number"
                value={formSimulador.orcamento_estimado}
                onChange={e => setFormSimulador({ ...formSimulador, orcamento_estimado: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#E8DFD5] rounded-xl focus:bg-white focus:outline-none focus:border-[#C4A883]"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-4 flex justify-end pt-2">
              <button
                type="submit"
                disabled={enviandoSimulacao}
                className="px-5 py-2 bg-[#C4A883] hover:bg-[#B39670] text-white rounded-xl font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{enviandoSimulacao ? 'Disparando...' : 'Disparar Webhook do Bot'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Controles de Filtro e Visualização */}
      <div className="bg-white p-4 rounded-3xl border border-[#E8DFD5] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setApenasHoje(true)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              apenasHoje
                ? 'bg-[#C4A883] text-white shadow-2xs'
                : 'bg-[#FAF6F0] text-[#7A6C60] hover:text-[#2D241E]'
            }`}
          >
            Leads Recebidos Hoje
          </button>
          <button
            onClick={() => setApenasHoje(false)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              !apenasHoje
                ? 'bg-[#C4A883] text-white shadow-2xs'
                : 'bg-[#FAF6F0] text-[#7A6C60] hover:text-[#2D241E]'
            }`}
          >
            Histórico por Data
          </button>
        </div>

        {!apenasHoje && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#7A6C60] font-medium">Filtrar por data:</span>
            <input
              type="date"
              value={dataFiltro}
              onChange={e => setDataFiltro(e.target.value)}
              className="px-3 py-1.5 bg-[#FAF6F0] border border-[#E8DFD5] rounded-xl text-xs font-semibold text-[#3D332A] cursor-pointer"
            />
          </div>
        )}
      </div>

      {/* Tabela / Lista de Leads */}
      <div className="bg-white rounded-3xl p-6 border border-[#E8DFD5] shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#F2ECE4]">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#C4A883]" />
            <h3 className="text-base font-semibold text-[#2D241E] font-serif">
              {apenasHoje ? 'Leads de Hoje' : `Leads de ${new Date(dataFiltro + 'T00:00:00').toLocaleDateString('pt-BR')}`}
            </h3>
          </div>
          <span className="text-xs text-[#7A6C60]">
            {leads.length} lead{leads.length !== 1 ? 's' : ''} registrado{leads.length !== 1 ? 's' : ''}
          </span>
        </div>

        {carregando ? (
          <div className="py-16 text-center text-[#8C7D70]">
            <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin text-[#C4A883]" />
            <p className="text-xs">Carregando leads do WhatsApp...</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="py-16 text-center text-[#8C7D70]">
            <Sparkles className="w-10 h-10 mx-auto mb-2 text-[#C4A883]/60" />
            <p className="text-sm font-semibold text-[#4A3F35]">Nenhum lead recebido neste período.</p>
            <p className="text-xs text-[#8C7D70] mt-0.5">
              Utilize o botão "Simular Lead do Bot" acima para testar o fluxo de captura.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {leads.map(lead => {
              const dataRecebimento = new Date(lead.data_recebimento);
              const horaFormatada = dataRecebimento.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
              const dataFormatada = dataRecebimento.toLocaleDateString('pt-BR');

              return (
                <div
                  key={lead.id}
                  className="p-5 rounded-2xl bg-[#FCFAF7] border border-[#E8DFD5] hover:border-[#C4A883] transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <h4 className="text-sm font-bold text-[#2D241E]">{lead.nome}</h4>
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-[#EBF5EC] text-[#3D7342] border border-[#D1EBD4] rounded-full flex items-center gap-1">
                        <Bot className="w-3 h-3" />
                        Bot WhatsApp
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#7A6C60]">
                      <span className="flex items-center gap-1 font-semibold text-[#4A3F35]">
                        <Phone className="w-3 h-3 text-[#A68A64]" />
                        {lead.telefone}
                      </span>
                      <span>•</span>
                      <span className="text-[#8C6D4F]">
                        Interesse: <strong className="text-[#3D332A]">{lead.procedimento_interesse}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Orçamento Estimado:{' '}
                        <strong className="text-[#3D7342]">
                          {lead.orcamento_estimado > 0 ? `R$ ${lead.orcamento_estimado.toFixed(2)}` : 'A definir'}
                        </strong>
                      </span>
                    </div>

                    <p className="text-[11px] text-[#8C7D70]">
                      Recebido em: {dataFormatada} às {horaFormatada}
                    </p>
                  </div>

                  {/* Ação: Abrir WhatsApp Direto */}
                  <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                    <button
                      onClick={() => abrirConversaWhatsApp(lead)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-[#25D366] hover:bg-[#1EBE5D] text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Conversar no WhatsApp</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
