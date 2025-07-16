#!/bin/bash

echo "=== COPIANDO ARQUIVOS DE ÁUDIO PARA O FREESWITCH ==="

# Diretório onde os arquivos de áudio foram criados
AUDIO_SOURCE_DIR="/var/lib/tts-audios/7e3046d4-05b3-4970-bcd6-2ec63317fd62"

# Diretório de gravações do FreeSWITCH
FREESWITCH_RECORDINGS_DIR="/var/lib/freeswitch/recordings"

# Verificar se o diretório de origem existe
if [ ! -d "$AUDIO_SOURCE_DIR" ]; then
    echo "Erro: Diretório de origem não encontrado: $AUDIO_SOURCE_DIR"
    exit 1
fi

# Verificar se o diretório de destino existe
if [ ! -d "$FREESWITCH_RECORDINGS_DIR" ]; then
    echo "Erro: Diretório de gravações do FreeSWITCH não encontrado: $FREESWITCH_RECORDINGS_DIR"
    exit 1
fi

# Copiar arquivos de áudio
echo "Copiando arquivos de áudio..."
cp "$AUDIO_SOURCE_DIR"/*.mp3 "$FREESWITCH_RECORDINGS_DIR/"

# Definir permissões corretas
echo "Definindo permissões..."
chown freeswitch:freeswitch "$FREESWITCH_RECORDINGS_DIR"/*.mp3
chmod 644 "$FREESWITCH_RECORDINGS_DIR"/*.mp3

# Listar arquivos copiados
echo "Arquivos copiados:"
ls -la "$FREESWITCH_RECORDINGS_DIR"/*.mp3

echo "=== ARQUIVOS COPIADOS COM SUCESSO ===" 