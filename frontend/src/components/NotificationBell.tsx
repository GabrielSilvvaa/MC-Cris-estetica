import React, { useState, useRef, useEffect } from 'react';
import { Bell, Clock, AlertTriangle, MessageSquare, Check, Sparkles } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

export const NotificationBell: React.FC = () => {
  const { notificacoes, naoLidas, marcarComoLida, marcarTodasComoLidas } = useNotifications();
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setAberto(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcone = (tipo: string) => {
    switch (tipo) {
      case 'cancelamento_tardio':
        return <AlertTriangle className="w-4 h-4 text-[#C25953]" />;
      case 'lembrete_1h':
        return <Clock className="w-4 h-4 text-[#D9822B]" />;
      case 'novo_lead':
      default:
        return <MessageSquare className="w-4 h-4 text-[#A68A64]" />;
    }
  };

  const getCorBorda = (tipo: string) => {
    switch (tipo) {
      case 'cancelamento_tardio':
        return 'border-l-4 border-l-[#C25953] bg-[#FCF4F4]';
      case 'lembrete_1h':
        return 'border-l-4 border-l-[#D9822B] bg-[#FDF9F3]';
      case 'novo_lead':
      default:
        return 'border-l-4 border-l-[#C4A883] bg-[#FAF7F2]';
    }
  };

  const formatarHora = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setAberto(!aberto)}
        className="relative p-2.5 rounded-full bg-white border border-[#E8DFD5] text-[#4A3F35] hover:text-[#2D241E] hover:border-[#C4A883] hover:shadow-xs transition-all cursor-pointer focus:outline-none"
        title="Notificações e Alertas"
      >
        <Bell className="w-5 h-5 text-[#635345]" />
        {naoLidas > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-5 h-5 px-1.5 text-[11px] font-bold text-white bg-[#C25953] rounded-full shadow-xs animate-pulse">
            {naoLidas}
          </span>
        )}
      </button>

      {aberto && (
        <div className="absolute right-0 mt-2.5 w-96 max-w-[90vw] bg-white rounded-2xl shadow-xl border border-[#E8DFD5] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Cabeçalho do Dropdown */}
          <div className="px-4 py-3.5 bg-[#FAF6F0] border-b border-[#E8DFD5] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-serif font-semibold text-[#3D332A] text-base">Notificações</span>
              {naoLidas > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#EADECF] text-[#5C4A38] font-medium">
                  {naoLidas} nova{naoLidas > 1 ? 's' : ''}
                </span>
              )}
            </div>
            {naoLidas > 0 && (
              <button
                onClick={marcarTodasComoLidas}
                className="text-xs text-[#A68A64] hover:text-[#5C4A38] font-medium flex items-center gap-1 hover:underline cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                Marcar lidas
              </button>
            )}
          </div>

          {/* Lista de Notificações */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-[#F2ECE4]">
            {notificacoes.length === 0 ? (
              <div className="p-8 text-center text-[#8C7D70]">
                <Sparkles className="w-8 h-8 mx-auto mb-2 text-[#C4A883]/60" />
                <p className="text-sm">Nenhuma notificação no momento.</p>
              </div>
            ) : (
              notificacoes.map(n => (
                <div
                  key={n.id}
                  className={`p-3.5 transition-colors relative flex items-start gap-3 ${
                    !n.lida ? getCorBorda(n.tipo) : 'bg-white hover:bg-[#FAF8F5]'
                  }`}
                >
                  <div className="mt-0.5 p-1.5 rounded-full bg-white shadow-xs border border-[#E8DFD5] shrink-0">
                    {getIcone(n.tipo)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-semibold text-[#3D332A] truncate">{n.titulo}</h4>
                      <span className="text-[10px] text-[#8C7D70] shrink-0">{formatarHora(n.data_hora)}</span>
                    </div>
                    <p className="text-xs text-[#5C4D40] mt-0.5 line-clamp-2 leading-relaxed">{n.mensagem}</p>
                  </div>
                  {!n.lida && (
                    <button
                      onClick={() => marcarComoLida(n.id)}
                      title="Marcar como lida"
                      className="p-1 text-[#8C7D70] hover:text-[#3D332A] rounded-full hover:bg-white/80 transition-colors shrink-0"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
