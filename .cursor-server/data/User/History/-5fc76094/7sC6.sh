#!/bin/bash

echo "🧪 Teste Simples de Integração"
echo ""

# Testar se o backend está rodando
echo "1. Testando backend..."
if curl -s http://localhost:3001/health > /dev/null; then
    echo "   ✅ Backend está rodando"
else
    echo "   ❌ Backend não está rodando"
    exit 1
fi

# Testar criação de arquivos
echo ""
echo "2. Testando criação de arquivos..."
RESPONSE=$(curl -s -X POST http://localhost:3001/test-file-creation)
echo "   Resposta: $RESPONSE"

# Criar tenant de teste
echo ""
echo "3. Criando tenant de teste..."
TENANT_RESPONSE=$(curl -s -X POST http://localhost:3001/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Empresa Teste Frontend",
    "domain": "testefrontend.local", 
    "contact_email": "admin@testefrontend.com"
  }')

echo "   Resposta: $TENANT_RESPONSE"

# Verificar arquivos criados
echo ""
echo "4. Verificando arquivos criados..."
ls -la /etc/freeswitch/directory/ | grep -E "(test|testefrontend)"

echo ""
echo "�� Teste concluído" 