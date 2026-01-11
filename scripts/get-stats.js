// scripts/get-stats.js
const Database = require('better-sqlite3');

function getStatistics(dbPath) {
  const db = new Database(dbPath);
  
  const stats = {
    palavras: db.prepare('SELECT COUNT(*) as total FROM palavras').get(),
    variantes: db.prepare('SELECT COUNT(*) as total FROM variantes WHERE codigo != "all"').get(),
    categorias: db.prepare('SELECT COUNT(*) as total FROM categorias').get(),
    significados: db.prepare('SELECT COUNT(*) as total FROM significados').get(),
    exemplos: db.prepare('SELECT COUNT(*) as total FROM exemplos').get(),
    por_classe: db.prepare(`
      SELECT classe_gramatical, COUNT(*) as total 
      FROM palavras 
      GROUP BY classe_gramatical 
      ORDER BY total DESC
    `).all(),
    por_categoria: db.prepare(`
      SELECT categoria, COUNT(*) as total 
      FROM palavras 
      WHERE categoria IS NOT NULL 
      GROUP BY categoria 
      ORDER BY total DESC
      LIMIT 10
    `).all(),
    configuracoes: db.prepare('SELECT * FROM configuracoes').all()
  };
  
  db.close();
  
  console.log('\n📊 ESTATÍSTICAS DO DICIONÁRIO EMAKHUA');
  console.log('=======================================');
  console.log(`Palavras: ${stats.palavras.total}`);
  console.log(`Variantes: ${stats.variantes.total}`);
  console.log(`Categorias: ${stats.categorias.total}`);
  console.log(`Significados: ${stats.significados.total}`);
  console.log(`Exemplos: ${stats.exemplos.total}`);
  
  console.log('\n📈 Distribuição por Classe Gramatical:');
  stats.por_classe.forEach(item => {
    console.log(`  ${item.classe_gramatical}: ${item.total}`);
  });
  
  console.log('\n🏷️ Top 10 Categorias:');
  stats.por_categoria.forEach(item => {
    console.log(`  ${item.categoria}: ${item.total}`);
  });
  
  console.log('\n⚙️ Configurações:');
  stats.configuracoes.forEach(config => {
    console.log(`  ${config.chave}: ${config.valor}`);
  });
  
  return stats;
}

// Executar
if (require.main === module) {
  const dbPath = process.argv[2] || './data/dicionario.db';
  getStatistics(dbPath);
}

module.exports = getStatistics;
