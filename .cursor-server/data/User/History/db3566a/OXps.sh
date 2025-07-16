#!/bin/bash

echo "🔍 === VERIFICAÇÃO DE INTEGRAÇÃO FREESWITCH ==="
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

# 2. Verificar se FreeSWITCH está rodando
echo ""
echo "2. Verificando FreeSWITCH..."
if pgrep -f freeswitch > /dev/null; then
    echo "   ✅ FreeSWITCH está rodando"
else
    echo "   ⚠️ FreeSWITCH não está rodando"
fi

# 3. Verificar fs_cli
echo ""
echo "3. Verificando fs_cli..."
if [ -f "/usr/local/freeswitch/bin/fs_cli" ]; then
    echo "   ✅ fs_cli encontrado"
else
    echo "   ❌ fs_cli não encontrado"
fi

# 4. Verificar diretórios do FreeSWITCH
echo ""
echo "4. Verificando diretórios do FreeSWITCH..."
for dir in "/etc/freeswitch/directory" "/etc/freeswitch/dialplan" "/etc/freeswitch/sip_profiles"; do
    if [ -d "$dir" ]; then
        echo "   ✅ $dir existe"
        echo "      Arquivos: $(ls -1 $dir 2>/dev/null | wc -l)"
    else
        echo "   ❌ $dir não existe"
    fi
done

# 5. Criar tenant de teste
echo ""
echo "5. Criando tenant de teste..."
TENANT_RESPONSE=$(curl -s -X POST http://localhost:3001/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teste Integração Debug",
    "domain": "testedebug.local", 
    "contact_email": "admin@testedebug.com"
  }')

if [ $? -eq 0 ]; then
    echo "   ✅ Tenant criado via API"
    echo "   📋 Resposta: $TENANT_RESPONSE"
    
    # Extrair ID do tenant
    TENANT_ID=$(echo $TENANT_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$TENANT_ID" ]; then
        echo "   📋 ID do tenant: $TENANT_ID"
        
        # 6. Aguardar um pouco e verificar arquivos
        echo ""
        echo "6. Aguardando criação dos arquivos..."
        sleep 3
        
        # Verificar arquivos XML criados
        echo ""
        echo "7. Verificando arquivos XML criados..."
        XML_FOUND=0
        
        for dir in "/etc/freeswitch/directory" "/etc/freeswitch/dialplan" "/etc/freeswitch/sip_profiles"; do
            if [ -d "$dir" ]; then
                RECENT_FILES=$(find $dir -name "*.xml" -mmin -5 2>/dev/null)
                if [ -n "$RECENT_FILES" ]; then
                    echo "   ✅ Arquivos XML recentes em $dir:"
                    echo "$RECENT_FILES" | while read file; do
                        if [ -f "$file" ]; then
                            size=$(stat -c%s "$file" 2>/dev/null || echo "0")
                            echo "      - $(basename $file) (${size} bytes)"
                            XML_FOUND=1
                        fi
                    done
                fi
            fi
        done
        
        if [ $XML_FOUND -eq 0 ]; then
            echo "   ❌ Nenhum arquivo XML foi criado"
            echo ""
            echo "🔍 === DEBUGGING ==="
            echo "Verificando logs do backend..."
            if [ -f "/root/backend/backend.log" ]; then
                echo "Últimas 20 linhas do log:"
                tail -20 /root/backend/backend.log
            else
                echo "Arquivo de log não encontrado"
            fi
        fi
        
        # 8. Testar endpoint de teste específico
        echo ""
        echo "8. Testando endpoint de teste específico..."
        TEST_RESPONSE=$(curl -s -X POST http://localhost:3001/test-freeswitch/$TENANT_ID)
        
        if [ $? -eq 0 ]; then
            echo "   ✅ Teste de integração executado"
            echo "   📋 Resposta: $TEST_RESPONSE"
        else
            echo "   ❌ Erro no teste de integração"
        fi
        
    else
        echo "   ❌ Não foi possível extrair ID do tenant"
    fi
else
    echo "   ❌ Erro ao criar tenant"
    echo "   📋 Erro: $TENANT_RESPONSE"
fi

echo ""
echo "🎯 === VERIFICAÇÃO CONCLUÍDA ==="
echo "📋 Para verificar logs detalhados: tail -f /root/backend/backend.log"
echo "" 