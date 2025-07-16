# 🏢 Guia: Seletor de Empresa para SuperAdmin

## 📋 Visão Geral

Implementei a funcionalidade para que **superadmins** possam escolher qual empresa/tenant gerenciar na página de usuários (`/users`). Enquanto **admins normais** continuam vendo apenas os usuários da sua própria empresa.

## ✨ Funcionalidades Implementadas

### Para SuperAdmin:
- ✅ **Seletor de Empresa**: Dropdown para escolher qual empresa gerenciar
- ✅ **Lista de Empresas**: Carrega todas as empresas disponíveis
- ✅ **Troca Dinâmica**: Usuários mudam conforme empresa selecionada
- ✅ **Indicador Visual**: Mostra qual empresa está sendo gerenciada
- ✅ **Status das Empresas**: Exibe se a empresa está ativa ou inativa

### Para Admin Normal:
- ✅ **Visão Restrita**: Vê apenas usuários da sua empresa
- ✅ **Sem Seletor**: Não aparece o dropdown de seleção
- ✅ **Comportamento Original**: Mantém a funcionalidade anterior

## 🔧 Implementação Técnica

### 1. Detecção de Role
```typescript
const isSuperAdmin = currentUser?.role === 'superadmin';
```

### 2. Estado do Tenant
```typescript
// Para superadmin: usa tenant selecionado
// Para admin: usa tenant do usuário atual
const tenantId = isSuperAdmin ? selectedTenantId : (currentUser?.tenant_id || '1');
```

### 3. Carregamento de Tenants
```typescript
const fetchTenants = async () => {
  const response = await fetch(`${apiUrl}/tenants`);
  const data = await response.json();
  setTenants(data);
  
  // Seleciona o primeiro tenant por padrão
  if (data.length > 0 && !selectedTenantId) {
    setSelectedTenantId(data[0].id);
  }
};
```

### 4. Interface do Seletor
```typescript
{isSuperAdmin && (
  <Card>
    <CardHeader>
      <CardTitle>Selecionar Empresa</CardTitle>
    </CardHeader>
    <CardContent>
      <Select value={selectedTenantId} onValueChange={handleTenantChange}>
        <SelectContent>
          {tenants.map((tenant) => (
            <SelectItem key={tenant.id} value={tenant.id}>
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4" />
                <span>{tenant.name}</span>
                <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>
                  {tenant.status === 'active' ? 'Ativa' : 'Inativa'}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </CardContent>
  </Card>
)}
```

## 🎯 Como Testar

### 1. Login como SuperAdmin
```bash
# Acesse o frontend
http://31.97.250.190:5173

# Faça login com credenciais de superadmin
```

### 2. Navegar para Usuários
```bash
# Vá para a página de usuários
http://31.97.250.190:5173/users
```

### 3. Verificar Seletor
- ✅ Deve aparecer o card "Selecionar Empresa"
- ✅ Dropdown com todas as empresas disponíveis
- ✅ Status das empresas (Ativa/Inativa)

### 4. Testar Troca de Empresa
- ✅ Selecione uma empresa diferente
- ✅ Lista de usuários deve mudar
- ✅ Nome da empresa aparece no header

### 5. Testar como Admin Normal
- ✅ Faça login como admin normal
- ✅ Não deve aparecer o seletor de empresa
- ✅ Deve ver apenas usuários da sua empresa

## 🔍 Debug e Logs

### Console do Frontend
```javascript
// Logs importantes para debug:
console.log('👤 Usuário atual:', currentUser);
console.log('🏢 Tenant ID sendo usado:', tenantId);
console.log('👑 É superadmin:', isSuperAdmin);
console.log('🏢 Tenant alterado para:', newTenantId);
```

### Backend Logs
```bash
# Ver logs em tempo real
tail -f /root/backend/backend.log

# Procurar por logs específicos
grep "Tenant ID sendo usado" /root/backend/backend.log
```

### Testar APIs Manualmente
```bash
# Listar todos os tenants
curl http://31.97.250.190:3001/tenants

# Listar usuários de um tenant específico
curl http://31.97.250.190:3001/tenants/{tenant_id}/users
```

## 🐛 Possíveis Problemas

### 1. Seletor não aparece
- ✅ Verificar se o usuário é realmente superadmin
- ✅ Verificar se o endpoint `/tenants` está funcionando
- ✅ Verificar console do navegador para erros

### 2. Lista de usuários não muda
- ✅ Verificar se o `tenantId` está sendo atualizado
- ✅ Verificar se o `fetchUsers()` está sendo chamado
- ✅ Verificar logs do backend

### 3. Erro ao carregar tenants
- ✅ Verificar se o backend está rodando
- ✅ Verificar se a rota `/tenants` existe
- ✅ Verificar permissões do usuário

## 📊 Estrutura de Dados

### Interface Tenant
```typescript
interface Tenant {
  id: string;
  name: string;
  domain: string;
  contact_email: string;
  status: string;
}
```

### Interface User
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  role: 'superadmin' | 'admin' | 'agent';
  extension?: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}
```

## 🎨 Melhorias Visuais

### 1. Indicador de Empresa Atual
```typescript
{isSuperAdmin && selectedTenantId && (
  <span className="ml-2 text-blue-600">
    • {tenants.find(t => t.id === selectedTenantId)?.name}
  </span>
)}
```

### 2. Status das Empresas
```typescript
<Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>
  {tenant.status === 'active' ? 'Ativa' : 'Inativa'}
</Badge>
```

### 3. Estados de Loading
```typescript
// Loading de tenants
if (isSuperAdmin && loadingTenants) {
  return <div>Carregando empresas...</div>;
}

// Sem tenant selecionado
if (isSuperAdmin && !selectedTenantId) {
  return <div>Selecione uma Empresa</div>;
}
```

## 🚀 Próximos Passos

### Funcionalidades Adicionais
- [ ] **Filtros por empresa** no relatório geral
- [ ] **Estatísticas por empresa** no dashboard
- [ ] **Bulk operations** por empresa
- [ ] **Export por empresa** específica

### Melhorias de UX
- [ ] **Favoritos** de empresas mais usadas
- [ ] **Busca** no seletor de empresas
- [ ] **Atalhos** para trocar rapidamente
- [ ] **Histórico** de empresas acessadas

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do console do navegador
2. Verifique os logs do backend
3. Teste as APIs manualmente
4. Verifique se o usuário tem as permissões corretas

---

**Implementação concluída!** 🎉
A funcionalidade está pronta para uso em produção. 