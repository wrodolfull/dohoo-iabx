require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

console.log('🔍 Testando conectividade com Supabase...');
console.log('URL:', process.env.SUPABASE_URL);
console.log('Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Configurada' : 'Não configurada');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testConnection() {
  try {
    console.log('\n📊 Testando conexão...');
    const { data, error } = await supabase.from('tenants').select('count', { count: 'exact' }).limit(1);
    
    if (error) {
      console.error('❌ Erro:', error);
      return;
    }
    
    console.log('✅ Conexão bem-sucedida!');
    console.log('📈 Dados:', data);
    
    // Testar listagem de tenants
    console.log('\n📋 Testando listagem de tenants...');
    const { data: tenants, error: tenantsError } = await supabase.from('tenants').select('*');
    
    if (tenantsError) {
      console.error('❌ Erro ao listar tenants:', tenantsError);
    } else {
      console.log('✅ Tenants encontrados:', tenants?.length || 0);
      console.log(tenants);
    }
    
  } catch (error) {
    console.error('❌ Erro de conexão:', error);
  }
}

testConnection(); 