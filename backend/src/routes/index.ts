import { Router } from 'express';
import authRoutes from './authRoutes';
import clienteRoutes from './clienteRoutes';
import agendaRoutes from './agendaRoutes';
import leadRoutes from './leadRoutes';
import procedimentoRoutes from './procedimentoRoutes';
import faqRoutes from './faqRoutes';
import financeiroRoutes from './financeiroRoutes';
import configRoutes from './configRoutes';
import notificacaoRoutes from './notificacaoRoutes';
import consentimentoRoutes from './consentimentoRoutes';
import botWebhookRoutes from './botWebhookRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/clientes', clienteRoutes);
router.use('/agenda', agendaRoutes);
router.use('/leads', leadRoutes);
router.use('/procedimentos', procedimentoRoutes);
router.use('/faq', faqRoutes);
router.use('/financeiro', financeiroRoutes);
router.use('/configuracoes', configRoutes);
router.use('/notificacoes', notificacaoRoutes);
router.use('/consentimento', consentimentoRoutes);
router.use('/bot', botWebhookRoutes);

// Endpoint de health check
router.get('/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'MC Estética & Bem-Estar API',
    versao: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

export default router;
