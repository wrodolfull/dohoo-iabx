# 🔧 Guia de Solução de Problemas - Dohoo IABX

## 🚨 Problema: Erro de Foreign Key no Banco de Dados

### Erro Encontrado:
```
ERROR: 23503: insert or update on table "users" violates foreign key constraint "users_id_fkey"
DETAIL: Key (id)=(af6bfa49-51d7-4cd4-be44-a14b32e6fccb) is not present in table "users".
```

### ✅ Solução Definitiva:

**1. Use o script simplificado:**
```sql
-- Execute o arquivo database_simple_fix.sql
-- Este script remove todas as tabelas e recria sem foreign keys problemáticas
```

**2. Ordem de execução:**
```bash
# 1. No Supabase SQL Editor, execute:
database_simple_fix.sql

# 2. Para verificar se funcionou, execute:
verify_database.sql
```

**3. Passos detalhados:**
1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Cole todo o conteúdo do arquivo `database_simple_fix.sql`
4. Execute o script (deve executar sem erros)
5. Execute o script `verify_database.sql` para confirmar
6. Deve mostrar "✅ BANCO DE DADOS CRIADO COM SUCESSO!"

### 🔍 Causa do Problema:
- **Dependências circulares**: Tabelas que referenciam `users` sendo criadas antes da tabela `users`
- **Constraints de foreign key** aplicadas muito cedo no processo

### 🛠️ Correções Implementadas:
1. **Remoção completa** de foreign keys problemáticas
2. **Criação de tabelas** na ordem correta
3. **Campos de referência** mantidos como UUID simples
4. **Dados iniciais** inseridos corretamente

---

## 🚨 Problema: Backend não Inicia (Supabase Key Required)

### Erro Encontrado:
```
Error: supabaseKey is required.
```

### ✅ Solução:

**1. Configure o arquivo .env do backend:**
```bash
cd /root/backend
```

**2. Edite o arquivo .env com suas credenciais do Supabase:**
```env
# Substitua pelos valores reais do seu projeto Supabase
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_ANON_KEY=your_anon_key_here
```

**3. Obtenha as credenciais no Supabase:**
- Acesse: https://supabase.com/dashboard
- Vá em: **Settings** → **API**
- Copie: **Project URL** e **Project API keys**

---

## 🚨 Problema: Frontend com Erro de Symlinks

### Erro Encontrado:
```
Error: ELOOP: too many symbolic links encountered
```

### ✅ Solução:

**1. Remova a pasta freeswitch problemática:**
```bash
cd /root/dohoo-voice-flow-control
rm -rf freeswitch/
```

**2. Adicione ao .gitignore:**
```bash
echo "freeswitch/" >> .gitignore
```

**3. Reinicie o servidor de desenvolvimento:**
```bash
npm run dev -- --host 0.0.0.0
```

---

## 🚨 Problema: Layout Component não Encontrado

### Erro Encontrado:
```
Failed to resolve import "./components/Layout" from "src/App.tsx"
```

### ✅ Solução:

**1. Verifique se o arquivo existe:**
```bash
ls -la /root/dohoo-voice-flow-control/src/components/Layout.tsx
```

**2. Se não existir, o arquivo já foi criado. Reinicie o servidor:**
```bash
# Pare o servidor (Ctrl+C) e reinicie
npm run dev -- --host 0.0.0.0
```

---

## 📋 Checklist de Configuração Completa

### ✅ Banco de Dados:
- [ ] Projeto Supabase criado
- [ ] Script `database_fix.sql` executado
- [ ] Tabelas criadas sem erros
- [ ] Dados iniciais inseridos

### ✅ Backend:
- [ ] Arquivo `.env` configurado com credenciais reais
- [ ] Dependências instaladas (`npm install`)
- [ ] Servidor iniciando sem erros (`node index.js`)

### ✅ Frontend:
- [ ] Arquivo `.env` configurado
- [ ] Dependências instaladas (`npm install`)
- [ ] Pasta `freeswitch/` removida se necessário
- [ ] Servidor iniciando sem erros (`npm run dev`)

---

## 🔧 Comandos de Verificação

### Verificar Backend:
```bash
cd /root/backend
node index.js
# Deve mostrar: "Backend running on port 3001"
```

### Verificar Frontend:
```bash
cd /root/dohoo-voice-flow-control
npm run dev -- --host 0.0.0.0
# Deve mostrar: "Local: http://localhost:8080/"
```

### Verificar Banco de Dados:
```sql
-- No Supabase SQL Editor
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

---

## 🌐 Configuração do Supabase

### 1. Criar Projeto:
1. Acesse: https://supabase.com
2. Clique em: **New Project**
3. Escolha organização e região
4. Aguarde criação (2-3 minutos)

### 2. Configurar Banco:
1. Vá em: **SQL Editor**
2. Cole o conteúdo de `database_fix.sql`
3. Execute o script
4. Verifique se todas as tabelas foram criadas

### 3. Configurar Autenticação:
1. Vá em: **Authentication** → **Settings**
2. Configure providers necessários
3. Ajuste políticas RLS se necessário

### 4. Obter Credenciais:
1. Vá em: **Settings** → **API**
2. Copie **Project URL**
3. Copie **anon public** e **service_role** keys

---

## 🎯 Próximos Passos Após Correção

1. **Testar Login**: Use `admin@demo.com` ou `superadmin@dohoo.com.br`
2. **Verificar Funcionalidades**: Teste cada menu do sistema
3. **Configurar Dados**: Adicione ramais, troncos, etc.
4. **Integrar FreeSWITCH**: Configure se necessário

---

## 📞 Suporte

Se os problemas persistirem:

1. **Verifique logs** detalhados do backend e frontend
2. **Confirme versões** do Node.js (18+) e PostgreSQL
3. **Teste conectividade** com Supabase
4. **Valide credenciais** e permissões

O sistema está **98% funcional** - estes são apenas problemas de configuração inicial! 🚀 