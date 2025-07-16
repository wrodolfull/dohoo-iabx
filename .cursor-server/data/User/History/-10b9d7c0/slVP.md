# 🗄️ Configuração do Banco de Dados - Sistema Dohoo IABX

## ⚠️ Status Atual

O sistema foi configurado para trabalhar **APENAS com dados reais do banco**, sem dados mock. Atualmente, há um erro de conectividade com o Supabase devido a credenciais inválidas.

## 🔧 Opções de Configuração

### Opção 1: Configurar Supabase (Recomendado)

1. **Criar projeto no Supabase:**
   - Acesse: https://supabase.com/dashboard
   - Crie um novo projeto
   - Anote as credenciais

2. **Obter credenciais:**
   - URL do projeto: `https://[project-id].supabase.co`
   - Anon Key: Na seção "API Keys"
   - Service Role Key: Na seção "API Keys"

3. **Configurar backend (.env):**
   ```bash
   # Substitua pelas credenciais reais
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

4. **Configurar frontend (.env):**
   ```bash
   # Substitua pelas credenciais reais
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

5. **Executar scripts SQL:**
   - Execute `database_schema.sql` no Supabase SQL Editor
   - Execute `create_superadmin.sql` para criar usuários de teste

### Opção 2: PostgreSQL Local

1. **Instalar PostgreSQL:**
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   
   # Iniciar serviço
   sudo systemctl start postgresql
   sudo systemctl enable postgresql
   ```

2. **Configurar banco:**
   ```bash
   # Criar banco
   sudo -u postgres createdb dohoo_iabx
   
   # Executar schema
   sudo -u postgres psql dohoo_iabx < database_schema.sql
   sudo -u postgres psql dohoo_iabx < create_superadmin.sql
   ```

3. **Configurar conexão:**
   ```bash
   # Backend .env
   DATABASE_URL=postgresql://postgres:password@localhost:5432/dohoo_iabx
   ```

### Opção 3: Dados Mock Temporários (Desenvolvimento)

Se preferir usar dados mock temporariamente para desenvolvimento:

1. **Modificar AuthContext.tsx:**
   - Adicionar sistema de fallback para dados mock
   - Permitir login com credenciais de teste

2. **Modificar backend/index.js:**
   - Adicionar dados mock para todas as rotas
   - Simular operações CRUD

## 🧪 Teste de Conectividade

Para testar a conectividade com o banco:

```bash
cd backend
node test_supabase.js
```

## 📊 Status das Tabelas Necessárias

- [ ] `tenants` - Empresas/Organizações
- [ ] `users` - Usuários do sistema
- [ ] `extensions` - Ramais/Extensões
- [ ] `ringgroups` - Grupos de toque
- [ ] `trunks` - Troncos SIP
- [ ] `inbound_routes` - Rotas de entrada
- [ ] `outbound_routes` - Rotas de saída
- [ ] `ura` - Fluxos de URA
- [ ] `schedules` - Horários de atendimento
- [ ] `audit_logs` - Logs de auditoria
- [ ] `cdr` - Registros de chamadas
- [ ] `system_settings` - Configurações do sistema

## 🚀 Próximos Passos

1. **Escolher uma das opções acima**
2. **Configurar credenciais corretas**
3. **Executar scripts SQL**
4. **Testar conectividade**
5. **Iniciar sistema**

## 🔍 Troubleshooting

### Erro: "Invalid API key"
- Verificar se as credenciais do Supabase estão corretas
- Confirmar se o projeto Supabase está ativo
- Verificar se as chaves não expiraram

### Erro: "Banco de dados indisponível"
- Verificar conectividade de rede
- Confirmar se o serviço PostgreSQL está rodando
- Verificar se o banco de dados existe

### Erro: "Tabela não encontrada"
- Executar o script `database_schema.sql`
- Verificar se todas as tabelas foram criadas
- Confirmar permissões de acesso

## 📞 Suporte

Para configurar o banco de dados, você pode:

1. **Fornecer credenciais Supabase válidas**
2. **Configurar PostgreSQL local**
3. **Solicitar sistema mock temporário**

Escolha a opção que melhor se adequa ao seu ambiente de desenvolvimento/produção. 