#!/bin/bash

echo "=== TESTE DO FREESWITCH LUA ==="

# Verificar se o FreeSWITCH está rodando
echo "1. Verificando se o FreeSWITCH está rodando..."
if pgrep -x "freeswitch" > /dev/null; then
    echo "✅ FreeSWITCH está rodando"
else
    echo "❌ FreeSWITCH não está rodando"
    exit 1
fi

# Verificar se os scripts Lua existem
echo "2. Verificando scripts Lua..."
if [ -f "/etc/freeswitch/scripts/test_survey.lua" ]; then
    echo "✅ Script de teste encontrado"
else
    echo "❌ Script de teste não encontrado"
    exit 1
fi

if [ -f "/etc/freeswitch/scripts/survey_after_call.lua" ]; then
    echo "✅ Script principal encontrado"
else
    echo "❌ Script principal não encontrado"
    exit 1
fi

# Testar conexão com FreeSWITCH CLI
echo "3. Testando conexão com FreeSWITCH CLI..."
if command -v fs_cli > /dev/null; then
    echo "✅ fs_cli encontrado"
    
    # Testar execução do script Lua
    echo "4. Executando script de teste..."
    fs_cli -x "lua /etc/freeswitch/scripts/test_survey.lua"
    
    if [ $? -eq 0 ]; then
        echo "✅ Script executado com sucesso"
    else
        echo "❌ Erro ao executar script"
    fi
else
    echo "❌ fs_cli não encontrado"
fi

# Verificar logs do FreeSWITCH
echo "5. Verificando logs do FreeSWITCH..."
if [ -f "/var/log/freeswitch/freeswitch.log" ]; then
    echo "✅ Log encontrado"
    echo "Últimas linhas do log:"
    tail -10 /var/log/freeswitch/freeswitch.log
else
    echo "❌ Log não encontrado"
fi

echo "=== TESTE CONCLUÍDO ===" 