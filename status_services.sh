#!/bin/bash

echo "📊 Status dos serviços do Dohoo IABX"
echo "=================================="

# Verificar backend
echo "🔧 Backend:"
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
  echo "   ✅ Rodando em http://localhost:3001"
  echo "   ✅ Externo: http://31.97.250.190:3001"
else
  echo "   ❌ Não está rodando"
fi

# Verificar frontend
echo ""
echo "🎨 Frontend:"
if curl -s http://localhost:8080 > /dev/null 2>&1; then
  echo "   ✅ Rodando em http://localhost:8080"
  echo "   ✅ Externo: http://31.97.250.190:8080"
else
  echo "   ❌ Não está rodando"
fi

# Verificar processos
echo ""
echo "🔍 Processos ativos:"
BACKEND_PROC=$(pgrep -f "node index.js" | head -1)
FRONTEND_PROC=$(pgrep -f "vite" | head -1)

if [ ! -z "$BACKEND_PROC" ]; then
  echo "   Backend PID: $BACKEND_PROC"
else
  echo "   Backend: não encontrado"
fi

if [ ! -z "$FRONTEND_PROC" ]; then
  echo "   Frontend PID: $FRONTEND_PROC"
else
  echo "   Frontend: não encontrado"
fi

# Verificar portas
echo ""
echo "🌐 Portas em uso:"
netstat -tlnp 2>/dev/null | grep ":3001\|:8080" | while read line; do
  echo "   $line"
done

# Verificar logs recentes
echo ""
echo "📝 Logs recentes:"
if [ -f "/root/backend.log" ]; then
  echo "   Backend (últimas 3 linhas):"
  tail -3 /root/backend.log | sed 's/^/     /'
fi

if [ -f "/root/frontend.log" ]; then
  echo "   Frontend (últimas 3 linhas):"
  tail -3 /root/frontend.log | sed 's/^/     /'
fi

echo ""
echo "==================================" 