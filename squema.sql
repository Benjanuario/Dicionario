-- schema.sql - Esquema do Banco de Dados Emakhua

-- Configurações de performance
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA cache_size = -10000;
PRAGMA foreign_keys = ON;
PRAGMA temp_store = MEMORY;

-- ==================== TABELAS PRINCIPAIS ====================

-- Tabela de palavras
CREATE TABLE IF NOT EXISTS palavras (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    palavra_emakhua TEXT NOT NULL,
    classe_gramatical TEXT NOT NULL CHECK(
        classe_gramatical IN ('substantivo', 'verbo', 'adjetivo', 'advérbio', 
                              'pronome', 'preposição', 'conjunção', 'interjeição',
                              'numeral', 'artigo')
    ),
    categoria TEXT,
    genero TEXT CHECK(genero IN ('masculino', 'femenino', 'invariável', NULL)),
    numero TEXT CHECK(numero IN ('singular', 'plural', 'invariável', NULL)),
    frequencia TEXT CHECK(frequencia IN ('baixa', 'média', 'alta', 'muito alta', NULL)),
    etimologia TEXT,
    observacoes TEXT,
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    ativo BOOLEAN DEFAULT 1,
    
    INDEX idx_palavra (palavra_emakhua),
    INDEX idx_categoria (categoria),
    INDEX idx_classe (classe_gramatical)
);

-- Tabela de variantes
CREATE TABLE IF NOT EXISTS variantes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT NOT NULL UNIQUE,
    nome TEXT NOT NULL,
    descricao TEXT,
    regiao TEXT,
    falantes_estimados INTEGER,
    cor_hex TEXT DEFAULT '#667eea',
    icone TEXT DEFAULT 'map-marker-alt',
    ordem INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT 1
);

-- Relação palavra-variante
CREATE TABLE IF NOT EXISTS palavra_variantes (
    palavra_id INTEGER NOT NULL,
    variante_id INTEGER NOT NULL,
    pronuncia TEXT,
    tom TEXT CHECK(tom IN ('HL', 'LH', 'LHL', 'HLH', 'H', 'L', NULL)),
    plural TEXT,
    conjugacao TEXT,
    audio_url TEXT,
    
    FOREIGN KEY (palavra_id) REFERENCES palavras(id) ON DELETE CASCADE,
    FOREIGN KEY (variante_id) REFERENCES variantes(id) ON DELETE CASCADE,
    PRIMARY KEY (palavra_id, variante_id)
);

-- Tabela de significados
CREATE TABLE IF NOT EXISTS significados (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    palavra_id INTEGER NOT NULL,
    variante_id INTEGER NOT NULL,
    ordem INTEGER DEFAULT 1,
    definicao_emakhua TEXT NOT NULL,
    definicao_portugues TEXT,
    contexto TEXT,
    uso TEXT,
    notas TEXT,
    tags TEXT,
    
    FOREIGN KEY (palavra_id) REFERENCES palavras(id) ON DELETE CASCADE,
    FOREIGN KEY (variante_id) REFERENCES variantes(id) ON DELETE CASCADE
);

-- Tabela de exemplos
CREATE TABLE IF NOT EXISTS exemplos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    significado_id INTEGER NOT NULL,
    tipo TEXT CHECK(tipo IN ('emakhua', 'portugues', 'contexto')) NOT NULL,
    texto TEXT NOT NULL,
    traducao TEXT,
    notas TEXT,
    
    FOREIGN KEY (significado_id) REFERENCES significados(id) ON DELETE CASCADE
);

-- Tabela de categorias
CREATE TABLE IF NOT EXISTS categorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL UNIQUE,
    icone TEXT DEFAULT 'tag',
    cor TEXT DEFAULT '#667eea',
    descricao TEXT,
    ordem INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT 1
);

-- Tabela de configurações
CREATE TABLE IF NOT EXISTS configuracoes (
    chave TEXT PRIMARY KEY,
    valor TEXT,
    tipo TEXT CHECK(tipo IN ('string', 'number', 'boolean', 'json')),
    descricao TEXT,
    editavel BOOLEAN DEFAULT 1
);

-- ==================== DADOS INICIAIS ====================

-- Inserir variantes
INSERT OR IGNORE INTO variantes (codigo, nome, descricao, regiao, ordem, cor_hex) VALUES
('all', 'Todas as Variantes', 'Todas as variantes dialetais', 'Todas regiões', 0, '#667eea'),
('enahara', 'Enahara', 'Variante falada na região norte', 'Norte de Moçambique', 1, '#4299e1'),
('emakhuwani', 'Emakhuwani', 'Variante falada na região central', 'Centro de Moçambique', 2, '#9f7aea'),
('emarevoni', 'Emarevoni', 'Variante falada na região sul', 'Sul de Moçambique', 3, '#ed64a6'),
('emettho', 'Emettho', 'Variante com influência bantu', 'Zambeze', 4, '#f6ad55'),
('eshirima', 'Eshirima', 'Variante da região costeira', 'Costa', 5, '#4fd1c7'),
('elomwe', 'Elomwe', 'Variante com influência Lomwe', 'Província de Zambézia', 6, '#68d391');

-- Inserir categorias
INSERT OR IGNORE INTO categorias (nome, icone, cor, ordem) VALUES
('animais', 'paw', '#f6ad55', 1),
('construções', 'home', '#4299e1', 2),
('natureza', 'tree', '#48bb78', 3),
('família', 'users', '#9f7aea', 4),
('comida', 'utensils', '#e53e3e', 5),
('corpo_humano', 'user-md', '#4fd1c7', 6),
('tempo', 'clock', '#718096', 7),
('números', 'hashtag', '#805ad5', 8),
('saudações', 'handshake', '#d69e2e', 9),
('sentimentos', 'heart', '#f56565', 10),
('verbos', 'running', '#38b2ac', 11),
('adjetivos', 'palette', '#ed64a6', 12),
('substantivos', 'font', '#667eea', 13);

-- Inserir configurações
INSERT OR IGNORE INTO configuracoes (chave, valor, tipo, descricao) VALUES
('versao_banco', '1.0.0', 'string', 'Versão atual do banco de dados'),
('ultima_atualizacao', '', 'string', 'Data da última atualização'),
('total_palavras', '0', 'number', 'Total de palavras cadastradas'),
('app_version', '1.0.0', 'string', 'Versão do aplicativo'),
('sync_url', 'https://api.emakhua.com', 'string', 'URL para sincronização'),
('offline_mode', 'true', 'boolean', 'Modo offline ativado');

-- ==================== GATILHOS ====================

-- Atualizar data_atualizacao
CREATE TRIGGER IF NOT EXISTS tg_palavras_update
AFTER UPDATE ON palavras
BEGIN
    UPDATE palavras SET data_atualizacao = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Atualizar contagem total
CREATE TRIGGER IF NOT EXISTS tg_palavras_insert
AFTER INSERT ON palavras
BEGIN
    UPDATE configuracoes SET valor = (SELECT COUNT(*) FROM palavras WHERE ativo = 1) 
    WHERE chave = 'total_palavras';
END;

CREATE TRIGGER IF NOT EXISTS tg_palavras_delete
AFTER DELETE ON palavras
BEGIN
    UPDATE configuracoes SET valor = (SELECT COUNT(*) FROM palavras WHERE ativo = 1) 
    WHERE chave = 'total_palavras';
END;

-- ==================== ÍNDICES ====================

CREATE INDEX IF NOT EXISTS idx_pv_palavra ON palavra_variantes(palavra_id);
CREATE INDEX IF NOT EXISTS idx_pv_variante ON palavra_variantes(variante_id);
CREATE INDEX IF NOT EXISTS idx_sig_palavra ON significados(palavra_id);
CREATE INDEX IF NOT EXISTS idx_sig_variante ON significados(variante_id);
CREATE INDEX IF NOT EXISTS idx_ex_significado ON exemplos(significado_id);

-- ==================== VIEWS ====================

CREATE VIEW IF NOT EXISTS vw_palavras_completas AS
SELECT 
    p.*,
    GROUP_CONCAT(DISTINCT v.codigo) as variantes,
    GROUP_CONCAT(DISTINCT v.nome) as variantes_nomes,
    COUNT(DISTINCT s.id) as total_significados,
    COUNT(DISTINCT e.id) as total_exemplos
FROM palavras p
LEFT JOIN palavra_variantes pv ON p.id = pv.palavra_id
LEFT JOIN variantes v ON pv.variante_id = v.id AND v.codigo != 'all'
LEFT JOIN significados s ON p.id = s.palavra_id
LEFT JOIN exemplos e ON s.id = e.significado_id
WHERE p.ativo = 1
GROUP BY p.id;

-- Fim do schema
SELECT 'Banco de dados Emakhua inicializado com sucesso!' as mensagem;
