#!/bin/bash

# 🎯 FreeSWITCH Installation Script
# Instala e configura o FreeSWITCH para o Dohoo IABX

set -e

echo "🔧 Instalando FreeSWITCH..."

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Verificar se FreeSWITCH já está instalado
if command -v freeswitch &> /dev/null; then
    log_info "FreeSWITCH já está instalado"
    systemctl status freeswitch --no-pager -l
    exit 0
fi

# Adicionar repositório FreeSWITCH
log_info "Adicionando repositório FreeSWITCH..."
wget -O - https://files.freeswitch.org/repo/deb/debian-release/fsstretch-archive-keyring.asc | apt-key add -
echo "deb http://files.freeswitch.org/repo/deb/debian-release/ `lsb_release -sc` main" > /etc/apt/sources.list.d/freeswitch.list
echo "deb-src http://files.freeswitch.org/repo/deb/debian-release/ `lsb_release -sc` main" >> /etc/apt/sources.list.d/freeswitch.list

# Atualizar repositórios
apt update

# Instalar FreeSWITCH
log_info "Instalando FreeSWITCH..."
apt install -y freeswitch-meta-all

# Configurar FreeSWITCH
log_info "Configurando FreeSWITCH..."

# Backup da configuração original
cp /etc/freeswitch/freeswitch.xml /etc/freeswitch/freeswitch.xml.backup

# Configurar diretórios de áudio
mkdir -p /etc/freeswitch/recordings/ivr
mkdir -p /var/lib/freeswitch/recordings
chown -R freeswitch:freeswitch /etc/freeswitch/recordings
chown -R freeswitch:freeswitch /var/lib/freeswitch/recordings

# Iniciar e habilitar FreeSWITCH
log_info "Iniciando FreeSWITCH..."
systemctl enable freeswitch
systemctl start freeswitch

# Aguardar inicialização
sleep 5

# Verificar status
if systemctl is-active --quiet freeswitch; then
    log_success "FreeSWITCH iniciado com sucesso!"
else
    echo "❌ Erro ao iniciar FreeSWITCH"
    systemctl status freeswitch --no-pager -l
    exit 1
fi

# Configurar firewall (opcional)
log_info "Configurando firewall..."
ufw allow 5060/udp  # SIP
ufw allow 5060/tcp  # SIP
ufw allow 16384:32768/udp  # RTP
ufw allow 8021/tcp  # FreeSWITCH CLI

log_success "FreeSWITCH instalado e configurado com sucesso!"
echo ""
echo "📊 Informações do FreeSWITCH:"
echo "   Status: $(systemctl is-active freeswitch)"
echo "   Porta SIP: 5060"
echo "   Porta CLI: 8021"
echo "   Senha CLI: ClueCon"
echo ""
echo "🔧 Comandos úteis:"
echo "   systemctl status freeswitch"
echo "   fs_cli -x 'status'"
echo "   journalctl -u freeswitch -f" 