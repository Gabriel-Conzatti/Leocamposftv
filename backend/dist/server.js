import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import authRoutes from './routes/authRoutes.js';
import aulaRoutes from './routes/aulaRoutes.js';
import inscricaoRoutes from './routes/inscricaoRoutes.js';
import pagamentoRoutes from './routes/pagamentoRoutes.js';
import { errorHandler } from './utils/errors.js';
import { testarConexaoMySQL, obterResumoConexaoBanco } from './lib/mysql.js';
// Validar variáveis de ambiente críticas
const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
    console.error(`❌ ERRO CRÍTICO: Variáveis de ambiente faltando: ${missingEnvVars.join(', ')}`);
    console.error('Configure estas variáveis no painel Hostinger: Settings > Environment Variables');
    // Não fazer process.exit, apenas logar para desenvolvimento
    if (process.env.NODE_ENV === 'production') {
        console.error('Aplicação continuará rodando, mas login falhará até configurar variáveis.');
    }
}
const app = express();
// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const corsOptions = {
    origin: (origin, callback) => {
        // Lista de origens permitidas
        const allowedOrigins = [
            'https://leocamposftv.com',
            'https://www.leocamposftv.com',
            'http://localhost:5173',
            'http://localhost:3000',
            'http://127.0.0.1:5173',
            'http://127.0.0.1:3000',
            process.env.FRONTEND_URL,
        ].filter(Boolean);
        // Aceitar requisições sem origin (ex: Postman, mobile apps)
        if (!origin) {
            return callback(null, true);
        }
        // Aceitar origens permitidas ou locais
        if (allowedOrigins.includes(origin) ||
            origin.includes('localhost') ||
            origin.includes('127.0.0.1') ||
            origin.includes('.onrender.com') ||
            origin.includes('.vercel.app') ||
            origin.includes('leocamposftv.com') ||
            origin === 'https://api.leocamposftv.com') {
            return callback(null, true);
        }
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
// Health check
app.get('/api/health', async (req, res) => {
    try {
        const [dbOk, dbErro] = await testarConexaoMySQL();
        const resumoConexaoBanco = obterResumoConexaoBanco();
        res.json({
            sucesso: true,
            mensagem: 'Servidor funcionando',
            timestamp: new Date().toISOString(),
            diagnostico: {
                jwtConfigurado: Boolean(process.env.JWT_SECRET),
                databaseUrlConfigurada: Boolean(process.env.DATABASE_URL),
                bancoConectado: dbOk,
                bancoErro: dbOk ? undefined : dbErro,
                banco: resumoConexaoBanco,
            },
        });
    }
    catch (error) {
        console.error('❌ Erro no health check:', error.message);
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao verificar health do servidor',
            erro: error.message,
            timestamp: new Date().toISOString(),
        });
    }
});
// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/aulas', aulaRoutes);
app.use('/api/inscricoes', inscricaoRoutes);
app.use('/api/pagamentos', pagamentoRoutes);
// Rota não encontrada
app.use((req, res) => {
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
//# sourceMappingURL=server.js.map