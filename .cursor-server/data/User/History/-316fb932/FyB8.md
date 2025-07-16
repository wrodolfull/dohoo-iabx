# 🔐 Guia Completo: Criar Usuário w_rodolfoo@hotmail.com

## 📋 Problema Identificado

O sistema está tentando fazer login com `w.rodolfo@outlook.com.br` mas o usuário não existe. Você quer criar um usuário com:
- **Email**: `w_rodolfoo@hotmail.com`
- **Senha**: `123456789`

## 🔧 Solução Completa

### Passo 1: Executar Script no Banco de Dados

1. Acesse o painel do Supabase: https://supabase.com/dashboard
2. Vá para o seu projeto
3. Clique em **SQL Editor** no menu lateral
4. Execute o script `create_user_complete.sql`

### Passo 2: Criar Usuário no Supabase Auth

1. No painel do Supabase, vá para **Authentication** > **Users**
2. Clique no botão **Add user**
3. Preencha os dados:
   - **Email**: `w_rodolfoo@hotmail.com`
   - **Password**: `123456789`
   - **Confirm Password**: `123456789`
4. ✅ Marque **Auto Confirm User** (se disponível)
5. Clique em **Create user**

### Passo 3: Verificar se Funcionou

1. Abra a aplicação em: http://31.97.250.190:8081/
2. Tente fazer login com:
   - **Email**: `w_rodolfoo@hotmail.com`
   - **Senha**: `123456789`

## 📊 Scripts Disponíveis

### 1. `create_user_complete.sql`
Script completo que:
- ✅ Verifica se o usuário existe
- ✅ Cria o tenant se necessário
- ✅ Cria o usuário na tabela `users`
- ✅ Mostra instruções para Supabase Auth

### 2. `DEBUG_CHECK.sql`
Script para diagnóstico:
- 🔍 Verifica estado atual do banco
- 🔍 Lista usuários existentes
- 🔍 Verifica constraints

## 🚨 Importante

**O sistema usa DUPLA AUTENTICAÇÃO:**

1. **Supabase Auth** - Para login/logout
2. **Tabela `users`** - Para dados do usuário

**Ambos precisam estar configurados para funcionar!**

## 🔄 Se Não Funcionar

1. Execute `DEBUG_CHECK.sql` para ver o que está acontecendo
2. Verifique se o usuário foi criado no Supabase Auth
3. Verifique se o backend está rodando na porta 3001
4. Verifique se o frontend está rodando na porta 8081

## 📱 Status Atual dos Serviços

- **Backend**: ✅ Rodando na porta 3001
- **Frontend**: ✅ Rodando na porta 8081
- **Health Check**: http://localhost:3001/health

## 🆘 Comandos de Emergência

Se precisar reiniciar os serviços:

```bash
# Reiniciar Backend
cd /root/backend && pkill -f "node index.js" && sleep 2 && node index.js &

# Reiniciar Frontend
cd /root/dohoo-voice-flow-control && npm run dev -- --host 0.0.0.0 &
```

## 🎯 Resultado Esperado

Após seguir todos os passos, você deve conseguir:
- ✅ Fazer login com `w_rodolfoo@hotmail.com`
- ✅ Acessar o dashboard como administrador
- ✅ Gerenciar extensões, trunks, etc.

---

**💡 Dica**: Se ainda houver problemas, o erro mais comum é esquecer de criar o usuário no Supabase Auth (Passo 2). 