# 🔍 Debug: Integração FreeSWITCH

## Problema
Quando você cria um tenant no frontend, ele não aparece no FreeSWITCH.

## Solução Passo a Passo

### 1. Verificar se o Backend está Rodando
```bash
# Verificar se o backend está ativo
curl http://localhost:3001/health

# Se não estiver rodando, iniciar:
cd /root/backend
nohup node index.js > backend.log 2>&1 &
```

### 2. Testar Criação de Arquivos
```bash
# Testar se o backend consegue criar arquivos no FreeSWITCH
curl -X POST http://localhost:3001/test-file-creation
```

### 3. Verificar Logs Detalhados
```bash
# Ver logs em tempo real
tail -f /root/backend/backend.log

# Ver últimas linhas
tail -20 /root/backend/backend.log
```

### 4. Testar Integração Completa
```bash
# Executar teste completo
./test-all.sh

# Ou executar manualmente:
curl -X POST http://localhost:3001/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Empresa Teste",
    "domain": "teste.local", 
    "contact_email": "admin@teste.com"
  }'
```

### 5. Verificar Arquivos XML Criados
```bash
# Verificar se os arquivos foram criados
ls -la /etc/freeswitch/directory/
ls -la /etc/freeswitch/dialplan/
ls -la /etc/freeswitch/sip_profiles/

# Verificar arquivos recentes
find /etc/freeswitch -name "*.xml" -mmin -10
```

### 6. Verificar Status do FreeSWITCH
```bash
# Verificar se FreeSWITCH está rodando
pgrep -f freeswitch

# Verificar fs_cli
ls -la /usr/local/freeswitch/bin/fs_cli

# Testar comando de reload
/usr/local/freeswitch/bin/fs_cli -x "status"
```

## Possíveis Problemas e Soluções

### Problema 1: Backend não está rodando
**Sintoma**: Erro 404 ou conexão recusada
**Solução**: 
```bash
cd /root/backend
nohup node index.js > backend.log 2>&1 &
```

### Problema 2: Permissões de arquivo
**Sintoma**: Erro "EACCES" nos logs
**Solução**:
```bash
# Verificar permissões
ls -la /etc/freeswitch/

# Se necessário, ajustar permissões
sudo chown -R root:root /etc/freeswitch/
sudo chmod -R 755 /etc/freeswitch/
```

### Problema 3: Diretórios não existem
**Sintoma**: Erro "ENOENT" nos logs
**Solução**:
```bash
# Criar diretórios se não existirem
sudo mkdir -p /etc/freeswitch/directory
sudo mkdir -p /etc/freeswitch/dialplan
sudo mkdir -p /etc/freeswitch/sip_profiles
```

### Problema 4: FreeSWITCH não está rodando
**Sintoma**: Erro ao executar fs_cli
**Solução**:
```bash
# Verificar status
systemctl status freeswitch

# Iniciar se necessário
sudo systemctl start freeswitch
```

## Scripts de Debug Disponíveis

1. **test-all.sh** - Teste completo de integração
2. **check-integration.sh** - Verificação passo a passo
3. **test-freeswitch.sh** - Teste específico do FreeSWITCH
4. **debug-freeswitch.js** - Script Node.js para teste direto
5. **test-file-creation.js** - Teste de criação de arquivos

## Endpoints de Teste

- `POST /test-file-creation` - Testa criação de arquivos
- `POST /test-freeswitch/:tenantId` - Testa integração específica
- `POST /tenants` - Cria tenant (com integração automática)

## Logs Importantes

Os logs detalhados estão em `/root/backend/backend.log` e incluem:
- Tentativas de criação de diretórios
- Tentativas de escrita de arquivos
- Comandos de reload do FreeSWITCH
- Erros detalhados com stack trace

## Próximos Passos

1. Execute `./test-all.sh` para diagnóstico completo
2. Verifique os logs em tempo real: `tail -f /root/backend/backend.log`
3. Se houver erros específicos, consulte as soluções acima
4. Teste a criação de um tenant via frontend novamente

## Contato

Se o problema persistir, forneça:
- Output do comando `./test-all.sh`
- Últimas 50 linhas do log: `tail -50 /root/backend/backend.log`
- Erro específico que aparece no frontend 