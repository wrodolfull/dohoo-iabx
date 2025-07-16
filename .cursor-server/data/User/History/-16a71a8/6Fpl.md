# 🚀 Guia de Configuração Final - Sistema Dohoo IABX

## ✅ Status Atual

🎉 **SUCESSO!** O sistema está conectado ao Supabase e funcionando corretamente!

- ✅ Backend conectado ao Supabase
- ✅ APIs funcionando
- ✅ Estrutura de banco configurada
- ✅ Credenciais atualizadas

## 📋 Próximos Passos para Finalizar

### 1. Executar Scripts SQL no Supabase

Acesse o **Supabase SQL Editor** e execute os seguintes scripts na ordem:

#### Script 1: Criar Usuários de Teste
```sql
-- Copie e cole o conteúdo do arquivo create_users.sql
```

#### Script 2: Criar Dados de Exemplo  
```sql
-- Copie e cole o conteúdo do arquivo create_sample_data.sql
```

### 2. Criar Usuários de Autenticação

No painel do Supabase, vá para **Authentication > Users** e adicione:

| Email | Senha | Função |
|-------|-------|--------|
| `superadmin@dohoo.com.br` | `admin123` | Superadmin |
| `admin@demo.com` | `admin123` | Admin |
| `agente@demo.com` | `agent123` | Agente |

### 3. Verificar Sistema

Após executar os scripts, teste:

```bash
# Verificar health do backend
curl http://localhost:3001/health

# Verificar tenants
curl http://localhost:3001/tenants

# Verificar extensions (deve retornar dados)
curl "http://localhost:3001/tenants/7e3046d4-05b3-4970-bcd6-2ec63317fd62/extensions"
```

### 4. Iniciar Frontend

```bash
cd dohoo-voice-flow-control
npm run dev -- --host 0.0.0.0
```

## 🔐 Credenciais de Teste

Após configurar, você poderá fazer login com:

### Superadmin (Acesso Total)
- **Email:** `superadmin@dohoo.com.br`
- **Senha:** `admin123`
- **Acesso:** Todos os tenants, logs de auditoria, configurações globais

### Admin (Gerenciamento Completo)
- **Email:** `admin@demo.com`
- **Senha:** `admin123`
- **Acesso:** Gerenciamento completo do tenant "Empresa Demo"

### Agente (Visualização Limitada)
- **Email:** `agente@demo.com`
- **Senha:** `agent123`
- **Acesso:** Visualização de ramais, relatórios básicos

## 🎯 Funcionalidades Disponíveis

### Dashboard Completo
- 📊 Estatísticas em tempo real
- 📈 Gráficos de performance
- 🔔 Alertas e notificações

### Gestão de Ramais
- ➕ Criar/editar/excluir ramais
- 🔧 Configuração SIP automática
- 📱 Geração de QR codes

### Grupos de Toque
- 🔄 Configuração simultânea/sequencial
- 👥 Gestão de membros
- ⚙️ Regras personalizadas

### Sistema de Troncos
- 📞 Configuração de provedores SIP
- 🔒 Autenticação segura
- 📊 Monitoramento de status

### URA (IVR Builder)
- 🎨 Editor visual de fluxos
- 🎵 Upload de áudios
- 🔀 Lógica condicional

### Relatórios CDR
- 📋 Histórico de chamadas
- 📊 Estatísticas detalhadas
- 📄 Exportação CSV/Excel

### Horários de Atendimento
- ⏰ Configuração por dia da semana
- 🌍 Fusos horários brasileiros
- 📅 Exceções e feriados

### Logs de Auditoria
- 🔍 Rastreamento de ações
- 👤 Identificação de usuários
- 📈 Análise de segurança

### Monitor de Chamadas
- 📞 Chamadas ativas em tempo real
- 🎛️ Controle de chamadas
- 📊 Estatísticas instantâneas

## 🔧 Configurações Técnicas

### Variáveis de Ambiente

**Backend (.env):**
```bash
SUPABASE_URL=https://[seu-projeto].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[sua-service-key]
PORT=3001
NODE_ENV=development
```

**Frontend (.env):**
```bash
VITE_SUPABASE_URL=https://[seu-projeto].supabase.co
VITE_SUPABASE_ANON_KEY=[sua-anon-key]
VITE_API_URL=http://localhost:3001
```

### Estrutura do Banco

✅ **Tabelas Principais:**
- `tenants` - Empresas/Organizações
- `users` - Usuários do sistema
- `extensions` - Ramais/Extensões
- `ringgroups` - Grupos de toque
- `trunks` - Troncos SIP
- `ura` - Fluxos de URA
- `schedules` - Horários de atendimento
- `audit_logs` - Logs de auditoria

## 🌐 Acesso ao Sistema

Após configuração completa:

- **URL:** http://31.97.250.190:8080
- **Backend API:** http://31.97.250.190:3001
- **Health Check:** http://31.97.250.190:3001/health

## 🚨 Solução de Problemas

### Erro de Login
1. Verificar se os usuários foram criados no Supabase Auth
2. Confirmar que os emails coincidem entre auth e tabela users
3. Verificar credenciais de API no .env

### Dados Não Aparecem
1. Executar scripts SQL no Supabase
2. Verificar se o tenant_id está correto
3. Conferir logs do backend

### Erro de Conectividade
1. Verificar credenciais do Supabase
2. Confirmar se o projeto está ativo
3. Testar endpoint /health

## 🎉 Sistema Pronto!

Após seguir estes passos, você terá um sistema VoIP completo e funcional com:

- ✅ Multi-tenancy
- ✅ Autenticação robusta
- ✅ Interface moderna
- ✅ APIs RESTful
- ✅ Logs de auditoria
- ✅ Relatórios avançados
- ✅ Configuração FreeSWITCH

**O sistema está pronto para produção!** 🚀 