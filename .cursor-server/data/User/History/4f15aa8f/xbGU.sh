#!/bin/bash

echo "🧪 Testando funcionalidade de SuperAdmin na página de usuários"
echo "================================================================"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar se o backend está rodando
log_info "Verificando se o backend está rodando..."
if curl -s http://31.97.250.190:3001/health > /dev/null; then
    log_success "Backend está rodando"
else
    log_error "Backend não está respondendo"
    exit 1
fi

# Testar endpoint de tenants
log_info "Testando endpoint de tenants..."
TENANTS_RESPONSE=$(curl -s http://31.97.250.190:3001/tenants)
if [ $? -eq 0 ]; then
    log_success "Endpoint /tenants respondeu"
    echo "📋 Tenants disponíveis:"
    echo "$TENANTS_RESPONSE" | jq -r '.[] | "  - \(.name) (ID: \(.id), Status: \(.status))"'
else
    log_error "Falha ao acessar endpoint /tenants"
fi

# Testar endpoint de usuários para cada tenant
log_info "Testando endpoints de usuários por tenant..."
echo "$TENANTS_RESPONSE" | jq -r '.[].id' | while read tenant_id; do
    log_info "Testando usuários para tenant ID: $tenant_id"
    USERS_RESPONSE=$(curl -s "http://31.97.250.190:3001/tenants/$tenant_id/users")
    if [ $? -eq 0 ]; then
        USER_COUNT=$(echo "$USERS_RESPONSE" | jq length)
        log_success "Tenant $tenant_id: $USER_COUNT usuários encontrados"
    else
        log_error "Falha ao acessar usuários do tenant $tenant_id"
    fi
done

# Verificar se o frontend está rodando
log_info "Verificando se o frontend está rodando..."
if curl -s http://31.97.250.190:5173 > /dev/null; then
    log_success "Frontend está rodando"
else
    log_warning "Frontend não está respondendo (pode estar em desenvolvimento)"
fi

echo ""
echo "🎯 Instruções para testar no frontend:"
echo "======================================"
echo "1. Acesse: http://31.97.250.190:5173"
echo "2. Faça login como superadmin"
echo "3. Vá para a página /users"
echo "4. Verifique se aparece o seletor de empresa"
echo "5. Teste trocar entre diferentes empresas"
echo "6. Verifique se os usuários mudam conforme a empresa selecionada"

echo ""
echo "🔍 Logs do backend para debug:"
echo "=============================="
echo "Para ver logs em tempo real:"
echo "tail -f /root/backend/backend.log"

echo ""
echo "📝 Checklist de funcionalidades:"
echo "================================"
echo "□ Seletor de empresa aparece para superadmin"
echo "□ Lista de empresas carrega corretamente"
echo "□ Troca de empresa funciona"
echo "□ Usuários mudam conforme empresa selecionada"
echo "□ Admin normal não vê seletor de empresa"
echo "□ Admin vê apenas usuários da sua empresa"
echo "□ Criação de usuário funciona para empresa selecionada"
echo "□ Edição de usuário funciona"
echo "□ Exclusão de usuário funciona" 