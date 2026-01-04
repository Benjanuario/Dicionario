// sync.js - Sistema de sincronização em tempo real
class DatabaseSync {
    constructor() {
        this.lastUpdate = null;
        this.checkInterval = 5000; // Verificar a cada 5 segundos
        this.syncEnabled = true;
    }
    
    start() {
        console.log('🔄 Iniciando sincronização...');
        
        // Verificar atualizações periodicamente
        setInterval(() => {
            this.checkForUpdates();
        }, this.checkInterval);
        
        // Escutar eventos de atualização
        window.addEventListener('databaseUpdated', () => {
            this.handleUpdate();
        });
        
        // Verificar atualizações ao focar na janela
        window.addEventListener('focus', () => {
            this.checkForUpdates();
        });
    }
    
    checkForUpdates() {
        if (!this.syncEnabled) return;
        
        const lastUpdate = localStorage.getItem('db_last_update');
        
        if (lastUpdate && lastUpdate !== this.lastUpdate) {
            console.log('🔄 Atualização detectada! Recarregando dados...');
            this.lastUpdate = lastUpdate;
            this.handleUpdate();
        }
    }
    
    handleUpdate() {
        // Recarregar dados do banco
        if (typeof reloadDictionaryData === 'function') {
            reloadDictionaryData();
        }
        
        // Disparar evento para componentes
        const event = new CustomEvent('dataReloaded', {
            detail: { timestamp: new Date().toISOString() }
        });
        window.dispatchEvent(event);
    }
    
    enable() {
        this.syncEnabled = true;
    }
    
    disable() {
        this.syncEnabled = false;
    }
}

// Criar instância global
window.DBSync = new DatabaseSync();
