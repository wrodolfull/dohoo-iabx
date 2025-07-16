# 🔧 Painel Avançado do FreeSWITCH - Guia do Superadmin

## 📖 Visão Geral

O Painel Avançado do FreeSWITCH é uma interface exclusiva para **Superadmins** que oferece controle total sobre as configurações do FreeSWITCH, incluindo:

- ✅ Gerenciamento completo de **Dialplans**
- ✅ Configuração de **Perfis SIP** (Internal/External)
- ✅ **Configurações Globais** do FreeSWITCH
- ✅ **Visualização XML** bruta
- ✅ **Controle do Sistema** (reload, status)

---

## 🚀 Acesso ao Painel

### Pré-requisitos
- ✅ Usuário com role `superadmin`
- ✅ Sistema Dohoo IABX em execução
- ✅ FreeSWITCH instalado e configurado

### Como Acessar
1. Faça login como **superadmin**
2. No menu lateral, acesse **FreeSWITCH Avançado**
3. O painel será exibido com 4 abas principais

---

## 📋 Funcionalidades Principais

### 1. 📞 Gestão de Dialplans

#### O que são Dialplans?
Dialplans são regras que definem como o FreeSWITCH processa chamadas telefônicas. Cada regra especifica:
- **Condição**: Padrão regex para números
- **Ações**: O que fazer quando a condição for atendida
- **Contexto**: Onde a regra se aplica
- **Prioridade**: Ordem de execução

#### Como Criar/Editar Dialplans

1. **Acessar a aba "Dialplan"**
2. **Clicar em "Nova Regra"** ou selecionar uma existente
3. **Preencher os campos:**
   - **Nome**: Identificação da regra
   - **Contexto**: `default`, `public`, `features`
   - **Prioridade**: Número (menor = maior prioridade)
   - **Condição**: Regex (ex: `^(\d{4})$` para ramais)
   - **Número de Destino**: Variável (ex: `$1`)
   - **Ações**: Uma por linha (ex: `bridge user/$1@${domain_name}`)

#### Exemplos de Dialplans Comuns

```xml
<!-- Roteamento de Ramais (4 dígitos) -->
Condição: ^(\d{4})$
Ação: bridge user/$1@${domain_name}

<!-- Chamadas Externas (10-11 dígitos) -->
Condição: ^(\d{10,11})$
Ação: bridge sofia/gateway/provider/$1

<!-- Emergências -->
Condição: ^(911|112|190)$
Ação: bridge sofia/gateway/emergency/$1
```

### 2. 🌐 Perfis SIP

#### Tipos de Perfis
- **Internal**: Para comunicação interna (ramais, troncos internos)
- **External**: Para provedores externos e acesso público

#### Configurações Principais
- **Nome**: Identificador único
- **Porta SIP**: Porta de escuta (padrão: 5060 internal, 5080 external)
- **IP SIP/RTP**: Endereços de bind (`auto` para automático)
- **Contexto**: Contexto de dialplan associado
- **Codecs**: Lista de codecs suportados (ex: `PCMU,PCMA,G729`)

#### Parâmetros Customizados
Os perfis aceitam parâmetros JSON customizados:

```json
{
  "auth-calls": "true",
  "apply-nat-acl": "nat.auto",
  "apply-inbound-acl": "domains",
  "accept-blind-reg": "false",
  "inbound-codec-prefs": "PCMU,PCMA,G729"
}
```

### 3. ⚙️ Configuração Global

#### Parâmetros Disponíveis
- **Nível de Log**: DEBUG, INFO, NOTICE, WARNING, ERROR
- **Máximo de Sessões**: Limite de chamadas simultâneas
- **Sessões por Segundo**: Rate limiting
- **Portas RTP**: Range de portas para áudio (16384-32768)
- **Opções de Dialplan**:
  - Continuar procurando em caso de falha
  - Continuar em caso de erro
  - Desligar após bridge

### 4. 📄 XML Bruto

#### Visualização
- **Dialplan XML**: Configuração gerada automaticamente
- **Perfis SIP XML**: Estrutura completa dos perfis
- **Apenas leitura**: Para verificação e debug

---

## 🔄 Controles do Sistema

### Status do FreeSWITCH
- **🟢 Online**: Sistema funcionando normalmente
- **🟡 Reiniciando**: Aplicando configurações
- **🔴 Offline**: Sistema parado ou com problemas

### Ações Disponíveis
- **Reload FS**: Recarrega configurações sem derrubar chamadas
- **Exportar**: Baixa backup das configurações
- **Importar**: Carrega configurações de backup

---

## 📋 Fluxo de Trabalho Recomendado

### 1. Planejamento
1. **Definir requisitos** de roteamento
2. **Mapear contextos** necessários
3. **Planejar prioridades** das regras

### 2. Configuração
1. **Configurar perfis SIP** (internal/external)
2. **Criar dialplans** básicos
3. **Ajustar configurações globais**
4. **Testar roteamento**

### 3. Validação
1. **Verificar XML gerado**
2. **Fazer reload do FreeSWITCH**
3. **Testar chamadas**
4. **Monitorar logs**

---

## ⚠️ Boas Práticas

### Segurança
- ✅ **Sempre fazer backup** antes de mudanças
- ✅ **Testar em ambiente de desenvolvimento** primeiro
- ✅ **Documentar alterações** importantes
- ✅ **Monitorar logs** após mudanças

### Performance
- ✅ **Usar prioridades adequadas** nos dialplans
- ✅ **Otimizar regex** para melhor performance
- ✅ **Limitar codecs** desnecessários
- ✅ **Configurar rate limiting** adequado

### Organização
- ✅ **Nomear regras claramente**
- ✅ **Agrupar por função** (emergência, local, externa)
- ✅ **Usar contextos separados** para diferentes tipos
- ✅ **Manter documentação** atualizada

---

## 🔧 Solução de Problemas

### Problemas Comuns

#### Dialplan não funciona
1. ✅ Verificar **regex da condição**
2. ✅ Conferir **prioridade da regra**
3. ✅ Validar **contexto correto**
4. ✅ Testar **ações manualmente**

#### Perfil SIP não carrega
1. ✅ Verificar **porta disponível**
2. ✅ Conferir **IP de bind**
3. ✅ Validar **JSON dos parâmetros**
4. ✅ Checar **logs do FreeSWITCH**

#### Reload falha
1. ✅ Verificar **sintaxe XML**
2. ✅ Conferir **permissões de arquivo**
3. ✅ Validar **configurações globais**
4. ✅ Revisar **logs de erro**

### Comandos de Debug

```bash
# Status do FreeSWITCH
fs_cli -x "status"

# Recarregar dialplan
fs_cli -x "reloadxml"

# Verificar perfis SIP
fs_cli -x "sofia status"

# Logs em tempo real
fs_cli -x "console loglevel debug"
```

---

## 📊 Monitoramento

### Métricas Importantes
- **Chamadas simultâneas** vs limite configurado
- **Taxa de chamadas** vs sessions_per_second
- **Uso de codecs** por perfil
- **Erros de dialplan** nos logs

### Alertas Recomendados
- 🚨 **CPU > 80%** durante picos
- 🚨 **Memória > 90%** do disponível
- 🚨 **Sessões > 90%** do limite
- 🚨 **Erros frequentes** nos logs

---

## 🔗 Integração com APIs

### Endpoints Disponíveis

```javascript
// Dialplans
GET    /freeswitch/dialplans
POST   /freeswitch/dialplans
PUT    /freeswitch/dialplans/:id
DELETE /freeswitch/dialplans/:id

// Perfis SIP
GET    /freeswitch/sip-profiles
POST   /freeswitch/sip-profiles
PUT    /freeswitch/sip-profiles/:id
DELETE /freeswitch/sip-profiles/:id

// Configuração Global
GET    /freeswitch/config
PUT    /freeswitch/config

// Controle
GET    /freeswitch/status
POST   /freeswitch/reload
```

### Exemplo de Uso

```javascript
// Criar novo dialplan via API
const dialplan = {
  name: "Teste API",
  condition: "^(\\d{3})$",
  context: "default",
  actions: ["bridge user/$1@${domain_name}"],
  enabled: true,
  priority: 50
};

await api.createDialplan(dialplan);
```

---

## 📚 Recursos Adicionais

### Documentação FreeSWITCH
- [Wiki Oficial](https://freeswitch.org/confluence/)
- [Dialplan Guide](https://freeswitch.org/confluence/display/FREESWITCH/Dialplan)
- [SIP Profiles](https://freeswitch.org/confluence/display/FREESWITCH/Sofia+SIP+Stack)

### Comunidade
- [FreeSWITCH Discord](https://discord.gg/freeswitch)
- [Lista de Email](https://lists.freeswitch.org/)
- [GitHub Issues](https://github.com/signalwire/freeswitch)

---

## 📝 Changelog

### Versão 1.0.0
- ✅ Interface de gerenciamento de dialplans
- ✅ Configuração de perfis SIP
- ✅ Configurações globais
- ✅ Visualização XML
- ✅ Controles de sistema
- ✅ APIs completas
- ✅ Segurança RLS

---

**💡 Dica**: Este painel oferece poder total sobre o FreeSWITCH. Use com responsabilidade e sempre faça backups antes de alterações importantes! 