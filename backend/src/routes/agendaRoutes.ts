import { Router, Response } from 'express';
import {
  InMemoryAgendamentoRepository,
  InMemoryCancelamentoRepository,
  InMemoryConfiguracaoRepository,
  InMemoryClienteRepository,
  InMemoryProcedimentoRepository,
  InMemoryNotificacaoRepository
} from '../repositories/InMemoryStore';
import { AgendamentoService } from '../services/AgendamentoService';
import { AuthenticatedRequest, authenticate } from '../middleware/auth';

const router = Router();

const agendamentoRepo = new InMemoryAgendamentoRepository();
const cancelamentoRepo = new InMemoryCancelamentoRepository();
const configRepo = new InMemoryConfiguracaoRepository();
const clienteRepo = new InMemoryClienteRepository();
const procedimentoRepo = new InMemoryProcedimentoRepository();
const notificacaoRepo = new InMemoryNotificacaoRepository();

const agendamentoService = new AgendamentoService(
  agendamentoRepo,
  cancelamentoRepo,
  configRepo,
  clienteRepo,
  procedimentoRepo,
  notificacaoRepo
);

// GET /api/agenda - Listagem de agendamentos
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { dataInicio, dataFim } = req.query as { dataInicio?: string; dataFim?: string };
    const agendamentos = await agendamentoRepo.listar(dataInicio, dataFim);

    // Enriquecer com dados do cliente e procedimento
    const enriquecidos = [];
    for (const a of agendamentos) {
      const cliente = await clienteRepo.buscarPorId(a.cliente_id);
      const procedimento = await procedimentoRepo.buscarPorId(a.procedimento_id);
      enriquecidos.push({
        ...a,
        cliente_nome: cliente?.nome || 'Cliente',
        cliente_telefone: cliente?.telefone || '',
        procedimento_nome: procedimento?.nome || 'Procedimento'
      });
    }

    res.json(enriquecidos);
  } catch (error: any) {
    res.status(500).json({ erro: error.message });
  }
});

// POST /api/agenda - Criação de agendamento (2h fixas)
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const novo = await agendamentoService.criarAgendamento(req.body);
    res.status(201).json(novo);
  } catch (error: any) {
    res.status(400).json({ erro: error.message });
  }
});

// POST /api/agenda/:id/cancelar - Cancelamento com motivo e regra de 48h
router.post('/:id/cancelar', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { motivo } = req.body;
    const resultado = await agendamentoService.cancelarAgendamento(req.params.id, motivo);
    res.json(resultado);
  } catch (error: any) {
    res.status(400).json({ erro: error.message });
  }
});

// GET /api/agenda/alertas-proximos - Lembretes de atendimentos próximos (Dashboard)
router.get('/alertas-proximos', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const proximos = await agendamentoService.obterAtendimentosProximos();
    res.json(proximos);
  } catch (error: any) {
    res.status(500).json({ erro: error.message });
  }
});

// GET /api/agenda/cancelamentos-tardios - Cancelamentos tardios recentes (Dashboard)
router.get('/cancelamentos-tardios', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tardios = await agendamentoService.obterCancelamentosTardiosRecentes();
    res.json(tardios);
  } catch (error: any) {
    res.status(500).json({ erro: error.message });
  }
});

// GET /api/agenda/disponibilidade - Consulta de horários livres do dia (usado também pelo Bot)
router.get('/disponibilidade', async (req, res) => {
  try {
    const data = req.query.data as string;
    if (!data) {
      return res.status(400).json({ erro: 'O parâmetro data (YYYY-MM-DD) é obrigatório.' });
    }
    const disponibilidade = await agendamentoService.obterDisponibilidadeDia(data);
    res.json(disponibilidade);
  } catch (error: any) {
    res.status(500).json({ erro: error.message });
  }
});

export default router;
