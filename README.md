# Editor de Código Multiusuario

Editor de código colaborativo en tiempo real usando Node.js y Socket.io. Múltiples usuarios pueden editar el mismo código simultáneamente con diferentes nombres de usuario.

## Características

- ✅ Editor de código colaborativo en tiempo real
- ✅ Múltiples usuarios pueden editar simultáneamente
- ✅ Sincronización automática de cambios
- ✅ Lista de usuarios conectados con colores únicos
- ✅ Indicador visual de sincronización
- ✅ Mantiene todas las funcionalidades originales del editor

## Instalación

1. Instalar las dependencias:
```bash
npm install
```

## Uso

1. Iniciar el servidor:
```bash
npm start
```

O en modo desarrollo (con auto-reload):
```bash
npm run dev
```

2. Abrir el navegador en:
```
http://localhost:3002
```

   O desde otra computadora en tu red local, usar la IP que muestra el servidor:
```
http://[IP_DEL_SERVIDOR]:3002
```

3. Cuando se abra la página, ingresar tu nombre de usuario en el modal

4. Una vez conectado, podrás ver la lista de usuarios conectados en la esquina superior derecha

5. Todos los cambios en el editor se sincronizarán automáticamente con los demás usuarios conectados

## Características del Editor

- Editor de código C++ con CodeMirror
- Resaltado de sintaxis
- Autocompletado inteligente
- Compilación y ejecución de código C++
- Validación de ejercicios
- Todas las funcionalidades originales del editor

## Notas

- El código se sincroniza en tiempo real entre todos los usuarios conectados
- Cada usuario tiene un color único asignado automáticamente
- Los cambios se propagan instantáneamente a todos los usuarios
- El resto de la página (ejercicios, validaciones, etc.) funciona igual que antes

## Puerto por defecto

El servidor corre en el puerto **3002** por defecto. Puedes cambiarlo modificando la variable `PORT` en `server.js` o usando una variable de entorno:

```bash
PORT=3003 npm start
```

## Acceso desde la red local

El servidor está configurado para escuchar en todas las interfaces de red (`0.0.0.0`), lo que permite el acceso tanto desde localhost como desde otras computadoras en tu red local.

**Para acceder desde otra computadora:**

1. Asegúrate de que ambas computadoras estén en la misma red (WiFi o Ethernet)
2. Cuando inicies el servidor, verás en la consola un mensaje con tu IP local, por ejemplo:
   ```
   🌐 Red:      http://192.168.1.100:3002
   ```
3. Desde la otra computadora, abre el navegador y accede a esa URL
4. **La detección es automática**: El cliente detectará automáticamente si estás accediendo desde localhost o desde una IP de red local y se conectará al servidor correcto

**Nota:** Si tienes un firewall activo, asegúrate de permitir conexiones entrantes en el puerto 3002 (o el puerto que estés usando).

## Solución de Problemas

### No puedo conectarme desde otra computadora en la red

**Síntomas:** Puedes ver el HTML, pero al intentar conectarte al servidor multiusuario, no funciona.

**Soluciones:**

1. **Verificar que el servidor esté corriendo:**
   - Asegúrate de que el servidor esté ejecutándose en la computadora servidor
   - Verifica en la consola que muestra la IP correcta

2. **Verificar el Firewall de Windows:**
   - Ejecuta el script `verificar-firewall.ps1` como Administrador:
     ```powershell
     .\verificar-firewall.ps1
     ```
   - O manualmente, permite el puerto 3002 en el Firewall de Windows:
     - Abre "Firewall de Windows Defender"
     - Ve a "Configuración avanzada"
     - Crea una nueva regla de entrada para el puerto TCP 3002

3. **Usar la IP correcta:**
   - Cuando accedas desde otra computadora, usa la IP que muestra el servidor en la consola
   - Ejemplo: Si el servidor muestra `http://192.168.96.91:3002`, accede a esa URL exacta
   - **NO uses `localhost` desde otra computadora** - usa la IP del servidor

4. **Verificar la consola del navegador:**
   - Abre las herramientas de desarrollador (F12)
   - Ve a la pestaña "Console"
   - Cuando intentes conectarte, verás mensajes como:
     - `🌐 Detectada URL de red desde window.location.origin: http://192.168.96.91:3002`
     - `🔌 Intentando conectar a servidor 1/1: http://192.168.96.91:3002`
     - `✅ ¡Conectado exitosamente al servidor: http://192.168.96.91:3002 !`
   - Si ves errores, copia el mensaje completo para diagnosticar

5. **Verificar que ambas computadoras estén en la misma red:**
   - Ambas deben estar en la misma red WiFi o Ethernet
   - Intenta hacer ping desde la notebook al servidor para verificar conectividad

6. **El código ahora detecta automáticamente la URL:**
   - Si accedes desde `http://IP_SERVIDOR:3002`, el socket se conectará automáticamente a esa misma URL
   - Ya no necesitas configurar manualmente la IP en `config.js` (a menos que uses GitHub Pages)
   - El sistema detecta automáticamente si estás en localhost o en una IP de red

### El HTML carga pero el servidor multiusuario no conecta

**Causa común:** El firewall está bloqueando las conexiones WebSocket/Socket.IO.

**Solución:**
1. Ejecuta `verificar-firewall.ps1` como Administrador
2. O permite manualmente el puerto 3002 en el Firewall de Windows
3. Reinicia el servidor después de cambiar el firewall

### El compilador no funciona desde otras computadoras

**Síntomas:** Puedes compilar desde tu PC, pero otros usuarios en otras PCs no pueden compilar.

**Causa común:** El servidor compilador (puerto 3000) no está accesible desde la red o el cliente está intentando conectarse a localhost.

**Soluciones:**

1. **Verificar que el servidor compilador esté escuchando en todas las interfaces:**
   - El servidor ahora está configurado para escuchar en `0.0.0.0:3000` (todas las interfaces)
   - Verifica en la consola que muestre tanto la URL local como la de red para el puerto 3000

2. **Verificar el Firewall:**
   - El script `verificar-firewall.ps1` ya incluye el puerto 3000
   - Ejecútalo como Administrador para asegurar que el puerto 3000 esté abierto
   - O manualmente, permite el puerto 3000 en el Firewall de Windows

3. **Detección automática:**
   - El código ahora detecta automáticamente la URL del compilador
   - Si accedes desde `http://192.168.96.91:3002`, el compilador se conectará a `http://192.168.96.91:3000`
   - Ya no necesitas configurar IPs manualmente

4. **Verificar en la consola del navegador:**
   - Abre las herramientas de desarrollador (F12) → pestaña "Console"
   - Cuando intentes compilar, verás mensajes como:
     - `🌐 URL de compilador detectada desde red: http://192.168.96.91:3000/compile`
     - `🔗 URLs de compilador a intentar: [...]`
     - `✅ URL de compilación establecida: http://192.168.96.91:3000/compile`

**Nota:** El servidor compilador (puerto 3000), el servidor de archivos estáticos (puerto 3001) y el servidor principal (puerto 3002) ahora están todos configurados para escuchar en todas las interfaces de red (`0.0.0.0`), lo que permite el acceso desde cualquier computadora en tu red local.

## Despliegue en GitHub Pages (con servidor local)

Para subir el HTML a GitHub Pages y conectarlo a tu servidor local:

1. **Inicia tu servidor Node.js local** en tu computadora
2. **Edita `config.js`** y configura la IP de tu servidor local:
   ```javascript
   const SERVER_URL_NETWORK = 'http://192.168.1.100:3002'; // Cambia por tu IP local
   ```
   Puedes encontrar tu IP ejecutando el servidor y viendo el mensaje en la consola.
3. **Sube los archivos** `index.html` y `config.js` a tu repositorio de GitHub Pages
4. **El cliente intentará conectarse automáticamente**:
   - Primero intentará `localhost:3002` (si estás en tu computadora)
   - Si falla, intentará la IP de red configurada (si estás desde otra PC en tu red)

**Cómo funciona:**
- Cuando accedes desde tu computadora (donde corre el servidor): se conecta a `localhost:3002`
- Cuando accedes desde otra PC en tu red: se conecta a la IP configurada en `SERVER_URL_NETWORK`
- El sistema intenta automáticamente ambas opciones hasta encontrar una que funcione

**Modos de configuración disponibles en `config.js`:**
- `'auto'` - Intenta localhost primero, luego red local (recomendado para GitHub Pages con servidor local)
- `'local'` - Siempre usa localhost
- `'network'` - Siempre usa la URL de red configurada
- `'production'` - Siempre usa la URL de producción
- `'custom'` - Usa una URL personalizada

