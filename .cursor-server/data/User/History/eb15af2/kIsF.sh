#!/bin/bash

echo "🔧 Parando todos os serviços existentes..."

# Matar todos os processos do frontend
pkill -f "vite.*dohoo" 2>/dev/null
pkill -f "npm run dev" 2>/dev/null

# Matar processo do backend
pkill -f "node index.js" 2>/dev/null

sleep 3

echo "🚀 Iniciando Backend na porta 3001..."
cd /root/backend && node index.js &
BACKEND_PID=$!

sleep 2

echo "🌐 Iniciando Frontend na porta 8080..."
cd /root/dohoo-voice-flow-control && npm run dev -- --host 0.0.0.0 --port 8080 &
FRONTEND_PID=$!

sleep 3

echo ""
echo "✅ Serviços iniciados:"
echo "   📱 Frontend: http://31.97.250.190:8080/"
echo "   🔧 Backend:  http://31.97.250.190:3001/"
echo "   💊 Health:   http://31.97.250.190:3001/health"
echo ""
echo "📝 PIDs:"
echo "   Backend:  $BACKEND_PID"
echo "   Frontend: $FRONTEND_PID"
echo ""
echo "Para parar os serviços: kill $BACKEND_PID $FRONTEND_PID" 