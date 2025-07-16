# Configuração URA Builder com ElevenLabs

## Variáveis de Ambiente Necessárias

### Backend (.env)
```bash
# ElevenLabs Configuration
ELEVENLABS_API_KEY=your_elevenlabs_api_key

# TTS Audio Storage
TTS_AUDIO_DIR=/var/lib/tts-audios

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Estrutura da Tabela audio_files no Supabase

```sql
CREATE TABLE audio_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  text TEXT NOT NULL,
  voice_id VARCHAR(100) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_audio_files_tenant_id ON audio_files(tenant_id);
CREATE INDEX idx_audio_files_created_at ON audio_files(created_at);
```

## Estrutura da Tabela ura no Supabase

```sql
CREATE TABLE ura (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  flow JSONB DEFAULT '{"nodes": [], "edges": []}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_ura_tenant_id ON ura(tenant_id);
CREATE INDEX idx_ura_is_active ON ura(is_active);
CREATE INDEX idx_ura_created_at ON ura(created_at);
```

## Funcionalidades Implementadas

### Backend
- ✅ Endpoints CRUD para URA
- ✅ Integração com ElevenLabs API
- ✅ Geração e armazenamento de áudios TTS
- ✅ Validação de fluxos de URA
- ✅ Templates pré-configurados
- ✅ Geração de dialplan XML para FreeSWITCH
- ✅ Provisionamento automático no FreeSWITCH

### Frontend
- ✅ Editor visual de fluxos com ReactFlow
- ✅ Novos tipos de nós: TTS, Schedule, Hangup
- ✅ Interface para criação de áudios TTS
- ✅ Validação visual de fluxos
- ✅ Sistema de templates
- ✅ Integração com ElevenLabs
- ✅ Provisionamento no FreeSWITCH

### Tipos de Nós Suportados
1. **Menu** - Menu de opções DTMF
2. **Extension** - Transferência para ramal
3. **Group** - Transferência para grupo de ramais
4. **TTS** - Reprodução de áudio TTS
5. **Schedule** - Verificação de horário de funcionamento
6. **Hangup** - Encerramento de chamada
7. **AI** - Integração com IA (preparado para futuro)

## Como Usar

1. **Configurar ElevenLabs**:
   - Obter API key em https://elevenlabs.io
   - Configurar no backend

2. **Criar Áudios TTS**:
   - Acessar página URA Builder
   - Clicar em "Criar Áudio TTS"
   - Selecionar voz e digitar texto
   - Gerar áudio

3. **Criar URA**:
   - Usar template ou criar do zero
   - Abrir editor visual
   - Adicionar nós e conectar
   - Salvar e validar

4. **Provisionar no FreeSWITCH**:
   - Clicar em "Provisionar" na lista de URAs
   - Sistema gera dialplan XML automaticamente
   - FreeSWITCH é recarregado

## Próximos Passos

- [ ] Teste de áudio antes de salvar
- [ ] Configuração avançada de nós
- [ ] Mais templates de URA
- [ ] Integração com IA
- [ ] Relatórios de uso
- [ ] Backup/restore de URAs 