const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSurveyTable() {
  try {
    console.log('🔍 Verificando se a tabela cc_survey_responses existe...');

    // Verificar se a tabela existe
    const { data: tableExists, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'cc_survey_responses');

    if (tableError) {
      console.error('❌ Erro ao verificar tabela:', tableError);
      return;
    }

    if (!tableExists || tableExists.length === 0) {
      console.log('❌ Tabela cc_survey_responses NÃO existe!');
      console.log('📋 Execute o SQL no Supabase para criar a tabela.');
      return;
    }

    console.log('✅ Tabela cc_survey_responses existe!');

    // Verificar se há dados
    const { data: responses, error: dataError } = await supabase
      .from('cc_survey_responses')
      .select('*')
      .limit(5);

    if (dataError) {
      console.error('❌ Erro ao buscar dados:', dataError);
      return;
    }

    console.log(`📊 Encontrados ${responses.length} registros na tabela`);
    
    if (responses.length > 0) {
      console.log('📋 Amostra dos dados:');
      responses.forEach((response, index) => {
        console.log(`  ${index + 1}. ID: ${response.id}, Rating: ${response.rating}, Caller: ${response.caller_id}`);
      });
    } else {
      console.log('📝 Tabela está vazia. Execute o SQL com dados de exemplo.');
    }

  } catch (error) {
    console.error('❌ Erro durante teste:', error);
  }
}

testSurveyTable(); 