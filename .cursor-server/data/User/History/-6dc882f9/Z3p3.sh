#!/bin/bash

echo "🔗 === TESTE DE CONECTIVIDADE FRONTEND-BACKEND ==="
echo ""

# Verificar se o backend está rodando
echo "1. Verificando backend..."
if curl -s http://localhost:3001/health > /dev/null; then
    echo "   ✅ Backend local está rodando"
else
    echo "   ❌ Backend local não está rodando"
fi

# Testar conectividade externa
echo ""
echo "2. Testando conectividade externa..."
if curl -s http://31.97.250.190:3001/health > /dev/null; then
    echo "   ✅ Backend externo está acessível"
else
    echo "   ❌ Backend externo não está acessível"
fi

# Testar criação de tenant via API externa
echo ""
echo "3. Testando criação de tenant via API externa..."
TENANT_RESPONSE=$(curl -s -X POST http://31.97.250.190:3001/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Empresa Teste Conectividade",
    "domain": "testeconectividade.local", 
    "contact_email": "admin@testeconectividade.com"
  }')

if [ $? -eq 0 ]; then
    echo "   ✅ Tenant criado via API externa"
    echo "   📋 Resposta: $TENANT_RESPONSE"
    
    # Extrair ID do tenant
    TENANT_ID=$(echo $TENANT_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$TENANT_ID" ]; then
        echo "   📋 ID do tenant: $TENANT_ID"
        
        # Aguardar processamento
        echo ""
        echo "4. Aguardando processamento..."
        sleep 5
        
        # Verificar arquivos criados
        echo ""
        echo "5. Verificando arquivos criados..."
        ls -la /etc/freeswitch/directory/ | grep -E "(testeconectividade|empresa)" || echo "   ⚠️ Nenhum arquivo encontrado"
    fi
else
    echo "   ❌ Erro ao criar tenant via API externa"
    echo "   📋 Erro: $TENANT_RESPONSE"
fi

# Testar CORS
echo ""
echo "6. Testando CORS..."
CORS_RESPONSE=$(curl -s -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS http://31.97.250.190:3001/tenants)

if [ $? -eq 0 ]; then
    echo "   ✅ CORS parece estar configurado"
else
    echo "   ⚠️ CORS pode estar com problemas"
fi

# Verificar logs do backend
echo ""
echo "7. Verificando logs do backend..."
if [ -f "/root/backend/backend.log" ]; then
    echo "   📋 Últimas 10 linhas do log:"
    tail -10 /root/backend/backend.log
else
    echo "   ❌ Arquivo de log não encontrado"
fi

echo ""
echo "🎯 === TESTE DE CONECTIVIDADE CONCLUÍDO ==="
echo "📋 Se o backend externo não estiver acessível, verifique:"
echo "   - Firewall/iptables"
echo "   - Configuração do servidor"
echo "   - Status do serviço: systemctl status freeswitch"
echo "" 