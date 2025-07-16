# Guia de Execução dos Scripts SQL

## Ordem de Execução

Execute os scripts SQL no Supabase SQL Editor na seguinte ordem:

### 1. Primeiro: Limpeza (se necessário)
```sql
-- Execute o conteúdo do arquivo cleanup_database.sql
-- APENAS se você estiver recriando o banco ou teve erros de triggers
-- Este script remove triggers e constraints existentes
```

### 2. Segundo: Criar estrutura do banco
```sql
-- Execute o conteúdo do arquivo database_schema.sql
-- Este script cria todas as tabelas necessárias
```

### 3. Terceiro: Criar usuários
```sql
-- Execute o conteúdo do arquivo create_users.sql
-- Este script cria os usuários de teste com UUIDs corretos
```

### 4. Quarto: Criar dados de exemplo
```sql
-- Execute o conteúdo do arquivo create_sample_data.sql
-- Este script cria dados de exemplo para testar o sistema
```

## UUIDs dos Usuários Criados

Para referência, os UUIDs dos usuários criados são:

- **Superadmin**: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`
  - Email: superadmin@dohoo.com.br
  - Role: superadmin
  - Tenant: NULL (acesso a todos os tenants)

- **Admin**: `b2c3d4e5-f6a7-8901-bcde-f23456789012`
  - Email: admin@demo.com
  - Role: admin
  - Tenant: 7e3046d4-05b3-4970-bcd6-2ec63317fd62

- **Agent**: `c3d4e5f6-a7b8-9012-cdef-345678901234`
  - Email: agente@demo.com
  - Role: agent
  - Tenant: 7e3046d4-05b3-4970-bcd6-2ec63317fd62

## Autenticação no Supabase Auth

Após executar os scripts SQL, você precisa criar os usuários de autenticação no Supabase Auth:

1. Acesse o painel do Supabase
2. Vá para Authentication > Users
3. Adicione os usuários manualmente:
   - superadmin@dohoo.com.br (senha: admin123)
   - admin@demo.com (senha: admin123)
   - agente@demo.com (senha: agent123)

## Verificação

Após a execução, verifique se tudo foi criado corretamente:

```sql
-- Verificar usuários
SELECT id, name, email, role, tenant_id FROM users;

-- Verificar tenants
SELECT id, name, domain FROM tenants;

-- Verificar extensões
SELECT id, tenant_id, name, number FROM extensions;

-- Verificar grupos de toque
SELECT id, tenant_id, name, type FROM ringgroups;
```

## Troubleshooting

Se você encontrar erros de UUID, certifique-se de que:
1. Os UUIDs estão no formato correto (8-4-4-4-12 caracteres)
2. Os UUIDs de referência (como tenant_id, created_by) existem nas tabelas referenciadas
3. A ordem de execução dos scripts foi respeitada 