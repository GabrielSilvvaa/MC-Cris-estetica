import { Router, Response } from 'express';
import { InMemoryProcedimentoRepository } from '../repositories/InMemoryStore';
import { ProcedimentoService } from '../services/ProcedimentoService';
import { AuthenticatedRequest, authenticate, requireRole } from '../middleware/auth';

const router = Router();
const procedimentoRepo = new InMemoryProcedimentoRepository();
const procedimentoService = new ProcedimentoService(procedimentoRepo);

// GET /api/procedimentos - Listagem de procedimentos (visível para Admin e Recepcionista)
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const apenasAtivos = req.query.todos !== 'true';
    const procedimentos = await procedimentoService.listar(apenasAtivos);
    res.json(procedimentos);
  } catch (error: any) {
    res.status(500).json({ erro: error.message });
  }
});

// GET /api/procedimentos/:id
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const proc = await procedimentoService.buscarPorId(req.params.id);
    if (!proc) return res.status(404).json({ erro: 'Procedimento não encontrado.' });
    res.json(proc);
  } catch (error: any) {
    res.status(500).json({ erro: error.message });
  }
});

// POST /api/procedimentos - Cadastro (SOMENTE ADMINISTRADOR)
router.post('/', authenticate, requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { nome, descricao, preco_padrao } = req.body;
    if (!nome || preco_padrao === undefined) {
      return res.status(400).json({ erro: 'Nome e preço padrão são obrigatórios.' });
    }
    const novo = await procedimentoService.criar({ nome, descricao, preco_padrao: Number(preco_padrao) });
    res.status(201).json(novo);
  } catch (error: any) {
    res.status(400).json({ erro: error.message });
  }
});

// PUT /api/procedimentos/:id - Edição (SOMENTE ADMINISTRADOR)
router.put('/:id', authenticate, requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const atualizado = await procedimentoService.atualizar(req.params.id, req.body);
    if (!atualizado) return res.status(404).json({ erro: 'Procedimento não encontrado.' });
    res.json(atualizado);
  } catch (error: any) {
    res.status(400).json({ erro: error.message });
  }
});

// DELETE /api/procedimentos/:id - Exclusão (SOMENTE ADMINISTRADOR)
router.delete('/:id', authenticate, requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const removido = await procedimentoService.remover(req.params.id);
    res.json({ sucesso: removido });
  } catch (error: any) {
    res.status(500).json({ erro: error.message });
  }
});

export default router;
