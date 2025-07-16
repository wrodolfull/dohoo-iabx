#!/bin/bash

echo "🛑 Parando serviços do Dohoo IABX..."

# Parar processos pelo PID se existirem
if [ -f "/tmp/backend.pid" ]; then
  BACKEND_PID=$(cat /tmp/backend.pid)
  if kill -0 $BACKEND_PID 2>/dev/null; then
    echo "🔧 Parando backend (PID: $BACKEND_PID)..."
    kill $BACKEND_PID
  fi
  rm -f /tmp/backend.pid
fi

if [ -f "/tmp/frontend.pid" ]; then
  FRONTEND_PID=$(cat /tmp/frontend.pid)
  if kill -0 $FRONTEND_PID 2>/dev/null; then
    echo "🎨 Parando frontend (PID: $FRONTEND_PID)..."
    kill $FRONTEND_PID
  fi
  rm -f /tmp/frontend.pid
fi

# Garantir que todos os processos foram finalizados
echo "🧹 Limpando processos restantes..."
pkill -f "node index.js" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

# Aguardar um pouco
sleep 2

echo "✅ Todos os serviços foram parados" 