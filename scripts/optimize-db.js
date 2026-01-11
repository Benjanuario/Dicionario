// scripts/optimize-db.js
const Database = require('better-sqlite3');
const fs = require('fs');

function optimizeDatabase(dbPath) {
  const db = new Database(dbPath);
  
  console.log('⚡ Otimizando banco de dados...');
  
  // Vacuum
  db.exec('VACUUM');
  
  // Rebuild indexes
  db.exec('REINDEX');
  
  // Analyze for query optimization
  db.exec('ANALYZE');
  
  // Update statistics
  db.exec('PRAGMA optimize');
  
  const stats = db.prepare('SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()').get();
  
  console.log(`✅ Banco otimizado. Tamanho: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  
  db.close();
}

// Executar
if (require.main === module) {
  const dbPath = process.argv[2] || './data/dicionario.db';
  optimizeDatabase(dbPath);
}

module.exports = optimizeDatabase;
