// shared-database.js - Banco de dados compartilhado entre todas as páginas
class SharedDatabase {
    constructor() {
        this.db = null;
        this.SQL = null;
        this.isInitialized = false;
        this.databaseName = 'emakhua_shared_db';
    }
    
    // Inicializar banco (chamar em todas as páginas)
    async init() {
        // Se já está inicializado, retorna
        if (this.isInitialized && this.db) {
            return true;
        }
        
        try {
            console.log('🔄 Inicializando banco de dados compartilhado...');
            
            // Carregar SQL.js (se não estiver carregado)
            if (typeof initSqlJs === 'undefined') {
                console.error('SQL.js não está carregado!');
                return false;
            }
            
            // Usar SQL.js global
            this.SQL = window.SQL || await initSqlJs({
                locateFile: file => `lib/${file}`
            });
            
            // Carregar banco do localStorage
            const savedDB = localStorage.getItem(this.databaseName);
            
            if (savedDB) {
                console.log('📂 Carregando banco existente...');
                const data = new Uint8Array(JSON.parse(savedDB));
                this.db = new this.SQL.Database(data);
            } else {
                console.log('🆕 Criando novo banco...');
                this.db = new this.SQL.Database();
                this.createTables();
                this.insertDefaultData();
                this.saveToLocalStorage();
            }
            
            this.isInitialized = true;
            console.log('✅ Banco compartilhado inicializado com sucesso!');
            console.log(`📊 Total de palavras: ${this.getTotalWords()}`);
            return true;
            
        } catch (error) {
            console.error('❌ Erro ao inicializar banco:', error);
            return false;
        }
    }
    
    // Criar tabelas
    createTables() {
        console.log('📝 Criando tabelas...');
        
        // Tabela principal de palavras
        this.db.run(`
            CREATE TABLE palavras (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                emakhua TEXT NOT NULL,
                portugues TEXT NOT NULL,
                classe_gramatical TEXT,
                tom TEXT,
                exemplo_emakhua TEXT,
                exemplo_traducao TEXT,
                data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
                ativo BOOLEAN DEFAULT 1,
                verificada BOOLEAN DEFAULT 1
            )
        `);
        
        // Índices para performance
        this.db.run('CREATE INDEX idx_emakhua ON palavras(emakhua)');
        this.db.run('CREATE INDEX idx_portugues ON palavras(portugues)');
        this.db.run('CREATE INDEX idx_classe ON palavras(classe_gramatical)');
        
        console.log('✅ Tabelas criadas!');
    }
    
    // Inserir dados iniciais
    insertDefaultData() {
        console.log('📋 Inserindo dados iniciais...');
        
        const palavrasIniciais = [
            ['muɾé', 'cão, cachorro', 'substantivo', 'HL', 
             'Muɾé wa mwene wapɨhɨra', 'O cão do dono está latindo'],
            
            ['muthu', 'pessoa, ser humano', 'substantivo', 'HL',
             'Muthu wa kuwa ni mzuri', 'Aquela pessoa é boa'],
            
            ['kulowa', 'comer', 'verbo', 'LHL',
             'Ana kulowa wali', 'Ele está comendo arroz'],
            
            ['muti', 'árvore', 'substantivo', 'HL',
             'Muti wangu', 'Minha árvore'],
            
            ['nyumba', 'casa', 'substantivo', 'LH',
             'Nyumba yake', 'Sua casa']
        ];
        
        const stmt = this.db.prepare(`
            INSERT INTO palavras (emakhua, portugues, classe_gramatical, tom, exemplo_emakhua, exemplo_traducao)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        
        palavrasIniciais.forEach(palavra => {
            stmt.run(palavra);
        });
        
        stmt.free();
        console.log(`✅ ${palavrasIniciais.length} palavras iniciais adicionadas`);
    }
    
    // ========== FUNÇÕES PÚBLICAS ==========
    
    // Buscar todas as palavras (para o dicionário principal)
    getAllWords() {
        if (!this.db) return [];
        
        try {
            const result = this.db.exec(`
                SELECT * FROM palavras 
                WHERE ativo = 1 
                ORDER BY emakhua COLLATE NOCASE
            `);
            
            if (result.length === 0) return [];
            
            // Converter para array de objetos
            const columns = result[0].columns;
            const values = result[0].values;
            
            return values.map(row => {
                const obj = {};
                columns.forEach((col, index) => {
                    obj[col] = row[index];
                });
                return obj;
            });
            
        } catch (error) {
            console.error('Erro ao buscar palavras:', error);
            return [];
        }
    }
    
    // Buscar palavras com filtro (para busca)
    searchWords(term, direction = 'em-pt') {
        if (!this.db) return [];
        
        try {
            let query = `
                SELECT * FROM palavras 
                WHERE ativo = 1 
                AND verificada = 1
            `;
            
            if (direction === 'em-pt') {
                query += ` AND emakhua LIKE '%${term}%'`;
            } else {
                query += ` AND portugues LIKE '%${term}%'`;
            }
            
            query += ` ORDER BY emakhua COLLATE NOCASE`;
            
            const result = this.db.exec(query);
            
            if (result.length === 0) return [];
            
            const columns = result[0].columns;
            const values = result[0].values;
            
            return values.map(row => {
                const obj = {};
                columns.forEach((col, index) => {
                    obj[col] = row[index];
                });
                return obj;
            });
            
        } catch (error) {
            console.error('Erro na busca:', error);
            return [];
        }
    }
    
    // Adicionar nova palavra (para admin)
    addWord(wordData) {
        if (!this.db) return { success: false, error: 'Banco não inicializado' };
        
        try {
            // Verificar se palavra já existe
            const checkResult = this.db.exec(
                `SELECT id FROM palavras WHERE emakhua = '${wordData.emakhua}'`
            );
            
            if (checkResult.length > 0 && checkResult[0].values.length > 0) {
                return { 
                    success: false, 
                    error: 'Palavra já existe no dicionário' 
                };
            }
            
            // Inserir nova palavra
            const stmt = this.db.prepare(`
                INSERT INTO palavras (emakhua, portugues, classe_gramatical, tom, 
                                     exemplo_emakhua, exemplo_traducao, verificada)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `);
            
            stmt.run([
                wordData.emakhua,
                wordData.portugues,
                wordData.classe_gramatical || null,
                wordData.tom || null,
                wordData.exemplo_emakhua || null,
                wordData.exemplo_traducao || null,
                1 // Sempre verificada quando adicionada pelo admin
            ]);
            
            stmt.free();
            
            // Salvar alterações
            this.saveToLocalStorage();
            
            // Obter ID da palavra inserida
            const result = this.db.exec("SELECT last_insert_rowid() as id");
            const id = result[0].values[0][0];
            
            console.log(`✅ Palavra adicionada: ${wordData.emakhua} (ID: ${id})`);
            
            return { 
                success: true, 
                id: id,
                message: 'Palavra adicionada com sucesso!' 
            };
            
        } catch (error) {
            console.error('Erro ao adicionar palavra:', error);
            return { 
                success: false, 
                error: error.message 
            };
        }
    }
    
    // Obter total de palavras
    getTotalWords() {
        if (!this.db) return 0;
        
        try {
            const result = this.db.exec("SELECT COUNT(*) as total FROM palavras WHERE ativo = 1");
            return result[0].values[0][0] || 0;
        } catch (error) {
            console.error('Erro ao contar palavras:', error);
            return 0;
        }
    }
    
    // Obter estatísticas
    getStats() {
        if (!this.db) return {};
        
        try {
            const stats = {};
            
            // Total de palavras
            const total = this.db.exec("SELECT COUNT(*) as total FROM palavras WHERE ativo = 1");
            stats.total = total[0].values[0][0] || 0;
            
            // Por classe gramatical
            const porClasse = this.db.exec(`
                SELECT classe_gramatical, COUNT(*) as total 
                FROM palavras 
                WHERE ativo = 1 AND classe_gramatical IS NOT NULL
                GROUP BY classe_gramatical
            `);
            
            stats.porClasse = porClasse[0]?.values.map(row => ({
                classe: row[0],
                total: row[1]
            })) || [];
            
            // Últimas adições
            const recentes = this.db.exec(`
                SELECT emakhua, portugues, data_cadastro 
                FROM palavras 
                WHERE ativo = 1
                ORDER BY data_cadastro DESC 
                LIMIT 5
            `);
            
            stats.recentes = recentes[0]?.values.map(row => ({
                emakhua: row[0],
                portugues: row[1],
                data: row[2]
            })) || [];
            
            return stats;
            
        } catch (error) {
            console.error('Erro ao obter estatísticas:', error);
            return {};
        }
    }
    
    // Salvar no localStorage
    saveToLocalStorage() {
        if (!this.db) return;
        
        try {
            const data = this.db.export();
            const dataString = JSON.stringify(Array.from(new Uint8Array(data)));
            localStorage.setItem(this.databaseName, dataString);
            console.log('💾 Banco salvo no localStorage');
        } catch (error) {
            console.error('Erro ao salvar banco:', error);
        }
    }
    
    // Fazer backup
    backup() {
        if (!this.db) return null;
        
        try {
            const data = this.db.export();
            return {
                data: data,
                size: data.byteLength,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Erro ao criar backup:', error);
            return null;
        }
    }
    
    // Restaurar de backup
    restore(backupData) {
        try {
            // Fechar banco atual
            if (this.db) {
                this.db.close();
            }
            
            // Criar novo banco com backup
            this.db = new this.SQL.Database(new Uint8Array(backupData));
            
            // Salvar no localStorage
            this.saveToLocalStorage();
            
            console.log('✅ Banco restaurado do backup');
            return true;
            
        } catch (error) {
            console.error('Erro ao restaurar backup:', error);
            return false;
        }
    }
    
    // Fechar conexão
    close() {
        if (this.db) {
            this.db.close();
            this.isInitialized = false;
        }
    }
}

// Criar instância global
window.SharedDB = new SharedDatabase();
