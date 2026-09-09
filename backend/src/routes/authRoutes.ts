import { Router, Response } from 'express';
import { InMemoryUsuarioRepository } from '../repositories/InMemoryStore';
import { AuthenticatedRequest, authenticate } from '../middleware/auth';

const router = Router();
const usuarioRepo = new InMemoryUsuarioRepository();

// GET /api/auth/me - Retorna o usuário logado atualmente
router.get('/me', authenticate, (req: AuthenticatedRequest, res: Response) => {
  res.json({ usuario: req.usuario });
});

// ============================================================================
// TODO: [INTEGRAÇÃO GOOGLE LOGIN API]
// Ponto de integração com a API Google OAuth 2.0 / Google Identity Services (GIS).
// Em produção, validar o Google ID Token (JWT) recebido do frontend via
// google-auth-library (OAuth2Client.verifyIdToken) e buscar/provisionar o usuário.
//
// TODO: REMOVER EM PRODUÇÃO — Endpoint de simulação de login para testes locais de RBAC.
// ============================================================================
router.post('/login-google', async (req, res) => {
  try {
    const { role, email } = req.body;

    let usuario = null;
    if (email) {
      usuario = await usuarioRepo.buscarPorEmail(email);
    }

    if (!usuario) {
      const targetRole = role === 'recepcionista' ? 'recepcionista' : 'admin';
      const usuarios = await usuarioRepo.listar();
      usuario = usuarios.find(u => u.role === targetRole) || usuarios[0];
    }

    res.json({
      token: `token_${usuario.role}_${Date.now()}`,
      usuario
    });
  } catch (error: any) {
    res.status(500).json({ erro: error.message });
  }
});

// ============================================================================
// TODO: REMOVER EM PRODUÇÃO — Endpoint de alternador de perfil exclusivo para validação e testes locais de RBAC.
// Nunca deve ser exposto no ambiente produtivo real.
// ============================================================================
router.post('/alternar-perfil', async (req, res) => {
  try {
    const { role } = req.body;
    const usuarios = await usuarioRepo.listar();
    const usuario = usuarios.find(u => u.role === role) || usuarios[0];

    res.json({
      token: `token_${usuario.role}_${Date.now()}`,
      usuario
    });
  } catch (error: any) {
    res.status(500).json({ erro: error.message });
  }
});

export default router;
