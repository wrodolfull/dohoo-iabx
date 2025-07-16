require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function setupFreeSwitchTables() {
  console.log('🔧 Configurando tabelas do FreeSWITCH...');
  
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ ERRO: Variáveis de ambiente Supabase não configuradas');
    console.error('Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no arquivo .env');
    process.exit(1);
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log('📋 Criando tabela fs_dialplans...');
    const { error: dialplansError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });

    if (dialplansError) {
      console.log('⚠️ Tabela fs_dialplans já existe ou erro:', dialplansError.message);
    } else {
      console.log('✅ Tabela fs_dialplans criada');
    }

    console.log('📋 Criando tabela fs_sip_profiles...');
    const { error: sipProfilesError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });

    if (sipProfilesError) {
      console.log('⚠️ Tabela fs_sip_profiles já existe ou erro:', sipProfilesError.message);
    } else {
      console.log('✅ Tabela fs_sip_profiles criada');
    }

    console.log('📋 Criando tabela fs_global_config...');
    const { error: globalConfigError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });

    if (globalConfigError) {
      console.log('⚠️ Tabela fs_global_config já existe ou erro:', globalConfigError.message);
    } else {
      console.log('✅ Tabela fs_global_config criada');
    }

    // Inserir dados iniciais
    console.log('📋 Inserindo dados iniciais...');

    // Verificar se já existem dados
    const { data: existingDialplans } = await supabase
      .from('fs_dialplans')
      .select('id')
      .limit(1);

    if (!existingDialplans || existingDialplans.length === 0) {
      console.log('📋 Inserindo dialplans padrão...');
      const { error: insertDialplansError } = await supabase
        .from('fs_dialplans')
        .insert([
          {
            name: 'Default Extension Routing',
            condition: '^(\\d{4})$',
            destination_number: '$1',
            context: 'default',
            actions: ['bridge user/$1@${domain_name}'],
            enabled: true,
            priority: 10
          },
          {
            name: 'External Call Routing',
            condition: '^(\\d{10,11})$',
            destination_number: '$1',
            context: 'default',
            actions: ['bridge sofia/gateway/provider/$1'],
            enabled: true,
            priority: 20
          },
          {
            name: 'Emergency Services',
            condition: '^(911|112|190)$',
            destination_number: '$1',
            context: 'default',
            actions: ['bridge sofia/gateway/emergency/$1'],
            enabled: true,
            priority: 1
          }
        ]);

      if (insertDialplansError) {
        console.log('⚠️ Erro ao inserir dialplans:', insertDialplansError.message);
      } else {
        console.log('✅ Dialplans padrão inseridos');
      }
    } else {
      console.log('✅ Dialplans já existem');
    }

    // Verificar se já existem perfis SIP
    const { data: existingProfiles } = await supabase
      .from('fs_sip_profiles')
      .select('id')
      .limit(1);

    if (!existingProfiles || existingProfiles.length === 0) {
      console.log('📋 Inserindo perfis SIP padrão...');
      const { error: insertProfilesError } = await supabase
        .from('fs_sip_profiles')
        .insert([
          {
            name: 'internal',
            type: 'internal',
            port: 5060,
            rtp_ip: 'auto',
            sip_ip: 'auto',
            context: 'default',
            codec_prefs: 'PCMU,PCMA,G729',
            dtmf_duration: 2000,
            enabled: true,
            custom_params: {
              'auth-calls': 'true',
              'apply-nat-acl': 'nat.auto',
              'apply-inbound-acl': 'domains'
            }
          },
          {
            name: 'external',
            type: 'external',
            port: 5080,
            rtp_ip: 'auto',
            sip_ip: 'auto',
            context: 'public',
            codec_prefs: 'PCMU,PCMA',
            dtmf_duration: 2000,
            enabled: true,
            custom_params: {
              'auth-calls': 'false',
              'accept-blind-reg': 'false'
            }
          }
        ]);

      if (insertProfilesError) {
        console.log('⚠️ Erro ao inserir perfis SIP:', insertProfilesError.message);
      } else {
        console.log('✅ Perfis SIP padrão inseridos');
      }
    } else {
      console.log('✅ Perfis SIP já existem');
    }

    // Verificar se já existe configuração global
    const { data: existingConfig } = await supabase
      .from('fs_global_config')
      .select('id')
      .limit(1);

    if (!existingConfig || existingConfig.length === 0) {
      console.log('📋 Inserindo configuração global padrão...');
      const { error: insertConfigError } = await supabase
        .from('fs_global_config')
        .insert([
          {
            log_level: 'INFO',
            max_sessions: 1000,
            sessions_per_second: 30,
            rtp_start_port: 16384,
            rtp_end_port: 32768,
            dialplan_hunt_on_failure: true,
            continue_on_fail: true,
            hangup_after_bridge: true
          }
        ]);

      if (insertConfigError) {
        console.log('⚠️ Erro ao inserir configuração global:', insertConfigError.message);
      } else {
        console.log('✅ Configuração global padrão inserida');
      }
    } else {
      console.log('✅ Configuração global já existe');
    }

    console.log('🎉 Configuração do FreeSWITCH concluída com sucesso!');
    console.log('🔗 Agora você pode acessar o painel em: http://31.97.250.190:8080');
    console.log('👤 Login: admin@dohoo.com | Senha: Admin123!');

  } catch (error) {
    console.error('❌ Erro ao configurar tabelas:', error);
    process.exit(1);
  }
}

// Executar o setup
setupFreeSwitchTables(); 