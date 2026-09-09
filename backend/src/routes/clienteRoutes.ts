import { Router, Response } from 'express';
import {
  InMemoryClienteRepository,
  InMemoryAnamneseRepository,
  InMemoryAtendimentoRepository,
  InMemoryAgendamentoRepository,
  InMemoryCancelamentoRepository,
  InMemorySolicitacaoLGPDRepository,
  InMemoryNotificacaoRepository
} from '../repositories/InMemoryStore';
import { ClienteService } from '../services/ClienteService';
import { AuthenticatedRequest, authenticate, requireRole } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

const clienteRepo = new InMemoryClienteRepository();
const anamneseRepo = new InMemoryAnamneseRepository();
const atendimentoRepo = new InMemoryAtendimentoRepository();
const agendamentoRepo = new InMemoryAgendamentoRepository();
const cancelamentoRepo = new InMemoryCancelamentoRepository();
const solicitacaoLGPDRepo = new InMemorySolicitacaoLGPDRepository();
const notifRepo = new InMemoryNotificacaoRepository();

const clienteService = new ClienteService(
  clienteRepo,
  anamneseRepo,
  atendimentoRepo,
  agendamentoRepo,
  cancelamentoRepo
);

// GET /api/clientes - Lista de clientes com filtro e métricas
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const filtro = req.query.busca as string;
    const clientes = await clienteService.listarClientes(filtro);
    res.json(clientes);
  } catch (error: any) {
    res.status(500).json({ erro: error.message });
  }
});

// GET /api/clientes/lgpd-solicitacoes - Fila de solicitações LGPD (Exportação / Exclusão)
router.get('/lgpd-solicitacoes', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const status = req.query.status as any;
    const solicitacoes = await solicitacaoLGPDRepo.listar(status);
    res.json(solicitacoes);
  } catch (error: any) {
    res.status(500).json({ erro: error.message });
  }
});

// GET /api/clientes/:id - Ficha completa do cliente (Dados, Anamnese, Histórico com Fotos, Tags Tardias, LGPD)
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ficha = await clienteService.obterFichaCompleta(req.params.id);
    res.json(ficha);
  } catch (error: any) {
    res.status(404).json({ erro: error.message });
  }
});

// POST /api/clientes - Cadastro de novo cliente
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const novo = await clienteService.criarCliente(req.body);
    res.status(201).json(novo);
  } catch (error: any) {
    res.status(400).json({ erro: error.message });
  }
});

// PUT /api/clientes/:id - Atualização de dados cadastrais
router.put('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const atualizado = await clienteService.atualizarCliente(req.params.id, req.body);
    if (!atualizado) return res.status(404).json({ erro: 'Cliente não encontrado.' });
    res.json(atualizado);
  } catch (error: any) {
    res.status(400).json({ erro: error.message });
  }
});

// POST /api/clientes/:id/anamnese - Salva ou atualiza a Anamnese da cliente
router.post('/:id/anamnese', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const anamnese = await clienteService.salvarAnamnese({
      cliente_id: req.params.id,
      ...req.body
    });
    res.json(anamnese);
  } catch (error: any) {
    res.status(400).json({ erro: error.message });
  }
});

// POST /api/clientes/:id/lgpd-solicitar - Recepcionista ou Admin registra pedido LGPD que entra na fila para aprovação
router.post('/:id/lgpd-solicitar', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tipo, motivo } = req.body;
    if (!tipo || (tipo !== 'exportacao' && tipo !== 'exclusao')) {
      return res.status(400).json({ erro: 'Tipo de solicitação inválido. Escolha exportacao ou exclusao.' });
    }

    const cliente = await clienteRepo.buscarPorId(req.params.id);
    if (!cliente) return res.status(404).json({ erro: 'Cliente não encontrado.' });

    const solicitanteNome = req.usuario?.nome || 'Recepção';

    const solicitacao = await solicitacaoLGPDRepo.salvar({
      id: `solic-${uuidv4()}`,
      cliente_id: cliente.id,
      cliente_nome: cliente.nome,
      cliente_telefone: cliente.telefone,
      tipo,
      status: 'pendente',
      motivo: motivo || (tipo === 'exportacao' ? 'Solicitação de cópia de prontuário/dados.' : 'Solicitação de revogação/esquecimento LGPD.'),
      solicitado_por: solicitanteNome,
      data_solicitacao: new Date().toISOString()
    });

    // Dispara notificação interna para a Dra. Márcia (Admin)
    await notifRepo.salvar({
      id: `notif-lgpd-${Date.now()}`,
      tipo: 'novo_lead',
      titulo: `Solicitação LGPD: ${tipo === 'exportacao' ? 'Exportação' : 'Exclusão'}`,
      mensagem: `${solicitanteNome} registrou pedido de ${tipo} de dados da cliente ${cliente.nome}. Aguarda aprovação da Dra. Márcia.`,
      data_hora: new Date().toISOString(),
      lida: false,
      meta: { cliente_id: cliente.id }
    });

    res.status(201).json({
      sucesso: true,
      mensagem: `Solicitação de ${tipo} registrada na fila com sucesso. A Dra. Márcia foi notificada para aprovação.`,
      solicitacao
    });
  } catch (error: any) {
    res.status(500).json({ erro: error.message });
  }
});

// GET /api/clientes/:id/lgpd-exportar - Exporta o dossiê completo de dados (SOMENTE ADMINISTRADOR / DRA. MÁRCIA)
router.get('/:id/lgpd-exportar', authenticate, requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dados = await clienteService.exportarDadosCompletosLGPD(req.params.id);

    // Marca eventuais solicitações pendentes como concluídas
    const solicitacoes = await solicitacaoLGPDRepo.listar('pendente');
    const sol = solicitacoes.find(s => s.cliente_id === req.params.id && s.tipo === 'exportacao');
    if (sol) {
      await solicitacaoLGPDRepo.atualizar(sol.id, {
        status: 'concluida',
        data_conclusao: new Date().toISOString(),
        concluido_por: req.usuario?.nome || 'Dra. Márcia Cristina'
      });
    }

    res.json(dados);
  } catch (error: any) {
    res.status(500).json({ erro: error.message });
  }
});

// DELETE /api/clientes/:id/lgpd-excluir - Exclusão completa do cliente (SOMENTE ADMINISTRADOR / DRA. MÁRCIA)
router.delete('/:id/lgpd-excluir', authenticate, requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const excluido = await clienteService.excluirClienteCompletoLGPD(req.params.id);

    // Atualiza solicitação na fila
    const solicitacoes = await solicitacaoLGPDRepo.listar('pendente');
    const sol = solicitacoes.find(s => s.cliente_id === req.params.id && s.tipo === 'exclusao');
    if (sol) {
      await solicitacaoLGPDRepo.atualizar(sol.id, {
        status: 'concluida',
        data_conclusao: new Date().toISOString(),
        concluido_por: req.usuario?.nome || 'Dra. Márcia Cristina'
      });
    }

    res.json({
      sucesso: true,
      mensagem: 'Todos os dados pessoais e clínicos do cliente foram permanentemente excluídos conforme a LGPD.'
    });
  } catch (error: any) {
    res.status(500).json({ erro: error.message });
  }
});

export default router;
