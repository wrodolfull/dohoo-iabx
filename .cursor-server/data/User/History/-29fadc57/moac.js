const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createSurveyResponsesTable() {
  try {
    console.log('📋 Criando tabela cc_survey_responses...');

    // Verificar se a tabela já existe
    const { data: existingTables, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'cc_survey_responses');

    if (checkError) {
      console.error('❌ Erro ao verificar tabela existente:', checkError);
      return;
    }

    if (existingTables && existingTables.length > 0) {
      console.log('✅ Tabela cc_survey_responses já existe');
      return;
    }

    // Criar tabela cc_survey_responses
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS cc_survey_responses (
          id SERIAL PRIMARY KEY,
          tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
          ring_group_id INTEGER NOT NULL REFERENCES cc_ring_groups(id) ON DELETE CASCADE,
          survey_template_id INTEGER REFERENCES cc_surveys(id) ON DELETE SET NULL,
          caller_id VARCHAR(50) NOT NULL,
          call_duration INTEGER DEFAULT 0,
          rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
          comments TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Índices para performance
        CREATE INDEX IF NOT EXISTS idx_survey_responses_tenant ON cc_survey_responses(tenant_id);
        CREATE INDEX IF NOT EXISTS idx_survey_responses_ring_group ON cc_survey_responses(ring_group_id);
        CREATE INDEX IF NOT EXISTS idx_survey_responses_rating ON cc_survey_responses(rating);
        CREATE INDEX IF NOT EXISTS idx_survey_responses_created_at ON cc_survey_responses(created_at);
        CREATE INDEX IF NOT EXISTS idx_survey_responses_caller ON cc_survey_responses(caller_id);
        
        -- Trigger para atualizar updated_at
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ language 'plpgsql';
        
        CREATE TRIGGER update_survey_responses_updated_at 
          BEFORE UPDATE ON cc_survey_responses 
          FOR EACH ROW 
          EXECUTE FUNCTION update_updated_at_column();
      `
    });

    if (createError) {
      console.error('❌ Erro ao criar tabela cc_survey_responses:', createError);
      return;
    }

    console.log('✅ Tabela cc_survey_responses criada com sucesso!');
    console.log('✅ Índices criados para otimização de consultas');
    console.log('✅ Trigger para updated_at configurado');

    // Inserir alguns dados de exemplo
    console.log('📝 Inserindo dados de exemplo...');
    
    const { data: tenants } = await supabase
      .from('tenants')
      .select('id')
      .limit(1);

    if (tenants && tenants.length > 0) {
      const tenantId = tenants[0].id;
      
      const { data: ringGroups } = await supabase
        .from('cc_ring_groups')
        .select('id')
        .eq('tenant_id', tenantId)
        .limit(2);

      if (ringGroups && ringGroups.length > 0) {
        const sampleData = [
          {
            tenant_id: tenantId,
            ring_group_id: ringGroups[0].id,
            caller_id: '1140001234',
            call_duration: 180,
            rating: 5,
            comments: 'Excelente atendimento!'
          },
          {
            tenant_id: tenantId,
            ring_group_id: ringGroups[0].id,
            caller_id: '1140005678',
            call_duration: 120,
            rating: 4,
            comments: 'Bom atendimento'
          },
          {
            tenant_id: tenantId,
            ring_group_id: ringGroups[0].id,
            caller_id: '1140009999',
            call_duration: 90,
            rating: 3,
            comments: 'Atendimento regular'
          },
          {
            tenant_id: tenantId,
            ring_group_id: ringGroups[0].id,
            caller_id: '1140001111',
            call_duration: 240,
            rating: 5,
            comments: 'Muito satisfeito'
          },
          {
            tenant_id: tenantId,
            ring_group_id: ringGroups[0].id,
            caller_id: '1140002222',
            call_duration: 60,
            rating: 2,
            comments: 'Precisa melhorar'
          }
        ];

        if (ringGroups.length > 1) {
          sampleData.push(
            {
              tenant_id: tenantId,
              ring_group_id: ringGroups[1].id,
              caller_id: '1140003333',
              call_duration: 150,
              rating: 5,
              comments: 'Atendimento perfeito'
            },
            {
              tenant_id: tenantId,
              ring_group_id: ringGroups[1].id,
              caller_id: '1140004444',
              call_duration: 200,
              rating: 4,
              comments: 'Muito bom'
            }
          );
        }

        const { error: insertError } = await supabase
          .from('cc_survey_responses')
          .insert(sampleData);

        if (insertError) {
          console.error('❌ Erro ao inserir dados de exemplo:', insertError);
        } else {
          console.log('✅ Dados de exemplo inseridos com sucesso!');
        }
      }
    }

    console.log('🎉 Setup da tabela cc_survey_responses concluído!');

  } catch (error) {
    console.error('❌ Erro durante criação da tabela:', error);
  }
}

createSurveyResponsesTable(); 