#!/bin/bash

# 🎯 Dohoo IABX - Script de Instalação Completa
# Este script instala todas as dependências necessárias para o sistema

set -e  # Exit on any error

echo "🚀 Iniciando instalação do Dohoo IABX..."
echo "=========================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar se está rodando como root
if [[ $EUID -ne 0 ]]; then
   log_error "Este script deve ser executado como root (sudo)"
   exit 1
fi

# Verificar sistema operacional
if [[ ! -f /etc/os-release ]]; then
    log_error "Sistema operacional não suportado"
    exit 1
fi

source /etc/os-release

if [[ "$ID" != "ubuntu" && "$ID" != "debian" ]]; then
    log_warning "Sistema operacional não testado: $ID"
    read -p "Continuar mesmo assim? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

log_info "Sistema detectado: $ID $VERSION_ID"

# Atualizar sistema
log_info "Atualizando sistema..."
apt update && apt upgrade -y

# Instalar dependências básicas
log_info "Instalando dependências básicas..."
apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# Instalar Node.js 18
log_info "Instalando Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Verificar versão do Node.js
NODE_VERSION=$(node --version)
log_success "Node.js instalado: $NODE_VERSION"

# Instalar npm global packages
log_info "Instalando pacotes npm globais..."
npm install -g npm@latest

# Instalar FreeSWITCH
log_info "Instalando FreeSWITCH..."
chmod +x scripts/install_freeswitch.sh
./scripts/install_freeswitch.sh

# Criar diretórios necessários
log_info "Criando diretórios do sistema..."
mkdir -p /var/lib/tts-audios
mkdir -p /var/log/dohoo
chown -R www-data:www-data /var/lib/tts-audios
chown -R www-data:www-data /var/log/dohoo

# Instalar dependências do backend
log_info "Instalando dependências do backend..."
cd backend
npm install
cd ..

# Instalar dependências do frontend
log_info "Instalando dependências do frontend..."
cd dohoo-voice-flow-control
npm install
cd ..

# Criar arquivo .env.example se não existir
if [ ! -f "backend/.env.example" ]; then
    log_info "Criando arquivo .env.example..."
    cat > backend/.env.example << 'EOF'
# ElevenLabs Configuration
ELEVENLABS_API_KEY=your_elevenlabs_api_key

# TTS Audio Storage
TTS_AUDIO_DIR=/var/lib/tts-audios

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# FreeSWITCH Configuration
FREESWITCH_HOST=localhost
FREESWITCH_PORT=8021
FREESWITCH_PASSWORD=ClueCon

# Server Configuration
PORT=3001
NODE_ENV=production
EOF
fi

# Configurar permissões dos scripts
log_info "Configurando permissões dos scripts..."
chmod +x start_services.sh
chmod +x stop_services.sh
chmod +x status_services.sh

# Criar service files para systemd (opcional)
log_info "Configurando serviços systemd..."
cat > /etc/systemd/system/dohoo-backend.service << 'EOF'
[Unit]
Description=Dohoo IABX Backend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/backend
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

cat > /etc/systemd/system/dohoo-frontend.service << 'EOF'
[Unit]
Description=Dohoo IABX Frontend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/dohoo-voice-flow-control
ExecStart=/usr/bin/npm run dev -- --host 0.0.0.0 --port 8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Recarregar systemd
systemctl daemon-reload

log_success "Instalação concluída com sucesso!"
echo ""
echo "🎉 Próximos passos:"
echo "1. Configure as variáveis de ambiente:"
echo "   cp backend/.env.example backend/.env"
echo "   nano backend/.env"
echo ""
echo "2. Execute os scripts SQL no Supabase:"
echo "   - scripts/sql/create_database.sql"
echo "   - scripts/sql/create_superadmin.sql"
echo "   - scripts/sql/create_freeswitch_tables.sql"
echo ""
echo "3. Inicie os serviços:"
echo "   ./start_services.sh"
echo ""
echo "4. Acesse o sistema:"
echo "   Frontend: http://$(hostname -I | awk '{print $1}'):8000/"
echo "   Backend:  http://$(hostname -I | awk '{print $1}'):3001/"
echo ""
echo "🔐 Credenciais padrão:"
echo "   Email: admin@dohoo.com"
echo "   Senha: Admin123!"
echo ""
log_success "Instalação finalizada! 🚀" 