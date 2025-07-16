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
    // 1. Tabela de configuração da pesquisa por ring group
    console.log('📋 Criando tabela cc_post_call_survey...');
    const { error: error1 } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS cc_post_call_survey (
          id SERIAL PRIMARY KEY,
          ring_group_id UUID REFERENCES ring_groups(id) ON DELETE CASCADE,
          enabled BOOLEAN NOT NULL DEFAULT FALSE,
          survey_type VARCHAR(32) NOT NULL DEFAULT 'dtmf',
          question_text VARCHAR(255) NOT NULL DEFAULT 'Como você avalia seu atendimento? (1 a 5)',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `
    });
    
    if (error1) {
      console.error('❌ Erro ao criar tabela cc_post_call_survey:', error1);
      return;
    }
    
    // 2. Tabela de respostas
    console.log('📋 Criando tabela cc_post_call_survey_response...');
    const { error: error2 } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS cc_post_call_survey_response (
          id SERIAL PRIMARY KEY,
          call_id UUID REFERENCES calls(id) ON DELETE CASCADE,
          ring_group_id UUID REFERENCES ring_groups(id) ON DELETE CASCADE,
          agent_id UUID REFERENCES agents(id),
          survey_id INTEGER REFERENCES cc_post_call_survey(id),
          response VARCHAR(32),
          created_at TIMESTAMP DEFAULT NOW()
        );
      `
    });
    
    if (error2) {
      console.error('❌ Erro ao criar tabela cc_post_call_survey_response:', error2);
      return;
    }
    
    // 3. Criar índices para performance
    console.log('📋 Criando índices...');
    const { error: error3 } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_survey_ring_group ON cc_post_call_survey(ring_group_id);
        CREATE INDEX IF NOT EXISTS idx_survey_response_call ON cc_post_call_survey_response(call_id);
        CREATE INDEX IF NOT EXISTS idx_survey_response_ring_group ON cc_post_call_survey_response(ring_group_id);
        CREATE INDEX IF NOT EXISTS idx_survey_response_agent ON cc_post_call_survey_response(agent_id);
        CREATE INDEX IF NOT EXISTS idx_survey_response_created ON cc_post_call_survey_response(created_at);
      `
    });
    
    if (error3) {
      console.error('❌ Erro ao criar índices:', error3);
      return;
    }
    
    console.log('✅ Tabelas de pesquisa criadas com sucesso!');
    
    // Verificar se as tabelas foram criadas
    const { data: tables, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['cc_post_call_survey', 'cc_post_call_survey_response']);
    
    if (checkError) {
      console.error('❌ Erro ao verificar tabelas:', checkError);
      return;
    }
    
    console.log('📊 Tabelas criadas:', tables.map(t => t.table_name));
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

createSurveyTables(); 