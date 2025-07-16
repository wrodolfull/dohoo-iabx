#!/bin/bash

echo "📊 STATUS DOS SERVIÇOS DOHOO IABX"
echo "================================="

# Verificar Backend
echo ""
echo "🔧 BACKEND (Node.js):"
BACKEND_PID=$(pgrep -f "node index.js")
if [ ! -z "$BACKEND_PID" ]; then
    echo "   ✅ Rodando (PID: $BACKEND_PID)"
    echo "   🌐 URL: http://31.97.250.190:3001/"
    
    # Testar health check
    HEALTH=$(curl -s http://31.97.250.190:3001/health 2>/dev/null)
    if [ ! -z "$HEALTH" ]; then
        echo "   💊 Health: OK"
    else
        echo "   ❌ Health: FALHOU"
    fi
else
    echo "   ❌ Não está rodando"
fi

# Verificar Frontend
echo ""
echo "🌐 FRONTEND (Vite):"
FRONTEND_PID=$(pgrep -f "vite.*--host.*0.0.0.0")
if [ ! -z "$FRONTEND_PID" ]; then
    echo "   ✅ Rodando (PID: $FRONTEND_PID)"
    echo "   🌐 URL: http://31.97.250.190:8080/"
    
    # Testar se responde
    STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://31.97.250.190:8080/ 2>/dev/null)
    if [ "$STATUS_CODE" = "200" ]; then
        echo "   💊 Status: OK (HTTP $STATUS_CODE)"
    else
        echo "   ❌ Status: FALHOU (HTTP $STATUS_CODE)"
    fi
else
    echo "   ❌ Não está rodando"
fi

# Verificar portas
echo ""
echo "🔌 PORTAS OCUPADAS:"
netstat -tlnp | grep -E "(3001|8080|8081|8082)" | while read line; do
    echo "   $line"
done

echo ""
echo "📝 Para gerenciar os serviços:"
echo "   Iniciar: ./start_services.sh"
echo "   Parar:   ./stop_services.sh"
echo "   Status:  ./status_services.sh" 