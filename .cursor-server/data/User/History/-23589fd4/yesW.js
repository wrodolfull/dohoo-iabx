const fs = require('fs').promises;
const path = require('path');

async function testFileCreation() {
  console.log('🧪 === TESTE DE CRIAÇÃO DE ARQUIVOS ===');
  
  const testPaths = [
    '/etc/freeswitch/directory/test.xml',
    '/etc/freeswitch/dialplan/test.xml', 
    '/etc/freeswitch/sip_profiles/test.xml'
  ];
  
  for (const filePath of testPaths) {
    console.log(`\n📝 Testando: ${filePath}`);
    
    try {
      // Verificar se o diretório pai existe
      const dir = path.dirname(filePath);
      console.log(`   📁 Diretório: ${dir}`);
      
      try {
        const dirStats = await fs.stat(dir);
        console.log(`   ✅ Diretório existe: ${dir}`);
      } catch (err) {
        console.log(`   ❌ Diretório não existe: ${dir}`);
        console.log(`   🔧 Tentando criar...`);
        
        try {
          await fs.mkdir(dir, { recursive: true });
          console.log(`   ✅ Diretório criado: ${dir}`);
        } catch (mkdirErr) {
          console.log(`   ❌ Erro ao criar diretório: ${mkdirErr.message}`);
          continue;
        }
      }
      
      // Tentar escrever arquivo
      const testContent = `<?xml version="1.0" encoding="utf-8"?>
<test>
  <message>Arquivo de teste criado em ${new Date().toISOString()}</message>
</test>`;
      
      console.log(`   📄 Escrevendo arquivo...`);
      await fs.writeFile(filePath, testContent, 'utf8');
      
      // Verificar se foi criado
      const fileStats = await fs.stat(filePath);
      console.log(`   ✅ Arquivo criado: ${filePath} (${fileStats.size} bytes)`);
      
      // Ler conteúdo para verificar
      const readContent = await fs.readFile(filePath, 'utf8');
      console.log(`   📖 Conteúdo lido: ${readContent.length} caracteres`);
      
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }
  }
  
  console.log('\n🎯 === TESTE CONCLUÍDO ===');
}

testFileCreation(); 