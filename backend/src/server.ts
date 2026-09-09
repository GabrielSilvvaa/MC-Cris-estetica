import express from 'express';
import cors from 'cors';
import routes from './routes';

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares globais
app.use(cors({
  origin: '*', // Permite comunicação com o front-end Vite
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-bot-service-token']
}));

app.use(express.json({ limit: '10mb' })); // Suporte a assinaturas base64

// Rotas da API
app.use('/api', routes);

// Middleware de tratamento de erros
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[API Error]', err);
  res.status(500).json({
    erro: 'Erro interno no servidor.',
    detalhe: process.env.NODE_ENV === 'production' ? undefined : err.message
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`================================================================`);
    console.log(`🌸 MC ESTÉTICA & BEM-ESTAR — Servidor Backend Ativo`);
    console.log(`   Dra. Márcia Cristina`);
    console.log(`   Porta: http://localhost:${PORT}`);
    console.log(`   API Base: http://localhost:${PORT}/api`);
    console.log(`================================================================`);
  });
}

export default app;
