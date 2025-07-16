# 🔐 Credenciais de Acesso - Dohoo IABX

## 🎯 Como Fazer Login

### 1. Execute o Script de Criação de Usuários
Primeiro, execute o script `create_superadmin.sql` no Supabase SQL Editor:

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Cole o conteúdo do arquivo `create_superadmin.sql`
4. Execute o script

### 2. Acesse o Sistema
URL: **http://31.97.250.190:8080**

## 👤 Usuários Disponíveis

### 🔥 SUPERADMIN (Acesso Total)
- **Email:** `superadmin@dohoo.com.br`
- **Senha:** `qualquer senha` (sistema mock)
- **Permissões:** Acesso total ao sistema
- **Recursos:** Todos os menus, incluindo Logs de Auditoria

### 👨‍💼 ADMIN (Gerenciamento Completo)
- **Email:** `admin@demo.com`
- **Senha:** `qualquer senha` (sistema mock)
- **Permissões:** Gerenciamento completo do tenant
- **Recursos:** Dashboard, Ramais, Grupos, URA, Troncos, Rotas, Usuários, Relatórios, Horários

### 👩‍💻 AGENTE (Visualização Limitada)
- **Email:** `agente@demo.com`
- **Senha:** `qualquer senha` (sistema mock)
- **Permissões:** Visualização limitada
- **Recursos:** Dashboard, Ramais (view), Relatórios básicos

## 🔧 Sistema de Autenticação

### Modo Mock Ativo
O sistema está configurado em **modo mock** para facilitar os testes:
- ✅ Qualquer senha funciona para os emails listados
- ✅ Login instantâneo sem validação de senha
- ✅ Usuários pré-configurados com permissões corretas

### Funcionalidades por Role

#### 🔥 SUPERADMIN
- ✅ Gerenciar todos os tenants
- ✅ Visualizar logs de auditoria
- ✅ Configurações globais
- ✅ Relatórios avançados
- ✅ Monitoramento completo

#### 👨‍💼 ADMIN
- ✅ Gerenciar ramais e grupos
- ✅ Configurar URA e troncos
- ✅ Definir rotas de entrada/saída
- ✅ Gerenciar usuários do tenant
- ✅ Configurar horários de atendimento
- ✅ Visualizar relatórios e chamadas ativas

#### 👩‍💻 AGENTE
- ✅ Visualizar dashboard
- ✅ Ver ramais (somente leitura)
- ✅ Relatórios básicos
- ✅ Chamadas ativas (somente visualização)

## 🚀 Passos para Testar

### 1. Configurar Banco de Dados
```sql
-- Execute no Supabase SQL Editor
-- Arquivo: database_simple_fix.sql
-- Depois: create_superadmin.sql
```

### 2. Iniciar Backend
```bash
cd /root/backend
node index.js
# Deve mostrar: Backend running on port 3001
```

### 3. Iniciar Frontend
```bash
cd /root/dohoo-voice-flow-control
npm run dev -- --host 0.0.0.0
# Deve mostrar: Network: http://31.97.250.190:8080/
```

### 4. Fazer Login
1. Acesse: http://31.97.250.190:8080
2. Use um dos emails listados acima
3. Digite qualquer senha
4. Clique em "Entrar"

## 🔍 Verificação de Funcionamento

### ✅ Login Bem-sucedido
- Redirecionamento para dashboard
- Nome do usuário no header
- Menus visíveis conforme permissões
- Logs de auditoria registrados (para superadmin)

### ❌ Problemas Comuns
- **"Email ou senha incorretos"**: Use um dos emails listados
- **Página em branco**: Verifique se backend está rodando
- **Erro 404**: Confirme a URL e porta

## 📋 Checklist de Teste

### Superadmin (superadmin@dohoo.com.br)
- [ ] Login funcionando
- [ ] Acesso ao menu "Logs de Auditoria"
- [ ] Visualização de todos os tenants
- [ ] Acesso a configurações globais

### Admin (admin@demo.com)
- [ ] Login funcionando
- [ ] Acesso a ramais e grupos
- [ ] Configuração de horários
- [ ] Relatórios funcionando

### Agente (agente@demo.com)
- [ ] Login funcionando
- [ ] Acesso limitado aos menus
- [ ] Visualização de ramais (somente leitura)
- [ ] Dashboard básico

## 🔄 Próximos Passos

1. **Testar funcionalidades** com cada tipo de usuário
2. **Configurar dados** (ramais, troncos, etc.)
3. **Integrar FreeSWITCH** quando necessário
4. **Migrar para autenticação real** quando estiver pronto

## 📞 Suporte

Se tiver problemas:
1. Verifique se o backend está rodando
2. Confirme se o banco foi configurado corretamente
3. Use as credenciais exatas listadas acima
4. Verifique o console do navegador para erros 