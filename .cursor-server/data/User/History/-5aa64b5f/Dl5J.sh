#!/bin/bash

echo "🔍 === DEBUG FRONTEND FREESWITCH ==="
echo ""

# Aguardar backend inicializar
echo "1. Aguardando backend inicializar..."
sleep 3

# Testar se o backend está rodando
echo ""
echo "2. Verificando backend..."
if curl -s http://localhost:3001/health > /dev/null; then
    echo "   ✅ Backend está rodando"
else
    echo "   ❌ Backend não está rodando"
    echo "   💡 Verifique: tail -f /root/backend/backend.log"
    exit 1
fi

# Testar criação de arquivos
echo ""
echo "3. Testando criação de arquivos..."
FILE_RESPONSE=$(curl -s -X POST http://localhost:3001/test-file-creation)
echo "   📋 Resposta: $FILE_RESPONSE"

# Testar simulação de criação de tenant
echo ""
echo "4. Testando simulação de criação de tenant..."
TENANT_SIM_RESPONSE=$(curl -s -X POST http://localhost:3001/test-tenant-creation)
echo "   📋 Resposta: $TENANT_SIM_RESPONSE"

# Criar tenant real via API
echo ""
echo "5. Criando tenant real via API..."
TENANT_RESPONSE=$(curl -s -X POST http://localhost:3001/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Empresa Debug Frontend",
    "domain": "debugfrontend.local", 
    "contact_email": "admin@debugfrontend.com"
  }')

echo "   📋 Resposta: $TENANT_RESPONSE"

# Extrair ID do tenant se criado com sucesso
if echo "$TENANT_RESPONSE" | grep -q '"id"'; then
    TENANT_ID=$(echo $TENANT_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    echo "   📋 ID do tenant: $TENANT_ID"
    
    # Aguardar processamento
    echo ""
    echo "6. Aguardando processamento..."
    sleep 5
    
    # Testar integração específica
    echo ""
    echo "7. Testando integração específica..."
    INTEGRATION_RESPONSE=$(curl -s -X POST http://localhost:3001/test-freeswitch/$TENANT_ID)
    echo "   📋 Resposta: $INTEGRATION_RESPONSE"
fi

# Verificar arquivos criados
echo ""
echo "8. Verificando arquivos criados..."
echo "   📁 Arquivos em /etc/freeswitch/directory/:"
ls -la /etc/freeswitch/directory/ | grep -E "(test|debug|empresa)" || echo "   ⚠️ Nenhum arquivo de teste encontrado"

echo ""
echo "9. Verificando logs do backend..."
if [ -f "/root/backend/backend.log" ]; then
    echo "   📋 Últimas 20 linhas do log:"
    tail -20 /root/backend/backend.log
else
    echo "   ❌ Arquivo de log não encontrado"
fi

echo ""
echo "🎯 === DEBUG CONCLUÍDO ==="
echo "📋 Para ver logs em tempo real: tail -f /root/backend/backend.log"
echo "📋 Para testar frontend: crie um tenant via interface web"
echo "" 