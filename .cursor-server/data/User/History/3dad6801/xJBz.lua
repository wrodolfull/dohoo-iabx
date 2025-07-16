-- Generate Survey Audio Script
-- Script auxiliar para gerar arquivos de áudio da pesquisa via TTS

-- Configurações
local API_URL = "http://localhost:3001"
local AUDIO_DIR = "/etc/freeswitch/recordings/ivr"

-- Função para log
local function log(message)
    freeswitch.consoleLog("info", "[SURVEY_AUDIO] " .. message .. "\n")
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
    
    return result
end

-- Função para gerar áudio via TTS
function generate_survey_audio(tenant_id, text, filename, voice_id)
    log("Gerando áudio: " .. filename)
    
    local tts_data = {
        text = text,
        voice_id = voice_id or "21m00Tcm4TlvDq8ikWAM", -- Voz padrão
        filename = filename
    }
    
    local json_data = require("cjson").encode(tts_data)
    local response = execute_curl(API_URL .. "/tenants/" .. tenant_id .. "/generate-tts", json_data)
    
    log("Resposta TTS: " .. response)
    return response
end

-- Função para criar áudios padrão da pesquisa
function create_default_survey_audio(tenant_id)
    log("Criando áudios padrão da pesquisa para tenant: " .. tenant_id)
    
    -- Criar diretório se não existir
    os.execute("mkdir -p " .. AUDIO_DIR)
    
    -- Áudio de introdução
    local intro_text = "Sua opinião é muito importante para nós. Por favor, avalie o atendimento que você acabou de receber."
    generate_survey_audio(tenant_id, intro_text, "ivr-survey_intro.wav")
    
    -- Áudio da pergunta
    local question_text = "De 1 a 5, onde 1 é muito insatisfeito e 5 é muito satisfeito, como você avalia o atendimento? Pressione o número correspondente à sua avaliação."
    generate_survey_audio(tenant_id, question_text, "ivr-survey_question.wav")
    
    -- Áudio de agradecimento
    local thanks_text = "Obrigado pela sua avaliação. Sua opinião nos ajuda a melhorar nossos serviços."
    generate_survey_audio(tenant_id, thanks_text, "ivr-survey_thanks.wav")
    
    -- Áudio de timeout
    local timeout_text = "Não foi possível capturar sua avaliação. Obrigado por nos contatar."
    generate_survey_audio(tenant_id, timeout_text, "ivr-survey_timeout.wav")
    
    log("Áudios padrão criados com sucesso")
end

-- Função para criar áudio personalizado da pergunta
function create_custom_question_audio(tenant_id, question_text, survey_id)
    log("Criando áudio personalizado para pergunta: " .. survey_id)
    
    local filename = "ivr-survey_question_" .. survey_id .. ".wav"
    generate_survey_audio(tenant_id, question_text, filename)
    
    return filename
end

-- Exportar funções
return {
    create_default_survey_audio = create_default_survey_audio,
    create_custom_question_audio = create_custom_question_audio,
    generate_survey_audio = generate_survey_audio
} 