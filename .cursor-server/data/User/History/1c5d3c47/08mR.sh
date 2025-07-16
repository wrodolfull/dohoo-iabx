#!/bin/bash

echo "🚀 === TESTE COMPLETO DE INTEGRAÇÃO ==="
echo ""

# 1. Verificar se o backend está rodando
echo "1. Verificando backend..."
if curl -s http://localhost:3001/health > /dev/null; then
    echo "   ✅ Backend está rodando"
else
    echo "   ❌ Backend não está rodando"
    echo "   💡 Execute: cd /root/backend && nohup node index.js > backend.log 2>&1 &"
    exit 1
fi

# 2. Testar criação de arquivos
echo ""
echo "2. Testando criação de arquivos..."
FILE_TEST_RESPONSE=$(curl -s -X POST http://localhost:3001/test-file-creation)

if [ $? -eq 0 ]; then
    echo "   ✅ Teste de criação de arquivos executado"
    echo "   📋 Resposta: $FILE_TEST_RESPONSE"
else
    echo "   ❌ Erro no teste de criação de arquivos"
    echo "   📋 Erro: $FILE_TEST_RESPONSE"
fi

# 3. Criar tenant de teste
echo ""
echo "3. Criando tenant de teste..."
TENANT_RESPONSE=$(curl -s -X POST http://localhost:3001/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Empresa Teste Completo",
    "domain": "testecompleto.local", 
    "contact_email": "admin@testecompleto.com"
  }')

if [ $? -eq 0 ]; then
    echo "   ✅ Tenant criado via API"
    echo "   📋 Resposta: $TENANT_RESPONSE"
    
    # Extrair ID do tenant
    TENANT_ID=$(echo $TENANT_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$TENANT_ID" ]; then
        echo "   📋 ID do tenant: $TENANT_ID"
        
        # 4. Aguardar um pouco
        echo ""
        echo "4. Aguardando processamento..."
        sleep 5
        
        # 5. Testar integração específica
        echo ""
        echo "5. Testando integração específica..."
        INTEGRATION_RESPONSE=$(curl -s -X POST http://localhost:3001/test-freeswitch/$TENANT_ID)
        
        if [ $? -eq 0 ]; then
            echo "   ✅ Teste de integração executado"
            echo "   📋 Resposta: $INTEGRATION_RESPONSE"
        else
            echo "   ❌ Erro no teste de integração"
            echo "   📋 Erro: $INTEGRATION_RESPONSE"
        fi
        
        # 6. Verificar arquivos XML criados
        echo ""
        echo "6. Verificando arquivos XML criados..."
        XML_FOUND=0
        
        for dir in "/etc/freeswitch/directory" "/etc/freeswitch/dialplan" "/etc/freeswitch/sip_profiles"; do
            if [ -d "$dir" ]; then
                RECENT_FILES=$(find $dir -name "*.xml" -mmin -10 2>/dev/null)
                if [ -n "$RECENT_FILES" ]; then
                    echo "   ✅ Arquivos XML recentes em $dir:"
                    echo "$RECENT_FILES" | while read file; do
                        if [ -f "$file" ]; then
                            size=$(stat -c%s "$file" 2>/dev/null || echo "0")
                            echo "      - $(basename $file) (${size} bytes)"
                            XML_FOUND=1
                        fi
                    done
                else
                    echo "   ⚠️ Nenhum arquivo XML recente em $dir"
                fi
            else
                echo "   ❌ Diretório não existe: $dir"
            fi
        done
        
        if [ $XML_FOUND -eq 0 ]; then
            echo "   ❌ Nenhum arquivo XML foi criado"
        fi
        
    else
        echo "   ❌ Não foi possível extrair ID do tenant"
    fi
else
    echo "   ❌ Erro ao criar tenant"
    echo "   📋 Erro: $TENANT_RESPONSE"
fi

# 7. Verificar logs do backend
echo ""
echo "7. Verificando logs do backend..."
if [ -f "/root/backend/backend.log" ]; then
    echo "   📋 Últimas 10 linhas do log:"
    tail -10 /root/backend/backend.log
else
    echo "   ❌ Arquivo de log não encontrado"
fi

echo ""
echo "🎯 === TESTE CONCLUÍDO ==="
echo "📋 Para verificar logs detalhados: tail -f /root/backend/backend.log"
echo "📋 Para testar manualmente: curl -X POST http://localhost:3001/test-file-creation"
echo "" 