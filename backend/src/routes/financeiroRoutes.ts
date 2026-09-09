import { Router, Response } from 'express';
import {
  InMemoryAtendimentoRepository,
  InMemoryClienteRepository,
  InMemoryProcedimentoRepository
} from '../repositories/InMemoryStore';
import { FinanceiroService } from '../services/FinanceiroService';
import { AuthenticatedRequest, authenticate, requireRole } from '../middleware/auth';

const router = Router();

const atendimentoRepo = new InMemoryAtendimentoRepository();
const clienteRepo = new InMemoryClienteRepository();
const procedimentoRepo = new InMemoryProcedimentoRepository();

const financeiroService = new FinanceiroService(
  atendimentoRepo,
  clienteRepo,
  procedimentoRepo
);

// GET /api/financeiro/relatorio - Faturamento e métricas consolidadas (SOMENTE ADMINISTRADOR)
router.get('/relatorio', authenticate, requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const periodo = (req.query.periodo as 'dia' | 'semana' | 'mes') || 'mes';
    const dataRef = req.query.data as string;
    const relatorio = await financeiroService.gerarRelatorioPeriodo(periodo, dataRef);
    res.json(relatorio);
  } catch (error: any) {
    res.status(500).json({ erro: error.message });
  }
});

// GET /api/financeiro/atendimentos - Listagem detalhada de pagamentos de atendimentos (SOMENTE ADMINISTRADOR)
router.get('/atendimentos', authenticate, requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { dataInicio, dataFim } = req.query as { dataInicio?: string; dataFim?: string };
    const atendimentos = await financeiroService.listarAtendimentosComPagamento(dataInicio, dataFim);
    res.json(atendimentos);
  } catch (error: any) {
    res.status(500).json({ erro: error.message });
  }
});

// POST /api/financeiro/pagamento - Registro ou atualização de pagamento de atendimento
// Recepcionista e Admin podem registrar pagamentos pontuais de sessões realizadas
router.post('/pagamento', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      atendimento_id,
      cliente_id,
      procedimento_id,
      profissional,
      data_hora,
      valor_cobrado,
      forma_pagamento,
      status_pagamento,
      observacoes_sessao
    } = req.body;

    if (!cliente_id || !procedimento_id || valor_cobrado === undefined || !forma_pagamento) {
      return res.status(400).json({
        erro: 'Campos obrigatórios: cliente_id, procedimento_id, valor_cobrado e forma_pagamento são necessários.'
      });
    }

    const atendimento = await financeiroService.registrarPagamento({
      atendimento_id,
      cliente_id,
      procedimento_id,
      profissional,
      data_hora,
      valor_cobrado: Number(valor_cobrado),
      forma_pagamento,
      status_pagamento: status_pagamento || 'pago',
      observacoes_sessao
    });

    res.status(201).json(atendimento);
  } catch (error: any) {
    res.status(400).json({ erro: error.message });
  }
});

export default router;
