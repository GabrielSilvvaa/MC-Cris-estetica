import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Sidebar } from './components/Sidebar';
import type { PageId } from './components/Sidebar';
import { Header } from './components/Header';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { AgendaPage } from './pages/AgendaPage';
import { ClientesPage } from './pages/ClientesPage';
import { ProcedimentosFaqPage } from './pages/ProcedimentosFaqPage';
import { FinanceiroPage } from './pages/FinanceiroPage';
import { ConfiguracoesPage } from './pages/ConfiguracoesPage';
import { TermoConsentimentoPublicoPage } from './pages/TermoConsentimentoPublicoPage';

const AppContent: React.FC = () => {
  const { usuario, carregando } = useAuth();
  const [paginaAtual, setPaginaAtual] = useState<PageId>('dashboard');

  // Detecta se é uma rota pública de Termo de Consentimento LGPD via hash ou search
  const [termoClienteId, setTermoClienteId] = useState<string | null>(null);

  useEffect(() => {
    const checkPublicRoute = () => {
      const hash = window.location.hash;
      const search = window.location.search;

      if (hash.includes('termo=')) {
        const id = hash.split('termo=')[1]?.split('&')[0];
        setTermoClienteId(id || 'cli-1');
      } else if (search.includes('termo=')) {
        const params = new URLSearchParams(search);
        setTermoClienteId(params.get('termo') || 'cli-1');
      } else {
        setTermoClienteId(null);
      }
    };

    checkPublicRoute();
    window.addEventListener('hashchange', checkPublicRoute);
    return () => window.removeEventListener('hashchange', checkPublicRoute);
  }, []);

  // Se for a rota pública do termo de consentimento LGPD
  if (termoClienteId) {
    return <TermoConsentimentoPublicoPage clienteId={termoClienteId} />;
  }

  // Carregamento de autenticação
  if (carregando) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-[#7A6C60]">
          <div className="w-8 h-8 border-3 border-[#C4A883] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-semibold">Carregando MC Estética...</span>
        </div>
      </div>
    );
  }

  // Se não estiver logado, exibe tela de login
  if (!usuario) {
    return <LoginPage />;
  }

  // Título e subtítulo dinâmicos do cabeçalho
  const getInfoPagina = (): { titulo: string; subtitulo: string } => {
    switch (paginaAtual) {
      case 'dashboard':
        return {
          titulo: 'Alertas & Lembretes',
          subtitulo: 'Avisos imediatos de atendimentos e monitoramento de cancelamentos tardios (< 48h)'
        };
      case 'agenda':
        return {
          titulo: 'Agenda de Atendimentos',
          subtitulo: 'Sincronizada com Google Agenda institucional — Duração fixa de 2 horas por sessão'
        };
      case 'clientes':
        return {
          titulo: 'Clientes & Anamneses',
          subtitulo: 'Fichas completas, acompanhamento de sessões e gestão de solicitações LGPD'
        };
      case 'procedimentos':
        return {
          titulo: 'Procedimentos',
          subtitulo: 'Tabela oficial de procedimentos e valores da clínica'
        };
      case 'financeiro':
        return {
          titulo: 'Painel Financeiro',
          subtitulo: 'Relatório consolidado de faturamento e registro de pagamentos (Exclusivo Admin)'
        };
      case 'configuracoes':
        return {
          titulo: 'Configurações da Clínica',
          subtitulo: 'Horários de funcionamento, bloqueios da agenda, usuários e credenciais Google'
        };
      default:
        return {
          titulo: 'Painel de Gestão',
          subtitulo: 'MC Estética & Bem-Estar — Dra. Márcia Cristina'
        };
    }
  };

  const { titulo, subtitulo } = getInfoPagina();

  return (
    <div className="flex min-h-screen bg-[#FAF6F0] text-[#4A3F35]">
      {/* Menu Lateral Fixo */}
      <Sidebar
        paginaAtual={paginaAtual}
        onSelecionarPagina={(novaPagina) => setPaginaAtual(novaPagina)}
      />

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Cabeçalho Sticky */}
        <Header titulo={titulo} subtitulo={subtitulo} />

        {/* Área de Visualização da Tela Selecionada */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {paginaAtual === 'dashboard' && <DashboardPage />}
          {paginaAtual === 'agenda' && <AgendaPage />}
          {paginaAtual === 'clientes' && <ClientesPage />}
          {paginaAtual === 'procedimentos' && <ProcedimentosFaqPage />}
          {paginaAtual === 'financeiro' && <FinanceiroPage />}
          {paginaAtual === 'configuracoes' && <ConfiguracoesPage />}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  );
}
