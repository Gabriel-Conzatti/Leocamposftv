#!/bin/bash
# Start Backend Server Locally
# This allows testing CORS and login while Hostinger redeploys

cd "$(dirname "$0")/backend"

echo "🚀 Iniciando servidor backend localmente..."
echo ""
echo "Configurando ambiente..."

# Set environment variables for testing
export NODE_ENV=development
export PORT=3001
export JWT_SECRET=test-secret-key-local-development
export FRONTEND_URL=http://localhost:5173
export DATABASE_URL=mysql://test:test@localhost:3306/test

echo "✅ Variáveis de ambiente configuradas"
echo ""
echo "Iniciando aplicação..."
npm start

echo ""
echo "Se receber erro de porta em uso, execute:"
echo "  killall node"
echo "  npm start"
