import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { NotificationBell } from './NotificationBell';
import { BellRing, ShieldCheck, UserCheck, LogOut } from 'lucide-react';

interface HeaderProps {
  titulo: string;
  subtitulo?: string;
}

export const Header: React.FC<HeaderProps> = ({ titulo, subtitulo }) => {
  const { usuario, role, alternarPerfil, logout } = useAuth();
  const { webPushPermissao, solicitarPermissaoWebPush } = useNotifications();

  return (
    <header className="sticky top-0 z-30 bg-[#FAF6F0]/90 backdrop-blur-md border-b border-[#E8DFD5] px-6 py-3.5 flex items-center justify-between transition-all">
      {/* Título da Página com Toque Serif e Script */}
      <div>
        <h1
          className="text-2xl font-semibold text-[#2D241E] font-serif tracking-tight"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          {titulo}
        </h1>
        {subtitulo && (
          <p className="text-xs text-[#7A6C60] font-normal mt-0.5">
            {subtitulo}
          </p>
        )}
      </div>

      {/* Ações do Topo */}
      <div className="flex items-center gap-3.5">
        {/* Ativação do Web Push do Navegador */}
        {webPushPermissao !== 'granted' && (
          <button
            onClick={solicitarPermissaoWebPush}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#F5EFE6] hover:bg-[#EADECF] text-[#5C4A38] border border-[#C4A883]/50 rounded-full transition-all cursor-pointer shadow-2xs"
            title="Ativar notificações push no navegador"
          >
            <BellRing className="w-3.5 h-3.5 text-[#A68A64]" />
            <span>Ativar Push</span>
          </button>
        )}

        {/* Alternador Rápido de Perfil RBAC (Demonstração) */}
        <div className="flex items-center bg-white border border-[#E8DFD5] rounded-full p-1 shadow-2xs">
          <button
            onClick={() => alternarPerfil('admin')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
              role === 'admin'
                ? 'bg-[#C4A883] text-white shadow-xs font-semibold'
                : 'text-[#635345] hover:text-[#2D241E]'
            }`}
            title="Acessar como Administrador (Dra. Márcia)"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Admin (Dra. Márcia)</span>
            <span className="md:hidden">Admin</span>
          </button>

          <button
            onClick={() => alternarPerfil('recepcionista')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
              role === 'recepcionista'
                ? 'bg-[#C4A883] text-white shadow-xs font-semibold'
                : 'text-[#635345] hover:text-[#2D241E]'
            }`}
            title="Acessar como Recepcionista (Camila)"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Recepção</span>
            <span className="md:hidden">Recepção</span>
          </button>
        </div>

        {/* Sino de Notificações */}
        <NotificationBell />

        {/* Divisor */}
        <div className="h-6 w-px bg-[#E8DFD5]" />

        {/* Identificação de Perfil (Iniciais Neutras) */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#EADECF] text-[#4A3F35] font-bold text-xs flex items-center justify-center border border-[#C4A883]/60 shadow-2xs select-none">
            {role === 'admin' ? 'MC' : 'RC'}
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-semibold text-[#2D241E] leading-tight truncate max-w-[130px]">
              {usuario?.nome || (role === 'admin' ? 'Dra. Márcia Cristina' : 'Recepcionista')}
            </p>
            <span className="text-[10px] uppercase font-bold text-[#A68A64] tracking-wider">
              {role === 'admin' ? 'Administradora' : 'Recepcionista'}
            </span>
          </div>

          <button
            onClick={logout}
            className="p-2 text-[#7A6C60] hover:text-[#C25953] rounded-full hover:bg-white transition-colors cursor-pointer"
            title="Sair do sistema"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
