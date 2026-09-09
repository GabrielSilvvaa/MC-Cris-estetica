import { Router, Request, Response } from 'express';
import {
  InMemoryClienteRepository,
  InMemoryAnamneseRepository,
  InMemoryAtendimentoRepository,
  InMemoryAgendamentoRepository,
  InMemoryCancelamentoRepository,
  InMemoryNotificacaoRepository
} from '../repositories/InMemoryStore';
import { ClienteService } from '../services/ClienteService';

const router = Router();

const clienteRepo = new InMemoryClienteRepository();
const anamneseRepo = new InMemoryAnamneseRepository();
const atendimentoRepo = new InMemoryAtendimentoRepository();
const agendamentoRepo = new InMemoryAgendamentoRepository();
const cancelamentoRepo = new InMemoryCancelamentoRepository();
const notifRepo = new InMemoryNotificacaoRepository();

const clienteService = new ClienteService(
  clienteRepo,
  anamneseRepo,
  atendimentoRepo,
  agendamentoRepo,
  cancelamentoRepo
);

// GET /api/consentimento/:clienteId - Consulta pública do status e dados para assinatura (sem login)
router.get('/:clienteId', async (req: Request, res: Response) => {
  try {
    const cliente = await clienteRepo.buscarPorId(req.params.clienteId);
    if (!cliente) {
      return res.status(404).json({ erro: 'Cliente ou link de termo não encontrado.' });
    }

    res.json({
      cliente_id: cliente.id,
      nome: cliente.nome,
      telefone: cliente.telefone,
      email: cliente.email,
      status_consentimento: cliente.status_lgpd_consentimento,
      data_consentimento: cliente.data_consentimento || null,
      url_termo_assinado: cliente.url_termo_assinado || null,
      termos_texto: {
        titulo: 'TERMO DE CONSENTIMENTO LIVRE, ESCLARECIDO E TRATAMENTO DE DADOS PESSOAIS (LGPD)',
        controlador: 'MC Estética & Bem-Estar — Dra. Márcia Cristina',
        finalidade: 'Realização de procedimentos estéticos, anamnese de saúde e acompanhamento fotográfico evolutivo.',
        direitos: 'A titular pode revogar seu consentimento, solicitar a exportação completa ou a exclusão de seus dados a qualquer momento junto à equipe da clínica.',
        retencao: 'Os dados clínicos são retidos pelo período regulamentar e legalmente previsto de até 5 anos.'
      }
    });
  } catch (error: any) {
    res.status(500).json({ erro: error.message });
  }
});

// POST /api/consentimento/:clienteId/assinar - Assinatura digital da cliente via canvas/touch (sem login)
router.post('/:clienteId/assinar', async (req: Request, res: Response) => {
  try {
    const { assinaturaBase64 } = req.body;
    if (!assinaturaBase64) {
      return res.status(400).json({ erro: 'A assinatura digital gráfica é obrigatória.' });
    }

    const clienteAtualizado = await clienteService.registrarConsentimentoLGPD(
      req.params.clienteId,
      assinaturaBase64
    );

    // Notifica equipe no painel
    await notifRepo.salvar({
      id: `notif-lgpd-${Date.now()}`,
      tipo: 'novo_lead',
      titulo: 'Termo LGPD Assinado',
      mensagem: `${clienteAtualizado.nome} assinou digitalmente o termo de consentimento LGPD.`,
      data_hora: new Date().toISOString(),
      lida: false,
      meta: { cliente_id: clienteAtualizado.id }
    });

    res.json({
      sucesso: true,
      mensagem: 'Termo assinado e registrado com sucesso!',
      cliente: clienteAtualizado
    });
  } catch (error: any) {
    res.status(400).json({ erro: error.message });
  }
});

export default router;
