import { Router, Response } from 'express';
import { InMemoryFAQRepository } from '../repositories/InMemoryStore';
import { FAQService } from '../services/FAQService';
import { AuthenticatedRequest, authenticate } from '../middleware/auth';

const router = Router();
const faqRepo = new InMemoryFAQRepository();
const faqService = new FAQService(faqRepo);

// GET /api/faq - Listagem de perguntas frequentes
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const categoria = req.query.categoria as string;
    const faqs = await faqService.listar(categoria);
    res.json(faqs);
  } catch (error: any) {
    res.status(500).json({ erro: error.message });
  }
});

// POST /api/faq - Cadastro de FAQ (Admin e Recepcionista)
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { pergunta, resposta, categoria } = req.body;
    if (!pergunta || !resposta) {
      return res.status(400).json({ erro: 'Pergunta e resposta são obrigatórias.' });
    }
    const novo = await faqService.criar({ pergunta, resposta, categoria });
    res.status(201).json(novo);
  } catch (error: any) {
    res.status(400).json({ erro: error.message });
  }
});

// PUT /api/faq/:id - Edição de FAQ (Admin e Recepcionista)
router.put('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const atualizado = await faqService.atualizar(req.params.id, req.body);
    if (!atualizado) return res.status(404).json({ erro: 'FAQ não encontrado.' });
    res.json(atualizado);
  } catch (error: any) {
    res.status(400).json({ erro: error.message });
  }
});

// DELETE /api/faq/:id - Exclusão de FAQ
router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const removido = await faqService.remover(req.params.id);
    res.json({ sucesso: removido });
  } catch (error: any) {
    res.status(500).json({ erro: error.message });
  }
});

export default router;
