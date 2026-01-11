// convert-json-to-sqlite.js
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

class JSONtoSQLiteConverter {
    constructor() {
        this.db = null;
        this.variantMap = new Map();
        this.categoryMap = new Map();
    }
    
    async convert(inputFile, outputFile) {
        console.log('🔄 Iniciando conversão JSON → SQLite...');
        
        try {
            // 1. Ler arquivo JSON
            const jsonData = this.readJSON(inputFile);
            
            // 2. Criar banco SQLite
            this.createDatabase(outputFile);
            
            // 3. Popular tabelas base
            this.populateBaseTables();
            
            // 4. Processar palavras
            this.processWords(jsonData.palavras || []);
            
            // 5. Otimizar banco
            this.optimizeDatabase();
            
            // 6. Gerar estatísticas
            this.generateStatistics();
            
            console.log('✅ Conversão concluída com sucesso!');
            
        } catch (error) {
            console.error('❌ Erro na conversão:', error);
            throw error;
        }
    }
    
    readJSON(inputFile) {
        if (!fs.existsSync(inputFile)) {
            throw new Error(`Arquivo não encontrado: ${inputFile}`);
        }
        
        const content = fs.readFileSync(inputFile, 'utf8');
        return JSON.parse(content);
    }
    
    createDatabase(outputFile) {
        // Remover arquivo existente
        if (fs.existsSync(outputFile)) {
            fs.unlinkSync(outputFile);
        }
        
        // Criar novo banco
        this.db = new Database(outputFile);
        
        // Executar schema
        const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
        this.db.exec(schema);
        
        console.log('🗃️ Banco de dados criado');
    }
    
    populateBaseTables() {
        // Mapear variantes
        const variantes = this.db.prepare('SELECT id, codigo FROM variantes').all();
        variantes.forEach(v => this.variantMap.set(v.codigo, v.id));
        
        // Mapear categorias
        const categorias = this.db.prepare('SELECT id, nome FROM categorias').all();
        categorias.forEach(c => this.categoryMap.set(c.nome.toLowerCase(), c.id));
    }
    
    processWords(palavras) {
        console.log(`📊 Processando ${palavras.length} palavras...`);
        
        const insertPalavra = this.db.prepare(`
            INSERT INTO palavras (
                palavra_emakhua, 
                classe_gramatical, 
                categoria, 
                genero, 
                numero, 
                frequencia,
                observacoes
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        
        const insertPalavraVariante = this.db.prepare(`
            INSERT OR IGNORE INTO palavra_variantes (
                palavra_id, 
                variante_id, 
                pronuncia, 
                tom, 
                plural,
                conjugacao
            ) VALUES (?, ?, ?, ?, ?, ?)
        `);
        
        const insertSignificado = this.db.prepare(`
            INSERT INTO significados (
                palavra_id,
                variante_id,
                ordem,
                definicao_emakhua,
                definicao_portugues,
                contexto,
                notas
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        
        const insertExemplo = this.db.prepare(`
            INSERT INTO exemplos (
                significado_id,
                tipo,
                texto,
                traducao,
                notas
            ) VALUES (?, ?, ?, ?, ?)
        `);
        
        const transaction = this.db.transaction((palavras) => {
            palavras.forEach((palavra, index) => {
                try {
                    // Inserir palavra principal
                    const categoriaId = palavra.categoria ? 
                        this.categoryMap.get(palavra.categoria.toLowerCase()) : null;
                    
                    const categoriaNome = categoriaId ? 
                        this.db.prepare('SELECT nome FROM categorias WHERE id = ?').get(categoriaId)?.nome : 
                        palavra.categoria;
                    
                    const result = insertPalavra.run(
                        palavra.palavra_emakhua,
                        palavra.classe_gramatical,
                        categoriaNome,
                        palavra.genero || null,
                        palavra.numero || null,
                        palavra.frequencia || 'média',
                        palavra.observacoes || null
                    );
                    
                    const palavraId = result.lastInsertRowid;
                    
                    // Processar variantes
                    if (palavra.variantes && typeof palavra.variantes === 'object') {
                        Object.entries(palavra.variantes).forEach(([variantCode, variantData]) => {
                            const varianteId = this.variantMap.get(variantCode);
                            
                            if (varianteId && varianteId !== this.variantMap.get('all')) {
                                // Inserir relação palavra-variante
                                insertPalavraVariante.run(
                                    palavraId,
                                    varianteId,
                                    variantData.pronuncia || null,
                                    variantData.tom || null,
                                    variantData.plural || null,
                                    variantData.conjugacao ? JSON.stringify(variantData.conjugacao) : null
                                );
                                
                                // Processar significados
                                if (variantData.significados && Array.isArray(variantData.significados)) {
                                    variantData.significados.forEach((significado, ordemIdx) => {
                                        const significadoResult = insertSignificado.run(
                                            palavraId,
                                            varianteId,
                                            ordemIdx + 1,
                                            significado.definicao_emakhua || '',
                                            significado.definicao_portugues || null,
                                            significado.contexto || null,
                                            significado.notas || null
                                        );
                                        
                                        const significadoId = significadoResult.lastInsertRowid;
                                        
                                        // Processar exemplos
                                        if (significado.exemplos && typeof significado.exemplos === 'object') {
                                            // Exemplo em Emakhua
                                            if (significado.exemplos.emakhua) {
                                                insertExemplo.run(
                                                    significadoId,
                                                    'emakhua',
                                                    significado.exemplos.emakhua,
                                                    significado.exemplos.portugues || null,
                                                    null
                                                );
                                            }
                                            
                                            // Exemplo em Português
                                            if (significado.exemplos.portugues) {
                                                insertExemplo.run(
                                                    significadoId,
                                                    'portugues',
                                                    significado.exemplos.portugues,
                                                    null,
                                                    null
                                                );
                                            }
                                        }
                                    });
                                }
                            }
                        });
                    }
                    
                    // Progresso
                    if ((index + 1) % 100 === 0) {
                        console.log(`  Processadas ${index + 1} palavras...`);
                    }
                    
                } catch (error) {
                    console.error(`Erro ao processar palavra ${index + 1}:`, error);
                }
            });
        });
        
        // Executar em transação
        transaction(palavras);
        
        console.log(`✅ ${palavras.length} palavras processadas`);
    }
    
    optimizeDatabase() {
        console.log('⚡ Otimizando banco de dados...');
        
        // Vacuum para compactar
        this.db.exec('VACUUM');
        
        // Analisar para otimização
        this.db.exec('ANALYZE');
        
        // Configurar pragmas finais
        this.db.exec('PRAGMA optimize');
        
        console.log('✅ Banco otimizado');
    }
    
    generateStatistics() {
        const stats = {
            total_palavras: this.db.prepare('SELECT COUNT(*) as total FROM palavras').get().total,
            total_variantes: this.db.prepare('SELECT COUNT(*) as total FROM variantes WHERE codigo != "all"').get().total,
            total_categorias: this.db.prepare('SELECT COUNT(*) as total FROM categorias').get().total,
            total_significados: this.db.prepare('SELECT COUNT(*) as total FROM significados').get().total,
            total_exemplos: this.db.prepare('SELECT COUNT(*) as total FROM exemplos').get().total,
            tamanho_arquivo: fs.statSync(this.db.name).size
        };
        
        console.log('\n📊 ESTATÍSTICAS FINAIS:');
        console.log(`   Palavras: ${stats.total_palavras}`);
        console.log(`   Variantes: ${stats.total_variantes}`);
        console.log(`   Categorias: ${stats.total_categorias}`);
        console.log(`   Significados: ${stats.total_significados}`);
        console.log(`   Exemplos: ${stats.total_exemplos}`);
        console.log(`   Tamanho do arquivo: ${(stats.tamanho_arquivo / 1024 / 1024).toFixed(2)} MB`);
        
        // Atualizar configurações
        this.db.prepare(`
            UPDATE configuracoes 
            SET valor = ? 
            WHERE chave = 'total_palavras'
        `).run(stats.total_palavras.toString());
        
        this.db.prepare(`
            UPDATE configuracoes 
            SET valor = datetime('now') 
            WHERE chave = 'ultima_atualizacao'
        `).run();
        
        // Salvar estatísticas em arquivo
        const statsFile = this.db.name.replace('.db', '_stats.json');
        fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));
        
        console.log(`📁 Estatísticas salvas em: ${statsFile}`);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    const converter = new JSONtoSQLiteConverter();
    
    const args = process.argv.slice(2);
    const inputFile = args[0] || './dicionario_original.json';
    const outputFile = args[1] || './data/dicionario.db';
    
    converter.convert(inputFile, outputFile)
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = JSONtoSQLiteConverter;
