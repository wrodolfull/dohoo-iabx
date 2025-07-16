#!/bin/bash

# 🎯 Dohoo IABX - Database Setup Script
# Script para configurar o banco de dados no Supabase

set -e

echo "🗄️  Configurando banco de dados do Dohoo IABX..."
echo "================================================"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Verificar se os arquivos SQL existem
if [ ! -f "sql/create_database.sql" ]; then
    log_error "Arquivo sql/create_database.sql não encontrado!"
    exit 1
fi

if [ ! -f "sql/create_superadmin.sql" ]; then
    log_error "Arquivo sql/create_superadmin.sql não encontrado!"
    exit 1
fi

if [ ! -f "sql/create_freeswitch_tables.sql" ]; then
    log_error "Arquivo sql/create_freeswitch_tables.sql não encontrado!"
    exit 1
fi

log_info "Arquivos SQL encontrados ✓"

echo ""
echo "📋 INSTRUÇÕES PARA CONFIGURAR O BANCO DE DADOS:"
echo "================================================"
echo ""
echo "1. Acesse o painel do Supabase:"
echo "   https://supabase.com/dashboard"
echo ""
echo "2. Crie um novo projeto ou use um existente"
echo ""
echo "3. Vá para SQL Editor no painel do Supabase"
echo ""
echo "4. Execute os scripts na seguinte ordem:"
echo ""
echo "   a) Primeiro execute: sql/create_database.sql"
echo "   b) Depois execute: sql/create_superadmin.sql"
echo "   c) Por último execute: sql/create_freeswitch_tables.sql"
echo ""
echo "5. Copie as credenciais do projeto:"
echo "   - URL do projeto"
echo "   - Chave anônima (anon key)"
echo "   - Chave de serviço (service role key)"
echo ""
echo "6. Configure o arquivo backend/.env com essas credenciais"
echo ""

# Mostrar conteúdo dos arquivos SQL
echo "📄 CONTEÚDO DOS SCRIPTS SQL:"
echo "============================"
echo ""

echo "🔧 sql/create_database.sql:"
echo "---------------------------"
head -20 sql/create_database.sql
echo "..."
echo ""

echo "👤 sql/create_superadmin.sql:"
echo "-----------------------------"
cat sql/create_superadmin.sql
echo ""

echo "🔧 sql/create_freeswitch_tables.sql:"
echo "-----------------------------------"
head -20 sql/create_freeswitch_tables.sql
echo "..."
echo ""

log_info "Após executar os scripts SQL, configure o arquivo backend/.env:"
echo ""
echo "SUPABASE_URL=sua_url_do_supabase"
echo "SUPABASE_ANON_KEY=sua_chave_anonima"
echo "SUPABASE_SERVICE_ROLE_KEY=sua_chave_de_servico"
echo ""

log_success "Script de configuração do banco concluído!"
echo ""
echo "🎯 Próximos passos:"
echo "1. Execute os scripts SQL no Supabase"
echo "2. Configure as variáveis de ambiente"
echo "3. Execute: ./start_services.sh"
echo ""
echo "🔐 Credenciais padrão após configuração:"
echo "   Email: admin@dohoo.com"
echo "   Senha: Admin123!" 