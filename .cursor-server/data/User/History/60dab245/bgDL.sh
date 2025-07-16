#!/bin/bash

echo "=== CRIANDO ARQUIVOS DE ÁUDIO DA PESQUISA ==="

# Configurações
API_URL="http://localhost:3001"
TENANT_ID="7e3046d4-05b3-4970-bcd6-2ec63317fd62"  # Empresa Demo Final
AUDIO_DIR="/etc/freeswitch/recordings/ivr"

# Criar diretório se não existir
mkdir -p "$AUDIO_DIR"

echo "1. Criando áudio de introdução..."
curl -X POST "$API_URL/tenants/$TENANT_ID/generate-tts" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Sua opinião é muito importante para nós. Por favor, avalie o atendimento que você acabou de receber.",
    "filename": "ivr-survey_intro.wav",
    "voice_id": "21m00Tcm4TlvDq8ikWAM"
  }'

echo ""
echo "2. Criando áudio da pergunta..."
curl -X POST "$API_URL/tenants/$TENANT_ID/generate-tts" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "De 1 a 5, onde 1 é muito insatisfeito e 5 é muito satisfeito, como você avalia o atendimento? Pressione o número correspondente à sua avaliação.",
    "filename": "ivr-survey_question.wav",
    "voice_id": "21m00Tcm4TlvDq8ikWAM"
  }'

echo ""
echo "3. Criando áudio de agradecimento..."
curl -X POST "$API_URL/tenants/$TENANT_ID/generate-tts" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Obrigado pela sua avaliação. Sua opinião nos ajuda a melhorar nossos serviços.",
    "filename": "ivr-survey_thanks.wav",
    "voice_id": "21m00Tcm4TlvDq8ikWAM"
  }'

echo ""
echo "4. Criando áudio de timeout..."
curl -X POST "$API_URL/tenants/$TENANT_ID/generate-tts" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Não foi possível capturar sua avaliação. Obrigado por nos contatar.",
    "filename": "ivr-survey_timeout.wav",
    "voice_id": "21m00Tcm4TlvDq8ikWAM"
  }'

echo ""
echo "5. Verificando arquivos criados..."
ls -la "$AUDIO_DIR"/*.wav

echo ""
echo "=== ARQUIVOS DE ÁUDIO CRIADOS ===" 