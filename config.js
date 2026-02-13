// Configuración del servidor backend
// Cambia esta URL según donde esté ejecutándose tu servidor

// Para desarrollo local (localhost)
const SERVER_URL_LOCAL = 'http://localhost:4002';

// Para servidor en red local (ejemplo: http://192.168.1.100:4002)
// ⚠️ IMPORTANTE: Configura aquí la IP de tu servidor local para acceso desde otras PCs en tu red
// Puedes encontrar tu IP ejecutando el servidor y viendo el mensaje en la consola
const SERVER_URL_NETWORK = 'http://192.168.96.91:4002';

// Para servidor en producción (no se usa en este caso, pero lo dejamos por compatibilidad)
const SERVER_URL_PRODUCTION = 'https://tu-servidor.com:4002';

// Selecciona qué URL usar
// 'auto' - intenta localhost primero, luego red local (perfecto para GitHub Pages)
// 'local' - siempre usa localhost
// 'network' - siempre usa la URL de red
// 'production' - siempre usa la URL de producción
// 'custom' - usa una URL personalizada (configura SERVER_URL_CUSTOM abajo)
const MODE = 'auto';

// Si MODE es 'custom', configura esta URL
const SERVER_URL_CUSTOM = '';

// Función para obtener las URLs a intentar (en orden de prioridad)
function getServerURLs() {
  if (MODE === 'local') {
    return [SERVER_URL_LOCAL];
  } else if (MODE === 'network') {
    return [SERVER_URL_NETWORK];
  } else if (MODE === 'production') {
    return [SERVER_URL_PRODUCTION];
  } else if (MODE === 'custom' && SERVER_URL_CUSTOM) {
    return [SERVER_URL_CUSTOM];
  } else {
    // Modo 'auto': intenta localhost primero, luego red local
    // Esto funciona tanto si estás en localhost como si estás en GitHub Pages
    return [SERVER_URL_LOCAL, SERVER_URL_NETWORK];
  }
}

// Función para obtener la URL del servidor (mantenida por compatibilidad)
// Pero ahora devuelve un array de URLs para intentar
function getServerURL() {
  const urls = getServerURLs();
  return urls[0]; // Devuelve la primera por defecto
}

// Exportar para uso en otros archivos (si es un módulo)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getServerURL };
}

