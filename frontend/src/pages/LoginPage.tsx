import React from 'react';
import { Logo } from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, UserCheck, CheckCircle2, Lock } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { loginComGoogle, carregando } = useAuth();

  return (
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Marca d'água de fundo */}
      <Logo watermark={true} className="absolute inset-0 m-auto" />

      {/* Card Principal de Login */}
      <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-[#E8DFD5] relative z-10 text-center animate-in fade-in zoom-in-95 duration-200">
        {/* Logo em Destaque Central */}
        <div className="flex justify-center mb-6">
          <Logo size="lg" showText={true} />
        </div>

        <div className="mb-8">
          <h2
            className="text-2xl font-semibold text-[#2D241E] font-serif"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Acesso ao Sistema
          </h2>
          <p className="text-xs text-[#7A6C60] mt-1.5 leading-relaxed">
            Painel institucional integrado para gestão clínica e agenda da Dra. Márcia Cristina.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* TODO: [INTEGRAÇÃO GOOGLE LOGIN API]                                       */}
        {/* Ponto de conexão para a API do Google Identity Services (GIS) / OAuth 2.0. */}
        {/* Em produção, inicializar google.accounts.id.initialize({ client_id: ... }) */}
        {/* e enviar o ID Token (JWT) retornado ao backend para validação.             */}
        {/* ========================================================================= */}
        <div className="space-y-3">
          <button
            disabled={carregando}
            onClick={() => loginComGoogle('admin')}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-[#C4A883] hover:bg-[#B39670] text-white rounded-2xl font-semibold text-sm shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {/* Ícone Google */}
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Entrar com Google (Dra. Márcia)</span>
          </button>

          {/* ========================================================================= */}
          {/* TODO: REMOVER EM PRODUÇÃO — Alternador de perfil para testes e navegação  */}
          {/* ========================================================================= */}
          <div className="pt-3 border-t border-[#F2ECE4]">
            <p className="text-[11px] text-[#8C7D70] mb-2 font-medium">Alternador de perfil para testes:</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => loginComGoogle('admin')}
                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-[#FAF6F0] hover:bg-[#F2ECE4] text-[#4A3F35] border border-[#E8DFD5] rounded-xl text-xs font-medium transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#C4A883]" />
                <span>Admin (Márcia)</span>
              </button>

              <button
                type="button"
                onClick={() => loginComGoogle('recepcionista')}
                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-[#FAF6F0] hover:bg-[#F2ECE4] text-[#4A3F35] border border-[#E8DFD5] rounded-xl text-xs font-medium transition-colors cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5 text-[#A68A64]" />
                <span>Recepção</span>
              </button>
            </div>
          </div>
        </div>

        {/* Badges de Segurança e Conformidade */}
        <div className="mt-8 pt-6 border-t border-[#F2ECE4] flex items-center justify-center gap-4 text-[11px] text-[#8C7D70]">
          <div className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-[#A68A64]" />
            <span>OAuth 2.0 Google</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-[#4E8752]" />
            <span>LGPD Compliance</span>
          </div>
        </div>
      </div>

      {/* Rodapé institucional */}
      <footer className="mt-8 text-center text-xs text-[#8C7D70] relative z-10">
        © {new Date().getFullYear()} MC Estética & Bem-Estar — Todos os direitos reservados.
      </footer>
    </div>
  );
};
