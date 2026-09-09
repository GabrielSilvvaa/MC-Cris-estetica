import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Notificacao } from '../types';
import { api } from '../services/api';

interface NotificationContextType {
  notificacoes: Notificacao[];
  naoLidas: number;
  webPushPermissao: NotificationPermission | 'unsupported';
  solicitarPermissaoWebPush: () => Promise<void>;
  carregarNotificacoes: () => Promise<void>;
  marcarComoLida: (id: string) => Promise<void>;
  marcarTodasComoLidas: () => Promise<void>;
  dispararNotificacaoNavegador: (titulo: string, mensagem: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [webPushPermissao, setWebPushPermissao] = useState<NotificationPermission | 'unsupported'>('default');

  // Verifica suporte à Web Push API
  useEffect(() => {
    if ('Notification' in window) {
      setWebPushPermissao(Notification.permission);
    } else {
      setWebPushPermissao('unsupported');
    }
  }, []);

  const carregarNotificacoes = useCallback(async () => {
    try {
      const data = await api.getNotificacoes();
      setNotificacoes(data);
    } catch (err) {
      console.warn('[NotificationContext] Falha ao carregar notificações da API.');
    }
  }, []);

  useEffect(() => {
    carregarNotificacoes();
    // Atualização periódica a cada 20 segundos
    const interval = setInterval(carregarNotificacoes, 20000);
    return () => clearInterval(interval);
  }, [carregarNotificacoes]);

  const dispararNotificacaoNavegador = (titulo: string, mensagem: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(titulo, {
          body: mensagem,
          icon: '/favicon.svg',
          badge: '/favicon.svg'
        });
      } catch (err) {
        console.warn('Erro ao disparar Web Push no navegador:', err);
      }
    }
  };

  const solicitarPermissaoWebPush = async () => {
    if (!('Notification' in window)) {
      alert('Seu navegador não suporta notificações Web Push.');
      return;
    }

    try {
      const permissao = await Notification.requestPermission();
      setWebPushPermissao(permissao);

      if (permissao === 'granted') {
        dispararNotificacaoNavegador(
          'MC Estética & Bem-Estar',
          'Notificações ativadas! Você receberá alertas de atendimentos e leads em tempo real.'
        );
      }
    } catch (err) {
      console.error('Erro ao solicitar permissão de Web Push:', err);
    }
  };

  const marcarComoLida = async (id: string) => {
    try {
      await api.marcarNotificacaoLida(id);
      setNotificacoes(prev =>
        prev.map(n => (n.id === id ? { ...n, lida: true } : n))
      );
    } catch (err) {
      console.error('Erro ao marcar notificação:', err);
    }
  };

  const marcarTodasComoLidas = async () => {
    try {
      await api.marcarTodasNotificacoesLidas();
      setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
    } catch (err) {
      console.error('Erro ao marcar todas notificações:', err);
    }
  };

  const naoLidas = notificacoes.filter(n => !n.lida).length;

  return (
    <NotificationContext.Provider
      value={{
        notificacoes,
        naoLidas,
        webPushPermissao,
        solicitarPermissaoWebPush,
        carregarNotificacoes,
        marcarComoLida,
        marcarTodasComoLidas,
        dispararNotificacaoNavegador
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications deve ser usado dentro de um NotificationProvider');
  }
  return context;
};
