import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Clock,
  AlertTriangle,
  Phone,
  User,
  Sparkles,
  RefreshCw,
  Info
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [atendimentosProximos, setAtendimentosProximos] = useState<any[]>([]);
  const [cancelamentosTardios, setCancelamentosTardios] = useState<any[]>([]);
  const [carregando, setCarregando] = useState<boolean>(true);

  const carregarAlertas = async () => {
    try {
      setCarregando(true);
      const [proximos, tardios] = await Promise.all([
        api.getAlertasProximos(),
        api.getCancelamentosTardios()
      ]);
      setAtendimentosProximos(proximos);
      setCancelamentosTardios(tardios);
    } catch (err) {
      console.error('Erro ao carregar alertas do dashboard:', err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarAlertas();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Banner de Boas-Vindas e Contexto de Alertas */}
      <div className="bg-gradient-to-r from-white via-[#FAF6F0] to-white p-6 rounded-3xl border border-[#E8DFD5] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="font-script text-2xl text-[#A68A64]"
              style={{ fontFamily: "'Great Vibes', cursive" }}
            >
              Central de Alertas & Notificações
            </span>
          </div>
          <p className="text-xs text-[#7A6C60] mt-1">
            Painel operacional focado em atendimentos imediatos e controle de cancelamentos fora do prazo de 48h.
          </p>
        </div>

        <button
          onClick={carregarAlertas}
          disabled={carregando}
          className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-[#FAF6F0] text-[#4A3F35] border border-[#E8DFD5] rounded-xl text-xs font-medium transition-all shadow-2xs cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#C4A883] ${carregando ? 'animate-spin' : ''}`} />
          <span>Atualizar Alertas</span>
        </button>
      </div>

      {/* Grid com os 2 Pilares Exclusivos do Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ========================================================================= */}
        {/* 1. LEMBRETES DE ATENDIMENTOS PRÓXIMOS (EM 1H / 2H)                        */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-3xl p-6 border border-[#E8DFD5] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#F2ECE4] mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#FDF8F0] border border-[#EADECF] text-[#D9822B]">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-[#2D241E] font-serif">
                    Atendimentos Próximos
                  </h2>
                  <p className="text-[11px] text-[#7A6C60]">Atendimentos programados para as próximas horas</p>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#FDF8F0] text-[#D9822B] border border-[#EADECF]">
                {atendimentosProximos.length} pendente{atendimentosProximos.length !== 1 ? 's' : ''}
              </span>
            </div>

            {atendimentosProximos.length === 0 ? (
              <div className="py-12 text-center text-[#8C7D70]">
                <Sparkles className="w-8 h-8 mx-auto mb-2 text-[#C4A883]/60" />
                <p className="text-sm font-medium">Nenhum atendimento na próxima hora.</p>
                <p className="text-xs text-[#A6998C] mt-0.5">Consulte a aba Agenda para os próximos dias.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {atendimentosProximos.map(ag => (
                  <div
                    key={ag.id}
                    className="p-4 rounded-2xl bg-[#FCFAF7] border border-[#E8DFD5] hover:border-[#C4A883] transition-all relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#FAF6F0] flex items-center justify-center border border-[#C4A883]/40 text-[#5C4A38]">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-[#2D241E]">{ag.cliente_nome}</h4>
                          <p className="text-xs text-[#7A6C60] flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-[#A68A64]" />
                            {ag.cliente_telefone}
                          </p>
                        </div>
                      </div>

                      {/* Contador de tempo */}
                      <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-[#D9822B] text-white shadow-2xs">
                        {ag.minutos_restantes !== undefined
                          ? ag.minutos_restantes > 0
                            ? `em ~${ag.minutos_restantes} min`
                            : 'Agora'
                          : 'Próximo'}
                      </span>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-[#E8DFD5]/60 flex items-center justify-between text-xs text-[#5C4D40]">
                      <span className="font-semibold text-[#8C6D4F]">{ag.procedimento_nome}</span>
                      <span className="text-[11px] text-[#7A6C60]">
                        {new Date(ag.data_hora_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} às{' '}
                        {new Date(ag.data_hora_fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} (2h fixas)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-[#F2ECE4] flex items-center gap-1.5 text-[11px] text-[#8C7D70]">
            <Info className="w-3.5 h-3.5 text-[#C4A883]" />
            <span>Lembretes via WhatsApp são enviados 24h antes pelo Bot da clínica.</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. CANCELAMENTOS TARDIOS RECENTES (< 48H DE ANTECEDÊNCIA)                  */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-3xl p-6 border border-[#E8DFD5] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#F2ECE4] mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#FCF4F4] border border-[#F2D6D6] text-[#C25953]">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-[#2D241E] font-serif">
                    Cancelamentos Tardios Recentes
                  </h2>
                  <p className="text-[11px] text-[#7A6C60]">Cancelados fora do prazo mínimo de 48 horas</p>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#FCF4F4] text-[#C25953] border border-[#F2D6D6]">
                {cancelamentosTardios.length} ocorrência{cancelamentosTardios.length !== 1 ? 's' : ''}
              </span>
            </div>

            {cancelamentosTardios.length === 0 ? (
              <div className="py-12 text-center text-[#8C7D70]">
                <Sparkles className="w-8 h-8 mx-auto mb-2 text-[#4E8752]/60" />
                <p className="text-sm font-medium">Nenhum cancelamento tardio registrado recentemente.</p>
                <p className="text-xs text-[#A6998C] mt-0.5">Todas as clientes cumpriram a política de 48h.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {cancelamentosTardios.map(c => (
                  <div
                    key={c.id}
                    className="p-4 rounded-2xl bg-[#FFFDFD] border border-[#F2D6D6] hover:border-[#C25953] transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-[#2D241E]">{c.cliente_nome}</h4>
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-[#C25953] text-white rounded-full">
                            Tardio (&lt; 48h)
                          </span>
                        </div>
                        <p className="text-xs text-[#7A6C60] flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-[#A68A64]" />
                          {c.cliente_telefone}
                        </p>
                      </div>

                      {/* Tag de Reincidência nos últimos 6 meses */}
                      <span className="text-right">
                        <span className="inline-block px-2 py-1 text-[11px] font-semibold bg-[#F9EFEF] text-[#A63A34] rounded-lg border border-[#F2D6D6]">
                          {c.reincidencia_6_meses || 1}º cancelamento (6 meses)
                        </span>
                      </span>
                    </div>

                    <div className="mt-2.5 p-2.5 rounded-xl bg-[#FAF6F0] border border-[#E8DFD5] text-xs text-[#5C4D40]">
                      <span className="font-semibold text-[#3D332A]">Motivo informado:</span> {c.motivo}
                    </div>

                    <div className="mt-2 text-[10px] text-[#8C7D70] flex justify-between">
                      <span>Registrado em: {new Date(c.data_solicitacao).toLocaleString('pt-BR')}</span>
                      <span className="text-[#C25953] font-medium">Sinalizado na ficha da cliente</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-[#F2ECE4] flex items-center gap-1.5 text-[11px] text-[#8C7D70]">
            <Info className="w-3.5 h-3.5 text-[#C25953]" />
            <span>A sinalização é visual para orientação da equipe e não gera cobrança automática.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
