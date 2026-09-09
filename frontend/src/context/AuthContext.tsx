import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Usuario, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  usuario: Usuario | null;
  role: UserRole;
  isAdmin: boolean;
  isRecepcionista: boolean;
  carregando: boolean;
  loginComGoogle: (role?: UserRole) => Promise<void>;
  alternarPerfil: (novaRole: UserRole) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState<boolean>(true);

  const carregarUsuario = async () => {
    try {
      setCarregando(true);
      const token = localStorage.getItem('mc_auth_token');
      const userId = localStorage.getItem('mc_user_id');

      if (!token || !userId) {
        setUsuario(null);
        return;
      }

      const res = await api.getMe();
      setUsuario(res.usuario);
    } catch (err) {
      console.warn('[AuthContext] Sessão não encontrada ou expirada.');
      setUsuario(null);
      localStorage.removeItem('mc_auth_token');
      localStorage.removeItem('mc_user_id');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarUsuario();
  }, []);

  const loginComGoogle = async (role: UserRole = 'admin') => {
    try {
      setCarregando(true);
      const res = await api.loginGoogle(role);
      setUsuario(res.usuario);
      localStorage.setItem('mc_auth_token', res.token);
      localStorage.setItem('mc_user_id', res.usuario.id);
    } catch (err: any) {
      console.error('Erro no login:', err);
    } finally {
      setCarregando(false);
    }
  };

  const alternarPerfil = async (novaRole: UserRole) => {
    try {
      setCarregando(true);
      const res = await api.alternarPerfil(novaRole);
      setUsuario(res.usuario);
      localStorage.setItem('mc_auth_token', res.token);
      localStorage.setItem('mc_user_id', res.usuario.id);
    } catch (err: any) {
      console.error('Erro ao alternar perfil:', err);
    } finally {
      setCarregando(false);
    }
  };

  const logout = () => {
    setUsuario(null);
    localStorage.removeItem('mc_auth_token');
    localStorage.removeItem('mc_user_id');
  };

  const role = usuario?.role || 'admin';
  const isAdmin = role === 'admin';
  const isRecepcionista = role === 'recepcionista';

  return (
    <AuthContext.Provider
      value={{
        usuario,
        role,
        isAdmin,
        isRecepcionista,
        carregando,
        loginComGoogle,
        alternarPerfil,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
