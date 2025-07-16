-- Survey After Call Script
-- Executado pelo FreeSWITCH após encerramento da chamada
-- Coleta avaliação de satisfação do cliente

-- Configurações
local API_URL = "http://localhost:3001"
local SURVEY_TIMEOUT = 10000  -- 10 segundos para responder
local MAX_DIGITS = 1          -- Apenas 1 dígito (1-5)

-- Função para log
local function log(message)
    freeswitch.consoleLog("info", "[SURVEY] " .. message .. "\n")
end

-- Função para executar curl
local function execute_curl(url, data)
    local curl_cmd = string.format(
        "curl -s -X POST %s -H 'Content-Type: application/json' -d '%s'",
        url, data
    )
    log("Executando: " .. curl_cmd)
    
    local handle = io.popen(curl_cmd)
    local result = handle:read("*a")
    handle:close()
    
    log("Resposta: " .. result)
    return result
end

-- Função principal
function survey_after_call(session)
    log("Iniciando pesquisa de satisfação")
    
    -- Verificar se a pesquisa está habilitada
    local survey_enabled = session:getVariable("survey_enabled")
    local survey_template_id = session:getVariable("survey_template_id")
    local ring_group_id = session:getVariable("ring_group_id")
    
    log("Survey enabled: " .. tostring(survey_enabled))
    log("Survey template ID: " .. tostring(survey_template_id))
    log("Ring group ID: " .. tostring(ring_group_id))
    
    if survey_enabled ~= "true" or not survey_template_id then
        log("Pesquisa não habilitada ou template não encontrado")
        return
    end
    
    -- Aguardar um momento após o encerramento da chamada
    session:sleep(1000)
    
    -- Reproduzir áudio de introdução
    log("Reproduzindo áudio de introdução")
    local intro_result = session:execute("playback", "ivr/ivr-survey_intro.wav")
    if intro_result ~= "SUCCESS" then
        log("Erro ao reproduzir áudio de introdução: " .. tostring(intro_result))
    end
    
    -- Reproduzir a pergunta da pesquisa
    log("Reproduzindo pergunta da pesquisa")
    local question_result = session:execute("playback", "ivr/ivr-survey_question.wav")
    if question_result ~= "SUCCESS" then
        log("Erro ao reproduzir pergunta: " .. tostring(question_result))
    end
    
    -- Coletar resposta DTMF
    log("Aguardando resposta DTMF")
    session:execute("set", "silence_threshold=2000")
    session:execute("set", "silence_timeout=5000")
    
    local digits = session:getDigits(MAX_DIGITS, "", SURVEY_TIMEOUT, "#")
    log("Dígitos recebidos: " .. tostring(digits))
    
    -- Validar resposta
    if digits and digits ~= "" and tonumber(digits) and tonumber(digits) >= 1 and tonumber(digits) <= 5 then
        log("Resposta válida recebida: " .. digits)
        
        -- Preparar dados para envio
        local survey_data = {
            ring_group_id = ring_group_id,
            survey_template_id = tonumber(survey_template_id),
            rating = tonumber(digits),
            call_id = session:getVariable("uuid"),
            caller_id = session:getVariable("caller_id_number"),
            timestamp = os.date("%Y-%m-%d %H:%M:%S")
        }
        
        local json_data = require("cjson").encode(survey_data)
        
        -- Enviar resposta para o backend
        log("Enviando resposta para o backend")
        local response = execute_curl(API_URL .. "/survey-responses", json_data)
        
        -- Reproduzir agradecimento
        log("Reproduzindo agradecimento")
        local thanks_result = session:execute("playback", "ivr/ivr-survey_thanks.wav")
        if thanks_result ~= "SUCCESS" then
            log("Erro ao reproduzir agradecimento: " .. tostring(thanks_result))
        end
    else
        log("Resposta inválida ou timeout")
        -- Reproduzir mensagem de timeout
        session:execute("playback", "ivr/ivr-survey_timeout.wav")
    end
    
    log("Pesquisa de satisfação finalizada")
end

-- Executar a função principal
survey_after_call(session) 