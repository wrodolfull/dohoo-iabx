-- Test Survey Script
-- Script de teste para verificar funcionamento do Lua no FreeSWITCH

-- Função para log
local function log(message)
    freeswitch.consoleLog("info", "[TEST_SURVEY] " .. message .. "\n")
end

-- Função para criar JSON simples (sem dependência externa)
local function create_json(data)
    local json = "{"
    local first = true
    
    for key, value in pairs(data) do
        if not first then
            json = json .. ","
        end
        first = false
        
        if type(value) == "string" then
            json = json .. string.format('"%s":"%s"', key, value)
        else
            json = json .. string.format('"%s":%s', key, tostring(value))
        end
    end
    
    json = json .. "}"
    return json
end

-- Função principal de teste
function test_survey()
    log("=== TESTE DO SCRIPT DE PESQUISA ===")
    log("Data/Hora: " .. os.date("%Y-%m-%d %H:%M:%S"))
    log("Versão Lua: " .. _VERSION)
    
    -- Testar variáveis de sessão (se disponível)
    if session then
        log("Sessão disponível")
        log("UUID: " .. tostring(session:getVariable("uuid")))
        log("Caller ID: " .. tostring(session:getVariable("caller_id_number")))
    else
        log("Sessão não disponível (execução direta)")
    end
    
    -- Testar JSON simples
    log("Testando JSON simples")
    local test_data = { test = "value", number = 123 }
    local json_string = create_json(test_data)
    log("JSON encode test: " .. json_string)
    
    -- Testar execução de comando
    local handle = io.popen("echo 'test'")
    local result = handle:read("*a")
    handle:close()
    log("Comando echo test: " .. result)
    
    log("=== TESTE CONCLUÍDO ===")
end

-- Executar teste
test_survey() 