#!/bin/bash

echo "🚀 Iniciando serviços do Dohoo IABX..."

# Parar processos existentes
echo "🛑 Parando processos existentes..."
pkill -f "node index.js" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

# Aguardar um pouco para garantir que os processos foram finalizados
sleep 2

# Iniciar backend
echo "🔧 Iniciando backend..."
cd /root/backend
if [ ! -f ".env" ]; then
  echo "❌ Arquivo .env não encontrado no backend!"
  exit 1
fi

# Verificar se as variáveis estão definidas
if ! grep -q "SUPABASE_URL" .env || ! grep -q "SUPABASE_SERVICE_ROLE_KEY" .env; then
  echo "❌ Variáveis do Supabase não configuradas no .env"
  exit 1
fi

nohup node index.js > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ Backend iniciado (PID: $BACKEND_PID)"

# Aguardar backend inicializar
sleep 3

# Verificar se backend está rodando
if ! curl -s http://localhost:3001/health > /dev/null; then
  echo "❌ Backend não está respondendo"
  exit 1
fi

echo "✅ Backend rodando em http://localhost:3001"

# Iniciar frontend
echo "🎨 Iniciando frontend..."
cd /root/dohoo-voice-flow-control

# Verificar se o .env.local existe
if [ ! -f ".env.local" ]; then
  echo "⚠️ Arquivo .env.local não encontrado, criando..."
  cat > .env.local << EOF
VITE_API_URL=http://31.97.250.190:3001
VITE_SUPABASE_URL=https://ilotpvzjexpeusgresqr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlsb3RwdnpqZXhwZXVzZ3Jlc3FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2Mjk3MjQsImV4cCI6MjA1MTIwNTcyNH0.Yy6jqCGpJiQsYvgQqnQGzJhNZvPqVhKDUVFjQNHGxPM
EOF
fi

nohup npm run dev -- --host 0.0.0.0 --port 8080 > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo "✅ Frontend iniciado (PID: $FRONTEND_PID)"

# Aguardar frontend inicializar
sleep 5

echo ""
echo "🎉 Serviços iniciados com sucesso!"
echo ""
echo "📊 URLs de acesso:"
echo "   Frontend: http://31.97.250.190:8080/"
echo "   Backend:  http://31.97.250.190:3001/"
echo "   Health:   http://31.97.250.190:3001/health"
echo ""
echo "🔐 Credenciais de teste:"
echo "   Email: admin@dohoo.com"
echo "   Senha: Admin123!"
echo ""
echo "📝 Logs:"
echo "   Backend:  tail -f /root/backend.log"
echo "   Frontend: tail -f /root/frontend.log"
echo ""
echo "🛑 Para parar os serviços: ./stop_services.sh"
echo ""

# Salvar PIDs para poder parar depois
echo "$BACKEND_PID" > /tmp/backend.pid
echo "$FRONTEND_PID" > /tmp/frontend.pid

echo "✅ Serviços rodando em background" 