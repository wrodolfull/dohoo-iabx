require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Verificar se as variáveis de ambiente estão definidas
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ ERRO: Variáveis de ambiente Supabase não configuradas');
  console.error('Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no arquivo .env');
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createSurveyTemplates() {
  console.log('🔧 Criando tabela de templates de pesquisa...');
  
  try {
    // 1. Tabela de templates de pesquisa
    console.log('📋 Criando tabela cc_surveys...');
    
    // Verificar se a tabela já existe
    const { data: existingTables, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'cc_surveys');
    
    if (checkError) {
      console.error('❌ Erro ao verificar tabela:', checkError);
      return;
    }
    
    if (existingTables && existingTables.length > 0) {
      console.log('✅ Tabela cc_surveys já existe');
    } else {
      console.log('📝 Para criar a tabela, execute o seguinte SQL no Supabase:');
      console.log('');
      console.log('-- Tabela de templates de pesquisa');
      console.log('CREATE TABLE IF NOT EXISTS cc_surveys (');
      console.log('  id SERIAL PRIMARY KEY,');
      console.log('  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,');
      console.log('  name VARCHAR(100) NOT NULL,');
      console.log('  question_text VARCHAR(255) NOT NULL,');
      console.log('  survey_type VARCHAR(32) DEFAULT \'dtmf\',');
      console.log('  options JSONB,');
      console.log('  is_active BOOLEAN DEFAULT true,');
      console.log('  created_at TIMESTAMP DEFAULT NOW(),');
      console.log('  updated_at TIMESTAMP DEFAULT NOW()');
      console.log(');');
      console.log('');
      console.log('-- Índices para performance');
      console.log('CREATE INDEX IF NOT EXISTS idx_surveys_tenant ON cc_surveys(tenant_id);');
      console.log('CREATE INDEX IF NOT EXISTS idx_surveys_active ON cc_surveys(is_active);');
      console.log('');
      console.log('-- Adicionar coluna na tabela existente');
      console.log('ALTER TABLE cc_post_call_survey ADD COLUMN IF NOT EXISTS survey_template_id INTEGER REFERENCES cc_surveys(id);');
    }
    
    console.log('✅ Verificação concluída!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

createSurveyTemplates(); 