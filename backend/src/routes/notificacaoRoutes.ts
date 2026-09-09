import { Router, Response } from 'express';
import { InMemoryNotificacaoRepository } from '../repositories/InMemoryStore';
import { NotificacaoService } from '../services/NotificacaoService';
import { AuthenticatedRequest, authenticate } from '../middleware/auth';

const router = Router();
const notifRepo = new InMemoryNotificacaoRepository();
const notifService = new NotificacaoService(notifRepo);

// GET /api/notificacoes - Lista de notificações do sino
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const apenasNaoLidas = req.query.naoLidas === 'true';
    const notificacoes = await notifService.listar(apenasNaoLidas);
    res.json(notificacoes);
  } catch (error: any) {
    res.status(500).json({ erro: error.message });
  }
});

// PUT /api/notificacoes/:id/lida - Marca notificação específica como lida
router.put('/:id/lida', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await notifService.marcarComoLida(req.params.id);
    res.json({ sucesso: true });
  } catch (error: any) {
    res.status(500).json({ erro: error.message });
  }
});

// PUT /api/notificacoes/marcar-todas-lidas - Marca todas as notificações como lidas
router.put('/marcar-todas-lidas', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await notifService.marcarTodasComoLidas();
    res.json({ sucesso: true });
  } catch (error: any) {
    res.status(500).json({ erro: error.message });
  }
});

export default router;
