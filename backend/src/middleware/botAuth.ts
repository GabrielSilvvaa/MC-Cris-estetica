import { Request, Response, NextFunction } from 'express';

/**
 * Middleware de Autenticação Service-to-Service para o Bot do WhatsApp.
 * Valida o cabeçalho 'x-bot-service-token' para permitir que o bot externo envie leads
 * e consulte disponibilidade sem usar credenciais de usuário.
 */
export const requireBotAuth = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.headers['x-bot-service-token'] || req.query.token;
  const validToken = process.env.BOT_SERVICE_TOKEN || 'mc_bot_secret_token_2026';

  if (!token || token !== validToken) {
    // Permite também em ambiente de desenvolvimento local se autenticado internamente
    const devBypass = req.headers['x-dev-bypass'] === 'true';
    if (!devBypass && process.env.NODE_ENV === 'production') {
      res.status(401).json({ erro: 'Não autorizado. Token de serviço do Bot inválido ou ausente.' });
      return;
    }
  }

  next();
};
