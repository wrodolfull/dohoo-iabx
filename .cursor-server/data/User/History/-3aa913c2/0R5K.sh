#!/bin/bash

echo "=== COPIANDO ARQUIVOS DE ÁUDIO PARA FREESWITCH ==="

# Configurações
TENANT_ID="7e3046d4-05b3-4970-bcd6-2ec63317fd62"  # Empresa Demo Final
TTS_DIR="/root/backend/tts-audio/$TENANT_ID"
FREESWITCH_AUDIO_DIR="/etc/freeswitch/recordings/ivr"

# Verificar se o diretório TTS existe
if [ ! -d "$TTS_DIR" ]; then
    echo "❌ Diretório TTS não encontrado: $TTS_DIR"
    exit 1
fi

# Criar diretório do FreeSWITCH se não existir
mkdir -p "$FREESWITCH_AUDIO_DIR"

echo "1. Procurando arquivos de áudio..."
ls -la "$TTS_DIR"/*.mp3 2>/dev/null || echo "Nenhum arquivo .mp3 encontrado"

echo ""
echo "2. Copiando arquivos para FreeSWITCH..."

# Copiar e renomear arquivos
for file in "$TTS_DIR"/*.mp3; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        name_without_ext="${filename%.*}"
        
        # Verificar se é um arquivo de pesquisa
        if [[ "$name_without_ext" == *"survey"* ]]; then
            echo "Copiando: $filename"
            cp "$file" "$FREESWITCH_AUDIO_DIR/${name_without_ext}.wav"
        fi
    fi
done

echo ""
echo "3. Verificando arquivos no FreeSWITCH..."
ls -la "$FREESWITCH_AUDIO_DIR"/*.wav 2>/dev/null || echo "Nenhum arquivo .wav encontrado"

echo ""
echo "4. Definindo permissões..."
chmod 644 "$FREESWITCH_AUDIO_DIR"/*.wav 2>/dev/null || echo "Nenhum arquivo para definir permissões"

echo ""
echo "=== ARQUIVOS COPIADOS ===" 