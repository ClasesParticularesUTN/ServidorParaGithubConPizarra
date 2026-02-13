# Guía para Deploy en GitHub Pages

Esta guía te ayudará a desplegar el frontend en GitHub Pages mientras mantienes el backend en tu servidor.

## Estructura

- **Frontend (GitHub Pages)**: HTML, CSS, JavaScript estático
- **Backend (Tu servidor)**: Node.js con Socket.io y Express

## Pasos para el Deploy

### 1. Preparar el Frontend para GitHub Pages

1. **Copia los archivos necesarios**:
   - `index.html` → Tu repositorio de GitHub Pages
   - `config.js` → Tu repositorio de GitHub Pages (configuración del servidor)
   - Cualquier otro archivo estático que necesites (CSS, imágenes, etc.)

2. **Configura `config.js`**:
   ```javascript
   // En config.js, configura la URL de tu servidor backend
   const SERVER_URL_PRODUCTION = 'https://tu-servidor.com:3002';
   // o si es HTTP:
   const SERVER_URL_PRODUCTION = 'http://tu-servidor.com:3002';
   
   const MODE = 'custom';
   const SERVER_URL_CUSTOM = SERVER_URL_PRODUCTION;
   ```

### 2. Configurar el Backend

El backend ya está configurado para aceptar conexiones CORS desde cualquier origen (`origin: "*"`).

**Opciones para ejecutar el backend:**

#### Opción A: Servidor propio (VPS, Cloud, etc.)
- Sube `server.js` y `package.json` a tu servidor
- Instala dependencias: `npm install`
- Ejecuta: `node server.js` o usa `pm2` para mantenerlo corriendo
- Asegúrate de que el puerto 3002 esté abierto en el firewall

#### Opción B: Servicios de hosting Node.js
- **Heroku**: Crea una app y sube el código
- **Railway**: Similar a Heroku
- **Render**: También soporta Node.js
- **DigitalOcean App Platform**: Opción de pago

#### Opción C: Servidor local con tunnel (solo para desarrollo)
- Usa **ngrok**: `ngrok http 3002`
- O **localTunnel**: `lt --port 3002`
- Actualiza `config.js` con la URL del tunnel

### 3. GitHub Pages

1. Sube tu `index.html` y `config.js` a tu repositorio
2. Ve a Settings > Pages en tu repositorio
3. Selecciona la rama y carpeta donde está tu HTML
4. GitHub Pages servirá tu sitio en `https://tu-usuario.github.io/tu-repositorio/`

### 4. Configurar CORS (si es necesario)

Si tu servidor backend está en un dominio diferente, asegúrate de que el CORS esté configurado correctamente en `server.js`:

```javascript
const io = new Server(server, {
  cors: {
    origin: "*",  // Ya está configurado, acepta cualquier origen
    methods: ["GET", "POST"]
  }
});
```

### 5. Verificar la conexión

1. Abre la consola del navegador (F12)
2. Busca el mensaje: `Conectando a servidor: [URL]`
3. Verifica que la conexión se establezca correctamente

## Configuración de config.js

El archivo `config.js` tiene diferentes modos:

- **`auto`**: Detecta automáticamente (localhost si está en localhost, network si está en red)
- **`local`**: Siempre usa localhost
- **`network`**: Siempre usa la URL de red configurada
- **`custom`**: Usa una URL personalizada

Para producción en GitHub Pages, usa `custom`:

```javascript
const MODE = 'custom';
const SERVER_URL_CUSTOM = 'https://tu-servidor.com:3002';
```

## Problemas comunes

### Error de CORS
- Verifica que `server.js` tenga `origin: "*"` en la configuración de CORS
- Si usas HTTPS en GitHub Pages, el backend también debe ser HTTPS (o usar un proxy)

### No se conecta al servidor
- Verifica que el servidor esté corriendo
- Verifica que el puerto 3002 esté abierto
- Verifica la URL en `config.js`
- Revisa la consola del navegador para ver errores

### Servidor de compilación
- Si tienes un servidor separado para compilar código, actualiza también esa URL en `index.html` (línea ~1670)
- O crea una función similar en `config.js` para obtener la URL del servidor de compilación

## Notas importantes

- GitHub Pages solo sirve archivos estáticos (HTML, CSS, JS)
- El backend debe estar corriendo en un servidor que soporte Node.js
- Si usas HTTPS en GitHub Pages, asegúrate de que el backend también use HTTPS (o configura un proxy)
- Para desarrollo local, puedes seguir usando `localhost`

