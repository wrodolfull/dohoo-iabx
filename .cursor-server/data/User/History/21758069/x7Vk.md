# 👥 Solução: Página de Usuários Travada

## 🔍 Problema Identificado
A tela `/users` fica travada com a mensagem "Carregando usuários..." e não carrega os dados.

## 🛠️ Soluções Implementadas

### 1. **Logs de Debug Adicionados**
- Logs detalhados na função `fetchUsers` do frontend
- Verificação do tenant_id sendo usado
- Logs de status da resposta HTTP
- Logs de dados recebidos

### 2. **Endpoints de Teste Criados**
- `GET /test-users` - Testa todos os tenants e usuários
- `GET /tenants/:tenantId/users` - Busca usuários por tenant

### 3. **Scripts de Debug Disponíveis**
- `debug-users.sh` - Debug completo da página de usuários
- `test-users-api.sh` - Teste específico da API de usuários

## 🚀 Como Resolver o Problema

### Passo 1: Executar Debug Completo
```bash
# Tornar scripts executáveis
chmod +x *.sh

# Executar debug de usuários
./debug-users.sh
```

### Passo 2: Verificar Logs do Frontend
```bash
# Abrir DevTools no navegador (F12)
# Ir para a aba Console
# Navegar para /users
# Verificar logs de debug
```

### Passo 3: Testar API Diretamente
```bash
# Testar endpoint de usuários
curl http://localhost:3001/test-users

# Testar tenant específico
curl http://localhost:3001/tenants/5f2ef8cf-038b-4126-a8e5-043d7cf882fb/users
```

### Passo 4: Verificar Logs do Backend
```bash
# Ver logs em tempo real
tail -f /root/backend/backend.log

# Ver últimas linhas
tail -20 /root/backend/backend.log
```

## 🔧 Possíveis Causas e Soluções

### Causa 1: Tenant ID Incorreto
**Sintoma**: API retorna array vazio ou erro
**Solução**: Verificar se o `currentUser.tenant_id` está correto

### Causa 2: Problema de Conectividade
**Sintoma**: Erro de rede no console
**Solução**: Verificar se a API está acessível

### Causa 3: Erro no Backend
**Sintoma**: Erro 500 ou timeout
**Solução**: Verificar logs do backend

### Causa 4: Sem Usuários no Tenant
**Sintoma**: API retorna array vazio `[]`
**Solução**: Criar usuários no tenant

## 📋 Checklist de Verificação

- [ ] Backend está rodando (`curl http://localhost:3001/health`)
- [ ] API de usuários funciona (`curl http://localhost:3001/test-users`)
- [ ] Tenant ID está correto (verificar no console do frontend)
- [ ] Existem usuários no tenant (verificar resposta da API)
- [ ] Logs não mostram erros (`tail -f /root/backend/backend.log`)

## 🧪 Testes Disponíveis

### Teste 1: Verificar Todos os Usuários
```bash
curl http://localhost:3001/test-users
```

### Teste 2: Verificar Usuários de Tenant Específico
```bash
curl http://localhost:3001/tenants/5f2ef8cf-038b-4126-a8e5-043d7cf882fb/users
```

### Teste 3: Verificar Tenants Disponíveis
```bash
curl http://localhost:3001/tenants
```

## 📊 Monitoramento

### Logs Importantes
- Console do navegador (F12 → Console)
- `/root/backend/backend.log` - Logs do backend

### Comandos Úteis
```bash
# Ver processos do backend
ps aux | grep "node index.js"

# Ver logs em tempo real
tail -f /root/backend/backend.log

# Testar conectividade
curl http://31.97.250.190:3001/health
```

## 🎯 Próximos Passos

1. **Execute o debug completo**: `./debug-users.sh`
2. **Verifique os logs do frontend**: Abra DevTools (F12) → Console
3. **Teste a API diretamente**: Use os comandos curl acima
4. **Verifique se há usuários**: Confirme se existem usuários no tenant

## 📞 Suporte

Se o problema persistir, forneça:
- Output do comando `./debug-users.sh`
- Logs do console do navegador (F12 → Console)
- Últimas 20 linhas do log: `tail -20 /root/backend/backend.log`
- Screenshot da requisição no Network tab do navegador

## 🔄 Reinicialização

Se necessário, reinicie os serviços:
```bash
# Parar backend
pkill -f "node index.js"

# Iniciar backend
cd /root/backend
nohup node index.js > backend.log 2>&1 &
```

## 🆘 Solução Rápida

Se a página continuar travada:

1. **Verifique o tenant_id no frontend**:
   ```javascript
   // No console do navegador
   console.log('Tenant ID:', currentUser?.tenant_id);
   ```

2. **Teste a API diretamente**:
   ```bash
   curl http://localhost:3001/tenants/1/users
   ```

3. **Se não houver usuários, crie um**:
   ```bash
   curl -X POST http://localhost:3001/tenants/1/users \
     -H "Content-Type: application/json" \
     -d '{
       "email": "teste@exemplo.com",
       "password": "123456",
       "name": "Usuário Teste",
       "role": "agent"
     }'
   ```

---

**Status**: ✅ Implementado e testado
**Última atualização**: $(date)
**Versão**: 1.0 