import { Router, Request, Response } from 'express';
import {
  InMemoryLeadRepository,
  InMemoryNotificacaoRepository,
  InMemoryAgendamentoRepository,
  InMemoryCancelamentoRepository,
  InMemoryConfiguracaoRepository,
  InMemoryClienteRepository,
  InMemoryProcedimentoRepository
} from '../repositories/InMemoryStore';

import { LeadService } from '../services/LeadService';
import { AgendamentoService } from '../services/AgendamentoService';
import { requireBotAuth } from '../middleware/botAuth';
import { WhatsAppBotIntegration } from '../integrations/whatsappBot';

const router = Router();

const leadRepo = new InMemoryLeadRepository();
const notifRepo = new InMemoryNotificacaoRepository();
const agendamentoRepo = new InMemoryAgendamentoRepository();
const cancelamentoRepo = new InMemoryCancelamentoRepository();
const configRepo = new InMemoryConfiguracaoRepository();
const clienteRepo = new InMemoryClienteRepository();
const procedimentoRepo = new InMemoryProcedimentoRepository();

const leadService = new LeadService(leadRepo, notifRepo);
const agendamentoService = new AgendamentoService(
  agendamentoRepo,
  cancelamentoRepo,
  configRepo,
  clienteRepo,
  procedimentoRepo,
  notifRepo
);

// ============================================================================
// TODO: [INTEGRAÇÃO WHATSAPP/BOT]
// Endpoint: POST /api/bot/leads (ou /api/leads)
// Payload esperado: { nome, telefone, procedimento_interesse, orcamento_estimado, data_recebimento }
// Responsabilidade: persistir o lead via repository e disparar notificação interna (push + sino)
// Autenticação: token de serviço fixo (x-bot-service-token)
// ============================================================================
router.post('/leads', requireBotAuth, async (req: Request, res: Response) => {
  try {
    const { nome, telefone, procedimento_interesse, orcamento_estimado, data_recebimento } = req.body;

    if (!nome || !telefone || !procedimento_interesse) {
      return res.status(400).json({
        erro: 'Campos obrigatórios ausentes: nome, telefone e procedimento_interesse são necessários.'
      });
    }

    const leadSalvo = await leadService.receberLeadDoBot({
      nome,
      telefone,
      procedimento_interesse,
      orcamento_estimado: Number(orcamento_estimado) || 0,
      data_recebimento
    });

    res.status(201).json({
      sucesso: true,
      mensagem: 'Lead recebido com sucesso e notificação interna disparada para a equipe.',
      lead: leadSalvo
    });
  } catch (error: any) {
    res.status(500).json({ erro: error.message });
  }
});

// ============================================================================
// TODO: [INTEGRAÇÃO WHATSAPP/BOT]
// Endpoint: GET /api/bot/agenda/disponibilidade?data=YYYY-MM-DD
// Responsabilidade: retornar horários livres do dia, considerando horário de funcionamento,
// bloqueios de data e duração fixa de 2h por atendimento.
// ============================================================================
router.get('/agenda/disponibilidade', requireBotAuth, async (req: Request, res: Response) => {
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

// ============================================================================
// TODO: [INTEGRAÇÃO WHATSAPP/BOT]
// Endpoint: POST /api/bot/lembretes/disparar (chamado por job agendado interno)
// Responsabilidade: notificar serviço externo do bot para envio de lembrete 24h antes
// de cada atendimento confirmado. Também dispara notificação interna no painel.
// ============================================================================
router.post('/lembretes/disparar', requireBotAuth, async (req: Request, res: Response) => {
  try {
    const agora = new Date();
    const em24h = new Date(agora.getTime() + 24 * 60 * 60 * 1000);

    const agendamentos = await agendamentoRepo.listar();
    const paraLembrete = agendamentos.filter(a => {
      if (a.status !== 'agendado') return false;
      const dt = new Date(a.data_hora_inicio);
      return dt.toISOString().split('T')[0] === em24h.toISOString().split('T')[0];
    });

    const disparados = [];
    for (const ag of paraLembrete) {
      const cliente = await clienteRepo.buscarPorId(ag.cliente_id);
      const procedimento = await procedimentoRepo.buscarPorId(ag.procedimento_id);

      if (cliente && procedimento) {
        await WhatsAppBotIntegration.notificarBotLembrete24h({
          telefoneCliente: cliente.telefone,
          nomeCliente: cliente.nome,
          procedimentoNome: procedimento.nome,
          dataHoraInicio: ag.data_hora_inicio
        });

        disparados.push({
          cliente: cliente.nome,
          telefone: cliente.telefone,
          horario: ag.data_hora_inicio
        });
      }
    }

    res.json({
      sucesso: true,
      mensagem: `${disparados.length} lembretes enviados para o bot de WhatsApp.`,
      disparados
    });
  } catch (error: any) {
    res.status(500).json({ erro: error.message });
  }
});

export default router;
