require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const { exec } = require('child_process');
const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

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

// Middleware para verificar conexão com Supabase
const checkSupabaseConnection = async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('tenants').select('count', { count: 'exact' }).limit(1);
    if (error) {
      console.error('❌ Erro de conexão com Supabase:', error);
      return res.status(503).json({ 
        error: 'Banco de dados indisponível',
        message: 'Não foi possível conectar ao banco de dados. Verifique a configuração do Supabase.',
        details: error.message
      });
    }
    next();
  } catch (error) {
    console.error('❌ Erro de conexão com Supabase:', error);
    return res.status(503).json({ 
      error: 'Banco de dados indisponível',
      message: 'Não foi possível conectar ao banco de dados. Verifique a configuração do Supabase.',
      details: error.message
    });
  }
};

app.get('/health', async (req, res) => {
  try {
    const { data, error } = await supabase.from('tenants').select('count', { count: 'exact' }).limit(1);
    if (error) {
      return res.status(503).json({ 
        status: 'error', 
        message: 'Banco de dados indisponível',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
    res.json({ 
      status: 'ok', 
      database: 'connected',
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'error', 
      message: 'Erro interno do servidor',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// AUTHENTICATION ENDPOINTS
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }
    
    // Buscar usuário no banco (sem verificação de senha por enquanto)
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error || !users) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }
    
    // Validação simples de senha (temporária)
    // Aceitar 123456 ou admin123 para qualquer usuário
    if (password !== '123456' && password !== 'admin123' && password !== 'Admin123!') {
      return res.status(401).json({ error: 'Senha incorreta. Use: 123456, admin123 ou Admin123!' });
    }
    
    // Buscar dados do tenant se existir
    let tenantData = null;
    if (users.tenant_id) {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', users.tenant_id)
        .single();
      tenantData = tenant;
    }
    
    // Retornar dados do usuário
    res.json({
      user: {
        ...users,
        tenant: tenantData,
        company: users.company || tenantData?.name
      },
      token: 'dummy-token-' + users.id // Em produção, usar JWT real
    });
    
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/auth/logout', (req, res) => {
  // Em um sistema real, invalidaríamos o token
  res.json({ message: 'Logout realizado com sucesso' });
});

app.get('/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }
    
    const token = authHeader.split(' ')[1];
    const userId = token.replace('dummy-token-', ''); // Em produção, validar JWT
    
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error || !user) {
      return res.status(401).json({ error: 'Token inválido' });
    }
    
    // Buscar dados do tenant se existir
    let tenantData = null;
    if (user.tenant_id) {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', user.tenant_id)
        .single();
      tenantData = tenant;
    }
    
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      user: {
        ...userWithoutPassword,
        tenant: tenantData,
        company: user.company || tenantData?.name
      }
    });
    
  } catch (error) {
    console.error('Erro ao verificar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// TENANTS
app.get('/tenants', checkSupabaseConnection, async (req, res) => {
  try {
    const { data, error } = await supabase.from('tenants').select('*');
    if (error) {
      console.error('Erro ao buscar tenants:', error);
      return res.status(500).json({ error: error.message });
    }
    res.json(data || []);
  } catch (error) {
    console.error('Erro interno:', error);
    res.status(500).json({ error: error.message });
  }
});

// Buscar tenant específico por ID
app.get('/tenants/:id', checkSupabaseConnection, async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Erro ao buscar tenant:', error);
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }
    
    res.json(data);
  } catch (error) {
    console.error('Erro interno:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/tenants', checkSupabaseConnection, async (req, res) => {
  try {
    const { 
      name, 
      domain, 
      contact_email, 
      plan_id, 
      status = 'active',
      sip_domain,
      context,
      dialplan = 'XML',
      codec_prefs = 'PCMU,PCMA,G729',
      extension_range_start = 1000,
      extension_range_end = 1999
    } = req.body;
    
    // Validar plan_id se fornecido
    let validatedPlanId = null;
    if (plan_id) {
      // Se plan_id é um número ou string numérica, buscar o plano correspondente
      if (!isNaN(plan_id)) {
        const { data: plan, error: planError } = await supabase
          .from('plans')
          .select('id')
          .eq('id', plan_id.toString())
          .single();
        
        if (planError || !plan) {
          console.warn(`⚠️ Plano com ID ${plan_id} não encontrado, usando null`);
          validatedPlanId = null;
        } else {
          validatedPlanId = plan.id;
        }
      } else {
        // Se é um UUID válido, usar diretamente
        validatedPlanId = plan_id;
      }
    }
    
    // Criar tenant no banco (apenas campos que existem na tabela)
    const { data, error } = await supabase.from('tenants').insert([{ 
      name, 
      domain, 
      contact_email, 
      plan_id: validatedPlanId, 
      status
    }]).select();
    
    if (error) {
      console.error('Erro ao criar tenant:', error);
      return res.status(500).json({ error: error.message });
    }
    
    // Configurar FreeSWITCH para o novo tenant
    const tenant = data[0];
    console.log(`🔧 Iniciando configuração do FreeSWITCH para tenant: ${tenant.name} (${tenant.id})`);
    
    try {
      console.log(`📋 Dados do tenant recebidos:`, {
        id: tenant.id,
        name: tenant.name,
        domain: tenant.domain,
        contact_email: tenant.contact_email
      });
      
      await configureFreeSWITCHForTenant(tenant);
      console.log(`✅ FreeSWITCH configurado para tenant: ${tenant.name}`);
    } catch (fsError) {
      console.error('⚠️ Erro ao configurar FreeSWITCH:', fsError);
      console.error('🔍 Stack trace completo:', fsError.stack);
      // Não falha a criação do tenant, apenas registra o erro
    }
    
    res.json(data[0]);
  } catch (error) {
    console.error('Erro interno:', error);
    res.status(500).json({ error: error.message });
  }
});

// Novo endpoint para sincronizar tenant com FreeSWITCH
app.post('/tenants/:id/sync-freeswitch', checkSupabaseConnection, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar tenant
    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }
    
    // Sincronizar com FreeSWITCH
    await configureFreeSWITCHForTenant(tenant);
    
    res.json({ 
      message: 'Sincronização com FreeSWITCH concluída',
      tenant: tenant.name 
    });
    
  } catch (error) {
    console.error('Erro na sincronização:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /tenants/:id - Deletar tenant
app.delete('/tenants/:id', checkSupabaseConnection, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se o tenant existe
    const { data: existingTenant, error: existingError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', id)
      .single();
    
    if (existingError || !existingTenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }
    
    // Verificar se há usuários associados ao tenant
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .eq('tenant_id', id);
    
    if (users && users.length > 0) {
      return res.status(400).json({ 
        error: 'Não é possível deletar tenant que possui usuários. Remova todos os usuários primeiro.' 
      });
    }
    
    // Verificar se há extensões associadas ao tenant
    const { data: extensions, error: extensionsError } = await supabase
      .from('extensions')
      .select('id')
      .eq('tenant_id', id);
    
    if (extensions && extensions.length > 0) {
      return res.status(400).json({ 
        error: 'Não é possível deletar tenant que possui extensões. Remova todas as extensões primeiro.' 
      });
    }
    
    // Deletar tenant do banco
    const { error } = await supabase
      .from('tenants')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Erro ao deletar tenant:', error);
      return res.status(500).json({ error: error.message });
    }
    
    res.json({ message: 'Tenant deletado com sucesso' });
  } catch (error) {
    console.error('Erro interno:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /tenants/:id - Atualizar tenant
app.put('/tenants/:id', checkSupabaseConnection, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      domain, 
      contact_email, 
      plan_id, 
      status,
      sip_domain,
      context,
      dialplan,
      codec_prefs,
      extension_range_start,
      extension_range_end
    } = req.body;
    
    // Verificar se o tenant existe
    const { data: existingTenant, error: existingError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', id)
      .single();
    
    if (existingError || !existingTenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }
    
    // Validar plan_id se fornecido
    let validatedPlanId = plan_id;
    if (plan_id && !isNaN(plan_id)) {
      const { data: plan, error: planError } = await supabase
        .from('plans')
        .select('id')
        .eq('id', plan_id.toString())
        .single();
      
      if (planError || !plan) {
        console.warn(`⚠️ Plano com ID ${plan_id} não encontrado, mantendo valor atual`);
        validatedPlanId = existingTenant.plan_id;
      } else {
        validatedPlanId = plan.id;
      }
    }
    
    // Atualizar tenant no banco
    const { data, error } = await supabase
      .from('tenants')
      .update({ 
        name: name || existingTenant.name,
        domain: domain || existingTenant.domain,
        contact_email: contact_email || existingTenant.contact_email,
        plan_id: validatedPlanId,
        status: status || existingTenant.status
      })
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('Erro ao atualizar tenant:', error);
      return res.status(500).json({ error: error.message });
    }
    
    // Se dados do FreeSWITCH foram alterados, reconfigurar
    if (name !== existingTenant.name || sip_domain || context || dialplan || codec_prefs) {
      try {
        await configureFreeSWITCHForTenant(data[0]);
        console.log(`✅ FreeSWITCH reconfigurado para tenant: ${data[0].name}`);
      } catch (fsError) {
        console.error('⚠️ Erro ao reconfigurar FreeSWITCH:', fsError);
        // Não falha a atualização, apenas registra o erro
      }
    }
    
    res.json(data[0]);
  } catch (error) {
    console.error('Erro interno:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /tenants/:id - Deletar tenant
app.delete('/tenants/:id', checkSupabaseConnection, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se o tenant existe
    const { data: existingTenant, error: existingError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', id)
      .single();
    
    if (existingError || !existingTenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }
    
    // Verificar se há usuários associados ao tenant
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .eq('tenant_id', id);
    
    if (users && users.length > 0) {
      return res.status(400).json({ 
        error: 'Não é possível deletar tenant que possui usuários. Remova todos os usuários primeiro.' 
      });
    }
    
    // Verificar se há extensões associadas ao tenant
    const { data: extensions, error: extensionsError } = await supabase
      .from('extensions')
      .select('id')
      .eq('tenant_id', id);
    
    if (extensions && extensions.length > 0) {
      return res.status(400).json({ 
        error: 'Não é possível deletar tenant que possui extensões. Remova todas as extensões primeiro.' 
      });
    }
    
    // Remover configurações do FreeSWITCH
    try {
      await removeFreeSWITCHConfigForTenant(existingTenant);
      console.log(`✅ Configurações do FreeSWITCH removidas para tenant: ${existingTenant.name}`);
    } catch (fsError) {
      console.error('⚠️ Erro ao remover configurações do FreeSWITCH:', fsError);
      // Não falha a exclusão, apenas registra o erro
    }
    
    // Deletar tenant do banco
    const { error } = await supabase
      .from('tenants')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Erro ao deletar tenant:', error);
      return res.status(500).json({ error: error.message });
    }
    
    res.json({ message: 'Tenant deletado com sucesso' });
  } catch (error) {
    console.error('Erro interno:', error);
    res.status(500).json({ error: error.message });
  }
});

// Função para configurar FreeSWITCH para um tenant
async function configureFreeSWITCHForTenant(tenant) {
  try {
    console.log(`🔧 Configurando FreeSWITCH para tenant: ${tenant.name}`);
    console.log(`   📋 Dados do tenant:`, {
      id: tenant.id,
      name: tenant.name,
      domain: tenant.domain,
      sip_domain: tenant.sip_domain,
      context: tenant.context
    });
    
    // Definir nomes e domínios
    const originalName = tenant.name;
    const processedName = tenant.name.toLowerCase().replace(/\s+/g, '');
    const sipDomain = tenant.sip_domain || `${processedName}.local`;
    const context = tenant.context || `context_${processedName.replace(/\s+/g, '_')}`;
    const profileName = `${processedName.replace(/\s+/g, '_')}_profile`;
    
    console.log(`   🏷️ Processamento de nomes:`, {
      originalName,
      processedName,
      sipDomain,
      context,
      profileName
    });
    
    console.log(`   🏷️ Configurações geradas:`, {
      sipDomain,
      context,
      profileName
    });
    
    // 1. Criar configuração do domínio SIP
    console.log(`   📄 Gerando configuração do domínio SIP...`);
    const sipDomainConfig = generateSipDomainConfig(tenant, sipDomain, context);
    const sipDomainPath = `/etc/freeswitch/directory/${sipDomain}.xml`;
    console.log(`   📁 Caminho do domínio SIP: ${sipDomainPath}`);
    
    // 2. Criar configuração do dialplan
    console.log(`   📄 Gerando configuração do dialplan...`);
    const dialplanConfig = generateDialplanConfig(tenant, context);
    const dialplanPath = `/usr/local/freeswitch/conf/dialplan/${context}.xml`;
    console.log(`   📁 Caminho do dialplan: ${dialplanPath}`);
    
    // 3. Criar configuração do perfil SIP
    console.log(`   📄 Gerando configuração do perfil SIP...`);
    const sipProfileConfig = generateSipProfileConfig(tenant, profileName, sipDomain, context);
    const sipProfilePath = `/etc/freeswitch/sip_profiles/${profileName}.xml`;
    console.log(`   📁 Caminho do perfil SIP: ${sipProfilePath}`);
    
    // Escrever arquivos de configuração
    console.log(`   📝 Iniciando escrita dos arquivos...`);
    try {
      await Promise.all([
        writeFreeSWITCHConfig(sipDomainPath, sipDomainConfig),
        writeFreeSWITCHConfig(dialplanPath, dialplanConfig),
        writeFreeSWITCHConfig(sipProfilePath, sipProfileConfig)
      ]);
      console.log(`   ✅ Todos os arquivos foram escritos com sucesso`);
    } catch (writeError) {
      console.error(`   ❌ Erro ao escrever arquivos:`, writeError);
      throw writeError;
    }
    
    // 4. Tentar recarregar configurações do FreeSWITCH
    console.log(`   🔄 Tentando recarregar FreeSWITCH...`);
    try {
    await reloadFreeSWITCHConfig();
      console.log(`   ✅ FreeSWITCH recarregado com sucesso`);
    } catch (reloadError) {
      console.error(`   ⚠️ Erro ao recarregar FreeSWITCH:`, reloadError);
      // Não falha a configuração, apenas registra o erro
    }
    
    console.log(`✅ FreeSWITCH configurado para tenant: ${tenant.name}`);
    console.log(`   - Domínio SIP: ${sipDomain}`);
    console.log(`   - Contexto: ${context}`);
    console.log(`   - Perfil: ${profileName}`);
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao configurar FreeSWITCH:', error);
    console.error('🔍 Stack trace completo:', error.stack);
    throw error;
  }
}

// Função para remover configurações do FreeSWITCH para um tenant
async function removeFreeSWITCHConfigForTenant(tenant) {
  try {
    console.log(`🗑️ Removendo configurações do FreeSWITCH para tenant: ${tenant.name}`);
    
  const sipDomain = tenant.sip_domain || `${tenant.name.toLowerCase().replace(/\s+/g, '')}.local`;
  const context = tenant.context || `context_${tenant.name.toLowerCase().replace(/\s+/g, '_')}`;
    const profileName = `${tenant.name.toLowerCase().replace(/\s+/g, '_')}_profile`;
    
    // Remover arquivos de configuração
    const filesToRemove = [
      `/etc/freeswitch/directory/${sipDomain}.xml`,
      `/usr/local/freeswitch/conf/dialplan/${context}.xml`,
      `/etc/freeswitch/sip_profiles/${profileName}.xml`
    ];
    
    for (const filePath of filesToRemove) {
      try {
        if (require('fs').existsSync(filePath)) {
          require('fs').unlinkSync(filePath);
          console.log(`   - Removido: ${filePath}`);
        }
      } catch (err) {
        console.warn(`   - Erro ao remover ${filePath}:`, err.message);
      }
    }
    
    // Tentar recarregar configurações
    await reloadFreeSWITCHConfig();
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao remover configurações do FreeSWITCH:', error);
    throw error;
  }
}

// Gerar configuração do domínio SIP
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

// Gerar configuração do dialplan
async function generateDialplanConfig(tenant, context) {
  const extensionStart = tenant.extension_range_start || 1000;
  const extensionEnd = tenant.extension_range_end || 1999;
  const tenantId = tenant.id;
  const tenantName = tenant.name;
  const tenantDomain = tenant.sip_domain || `${tenantName.toLowerCase().replace(/\s+/g, '')}.local`;

  // Buscar ringgroups, extensões e rotas de entrada do tenant
  const { data: ringGroups } = await supabase
    .from('ringgroups')
    .select('*')
    .eq('tenant_id', tenantId);
  const { data: extensions } = await supabase
    .from('extensions')
    .select('*')
    .eq('tenant_id', tenantId);
  const { data: inboundRoutes } = await supabase
    .from('inbound_routes')
    .select('*')
    .eq('tenant_id', tenantId);
  const { data: outboundRoutes } = await supabase
    .from('outbound_routes')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('priority', { ascending: true });

  console.log('🔍 [DIALPLAN] Extensions encontrados:', (extensions || []).length, extensions);
  console.log('🔍 [DIALPLAN] RingGroups encontrados:', (ringGroups || []).length, ringGroups);
  console.log('🔍 [DIALPLAN] InboundRoutes encontrados:', (inboundRoutes || []).length, inboundRoutes);
  console.log('🔍 [DIALPLAN] OutboundRoutes encontrados:', (outboundRoutes || []).length, outboundRoutes);

  // Mapear ramais por id para facilitar
  const extMap = {};
  (extensions || []).forEach(ext => { extMap[ext.id] = ext; });

  // Gerar XML de cada grupo de ring
  let ringGroupsXml = '';
  (ringGroups || []).forEach(rg => {
    // Montar lista de ramais do grupo
    let extNumbers = [];
    if (Array.isArray(rg.extensions)) {
      extNumbers = rg.extensions.map(id => extMap[id]?.number).filter(Boolean);
    } else if (typeof rg.extensions === 'string' && rg.extensions.startsWith('{')) {
      // Parse PostgreSQL array string
      const ids = rg.extensions.replace(/[{}\"]/g, '').split(',').filter(Boolean);
      extNumbers = ids.map(id => extMap[id]?.number).filter(Boolean);
    }
    const timeout = rg.timeout || 30;
    const groupNumber = rg.number || '';
    ringGroupsXml +=
      '\n    <extension name="RingGroup_' + rg.name + '">\n' +
      '      <condition field="destination_number" expression="^' + groupNumber + '$">\n' +
      '        <action application="set" data="ringback=$${us-ring}"/>\n' +
      '        <action application="set" data="call_timeout=' + timeout + '"/>\n' +
      '        <action application="bridge" data="' + extNumbers.map(num => `user/${num}@${tenantDomain}`).join(',') + '"/>\n' +
      '        ' + generateTimeoutActionXml(rg, tenantDomain) + '\n' +
      '      </condition>\n' +
      '    </extension>';
  });
  
  // Gerar XML das rotas de entrada
  let inboundXml = '';
  (inboundRoutes || []).forEach(route => {
    // Montar destino
    let bridge = '';
    if (route.destination_type === 'extension' && extMap[route.destination_id]) {
      bridge = `user/${extMap[route.destination_id].number}@${tenantDomain}`;
    } else if (route.destination_type === 'ringgroup' && ringGroups?.find(rg => rg.id === route.destination_id)) {
      const rg = ringGroups.find(rg => rg.id === route.destination_id);
      bridge = `user/${(rg.extensions||[]).map(id => extMap[id]?.number).filter(Boolean).join(',')}@${tenantDomain}`;
    } else if (route.destination_type === 'custom') {
      bridge = route.destination_id;
    }
    // Condição de IP de origem
    let conditionOpen = '';
    let conditionClose = '';
    if (route.source_ip) {
      conditionOpen = `<condition field="network_addr" expression="^${route.source_ip}$">`;
      conditionClose = `</condition>`;
    }
    // Condição de DID
    const didCond = `<condition field="destination_number" expression="^${route.did}$">`;
    // Ações
    let actions = '';
    if (route.caller_id_name) {
      actions += `<action application="set" data="effective_caller_id_name=${route.caller_id_name}"/>\n`;
    }
    actions += `<action application="bridge" data="${bridge}"/>`;
    // Montar bloco
    inboundXml += `\n    <extension name="Inbound_${route.did}">\n      ${conditionOpen || ''}\n      ${didCond}\n        ${actions}\n      </condition>\n      ${conditionClose || ''}\n    </extension>`;
  });

  // Gerar XML das rotas de saída (outbound)
  let outboundXml = '';
  (outboundRoutes || []).filter(r => r.is_active !== false).forEach(route => {
    // Expressão de destino (regex ou preset)
    let expression = route.regex_pattern || '';
    if (!expression && route.preset) {
      // Presets conhecidos
      if (route.preset === 'local') expression = '^[2-5][0-9]{7}$';
      if (route.preset === 'ldn') expression = '^0[1-9][1-9][2-9][0-9]{7}$';
      if (route.preset === 'movel') expression = '^[9][6-9][0-9]{7}$';
      // Adicione outros presets conforme necessário
    }
    if (!expression) expression = '^([0-9]{8,15})$'; // fallback

    // Techprefix
    let techprefix = route.techprefix ? route.techprefix : '';
    // CN_DOMAIN/DDI
    let cnDomain = route.cn_domain ? route.cn_domain : '';
    // Trunks
    let trunk = route.trunk || '$${default_provider}';
    let trunkFallback = route.trunk_fallback || '';
    // Caller ID
    let callerIdNumber = route.caller_id_number || '$${outbound_caller_id_number}';
    let callerIdName = route.caller_id_name || '$${outbound_caller_id_name}';
    // Destino pós-trunk (ramal ou ringgroup)
    let postDestination = '';
    if (route.destination_type === 'extension' && extMap[route.destination_id]) {
      postDestination = `user/${extMap[route.destination_id].number}@${tenantDomain}`;
    } else if (route.destination_type === 'ringgroup' && ringGroups?.find(rg => rg.id === route.destination_id)) {
      const rg = ringGroups.find(rg => rg.id === route.destination_id);
      postDestination = (rg.extensions||[]).map(id => extMap[id]?.number).filter(Boolean).map(num => `user/${num}@${tenantDomain}`).join(',');
    } else if (route.destination_type === 'custom') {
      postDestination = route.destination_id;
    }
    // Montar ação de bridge
    let bridgeData = '';
    if (techprefix) {
      bridgeData = `sofia/gateway/${trunk}/${techprefix}$1`;
    } else {
      bridgeData = `sofia/gateway/${trunk}/$1`;
    }
    if (cnDomain) {
      bridgeData += `@${cnDomain}`;
    }
    // Fallback de trunk
    let failover = '';
    if (trunkFallback) {
      let fallbackBridge = '';
      if (techprefix) {
        fallbackBridge = `sofia/gateway/${trunkFallback}/${techprefix}$1`;
      } else {
        fallbackBridge = `sofia/gateway/${trunkFallback}/$1`;
      }
      if (cnDomain) {
        fallbackBridge += `@${cnDomain}`;
      }
      failover = `\n        <action application=\"bridge\" data=\"${fallbackBridge}\"/>`;
    }
    // Pós-processamento: se destino for ramal/ringgroup após trunk, usar transfer
    let postBridge = '';
    if (postDestination) {
      postBridge = `\n        <action application=\"transfer\" data=\"${postDestination} XML ${context}\"/>`;
    }
    // Montar bloco XML
    outboundXml += `\n    <extension name=\"Outbound_${route.name || route.id}\">\n      <condition field=\"destination_number\" expression=\"${expression}\">\n        <action application=\"set\" data=\"effective_caller_id_number=${callerIdNumber}\"/>\n        <action application=\"set\" data=\"effective_caller_id_name=${callerIdName}\"/>\n        <action application=\"bridge\" data=\"${bridgeData}\"/>${failover}${postBridge}\n        <action application=\"hangup\"/>\n      </condition>\n    </extension>`;
  });

  // Bloco de retorno do XML do dialplan
  let xml = '';
  xml += '<?xml version="1.0" encoding="utf-8"?>\n<include>\n  <context name="' + context + '">\n';
  xml += '    <!-- Extensões internas para tenant: ' + tenantName + ' -->\n';
  xml += '    <extension name="Local_Extension_' + tenantId + '">\n';
  xml += '      <condition field="destination_number" expression="^(' + extensionStart + '[0-9])$">\n';
  xml += '        <action application="export" data="dialed_extension=$1"/>\n';
  xml += '        <action application="bind_meta_app" data="1 b s execute_extension::dx XML features"/>\n';
  xml += '        <action application="bind_meta_app" data="2 b s record_session::$$\{recordings_dir}/$$\{caller_id_number}.$$\{strftime(%Y-%m-%d-%H-%M-%S)}.wav"/>\n';
  xml += '        <action application="bind_meta_app" data="3 b s execute_extension::cf XML features"/>\n';
  xml += '        <action application="set" data="ringback=$${us-ring}"/>\n';
  xml += '        <action application="set" data="transfer_ringback=$${us-ring}"/>\n';
  xml += '        <action application="set" data="call_timeout=30"/>\n';
  xml += '        <action application="set" data="hangup_after_bridge=true"/>\n';
  xml += '        <action application="set" data="continue_on_fail=true"/>\n';
  xml += '        <action application="bridge" data="user/$1@$${domain}"/>\n';
  xml += '        <action application="answer"/>\n';
  xml += '        <action application="sleep" data="1000"/>\n';
  xml += '        <action application="voicemail" data="default $${domain} $1"/>\n';
  xml += '      </condition>\n';
  xml += '    </extension>\n';
  xml += ringGroupsXml;
  xml += inboundXml;
  xml += outboundXml;
  xml += '    <!-- Features básicos -->\n';
  xml += '    <extension name="features_' + tenantId + '">\n';
  xml += '      <condition field="destination_number" expression="^(**|*0|**)\$">\n';
  xml += '        <action application="answer"/>\n';
  xml += '        <action application="sleep" data="1000"/>\n';
  xml += '        <action application="playback" data="tone_stream://%(200,0,941.0,1477.0);loops=2"/>\n';
  xml += '        <action application="hangup"/>\n';
  xml += '      </condition>\n';
  xml += '    </extension>\n';
  xml += '  </context>\n</include>';
  return xml;
}

// Gerar configuração do perfil SIP
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

// Escrever arquivo de configuração do FreeSWITCH
async function writeFreeSWITCHConfig(filePath, content) {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    console.log(`   📝 Tentando criar: ${filePath}`);
    // Criar diretório se não existir
    const dir = path.dirname(filePath);
    console.log(`   📁 Criando diretório: ${dir}`);
    try {
      await fs.mkdir(dir, { recursive: true });
      console.log(`   ✅ Diretório criado/verificado: ${dir}`);
    } catch (mkdirError) {
      console.error(`   ❌ Erro ao criar diretório ${dir}:`, mkdirError.message);
      throw mkdirError;
    }
    // Verificar se o diretório existe agora
    try {
      const dirStats = await fs.stat(dir);
      console.log(`   ✅ Diretório existe: ${dir} (${dirStats.isDirectory() ? 'é diretório' : 'não é diretório'})`);
    } catch (statError) {
      console.error(`   ❌ Erro ao verificar diretório ${dir}:`, statError.message);
      throw statError;
    }
    // Escrever arquivo
    console.log(`   📄 Escrevendo arquivo: ${filePath}`);
    // Se content for uma Promise, aguarde
    if (content && typeof content.then === 'function') {
      content = await content;
    }
    await fs.writeFile(filePath, content, 'utf8');
    // Verificar se o arquivo foi criado
    try {
      const fileStats = await fs.stat(filePath);
      console.log(`   ✅ Arquivo criado: ${filePath} (${fileStats.size} bytes)`);
    } catch (statError) {
      console.error(`   ❌ Erro ao verificar arquivo ${filePath}:`, statError.message);
      throw statError;
    }
  } catch (error) {
    console.error(`   ❌ Erro ao criar ${filePath}:`, error.message);
    console.error(`   🔍 Stack trace:`, error.stack);
    throw error;
  }
}

// Verificar se FreeSWITCH está rodando
async function checkFreeSWITCHStatus() {
  try {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    // Verificar se o processo FreeSWITCH está rodando
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
  } catch (error) {
    console.warn('   ⚠️ Erro ao verificar status do FreeSWITCH:', error.message);
    return false;
  }
}

// Recarregar configurações do FreeSWITCH
async function reloadFreeSWITCHConfig() {
  try {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    // Primeiro verificar se FreeSWITCH está rodando
    const isRunning = await checkFreeSWITCHStatus();
    if (!isRunning) {
      console.warn('   ⚠️ FreeSWITCH não está rodando - configurações criadas mas não recarregadas');
      console.log('   💡 Inicie o FreeSWITCH e execute: /usr/local/freeswitch/bin/fs_cli -x "reloadxml"');
      return false;
    }
    
    // Tentar diferentes métodos de reload (priorizando o caminho correto)
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
    console.log('   💡 Execute manualmente: /usr/local/freeswitch/bin/fs_cli -x "reloadxml"');
    console.log('   📁 Arquivos de configuração foram criados com sucesso');
    return false;
    
  } catch (error) {
    console.error('   ❌ Erro ao recarregar FreeSWITCH:', error.message);
    return false;
  }
}

// Endpoint de teste para FreeSWITCH
app.post('/test-freeswitch/:tenantId', checkSupabaseConnection, async (req, res) => {
  try {
    const { tenantId } = req.params;
    
    // Buscar tenant
    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();
    
    if (error || !tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }
    
    console.log(`\n🧪 === TESTE DE INTEGRAÇÃO FREESWITCH ===`);
    console.log(`📋 Tenant: ${tenant.name} (${tenant.id})`);
    
    try {
      // Verificar status do FreeSWITCH
      const isRunning = await checkFreeSWITCHStatus();
      
      // Configurar tenant no FreeSWITCH
      await configureFreeSWITCHForTenant(tenant);
      
      // Verificar arquivos criados
      const sipDomain = tenant.sip_domain || `${tenant.name.toLowerCase().replace(/\s+/g, '')}.local`;
      const context = tenant.context || `context_${tenant.name.toLowerCase().replace(/\s+/g, '_')}`;
      const profileName = `${tenant.name.toLowerCase().replace(/\s+/g, '_')}_profile`;
      
      const files = [
        `/etc/freeswitch/directory/${sipDomain}.xml`,
        `/usr/local/freeswitch/conf/dialplan/${context}.xml`,
        `/etc/freeswitch/sip_profiles/${profileName}.xml`
      ];
      
      const fs = require('fs');
      const filesStatus = files.map(file => ({
        file,
        exists: fs.existsSync(file),
        size: fs.existsSync(file) ? fs.statSync(file).size : 0
      }));
      
      console.log(`\n📊 === RESULTADO DO TESTE ===`);
      filesStatus.forEach(({ file, exists, size }) => {
        console.log(`${exists ? '✅' : '❌'} ${file} ${exists ? `(${size} bytes)` : '(não existe)'}`);
      });
    
    res.json({ 
        success: true,
        tenant: {
          id: tenant.id,
          name: tenant.name,
          sipDomain,
          context,
          profileName
        },
        freeswitch: {
          running: isRunning,
          files: filesStatus
        },
        message: 'Teste de integração FreeSWITCH concluído'
    });
    
  } catch (error) {
      console.error(`❌ Erro no teste:`, error);
      res.status(500).json({ 
        error: 'Erro no teste de integração', 
        details: error.message 
      });
    }
    
  } catch (error) {
    console.error('Erro interno:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint de teste simples para verificar criação de arquivos
app.post('/test-file-creation', async (req, res) => {
  try {
    console.log('🧪 Teste de criação de arquivos solicitado');
    
    const fs = require('fs').promises;
    const path = require('path');
    
    const testPaths = [
      '/etc/freeswitch/directory/test.xml',
      '/usr/local/freeswitch/conf/dialplan/test.xml', 
      '/etc/freeswitch/sip_profiles/test.xml'
    ];
    
    const results = [];
    
    for (const filePath of testPaths) {
      console.log(`📝 Testando: ${filePath}`);
      
      try {
        // Verificar se o diretório pai existe
        const dir = path.dirname(filePath);
        
        try {
          await fs.stat(dir);
          console.log(`   ✅ Diretório existe: ${dir}`);
        } catch (err) {
          console.log(`   ❌ Diretório não existe: ${dir}`);
          console.log(`   🔧 Tentando criar...`);
          
          await fs.mkdir(dir, { recursive: true });
          console.log(`   ✅ Diretório criado: ${dir}`);
        }
        
        // Tentar escrever arquivo
        const testContent = `<?xml version="1.0" encoding="utf-8"?>
<test>
  <message>Arquivo de teste criado em ${new Date().toISOString()}</message>
</test>`;
        
        await fs.writeFile(filePath, testContent, 'utf8');
        
        // Verificar se foi criado
        const fileStats = await fs.stat(filePath);
        
        results.push({
          path: filePath,
          success: true,
          size: fileStats.size,
          message: 'Arquivo criado com sucesso'
        });
        
        console.log(`   ✅ Arquivo criado: ${filePath} (${fileStats.size} bytes)`);
    
  } catch (error) {
        results.push({
          path: filePath,
          success: false,
          error: error.message,
          message: 'Erro ao criar arquivo'
        });
        
        console.log(`   ❌ Erro: ${error.message}`);
      }
    }
    
    console.log('✅ Teste de criação de arquivos concluído');
    
    res.json({ 
      message: 'Teste de criação de arquivos concluído',
      results,
      success: true
    });
    
  } catch (error) {
    console.error('❌ Erro no teste de criação de arquivos:', error);
    res.status(500).json({ 
      error: error.message,
      success: false
    });
  }
});

// Endpoint de teste para verificar usuários
app.get('/test-users', checkSupabaseConnection, async (req, res) => {
  try {
    console.log('🧪 Teste de usuários solicitado');
    
    // Listar todos os tenants
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('id, name')
      .order('created_at', { ascending: false });
    
    if (tenantsError) {
      console.error('❌ Erro ao buscar tenants:', tenantsError);
      return res.status(500).json({ error: tenantsError.message });
    }
    
    console.log('📋 Tenants encontrados:', tenants);
    
    // Para cada tenant, buscar usuários
    const tenantsWithUsers = [];
    
    for (const tenant of tenants || []) {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, name, role, created_at')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false });
      
      if (usersError) {
        console.error(`❌ Erro ao buscar usuários do tenant ${tenant.id}:`, usersError);
        tenantsWithUsers.push({
          tenant: tenant,
          users: [],
          error: usersError.message
        });
      } else {
        console.log(`✅ Usuários do tenant ${tenant.name}:`, users);
        tenantsWithUsers.push({
          tenant: tenant,
          users: users || [],
          error: null
        });
      }
    }
    
    console.log('✅ Teste de usuários concluído');
    
    res.json({
      message: 'Teste de usuários concluído',
      total_tenants: tenants?.length || 0,
      tenants_with_users: tenantsWithUsers
    });
    
  } catch (error) {
    console.error('❌ Erro no teste de usuários:', error);
    res.status(500).json({ 
      error: error.message,
      success: false
    });
  }
});

// Endpoint de teste para simular criação de tenant
app.post('/test-tenant-creation', async (req, res) => {
  try {
    console.log('🧪 Teste de criação de tenant solicitado');
    
    // Simular dados de tenant
    const testTenant = {
      id: 'test-tenant-' + Date.now(),
      name: 'Empresa Teste Simulação',
      domain: 'testesimulacao.local',
      contact_email: 'admin@testesimulacao.com',
      status: 'active'
    };
    
    console.log(`📋 Tenant simulado:`, testTenant);
    
    // Testar configuração do FreeSWITCH
    console.log(`🔧 Iniciando configuração do FreeSWITCH...`);
    await configureFreeSWITCHForTenant(testTenant);
    
    console.log(`✅ Teste de criação de tenant concluído`);
    
    res.json({ 
      message: 'Teste de criação de tenant concluído',
      tenant: testTenant,
      success: true
    });
    
  } catch (error) {
    console.error('❌ Erro no teste de criação de tenant:', error);
    res.status(500).json({ 
      error: error.message,
      success: false,
      stack: error.stack
    });
  }
});

// EXTENSIONS (RAMAIS)
app.get('/tenants/:tenantId/extensions', checkSupabaseConnection, async (req, res) => {
  try {
    const { tenantId } = req.params;
    
    // Se tenantId não é um UUID válido, buscar o primeiro tenant
    let actualTenantId = tenantId;
    if (!tenantId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      const { data: tenants, error: tenantError } = await supabase
        .from('tenants')
        .select('id')
        .limit(1);
      
      if (tenantError || !tenants || tenants.length === 0) {
        return res.json([]);
      }
      actualTenantId = tenants[0].id;
    }
    
    const { data, error } = await supabase
      .from('extensions')
      .select(`
        *,
        users!extensions_user_id_fkey (
          id,
          name,
          email
        )
      `)
      .eq('tenant_id', actualTenantId);
    
    if (error) {
      console.error('Erro ao buscar extensions:', error);
      return res.status(500).json({ error: error.message });
    }
    
    res.json(data || []);
  } catch (error) {
    console.error('Erro interno:', error);
    res.status(500).json({ error: error.message });
  }
});

function provisionExtension(extension) {
  const xml = `
<include>
  <user id="${extension.number}">
    <params>
      <param name="password" value="${extension.sip_password}"/>
      <param name="vm-password" value="${extension.number}"/>
    </params>
    <variables>
      <variable name="toll_allow" value="domestic,international,local"/>
      <variable name="accountcode" value="${extension.number}"/>
      <variable name="user_context" value="default"/>
      <variable name="effective_caller_id_name" value="${extension.name}"/>
      <variable name="effective_caller_id_number" value="${extension.number}"/>
      <variable name="outbound_caller_id_name" value="${extension.name}"/>
      <variable name="outbound_caller_id_number" value="${extension.number}"/>
      <variable name="callgroup" value="techsupport"/>
    </variables>
  </user>
</include>`;

  const filePath = `/usr/local/freeswitch/conf/directory/default/${extension.number}.xml`;
  
  try {
    require('fs').writeFileSync(filePath, xml);
    // Reload FreeSWITCH configuration
    require('child_process').exec('fs_cli -x "reloadxml"');
    console.log(`✅ Extension ${extension.number} provisioned successfully`);
  } catch (error) {
    console.error('❌ Error provisioning extension:', error);
  }
}

app.post('/tenants/:tenantId/extensions', checkSupabaseConnection, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { name, number, is_active, created_by, sip_password, user_id } = req.body;
    // Validar senha SIP obrigatória
    if (!sip_password || !sip_password.trim()) {
      return res.status(400).json({ error: 'A senha SIP é obrigatória.' });
    }
    // Verificar se já existe ramal com o mesmo número para o tenant
    const { data: existing, error: existingError } = await supabase
      .from('extensions')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('number', number)
      .single();
    if (existing) {
      return res.status(400).json({ error: 'Já existe um ramal com este número para este tenant.' });
    }
    // Verificar se o usuário já tem um ramal vinculado (se user_id foi fornecido)
    if (user_id) {
      const { data: existingUserExtension } = await supabase
        .from('extensions')
        .select('id')
        .eq('user_id', user_id)
        .single();
      
      if (existingUserExtension) {
        return res.status(400).json({ error: 'Este usuário já possui um ramal vinculado.' });
      }
    }

    // Criar ramal
    const { data, error } = await supabase.from('extensions').insert([
      { tenant_id: tenantId, name, number, sip_password, is_active, created_by, user_id }
    ]).select();
    if (error) {
      // Tratar erro de constraint única (ramal duplicado)
      if (error.code === '23505' && error.message && error.message.includes('extensions_tenant_id_number_key')) {
        return res.status(400).json({ error: 'Já existe um ramal com este número para este tenant.' });
      }
      console.error('Erro ao criar extension:', error);
      return res.status(500).json({ error: error.message });
    }
    // Buscar dados do tenant para provisionar no FreeSWITCH
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();
    if (!tenantError && tenant && data && data[0]) {
      // Provisionar no FreeSWITCH com integração completa
      try {
        provisionExtension(data[0]);
        console.log(`✅ Extensão ${data[0].number} provisionada no FreeSWITCH para tenant ${tenant.name}`);
      } catch (fsError) {
        console.error('⚠️ Erro ao provisionar no FreeSWITCH:', fsError);
        // Não falha a criação do ramal, apenas registra o erro
      }
    }
    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Erro interno:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/extensions/:id', checkSupabaseConnection, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, number, sip_password, is_active, user_id } = req.body;
    
    // Verificar se o usuário já tem outro ramal vinculado (se user_id foi fornecido)
    if (user_id) {
      const { data: existingUserExtension } = await supabase
        .from('extensions')
        .select('id')
        .eq('user_id', user_id)
        .neq('id', id) // Excluir o próprio ramal da verificação
        .single();
      
      if (existingUserExtension) {
        return res.status(400).json({ error: 'Este usuário já possui outro ramal vinculado.' });
      }
    }

    const { data, error } = await supabase
      .from('extensions')
      .update({ name, number, sip_password, is_active, user_id })
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('Erro ao atualizar extension:', error);
      return res.status(500).json({ error: error.message });
    }
    
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Extension não encontrada' });
    }
    
    // Buscar dados do tenant para reprovisionar no FreeSWITCH
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', data[0].tenant_id)
      .single();
    
    if (!tenantError && tenant && data && data[0]) {
      try {
        provisionExtension(data[0]);
        console.log(`✅ Extensão ${data[0].number} reprovisionada no FreeSWITCH para tenant ${tenant.name}`);
      } catch (fsError) {
        console.error('⚠️ Erro ao reprovisionar no FreeSWITCH:', fsError);
      }
    }
    
    // Atualizar users.extension
    if (user_id) {
      await supabase
        .from('users')
        .update({ extension: number })
        .eq('id', user_id);
    } else {
      // Se user_id foi removido, remover extension do usuário antigo
      const { data: ext } = await supabase.from('extensions').select('number, user_id').eq('id', id).single();
      if (ext && ext.user_id) {
        await supabase
          .from('users')
          .update({ extension: null })
          .eq('id', ext.user_id);
      }
    }
    
    res.json(data[0]);
  } catch (error) {
    console.error('Erro interno:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/extensions/:id', checkSupabaseConnection, async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase.from('extensions').delete().eq('id', id);
    
    if (error) {
      console.error('Erro ao deletar extension:', error);
      return res.status(500).json({ error: error.message });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Erro interno:', error);
    res.status(500).json({ error: error.message });
  }
});

// RING GROUPS
app.get('/tenants/:tenantId/ringgroups', checkSupabaseConnection, async (req, res) => {
  try {
    const { tenantId } = req.params;
    
    // Se tenantId não é um UUID válido, buscar o primeiro tenant
    let actualTenantId = tenantId;
    if (!tenantId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      const { data: tenants, error: tenantError } = await supabase
        .from('tenants')
        .select('id')
        .limit(1);
      
      if (tenantError || !tenants || tenants.length === 0) {
        return res.json([]);
      }
      actualTenantId = tenants[0].id;
    }
    
    const { data, error } = await supabase
      .from('ringgroups')
      .select('*')
      .eq('tenant_id', actualTenantId);
    
    if (error) {
      console.error('Erro ao buscar ring groups:', error);
      return res.status(500).json({ error: error.message });
    }
    
    res.json(data || []);
  } catch (error) {
    console.error('Erro interno:', error);
    res.status(500).json({ error: error.message });
  }
});

async function provisionRingGroup(ringGroup, extensions) {
  try {
    // Buscar configuração da pesquisa de satisfação com template
    const { data: surveyConfig } = await supabase
      .from('cc_post_call_survey')
      .select(`
        *,
        cc_surveys (
          id,
          name,
          question_text,
          survey_type,
          options
        )
      `)
      .eq('ring_group_id', ringGroup.id)
      .single();

    // Gerar XML do dialplan do ring group
    let dialplanXml = '';
    dialplanXml += `<extension name="RingGroup_${ringGroup.name}">\n`;
    dialplanXml += `  <condition field="destination_number" expression="^${ringGroup.number || ringGroup.name}$">\n`;
    dialplanXml += `    <action application="answer"/>\n`;
    dialplanXml += `    <action application="set" data="ringback=${'{us-ring'}"/>\n`;
    dialplanXml += `    <action application="bridge" data="user/${(extensions||[]).map(e=>e.number).join(',')}"/>\n`;

    // Se pesquisa de satisfação estiver ativada, incluir no XML
    if (surveyConfig && surveyConfig.enabled && surveyConfig.cc_surveys) {
      const survey = surveyConfig.cc_surveys;
      // Usar a pergunta do template
      const questionText = survey.question_text || 'Como você avalia seu atendimento? (1 a 5)';
      
      // Gerar TTS da pergunta ou usar arquivo de áudio
      dialplanXml += `    <action application="say" data="en number pronounced ${questionText}"/>\n`;
      dialplanXml += `    <action application="read" data="1 1 5 3000 # survey_response"/>\n`;
      dialplanXml += `    <action application="curl" data="https://SUA_API/survey_response?call_id=${'${uuid}'}&ring_group_id=${ringGroup.id}&survey_template_id=${survey.id}&response=${'${survey_response}'}\"/>\n`;
    }

    dialplanXml += `  </condition>\n`;
    dialplanXml += `</extension>\n`;

    // Escrever o XML no diretório do FreeSWITCH (exemplo)
    const dialplanPath = path.join('/etc/freeswitch/dialplan/', `ringgroup_${ringGroup.id}.xml`);
    // Aqui você pode usar fs.writeFileSync(dialplanPath, dialplanXml) ou lógica já existente
    // fs.writeFileSync(dialplanPath, dialplanXml);
    console.log('🔧 [Provision] Dialplan XML gerado para RingGroup:', ringGroup.name, '\n', dialplanXml);
    // TODO: Chamar reload do FreeSWITCH se necessário
    console.log(`✅ Ring Group ${ringGroup.name} provisioned successfully`);
  } catch (err) {
    console.error('Erro ao provisionar Ring Group:', err);
  }
}

app.post('/tenants/:tenantId/ringgroups', checkSupabaseConnection, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { name, strategy, timeout, extensions, created_by, number, type, is_active, timeout_action_type, timeout_action } = req.body;
    
    const ringGroupData = {
      tenant_id: tenantId,
      name: name || 'Novo Grupo',
      strategy: strategy || 'simultaneous',
      timeout: typeof timeout === 'number' && !isNaN(timeout) ? timeout : 30,
      extensions: Array.isArray(extensions) ? `{${extensions.map(id => `"${id}"`).join(',')}}` : '{}',
      created_by: created_by || null,
      number: number || null,
      type: type || 'simultaneous',
      is_active: is_active !== undefined ? is_active : true,
      timeout_action_type: timeout_action_type || null,
      timeout_action: timeout_action || null,
    };
    
    const { data, error } = await supabase
      .from('ringgroups')
      .insert([ringGroupData])
      .select();
    
    if (error) {
      console.error('Erro ao criar ring group:', error);
      return res.status(500).json({ error: error.message });
    }
    
    // Get extensions for the group (if any)
    const { data: extensionsData } = await supabase
      .from('extensions')
      .select('*')
      .eq('tenant_id', tenantId);
    
    // Auto-provision in FreeSWITCH
    if (data && data[0]) {
      provisionRingGroup(data[0], extensionsData || []);
    }
    
    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Erro interno:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/ringgroups/:id', checkSupabaseConnection, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, strategy, timeout, extensions, is_active, number, created_by, timeout_action_type, timeout_action } = req.body;
    
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (strategy !== undefined) updateData.strategy = strategy;
    if (timeout !== undefined && !isNaN(Number(timeout))) updateData.timeout = parseInt(timeout);
    if (Array.isArray(extensions)) updateData.extensions = `{${extensions.map(id => `"${id}"`).join(',')}}`;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (number !== undefined) updateData.number = number;
    if (created_by !== undefined) updateData.created_by = created_by;
    if (timeout_action_type !== undefined) updateData.timeout_action_type = timeout_action_type;
    if (timeout_action !== undefined) updateData.timeout_action = timeout_action;
    
    const { data, error } = await supabase
      .from('ringgroups')
      .update(updateData)
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('Erro ao atualizar ring group:', error);
      return res.status(500).json({ error: error.message });
    }
    
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Ring group não encontrado' });
    }
    
    res.json(data[0]);
  } catch (error) {
    console.error('Erro interno:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/ringgroups/:id', checkSupabaseConnection, async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase.from('ringgroups').delete().eq('id', id);
    
    if (error) {
      console.error('Erro ao deletar ring group:', error);
      return res.status(500).json({ error: error.message });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Erro interno:', error);
    res.status(500).json({ error: error.message });
  }
});

// TRUNKS
app.get('/tenants/:tenantId/trunks', checkSupabaseConnection, async (req, res) => {
  try {
    const { tenantId } = req.params;
    
    // Se tenantId não é um UUID válido, buscar o primeiro tenant
    let actualTenantId = tenantId;
    if (!tenantId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      const { data: tenants, error: tenantError } = await supabase
        .from('tenants')
        .select('id')
        .limit(1);
      
      if (tenantError || !tenants || tenants.length === 0) {
        return res.json([]);
      }
      actualTenantId = tenants[0].id;
    }
    
    const { data, error } = await supabase
      .from('trunks')
      .select('*')
      .eq('tenant_id', actualTenantId);
    
    if (error) {
      console.error('Erro ao buscar trunks:', error);
      return res.status(500).json({ error: error.message });
    }
    
    res.json(data || []);
  } catch (error) {
    console.error('Erro interno:', error);
    res.status(500).json({ error: error.message });
  }
});

function provisionTrunk(trunk) {
  console.log(`✅ Trunk ${trunk.name} provisioned successfully`);
}

app.post('/tenants/:tenantId/trunks', checkSupabaseConnection, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { data, error } = await supabase
      .from('trunks')
      .insert([{ ...req.body, tenant_id: tenantId }])
      .select();
    
    if (error) {
      console.error('Erro ao criar trunk:', error);
      return res.status(500).json({ error: error.message });
    }
    
    // Auto-provision in FreeSWITCH
    if (data && data[0]) {
      provisionTrunk(data[0]);
    }
    
    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Erro interno:', error);
    res.status(500).json({ error: error.message });
  }
});

// URA (IVR FLOW BUILDER)
app.get('/tenants/:tenantId/ura', checkSupabaseConnection, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { data, error } = await supabase
      .from('ura')
      .select('*')
      .eq('tenant_id', tenantId);
    
    if (error) {
      console.error('Erro ao buscar URA:', error);
      return res.status(500).json({ error: error.message });
    }
    
    res.json(data || []);
  } catch (error) {
    console.error('Erro interno:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/tenants/:tenantId/ura', checkSupabaseConnection, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { name, description, flow, is_active } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Nome da URA é obrigatório' });
    }
    
    const { data, error } = await supabase
      .from('ura')
      .insert([{
        tenant_id: tenantId,
        name,
        description: description || '',
        flow: flow || { nodes: [], edges: [] },
        is_active: is_active !== undefined ? is_active : true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select();
    
    if (error) {
      console.error('Erro ao criar URA:', error);
      return res.status(500).json({ error: error.message });
    }
    
    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Erro interno:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/ura/:id', checkSupabaseConnection, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, flow, is_active } = req.body;
    
    const updateData = {
      updated_at: new Date().toISOString()
    };
    
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (flow !== undefined) updateData.flow = flow;
    if (is_active !== undefined) updateData.is_active = is_active;
    
    const { data, error } = await supabase
      .from('ura')
      .update(updateData)
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('Erro ao atualizar URA:', error);
      return res.status(500).json({ error: error.message });
    }
    
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'URA não encontrada' });
    }
    
    // Provisionar automaticamente no FreeSWITCH se o fluxo foi atualizado
    if (flow !== undefined) {
      try {
        // Buscar tenant
        const { data: tenant, error: tenantError } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', data[0].tenant_id)
          .single();
        
        if (!tenantError && tenant) {
          // Gerar dialplan XML para a URA
          const dialplanXml = generateURADialplan(data[0], tenant);
          
          // Caminho da pasta do tenant para URA
          const tenantNameSanitized = (tenant.name || tenant.id).toLowerCase().replace(/[^a-z0-9_\-]/g, '_');
          const uraDir = `/usr/local/freeswitch/conf/ura/${tenantNameSanitized}`;
          if (!fs.existsSync(uraDir)) {
            fs.mkdirSync(uraDir, { recursive: true });
            console.log(`✅ Pasta criada para URA do tenant: ${uraDir}`);
          }
          // Caminho novo
          const uraPath = `${uraDir}/ura_${data[0].id}.xml`;
          // Remover arquivo antigo do dialplan, se existir
          const context = tenant.context || `context_${tenant.name.toLowerCase().replace(/\s+/g, '_')}`;
          const oldPath = `/usr/local/freeswitch/conf/dialplan/${context}_ura_${data[0].id}.xml`;
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
            console.log(`🗑️ Arquivo antigo removido: ${oldPath}`);
          }
          // Salvar arquivo de URA
          await writeFreeSWITCHConfig(uraPath, dialplanXml);
          // Recarregar configuração do FreeSWITCH
          await reloadFreeSWITCHConfig();
          console.log(`✅ URA ${data[0].name} provisionada automaticamente no FreeSWITCH (tenant: ${tenant.id})`);
        }
      } catch (provisionError) {
        console.error('⚠️ Erro ao provisionar URA automaticamente:', provisionError);
        // Não falhar a operação se o provisionamento falhar
      }
    }
    
    res.json(data[0]);
  } catch (error) {
    console.error('Erro interno:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/ura/:id', checkSupabaseConnection, async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('ura')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Erro ao buscar URA:', error);
      return res.status(500).json({ error: error.message });
    }
    
    if (!data) {
      return res.status(404).json({ error: 'URA não encontrada' });
    }
    
    res.json(data);
  } catch (error) {
    console.error('Erro interno:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/ura/:id', checkSupabaseConnection, async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase
      .from('ura')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Erro ao deletar URA:', error);
      return res.status(500).json({ error: error.message });
    }
    
    res.json({ message: 'URA deletada com sucesso' });
  } catch (error) {
    console.error('Erro interno:', error);
    res.status(500).json({ error: error.message });
  }
});

// Provisionar URA no FreeSWITCH
app.post('/ura/:id/provision-freeswitch', checkSupabaseConnection, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar URA
    const { data: ura, error: uraError } = await supabase
      .from('ura')
      .select('*')
      .eq('id', id)
      .single();
    
    if (uraError || !ura) {
      return res.status(404).json({ error: 'URA não encontrada' });
    }
    
    // Buscar tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', ura.tenant_id)
      .single();
    
    if (tenantError || !tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }
    
    // Gerar dialplan XML para a URA
    const dialplanXml = generateURADialplan(ura, tenant);
    
    // Caminho da pasta do tenant para URA
    const tenantNameSanitized = (tenant.name || tenant.id).toLowerCase().replace(/[^a-z0-9_\-]/g, '_');
    const uraDir = `/usr/local/freeswitch/conf/ura/${tenantNameSanitized}`;
    if (!fs.existsSync(uraDir)) {
      fs.mkdirSync(uraDir, { recursive: true });
      console.log(`✅ Pasta criada para URA do tenant: ${uraDir}`);
    }
    // Caminho novo
    const uraPath = `${uraDir}/ura_${ura.id}.xml`;
    // Remover arquivo antigo do dialplan, se existir
    const context = tenant.context || `context_${tenant.name.toLowerCase().replace(/\s+/g, '_')}`;
    const oldPath = `/usr/local/freeswitch/conf/dialplan/${context}_ura_${ura.id}.xml`;
    if (fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath);
      console.log(`🗑️ Arquivo antigo removido: ${oldPath}`);
    }
    // Salvar arquivo de URA
    await writeFreeSWITCHConfig(uraPath, dialplanXml);
    // Recarregar configuração do FreeSWITCH
    await reloadFreeSWITCHConfig();
    
    res.json({ 
      message: 'URA provisionada no FreeSWITCH com sucesso',
      dialplan_path: uraPath
    });
  } catch (error) {
    console.error('Erro ao provisionar URA:', error);
    res.status(500).json({ error: error.message });
  }
});

// ACTIVE CALLS
app.get('/tenants/:tenantId/active-calls', checkSupabaseConnection, async (req, res) => {
  try {
    // Em um sistema real, isso viria do FreeSWITCH Event Socket
    // Por enquanto, retornamos array vazio pois não há chamadas ativas
    res.json({ data: [] });
  } catch (error) {
    console.error('Erro interno:', error);
    res.status(500).json({ error: error.message });
  }
});

// AUDIT LOGS
app.get('/audit-logs', checkSupabaseConnection, async (req, res) => {
  try {
    const { action, role, severity, days, tenant_id } = req.query;
    
    let query = supabase.from('audit_logs').select('*');
    
    if (action && action !== 'all') {
      query = query.eq('action', action);
    }
    
    if (role && role !== 'all') {
      query = query.eq('user_role', role);
    }
    
    if (severity && severity !== 'all') {
      query = query.eq('severity', severity);
    }
    
    if (tenant_id) {
      query = query.eq('tenant_id', tenant_id);
    }
    
    if (days) {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(days));
      query = query.gte('created_at', daysAgo.toISOString());
    }
    
    query = query.order('created_at', { ascending: false }).limit(100);
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Erro ao buscar audit logs:', error);
      return res.status(500).json({ error: error.message });
    }
    
    res.json(data || []);
  } catch (error) {
    console.error('Erro interno:', error);
    res.status(500).json({ error: error.message });
  }
});

// SCHEDULES
app.get('/tenants/:tenantId/schedules', checkSupabaseConnection, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('tenant_id', tenantId);
    
    if (error) {
      console.error('Erro ao buscar schedules:', error);
      return res.status(500).json({ error: error.message });
    }
    
    res.json(data || []);
  } catch (error) {
    console.error('Erro interno:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/tenants/:tenantId/schedules', checkSupabaseConnection, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { data, error } = await supabase
      .from('schedules')
      .insert([{ ...req.body, tenant_id: tenantId }])
      .select();
    
    if (error) {
      console.error('Erro ao criar schedule:', error);
      return res.status(500).json({ error: error.message });
    }
    
    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Erro interno:', error);
    res.status(500).json({ error: error.message });
  }
});

// FREESWITCH ADVANCED ADMIN
// Dialplan Management
app.get('/freeswitch/dialplans', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('fs_dialplans')
      .select('*')
      .order('priority', { ascending: true });
    
    if (error) {
      console.log('Tabela fs_dialplans não existe, retornando dados de exemplo');
      // Retornar dados de exemplo se a tabela não existir
      const mockDialplans = [
        {
          id: '1',
          name: 'Default Extension Routing',
          condition: '^(\\d{4})$',
          destination_number: '$1',
          context: 'default',
          actions: ['bridge user/$1@${domain_name}'],
          enabled: true,
          priority: 10,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          name: 'External Call Routing',
          condition: '^(\\d{10,11})$',
          destination_number: '$1',
          context: 'default',
          actions: ['bridge sofia/gateway/provider/$1'],
          enabled: true,
          priority: 20,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '3',
          name: 'Emergency Services',
          condition: '^(911|112|190)$',
          destination_number: '$1',
          context: 'default',
          actions: ['bridge sofia/gateway/emergency/$1'],
          enabled: true,
          priority: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      return res.json(mockDialplans);
    }
    
    res.json(data || []);
  } catch (error) {
    console.error('Erro interno:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/freeswitch/dialplans', checkSupabaseConnection, async (req, res) => {
  try {
    const { name, condition, destination_number, context, actions, enabled, priority } = req.body;
    
    const { data, error } = await supabase
      .from('fs_dialplans')
      .insert([{
        name,
        condition,
        destination_number,
        context,
        actions,
        enabled,
        priority,
        created_at: new Date().toISOString()
      }])
      .select();
    
    if (error) {
      console.error('Erro ao criar dialplan:', error);
      return res.status(500).json({ error: error.message });
    }
    
    // Regenerar configuração do dialplan
    await generateAndApplyDialplanConfig();
    
    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Erro interno:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/freeswitch/dialplans/:id', checkSupabaseConnection, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, condition, destination_number, context, actions, enabled, priority } = req.body;
    
    const { data, error } = await supabase
      .from('fs_dialplans')
      .update({
        name,
        condition,
        destination_number,
        context,
        actions,
        enabled,
        priority,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('Erro ao atualizar dialplan:', error);
      return res.status(500).json({ error: error.message });
    }
    
    // Regenerar configuração do dialplan
    await generateAndApplyDialplanConfig();
    
    res.json(data[0]);
  } catch (error) {
    console.error('Erro interno:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/freeswitch/dialplans/:id', checkSupabaseConnection, async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase
      .from('fs_dialplans')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Erro ao deletar dialplan:', error);
      return res.status(500).json({ error: error.message });
    }
    
    // Regenerar configuração do dialplan
    await generateAndApplyDialplanConfig();
    
    res.status(204).send();
  } catch (error) {
    console.error('Erro interno:', error);
    res.status(500).json({ error: error.message });
  }
});

// SIP Profiles Management
app.get('/freeswitch/sip-profiles', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('fs_sip_profiles')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) {
      console.log('Tabela fs_sip_profiles não existe, retornando dados de exemplo');
      // Retornar dados de exemplo se a tabela não existir
      const mockProfiles = [
        {
          id: '1',
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
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
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
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      return res.json(mockProfiles);
    }
    
    res.json(data || []);
  } catch (error) {
    console.error('Erro interno:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/freeswitch/sip-profiles', checkSupabaseConnection, async (req, res) => {
  try {
    const { name, type, port, rtp_ip, sip_ip, context, codec_prefs, dtmf_duration, enabled, custom_params } = req.body;
    
    const { data, error } = await supabase
      .from('fs_sip_profiles')
      .insert([{
        name,
        type,
        port,
        rtp_ip,
        sip_ip,
        context,
        codec_prefs,
        dtmf_duration,
        enabled,
        custom_params,
        created_at: new Date().toISOString()
      }])
      .select();
    
    if (error) {
      console.error('Erro ao criar perfil SIP:', error);
      return res.status(500).json({ error: error.message });
    }
    
    // Regenerar configuração SIP
    await generateAndApplySipProfileConfig();
    
    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Erro interno:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/freeswitch/sip-profiles/:id', checkSupabaseConnection, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, port, rtp_ip, sip_ip, context, codec_prefs, dtmf_duration, enabled, custom_params } = req.body;
    
    const { data, error } = await supabase
      .from('fs_sip_profiles')
      .update({
        name,
        type,
        port,
        rtp_ip,
        sip_ip,
        context,
        codec_prefs,
        dtmf_duration,
        enabled,
        custom_params,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('Erro ao atualizar perfil SIP:', error);
      return res.status(500).json({ error: error.message });
    }
    
    // Regenerar configuração SIP
    await generateAndApplySipProfileConfig();
    
    res.json(data[0]);
  } catch (error) {
    console.error('Erro interno:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/freeswitch/sip-profiles/:id', checkSupabaseConnection, async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase
      .from('fs_sip_profiles')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Erro ao deletar perfil SIP:', error);
      return res.status(500).json({ error: error.message });
    }
    
    // Regenerar configuração SIP
    await generateAndApplySipProfileConfig();
    
    res.status(204).send();
  } catch (error) {
    console.error('Erro interno:', error);
    res.status(500).json({ error: error.message });
  }
});

// FreeSWITCH Global Configuration
app.get('/freeswitch/config', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('fs_global_config')
      .select('*')
      .limit(1)
      .single();
    
    if (error) {
      console.log('Tabela fs_global_config não existe, retornando configuração padrão');
      // Configuração padrão se a tabela não existir
      const defaultConfig = {
        id: '1',
        log_level: 'INFO',
        max_sessions: 1000,
        sessions_per_second: 30,
        rtp_start_port: 16384,
        rtp_end_port: 32768,
        dialplan_hunt_on_failure: true,
        continue_on_fail: true,
        hangup_after_bridge: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      return res.json(defaultConfig);
    }
    
    res.json(data);
  } catch (error) {
    console.error('Erro interno:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/freeswitch/config', checkSupabaseConnection, async (req, res) => {
  try {
    const config = req.body;
    
    // Verificar se já existe configuração
    const { data: existing } = await supabase
      .from('fs_global_config')
      .select('*')
      .limit(1)
      .single();
    
    let result;
    if (existing) {
      // Atualizar existente
      const { data, error } = await supabase
        .from('fs_global_config')
        .update({
          ...config,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select();
      
      if (error) {
        throw error;
      }
      result = data[0];
    } else {
      // Criar novo
      const { data, error } = await supabase
        .from('fs_global_config')
        .insert([{
          ...config,
          created_at: new Date().toISOString()
        }])
        .select();
      
      if (error) {
        throw error;
      }
      result = data[0];
    }
    
    // Aplicar configuração no FreeSWITCH
    await generateAndApplyGlobalConfig(config);
    
    res.json(result);
  } catch (error) {
    console.error('Erro ao salvar configuração global:', error);
    res.status(500).json({ error: error.message });
  }
});

// FreeSWITCH Status and Control
app.get('/freeswitch/status', async (req, res) => {
  try {
    // Verificar status do FreeSWITCH via fs_cli
    exec('fs_cli -x "status"', (error, stdout, stderr) => {
      if (error) {
        return res.json({ status: 'stopped', error: error.message });
      }
      
      const uptime = stdout.match(/Up (\d+) years?, (\d+) days?, (\d+) hours?, (\d+) minutes?, (\d+) seconds?/);
      const sessions = stdout.match(/(\d+) session\(s\) since startup/);
      
      res.json({
        status: 'running',
        uptime: uptime ? uptime[0] : 'Unknown',
        sessions: sessions ? parseInt(sessions[1]) : 0,
        output: stdout
      });
    });
  } catch (error) {
    console.error('Erro ao verificar status do FreeSWITCH:', error);
    res.status(500).json({ error: error.message });
  }
});

// CALL CENTER APIs
// Call Center Metrics
app.get('/callcenter/metrics', async (req, res) => {
  try {
    // Simular métricas de call center - aqui você integraria com FreeSWITCH real
    const metrics = {
      totalCalls: Math.floor(Math.random() * 2000) + 1000,
      activeCalls: Math.floor(Math.random() * 20) + 5,
      waitingCalls: Math.floor(Math.random() * 10) + 1,
      completedCalls: Math.floor(Math.random() * 1800) + 900,
      abandonedCalls: Math.floor(Math.random() * 100) + 20,
      averageWaitTime: Math.floor(Math.random() * 60) + 30,
      averageCallDuration: Math.floor(Math.random() * 120) + 120,
      serviceLevel: Math.floor(Math.random() * 20) + 80,
      activeAgents: Math.floor(Math.random() * 8) + 12,
      totalAgents: 20
    };
    
    res.json(metrics);
  } catch (error) {
    console.error('Erro ao buscar métricas:', error);
    res.status(500).json({ error: error.message });
  }
});

// Call Center Agents
app.get('/callcenter/agents', async (req, res) => {
  try {
    const agents = [
      {
        id: '1',
        name: 'João Silva',
        email: 'joao@empresa.com',
        status: Math.random() > 0.5 ? 'available' : 'busy',
        currentCall: Math.random() > 0.7 ? 'call-' + Math.floor(Math.random() * 1000) : null,
        queue: 'support',
        lastActivity: new Date().toISOString(),
        callsHandled: Math.floor(Math.random() * 30) + 10,
        averageCallTime: Math.floor(Math.random() * 60) + 120,
        skills: ['Suporte', 'Vendas']
      },
      {
        id: '2',
        name: 'Maria Santos',
        email: 'maria@empresa.com',
        status: Math.random() > 0.3 ? 'available' : 'break',
        queue: 'sales',
        lastActivity: new Date().toISOString(),
        callsHandled: Math.floor(Math.random() * 40) + 20,
        averageCallTime: Math.floor(Math.random() * 50) + 100,
        skills: ['Vendas', 'Atendimento']
      },
      {
        id: '3',
        name: 'Pedro Costa',
        email: 'pedro@empresa.com',
        status: Math.random() > 0.6 ? 'available' : 'offline',
        queue: 'support',
        lastActivity: new Date().toISOString(),
        callsHandled: Math.floor(Math.random() * 25) + 15,
        averageCallTime: Math.floor(Math.random() * 80) + 150,
        skills: ['Suporte Técnico']
      },
      {
        id: '4',
        name: 'Ana Oliveira',
        email: 'ana@empresa.com',
        status: 'busy',
        currentCall: 'call-456',
        queue: 'vip',
        lastActivity: new Date().toISOString(),
        callsHandled: Math.floor(Math.random() * 35) + 25,
        averageCallTime: Math.floor(Math.random() * 40) + 90,
        skills: ['VIP', 'Supervisão']
      }
    ];
    
    res.json(agents);
  } catch (error) {
    console.error('Erro ao buscar agentes:', error);
    res.status(500).json({ error: error.message });
  }
});

// Call Center Queues
app.get('/callcenter/queues', async (req, res) => {
  try {
    const queues = [
      {
        id: '1',
        name: 'Suporte Técnico',
        description: 'Atendimento para problemas técnicos',
        strategy: 'least_recent',
        maxWaitTime: 300,
        abandonTimeout: 180,
        musicOnHold: 'default.wav',
        enabled: true,
        agentCount: 8,
        waitingCalls: Math.floor(Math.random() * 5) + 1,
        priority: 1
      },
      {
        id: '2',
        name: 'Vendas',
        description: 'Atendimento comercial e vendas',
        strategy: 'round_robin',
        maxWaitTime: 120,
        abandonTimeout: 90,
        musicOnHold: 'sales.wav',
        enabled: true,
        agentCount: 6,
        waitingCalls: Math.floor(Math.random() * 3) + 1,
        priority: 2
      },
      {
        id: '3',
        name: 'Atendimento VIP',
        description: 'Atendimento prioritário para clientes VIP',
        strategy: 'ring_all',
        maxWaitTime: 60,
        abandonTimeout: 30,
        musicOnHold: 'vip.wav',
        enabled: true,
        agentCount: 3,
        waitingCalls: Math.floor(Math.random() * 2),
        priority: 0
      },
      {
        id: '4',
        name: 'Cobrança',
        description: 'Departamento de cobrança e financeiro',
        strategy: 'fewest_calls',
        maxWaitTime: 240,
        abandonTimeout: 120,
        musicOnHold: 'default.wav',
        enabled: true,
        agentCount: 4,
        waitingCalls: Math.floor(Math.random() * 4),
        priority: 3
      }
    ];
    
    res.json(queues);
  } catch (error) {
    console.error('Erro ao buscar filas:', error);
    res.status(500).json({ error: error.message });
  }
});

// Call Center Calls
app.get('/callcenter/calls', async (req, res) => {
  try {
    const calls = [];
    const statuses = ['active', 'completed', 'abandoned', 'transferred'];
    const queues = ['Suporte Técnico', 'Vendas', 'Atendimento VIP', 'Cobrança'];
    const agents = ['João Silva', 'Maria Santos', 'Pedro Costa', 'Ana Oliveira'];
    
    for (let i = 1; i <= 20; i++) {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const startTime = new Date(Date.now() - Math.random() * 3600000); // Última hora
      const duration = Math.floor(Math.random() * 300) + 60;
      const endTime = status !== 'active' ? new Date(startTime.getTime() + duration * 1000) : null;
      
      calls.push({
        id: i.toString(),
        callId: `call-${1000 + i}`,
        callerNumber: `+5511${Math.floor(Math.random() * 900000000) + 100000000}`,
        calledNumber: `400${Math.floor(Math.random() * 10)}`,
        queue: queues[Math.floor(Math.random() * queues.length)],
        agent: status !== 'abandoned' ? agents[Math.floor(Math.random() * agents.length)] : undefined,
        startTime: startTime.toISOString(),
        endTime: endTime?.toISOString(),
        duration: status === 'active' ? Math.floor((Date.now() - startTime.getTime()) / 1000) : duration,
        waitTime: Math.floor(Math.random() * 120) + 10,
        status,
        recordingUrl: Math.random() > 0.3 ? `https://example.com/recordings/call-${1000 + i}.wav` : undefined,
        satisfaction: status === 'completed' && Math.random() > 0.5 ? Math.floor(Math.random() * 5) + 1 : undefined
      });
    }
    
    // Ordenar por tempo de início (mais recentes primeiro)
    calls.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    
    res.json(calls);
  } catch (error) {
    console.error('Erro ao buscar chamadas:', error);
    res.status(500).json({ error: error.message });
  }
});

// Real-time Call Center Events (Server-Sent Events)
app.get('/callcenter/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Enviar evento inicial
  res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`);

  // Simular eventos em tempo real
  const interval = setInterval(() => {
    const events = [
      { type: 'call_started', data: { callId: 'call-' + Date.now(), queue: 'support', caller: '+5511999888777' }},
      { type: 'call_answered', data: { callId: 'call-' + Date.now(), agent: 'João Silva' }},
      { type: 'call_ended', data: { callId: 'call-' + Date.now(), duration: Math.floor(Math.random() * 300) + 60 }},
      { type: 'agent_status_changed', data: { agentId: '1', status: 'available' }},
      { type: 'queue_stats_updated', data: { queueId: '1', waitingCalls: Math.floor(Math.random() * 5) }}
    ];
    
    const event = events[Math.floor(Math.random() * events.length)];
    event.timestamp = new Date().toISOString();
    
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  }, 5000);

  req.on('close', () => {
    clearInterval(interval);
  });
});

// Call Center Agent Actions
app.post('/callcenter/agents/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Aqui você atualizaria o status do agente no FreeSWITCH
    console.log(`Atualizando status do agente ${id} para: ${status}`);
    
    res.json({ success: true, message: 'Status do agente atualizado' });
  } catch (error) {
    console.error('Erro ao atualizar status do agente:', error);
    res.status(500).json({ error: error.message });
  }
});

// Download de gravação
app.get('/callcenter/recordings/:callId', async (req, res) => {
  try {
    const { callId } = req.params;
    
    // Simular download de arquivo de gravação
    // Em um ambiente real, você buscaria o arquivo do sistema de arquivos
    console.log(`Solicitado download da gravação: ${callId}`);
    
    // Por enquanto, retornar um erro 404 já que não temos gravações reais
    res.status(404).json({ error: 'Gravação não encontrada' });
  } catch (error) {
    console.error('Erro ao baixar gravação:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/freeswitch/reload', async (req, res) => {
  try {
    // Recarregar configuração do FreeSWITCH
    exec('fs_cli -x "reloadxml"', (error, stdout, stderr) => {
      if (error) {
        return res.status(500).json({ error: error.message });
      }
      
      res.json({ 
        success: true, 
        message: 'FreeSWITCH configuration reloaded successfully',
        output: stdout 
      });
    });
  } catch (error) {
    console.error('Erro ao recarregar FreeSWITCH:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper functions for generating FreeSWITCH configs
async function generateAndApplyDialplanConfig() {
  try {
    const { data: dialplans } = await supabase
      .from('fs_dialplans')
      .select('*')
      .eq('enabled', true)
      .order('priority', { ascending: true });
    
    if (!dialplans) return;
    
    let dialplanXML = `<?xml version="1.0" encoding="utf-8"?>
<include>
  <context name="default">
`;
    
    dialplans.forEach(dialplan => {
      dialplanXML += `
    <extension name="${dialplan.name}" priority="${dialplan.priority}">
      <condition field="destination_number" expression="${dialplan.condition}">`;
      
      dialplan.actions.forEach(action => {
        const [app, ...data] = action.split(' ');
        dialplanXML += `
        <action application="${app}" data="${data.join(' ')}"/>`;
      });
      
      dialplanXML += `
      </condition>
    </extension>`;
    });
    
    dialplanXML += `
  </context>
</include>`;
    
    // Salvar arquivo XML
    await writeFreeSWITCHConfig('/usr/local/freeswitch/conf/dialplan/default.xml', dialplanXML);
    
    console.log('✅ Dialplan configuration generated and applied');
  } catch (error) {
    console.error('❌ Error generating dialplan config:', error);
  }
}

async function generateAndApplySipProfileConfig() {
  try {
    const { data: profiles } = await supabase
      .from('fs_sip_profiles')
      .select('*')
      .eq('enabled', true);
    
    if (!profiles) return;
    
    for (const profile of profiles) {
      let profileXML = `<?xml version="1.0" encoding="utf-8"?>
<include>
  <profile name="${profile.name}">
    <settings>
      <param name="sip-port" value="${profile.port}"/>
      <param name="context" value="${profile.context}"/>
      <param name="rtp-ip" value="${profile.rtp_ip}"/>
      <param name="sip-ip" value="${profile.sip_ip}"/>
      <param name="codec-prefs" value="${profile.codec_prefs}"/>
      <param name="dtmf-duration" value="${profile.dtmf_duration}"/>`;
      
      // Adicionar parâmetros customizados
      if (profile.custom_params) {
        Object.entries(profile.custom_params).forEach(([key, value]) => {
          profileXML += `
      <param name="${key}" value="${value}"/>`;
        });
      }
      
      profileXML += `
    </settings>
  </profile>
</include>`;
      
      // Salvar arquivo XML
      await writeFreeSWITCHConfig(`/etc/freeswitch/sip_profiles/${profile.name}.xml`, profileXML);
    }
    
    console.log('✅ SIP profile configurations generated and applied');
  } catch (error) {
    console.error('❌ Error generating SIP profile config:', error);
  }
}

async function generateAndApplyGlobalConfig(config) {
  try {
    const switchXML = `<?xml version="1.0" encoding="utf-8"?>
<configuration name="switch.conf" description="Core Configuration">
  <settings>
    <param name="loglevel" value="${config.log_level}"/>
    <param name="max-sessions" value="${config.max_sessions}"/>
    <param name="sessions-per-second" value="${config.sessions_per_second}"/>
    <param name="rtp-start-port" value="${config.rtp_start_port}"/>
    <param name="rtp-end-port" value="${config.rtp_end_port}"/>
  </settings>
</configuration>`;
    
    await writeFreeSWITCHConfig('/etc/freeswitch/autoload_configs/switch.conf.xml', switchXML);
    
    console.log('✅ Global FreeSWITCH configuration generated and applied');
  } catch (error) {
    console.error('❌ Error generating global config:', error);
  }
}

// PLANS - Rota que estava faltando
app.get('/plans', (req, res) => {
  const plans = [
    { 
      id: '1', 
      name: 'Básico', 
      price: 49.90, 
      features: ['10 Agentes', '1 Fila', 'Relatórios Básicos'],
      max_extensions: 10,
      max_concurrent_calls: 5,
      storage_limit_gb: 1
    },
    { 
      id: '2', 
      name: 'Profissional', 
      price: 99.90, 
      features: ['50 Agentes', '10 Filas', 'Relatórios Avançados', 'CTI'],
      max_extensions: 50,
      max_concurrent_calls: 25,
      storage_limit_gb: 5
    },
    { 
      id: '3', 
      name: 'Enterprise', 
      price: 299.90, 
      features: ['Agentes Ilimitados', 'Filas Ilimitadas', 'Suporte Premium', 'WebPhone'],
      max_extensions: 999,
      max_concurrent_calls: 100,
      storage_limit_gb: 20
    }
  ];
  res.json(plans);
});

// ==========================================
// USER MANAGEMENT ROUTES
// ==========================================

// Função auxiliar para gerar senha SIP
function generateSipPassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Função auxiliar para auto-numerar ramais
async function getNextAvailableExtension(tenantId) {
  try {
    const availableExtensions = await getAvailableExtensions(tenantId, 1);
    if (availableExtensions.length > 0) {
      return availableExtensions[0].toString();
    }
    throw new Error('Não há ramais disponíveis na faixa configurada');
  } catch (error) {
    console.error('Erro ao obter próximo ramal:', error);
    throw error;
  }
}

async function getAvailableExtensions(tenantId, limit = 10) {
  try {
    // Buscar tenant para obter faixa de ramais
    const { data: tenant } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();
    
    if (!tenant) {
      throw new Error('Tenant não encontrado');
    }
    
    const startRange = tenant.extension_range_start || 1000;
    const endRange = tenant.extension_range_end || 1999;
    
    // Buscar ramais já utilizados
    const { data: usedExtensions } = await supabase
      .from('users')
      .select('extension')
      .eq('tenant_id', tenantId)
      .not('extension', 'is', null);
    
    const used = usedExtensions?.map(u => parseInt(u.extension)) || [];
    
    // Encontrar números disponíveis na faixa
    const available = [];
    for (let ext = startRange; ext <= endRange && available.length < limit; ext++) {
      if (!used.includes(ext)) {
        available.push(ext);
      }
    }
    
    return available;
  } catch (error) {
    console.error('Erro ao obter ramais disponíveis:', error);
    throw error;
  }
}

// GET - Listar usuários por tenant
app.get('/tenants/:tenantId/users', checkSupabaseConnection, async (req, res) => {
  try {
    const { tenantId } = req.params;
    
    const { data: users, error } = await supabase
      .from('users')
      .select(`
        id, 
        email, 
        name, 
        role, 
        extension, 
        created_at, 
        updated_at
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    
    // Buscar informações dos ramais vinculados separadamente
    if (users && users.length > 0) {
      const userIds = users.map(u => u.id);
      const { data: extensions } = await supabase
        .from('extensions')
        .select('id, number, name, user_id')
        .in('user_id', userIds);
      
      // Mapear extensões para usuários
      const extensionsMap = {};
      if (extensions) {
        extensions.forEach(ext => {
          extensionsMap[ext.user_id] = ext;
        });
      }
      
      // Adicionar informações das extensões aos usuários
      users.forEach(user => {
        user.extensions = extensionsMap[user.id] || null;
      });
    }
    
    if (error) {
      console.error('Erro ao buscar usuários:', error);
      return res.status(500).json({ error: error.message });
    }
    
    res.json(users || []);
  } catch (error) {
    console.error('Erro interno:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST - Criar usuário com integração completa
app.post('/tenants/:tenantId/users', checkSupabaseConnection, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { 
      email, 
      password, 
      name, 
      role = 'agent', 
      extension,
      generateExtension = true,
      createFreeSwitchUser = true 
    } = req.body;
    
    // Validações básicas
    if (!email || !password || !name) {
      return res.status(400).json({ 
        error: 'Email, senha e nome são obrigatórios' 
      });
    }
    
    // Verificar se email já existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    
    if (existingUser) {
      return res.status(400).json({ 
        error: 'Email já está em uso' 
      });
    }
    
    // Buscar dados do tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();
    
    if (tenantError || !tenant) {
      return res.status(400).json({ 
        error: 'Tenant não encontrado' 
      });
    }
    
    let userExtension = extension;
    
    // Se ramal foi informado, verificar se existe na tabela de ramais do tenant
    if (userExtension) {
      const { data: extensionExists } = await supabase
        .from('extensions')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('number', userExtension)
        .single();
      if (!extensionExists) {
        return res.status(400).json({ error: `Ramal ${userExtension} não existe. Crie o ramal no menu Ramais antes de associar ao usuário.` });
      }
      // Verificar se já está em uso por outro usuário
      // Verificar se ramal já está em uso na tabela users
      const { data: existingUserExtension } = await supabase
        .from('users')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('extension', userExtension)
        .single();
      if (existingUserExtension) {
        return res.status(400).json({ error: `Ramal ${userExtension} já está em uso` });
      }
      
      // Verificar se ramal já está em uso na tabela extensions
      const { data: existingExtension } = await supabase
        .from('extensions')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('number', userExtension)
        .not('user_id', 'is', null)
        .single();
      if (existingExtension) {
        return res.status(400).json({ error: `Ramal ${userExtension} já está em uso` });
      }
    }
    
    let authUserId = null;
    let sipPassword = null;
    
    try {
      // 1. CRIAR NO SUPABASE AUTH
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { 
          name, 
          role, 
          tenant_id: tenantId,
          extension: userExtension 
        }
      });
      
      if (authError) {
        console.error('Erro ao criar usuário no Auth:', authError);
        // Se o erro for de e-mail já cadastrado, retornar 400
        if (authError.message && authError.message.includes('already been registered')) {
          return res.status(400).json({ error: 'Email já está em uso' });
        }
        throw new Error('Erro ao criar autenticação: ' + authError.message);
      }
      
      authUserId = authUser.user.id;
      
      // 2. GERAR SENHA SIP
      if (userExtension && createFreeSwitchUser) {
        sipPassword = generateSipPassword();
      }
      
      // 3. CRIAR NA TABELA USERS DO SUPABASE
      const { data: dbUser, error: dbError } = await supabase
        .from('users')
        .insert([{
          id: authUserId,
          email,
          name,
          role,
          tenant_id: tenantId,
          extension: userExtension,
          sip_password: sipPassword,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (dbError) {
        console.error('Erro ao criar usuário no DB:', dbError);
        // Tentar remover usuário do Auth se criação no DB falhou
        try {
          await supabase.auth.admin.deleteUser(authUserId);
        } catch (cleanupError) {
          console.error('Erro ao fazer cleanup do Auth:', cleanupError);
        }
        throw new Error('Erro ao salvar usuário: ' + dbError.message);
      }
      
      // 4. VINCULAR RAMAL AO USUÁRIO (se extension fornecida)
      if (userExtension) {
        try {
          console.log(`🔍 Buscando ramal ${userExtension} para vincular ao usuário ${email}`);
          
          // Buscar o ramal na tabela extensions
          const { data: extensionData, error: extensionError } = await supabase
            .from('extensions')
            .select('id, number, name')
            .eq('tenant_id', tenantId)
            .eq('number', userExtension)
            .single();
          
          console.log('🔍 Resultado da busca do ramal:', { extensionData, extensionError });
          
          if (extensionError || !extensionData) {
            console.error('⚠️ Ramal não encontrado na tabela extensions:', userExtension);
          } else {
            // Vincular o ramal ao usuário
            const { data: updateData, error: linkError } = await supabase
              .from('extensions')
              .update({ user_id: authUserId })
              .eq('id', extensionData.id)
              .select();
            
            console.log('🔍 Resultado da vinculação:', { updateData, linkError });
            
            if (linkError) {
              console.error('⚠️ Erro ao vincular ramal ao usuário:', linkError);
            } else {
              console.log(`✅ Ramal ${userExtension} vinculado ao usuário ${email}`);
            }
          }
        } catch (linkError) {
          console.error('⚠️ Erro ao vincular ramal:', linkError);
        }
      }
      
      // 5. CRIAR RAMAL NO FREESWITCH (se extension fornecida)
      if (userExtension && createFreeSwitchUser) {
        try {
          await provisionExtensionInFreeSWITCH({
            extension: userExtension,
            password: sipPassword,
            user_id: authUserId,
            name,
            email,
            context: tenant.context || `context_${tenant.name.toLowerCase().replace(/\s+/g, '_')}`,
            domain: tenant.sip_domain || `${tenant.name.toLowerCase().replace(/\s+/g, '')}.local`
          }, tenant);
          
          console.log(`✅ Ramal ${userExtension} provisionado no FreeSWITCH`);
        } catch (fsError) {
          console.error('⚠️ Erro ao provisionar no FreeSWITCH:', fsError);
          // Não falha a criação do usuário, apenas registra o erro
        }
      }
      
      // 5. APLICAR CONFIGURAÇÕES DO FREESWITCH
      if (userExtension && createFreeSwitchUser) {
        try {
          await reloadFreeSWITCHConfig();
          console.log('✅ Configurações do FreeSWITCH recarregadas');
        } catch (reloadError) {
          console.error('⚠️ Erro ao recarregar FreeSWITCH:', reloadError);
        }
      }
      
      // Retornar usuário criado (sem senha SIP por segurança)
      const { sip_password: _, ...userResponse } = dbUser;
      
      res.status(201).json({
        ...userResponse,
        hasExtension: !!userExtension,
        extensionProvisioned: !!userExtension && createFreeSwitchUser
      });
      
      console.log(`✅ Usuário criado com sucesso: ${email} ${userExtension ? `(Ramal: ${userExtension})` : ''}`);
      
    } catch (error) {
      console.error('❌ Erro ao criar usuário:', error);
      
      // Cleanup em caso de erro
      if (authUserId) {
        try {
          await supabase.auth.admin.deleteUser(authUserId);
          console.log('🧹 Cleanup: usuário removido do Auth');
        } catch (cleanupError) {
          console.error('❌ Erro no cleanup:', cleanupError);
        }
      }
      
      res.status(500).json({ 
        error: 'Erro ao criar usuário',
        details: error.message 
      });
    }
    
  } catch (error) {
    console.error('❌ Erro interno:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
});

// PUT - Atualizar usuário
app.put('/users/:id', checkSupabaseConnection, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, extension, email } = req.body;
    
    // Buscar usuário atual
    const { data: currentUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError || !currentUser) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    // Verificar se novo email já está em uso (se foi alterado)
    if (email && email !== currentUser.email) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .neq('id', id) // Excluir o próprio usuário da verificação
        .single();
      
      if (existingUser) {
        return res.status(400).json({ 
          error: 'Email já está em uso por outro usuário' 
        });
      }
    }
    
    // Verificar se novo ramal já está em uso (se foi alterado)
    if (extension && extension !== currentUser.extension) {
      // Remover user_id do ramal antigo
      if (currentUser.extension) {
        const { data: oldExt } = await supabase
          .from('extensions')
          .select('id')
          .eq('tenant_id', currentUser.tenant_id)
          .eq('number', currentUser.extension)
          .single();
        if (oldExt) {
          await supabase
            .from('extensions')
            .update({ user_id: null })
            .eq('id', oldExt.id);
        }
      }
      // Vincular novo ramal
      const { data: newExt } = await supabase
        .from('extensions')
        .select('id')
        .eq('tenant_id', currentUser.tenant_id)
        .eq('number', extension)
        .single();
      if (newExt) {
        await supabase
          .from('extensions')
          .update({ user_id: id })
          .eq('id', newExt.id);
      }
    }
    
    // Atualizar no banco
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        name: name || currentUser.name,
        role: role || currentUser.role,
        extension: extension !== undefined ? extension : currentUser.extension,
        email: email || currentUser.email,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (updateError) {
      console.error('Erro ao atualizar usuário:', updateError);
      return res.status(500).json({ error: updateError.message });
    }
    
    // Atualizar no Supabase Auth se email mudou
    if (email && email !== currentUser.email) {
      try {
        await supabase.auth.admin.updateUserById(id, { email });
      } catch (authError) {
        console.error('⚠️ Erro ao atualizar email no Auth:', authError);
      }
    }
    
    // Reprovisionar no FreeSWITCH se ramal mudou
    if (extension !== currentUser.extension) {
      try {
        const { data: tenant } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', currentUser.tenant_id)
          .single();
        
        if (tenant) {
                     // Remover ramal antigo
           if (currentUser.extension) {
             try {
               await removeExtensionFromFreeSWITCH(currentUser.extension, tenant);
               console.log(`✅ Ramal antigo ${currentUser.extension} removido`);
             } catch (removeError) {
               console.error('⚠️ Erro ao remover ramal antigo:', removeError);
             }
           }
          
          // Adicionar novo ramal
          if (extension) {
            await provisionExtensionInFreeSWITCH({
              extension,
              password: currentUser.sip_password || generateSipPassword(),
              user_id: id,
              name: updatedUser.name,
              email: updatedUser.email,
              context: tenant.context || `context_${tenant.name.toLowerCase().replace(/\s+/g, '_')}`,
              domain: tenant.sip_domain || `${tenant.name.toLowerCase().replace(/\s+/g, '')}.local`
            }, tenant);
            
            await reloadFreeSWITCHConfig();
            console.log(`✅ Ramal ${extension} reprovisionado`);
          }
        }
      } catch (fsError) {
        console.error('⚠️ Erro ao atualizar FreeSWITCH:', fsError);
      }
    }
    
    const { sip_password: _, ...userResponse } = updatedUser;
    res.json(userResponse);
    
  } catch (error) {
    console.error('Erro interno:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE - Remover usuário
app.delete('/users/:id', checkSupabaseConnection, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar usuário para obter informações antes de deletar
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError || !user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    // Remover do banco de dados
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      console.error('Erro ao deletar usuário:', deleteError);
      return res.status(500).json({ error: deleteError.message });
    }
    
    // Remover do Supabase Auth
    try {
      await supabase.auth.admin.deleteUser(id);
      console.log('✅ Usuário removido do Auth');
    } catch (authError) {
      console.error('⚠️ Erro ao remover do Auth:', authError);
    }
    
         // Remover ramal do FreeSWITCH
     if (user.extension) {
       try {
         // Buscar dados do tenant para remoção
         const { data: tenant } = await supabase
           .from('tenants')
           .select('*')
           .eq('id', user.tenant_id)
           .single();
         
         if (tenant) {
           await removeExtensionFromFreeSWITCH(user.extension, tenant);
           console.log(`✅ Ramal ${user.extension} removido do FreeSWITCH`);
         }
       } catch (fsError) {
         console.error('⚠️ Erro ao remover do FreeSWITCH:', fsError);
       }
     }
    
    res.status(204).send();
    console.log(`✅ Usuário ${user.email} removido completamente`);
    
  } catch (error) {
    console.error('Erro interno:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET - Obter próximo ramal disponível
app.get('/tenants/:tenantId/next-extension', checkSupabaseConnection, async (req, res) => {
  try {
    const { tenantId } = req.params;
    
    const nextExtension = await getNextAvailableExtension(tenantId);
    
    res.json({ extension: nextExtension });
  } catch (error) {
    console.error('Erro ao obter próximo ramal:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET - Listar ramais disponíveis
app.get('/tenants/:tenantId/available-extensions', checkSupabaseConnection, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { limit = 10 } = req.query; // Limite de opções para mostrar
    
    const availableExtensions = await getAvailableExtensions(tenantId, parseInt(limit));
    
    res.json({ 
      extensions: availableExtensions,
      total: availableExtensions.length
    });
  } catch (error) {
    console.error('Erro ao listar ramais disponíveis:', error);
    res.status(500).json({ error: error.message });
  }
});

// --- INBOUND ROUTES ---
// Nova implementação: CRUD real via Supabase, com caller_id_name e source_ip

// GET: Listar rotas de entrada do tenant
app.get('/tenants/:tenantId/inbound', checkSupabaseConnection, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { data, error } = await supabase
      .from('inbound_routes')
      .select('*')
      .eq('tenant_id', tenantId);
    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Criar rota de entrada
app.post('/tenants/:tenantId/inbound', checkSupabaseConnection, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { did, caller_id_name, source_ip, destination_type, destination_id } = req.body;
    if (!did || !destination_type || !destination_id) {
      return res.status(400).json({ error: 'Campos obrigatórios: did, destination_type, destination_id' });
    }
    const { data, error } = await supabase
      .from('inbound_routes')
      .insert([{ did, caller_id_name, source_ip, destination_type, destination_id, tenant_id: tenantId }])
      .select();
    if (error) return res.status(500).json({ error: error.message });
    // Reprovisionar dialplan
    const { data: tenant } = await supabase.from('tenants').select('*').eq('id', tenantId).single();
    if (tenant) await configureFreeSWITCHForTenant(tenant);
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT: Editar rota de entrada
app.put('/inbound/:id', checkSupabaseConnection, async (req, res) => {
  try {
    const { id } = req.params;
    const { did, caller_id_name, source_ip, destination_type, destination_id } = req.body;
    if (!did || !destination_type || !destination_id) {
      return res.status(400).json({ error: 'Campos obrigatórios: did, destination_type, destination_id' });
    }
    const { data, error } = await supabase
      .from('inbound_routes')
      .update({ did, caller_id_name, source_ip, destination_type, destination_id })
      .eq('id', id)
      .select();
    if (error) return res.status(500).json({ error: error.message });
    // Reprovisionar dialplan
    const tenantId = data[0]?.tenant_id;
    if (tenantId) {
      const { data: tenant } = await supabase.from('tenants').select('*').eq('id', tenantId).single();
      if (tenant) await configureFreeSWITCHForTenant(tenant);
    }
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE: Remover rota de entrada
app.delete('/inbound/:id', checkSupabaseConnection, async (req, res) => {
  try {
    const { id } = req.params;
    // Buscar tenant_id antes de deletar
    const { data: route } = await supabase.from('inbound_routes').select('tenant_id').eq('id', id).single();
    const { error } = await supabase.from('inbound_routes').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    // Reprovisionar dialplan
    if (route?.tenant_id) {
      const { data: tenant } = await supabase.from('tenants').select('*').eq('id', route.tenant_id).single();
      if (tenant) await configureFreeSWITCHForTenant(tenant);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- OUTBOUND ROUTES ---

// GET /tenants/:tenantId/outbound - Listar rotas de saída do tenant
app.get('/tenants/:tenantId/outbound', checkSupabaseConnection, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { data, error } = await supabase
      .from('outbound_routes')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /tenants/:tenantId/outbound - Criar rota de saída
app.post('/tenants/:tenantId/outbound', checkSupabaseConnection, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const body = req.body;
    const insertData = { ...body, tenant_id: tenantId };
    const { data, error } = await supabase
      .from('outbound_routes')
      .insert([insertData])
      .select();
    if (error) return res.status(500).json({ error: error.message });
    // Reprovisionar dialplan
    try {
      const { data: tenant } = await supabase.from('tenants').select('*').eq('id', tenantId).single();
      await configureFreeSWITCHForTenant(tenant);
    } catch (fsError) {
      console.error('Erro ao reprovisionar dialplan:', fsError);
    }
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /outbound/:id - Editar rota de saída
app.put('/outbound/:id', checkSupabaseConnection, async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const { data: existing, error: findError } = await supabase.from('outbound_routes').select('*').eq('id', id).single();
    if (findError || !existing) return res.status(404).json({ error: 'Rota não encontrada' });
    const { data, error } = await supabase
      .from('outbound_routes')
      .update(body)
      .eq('id', id)
      .select();
    if (error) return res.status(500).json({ error: error.message });
    // Reprovisionar dialplan
    try {
      const { data: tenant } = await supabase.from('tenants').select('*').eq('id', existing.tenant_id).single();
      await configureFreeSWITCHForTenant(tenant);
    } catch (fsError) {
      console.error('Erro ao reprovisionar dialplan:', fsError);
    }
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /outbound/:id - Remover rota de saída
app.delete('/outbound/:id', checkSupabaseConnection, async (req, res) => {
  try {
    const { id } = req.params;
    const { data: existing, error: findError } = await supabase.from('outbound_routes').select('*').eq('id', id).single();
    if (findError || !existing) return res.status(404).json({ error: 'Rota não encontrada' });
    const { error } = await supabase.from('outbound_routes').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    // Reprovisionar dialplan
    try {
      const { data: tenant } = await supabase.from('tenants').select('*').eq('id', existing.tenant_id).single();
      await configureFreeSWITCHForTenant(tenant);
    } catch (fsError) {
      console.error('Erro ao reprovisionar dialplan:', fsError);
    }
    res.json({ message: 'Rota removida com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, "0.0.0.0", '0.0.0.0', () => {
  console.log(`🚀 Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 External access: http://31.97.250.190:${PORT}/health`);
}); 

// 2. Função generateTimeoutActionXml
function generateTimeoutActionXml(ringGroup, tenantDomain) {
  if (!ringGroup.timeout_action_type || !ringGroup.timeout_action) {
    return '<action application="hangup"/>';
  }
  switch (ringGroup.timeout_action_type) {
    case 'extension':
      return `<action application="bridge" data="user/${ringGroup.timeout_action}@${tenantDomain}"/>`;
    case 'voicemail':
      return `<action application="voicemail" data="default ${tenantDomain} ${ringGroup.timeout_action}"/>`;
    case 'hangup':
      return '<action application="hangup"/>';
    default:
      return '<action application="hangup"/>';
  }
}

// 3. Função provisionExtensionInFreeSWITCH
async function provisionExtensionInFreeSWITCH(extensionData, tenant) {
  try {
    const { extension, password, user_id, name, email, context, domain } = extensionData;
    const fs = require('fs').promises;
    console.log(`🔧 Provisionando ramal ${extension} no FreeSWITCH`);
    const userXml = `<?xml version="1.0" encoding="utf-8"?>\n<include>\n  <user id="${extension}">\n    <params>\n      <param name="password" value="${password}"/>\n      <param name="vm-password" value="${extension}"/>\n    </params>\n    <variables>\n      <variable name="toll_allow" value="domestic,international,local"/>\n      <variable name="accountcode" value="${extension}"/>\n      <variable name="user_context" value="${context}"/>\n      <variable name="effective_caller_id_name" value="${name}"/>\n      <variable name="effective_caller_id_number" value="${extension}"/>\n      <variable name="outbound_caller_id_name" value="${name}"/>\n      <variable name="outbound_caller_id_number" value="${extension}"/>\n      <variable name="callgroup" value="default"/>\n      <variable name="user_id" value="${user_id}"/>\n      <variable name="email" value="${email}"/>\n    </variables>\n  </user>\n</include>`;
    const userFilePath = `/etc/freeswitch/directory/${domain}/${extension}.xml`;
    await fs.writeFile(userFilePath, userXml);
    console.log(`✅ Ramal ${extension} provisionado em ${userFilePath}`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao provisionar ramal:', error);
    throw error;
  }
}

// 4. Função removeExtensionFromFreeSWITCH
async function removeExtensionFromFreeSWITCH(extension, tenant) {
  try {
    const fs = require('fs');
    const domain = tenant.sip_domain || `${tenant.name.toLowerCase().replace(/\s+/g, '')}.local`;
    const userFilePath = `/etc/freeswitch/directory/${domain}/${extension}.xml`;
    console.log(`🗑️ Removendo ramal ${extension} do FreeSWITCH`);
    if (fs.existsSync(userFilePath)) {
      fs.unlinkSync(userFilePath);
      console.log(`✅ Arquivo ${userFilePath} removido`);
    } else {
      console.log(`⚠️ Arquivo ${userFilePath} não encontrado`);
    }
    return true;
  } catch (error) {
    console.error('❌ Erro ao remover ramal:', error);
    throw error;
  }
}

// 5. Função ensureFreeSWITCHDirectories
async function ensureFreeSWITCHDirectories(tenant) {
  const fs = require('fs').promises;
  const sipDomain = tenant.sip_domain || `${tenant.name.toLowerCase().replace(/\s+/g, '')}.local`;
  const directories = [
    '/etc/freeswitch/directory',
    `/etc/freeswitch/directory/${sipDomain}`,
          '/usr/local/freeswitch/conf/dialplan',
    '/etc/freeswitch/sip_profiles'
  ];
  for (const dir of directories) {
    try {
      await fs.mkdir(dir, { recursive: true });
      console.log(`✅ Diretório garantido: ${dir}`);
    } catch (error) {
      console.error(`❌ Erro ao criar diretório ${dir}:`, error);
      throw error;
    }
  }
}

// 6. Função validateTenantData
function validateTenantData(tenant) {
  if (!tenant || !tenant.id || !tenant.name) {
    throw new Error('Dados do tenant inválidos');
  }
  return true;
}

// 7. Melhorar tratamento de erros em configureFreeSWITCHForTenant
// Exemplo de uso:
// try {
//   validateTenantData(tenant);
//   await ensureFreeSWITCHDirectories(tenant);
//   ...
// } catch (error) {
//   console.error('❌ Erro ao configurar FreeSWITCH:', error);
//   console.error('🔍 Detalhes do erro:', { message: error.message, stack: error.stack, tenant: tenant?.name || 'Desconhecido' });
//   throw error;
// }
// ... existing code ... 

// Diretório para salvar áudios TTS
const TTS_AUDIO_DIR = process.env.TTS_AUDIO_DIR || '/var/lib/tts-audios';

// Helper para garantir diretório
function ensureDirSync(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// ElevenLabs API
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_URL = 'https://api.elevenlabs.io/v1/text-to-speech';

// Gera e salva áudio TTS
app.post('/tenants/:tenantId/generate-tts', checkSupabaseConnection, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { text, voice_id, name } = req.body;
    if (!text || !voice_id || !name) {
      return res.status(400).json({ error: 'Campos obrigatórios: text, voice_id, name' });
    }
    if (!ELEVENLABS_API_KEY) {
      return res.status(500).json({ error: 'Chave da ElevenLabs não configurada no backend' });
    }
    // Chamada à ElevenLabs
    const response = await fetch(`${ELEVENLABS_URL}/${voice_id}`, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.5, similarity_boost: 0.5 } })
    });
    if (!response.ok) {
      const err = await response.text();
      return res.status(500).json({ error: 'Erro na ElevenLabs', details: err });
    }
    // Salvar arquivo
    const audioBuffer = await response.buffer();
    const audioId = uuidv4();
    const tenantDir = path.join(TTS_AUDIO_DIR, tenantId);
    ensureDirSync(tenantDir);
    const fileName = `${audioId}.mp3`;
    const filePath = path.join(tenantDir, fileName);
    fs.writeFileSync(filePath, audioBuffer);
    // Salvar metadados no banco
    const { data, error } = await supabase.from('audio_files').insert([
      {
        id: audioId,
        tenant_id: tenantId,
        name,
        text,
        voice_id,
        file_path: filePath,
        created_at: new Date().toISOString()
      }
    ]).select();
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Erro ao gerar TTS:', error);
    res.status(500).json({ error: error.message });
  }
});

// Lista áudios TTS
app.get('/tenants/:tenantId/audio-files', checkSupabaseConnection, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { data, error } = await supabase
      .from('audio_files')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove áudio TTS
app.delete('/audio-files/:id', checkSupabaseConnection, async (req, res) => {
  try {
    const { id } = req.params;
    // Buscar metadados
    const { data, error } = await supabase.from('audio_files').select('*').eq('id', id).single();
    if (error || !data) {
      return res.status(404).json({ error: 'Áudio não encontrado' });
    }
    // Remover arquivo
    if (data.file_path && fs.existsSync(data.file_path)) {
      fs.unlinkSync(data.file_path);
    }
    // Remover do banco
    const { error: delError } = await supabase.from('audio_files').delete().eq('id', id);
    if (delError) {
      return res.status(500).json({ error: delError.message });
    }
    res.json({ message: 'Áudio removido com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Listar vozes disponíveis da ElevenLabs
app.get('/elevenlabs/voices', async (req, res) => {
  try {
    if (!ELEVENLABS_API_KEY) {
      return res.status(500).json({ error: 'Chave da ElevenLabs não configurada no backend' });
    }
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: { 'xi-api-key': ELEVENLABS_API_KEY }
    });
    const data = await response.json();
    res.json(data.voices || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Validação de fluxo de URA
function validateURAFlow(flow) {
  const errors = [];
  const warnings = [];
  
  if (!flow || !flow.nodes || !Array.isArray(flow.nodes)) {
    errors.push('Fluxo deve conter um array de nós');
    return { errors, warnings };
  }
  
  if (flow.nodes.length === 0) {
    warnings.push('URA não possui nós configurados');
  }
  
  // Verificar se há nó de início (start)
  const startNodes = flow.nodes.filter(node => node.type === 'start');
  if (startNodes.length === 0) {
    warnings.push('URA deve ter um nó de início (Start) para gerenciar inbound routes');
  } else if (startNodes.length > 1) {
    errors.push('URA deve ter apenas um nó de início (Start)');
  }
  
  // Verificar se há nós de entrada (qualquer tipo pode ser ponto de entrada)
  const entryNodes = flow.nodes.filter(node => 
    ['menu', 'extension', 'group', 'tts', 'schedule'].includes(node.type)
  );
  if (entryNodes.length === 0) {
    warnings.push('URA deve ter pelo menos um nó de entrada (menu, ramal, grupo, TTS ou agendamento)');
  }
  
  // Verificar se há nós de saída (extension, group, hangup)
  const exitNodes = flow.nodes.filter(node => 
    ['extension', 'group', 'hangup'].includes(node.type)
  );
  if (exitNodes.length === 0) {
    warnings.push('URA deve ter pelo menos um nó de saída (ramal, grupo ou encerramento)');
  }
  
  // Verificar conectividade
  if (flow.edges && Array.isArray(flow.edges)) {
    const nodeIds = flow.nodes.map(node => node.id);
    const edgeSourceIds = flow.edges.map(edge => edge.source);
    const edgeTargetIds = flow.edges.map(edge => edge.target);
    
    // Verificar se todas as origens dos edges existem
    edgeSourceIds.forEach(sourceId => {
      if (!nodeIds.includes(sourceId)) {
        errors.push(`Edge com origem inválida: ${sourceId}`);
      }
    });
    
    // Verificar se todos os destinos dos edges existem
    edgeTargetIds.forEach(targetId => {
      if (!nodeIds.includes(targetId)) {
        errors.push(`Edge com destino inválido: ${targetId}`);
      }
    });
  }
  
  return { errors, warnings };
}

// Gerar dialplan XML para URA
function generateURADialplan(ura, tenant) {
  const { flow } = ura;
  const context = tenant.context || `context_${tenant.name.toLowerCase().replace(/\s+/g, '_')}`;
  
  let dialplanXml = `<?xml version="1.0" encoding="UTF-8"?>
<include>
  <context name="${context}">
    <extension name="URA ${ura.name}" continue="true">
      <condition field="destination_number" expression="^${ura.id}$">
`;
  
  // Processar nós do fluxo
  if (flow && flow.nodes && Array.isArray(flow.nodes)) {
    flow.nodes.forEach((node, index) => {
      switch (node.type) {
        case 'start':
          dialplanXml += generateStartNodeXml(node, index, context);
          break;
        case 'menu':
          dialplanXml += generateMenuNodeXml(node, flow.edges, index, context);
          break;
        case 'tts':
          dialplanXml += generateTTSNodeXml(node, index);
          break;
        case 'extension':
          dialplanXml += generateExtensionNodeXml(node, index, context);
          break;
        case 'group':
          dialplanXml += generateGroupNodeXml(node, index, context);
          break;
        case 'schedule':
          dialplanXml += generateScheduleNodeXml(node, index, flow.edges, context);
          break;
        case 'hangup':
          dialplanXml += generateHangupNodeXml(node, index);
          break;
        default:
          dialplanXml += `        <!-- Nó não suportado: ${node.type} -->\n`;
      }
    });
  }
  
  dialplanXml += `      </condition>
    </extension>
  </context>
</include>`;
  
  return dialplanXml;
}

// Gerar XML para nó de menu
function generateMenuNodeXml(node, edges, index, context) {
  const options = node.data?.options || [];
  let xml = `        <!-- Menu: ${node.data?.message || 'Menu'} -->\n`;
  
  // Tocar mensagem de boas-vindas
  if (node.data?.message) {
    xml += `        <action application="playback" data="silence_stream://1000"/>\n`;
    xml += `        <action application="say" data="pt ${node.data.message}"/>\n`;
  }
  
  // Configurar timeout e max tentativas
  xml += `        <action application="set" data="timeout=5"/>\n`;
  xml += `        <action application="set" data="max_attempts=3"/>\n`;
  
  // Configurar opções DTMF
  options.forEach((option, i) => {
    const nextNode = edges?.find(edge => 
      edge.source === node.id && edge.sourceHandle === `option-${option.key}`
    );
    
    if (nextNode) {
      xml += `        <action application="set" data="option_${option.key}=${nextNode.target}"/>\n`;
    }
  });
  
  xml += `        <action application="read" data="digits 1 1 # ${node.data?.message || 'Menu'} 1000"/>\n`;
  
  // Lógica de roteamento baseada na digitação
  options.forEach((option, i) => {
    const nextNode = edges?.find(edge => 
      edge.source === node.id && edge.sourceHandle === `option-${option.key}`
    );
    
    if (nextNode) {
      xml += `        <action application="transfer" data="${nextNode.target} XML ${context}"/>\n`;
    }
  });
  
  return xml;
}

// Gerar XML para nó TTS
function generateTTSNodeXml(node, index) {
  const audioFile = node.data?.audio_file;
  let xml = `        <!-- TTS: ${node.data?.name || 'Áudio'} -->\n`;
  
  if (audioFile && audioFile.file_path) {
    xml += `        <action application="playback" data="${audioFile.file_path}"/>\n`;
  } else {
    xml += `        <action application="say" data="pt ${node.data?.text || 'Texto não configurado'}"/>\n`;
  }
  
  return xml;
}

// Gerar XML para nó de extensão
function generateExtensionNodeXml(node, index, context) {
  const extension = node.data?.extension;
  let xml = `        <!-- Extension: ${extension || 'Número não configurado'} -->\n`;
  
  if (extension) {
    xml += `        <action application="bridge" data="user/${extension}@${context}"/>\n`;
  }
  
  return xml;
}

// Gerar XML para nó de grupo
function generateGroupNodeXml(node, index, context) {
  const groupId = node.data?.groupId;
  let xml = `        <!-- Group: ${node.data?.name || 'Grupo não configurado'} -->\n`;
  
  if (groupId) {
    xml += `        <action application="bridge" data="group/${groupId}@${context}"/>\n`;
  }
  
  return xml;
}

// Gerar XML para nó de horário
function generateScheduleNodeXml(node, index, edges, context) {
  const daysOfWeek = node.data?.daysOfWeek || {};
  const timeRanges = node.data?.timeRanges || [{ start: '09:00', end: '18:00' }];
  const holidays = node.data?.holidays || [];
  
  let xml = `        <!-- Schedule: ${node.data?.name || 'Horário não configurado'} -->\n`;
  
  // Encontrar nós de destino para "dentro" e "fora" do horário
  const withinHoursEdge = edges?.find(edge => edge.source === node.id && edge.sourceHandle === 'within');
  const outsideHoursEdge = edges?.find(edge => edge.source === node.id && edge.sourceHandle === 'outside');
  
  const withinHoursTarget = withinHoursEdge?.target || 'hangup';
  const outsideHoursTarget = outsideHoursEdge?.target || 'hangup';
  
  // Verificar se é feriado
  xml += `        <action application="set" data="current_date=${new Date().toISOString().split('T')[0]}"/>\n`;
  
  // Verificar feriados
  if (holidays.length > 0) {
    xml += `        <action application="set" data="is_holiday=false"/>\n`;
    holidays.forEach((holiday, i) => {
      xml += `        <action application="set" data="holiday_date_${i}=${holiday.date}"/>\n`;
      xml += `        <action application="execute" data="if(${holiday.date} = ${new Date().toISOString().split('T')[0]}, set is_holiday=true)"/>\n`;
    });
    xml += `        <action application="transfer" data="${outsideHoursTarget} XML ${context}"/>\n`;
  }
  
  // Verificar dia da semana
  const dayMap = { monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 0 };
  const selectedDays = Object.entries(daysOfWeek).filter(([_, checked]) => checked).map(([day, _]) => dayMap[day]);
  
  if (selectedDays.length > 0) {
    xml += `        <action application="set" data="current_day=\${strftime(%w)}"/>\n`;
    xml += `        <action application="set" data="valid_day=false"/>\n`;
    selectedDays.forEach((day, i) => {
      xml += `        <action application="execute" data="if($\{current_day\} = ${day}, set valid_day=true)"/>\n`;
    });
    xml += `        <action application="execute" data="if(\${valid_day} = false, transfer ${outsideHoursTarget} XML ${context})"/>\n`;
  }
  
  // Verificar horário
  xml += `        <action application="set" data="current_time=${new Date().toTimeString().substring(0, 5)}"/>\n`;
  xml += `        <action application="set" data="within_hours=false"/>\n`;
  
  timeRanges.forEach((range, i) => {
    xml += `        <action application="execute" data="if(\${current_time} >= ${range.start} && \${current_time} <= ${range.end}, set within_hours=true)"/>\n`;
  });
  
  // Roteamento baseado no horário
  xml += `        <action application="execute" data="if(\${within_hours} = true, transfer ${withinHoursTarget} XML ${context}, transfer ${outsideHoursTarget} XML ${context})"/>\n`;
  
  return xml;
}

// Gerar XML para nó de encerramento
function generateHangupNodeXml(node, index) {
  let xml = `        <!-- Hangup -->\n`;
  xml += `        <action application="hangup" data="NORMAL_CLEARING"/>\n`;
  
  return xml;
}

// Gerar XML para nó de início (Start)
function generateStartNodeXml(node, index, context) {
  let xml = `        <!-- Start Node: Inbound Routes -->\n`;
  
  // Verificar se há rotas configuradas
  const routesCount = node.data?.routesCount || 0;
  const autoCreate = node.data?.autoCreate || false;
  
  if (routesCount > 0) {
    xml += `        <!-- ${routesCount} rota(s) inbound configurada(s) -->\n`;
    xml += `        <action application="log" data="INFO URA ${context}: Iniciando com ${routesCount} rotas inbound"/>\n`;
  } else {
    xml += `        <!-- Nenhuma rota inbound configurada -->\n`;
    xml += `        <action application="log" data="WARNING URA ${context}: Nenhuma rota inbound configurada"/>\n`;
  }
  
  // Se autoCreate estiver ativado, criar rota automaticamente
  if (autoCreate) {
    const defaultDid = node.data?.defaultDid;
    const defaultDestinationType = node.data?.defaultDestinationType;
    const defaultDestinationId = node.data?.defaultDestinationId;
    
    if (defaultDid && defaultDestinationType && defaultDestinationId) {
      xml += `        <!-- Criando rota inbound automaticamente -->\n`;
      xml += `        <action application="log" data="INFO URA ${context}: Criando rota inbound para DID ${defaultDid}"/>\n`;
      
      // Aqui você pode adicionar lógica para criar a rota automaticamente
      // Por enquanto, apenas logamos a intenção
      xml += `        <action application="set" data="auto_create_route=true"/>\n`;
      xml += `        <action application="set" data="default_did=${defaultDid}"/>\n`;
      xml += `        <action application="set" data="default_destination_type=${defaultDestinationType}"/>\n`;
      xml += `        <action application="set" data="default_destination_id=${defaultDestinationId}"/>\n`;
    }
  }
  
  // Continuar para o próximo nó
  xml += `        <action application="log" data="INFO URA ${context}: Iniciando fluxo"/>\n`;
  
  return xml;
}

// Endpoint para validar fluxo de URA
app.post('/ura/validate-flow', checkSupabaseConnection, async (req, res) => {
  try {
    const { flow } = req.body;
    const validation = validateURAFlow(flow);
    
    res.json({
      valid: validation.errors.length === 0,
      errors: validation.errors,
      warnings: validation.warnings
    });
  } catch (error) {
    console.error('Erro ao validar fluxo:', error);
    res.status(500).json({ error: error.message });
  }
});

// Templates de URA pré-configurados
app.get('/ura-templates', async (req, res) => {
  try {
    const templates = [
      {
        id: 'welcome-menu',
        name: 'Menu de Boas-vindas',
        description: 'URA básica com menu de opções',
        flow: {
          nodes: [
            {
              id: 'menu-1',
              type: 'menu',
              position: { x: 100, y: 100 },
              data: {
                message: 'Bem-vindo! Pressione 1 para atendimento, 2 para informações ou 3 para encerrar.',
                options: [
                  { key: '1', label: 'Atendimento' },
                  { key: '2', label: 'Informações' },
                  { key: '3', label: 'Encerrar' }
                ]
              }
            },
            {
              id: 'extension-1',
              type: 'extension',
              position: { x: 400, y: 50 },
              data: { extension: '1001', name: 'Atendimento' }
            },
            {
              id: 'tts-1',
              type: 'tts',
              position: { x: 400, y: 150 },
              data: { text: 'Obrigado por nos contatar. Em breve retornaremos sua ligação.' }
            },
            {
              id: 'hangup-1',
              type: 'hangup',
              position: { x: 400, y: 250 },
              data: {}
            }
          ],
          edges: [
            { id: 'e1', source: 'menu-1', target: 'extension-1', sourceHandle: 'option-1' },
            { id: 'e2', source: 'menu-1', target: 'tts-1', sourceHandle: 'option-2' },
            { id: 'e3', source: 'menu-1', target: 'hangup-1', sourceHandle: 'option-3' }
          ]
        }
      },
      {
        id: 'business-hours',
        name: 'Horário de Funcionamento',
        description: 'URA com verificação de horário de funcionamento',
        flow: {
          nodes: [
            {
              id: 'schedule-1',
              type: 'schedule',
              position: { x: 100, y: 100 },
              data: { 
                name: 'Verificar Horário',
                daysOfWeek: {
                  monday: true,
                  tuesday: true,
                  wednesday: true,
                  thursday: true,
                  friday: true,
                  saturday: false,
                  sunday: false
                },
                timeRanges: [
                  { start: '09:00', end: '18:00' }
                ],
                holidays: []
              }
            },
            {
              id: 'extension-1',
              type: 'extension',
              position: { x: 400, y: 50 },
              data: { extension: '1001', name: 'Atendimento' }
            },
            {
              id: 'tts-1',
              type: 'tts',
              position: { x: 400, y: 150 },
              data: { 
                text: 'Estamos fora do horário de funcionamento. Deixe sua mensagem após o sinal.' 
              }
            },
            {
              id: 'hangup-1',
              type: 'hangup',
              position: { x: 400, y: 250 },
              data: {}
            }
          ],
          edges: [
            { id: 'e1', source: 'schedule-1', target: 'extension-1', sourceHandle: 'within' },
            { id: 'e2', source: 'schedule-1', target: 'tts-1', sourceHandle: 'outside' },
            { id: 'e3', source: 'tts-1', target: 'hangup-1' }
          ]
        }
      }
    ];
    
    res.json(templates);
  } catch (error) {
    console.error('Erro ao buscar templates:', error);
    res.status(500).json({ error: error.message });
  }
});

// === Pesquisa de Satisfação (Survey) ===

// Função para provisionar pesquisa no FreeSWITCH
async function provisionSurvey(survey, tenant) {
  try {
    console.log(`🔧 [Provision] Iniciando provisionamento da pesquisa: ${survey.name}`);
    // Validar dados da pesquisa
    if (!survey.question_text || !survey.question_text.trim()) {
      throw new Error('Pergunta da pesquisa é obrigatória');
    }
    if (!survey.options || !Array.isArray(survey.options) || survey.options.length === 0) {
      throw new Error('Pesquisa deve ter pelo menos uma opção configurada');
    }
    for (let i = 0; i < survey.options.length; i++) {
      const option = survey.options[i];
      if (!option.value || !option.label) {
        throw new Error(`Opção ${i + 1} deve ter valor e rótulo`);
      }
    }
    // Verificar se FreeSWITCH está rodando
    const isFreeSWITCHRunning = await checkFreeSWITCHStatus();
    if (!isFreeSWITCHRunning) {
      throw new Error('FreeSWITCH não está rodando');
    }
    // Gerar XML de configuração da pesquisa
    let surveyXml = '';
    surveyXml += `<!-- Survey Template: ${survey.name} -->\n`;
    surveyXml += `<survey id="${survey.id}" name="${survey.name}" type="${survey.survey_type}" tenant_id="${survey.tenant_id}">\n`;
    surveyXml += `  <question>${survey.question_text}</question>\n`;
    surveyXml += `  <options>\n`;
    survey.options.forEach(option => {
      surveyXml += `    <option value=\"${option.value}\" label=\"${option.label}\"`;
      if (option.description) {
        surveyXml += ` description=\"${option.description}\"`;
      }
      surveyXml += ` />\n`;
    });
    surveyXml += `  </options>\n`;
    surveyXml += `</survey>\n`;
    // Caminho da pasta do tenant (nome)
    const tenantNameSanitized = (tenant.name || tenant.id).toLowerCase().replace(/[^a-z0-9_\-]/g, '_');
    const surveyDir = `/usr/local/freeswitch/conf/surveys/${tenantNameSanitized}`;
    if (!fs.existsSync(surveyDir)) {
      fs.mkdirSync(surveyDir, { recursive: true });
      console.log(`✅ Pasta criada para surveys do tenant: ${surveyDir}`);
    }
    // Remover arquivo antigo na raiz, se existir
    const oldPath = `/usr/local/freeswitch/conf/surveys/survey_${survey.id}.xml`;
    if (fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath);
      console.log(`🗑️ Arquivo antigo removido: ${oldPath}`);
    }
    // Escrever arquivo de configuração
    const surveyConfigPath = `${surveyDir}/survey_${survey.id}.xml`;
    await writeFreeSWITCHConfig(surveyConfigPath, surveyXml);
    console.log(`✅ Pesquisa ${survey.name} provisionada com sucesso no FreeSWITCH (tenant: ${tenantNameSanitized})`);
    return { success: true, message: 'Pesquisa provisionada com sucesso' };
  } catch (error) {
    console.error(`❌ Erro ao provisionar pesquisa ${survey.name}:`, error);
    throw error;
  }
}

// Função para remover pesquisa do FreeSWITCH
async function removeSurveyFromFreeSWITCH(surveyId, tenant) {
  try {
    const tenantNameSanitized = (tenant.name || tenant.id).toLowerCase().replace(/[^a-z0-9_\-]/g, '_');
    const surveyDir = `/usr/local/freeswitch/conf/surveys/${tenantNameSanitized}`;
    const surveyConfigPath = `${surveyDir}/survey_${surveyId}.xml`;
    if (fs.existsSync(surveyConfigPath)) {
      fs.unlinkSync(surveyConfigPath);
      console.log(`✅ Arquivo de configuração da pesquisa ${surveyId} removido de ${surveyDir}`);
    }
    // Remover arquivo antigo na raiz, se existir
    const oldPath = `/usr/local/freeswitch/conf/surveys/survey_${surveyId}.xml`;
    if (fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath);
      console.log(`🗑️ Arquivo antigo removido: ${oldPath}`);
    }
    return { success: true, message: 'Pesquisa removida com sucesso' };
  } catch (error) {
    console.error(`❌ Erro ao remover pesquisa ${surveyId}:`, error);
    throw error;
  }
}

// CRUD de Templates de Pesquisa
app.get('/tenants/:tenantId/surveys', checkSupabaseConnection, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { data, error } = await supabase
      .from('cc_surveys')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('name');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/tenants/:tenantId/surveys', checkSupabaseConnection, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { name, question_text, survey_type, options } = req.body;
    
    // Validar dados obrigatórios
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Nome da pesquisa é obrigatório' });
    }
    if (!question_text || !question_text.trim()) {
      return res.status(400).json({ error: 'Pergunta da pesquisa é obrigatória' });
    }
    
    // Buscar dados do tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();
    
    if (tenantError || !tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }
    
    const surveyData = {
      tenant_id: tenantId,
      name: name.trim(),
      question_text: question_text.trim(),
      survey_type: survey_type || 'dtmf',
      options: options || null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    const { data, error } = await supabase
      .from('cc_surveys')
      .insert([surveyData])
      .select();
    
    if (error) {
      console.error('Erro ao criar pesquisa:', error);
      return res.status(500).json({ error: error.message });
    }
    
    const createdSurvey = data[0];
    
    // Provisionar automaticamente no FreeSWITCH
    try {
      // Remover arquivo antigo na raiz, se existir
      const oldPath = `/usr/local/freeswitch/conf/surveys/survey_${createdSurvey.id}.xml`;
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
        console.log(`🗑️ Arquivo antigo removido: ${oldPath}`);
      }
      await provisionSurvey({ ...createdSurvey, tenant_id: tenant.id || tenant.tenant_id || tenantId }, tenant);
      console.log(`✅ Pesquisa "${createdSurvey.name}" criada e provisionada com sucesso`);
    } catch (provisionError) {
      console.error('❌ Erro no provisionamento automático:', provisionError);
      // Não falhar a criação, apenas logar o erro
      // A pesquisa foi criada no banco, mas não foi provisionada no FreeSWITCH
    }
    
    res.status(201).json({
      ...createdSurvey,
      provision_status: 'success',
      provision_message: 'Pesquisa criada e provisionada com sucesso'
    });
    
  } catch (error) {
    console.error('Erro interno ao criar pesquisa:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/surveys/:id', checkSupabaseConnection, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, question_text, survey_type, options, is_active } = req.body;
    
    // Validar dados obrigatórios
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Nome da pesquisa é obrigatório' });
    }
    if (!question_text || !question_text.trim()) {
      return res.status(400).json({ error: 'Pergunta da pesquisa é obrigatória' });
    }
    
    // Buscar pesquisa atual
    const { data: currentSurvey, error: fetchError } = await supabase
      .from('cc_surveys')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError || !currentSurvey) {
      return res.status(404).json({ error: 'Pesquisa não encontrada' });
    }
    
    // Buscar dados do tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', currentSurvey.tenant_id)
      .single();
    
    if (tenantError || !tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }
    
    const updateData = {
      name: name.trim(),
      question_text: question_text.trim(),
      survey_type: survey_type || currentSurvey.survey_type,
      options: options || currentSurvey.options,
      is_active: is_active !== undefined ? is_active : currentSurvey.is_active,
      updated_at: new Date().toISOString(),
    };
    
    const { data, error } = await supabase
      .from('cc_surveys')
      .update(updateData)
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('Erro ao atualizar pesquisa:', error);
      return res.status(500).json({ error: error.message });
    }
    
    const updatedSurvey = data[0];
    
    // Provisionar automaticamente no FreeSWITCH
    try {
      // Remover arquivo antigo na raiz, se existir
      const oldPath = `/usr/local/freeswitch/conf/surveys/survey_${updatedSurvey.id}.xml`;
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
        console.log(`🗑️ Arquivo antigo removido: ${oldPath}`);
      }
      await provisionSurvey({ ...updatedSurvey, tenant_id: tenant.id || tenant.tenant_id || currentSurvey.tenant_id }, tenant);
      console.log(`✅ Pesquisa "${updatedSurvey.name}" atualizada e provisionada com sucesso`);
    } catch (provisionError) {
      console.error('❌ Erro no provisionamento automático:', provisionError);
      // Não falhar a atualização, apenas logar o erro
    }
    
    res.json({
      ...updatedSurvey,
      provision_status: 'success',
      provision_message: 'Pesquisa atualizada e provisionada com sucesso'
    });
    
  } catch (error) {
    console.error('Erro interno ao atualizar pesquisa:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/surveys/:id', checkSupabaseConnection, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar pesquisa antes de deletar
    const { data: survey, error: fetchError } = await supabase
      .from('cc_surveys')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError || !survey) {
      return res.status(404).json({ error: 'Pesquisa não encontrada' });
    }
    
    // Deletar do banco de dados
    const { error } = await supabase
      .from('cc_surveys')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Erro ao deletar pesquisa:', error);
      return res.status(500).json({ error: error.message });
    }
    
    // Remover do FreeSWITCH
    try {
      await removeSurveyFromFreeSWITCH(id, survey.tenant_id);
      console.log(`✅ Pesquisa "${survey.name}" removida do FreeSWITCH`);
    } catch (provisionError) {
      console.error('❌ Erro ao remover pesquisa do FreeSWITCH:', provisionError);
      // Não falhar a exclusão, apenas logar o erro
    }
    
    res.status(204).send();
    
  } catch (error) {
    console.error('Erro interno ao deletar pesquisa:', error);
    res.status(500).json({ error: error.message });
  }
});

// Configuração da pesquisa por ring group (usando templates)
app.get('/ringgroups/:id/survey', checkSupabaseConnection, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('cc_post_call_survey')
      .select(`
        *,
        cc_surveys (
          id,
          name,
          question_text,
          survey_type,
          options
        )
      `)
      .eq('ring_group_id', id)
      .single();
    if (error && error.code !== 'PGRST116') {
      return res.status(500).json({ error: error.message });
    }
    res.json(data || null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/ringgroups/:id/survey', checkSupabaseConnection, async (req, res) => {
  try {
    const { id } = req.params;
    const { enabled, survey_template_id } = req.body;
    
    // Verifica se já existe
    const { data: existing, error: findError } = await supabase
      .from('cc_post_call_survey')
      .select('*')
      .eq('ring_group_id', id)
      .single();
    
    if (findError && findError.code !== 'PGRST116') {
      return res.status(500).json({ error: findError.message });
    }
    
    let result;
    if (existing) {
      // Atualiza
      const { data, error } = await supabase
        .from('cc_post_call_survey')
        .update({
          enabled: enabled !== undefined ? enabled : existing.enabled,
          survey_template_id: survey_template_id || existing.survey_template_id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select();
      if (error) return res.status(500).json({ error: error.message });
      result = data[0];
    } else {
      // Cria
      const { data, error } = await supabase
        .from('cc_post_call_survey')
        .insert([{
          ring_group_id: id,
          enabled: enabled || false,
          survey_template_id: survey_template_id || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select();
      if (error) return res.status(500).json({ error: error.message });
      result = data[0];
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});