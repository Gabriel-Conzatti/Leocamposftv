import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import 'dotenv/config';

import prisma from './lib/prisma.js';
import authRoutes from './routes/authRoutes.js';
import aulaRoutes from './routes/aulaRoutes.js';
import inscricaoRoutes from './routes/inscricaoRoutes.js';
import pagamentoRoutes from './routes/pagamentoRoutes.js';
import { errorHandler } from './utils/errors.js';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Aceitar requisições localhost em qualquer porta
    if (!origin) {
      callback(null, true);
    } else if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      callback(null, true);
    } else if (origin === process.env.FRONTEND_URL) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// Health check com status do banco
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      sucesso: true,
      mensagem: 'Servidor funcionando e conectado ao PostgreSQL',
      timestamp: new Date().toISOString(),
      database: 'PostgreSQL ✅',
    });
  } catch (error) {
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao conectar ao banco de dados',
      timestamp: new Date().toISOString(),
      database: 'PostgreSQL ❌',
    });
  }
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/aulas', aulaRoutes);
app.use('/api/inscricoes', inscricaoRoutes);
app.use('/api/pagamentos', pagamentoRoutes);

// Rota não encontrada
app.use((req: Request, res: Response) => {
  res.status(404).json({
    sucesso: false,
    mensagem: 'Rota não encontrada',
    erro: `${req.method} ${req.path}`,
  });
});

// Error handler (deve ser o último middleware)
app.use(errorHandler);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📝 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Frontend em: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});
