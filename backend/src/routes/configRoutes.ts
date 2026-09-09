import { Router, Response } from 'express';
import { InMemoryConfiguracaoRepository, InMemoryUsuarioRepository } from '../repositories/InMemoryStore';
import { ConfiguracaoService } from '../services/ConfiguracaoService';
import { AuthenticatedRequest, authenticate, requireRole } from '../middleware/auth';

const router = Router();

const configRepo = new InMemoryConfiguracaoRepository();
const usuarioRepo = new InMemoryUsuarioRepository();
const configService = new ConfiguracaoService(configRepo, usuarioRepo);

// Todas as rotas de configuração exigem papel de Administrador (Dra. Márcia)
router.use(authenticate, requireRole('admin'));

// GET /api/configuracoes/horarios - Lista horários de funcionamento por dia
router.get('/horarios', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const horarios = await configService.listarHorarios();
    res.json(horarios);
  } catch (error: any) {
    res.status(500).json({ erro: error.message });
  }
});

// POST /api/configuracoes/horarios - Salva horários de funcionamento
router.post('/horarios', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const salvos = await configService.salvarHorarios(req.body.horarios);
    res.json(salvos);
  } catch (error: any) {
    res.status(400).json({ erro: error.message });
  }
});

// GET /api/configuracoes/bloqueios - Lista datas bloqueadas
router.get('/bloqueios', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const bloqueios = await configService.listarBloqueios();
    res.json(bloqueios);
  } catch (error: any) {
    res.status(500).json({ erro: error.message });
  }
});

// POST /api/configuracoes/bloqueios - Adiciona bloqueio de data
router.post('/bloqueios', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data, motivo, dia_inteiro } = req.body;
    if (!data || !motivo) {
      return res.status(400).json({ erro: 'Data e motivo do bloqueio são obrigatórios.' });
    }
    const novo = await configService.criarBloqueio({ data, motivo, dia_inteiro });
    res.status(201).json(novo);
  } catch (error: any) {
    res.status(400).json({ erro: error.message });
  }
});

// DELETE /api/configuracoes/bloqueios/:id - Remove bloqueio
router.delete('/bloqueios/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const removido = await configService.removerBloqueio(req.params.id);
    res.json({ sucesso: removido });
  } catch (error: any) {
    res.status(500).json({ erro: error.message });
  }
});

// GET /api/configuracoes/usuarios - Lista usuários e recepcionistas
router.get('/usuarios', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const usuarios = await configService.listarUsuarios();
    res.json(usuarios);
  } catch (error: any) {
    res.status(500).json({ erro: error.message });
  }
});

// POST /api/configuracoes/usuarios - Cria nova conta de recepcionista
router.post('/usuarios', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { nome, email, role } = req.body;
    if (!nome || !email) {
      return res.status(400).json({ erro: 'Nome e e-mail são obrigatórios.' });
    }
    const novo = await configService.criarUsuario({ nome, email, role: role || 'recepcionista' });
    res.status(201).json(novo);
  } catch (error: any) {
    res.status(400).json({ erro: error.message });
  }
});

// DELETE /api/configuracoes/usuarios/:id - Remove usuário
router.delete('/usuarios/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const removido = await configService.removerUsuario(req.params.id);
    res.json({ sucesso: removido });
  } catch (error: any) {
    res.status(500).json({ erro: error.message });
  }
});

// GET /api/configuracoes/google-status - Status da conta institucional Google
router.get('/google-status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const status = await configService.obterStatusContaGoogle();
    res.json(status);
  } catch (error: any) {
    res.status(500).json({ erro: error.message });
  }
});

export default router;
