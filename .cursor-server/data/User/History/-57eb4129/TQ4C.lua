-- satisfaction_survey.lua
-- Script para gravação de pesquisa de satisfação

local rating = argv[1] or "0"
local caller_number = argv[2] or "unknown"
local call_uuid = argv[3] or session:get_uuid()

-- Log da pesquisa
freeswitch.consoleLog("INFO", "Satisfaction Survey - Rating: " .. rating .. ", Caller: " .. caller_number .. ", UUID: " .. call_uuid)

-- Validar rating
if tonumber(rating) < 1 or tonumber(rating) > 5 then
    freeswitch.consoleLog("ERROR", "Invalid rating: " .. rating)
    return
end

-- Conectar ao banco de dados (SQLite por padrão)
local dbh = freeswitch.Dbh("sqlite:///usr/local/freeswitch/db/satisfaction.db")

if dbh:connected() == false then
    freeswitch.consoleLog("ERROR", "Failed to connect to satisfaction database")
    return
end

-- Criar tabela se não existe
local create_table_sql = [[
    CREATE TABLE IF NOT EXISTS satisfaction_surveys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        call_uuid VARCHAR(36) NOT NULL,
        caller_number VARCHAR(20) NOT NULL,
        rating INTEGER NOT NULL,
        survey_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        agent_number VARCHAR(20),
        queue_name VARCHAR(50),
        call_duration INTEGER
    )
]]

dbh:query(create_table_sql)

-- Obter informações adicionais da chamada se disponível
local agent_number = session:getVariable("cc_agent") or "unknown"
local queue_name = session:getVariable("cc_queue") or "unknown" 
local call_start = session:getVariable("start_epoch") or os.time()
local call_duration = os.time() - call_start

-- Inserir pesquisa de satisfação
local insert_sql = string.format([[
    INSERT INTO satisfaction_surveys 
    (call_uuid, caller_number, rating, agent_number, queue_name, call_duration) 
    VALUES ('%s', '%s', %d, '%s', '%s', %d)
]], call_uuid, caller_number, tonumber(rating), agent_number, queue_name, call_duration)

local result = dbh:query(insert_sql)

if result then
    freeswitch.consoleLog("INFO", "Satisfaction survey saved successfully")
    
    -- Evento personalizado para notificar o sistema
    local event = freeswitch.Event("CUSTOM", "callcenter::satisfaction")
    event:addHeader("Call-UUID", call_uuid)
    event:addHeader("Caller-Number", caller_number)
    event:addHeader("Rating", rating)
    event:addHeader("Agent-Number", agent_number)
    event:addHeader("Queue-Name", queue_name)
    event:addHeader("Call-Duration", tostring(call_duration))
    event:fire()
    
    -- Atualizar estatísticas em tempo real via Event Socket
    local api = freeswitch.API()
    api:executeString("event_socket", "sendevent CUSTOM Event-Subclass=callcenter::satisfaction Call-UUID=" .. call_uuid .. " Rating=" .. rating)
    
else
    freeswitch.consoleLog("ERROR", "Failed to save satisfaction survey")
end

dbh:release() 