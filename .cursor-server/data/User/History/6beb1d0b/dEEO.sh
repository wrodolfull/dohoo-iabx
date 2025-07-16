#!/bin/bash

echo "👥 === DEBUG PÁGINA DE USUÁRIOS ==="
echo ""

# Verificar se o backend está rodando
echo "1. Verificando backend..."
if curl -s http://localhost:3001/health > /dev/null; then
    echo "   ✅ Backend está rodando"
else
    echo "   ❌ Backend não está rodando"
    exit 1
fi

# Testar endpoint de usuários
echo ""
echo "2. Testando endpoint de usuários..."
USERS_TEST_RESPONSE=$(curl -s http://localhost:3001/test-users)
if [ $? -eq 0 ]; then
    echo "   ✅ Teste de usuários executado"
    echo "   📋 Resposta: $USERS_TEST_RESPONSE"
else
    echo "   ❌ Erro no teste de usuários"
fi

# Testar diferentes tenant IDs
echo ""
echo "3. Testando diferentes tenant IDs..."

# Listar tenants primeiro
TENANTS_RESPONSE=$(curl -s http://localhost:3001/tenants)
if [ $? -eq 0 ]; then
    echo "   ✅ Tenants disponíveis: $TENANTS_RESPONSE"
    
    # Extrair todos os tenant IDs
    TENANT_IDS=$(echo $TENANTS_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    
    for tenant_id in $TENANT_IDS; do
        echo "   📋 Testando tenant: $tenant_id"
        USERS_RESPONSE=$(curl -s http://localhost:3001/tenants/$tenant_id/users)
        if [ $? -eq 0 ]; then
            echo "   ✅ Usuários: $USERS_RESPONSE"
        else
            echo "   ❌ Erro para tenant $tenant_id"
        fi
    done
else
    echo "   ❌ Erro ao listar tenants"
fi

# Testar tenant ID específico (Merlin Desk)
echo ""
echo "4. Testando tenant específico (Merlin Desk)..."
MERLIN_USERS=$(curl -s http://localhost:3001/tenants/5f2ef8cf-038b-4126-a8e5-043d7cf882fb/users)
if [ $? -eq 0 ]; then
    echo "   ✅ Usuários do Merlin Desk: $MERLIN_USERS"
else
    echo "   ❌ Erro para Merlin Desk"
fi

# Verificar logs do backend
echo ""
echo "5. Verificando logs do backend..."
if [ -f "/root/backend/backend.log" ]; then
    echo "   📋 Últimas 15 linhas do log:"
    tail -15 /root/backend/backend.log
else
    echo "   ❌ Arquivo de log não encontrado"
fi

# Testar conectividade externa
echo ""
echo "6. Testando conectividade externa..."
EXTERNAL_TEST=$(curl -s http://31.97.250.190:3001/test-users)
if [ $? -eq 0 ]; then
    echo "   ✅ API externa funcionando"
    echo "   📋 Resposta: $EXTERNAL_TEST"
else
    echo "   ❌ API externa não está acessível"
fi

echo ""
echo "🎯 === DEBUG CONCLUÍDO ==="
echo "📋 Para verificar no frontend:"
echo "   1. Abra o DevTools (F12)"
echo "   2. Vá para a aba Console"
echo "   3. Navegue para /users"
echo "   4. Verifique os logs de debug"
echo "" 