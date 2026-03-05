import nodemailer from 'nodemailer';
// Configurar transporte de email
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true para 465, false para outras portas
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});
// Verificar conexão com email
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Erro ao conectar com servidor SMTP:', error);
    }
    else if (success) {
        console.log('✅ Servidor SMTP conectado com sucesso');
    }
});
export default transporter;
//# sourceMappingURL=email.js.map