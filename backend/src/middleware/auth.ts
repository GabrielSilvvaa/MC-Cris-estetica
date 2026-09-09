import { Request, Response, NextFunction } from 'express';
import { Usuario, UserRole } from '../types';
import { InMemoryUsuarioRepository } from '../repositories/InMemoryStore';

// Estende a interface Request do Express para carregar o usuário autenticado
export interface AuthenticatedRequest extends Request {
  usuario?: Usuario;
}

const usuarioRepository = new InMemoryUsuarioRepository();

/**
 * Middleware de Autenticação OAuth 2.0 / Sessão.
 * Em desenvolvimento/mock: Lê o cabeçalho 'x-user-id' ou 'Authorization',
 * ou assume a Dra. Márcia (admin) por padrão se não fornecido.
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userIdHeader = req.headers['x-user-id'] as string;
    const authHeader = req.headers['authorization'];

    let usuario: Usuario | null = null;

    if (userIdHeader) {
      usuario = await usuarioRepository.buscarPorId(userIdHeader);
    } else if (authHeader) {
      // Simulação de verificação de token JWT/OAuth do Google
      const token = authHeader.replace('Bearer ', '');
      if (token.includes('admin') || token === 'token_marcia') {
        usuario = await usuarioRepository.buscarPorId('user-admin-1');
      } else if (token.includes('recep') || token === 'token_camila') {
        usuario = await usuarioRepository.buscarPorId('user-recep-1');
      }
    }

    if (!usuario || !usuario.ativo) {
      res.status(401).json({ erro: 'Não autorizado. Token de autenticação ou cabeçalho x-user-id ausente ou inválido.' });
      return;
    }

    req.usuario = usuario;
    next();
  } catch (error) {
    res.status(500).json({ erro: 'Erro interno ao autenticar requisição.' });
  }
};

/**
 * Middleware RBAC: Exige um papel específico (ex: 'admin').
 */
export const requireRole = (allowedRoles: UserRole | UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.usuario) {
      res.status(401).json({ erro: 'Não autenticado.' });
      return;
    }

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (!roles.includes(req.usuario.role)) {
      res.status(403).json({
        erro: 'Acesso negado. Esta operação exige privilégios de ' + roles.join(' ou ') + '.'
      });
      return;
    }

    next();
  };
};
