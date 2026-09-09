import { Router, Response } from 'express';
import { InMemoryLeadRepository, InMemoryNotificacaoRepository } from '../repositories/InMemoryStore';
import { LeadService } from '../services/LeadService';
import { AuthenticatedRequest, authenticate } from '../middleware/auth';

const router = Router();
const leadRepo = new InMemoryLeadRepository();
const notifRepo = new InMemoryNotificacaoRepository();
const leadService = new LeadService(leadRepo, notifRepo);

// GET /api/leads - Lista leads recebidos hoje e por data
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = req.query.data as string;
    const leads = await leadService.listarLeads(data);
    res.json(leads);
  } catch (error: any) {
    res.status(500).json({ erro: error.message });
  }
});

export default router;
