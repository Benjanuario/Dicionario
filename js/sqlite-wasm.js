// js/sqlite-wasm.js
let sqlite3InitModule = null;

if (typeof window !== 'undefined') {
  // Para navegador
  window.sqlite3InitModule = function(init) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@sqlite.org/sqlite-wasm@3.44.0/build/sqlite-wasm.min.js';
      script.onload = () => {
        if (window.sqlite3 && window.sqlite3.initModule) {
          window.sqlite3.initModule(init).then(resolve).catch(reject);
        } else {
          reject(new Error('SQLite WASM não carregou corretamente'));
        }
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };
} else {
  // Para Node.js (se necessário)
  module.exports = null;
}
