#!/bin/bash

echo "🧪 === TESTE DE INTEGRAÇÃO FREESWITCH ==="
echo ""

# Verificar se FreeSWITCH está rodando
echo "1. Verificando status do FreeSWITCH..."
if pgrep -f freeswitch > /dev/null; then
    echo "   ✅ FreeSWITCH está rodando"
else
    echo "   ⚠️ FreeSWITCH não está rodando"
fi

# Verificar se fs_cli existe
echo ""
echo "2. Verificando fs_cli..."
if [ -f "/usr/local/freeswitch/bin/fs_cli" ]; then
    echo "   ✅ fs_cli encontrado em /usr/local/freeswitch/bin/fs_cli"
else
    echo "   ❌ fs_cli não encontrado"
fi

# Verificar diretórios do FreeSWITCH
echo ""
echo "3. Verificando diretórios do FreeSWITCH..."
for dir in "/etc/freeswitch/directory" "/etc/freeswitch/dialplan" "/etc/freeswitch/sip_profiles"; do
    if [ -d "$dir" ]; then
        echo "   ✅ $dir existe"
        echo "      Arquivos: $(ls -1 $dir 2>/dev/null | wc -l)"
    else
        echo "   ❌ $dir não existe"
    fi
done

# Criar tenant de teste via API
echo ""
echo "4. Criando tenant de teste..."
TENANT_RESPONSE=$(curl -s -X POST http://localhost:3001/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teste FreeSWITCH Script",
    "domain": "testescript.local", 
    "contact_email": "admin@testescript.com"
  }')

if [ $? -eq 0 ]; then
    echo "   ✅ Tenant criado via API"
    TENANT_ID=$(echo $TENANT_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    echo "   📋 ID do tenant: $TENANT_ID"
    
    # Testar integração FreeSWITCH
    if [ -n "$TENANT_ID" ]; then
        echo ""
        echo "5. Testando integração FreeSWITCH..."
        TEST_RESPONSE=$(curl -s -X POST http://localhost:3001/test-freeswitch/$TENANT_ID)
        
        if [ $? -eq 0 ]; then
            echo "   ✅ Teste de integração executado"
            echo "   📋 Resposta:"
            echo "$TEST_RESPONSE" | grep -o '"message":"[^"]*"' | cut -d'"' -f4
        else
            echo "   ❌ Erro no teste de integração"
        fi
    fi
else
    echo "   ❌ Erro ao criar tenant"
fi

# Verificar arquivos XML criados
echo ""
echo "6. Verificando arquivos XML criados..."
sleep 2

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

# Testar fs_cli se disponível
echo ""
echo "7. Testando fs_cli..."
if [ -f "/usr/local/freeswitch/bin/fs_cli" ]; then
    echo "   🔄 Tentando executar reloadxml..."
    /usr/local/freeswitch/bin/fs_cli -x "reloadxml" 2>/dev/null || echo "   ⚠️ Não foi possível conectar ao FreeSWITCH"
else
    echo "   ⚠️ fs_cli não disponível"
fi

echo ""
echo "🎯 === TESTE CONCLUÍDO ==="
echo "📋 Para verificar logs detalhados: tail -f /root/backend/backend.log"
echo "" 