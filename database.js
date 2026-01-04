// database.js - Sistema completo de banco de dados
class EmakhuaDatabase {
    constructor() {
        this.db = null;
        this.SQL = null;
        this.isInitialized = false;
    }
    
    // Inicializar banco de dados
    async init() {
        try {
            // Carregar SQL.js
            this.SQL = await window.initSqlJs({
                locateFile: file => `lib/${file}`
            });
            
            // Carregar banco existente ou criar novo
            await this.loadDatabase();
            
            this.isInitialized = true;
            console.log('✅ Banco de dados inicializado');
            return true;
            
        } catch (error) {
            console.error('❌ Erro ao inicializar banco:', error);
            return false;
        }
    }
    
    // Carregar ou criar banco
    async loadDatabase() {
        const savedDB = localStorage.getItem('emakhua_database_v2');
        
        if (savedDB) {
            // Carregar banco existente
            const data = new Uint8Array(JSON.parse(savedDB));
            this.db = new this.SQL.Database(data);
            console.log('📂 Banco carregado do localStorage');
        } else {
            // Criar novo banco com estrutura completa
            this.db = new this.SQL.Database();
            this.createTables();
            this.insertDefaultData();
            this.saveToLocalStorage();
            console.log('🆕 Novo banco criado');
        }
    }
    
    // Criar todas as tabelas
    createTables() {
        // Tabela principal de palavras
        this.db.run(`
            CREATE TABLE IF NOT EXISTS palavras (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                emakhua TEXT NOT NULL UNIQUE,
                portugues TEXT NOT NULL,
                classe_gramatical TEXT,
                tom TEXT,
                dialeto TEXT DEFAULT 'padrão',
                exemplo_emakhua TEXT,
                exemplo_traducao TEXT,
                notas TEXT,
                data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
                data_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP,
                usuario_cadastro TEXT DEFAULT 'admin',
                ativo BOOLEAN DEFAULT 1,
                verificada BOOLEAN DEFAULT 0
            )
        `);
        
        // Tabela de categorias
        this.db.run(`
            CREATE TABLE IF NOT EXISTS categorias (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL UNIQUE,
                descricao TEXT,
                icone TEXT,
                cor TEXT DEFAULT '#667eea',
                ordem INTEGER DEFAULT 0
            )
        `);
        
        // Tabela de relação palavra-categoria
        this.db.run(`
            CREATE TABLE IF NOT EXISTS palavra_categoria (
                palavra_id INTEGER NOT NULL,
                categoria_id INTEGER NOT NULL,
                PRIMARY KEY (palavra_id, categoria_id),
                FOREIGN KEY (palavra_id) REFERENCES palavras(id) ON DELETE CASCADE,
                FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE CASCADE
            )
        `);
        
        // Tabela de sinônimos
        this.db.run(`
            CREATE TABLE IF NOT EXISTS sinonimos (
                palavra_id INTEGER NOT NULL,
                sinonimo_id INTEGER NOT NULL,
                tipo TEXT DEFAULT 'sinonimo',
                PRIMARY KEY (palavra_id, sinonimo_id),
                FOREIGN KEY (palavra_id) REFERENCES palavras(id),
                FOREIGN KEY (sinonimo_id) REFERENCES palavras(id)
            )
        `);
        
        // Tabela de áudios
        this.db.run(`
            CREATE TABLE IF NOT EXISTS audios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                palavra_id INTEGER NOT NULL,
                tipo TEXT DEFAULT 'pronuncia',
                filename TEXT,
                duracao INTEGER,
                qualidade TEXT DEFAULT 'alta',
                dialeto TEXT,
                data_upload DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (palavra_id) REFERENCES palavras(id) ON DELETE CASCADE
            )
        `);
        
        // Tabela de estatísticas de uso
        this.db.run(`
            CREATE TABLE IF NOT EXISTS estatisticas (
                palavra_id INTEGER NOT NULL,
                buscas INTEGER DEFAULT 0,
                visualizacoes INTEGER DEFAULT 0,
                ultima_busca DATETIME,
                FOREIGN KEY (palavra_id) REFERENCES palavras(id) ON DELETE CASCADE
            )
        `);
        
        // Índices para performance
        this.db.run('CREATE INDEX IF NOT EXISTS idx_emakhua ON palavras(emakhua)');
        this.db.run('CREATE INDEX IF NOT EXISTS idx_portugues ON palavras(portugues)');
        this.db.run('CREATE INDEX IF NOT EXISTS idx_classe ON palavras(classe_gramatical)');
        this.db.run('CREATE INDEX IF NOT EXISTS idx_data ON palavras(data_cadastro)');
    }
    
    // Inserir dados padrão
    insertDefaultData() {
        // Categorias padrão
        const categorias = [
            ['Animais', 'Animais e seres vivos', 'fas fa-paw', '#38a169'],
            ['Família', 'Parentesco e relações familiares', 'fas fa-users', '#e53e3e'],
            ['Natureza', 'Elementos naturais', 'fas fa-tree', '#2f855a'],
            ['Alimentos', 'Comidas e bebidas', 'fas fa-utensils', '#d69e2e'],
            ['Corpo Humano', 'Partes do corpo', 'fas fa-user-md', '#3182ce'],
            ['Verbos', 'Ações e atividades', 'fas fa-running', '#805ad5'],
            ['Adjetivos', 'Qualidades e características', 'fas fa-font', '#d53f8c'],
            ['Números', 'Números e quantidades', 'fas fa-sort-numeric-up', '#dd6b20'],
            ['Cores', 'Cores', 'fas fa-palette', '#ed8936'],
            ['Tempo', 'Tempo, dias, meses', 'fas fa-clock', '#4c51bf']
        ];
        
        const stmtCategoria = this.db.prepare(`
            INSERT INTO categorias (nome, descricao, icone, cor) 
            VALUES (?, ?, ?, ?)
        `);
        
        categorias.forEach((cat, index) => {
            stmtCategoria.run([cat[0], cat[1], cat[2], cat[3]]);
        });
        stmtCategoria.free();
        
        // Palavras de exemplo
        const palavrasExemplo = [
            ['muɾé', 'cão, cachorro', 'substantivo', 'HL', 'padrão', 
             'Muɾé wa mwene wapɨhɨra', 'O cão do dono está latindo',
             'Animal doméstico da família dos canídeos'],
            
            ['muthu', 'pessoa, ser humano', 'substantivo', 'HL', 'padrão',
             'Muthu wa kuwa ni mzuri', 'Aquela pessoa é boa',
             'Termo geral para pessoa'],
            
            ['kulowa', 'comer', 'verbo', 'LHL', 'padrão',
             'Ana kulowa wali', 'Ele está comendo arroz',
             'Verbo de ação básica']
        ];
        
        const stmtPalavra = this.db.prepare(`
            INSERT INTO palavras (emakhua, portugues, classe_gramatical, tom, dialeto, 
                                 exemplo_emakhua, exemplo_traducao, notas, verificada)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
        `);
        
        palavrasExemplo.forEach(palavra => {
            stmtPalavra.run(palavra);
        });
        stmtPalavra.free();
    }
    
    // ========== OPERAÇÕES CRUD ==========
    
    // Adicionar nova palavra
    adicionarPalavra(palavraData) {
        try {
            const stmt = this.db.prepare(`
                INSERT INTO palavras (
                    emakhua, portugues, classe_gramatical, tom, dialeto,
                    exemplo_emakhua, exemplo_traducao, notas, verificada
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            
            stmt.run([
                palavraData.emakhua,
                palavraData.portugues,
                palavraData.classe_gramatical || null,
                palavraData.tom || null,
                palavraData.dialeto || 'padrão',
                palavraData.exemplo_emakhua || null,
                palavraData.exemplo_traducao || null,
                palavraData.notas || null,
                palavraData.verificada || 0
            ]);
            
            const id = this.db.exec("SELECT last_insert_rowid() as id")[0].values[0][0];
            stmt.free();
            
            // Adicionar categorias se fornecidas
            if (palavraData.categorias && palavraData.categorias.length > 0) {
                this.adicionarCategoriasPalavra(id, palavraData.categorias);
            }
            
            // Salvar alterações
            this.saveToLocalStorage();
            
            return { success: true, id: id };
            
        } catch (error) {
            console.error('Erro ao adicionar palavra:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Buscar palavras
    buscarPalavras(filtros = {}) {
        try {
            let query = 'SELECT * FROM palavras WHERE 1=1';
            const params = [];
            
            if (filtros.termo) {
                query += ' AND (emakhua LIKE ? OR portugues LIKE ?)';
                params.push(`%${filtros.termo}%`, `%${filtros.termo}%`);
            }
            
            if (filtros.classe) {
                query += ' AND classe_gramatical = ?';
                params.push(filtros.classe);
            }
            
            if (filtros.dialeto) {
                query += ' AND dialeto = ?';
                params.push(filtros.dialeto);
            }
            
            if (filtros.verificada !== undefined) {
                query += ' AND verificada = ?';
                params.push(filtros.verificada ? 1 : 0);
            }
            
            query += ' ORDER BY emakhua COLLATE NOCASE';
            
            if (filtros.limite) {
                query += ' LIMIT ?';
                params.push(filtros.limite);
            }
            
            const stmt = this.db.prepare(query);
            stmt.bind(params);
            
            const resultados = [];
            while (stmt.step()) {
                resultados.push(stmt.getAsObject());
            }
            stmt.free();
            
            return resultados;
            
        } catch (error) {
            console.error('Erro na busca:', error);
            return [];
        }
    }
    
    // Buscar palavra por ID
    buscarPalavraPorId(id) {
        try {
            const stmt = this.db.prepare('SELECT * FROM palavras WHERE id = ?');
            stmt.bind([id]);
            
            const palavra = stmt.step() ? stmt.getAsObject() : null;
            stmt.free();
            
            if (palavra) {
                // Buscar categorias da palavra
                palavra.categorias = this.buscarCategoriasPalavra(id);
            }
            
            return palavra;
            
        } catch (error) {
            console.error('Erro ao buscar palavra:', error);
            return null;
        }
    }
    
    // Atualizar palavra
    atualizarPalavra(id, dados) {
        try {
            const campos = [];
            const valores = [];
            
            // Construir query dinamicamente
            const camposPermitidos = [
                'emakhua', 'portugues', 'classe_gramatical', 'tom', 'dialeto',
                'exemplo_emakhua', 'exemplo_traducao', 'notas', 'verificada', 'ativo'
            ];
            
            for (const [chave, valor] of Object.entries(dados)) {
                if (camposPermitidos.includes(chave)) {
                    campos.push(`${chave} = ?`);
                    valores.push(valor);
                }
            }
            
            if (campos.length === 0) {
                return { success: false, error: 'Nenhum campo válido para atualizar' };
            }
            
            // Adicionar data de atualização
            campos.push('data_atualizacao = CURRENT_TIMESTAMP');
            
            valores.push(id);
            
            const query = `UPDATE palavras SET ${campos.join(', ')} WHERE id = ?`;
            this.db.run(query, valores);
            
            // Atualizar categorias se fornecidas
            if (dados.categorias) {
                // Remover categorias antigas
                this.db.run('DELETE FROM palavra_categoria WHERE palavra_id = ?', [id]);
                // Adicionar novas categorias
                this.adicionarCategoriasPalavra(id, dados.categorias);
            }
            
            this.saveToLocalStorage();
            
            return { success: true };
            
        } catch (error) {
            console.error('Erro ao atualizar palavra:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Excluir palavra
    excluirPalavra(id) {
        try {
            this.db.run('DELETE FROM palavras WHERE id = ?', [id]);
            this.saveToLocalStorage();
            return { success: true };
        } catch (error) {
            console.error('Erro ao excluir palavra:', error);
            return { success: false, error: error.message };
        }
    }
    
    // ========== CATEGORIAS ==========
    
    // Adicionar categorias a uma palavra
    adicionarCategoriasPalavra(palavraId, categorias) {
        try {
            const stmt = this.db.prepare(`
                INSERT INTO palavra_categoria (palavra_id, categoria_id) 
                VALUES (?, ?)
            `);
            
            categorias.forEach(categoriaId => {
                stmt.run([palavraId, categoriaId]);
            });
            
            stmt.free();
            
        } catch (error) {
            console.error('Erro ao adicionar categorias:', error);
        }
    }
    
    // Buscar categorias de uma palavra
    buscarCategoriasPalavra(palavraId) {
        try {
            const stmt = this.db.prepare(`
                SELECT c.* FROM categorias c
                INNER JOIN palavra_categoria pc ON c.id = pc.categoria_id
                WHERE pc.palavra_id = ?
            `);
            
            stmt.bind([palavraId]);
            
            const categorias = [];
            while (stmt.step()) {
                categorias.push(stmt.getAsObject());
            }
            stmt.free();
            
            return categorias;
            
        } catch (error) {
            console.error('Erro ao buscar categorias:', error);
            return [];
        }
    }
    
    // Listar todas as categorias
    listarCategorias() {
        try {
            const stmt = this.db.prepare('SELECT * FROM categorias ORDER BY ordem, nome');
            
            const categorias = [];
            while (stmt.step()) {
                categorias.push(stmt.getAsObject());
            }
            stmt.free();
            
            return categorias;
            
        } catch (error) {
            console.error('Erro ao listar categorias:', error);
            return [];
        }
    }
    
    // ========== ESTATÍSTICAS ==========
    
    // Registrar busca de palavra
    registrarBusca(palavraId) {
        try {
            // Verificar se já existe registro
            const stmtCheck = this.db.prepare(
                'SELECT * FROM estatisticas WHERE palavra_id = ?'
            );
            stmtCheck.bind([palavraId]);
            
            if (stmtCheck.step()) {
                // Atualizar existente
                this.db.run(`
                    UPDATE estatisticas 
                    SET buscas = buscas + 1, ultima_busca = CURRENT_TIMESTAMP 
                    WHERE palavra_id = ?
                `, [palavraId]);
            } else {
                // Inserir novo
                this.db.run(`
                    INSERT INTO estatisticas (palavra_id, buscas, ultima_busca) 
                    VALUES (?, 1, CURRENT_TIMESTAMP)
                `, [palavraId]);
            }
            
            stmtCheck.free();
            
        } catch (error) {
            console.error('Erro ao registrar busca:', error);
        }
    }
    
    // Obter estatísticas gerais
    obterEstatisticas() {
        try {
            const stats = {};
            
            // Total de palavras
            const total = this.db.exec('SELECT COUNT(*) as total FROM palavras')[0].values[0][0];
            stats.totalPalavras = total;
            
            // Palavras verificadas
            const verificadas = this.db.exec('SELECT COUNT(*) as total FROM palavras WHERE verificada = 1')[0].values[0][0];
            stats.palavrasVerificadas = verificadas;
            
            // Por classe gramatical
            const porClasse = this.db.exec(`
                SELECT classe_gramatical, COUNT(*) as total 
                FROM palavras 
                WHERE classe_gramatical IS NOT NULL 
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
    
    // ========== IMPORTAÇÃO/EXPORTAÇÃO ==========
    
    // Exportar banco para arquivo
    exportarBanco() {
        if (!this.db) return null;
        
        try {
            const dados = this.db.export();
            return dados;
        } catch (error) {
            console.error('Erro ao exportar banco:', error);
            return null;
        }
    }
    
    // Importar banco de arquivo
    importarBanco(arrayBuffer) {
        try {
            // Fechar banco atual
            if (this.db) {
                this.db.close();
            }
            
            // Criar novo banco com dados importados
            const data = new Uint8Array(arrayBuffer);
            this.db = new this.SQL.Database(data);
            
            // Salvar no localStorage
            this.saveToLocalStorage();
            
            console.log('✅ Banco importado com sucesso');
            return true;
            
        } catch (error) {
            console.error('❌ Erro ao importar banco:', error);
            return false;
        }
    }
    
    // Exportar para JSON (para backup)
    exportarParaJSON() {
        try {
            const dados = {
                palavras: [],
                categorias: [],
                metadados: {
                    versao: '2.0',
                    data_exportacao: new Date().toISOString(),
                    total_palavras: 0
                }
            };
            
            // Exportar palavras
            const stmtPalavras = this.db.prepare('SELECT * FROM palavras');
            while (stmtPalavras.step()) {
                const palavra = stmtPalavras.getAsObject();
                palavra.categorias = this.buscarCategoriasPalavra(palavra.id);
                dados.palavras.push(palavra);
            }
            stmtPalavras.free();
            
            // Exportar categorias
            const stmtCategorias = this.db.prepare('SELECT * FROM categorias');
            while (stmtCategorias.step()) {
                dados.categorias.push(stmtCategorias.getAsObject());
            }
            stmtCategorias.free();
            
            dados.metadados.total_palavras = dados.palavras.length;
            
            return JSON.stringify(dados, null, 2);
            
        } catch (error) {
            console.error('Erro ao exportar para JSON:', error);
            return null;
        }
    }
    
    // Importar de JSON
    importarDeJSON(jsonString) {
        try {
            const dados = JSON.parse(jsonString);
            
            // Iniciar transação
            this.db.run('BEGIN TRANSACTION');
            
            // Limpar tabelas existentes
            this.db.run('DELETE FROM palavra_categoria');
            this.db.run('DELETE FROM categorias');
            this.db.run('DELETE FROM palavras');
            
            // Importar categorias
            if (dados.categorias) {
                const stmtCat = this.db.prepare(`
                    INSERT INTO categorias (id, nome, descricao, icone, cor, ordem)
                    VALUES (?, ?, ?, ?, ?, ?)
                `);
                
                dados.categorias.forEach(cat => {
                    stmtCat.run([cat.id, cat.nome, cat.descricao, cat.icone, cat.cor, cat.ordem || 0]);
                });
                stmtCat.free();
            }
            
            // Importar palavras
            if (dados.palavras) {
                const stmtPal = this.db.prepare(`
                    INSERT INTO palavras (
                        id, emakhua, portugues, classe_gramatical, tom, dialeto,
                        exemplo_emakhua, exemplo_traducao, notas, data_cadastro,
                        data_atualizacao, usuario_cadastro, ativo, verificada
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `);
                
                dados.palavras.forEach(pal => {
                    stmtPal.run([
                        pal.id, pal.emakhua, pal.portugues, pal.classe_gramatical, 
                        pal.tom, pal.dialeto, pal.exemplo_emakhua, pal.exemplo_traducao,
                        pal.notas, pal.data_cadastro, pal.data_atualizacao, 
                        pal.usuario_cadastro || 'admin', pal.ativo || 1, pal.verificada || 0
                    ]);
                });
                stmtPal.free();
            }
            
            // Importar relações palavra-categoria
            if (dados.palavras) {
                const stmtRel = this.db.prepare(`
                    INSERT INTO palavra_categoria (palavra_id, categoria_id)
                    VALUES (?, ?)
                `);
                
                dados.palavras.forEach(pal => {
                    if (pal.categorias && pal.categorias.length > 0) {
                        pal.categorias.forEach(cat => {
                            stmtRel.run([pal.id, cat.id]);
                        });
                    }
                });
                stmtRel.free();
            }
            
            // Finalizar transação
            this.db.run('COMMIT');
            
            // Salvar no localStorage
            this.saveToLocalStorage();
            
            console.log('✅ Importação JSON concluída');
            return true;
            
        } catch (error) {
            this.db.run('ROLLBACK');
            console.error('❌ Erro na importação JSON:', error);
            return false;
        }
    }
    
    // ========== BACKUP/RESTORE ==========
    
    // Salvar no localStorage
    saveToLocalStorage() {
        try {
            const dados = this.exportarBanco();
            if (dados) {
                const dadosString = JSON.stringify(Array.from(new Uint8Array(dados)));
                localStorage.setItem('emakhua_database_v2', dadosString);
                console.log('💾 Banco salvo no localStorage');
            }
        } catch (error) {
            console.error('Erro ao salvar no localStorage:', error);
        }
    }
    
    // Fazer backup para arquivo
    fazerBackup() {
        const dados = this.exportarBanco();
        if (!dados) return null;
        
        const blob = new Blob([dados], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        
        return {
            url: url,
            tamanho: dados.byteLength,
            data: new Date().toISOString()
        };
    }
    
    // Restaurar de backup
    async restaurarBackup(arquivo) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const sucesso = this.importarBanco(e.target.result);
                    if (sucesso) {
                        resolve(true);
                    } else {
                        reject(new Error('Falha na importação'));
                    }
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
            reader.readAsArrayBuffer(arquivo);
        });
    }
    
    // ========== UTILITÁRIOS ==========
    
    // Verificar se o banco está vazio
    estaVazio() {
        try {
            const resultado = this.db.exec('SELECT COUNT(*) as total FROM palavras');
            return resultado[0].values[0][0] === 0;
        } catch (error) {
            return true;
        }
    }
    
    // Obter total de palavras
    getTotalPalavras() {
        try {
            const resultado = this.db.exec('SELECT COUNT(*) as total FROM palavras');
            return resultado[0].values[0][0];
        } catch (error) {
            return 0;
        }
    }
    
    // Fechar conexão
    fechar() {
        if (this.db) {
            this.db.close();
        }
    }
}

// Criar instância global
window.Database = new EmakhuaDatabase();
