# 🎯 Dohoo IABX - Sistema de Comunicação Unificada

Sistema completo de comunicação unificada com FreeSWITCH, incluindo URA Builder, gestão de chamadas, relatórios avançados e integração com ElevenLabs TTS.

## 🚀 Funcionalidades Principais

- **URA Builder Visual** - Editor de fluxos de URA com ReactFlow
- **Gestão de Chamadas** - Controle completo de chamadas e extensões
- **Relatórios Avançados** - Analytics e métricas de uso
- **Integração ElevenLabs** - Geração de áudio TTS automática
- **FreeSWITCH Integration** - Provisionamento automático
- **Multi-tenant** - Suporte a múltiplos clientes
- **WebPhone** - Softphone integrado
- **Call Center** - Gestão de filas e agentes

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + Supabase
- **Banco de Dados**: PostgreSQL (Supabase)
- **VoIP**: FreeSWITCH
- **TTS**: ElevenLabs API
- **UI Components**: Radix UI + Shadcn/ui

## 📋 Pré-requisitos

- Ubuntu 20.04+ ou Debian 11+
- Node.js 18+
- npm ou yarn
- Git
- Acesso root/sudo

## 🚀 Instalação Rápida

### 1. Clone o Repositório
```bash
git clone https://github.com/wrodolfull/dohoo-iabx.git
cd dohoo-iabx
```

### 2. Execute o Script de Instalação
```bash
chmod +x install.sh
./install.sh
```

### 3. Configure as Variáveis de Ambiente
```bash
cp backend/.env.example backend/.env
# Edite o arquivo backend/.env com suas configurações
```

### 4. Inicie os Serviços
```bash
./start_services.sh
```

## 📖 Instalação Manual

### 1. Instalar FreeSWITCH
```bash
chmod +x scripts/install_freeswitch.sh
./scripts/install_freeswitch.sh
```

### 2. Configurar Banco de Dados
```bash
# Execute os scripts SQL no Supabase
scripts/sql/create_database.sql
scripts/sql/create_superadmin.sql
scripts/sql/create_freeswitch_tables.sql
```

### 3. Instalar Dependências
```bash
# Backend
cd backend
npm install

# Frontend
cd ../dohoo-voice-flow-control
npm install
```

### 4. Configurar Variáveis de Ambiente

#### Backend (.env)
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
```

## 🎯 URLs de Acesso

Após a instalação, acesse:

- **Frontend**: http://seu-ip:8000/
- **Backend**: http://seu-ip:3001/
- **Health Check**: http://seu-ip:3001/health

### 🔐 Credenciais Padrão
- **Email**: admin@dohoo.com
- **Senha**: Admin123!

## 📁 Estrutura do Projeto

```
dohoo-iabx/
├── backend/                 # API Node.js
├── dohoo-voice-flow-control/ # Frontend React
├── scripts/                 # Scripts de instalação
│   ├── install_freeswitch.sh
│   ├── setup_database.sh
│   └── configure_services.sh
├── sql/                     # Scripts SQL
├── docs/                    # Documentação
├── start_services.sh        # Iniciar serviços
├── stop_services.sh         # Parar serviços
└── status_services.sh       # Status dos serviços
```

## 🔧 Scripts Disponíveis

- `install.sh` - Instalação completa automática
- `start_services.sh` - Iniciar frontend (8000) e backend (3001)
- `stop_services.sh` - Parar todos os serviços
- `status_services.sh` - Verificar status dos serviços
- `scripts/install_freeswitch.sh` - Instalar FreeSWITCH
- `scripts/setup_database.sh` - Configurar banco de dados

## 📚 Documentação

- [URA Setup](URA_SETUP.md) - Configuração de URA Builder
- [FreeSWITCH Admin](docs/freeswitch-admin.md) - Administração FreeSWITCH
- [API Documentation](docs/api.md) - Documentação da API
- [Deployment Guide](docs/deployment.md) - Guia de deploy

## 🐛 Troubleshooting

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

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🆘 Suporte

- **Issues**: [GitHub Issues](https://github.com/wrodolfull/dohoo-iabx/issues)
- **Documentação**: [Wiki](https://github.com/wrodolfull/dohoo-iabx/wiki)
- **Email**: suporte@dohoo.com

---

**⭐ Se este projeto te ajudou, considere dar uma estrela no GitHub!** 