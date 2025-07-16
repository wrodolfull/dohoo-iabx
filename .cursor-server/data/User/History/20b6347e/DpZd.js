const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase (usando as credenciais encontradas no projeto)
const SUPABASE_URL = 'https://oqfzamkfqnvobuwqgtxf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xZnphbWtmcW52b2J1d3FndHhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI4MDAyNTcsImV4cCI6MjA0ODM3NjI1N30.Dib-1ufnKz8ZhUa0qNZrXNPwz9qe9jUhWKxCJNEcZz8';

async function setupFreeSwitchTables() {
  console.log('🔧 Configurando tabelas do FreeSWITCH...');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  try {
    // Inserir dados de exemplo diretamente nas tabelas
    // Como não podemos criar tabelas com anon key, vamos assumir que existem

    console.log('📋 Inserindo dados de teste...');

    // Tentar inserir um dialplan de teste
    try {
      const { data: testDialplan, error: dialplanError } = await supabase
        .from('fs_dialplans')
        .insert([
          {
            name: 'Test Extension Routing',
            condition: '^(\\d{4})$',
            destination_number: '$1',
            context: 'default',
            actions: ['bridge user/$1@${domain_name}'],
            enabled: true,
            priority: 10
          }
        ])
        .select();

      if (dialplanError) {
        console.log('⚠️ Erro ao inserir dialplan de teste:', dialplanError.message);
        console.log('📋 Tentando usar SQL direto...');
        
        // Tentar criar a tabela se não existir
        const sqlCreate = `
-- Criar tabelas do FreeSWITCH se não existirem
CREATE TABLE IF NOT EXISTS fs_dialplans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  condition VARCHAR(1000) NOT NULL,
  destination_number VARCHAR(255),
  context VARCHAR(255) DEFAULT 'default',
  actions TEXT[] NOT NULL,
  enabled BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS fs_sip_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  type VARCHAR(20) CHECK (type IN ('internal', 'external')) DEFAULT 'internal',
  port INTEGER DEFAULT 5060,
  rtp_ip VARCHAR(255) DEFAULT 'auto',
  sip_ip VARCHAR(255) DEFAULT 'auto',
  context VARCHAR(255) DEFAULT 'default',
  codec_prefs VARCHAR(500) DEFAULT 'PCMU,PCMA',
  dtmf_duration INTEGER DEFAULT 2000,
  enabled BOOLEAN DEFAULT true,
  custom_params JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS fs_global_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  log_level VARCHAR(20) DEFAULT 'INFO' CHECK (log_level IN ('DEBUG', 'INFO', 'NOTICE', 'WARNING', 'ERROR')),
  max_sessions INTEGER DEFAULT 1000,
  sessions_per_second INTEGER DEFAULT 30,
  rtp_start_port INTEGER DEFAULT 16384,
  rtp_end_port INTEGER DEFAULT 32768,
  dialplan_hunt_on_failure BOOLEAN DEFAULT true,
  continue_on_fail BOOLEAN DEFAULT true,
  hangup_after_bridge BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);
`;
        
        console.log('📄 SQL para criar tabelas:');
        console.log(sqlCreate);
        console.log('');
        console.log('🔧 Execute este SQL no Supabase SQL Editor ou use psql:');
        console.log('psql "postgresql://postgres.oqfzamkfqnvobuwqgtxf:UOWb8kh4PqvPFAXj@aws-0-us-east-1.pooler.supabase.com:6543/postgres"');
        
      } else {
        console.log('✅ Tabela fs_dialplans funcionando!');
      }
    } catch (error) {
      console.log('⚠️ Erro geral:', error.message);
    }

  } catch (error) {
    console.error('❌ Erro ao configurar:', error);
  }
}

// Executar o setup
setupFreeSwitchTables(); 