#!/bin/bash

echo "👥 === TESTE API DE USUÁRIOS ==="
echo ""

# Verificar se o backend está rodando
echo "1. Verificando backend..."
if curl -s http://localhost:3001/health > /dev/null; then
    echo "   ✅ Backend está rodando"
else
    echo "   ❌ Backend não está rodando"
    exit 1
fi

# Testar diferentes tenant IDs
echo ""
echo "2. Testando diferentes tenant IDs..."

# Teste 1: Tenant ID 1
echo "   📋 Testando tenant ID: 1"
RESPONSE1=$(curl -s http://localhost:3001/tenants/1/users)
if [ $? -eq 0 ]; then
    echo "   ✅ Resposta para tenant 1: $RESPONSE1"
else
    echo "   ❌ Erro para tenant 1"
fi

# Teste 2: Tenant ID específico (usando o ID do Merlin Desk)
echo "   📋 Testando tenant ID: 5f2ef8cf-038b-4126-a8e5-043d7cf882fb"
RESPONSE2=$(curl -s http://localhost:3001/tenants/5f2ef8cf-038b-4126-a8e5-043d7cf882fb/users)
if [ $? -eq 0 ]; then
    echo "   ✅ Resposta para Merlin Desk: $RESPONSE2"
else
    echo "   ❌ Erro para Merlin Desk"
fi

# Teste 3: Tenant ID inválido
echo "   📋 Testando tenant ID inválido: invalid"
RESPONSE3=$(curl -s http://localhost:3001/tenants/invalid/users)
if [ $? -eq 0 ]; then
    echo "   ✅ Resposta para tenant inválido: $RESPONSE3"
else
    echo "   ❌ Erro para tenant inválido"
fi

# Teste 4: Listar todos os tenants primeiro
echo ""
echo "3. Listando todos os tenants..."
TENANTS_RESPONSE=$(curl -s http://localhost:3001/tenants)
if [ $? -eq 0 ]; then
    echo "   ✅ Tenants disponíveis: $TENANTS_RESPONSE"
    
    # Extrair primeiro tenant ID
    FIRST_TENANT_ID=$(echo $TENANTS_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    if [ -n "$FIRST_TENANT_ID" ]; then
        echo "   📋 Testando primeiro tenant: $FIRST_TENANT_ID"
        FIRST_USERS_RESPONSE=$(curl -s http://localhost:3001/tenants/$FIRST_TENANT_ID/users)
        echo "   ✅ Usuários do primeiro tenant: $FIRST_USERS_RESPONSE"
    fi
else
    echo "   ❌ Erro ao listar tenants"
fi

# Teste 5: Verificar logs do backend
echo ""
echo "4. Verificando logs do backend..."
if [ -f "/root/backend/backend.log" ]; then
    echo "   📋 Últimas 10 linhas do log:"
    tail -10 /root/backend/backend.log
else
    echo "   ❌ Arquivo de log não encontrado"
fi

echo ""
echo "🎯 === TESTE CONCLUÍDO ==="
echo "📋 Se não houver usuários, pode ser que:"
echo "   - Não existam usuários no tenant"
echo "   - O tenant_id está incorreto"
echo "   - Há erro na consulta ao banco"
echo "" 