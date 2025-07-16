const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Simular dados de um tenant
const testTenant = {
  id: 'test-tenant-123',
  name: 'Empresa Teste Debug',
  domain: 'testedebug.local',
  contact_email: 'admin@testedebug.com',
  status: 'active'
};

// Função para gerar configuração do domínio SIP
function generateSipDomainConfig(tenant, sipDomain, context) {
  const tenantId = tenant.id;
  const tenantName = tenant.name;
  const codecPrefs = tenant.codec_prefs || 'PCMU,PCMA,G729';
  
  return `<?xml version="1.0" encoding="utf-8"?>
<include>
  <domain name="${sipDomain}">
    <params>
      <param name="dial-string" value="{^^:sip_invite_domain=$\{dialed_domain\}:presence_id=$\{dialed_user\}@$\{dialed_domain\}}"/>
      <param name="jsonrpc-allowed-methods" value="verto"/>
      <param name="jsonrpc-allowed-event-channels" value="demo,conference,presence"/>
    </params>
    
    <variables>
      <variable name="record_stereo" value="true"/>
      <variable name="default_gateway" value="$$\{default_provider\}"/>
      <variable name="default_areacode" value="$$\{default_areacode\}"/>
      <variable name="transfer_fallback_extension" value="operator"/>
      <variable name="tenant_id" value="${tenantId}"/>
      <variable name="tenant_name" value="${tenantName}"/>
      <variable name="codec_prefs" value="${codecPrefs}"/>
    </variables>
    
    <groups>
      <group name="default">
        <users>
          <!-- Usuários serão adicionados dinamicamente via API -->
        </users>
      </group>
    </groups>
  </domain>
</include>`;
}

// Função para gerar configuração do dialplan
function generateDialplanConfig(tenant, context) {
  const extensionStart = tenant.extension_range_start || 1000;
  const extensionEnd = tenant.extension_range_end || 1999;
  const tenantId = tenant.id;
  const tenantName = tenant.name;
  
  return `<?xml version="1.0" encoding="utf-8"?>
<include>
  <context name="${context}">
    
    <!-- Extensões internas para tenant: ${tenantName} -->
    <extension name="Local_Extension_${tenantId}">
      <condition field="destination_number" expression="^(${extensionStart}[0-9])$">
        <action application="export" data="dialed_extension=$1"/>
        <action application="bind_meta_app" data="1 b s execute_extension::dx XML features"/>
        <action application="bind_meta_app" data="2 b s record_session::$$\{recordings_dir\}/$\{caller_id_number\}.$\{strftime(%Y-%m-%d-%H-%M-%S)\}.wav"/>
        <action application="bind_meta_app" data="3 b s execute_extension::cf XML features"/>
        <action application="set" data="ringback=$$\{us-ring\}"/>
        <action application="set" data="transfer_ringback=$$\{us-ring\}"/>
        <action application="set" data="call_timeout=30"/>
        <action application="set" data="hangup_after_bridge=true"/>
        <action application="set" data="continue_on_fail=true"/>
        <action application="bridge" data="user/$1@$$\{domain\}"/>
        <action application="answer"/>
        <action application="sleep" data="1000"/>
        <action application="voicemail" data="default $$\{domain\} $1"/>
      </condition>
    </extension>
    
    <!-- Grupos de toque para tenant: ${tenantName} -->
    <extension name="Ring_Groups_${tenantId}">
      <condition field="destination_number" expression="^(2[0-9]{3})$">
        <action application="ring_ready"/>
        <action application="set" data="ringback=$$\{us-ring\}"/>
        <action application="bridge" data="group/$1@$$\{domain\}"/>
        <action application="hangup"/>
      </condition>
    </extension>
    
    <!-- Chamadas externas para tenant: ${tenantName} -->
    <extension name="Outbound_Calls_${tenantId}">
      <condition field="destination_number" expression="^([0-9]{10,11})$">
        <action application="set" data="effective_caller_id_number=$$\{outbound_caller_id_number\}"/>
        <action application="set" data="effective_caller_id_name=$$\{outbound_caller_id_name\}"/>
        <action application="bridge" data="sofia/gateway/$$\{default_provider\}/$1"/>
        <action application="hangup"/>
      </condition>
    </extension>
    
    <!-- Features básicos -->
    <extension name="features_${tenantId}">
      <condition field="destination_number" expression="^(\\*\\*|\\*0|\\*\\*)$">
        <action application="answer"/>
        <action application="sleep" data="1000"/>
        <action application="playback" data="tone_stream://%(200,0,941.0,1477.0);loops=2"/>
        <action application="hangup"/>
      </condition>
    </extension>
    
  </context>
</include>`;
}

// Função para gerar configuração do perfil SIP
function generateSipProfileConfig(tenant, profileName, sipDomain, context) {
  const codecPrefs = tenant.codec_prefs || 'PCMU,PCMA,G729';
  
  return `<?xml version="1.0" encoding="utf-8"?>
<include>
  <profile name="${profileName}">
    <aliases>
      <alias name="${sipDomain}"/>
    </aliases>
    <gateways>
      <!-- Gateways serão adicionados dinamicamente -->
    </gateways>
    <domains>
      <domain name="${sipDomain}" alias="false" parse="true"/>
    </domains>
    <settings>
      <param name="debug" value="0"/>
      <param name="sip-trace" value="no"/>
      <param name="sip-capture" value="no"/>
      <param name="rfc2833-pt" value="101"/>
      <param name="sip-port" value="5060"/>
      <param name="dialplan" value="XML"/>
      <param name="context" value="${context}"/>
      <param name="dtmf-duration" value="2000"/>
      <param name="inbound-codec-prefs" value="${codecPrefs}"/>
      <param name="outbound-codec-prefs" value="${codecPrefs}"/>
      <param name="hold-music" value="local_stream://moh"/>
      <param name="rtp-timer-name" value="soft"/>
      <param name="local-network-acl" value="localnet.auto"/>
      <param name="manage-presence" value="true"/>
      <param name="inbound-codec-negotiation" value="generous"/>
      <param name="nonce-ttl" value="60"/>
      <param name="auth-calls" value="false"/>
      <param name="inbound-late-negotiation" value="true"/>
      <param name="inbound-zrtp-passthru" value="true"/>
      <param name="rtp-ip" value="$$\{local_ip_v4\}"/>
      <param name="sip-ip" value="$$\{local_ip_v4\}"/>
      <param name="ext-rtp-ip" value="auto-nat"/>
      <param name="ext-sip-ip" value="auto-nat"/>
      <param name="rtp-timeout-sec" value="300"/>
      <param name="rtp-hold-timeout-sec" value="1800"/>
      <param name="enable-100rel" value="true"/>
      <param name="disable-transfer" value="false"/>
      <param name="manual-redirect" value="true"/>
      <param name="enable-compact-headers" value="true"/>
      <param name="enable-timer" value="false"/>
      <param name="minimum-session-expires" value="120"/>
      <param name="apply-nat-acl" value="nat.auto"/>
      <param name="apply-inbound-acl" value="domains"/>
      <param name="apply-register-acl" value="domains"/>
      <param name="dtmf-type" value="rfc2833"/>
      <param name="record-path" value="$$\{recordings_dir\}"/>
      <param name="record-template" value="$\{caller_id_number\}.$\{target_domain\}.$\{strftime(%Y-%m-%d-%H-%M-%S)\}.wav"/>
    </settings>
  </profile>
</include>`;
}

// Função para escrever arquivo de configuração
async function writeFreeSWITCHConfig(filePath, content) {
  try {
    // Criar diretório se não existir
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    
    // Escrever arquivo
    await fs.writeFile(filePath, content, 'utf8');
    console.log(`   ✅ Criado: ${filePath}`);
    
  } catch (error) {
    console.error(`   ❌ Erro ao criar ${filePath}:`, error.message);
    throw error;
  }
}

// Função para verificar status do FreeSWITCH
async function checkFreeSWITCHStatus() {
  try {
    const result = await execAsync('pgrep -f freeswitch', { timeout: 3000 });
    if (result.stdout.trim()) {
      console.log('   ✅ FreeSWITCH está rodando');
      return true;
    }
  } catch (err) {
    console.log('   ⚠️ FreeSWITCH não está rodando ou não foi encontrado');
    return false;
  }
  return false;
}

// Função para recarregar FreeSWITCH
async function reloadFreeSWITCHConfig() {
  try {
    const isRunning = await checkFreeSWITCHStatus();
    if (!isRunning) {
      console.warn('   ⚠️ FreeSWITCH não está rodando - configurações criadas mas não recarregadas');
      return false;
    }
    
    const reloadCommands = [
      '/usr/local/freeswitch/bin/fs_cli -x "reloadxml"',
      '/usr/local/freeswitch/bin/fs_cli -x "reload xml"',
      '/usr/local/freeswitch/bin/fs_cli -rRS -x "reloadxml"'
    ];
    
    for (const command of reloadCommands) {
      try {
        console.log(`   🔄 Tentando: ${command}`);
        const result = await execAsync(command, { timeout: 10000 });
        console.log(`   ✅ FreeSWITCH recarregado com sucesso!`);
        if (result.stdout && result.stdout.trim()) {
          console.log(`   📋 Resposta: ${result.stdout.trim()}`);
        }
        return true;
      } catch (err) {
        console.warn(`   ❌ Falha: ${err.message}`);
      }
    }
    
    console.warn('   ⚠️ Não foi possível recarregar FreeSWITCH automaticamente');
    return false;
    
  } catch (error) {
    console.error('   ❌ Erro ao recarregar FreeSWITCH:', error.message);
    return false;
  }
}

// Função principal de teste
async function testFreeSWITCHIntegration() {
  console.log('🧪 === TESTE DIRETO DE INTEGRAÇÃO FREESWITCH ===');
  console.log(`📋 Tenant: ${testTenant.name} (${testTenant.id})`);
  
  try {
    // Definir nomes e domínios
    const sipDomain = testTenant.sip_domain || `${testTenant.name.toLowerCase().replace(/\s+/g, '')}.local`;
    const context = testTenant.context || `context_${testTenant.name.toLowerCase().replace(/\s+/g, '_')}`;
    const profileName = `${testTenant.name.toLowerCase().replace(/\s+/g, '_')}_profile`;
    
    console.log(`\n🔧 Configurando FreeSWITCH para tenant: ${testTenant.name}`);
    
    // 1. Criar configuração do domínio SIP
    const sipDomainConfig = generateSipDomainConfig(testTenant, sipDomain, context);
    const sipDomainPath = `/etc/freeswitch/directory/${sipDomain}.xml`;
    
    // 2. Criar configuração do dialplan
    const dialplanConfig = generateDialplanConfig(testTenant, context);
    const dialplanPath = `/etc/freeswitch/dialplan/${context}.xml`;
    
    // 3. Criar configuração do perfil SIP
    const sipProfileConfig = generateSipProfileConfig(testTenant, profileName, sipDomain, context);
    const sipProfilePath = `/etc/freeswitch/sip_profiles/${profileName}.xml`;
    
    // Escrever arquivos de configuração
    await Promise.all([
      writeFreeSWITCHConfig(sipDomainPath, sipDomainConfig),
      writeFreeSWITCHConfig(dialplanPath, dialplanConfig),
      writeFreeSWITCHConfig(sipProfilePath, sipProfileConfig)
    ]);
    
    // 4. Tentar recarregar configurações do FreeSWITCH
    await reloadFreeSWITCHConfig();
    
    console.log(`\n✅ FreeSWITCH configurado para tenant: ${testTenant.name}`);
    console.log(`   - Domínio SIP: ${sipDomain}`);
    console.log(`   - Contexto: ${context}`);
    console.log(`   - Perfil: ${profileName}`);
    
    // Verificar arquivos criados
    console.log(`\n📊 === VERIFICAÇÃO DOS ARQUIVOS ===`);
    const files = [sipDomainPath, dialplanPath, sipProfilePath];
    
    for (const filePath of files) {
      try {
        const stats = await fs.stat(filePath);
        console.log(`✅ ${filePath} (${stats.size} bytes)`);
      } catch (err) {
        console.log(`❌ ${filePath} (não existe)`);
      }
    }
    
    console.log('\n🎯 === TESTE CONCLUÍDO ===');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Executar teste
testFreeSWITCHIntegration(); 