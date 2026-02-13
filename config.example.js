// ============================================
// EJEMPLO DE CONFIGURACIÓN PARA GITHUB PAGES
// ============================================
// Copia este archivo como config.js y actualiza las URLs según tu servidor

// Configuración del servidor backend
// Cambia esta URL según donde esté ejecutándose tu servidor

// Para desarrollo local (localhost)
const SERVER_URL_LOCAL = 'http://localhost:3002';

// Para servidor en red local (ejemplo: http://192.168.1.100:3002)
const SERVER_URL_NETWORK = 'http://192.168.1.100:3002';

// Para servidor en producción (ejemplo: https://tu-servidor.com o http://tu-servidor.com)
const SERVER_URL_PRODUCTION = 'https://tu-servidor.com:3002'; // ⚠️ CAMBIA ESTA URL

// Selecciona qué URL usar
// 'auto' - detecta automáticamente (localhost si está en localhost, network si está en red)
// 'local' - siempre usa localhost
// 'network' - siempre usa la URL de red
// 'custom' - usa una URL personalizada (configura SERVER_URL_CUSTOM abajo)
// Para GitHub Pages, usa 'custom' o 'production'
const MODE = 'custom';

// Si MODE es 'custom', configura esta URL
// Para GitHub Pages, pon aquí la URL de tu servidor backend
const SERVER_URL_CUSTOM = SERVER_URL_PRODUCTION; // ⚠️ CAMBIA ESTA URL

// Función para obtener la URL del servidor
function getServerURL() {
  if (MODE === 'local') {
    return SERVER_URL_LOCAL;
  } else if (MODE === 'network') {
    return SERVER_URL_NETWORK;
  } else if (MODE === 'production') {
    return SERVER_URL_PRODUCTION;
  } else if (MODE === 'custom' && SERVER_URL_CUSTOM) {
    return SERVER_URL_CUSTOM;
  } else {
    // Modo 'auto': detecta automáticamente
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return SERVER_URL_LOCAL;
    } else if (hostname.includes('github.io')) {
      // Si está en GitHub Pages, usa la URL de producción
      return SERVER_URL_PRODUCTION;
    } else {
      // Para otros dominios, usa la URL de red
      return SERVER_URL_NETWORK;
    }
  }
}

// Exportar para uso en otros archivos (si es un módulo)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getServerURL };
}

