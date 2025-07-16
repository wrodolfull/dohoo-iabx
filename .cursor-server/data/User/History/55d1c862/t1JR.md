# 🚀 Guia de Deploy - Dohoo IABX

Este guia fornece instruções detalhadas para fazer o deploy do Dohoo IABX em diferentes ambientes.

## 📋 Pré-requisitos

- Ubuntu 20.04+ ou Debian 11+
- Node.js 18+
- Git
- Acesso root/sudo
- Conta no Supabase (gratuita)

## 🎯 Deploy Rápido (Recomendado)

### 1. Clone e Instalação Automática

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/dohoo-iabx.git
cd dohoo-iabx

# Execute a instalação automática
chmod +x install.sh
sudo ./install.sh
```

### 2. Configure o Banco de Dados

```bash
# Execute o script de setup do banco
./scripts/setup_database.sh

# Siga as instruções para configurar o Supabase
# Execute os scripts SQL no painel do Supabase
```

### 3. Configure as Variáveis de Ambiente

```bash
# Copie o arquivo de exemplo
cp backend/.env.example backend/.env

# Edite com suas configurações
nano backend/.env
```

### 4. Inicie os Serviços

```bash
./start_services.sh
```

## 🔧 Deploy Manual

### 1. Instalar Dependências do Sistema

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependências básicas
sudo apt install -y curl wget git unzip software-properties-common

# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar instalação
node --version
npm --version
```

### 2. Instalar FreeSWITCH

```bash
# Execute o script de instalação do FreeSWITCH
chmod +x scripts/install_freeswitch.sh
sudo ./scripts/install_freeswitch.sh
```

### 3. Configurar Projeto

```bash
# Instalar dependências do backend
cd backend
npm install
cd ..

# Instalar dependências do frontend
cd dohoo-voice-flow-control
npm install
cd ..
```

### 4. Configurar Banco de Dados

Siga as instruções em `scripts/setup_database.sh` para configurar o Supabase.

### 5. Configurar Variáveis de Ambiente

Crie o arquivo `backend/.env` com as seguintes variáveis:

```bash
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
```

## 🌐 Deploy em Produção

### 1. Configurar Firewall

```bash
# Permitir portas necessárias
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 8000/tcp  # Frontend
sudo ufw allow 3001/tcp  # Backend
sudo ufw allow 5060/udp  # SIP
sudo ufw allow 5060/tcp  # SIP
sudo ufw allow 16384:32768/udp  # RTP

# Habilitar firewall
sudo ufw enable
```

### 2. Configurar Nginx (Opcional)

```bash
# Instalar Nginx
sudo apt install -y nginx

# Configurar proxy reverso
sudo nano /etc/nginx/sites-available/dohoo-iabx
```

Conteúdo do arquivo de configuração:

```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    # Frontend
    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Habilitar site
sudo ln -s /etc/nginx/sites-available/dohoo-iabx /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3. Configurar SSL com Let's Encrypt

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obter certificado SSL
sudo certbot --nginx -d seu-dominio.com

# Configurar renovação automática
sudo crontab -e
# Adicionar linha: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 4. Configurar Systemd Services

Os serviços systemd já são criados pelo script de instalação. Para gerenciá-los:

```bash
# Habilitar serviços
sudo systemctl enable dohoo-backend
sudo systemctl enable dohoo-frontend

# Iniciar serviços
sudo systemctl start dohoo-backend
sudo systemctl start dohoo-frontend

# Verificar status
sudo systemctl status dohoo-backend
sudo systemctl status dohoo-frontend
```

## 🐳 Deploy com Docker (Opcional)

### 1. Criar Dockerfile para Backend

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

CMD ["node", "index.js"]
```

### 2. Criar Dockerfile para Frontend

```dockerfile
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
```

### 3. Docker Compose

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
    env_file:
      - ./backend/.env

  frontend:
    build: ./dohoo-voice-flow-control
    ports:
      - "8000:80"
    depends_on:
      - backend

  freeswitch:
    image: freeswitch/freeswitch:latest
    ports:
      - "5060:5060/udp"
      - "5060:5060/tcp"
      - "16384-32768:16384-32768/udp"
    volumes:
      - ./freeswitch-config:/etc/freeswitch
```

## 🔍 Monitoramento e Logs

### 1. Verificar Logs

```bash
# Logs do backend
tail -f backend.log
sudo journalctl -u dohoo-backend -f

# Logs do frontend
tail -f frontend.log
sudo journalctl -u dohoo-frontend -f

# Logs do FreeSWITCH
sudo journalctl -u freeswitch -f
```

### 2. Monitoramento de Recursos

```bash
# Verificar uso de CPU e memória
htop

# Verificar portas em uso
netstat -tlnp

# Verificar espaço em disco
df -h
```

### 3. Backup

```bash
# Backup do banco de dados (Supabase)
# Use o painel do Supabase para exportar dados

# Backup de configurações
tar -czf backup-$(date +%Y%m%d).tar.gz \
  backend/.env \
  /etc/freeswitch \
  /var/lib/tts-audios
```

## 🚨 Troubleshooting

### Problemas Comuns

1. **FreeSWITCH não inicia**
   ```bash
   sudo systemctl status freeswitch
   sudo journalctl -u freeswitch -f
   ```

2. **Backend não conecta ao banco**
   ```bash
   # Verificar variáveis de ambiente
   cat backend/.env
   # Testar conexão
   curl http://localhost:3001/health
   ```

3. **Frontend não carrega**
   ```bash
   # Verificar logs
   tail -f frontend.log
   # Verificar porta
   netstat -tlnp | grep 8000
   ```

4. **Problemas de rede**
   ```bash
   # Verificar firewall
   sudo ufw status
   # Verificar portas
   sudo netstat -tlnp
   ```

## 📞 Suporte

- **Issues**: [GitHub Issues](https://github.com/seu-usuario/dohoo-iabx/issues)
- **Documentação**: [Wiki](https://github.com/seu-usuario/dohoo-iabx/wiki)
- **Email**: suporte@dohoo.com

---

**✅ Deploy concluído! Acesse: http://seu-ip:8000/** 