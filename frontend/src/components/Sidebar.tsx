import React from 'react';
import { Logo } from './Logo';
import { useAuth } from '../context/AuthContext';
import {
  BellRing,
  Calendar,
  Users,
  Sparkles,
  DollarSign,
  Settings,
  Lock,
  HeartHandshake
} from 'lucide-react';

export type PageId =
  | 'dashboard'
  | 'agenda'
  | 'clientes'
  | 'procedimentos'
  | 'financeiro'
  | 'configuracoes';

interface SidebarProps {
  paginaAtual: PageId;
  onSelecionarPagina: (pagina: PageId) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ paginaAtual, onSelecionarPagina }) => {
  const { isAdmin, role } = useAuth();

  const menuItems: {
    id: PageId;
    label: string;
    icone: React.ReactNode;
    apenasAdmin?: boolean;
    descricao?: string;
  }[] = [
    {
      id: 'dashboard',
      label: 'Alertas & Notificações',
      icone: <BellRing className="w-4 h-4" />,
      descricao: 'Lembretes e cancelamentos tardios'
    },
    {
      id: 'agenda',
      label: 'Agenda de Atendimentos',
      icone: <Calendar className="w-4 h-4" />,
      descricao: 'Google Calendar (2h fixas)'
    },
    {
      id: 'clientes',
      label: 'Fichas de Clientes',
      icone: <Users className="w-4 h-4" />,
      descricao: 'Anamnese, fotos & LGPD'
    },
    {
      id: 'procedimentos',
      label: 'Procedimentos',
      icone: <Sparkles className="w-4 h-4" />,
      descricao: 'Gestão de procedimentos e valores'
    },
    {
      id: 'financeiro',
      label: 'Painel Financeiro',
      icone: <DollarSign className="w-4 h-4" />,
      apenasAdmin: true,
      descricao: 'Faturamento e relatórios'
    },
    {
      id: 'configuracoes',
      label: 'Configurações',
      icone: <Settings className="w-4 h-4" />,
      apenasAdmin: true,
      descricao: 'Horários, bloqueios e Google'
    }
  ];

  return (
    <aside className="w-72 bg-[#FFFFFF] border-r border-[#E8DFD5] flex flex-col justify-between shrink-0 min-h-screen select-none shadow-xs">
      <div>
        {/* Cabeçalho com Logo da Clínica */}
        <div className="p-6 border-b border-[#F2ECE4]">
          <Logo size="sm" showText={true} />
        </div>

        {/* Menu de Navegação */}
        <nav className="p-3.5 space-y-1.5">
          <p className="px-3 py-1.5 text-[11px] font-bold text-[#A68A64] uppercase tracking-wider">
            Menu Principal
          </p>

          {menuItems.map(item => {
            const isRestrito = item.apenasAdmin && !isAdmin;
            const isAtivo = paginaAtual === item.id;

            return (
              <button
                key={item.id}
                disabled={isRestrito}
                onClick={() => !isRestrito && onSelecionarPagina(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all text-left ${
                  isAtivo
                    ? 'bg-[#C4A883] text-white shadow-xs font-semibold'
                    : isRestrito
                    ? 'text-[#AFA499] bg-[#FAF8F5]/50 cursor-not-allowed opacity-60'
                    : 'text-[#4A3F35] hover:bg-[#FAF6F0] hover:text-[#2D241E] cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`p-1.5 rounded-lg shrink-0 ${
                      isAtivo
                        ? 'bg-white/20 text-white'
                        : isRestrito
                        ? 'text-[#B8AEA3]'
                        : 'bg-[#FAF6F0] text-[#A68A64]'
                    }`}
                  >
                    {item.icone}
                  </div>
                  <div className="truncate">
                    <div className="truncate">{item.label}</div>
                  </div>
                </div>

                {isRestrito && (
                  <span
                    className="flex items-center gap-1 text-[10px] bg-[#E8DFD5]/60 text-[#7A6C60] px-1.5 py-0.5 rounded-md font-normal"
                    title="Acesso exclusivo da Dra. Márcia (Administradora)"
                  >
                    <Lock className="w-2.5 h-2.5" />
                    Admin
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Rodapé com Card de Status Institucional */}
      <div className="p-4 m-3.5 rounded-2xl bg-[#FAF6F0] border border-[#E8DFD5]">
        <div className="flex items-center gap-2 mb-1.5">
          <HeartHandshake className="w-4 h-4 text-[#C4A883]" />
          <span className="text-xs font-semibold text-[#3D332A]">MC Estética & Bem-Estar</span>
        </div>
        <p className="text-[11px] text-[#7A6C60] leading-relaxed">
          Ambiente em conformidade com a <span className="font-semibold text-[#5C4A38]">LGPD</span> e integrado à Google Agenda da clínica.
        </p>
        <div className="mt-2.5 pt-2 border-t border-[#E8DFD5]/70 flex items-center justify-between text-[10px] text-[#8C7D70]">
          <span>Perfil Ativo:</span>
          <span className="font-bold text-[#5C4A38] bg-white px-2 py-0.5 rounded-full border border-[#E8DFD5]">
            {role === 'admin' ? 'Dra. Márcia' : 'Recepção'}
          </span>
        </div>
      </div>
    </aside>
  );
};
