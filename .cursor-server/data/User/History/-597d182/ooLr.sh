#!/bin/bash

echo "🛑 Parando todos os serviços do Dohoo IABX..."

# Parar frontend
echo "   Parando Frontend (Vite)..."
pkill -f "vite.*dohoo" 2>/dev/null
pkill -f "npm run dev" 2>/dev/null

# Parar backend
echo "   Parando Backend (Node.js)..."
pkill -f "node index.js" 2>/dev/null

sleep 2

# Verificar se ainda há processos rodando
REMAINING=$(ps aux | grep -E "(vite.*dohoo|node.*index.js)" | grep -v grep | wc -l)

if [ $REMAINING -eq 0 ]; then
    echo "✅ Todos os serviços foram parados com sucesso!"
else
    echo "⚠️  Ainda há $REMAINING processo(s) rodando. Forçando encerramento..."
    pkill -9 -f "vite.*dohoo"
    pkill -9 -f "node index.js"
    echo "✅ Processos forçados a parar."
fi

echo ""
echo "🔍 Portas liberadas:"
netstat -tlnp | grep -E "(3001|8080|8081|8082)" || echo "   Nenhuma porta ocupada." 