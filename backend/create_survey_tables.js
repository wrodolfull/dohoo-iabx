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

async function createSurveyTables() {
  console.log('🔧 Criando tabelas para pesquisa de satisfação...');
  
  try {
    // Vamos criar as tabelas usando uma abordagem diferente
    // Primeiro, vamos verificar se as tabelas já existem
    console.log('🔍 Verificando tabelas existentes...');
    
    const { data: existingTables, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['cc_post_call_survey', 'cc_post_call_survey_response']);
    
    if (checkError) {
      console.error('❌ Erro ao verificar tabelas:', checkError);
      return;
    }
    
    const existingTableNames = existingTables.map(t => t.table_name);
    console.log('📊 Tabelas existentes:', existingTableNames);
    
    // Se as tabelas não existem, vamos criar usando SQL direto
    if (!existingTableNames.includes('cc_post_call_survey')) {
      console.log('📋 Criando tabela cc_post_call_survey...');
      
      // Vamos tentar criar usando uma query SQL direta
      const { error: createError } = await supabase
        .from('cc_post_call_survey')
        .select('id')
        .limit(1);
      
      if (createError && createError.code === 'PGRST116') {
        console.log('✅ Tabela cc_post_call_survey não existe, será criada automaticamente');
      } else if (createError) {
        console.error('❌ Erro ao verificar tabela cc_post_call_survey:', createError);
      }
    }
    
    if (!existingTableNames.includes('cc_post_call_survey_response')) {
      console.log('📋 Criando tabela cc_post_call_survey_response...');
      
      const { error: createError2 } = await supabase
        .from('cc_post_call_survey_response')
        .select('id')
        .limit(1);
      
      if (createError2 && createError2.code === 'PGRST116') {
        console.log('✅ Tabela cc_post_call_survey_response não existe, será criada automaticamente');
      } else if (createError2) {
        console.error('❌ Erro ao verificar tabela cc_post_call_survey_response:', createError2);
      }
    }
    
    console.log('✅ Verificação concluída!');
    console.log('📝 Para criar as tabelas, execute os seguintes SQLs no Supabase:');
    console.log('');
    console.log('-- Tabela de configuração da pesquisa por ring group');
    console.log('CREATE TABLE IF NOT EXISTS cc_post_call_survey (');
    console.log('  id SERIAL PRIMARY KEY,');
    console.log('  ring_group_id UUID REFERENCES ring_groups(id) ON DELETE CASCADE,');
    console.log('  enabled BOOLEAN NOT NULL DEFAULT FALSE,');
    console.log('  survey_type VARCHAR(32) NOT NULL DEFAULT \'dtmf\',');
    console.log('  question_text VARCHAR(255) NOT NULL DEFAULT \'Como você avalia seu atendimento? (1 a 5)\',');
    console.log('  created_at TIMESTAMP DEFAULT NOW(),');
    console.log('  updated_at TIMESTAMP DEFAULT NOW()');
    console.log(');');
    console.log('');
    console.log('-- Tabela de respostas');
    console.log('CREATE TABLE IF NOT EXISTS cc_post_call_survey_response (');
    console.log('  id SERIAL PRIMARY KEY,');
    console.log('  call_id UUID REFERENCES calls(id) ON DELETE CASCADE,');
    console.log('  ring_group_id UUID REFERENCES ring_groups(id) ON DELETE CASCADE,');
    console.log('  agent_id UUID REFERENCES agents(id),');
    console.log('  survey_id INTEGER REFERENCES cc_post_call_survey(id),');
    console.log('  response VARCHAR(32),');
    console.log('  created_at TIMESTAMP DEFAULT NOW()');
    console.log(');');
    console.log('');
    console.log('-- Índices para performance');
    console.log('CREATE INDEX IF NOT EXISTS idx_survey_ring_group ON cc_post_call_survey(ring_group_id);');
    console.log('CREATE INDEX IF NOT EXISTS idx_survey_response_call ON cc_post_call_survey_response(call_id);');
    console.log('CREATE INDEX IF NOT EXISTS idx_survey_response_ring_group ON cc_post_call_survey_response(ring_group_id);');
    console.log('CREATE INDEX IF NOT EXISTS idx_survey_response_agent ON cc_post_call_survey_response(agent_id);');
    console.log('CREATE INDEX IF NOT EXISTS idx_survey_response_created ON cc_post_call_survey_response(created_at);');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

createSurveyTables(); 