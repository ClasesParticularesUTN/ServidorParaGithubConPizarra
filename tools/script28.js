
    // ========== FUNCIONES SOCKET.IO ==========
    
    // ========== GESTIÓN DE CORREO DE USUARIO EN LOCALSTORAGE ==========
    const CORREO_USUARIO_KEY = 'correoUsuario';
    const EXPIRACION_CORREO = 30 * 60 * 1000; // 30 minutos en milisegundos
    
    // Validar formato de correo
    function validarCorreo(correo) {
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return regex.test(correo);
    }
    
    // Guardar correo de usuario con expiración de 30 minutos
    function guardarCorreoUsuario(correo) {
      const datos = {
        correo: correo,
        expiracion: Date.now() + EXPIRACION_CORREO
      };
      localStorage.setItem(CORREO_USUARIO_KEY, JSON.stringify(datos));
    }
    
    // Obtener correo de usuario guardado (si no ha expirado)
    function obtenerCorreoUsuario() {
      try {
        const datosStr = localStorage.getItem(CORREO_USUARIO_KEY);
        if (!datosStr) return null;
        
        const datos = JSON.parse(datosStr);
        
        // Verificar si ha expirado
        if (Date.now() > datos.expiracion) {
          localStorage.removeItem(CORREO_USUARIO_KEY);
          return null;
        }
        
        return datos.correo;
      } catch (error) {
        console.error('Error al obtener correo de usuario:', error);
        localStorage.removeItem(CORREO_USUARIO_KEY);
        return null;
      }
    }
    
    // Limpiar correo de usuario guardado
    function limpiarCorreoUsuario() {
      localStorage.removeItem(CORREO_USUARIO_KEY);
      const inputUsuario = document.getElementById('input-usuario');
      if (inputUsuario) {
        inputUsuario.value = '';
      }
    }
    
    // Cargar correo guardado al iniciar la página y conectar automáticamente
    function cargarCorreoGuardado() {
      const correoGuardado = obtenerCorreoUsuario();
      if (correoGuardado) {
        const inputUsuario = document.getElementById('input-usuario');
        if (inputUsuario) {
          inputUsuario.value = correoGuardado;
          // Conectar automáticamente después de un pequeño delay para asegurar que el DOM esté listo
          setTimeout(() => {
            conectarUsuario();
          }, 100);
        }
      }
    }
    
    // Listener para Alt + S para limpiar correo guardado y archivo seleccionado
    document.addEventListener('keydown', (e) => {
      if (e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        limpiarCorreoUsuario();
        localStorage.removeItem('archivoSeleccionado');
        alert('Correo de usuario y archivo seleccionado borrados. Podés ingresar un nuevo correo y seleccionar un nuevo archivo.');
      }
    });
    
    // Variable global para almacenar los correos registrados
    let correosRegistrados = [];
    let indiceSugerenciaSeleccionada = -1;
    
    // Función para cargar correos registrados del servidor
    async function cargarCorreosRegistrados() {
      try {
        // Detectar la URL del servidor (mismo origen o localhost:4002)
        const currentOrigin = window.location.origin;
        const currentHostname = window.location.hostname;
        let serverURL = currentOrigin;
        
        // Si estamos en localhost, usar localhost:4002
        if (currentHostname === 'localhost' || currentHostname === '127.0.0.1') {
          serverURL = 'http://localhost:4002';
        }
        
        const response = await fetch(`${serverURL}/correos-registrados`);
        if (response.ok) {
          const data = await response.json();
          correosRegistrados = data.correos || [];
          console.log(`📧 ${correosRegistrados.length} correos cargados para autocompletado`);
        } else {
          console.warn('No se pudieron cargar los correos registrados');
        }
      } catch (error) {
        console.warn('Error al cargar correos registrados (esto es normal si el servidor no está disponible):', error.message);
      }
    }
    
    // Función para mostrar sugerencias de correos
    function mostrarSugerenciasCorreo(valorInput) {
      const sugerenciasDiv = document.getElementById('sugerencias-correo');
      if (!sugerenciasDiv) return;
      
      // Si el input está vacío, no mostrar sugerencias
      if (!valorInput || valorInput.trim() === '') {
        sugerenciasDiv.style.display = 'none';
        indiceSugerenciaSeleccionada = -1;
        return;
      }
      
      const valorLower = valorInput.toLowerCase().trim();
      
      // Filtrar correos que comiencen con lo escrito
      const correosFiltrados = correosRegistrados.filter(correo => 
        correo.toLowerCase().startsWith(valorLower)
      );
      
      // Si no hay coincidencias, ocultar el menú
      if (correosFiltrados.length === 0) {
        sugerenciasDiv.style.display = 'none';
        indiceSugerenciaSeleccionada = -1;
        return;
      }
      
      // Mostrar sugerencias
      sugerenciasDiv.innerHTML = '';
      correosFiltrados.forEach((correo, index) => {
        const item = document.createElement('div');
        item.textContent = correo;
        item.style.cssText = 'padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #555; color: white;';
        item.style.transition = 'background-color 0.2s';
        
        // Estilo hover
        item.onmouseenter = function() {
          this.style.backgroundColor = '#555';
          indiceSugerenciaSeleccionada = index;
          // Remover selección de otros items
          Array.from(sugerenciasDiv.children).forEach((child, i) => {
            if (i !== index) {
              child.style.backgroundColor = '';
            }
          });
        };
        
        item.onmouseleave = function() {
          this.style.backgroundColor = '';
        };
        
        // Click para seleccionar
        item.onclick = function() {
          const inputUsuario = document.getElementById('input-usuario');
          if (inputUsuario) {
            inputUsuario.value = correo;
            sugerenciasDiv.style.display = 'none';
            indiceSugerenciaSeleccionada = -1;
            inputUsuario.focus();
          }
        };
        
        sugerenciasDiv.appendChild(item);
      });
      
      sugerenciasDiv.style.display = 'block';
      indiceSugerenciaSeleccionada = -1;
    }
    
    // Configurar eventos del input de correo
    function configurarAutocompletadoCorreo() {
      const inputUsuario = document.getElementById('input-usuario');
      if (!inputUsuario) return;
      
      // Evento input - mostrar sugerencias mientras escribe
      inputUsuario.addEventListener('input', function(e) {
        mostrarSugerenciasCorreo(e.target.value);
      });
      
      // Evento focus - mostrar sugerencias si hay texto
      inputUsuario.addEventListener('focus', function(e) {
        if (e.target.value && e.target.value.trim() !== '') {
          mostrarSugerenciasCorreo(e.target.value);
        }
      });
      
      // Evento keydown - navegar con teclado
      inputUsuario.addEventListener('keydown', function(e) {
        const sugerenciasDiv = document.getElementById('sugerencias-correo');
        if (!sugerenciasDiv || sugerenciasDiv.style.display === 'none') {
          // Si presiona abajo y hay sugerencias, mostrar la primera
          if (e.key === 'ArrowDown' && inputUsuario.value && inputUsuario.value.trim() !== '') {
            e.preventDefault();
            mostrarSugerenciasCorreo(inputUsuario.value);
            const items = sugerenciasDiv.children;
            if (items.length > 0) {
              indiceSugerenciaSeleccionada = 0;
              items[0].style.backgroundColor = '#555';
            }
            return;
          }
          return;
        }
        
        const items = sugerenciasDiv.children;
        
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          // Remover selección anterior
          if (indiceSugerenciaSeleccionada >= 0 && items[indiceSugerenciaSeleccionada]) {
            items[indiceSugerenciaSeleccionada].style.backgroundColor = '';
          }
          // Mover hacia abajo
          indiceSugerenciaSeleccionada = (indiceSugerenciaSeleccionada + 1) % items.length;
          items[indiceSugerenciaSeleccionada].style.backgroundColor = '#555';
          items[indiceSugerenciaSeleccionada].scrollIntoView({ block: 'nearest' });
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          // Remover selección anterior
          if (indiceSugerenciaSeleccionada >= 0 && items[indiceSugerenciaSeleccionada]) {
            items[indiceSugerenciaSeleccionada].style.backgroundColor = '';
          }
          // Mover hacia arriba
          indiceSugerenciaSeleccionada = indiceSugerenciaSeleccionada <= 0 ? items.length - 1 : indiceSugerenciaSeleccionada - 1;
          items[indiceSugerenciaSeleccionada].style.backgroundColor = '#555';
          items[indiceSugerenciaSeleccionada].scrollIntoView({ block: 'nearest' });
        } else if (e.key === 'Enter') {
          e.preventDefault();
          // Seleccionar la sugerencia actual si hay una seleccionada
          if (indiceSugerenciaSeleccionada >= 0 && items[indiceSugerenciaSeleccionada]) {
            items[indiceSugerenciaSeleccionada].click();
          } else {
            // Si no hay sugerencia seleccionada, intentar conectar
            conectarUsuario();
          }
        } else if (e.key === 'Escape') {
          sugerenciasDiv.style.display = 'none';
          indiceSugerenciaSeleccionada = -1;
        }
      });
      
      // Ocultar sugerencias cuando se hace click fuera
      document.addEventListener('click', function(e) {
        const sugerenciasDiv = document.getElementById('sugerencias-correo');
        const inputUsuario = document.getElementById('input-usuario');
        if (sugerenciasDiv && inputUsuario && 
            !sugerenciasDiv.contains(e.target) && 
            e.target !== inputUsuario) {
          sugerenciasDiv.style.display = 'none';
          indiceSugerenciaSeleccionada = -1;
        }
      });
    }
    
    // Cargar correo guardado cuando se carga la página
    window.addEventListener('DOMContentLoaded', () => {
      cargarCorreoGuardado();
      // Cargar correos registrados para el autocompletado
      cargarCorreosRegistrados();
      // Configurar autocompletado del input de correo
      configurarAutocompletadoCorreo();
    });
    
    // También cargar correos cuando se muestra el modal (por si se abre después)
    const modalUsuario = document.getElementById('modal-usuario');
    if (modalUsuario) {
      // Observar cuando el modal se muestra
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
            const modal = mutation.target;
            if (modal.style.display !== 'none' && modal.style.display !== '') {
              // El modal se mostró, cargar correos si no están cargados
              if (correosRegistrados.length === 0) {
                cargarCorreosRegistrados();
              }
            }
          }
        });
      });
      observer.observe(modalUsuario, { attributes: true, attributeFilter: ['style'] });
    }
    
    function conectarUsuario() {
      const correoUsuario = document.getElementById('input-usuario').value.trim();
      
      if (!correoUsuario) {
        alert('Por favor ingresá tu correo');
        return;
      }
      
      if (!validarCorreo(correoUsuario)) {
        alert('Por favor ingresá un correo válido');
        return;
      }

      // Detectar automáticamente la URL del servidor basándose en dónde se carga la página
      // window.location.origin ya incluye protocolo, hostname y puerto completo
      // Ejemplo: si accedes desde http://192.168.96.91:4002, origin será "http://192.168.96.91:4002"
      const currentOrigin = window.location.origin;
      const currentHostname = window.location.hostname; // IP o dominio (ej: "192.168.96.91" o "localhost")
      const currentPort = window.location.port || '4002'; // Puerto desde la URL, o 4002 por defecto
      
      // Construir URL del servidor usando el mismo hostname y puerto desde donde se carga la página
      const protocol = window.location.protocol; // "http:" o "https:"
      const serverURLFromOrigin = currentOrigin; // Usar origin directamente (ya tiene todo)
      
      // Array de URLs a intentar en orden de prioridad
      let urlsToTry = [];
      
      // PRIORIDAD 1: Usar la misma URL desde donde se está cargando la página
      // Esto funciona perfectamente cuando accedes desde otra máquina en la red
      // Si accedes desde http://192.168.96.91:4002, el socket se conectará a esa misma URL
      if (currentHostname && currentHostname !== 'localhost' && currentHostname !== '127.0.0.1') {
        urlsToTry.push(serverURLFromOrigin);
        console.log('🌐 Detectada URL de red desde window.location.origin:', serverURLFromOrigin);
      }
      
      // PRIORIDAD 2: Si estamos en localhost, usar localhost
      if (currentHostname === 'localhost' || currentHostname === '127.0.0.1') {
          urlsToTry.push('http://localhost:4002');
        console.log('🏠 Usando localhost para conexión');
      }
      
      // PRIORIDAD 3: URLs desde config.js (si existe)
      if (typeof getServerURLs === 'function') {
        const configUrls = getServerURLs();
        // Agregar URLs de config que no estén ya en la lista
        configUrls.forEach(url => {
          if (!urlsToTry.includes(url)) {
            urlsToTry.push(url);
          }
        });
      } else if (typeof getServerURL === 'function') {
        const configUrl = getServerURL();
        if (configUrl && !urlsToTry.includes(configUrl)) {
          urlsToTry.push(configUrl);
        }
      }
      
      // PRIORIDAD 4: Fallback - localhost si no hay nada más
      if (urlsToTry.length === 0) {
          urlsToTry.push('http://localhost:4002');
      }
      
      console.log('🔗 URLs a intentar:', urlsToTry);
      
      // Intentar conectarse a cada URL en orden hasta que una funcione
      intentarConectar(urlsToTry, 0, correoUsuario);
    }

    function intentarConectar(urls, index, correoUsuario) {
      if (index >= urls.length) {
        console.error('❌ No se pudo conectar a ningún servidor después de intentar todas las URLs');
        const urlsIntentadas = urls.join('\n- ');
        alert(`No se pudo conectar al servidor.\n\nURLs intentadas:\n- ${urlsIntentadas}\n\nAsegúrate de:\n1. Que el servidor esté corriendo\n2. Que el firewall permita conexiones en el puerto 4002\n3. Que estés usando la IP correcta del servidor`);
        socketListenersRegistrados = false;
        return;
      }

      // Limpiar socket anterior si existe
      if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
        socket = null;
      }

      const serverURL = urls[index];
      console.log(`🔌 Intentando conectar a servidor ${index + 1}/${urls.length}: ${serverURL}`);
      
      // Crear nueva conexión socket con opciones mejoradas
      socket = io(serverURL, {
        timeout: 10000, // Timeout de 10 segundos (aumentado)
        reconnection: false, // Desactivar reconexión automática para poder intentar otra URL
        transports: ['websocket', 'polling'], // Intentar websocket primero, luego polling como fallback
        upgrade: true, // Permitir upgrade de polling a websocket
        rememberUpgrade: false
      });

      let connectionEstablished = false;

      // Timeout para detectar si la conexión falla
      const connectionTimeout = setTimeout(() => {
        if (!connectionEstablished && socket && !socket.connected) {
          console.log(`⏱️ Timeout: Conexión a ${serverURL} no respondió en 10 segundos, intentando siguiente URL...`);
          socket.removeAllListeners();
          socket.disconnect();
          socket = null;
          // Intentar siguiente URL
          intentarConectar(urls, index + 1, correoUsuario);
        }
      }, 10000);

      socket.on('connect', () => {
        connectionEstablished = true;
        clearTimeout(connectionTimeout);
        console.log('✅ ¡Conectado exitosamente al servidor:', serverURL, '!');
        
        // Registrar listeners solo una vez cuando la conexión sea exitosa
        if (!socketListenersRegistrados) {
          registrarSocketListeners(correoUsuario);
          socketListenersRegistrados = true;
        }
        
        // Iniciar verificación periódica de conexión
        iniciarVerificacionConexion();
        
        // Obtener el nombre del archivo actual si está disponible
        const archivoGuardado = obtenerArchivoSeleccionado();
        const nombreArchivoParaEnviar = nombreArchivoActual || (archivoGuardado ? archivoGuardado.nombreArchivo : null);
        
        socket.emit('usuario-join', { 
          username: correoUsuario,
          nombreArchivo: nombreArchivoParaEnviar
        });
      });

      socket.on('connect_error', (error) => {
        if (connectionEstablished) return; // Ignorar errores si ya se estableció la conexión
        
        clearTimeout(connectionTimeout);
        console.log(`❌ Error conectando a ${serverURL}:`, error.message);
        console.log('   Tipo de error:', error.type);
        
        socket.removeAllListeners();
        socket.disconnect();
        socket = null;
        
        // Resetear flag de listeners si la conexión falla completamente
        if (index + 1 >= urls.length) {
          socketListenersRegistrados = false;
        } else {
          // Intentar siguiente URL después de un pequeño delay
          setTimeout(() => {
            intentarConectar(urls, index + 1, correoUsuario);
          }, 500);
        }
      });

      socket.on('disconnect', (reason) => {
        if (!connectionEstablished) return;
        console.log('🔌 Desconectado del servidor. Razón:', reason);
        // Si hay una función de vaciar editores disponible, llamarla
        if (vaciarEditoresPorDesconexion) {
          vaciarEditoresPorDesconexion();
        }
      });
    }

    // Función para registrar todos los event listeners de socket (solo una vez)
    function registrarSocketListeners(correoUsuario) {
      if (!socket) return;

      socket.on('usuario-confirmado', (data) => {
        miUsuario = data.username;
        miColor = data.color;
        
        // Guardar correo de usuario con expiración de 30 minutos
        guardarCorreoUsuario(data.username);
        
        // Si hay un índice de ejercicio guardado, solo usarlo si corresponde al archivo actual
        if (data.indiceEjercicio !== undefined) {
          const indiceGuardado = data.indiceEjercicio;
          const nombreArchivoDelIndice = data.nombreArchivo;
          
          // Verificar que el índice corresponda al archivo actual
          const archivoActual = nombreArchivoActual || (obtenerArchivoSeleccionado() ? obtenerArchivoSeleccionado().nombreArchivo : null);
          
          if (nombreArchivoDelIndice && nombreArchivoDelIndice === archivoActual) {
            // Los archivos coinciden, podemos usar el índice
            // Si los ejercicios ya están cargados, actualizar el índice
            if (typeof ejercicios !== 'undefined' && ejercicios.length > 0) {
              if (indiceGuardado >= 0 && indiceGuardado < ejercicios.length) {
                indice = indiceGuardado;
                sessionStorage.setItem("indice", indice);
                console.log(`📚 Índice de ejercicio cargado desde servidor: ${indice} para archivo: ${nombreArchivoDelIndice}`);
                // Si ya se iniciaron los ejercicios, mostrar el ejercicio guardado
                if (document.querySelector('button[onclick="anterior()"]')) {
                  mostrarEjercicio();
                }
              }
            } else {
              // Si los ejercicios aún no están cargados, guardar el índice para usarlo después
              sessionStorage.setItem("indiceServidor", indiceGuardado);
              sessionStorage.setItem("nombreArchivoIndiceServidor", nombreArchivoDelIndice);
              console.log(`📚 Índice de ejercicio guardado para cuando se carguen los ejercicios: ${indiceGuardado} para archivo: ${nombreArchivoDelIndice}`);
            }
          } else if (!nombreArchivoDelIndice || !archivoActual) {
            // Si no hay nombreArchivo, usar el índice (compatibilidad con formato antiguo)
            if (typeof ejercicios !== 'undefined' && ejercicios.length > 0) {
              if (indiceGuardado >= 0 && indiceGuardado < ejercicios.length) {
                indice = indiceGuardado;
                sessionStorage.setItem("indice", indice);
                console.log(`📚 Índice de ejercicio cargado desde servidor (sin verificación de archivo): ${indice}`);
                if (document.querySelector('button[onclick="anterior()"]')) {
                  mostrarEjercicio();
                }
              }
            } else {
              sessionStorage.setItem("indiceServidor", indiceGuardado);
              console.log(`📚 Índice de ejercicio guardado (sin verificación de archivo): ${indiceGuardado}`);
            }
          } else {
            // Los archivos no coinciden, no usar el índice
            console.log(`⚠️ El índice recibido es para el archivo "${nombreArchivoDelIndice}" pero el archivo actual es "${archivoActual}". No se usará el índice guardado.`);
          }
        }
        
        // Verificar si el modal de reconexión está visible (indica que se estaba reconectando)
        const modalReconexion = document.getElementById('modal-reconexion');
        const estabaReconectando = modalReconexion && modalReconexion.style.display === 'flex';
        
        // Detener intentos automáticos de reconexión
        if (intervaloReconexion) {
          clearInterval(intervaloReconexion);
          intervaloReconexion = null;
        }
        
        // Si estaba reconectando, recargar la página para sincronizar todo el estado
        if (estabaReconectando) {
          console.log('✅ Reconexión exitosa. Recargando página...');
          // Pequeño delay para asegurar que el servidor procese la conexión
          setTimeout(() => {
            window.location.reload();
          }, 500);
          return; // No continuar con el resto del código, la página se recargará
        }
        
        // Si no estaba reconectando, es la conexión inicial, continuar normalmente
        // Ocultar modal y mostrar interfaz
        document.getElementById('modal-usuario').style.display = 'none';
        document.getElementById('usuarios-conectados').style.display = 'block';
        
        // Inicializar event listeners si no se han inicializado aún
        const minimizarBtn = document.getElementById('minimizar-usuarios-btn');
        if (minimizarBtn && !minimizarBtn.hasAttribute('data-listener-added')) {
          minimizarBtn.addEventListener('click', toggleMenuUsuarios);
          minimizarBtn.setAttribute('data-listener-added', 'true');
        }

        const toggleCursos = document.getElementById('toggle-cursos-remotos');
        if (toggleCursos && !toggleCursos.hasAttribute('data-listener-added')) {
          toggleCursos.addEventListener('click', toggleCursosRemotos);
          toggleCursos.setAttribute('data-listener-added', 'true');
        }

        const toggleColaboracion = document.getElementById('toggle-colaboracion');
        if (toggleColaboracion && !toggleColaboracion.hasAttribute('data-listener-added')) {
          toggleColaboracion.addEventListener('click', toggleColaboracion);
          toggleColaboracion.setAttribute('data-listener-added', 'true');
          // Sincronizar estado inicial
          if (permitirColaboracion) {
            toggleColaboracion.classList.add('active');
          } else {
            toggleColaboracion.classList.remove('active');
          }
        }

        // Inicializar arrastre del menú cuando se muestra
        inicializarArrastreMenu();

        // Inicializar sistema de pestañas
        inicializarSistemaPestañas();

        // Cargar documentos disponibles
        if (data.documentos && data.documentos.length > 0) {
          data.documentos.forEach(doc => {
            documentosDisponibles.set(doc.tabId, doc);
            crearPestañaUI(doc.tabId, doc.nombre, false, doc.tipo);
          });
          // Actualizar estado visual de las pestañas
          actualizarEstadoVisualPestañas();
          // Unirse a la primera pestaña si existe
          if (data.documentos.length > 0) {
            cambiarPestaña(data.documentos[0].tabId);
          }
        } else {
          // Crear primera pestaña si no hay ninguna
          crearNuevaPestaña();
        }
        
        // Restaurar estado del editor (abierto/cerrado) después de inicializar todo
        setTimeout(() => {
          const editorWasOpen = localStorage.getItem('editorAbierto') === 'true';
          if (editorWasOpen) {
            const overlay = document.getElementById("editor-overlay");
            const editorBtn = document.getElementById("abrir-editor");
            // Solo abrir si no está ya abierto
            if (overlay && overlay.style.display !== "flex") {
              toggleEditor();
            }
          }
        }, 500); // Esperar a que se inicialice todo el sistema de pestañas
      });

      socket.on('pestaña-creada', (data) => {
        // Verificar que la pestaña no exista ya para evitar duplicados
        if (!documentosDisponibles.has(data.tabId)) {
          documentosDisponibles.set(data.tabId, { nombre: data.nombre, codigo: data.codigo, tipo: data.tipo, creadorSocketId: data.creadorSocketId });
          crearPestañaUI(data.tabId, data.nombre, false, data.tipo);
          // Actualizar estado visual de las pestañas
          actualizarEstadoVisualPestañas();
          // Solo cambiar automáticamente a la nueva pestaña si somos el usuario que la creó
          if (data.creadorSocketId === socket.id) {
            setTimeout(() => {
              cambiarPestaña(data.tabId);
            }, 100);
          }
        }
      });

      // Eventos de pizarra
      socket.on('pizarra-draw', (data) => {
        const { tabId, x1, y1, x2, y2, tipo, herramienta, color, grosor } = data;
        const pizarraData = pizarrasPorPestaña.get(tabId);
        if (!pizarraData) return;

        if (tipo === 'line') {
          pizarraData.dibujarLinea(x1, y1, x2, y2, herramienta, color, grosor);
        } else if (tipo === 'linea') {
          // Dibujar línea final
          pizarraData.context.strokeStyle = color;
          pizarraData.context.lineWidth = grosor;
          pizarraData.context.beginPath();
          pizarraData.context.moveTo(x1, y1);
          pizarraData.context.lineTo(x2, y2);
          pizarraData.context.stroke();
        } else if (tipo === 'rectangulo') {
          // Dibujar rectángulo final
          pizarraData.context.strokeStyle = color;
          pizarraData.context.lineWidth = grosor;
          const width = x2 - x1;
          const height = y2 - y1;
          pizarraData.context.strokeRect(x1, y1, width, height);
        } else if (tipo === 'circulo') {
          // Dibujar círculo final
          pizarraData.context.strokeStyle = color;
          pizarraData.context.lineWidth = grosor;
          const radius = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
          pizarraData.context.beginPath();
          pizarraData.context.arc(x1, y1, radius, 0, 2 * Math.PI);
          pizarraData.context.stroke();
        }
      });

      socket.on('pizarra-clear', (data) => {
        const { tabId } = data;
        const pizarraData = pizarrasPorPestaña.get(tabId);
        if (!pizarraData) return;

        const { canvas, context } = pizarraData;
        context.clearRect(0, 0, canvas.width, canvas.height);
      });

      socket.on('pestaña-eliminada', (data) => {
        const { tabId } = data;
        
        // Verificar que la pestaña existe antes de intentar eliminarla
        if (documentosDisponibles.has(tabId)) {
          // Si es la pestaña activa, cambiar a otra
          if (pestañaActiva === tabId) {
            const otrasPestañas = Array.from(editoresPorPestaña.keys()).filter(id => id !== tabId);
            if (otrasPestañas.length > 0) {
              cambiarPestaña(otrasPestañas[0]);
            }
          }

          // Eliminar del DOM y del Map
          const panel = document.querySelector(`.editor-panel[data-tab-id="${tabId}"]`);
          const tab = document.querySelector(`.editor-tab[data-tab-id="${tabId}"]`);
          
          if (panel) panel.remove();
          if (tab) tab.remove();

          const editorData = editoresPorPestaña.get(tabId);
          if (editorData && editorData.cursosRemotos) {
            editorData.cursosRemotos.forEach(curso => {
              if (curso.marker) curso.marker.clear();
            });
          }

          editoresPorPestaña.delete(tabId);
          documentosDisponibles.delete(tabId);
          
          // Actualizar estado visual de las pestañas
          actualizarEstadoVisualPestañas();
        }
      });

      socket.on('codigo-actual', (data) => {
        const { tabId, codigo } = data;
        const docInfo = documentosDisponibles.get(tabId);
        const tipo = docInfo ? docInfo.tipo : 'editor';

        if (tipo === 'pizarra') {
          // Para pizarras, dibujar todos los dibujos existentes
          const pizarraData = pizarrasPorPestaña.get(tabId);
          if (pizarraData && Array.isArray(codigo)) {
            const { context } = pizarraData;
            context.clearRect(0, 0, pizarraData.canvas.width, pizarraData.canvas.height);
            
            codigo.forEach(dibujo => {
              const { x1, y1, x2, y2, tipo: tipoDibujo, herramienta, color, grosor } = dibujo;
              
              if (tipoDibujo === 'line') {
                // Dibujar línea entre puntos
                pizarraData.dibujarLinea(x1, y1, x2, y2, herramienta, color, grosor);
              } else if (tipoDibujo === 'linea') {
                // Dibujar línea final
                context.strokeStyle = color;
                context.lineWidth = grosor;
                context.beginPath();
                context.moveTo(x1, y1);
                context.lineTo(x2, y2);
                context.stroke();
              } else if (tipoDibujo === 'rectangulo') {
                // Dibujar rectángulo final
                context.strokeStyle = color;
                context.lineWidth = grosor;
                const width = x2 - x1;
                const height = y2 - y1;
                context.strokeRect(x1, y1, width, height);
              } else if (tipoDibujo === 'circulo') {
                // Dibujar círculo final
                context.strokeStyle = color;
                context.lineWidth = grosor;
                const radius = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
                context.beginPath();
                context.arc(x1, y1, radius, 0, 2 * Math.PI);
                context.stroke();
              }
            });
          }
        } else {
          // Para editores, lógica existente
          const codigoServidor = codigo || '';
          const editorData = editoresPorPestaña.get(tabId);
          
          if (editorData && editorData.editorInstance) {
            const codigoActual = editorData.editorInstance.getValue();
            
            // Si el servidor tiene código, SIEMPRE usarlo (sincronización)
            if (codigoServidor.trim() !== '' && codigoServidor !== codigoActual) {
              sincronizando = true;
              editorData.editorInstance.setValue(codigoServidor);
              editorData.codigo = codigoServidor;
            } else if (codigoServidor.trim() === '' && (codigoActual.trim() === '' || codigoActual === PLANTILLA_CPP || codigoActual === PLANTILLA_VECTOR || codigoActual === PLANTILLA_MATRIZ || codigoActual === PLANTILLA_LISTA_ENLAZADA)) {
              // Solo establecer plantilla si el servidor está vacío Y el editor también está vacío o tiene plantilla
              sincronizando = true;
              editorData.editorInstance.setValue(obtenerPlantillaActual());
              editorData.codigo = editorData.editorInstance.getValue();
            }
            
            // Después de sincronizar con el servidor, restaurar código guardado si existe
            // Esto permite que el usuario recupere su código después de reconectarse
            if (codigoGuardadoAntesDesconexion.has(tabId)) {
              const codigoGuardado = codigoGuardadoAntesDesconexion.get(tabId);
              if (codigoGuardado && codigoGuardado.trim() !== '') {
                // Esperar un momento para que la sincronización se complete
                setTimeout(() => {
                  if (editorData && editorData.editorInstance && socket && socket.connected) {
                    sincronizando = true;
                    editorData.editorInstance.setValue(codigoGuardado);
                    editorData.codigo = codigoGuardado;
                    console.log(`✅ Código restaurado para pestaña ${tabId} después de reconexión`);
                    
                    // Enviar el código restaurado al servidor para sincronizarlo con otros usuarios
                    // Solo si se puede editar esta pestaña
                    if (puedeEditarPestaña(tabId)) {
                      const lineasCodigoGuardado = codigoGuardado.split('\n');
                      const ultimaLinea = lineasCodigoGuardado.length - 1;
                      const ultimoChar = lineasCodigoGuardado[ultimaLinea] ? lineasCodigoGuardado[ultimaLinea].length : 0;
                      
                      socket.emit('cambio-codigo', {
                        cambios: {
                          codigo: codigoGuardado,
                          from: { line: 0, ch: 0 },
                          to: { line: ultimaLinea, ch: ultimoChar },
                          text: lineasCodigoGuardado
                        },
                        usuario: miUsuario,
                        tabId: tabId
                      });
                    }
                    
                    // Limpiar el código guardado después de restaurarlo
                    codigoGuardadoAntesDesconexion.delete(tabId);
                  }
                }, 500);
              }
            }
          }
          // Si el código ya coincide, no hacer nada
        }
      });

      socket.on('codigo-actualizado', (data) => {
        // Evitar sincronización circular
        if (data.socketId === socket.id) return;
        
        const { tabId, lineaInsercion, lineasInsertadas } = data;
        const editorData = editoresPorPestaña.get(tabId);
        if (!editorData || !editorData.editorInstance) return;

        sincronizando = true;
        const nuevoCodigo = data.cambios.codigo;
        const cursor = editorData.editorInstance.getCursor();
        
        // Si se insertó una línea nueva y nuestro cursor está por debajo, ajustarlo
        let nuevoCursor = cursor;
        if (lineaInsercion !== null && lineasInsertadas > 0 && cursor.line > lineaInsercion) {
          nuevoCursor = { line: cursor.line + lineasInsertadas, ch: cursor.ch };
        }
        
        editorData.editorInstance.setValue(nuevoCodigo);
        editorData.editorInstance.setCursor(nuevoCursor);
        editorData.codigo = nuevoCodigo;
        
        // Refrescar cursos remotos después de actualizar el código SOLO si es la pestaña activa
        setTimeout(() => {
          if (mostrarCursosRemotos && tabId === pestañaActiva && editorData.cursosRemotos) {
            editorData.cursosRemotos.forEach((curso, socketId) => {
              if (curso.line !== undefined && curso.ch !== undefined) {
                if (curso.line < editorData.editorInstance.lineCount()) {
                  const maxCh = editorData.editorInstance.getLine(curso.line).length;
                  const ch = Math.min(curso.ch, maxCh);
                  actualizarCursoRemotoEnPestaña(tabId, socketId, curso.username, curso.color, curso.line, ch);
                } else {
                  eliminarCursoRemotoEnPestaña(tabId, socketId);
                }
              }
            });
          }
        }, 100);
        
        mostrarIndicadorSincronizacion();
      });

      socket.on('usuario-conectado', (data) => {
        console.log(`${data.username} se conectó`);
        mostrarIndicadorSincronizacion();
        // Solicitar actualización de lista de usuarios para obtener información completa
        // El servidor debería enviar automáticamente usuarios-actualizados, pero por si acaso
        // esperamos un momento para que se actualice
        setTimeout(() => {
          // La lista se actualizará automáticamente cuando llegue usuarios-actualizados
        }, 100);
      });

      socket.on('usuario-desconectado', (data) => {
        console.log('Usuario desconectado');
        // Eliminar curso remoto del usuario desconectado en todas las pestañas
        editoresPorPestaña.forEach((editorData, tabId) => {
          if (editorData.cursosRemotos) {
            eliminarCursoRemotoEnPestaña(tabId, data.socketId);
          }
        });
      });

      socket.on('usuario-salio-pestaña', (data) => {
        // Un usuario salió de una pestaña específica, eliminar su cursor de esa pestaña
        const { tabId, socketId } = data;
        const editorData = editoresPorPestaña.get(tabId);
        if (editorData && editorData.cursosRemotos) {
          // Eliminar el cursor remoto de esa pestaña
          eliminarCursoRemotoEnPestaña(tabId, socketId);
          
          // También eliminar los datos del cursor de la estructura
          if (editorData.cursosRemotos.has(socketId)) {
            editorData.cursosRemotos.delete(socketId);
          }
        }
      });

      socket.on('usuario-unido-pestaña', (data) => {
        // Cuando un usuario se une a una pestaña, actualizar su información
        // Esto asegura que los usuarios antiguos tengan la información actualizada de los nuevos
        const { socketId, usuario, color } = data;
        const usuarioInfo = usuariosPorSocketId.get(socketId);
        if (usuarioInfo) {
          // Actualizar la pestaña activa del usuario
          usuarioInfo.pestañaActiva = data.tabId;
        } else {
          // Si no existe, agregarlo al mapa
          usuariosPorSocketId.set(socketId, {
            username: usuario,
            color: color,
            pestañaActiva: data.tabId
          });
          // Actualizar la lista visual también
          // La lista se actualizará cuando llegue usuarios-actualizados del servidor
        }
      });

      socket.on('cursor-actualizado', (data) => {
        // Evitar mostrar nuestro propio cursor
        if (data.socketId === socket.id) return;
        
        const { tabId } = data;
        
        // Solo procesar si la pestaña existe
        const editorData = editoresPorPestaña.get(tabId);
        if (!editorData) return;

        if (!editorData.cursosRemotos) {
          editorData.cursosRemotos = new Map();
        }

        // Guardar la posición del cursor siempre (aunque no se muestre)
        // IMPORTANTE: Asegurarse de que siempre se actualice la posición, incluso si ya existe
        // Solo guardar si tenemos datos válidos (no null/undefined)
        if (data.line !== undefined && data.ch !== undefined && data.line !== null && data.ch !== null) {
          const cursoExistente = editorData.cursosRemotos.get(data.socketId);
          if (!cursoExistente) {
            editorData.cursosRemotos.set(data.socketId, {
              marker: null,
              username: data.usuario,
              color: data.color,
              line: data.line,
              ch: data.ch
            });
          } else {
            // Actualizar siempre la posición, incluso si el marcador existe
            cursoExistente.line = data.line;
            cursoExistente.ch = data.ch;
            cursoExistente.username = data.usuario;
            cursoExistente.color = data.color;
          }
        }
        
        // CRÍTICO: SOLO mostrar el cursor si es la pestaña activa Y el toggle está activado
        // Si no es la pestaña activa, SIEMPRE limpiar el marcador
        if (tabId !== pestañaActiva) {
          // No es la pestaña activa, limpiar el marcador si existe
          const curso = editorData.cursosRemotos.get(data.socketId);
          if (curso && curso.marker) {
            curso.marker.clear();
            curso.marker = null;
          }
          return; // IMPORTANTE: Salir aquí para no mostrar en pestañas no activas
        }
        
        // Solo llegamos aquí si es la pestaña activa
        if (mostrarCursosRemotos) {
          actualizarCursoRemotoEnPestaña(tabId, data.socketId, data.usuario, data.color, data.line, data.ch);
        } else {
          // Toggle desactivado, limpiar marcador
          const curso = editorData.cursosRemotos.get(data.socketId);
          if (curso && curso.marker) {
            curso.marker.clear();
            curso.marker = null;
          }
        }
      });

      socket.on('documentos-actualizados', (documentos) => {
        // Actualizar lista de documentos disponibles
        documentos.forEach(doc => {
          // Verificar si la pestaña ya existe en el DOM para evitar duplicados
          const tabExisteEnDOM = document.querySelector(`.editor-tab[data-tab-id="${doc.tabId}"]`);
          
          if (!documentosDisponibles.has(doc.tabId) && !tabExisteEnDOM) {
            documentosDisponibles.set(doc.tabId, doc);
            crearPestañaUI(doc.tabId, doc.nombre, false);
          } else {
            // Actualizar información del documento (por si cambió el creador)
            const docExistente = documentosDisponibles.get(doc.tabId);
            if (docExistente) {
              docExistente.creadorSocketId = doc.creadorSocketId;
              docExistente.nombre = doc.nombre;
              docExistente.codigo = doc.codigo;
            }
          }
        });
        
        // Eliminar pestañas que ya no existen en el servidor
        const tabIdsServidor = new Set(documentos.map(doc => doc.tabId));
        documentosDisponibles.forEach((doc, tabId) => {
          if (!tabIdsServidor.has(tabId)) {
            // Esta pestaña ya no existe en el servidor, eliminarla localmente
            const panel = document.querySelector(`.editor-panel[data-tab-id="${tabId}"]`);
            const tab = document.querySelector(`.editor-tab[data-tab-id="${tabId}"]`);
            
            if (panel) panel.remove();
            if (tab) tab.remove();
            
            const editorData = editoresPorPestaña.get(tabId);
            if (editorData && editorData.cursosRemotos) {
              editorData.cursosRemotos.forEach(curso => {
                if (curso.marker) curso.marker.clear();
              });
            }
            
            editoresPorPestaña.delete(tabId);
            documentosDisponibles.delete(tabId);
          }
        });
        
        // Actualizar estado visual de las pestañas
        actualizarEstadoVisualPestañas();
      });

      socket.on('usuarios-actualizados', (usuarios) => {
        actualizarListaUsuarios(usuarios);
      });

      socket.on('colaboracion-desactivada-global', () => {
        // Recibir notificación de que otro usuario desactivó la colaboración
        // Desactivar localmente (solo si está activa, para evitar bucles)
        if (permitirColaboracion) {
          permitirColaboracion = false;
          const toggle = document.getElementById('toggle-colaboracion');
          if (toggle) {
            toggle.classList.remove('active');
          }
          // Actualizar estado de solo lectura de todos los editores
          actualizarEstadoSoloLecturaTodos();
          
          // Actualizar estado visual de las pestañas
          actualizarEstadoVisualPestañas();
          
          // Mover al usuario a una hoja propia si está en una que no le pertenece
          moverAhojaPropia();
        }
      });

      socket.on('contraseña-verificada', (data) => {
        const toggle = document.getElementById('toggle-colaboracion');
        
        if (data.valida) {
          // Contraseña correcta - activar colaboración
          permitirColaboracion = true;
          if (toggle) {
            toggle.classList.add('active');
          }
          // Actualizar estado de solo lectura de todos los editores
          actualizarEstadoSoloLecturaTodos();
          
          // Actualizar estado visual de las pestañas (habilitar todas)
          actualizarEstadoVisualPestañas();
        } else {
          // Contraseña incorrecta
          alert('Contraseña incorrecta. La colaboración no se activó.');
        }
      });

      socket.on('invitacion-posicion', (data) => {
        // Recibir invitación de otro usuario para ir a su posición
        const { tabId, line, ch, usuario, color, socketId } = data;
        
        // Verificar si el editor está cerrado y abrirlo si es necesario
        const overlay = document.getElementById("editor-overlay");
        const editorCerrado = !overlay || overlay.style.display !== "flex";
        
        if (editorCerrado) {
          // Abrir el editor primero
          toggleEditor();
          // Esperar a que el editor se abra antes de continuar
          setTimeout(() => {
            navegarAPosicionInvitada(tabId, line, ch, usuario, color);
          }, 200);
          return;
        }
        
        // Si el editor ya está abierto, proceder directamente
        navegarAPosicionInvitada(tabId, line, ch, usuario, color);
      });

      socket.on('disconnect', () => {
        console.log('Desconectado del servidor');
        if (vaciarEditoresPorDesconexion) {
          vaciarEditoresPorDesconexion();
        }
      });
      
      // Función para vaciar editores cuando se pierde conexión (asignar a variable global)
      vaciarEditoresPorDesconexion = function() {
        // Limpiar ejercicios primero
        limpiarEjercicios();
        
        mostrarIndicadorSincronizacion();
        
        // Mostrar modal de espera de reconexión
        const modalReconexion = document.getElementById('modal-reconexion');
        if (modalReconexion) {
          modalReconexion.style.display = 'flex';
        }
        
        // Detener cualquier intervalo de reconexión anterior
        if (intervaloReconexion) {
          clearInterval(intervaloReconexion);
          intervaloReconexion = null;
        }
        
        // Iniciar intentos automáticos de reconexión cada 3 segundos
        if (miUsuario) {
          intervaloReconexion = setInterval(() => {
            // Solo intentar reconectar si el socket no está conectado y el modal está visible
            const modal = document.getElementById('modal-reconexion');
            if (modal && modal.style.display === 'flex' && (!socket || !socket.connected)) {
              console.log('🔄 Intentando reconectar automáticamente...');
              // Obtener el correo de usuario guardado o usar el actual
              const correoUsuario = obtenerCorreoUsuario() || miUsuario;
              if (correoUsuario) {
                // Simular el input para poder usar conectarUsuario
                const inputUsuario = document.getElementById('input-usuario');
                if (inputUsuario) {
                  inputUsuario.value = correoUsuario;
                }
                // Reconectar
                conectarUsuario();
              }
            } else if (socket && socket.connected) {
              // Si ya está conectado, detener los intentos
              clearInterval(intervaloReconexion);
              intervaloReconexion = null;
            }
          }, 3000); // Intentar cada 3 segundos
        }
        
        // Guardar código de todas las pestañas antes de vaciar
        codigoGuardadoAntesDesconexion.clear();
        editoresPorPestaña.forEach((editorData, tabId) => {
          if (editorData && editorData.editorInstance) {
            const codigoActual = editorData.editorInstance.getValue();
            // Solo guardar si no es la plantilla vacía
            if (codigoActual && 
                codigoActual.trim() !== '' && 
                codigoActual !== PLANTILLA_CPP && 
                codigoActual !== PLANTILLA_VECTOR &&
                codigoActual !== PLANTILLA_MATRIZ &&
                codigoActual !== PLANTILLA_LISTA_ENLAZADA) {
              codigoGuardadoAntesDesconexion.set(tabId, codigoActual);
              console.log(`💾 Código guardado para pestaña ${tabId} antes de desconexión`);
            }
          }
        });
        
        // Vaciar todos los editores (solo para este usuario)
        editoresPorPestaña.forEach((editorData, tabId) => {
          if (editorData && editorData.editorInstance) {
            // Vaciar el editor
            sincronizando = true; // Evitar que se sincronice con el servidor
            editorData.editorInstance.setValue(obtenerPlantillaActual());
            editorData.codigo = editorData.editorInstance.getValue();
            // Limpiar historial de undo/redo para que no pueda restaurar con Ctrl+Z
            editorData.editorInstance.clearHistory();
            sincronizando = false;
            console.log(`🗑️ Editor de pestaña ${tabId} vaciado por desconexión (historial limpiado)`);
          }
        });
        
        // Resetear flag para permitir reconexión
        socketListenersRegistrados = false;
        // Limpiar todos los cursos remotos al desconectarse
        editoresPorPestaña.forEach((editorData, tabId) => {
          if (editorData.cursosRemotos) {
            editorData.cursosRemotos.forEach((curso, socketId) => {
              if (curso.marker) {
                curso.marker.clear();
              }
            });
            editorData.cursosRemotos.clear();
          }
        });
      }
    }

    // ========== FUNCIONES SISTEMA DE PESTAÑAS ==========
    
    function inicializarSistemaPestañas() {
      // Event listener para botón de nueva pestaña
      const nuevaPestañaBtn = document.getElementById('nueva-pestaña-btn');
      if (nuevaPestañaBtn) {
        nuevaPestañaBtn.addEventListener('click', () => crearNuevaPestaña('editor'));
      }

      // Event listener para botón de nueva pizarra
      const nuevaPizarraBtn = document.getElementById('nueva-pizarra-btn');
      if (nuevaPizarraBtn) {
        nuevaPizarraBtn.addEventListener('click', () => crearNuevaPestaña('pizarra'));
      }

      // Listener para Ctrl + T para crear nueva hoja
      document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key.toLowerCase() === 't') {
          e.preventDefault();
          const target = e.target;
          // Permitir Ctrl+T en el editor CodeMirror y otros lugares
          // Solo no capturar si estamos en el input de nombre de usuario
          const isInputUsuario = target.id === 'input-usuario';
          
          // Verificar si estamos dentro de un prompt de JavaScript (no podemos detectarlo fácilmente, así que permitimos)
          // O si estamos en el editor CodeMirror
          const isInCodeMirror = target.closest && target.closest('.CodeMirror');
          
          if (!isInputUsuario || isInCodeMirror) {
            e.preventDefault();
            e.stopPropagation();
            crearNuevaPestaña();
          }
        }
      });

      // Ocultar el panel de editor original (template) y asegurar que no se muestre
      const panelTemplate = document.querySelector('.editor-panel[data-tab-id=""]');
      if (panelTemplate) {
        panelTemplate.style.display = 'none';
        panelTemplate.classList.remove('active');
        // Asegurar que todos los elementos del template estén ocultos
        panelTemplate.querySelectorAll('.input-area, .output, .editor-textarea').forEach(el => {
          el.style.display = 'none';
        });
      }

      // Ocultar el panel de pizarra original (template)
      const pizarraTemplate = document.querySelector('.pizarra-panel[data-tab-id=""]');
      if (pizarraTemplate) {
        pizarraTemplate.style.display = 'none';
        pizarraTemplate.classList.remove('active');
      }
    }

    function crearNuevaPestaña(tipo = 'editor') {
      if (!socket || !socket.connected) {
        alert('Debes estar conectado para crear una pestaña');
        return;
      }

      const tipoTexto = tipo === 'pizarra' ? 'pizarra' : 'pestaña';
      const nombre = prompt(`Nombre de la nueva ${tipoTexto}:`) || `${tipo === 'pizarra' ? 'Pizarra' : 'Pestaña'} ${editoresPorPestaña.size + pizarrasPorPestaña.size + 1}`;
      socket.emit('crear-pestaña', { nombre, tipo });
    }

    function crearPestañaUI(tabId, nombre, esActiva, tipo = 'editor') {
      // Verificar si la pestaña ya existe para evitar duplicados
      const tabExistente = document.querySelector(`.editor-tab[data-tab-id="${tabId}"]`);
      if (tabExistente) {
        console.log(`Pestaña ${tabId} ya existe, no se creará duplicado`);
        return;
      }
      
      // Crear botón de pestaña
      const tabsContainer = document.getElementById('editor-tabs');
      const nuevaPestañaBtn = document.getElementById('nueva-pestaña-btn');
      
      const tabBtn = document.createElement('button');
      tabBtn.className = 'editor-tab' + (esActiva ? ' active' : '');
      tabBtn.setAttribute('data-tab-id', tabId);
      tabBtn.innerHTML = `
        <span>${nombre}</span>
        <button class="editor-tab-close" data-tab-id="${tabId}">×</button>
      `;
      
      tabBtn.addEventListener('click', (e) => {
        if (e.target.classList.contains('editor-tab-close')) {
          e.stopPropagation();
          cerrarPestaña(tabId);
        } else {
          // Verificar si se puede acceder a esta pestaña
          if (!permitirColaboracion && !navegandoPorInvitacion) {
            const docInfo = documentosDisponibles.get(tabId);
            if (docInfo && docInfo.creadorSocketId && docInfo.creadorSocketId !== socket.id) {
              // No permitir click en pestañas ajenas cuando la colaboración está desactivada
              e.preventDefault();
              e.stopPropagation();
              return;
            }
          }
          cambiarPestaña(tabId);
        }
      });

      // Insertar antes del botón de nueva pestaña
      tabsContainer.insertBefore(tabBtn, nuevaPestañaBtn);

      // Crear panel para esta pestaña
      crearPanelPestaña(tabId, nombre, tipo);
    }

    function crearPanelPestaña(tabId, nombre, tipo) {
      if (tipo === 'pizarra') {
        crearPanelPizarra(tabId, nombre);
      } else {
        crearPanelEditor(tabId, nombre);
      }
    }

    function crearPanelEditor(tabId, nombre) {
      const contentWrapper = document.querySelector('.editor-content-wrapper');
      const panelTemplate = document.querySelector('.editor-panel[data-tab-id=""]');
      
      if (!panelTemplate) {
        console.error('No se encontró el template del panel');
        return;
      }

      const nuevoPanel = panelTemplate.cloneNode(true);
      nuevoPanel.setAttribute('data-tab-id', tabId);
      nuevoPanel.classList.remove('active');
      nuevoPanel.style.display = 'none'; // Ocultar por defecto
      
      // Actualizar elementos con data-tab-id
      nuevoPanel.querySelectorAll('[data-tab-id=""]').forEach(el => {
        el.setAttribute('data-tab-id', tabId);
      });

      // Actualizar IDs únicos para evitar duplicados
      const header = nuevoPanel.querySelector('#editor-header');
      if (header) {
        header.id = `editor-header-${tabId}`;
      }

      // Asegurar que los elementos del nuevo panel sean visibles cuando se active
      const inputArea = nuevoPanel.querySelector('.input-area[data-tab-id="' + tabId + '"]');
      const output = nuevoPanel.querySelector('.output[data-tab-id="' + tabId + '"]');
      if (inputArea) {
        inputArea.style.display = 'block';
      }
      if (output) {
        output.style.display = 'block';
        const outputContent = output.querySelector('.output-content');
        if (outputContent) {
          outputContent.style.display = 'block';
        }
      }

      contentWrapper.appendChild(nuevoPanel);

      // Mostrar temporalmente el panel para que CodeMirror pueda calcular dimensiones
      nuevoPanel.style.display = 'flex';
      nuevoPanel.style.visibility = 'hidden';
      nuevoPanel.style.position = 'absolute';
      
      // Esperar un momento para que el DOM se actualice
      setTimeout(() => {
        // Crear instancia de CodeMirror para esta pestaña
        const textarea = nuevoPanel.querySelector('.editor-textarea[data-tab-id="' + tabId + '"]');
        if (!textarea) {
          console.error('No se encontró el textarea para la pestaña', tabId);
          nuevoPanel.style.display = 'none';
          nuevoPanel.style.visibility = 'visible';
          nuevoPanel.style.position = 'relative';
          return;
        }

        // Verificar si ya existe un editor para este textarea
        if (textarea.cm) {
          // Ya existe, solo actualizar editoresPorPestaña si no existe
          const existingData = editoresPorPestaña.get(tabId);
          if (!existingData) {
            editoresPorPestaña.set(tabId, {
              editorInstance: textarea.cm,
              codigo: textarea.cm.getValue(),
              cursosRemotos: new Map(),
              nombre: nombre,
              editorSoloMax: false
            });
          }
          // Restaurar estilos del panel y retornar
          nuevoPanel.style.display = 'none';
          nuevoPanel.style.visibility = 'visible';
          nuevoPanel.style.position = 'relative';
          return;
        }
        
        // Establecer un ID único para el textarea
        textarea.id = `editor-${tabId}`;
        
        // Asegurar que el textarea tenga dimensiones visibles
        textarea.style.width = '100%';
        textarea.style.height = '500px';
        textarea.style.minHeight = '500px';

        const editorInstance = crearEditorCodeMirror(textarea, tabId);
        
        if (!editorInstance) {
          console.error('Error al crear el editor CodeMirror');
          nuevoPanel.style.display = 'none';
          nuevoPanel.style.visibility = 'visible';
          nuevoPanel.style.position = 'relative';
          return;
        }
        
        // Establecer código inicial: primero verificar si hay código del servidor
        const codigoDelDocumento = documentosDisponibles.get(tabId)?.codigo || '';
        if (codigoDelDocumento.trim() !== '') {
          // Si hay código del servidor, usarlo
          editorInstance.setValue(codigoDelDocumento);
        } else {
          // Si no hay código del servidor, usar plantilla
          editorInstance.setValue(obtenerPlantillaActual());
        }
        
        // Guardar datos del editor
        editoresPorPestaña.set(tabId, {
          editorInstance: editorInstance,
          codigo: editorInstance.getValue(),
          cursosRemotos: new Map(),
          nombre: nombre,
          editorSoloMax: false
        });

        // Restaurar estilos del panel
        nuevoPanel.style.display = 'none';
        nuevoPanel.style.visibility = 'visible';
        nuevoPanel.style.position = 'relative';

        // Si es la primera pestaña o no hay pestaña activa, activarla
        if (pestañaActiva === null) {
          setTimeout(() => {
            cambiarPestaña(tabId);
          }, 50);
        }
      }, 100);
    }

    function crearPanelPizarra(tabId, nombre) {
      const contentWrapper = document.querySelector('.editor-content-wrapper');
      const panelTemplate = document.querySelector('.pizarra-panel[data-tab-id=""]');
      
      if (!panelTemplate) {
        console.error('No se encontró el template de pizarra');
        return;
      }

      const nuevoPanel = panelTemplate.cloneNode(true);
      nuevoPanel.setAttribute('data-tab-id', tabId);
      nuevoPanel.classList.remove('active');
      nuevoPanel.style.display = 'none';
      
      // Actualizar elementos con data-tab-id
      nuevoPanel.querySelectorAll('[data-tab-id=""]').forEach(el => {
        el.setAttribute('data-tab-id', tabId);
      });

      // Actualizar IDs únicos
      const header = nuevoPanel.querySelector('#pizarra-header');
      if (header) {
        header.id = `pizarra-header-${tabId}`;
      }

      const canvas = nuevoPanel.querySelector('#pizarra-canvas');
      if (canvas) {
        canvas.id = `pizarra-canvas-${tabId}`;
      }

      contentWrapper.appendChild(nuevoPanel);

      // Inicializar la pizarra
      inicializarPizarra(tabId, nombre);

      // Si es la primera pestaña o no hay pestaña activa, activarla
      if (pestañaActiva === null) {
        setTimeout(() => {
          cambiarPestaña(tabId);
        }, 50);
      }
    }

    function inicializarPizarra(tabId, nombre) {
      console.log(`Inicializando pizarra ${tabId}`);
      const canvas = document.getElementById(`pizarra-canvas-${tabId}`);
      if (!canvas) {
        console.error(`Canvas no encontrado para pizarra ${tabId}`);
        return;
      }

      console.log(`Canvas encontrado, inicializando contexto`);
      const context = canvas.getContext('2d');
      const dibujos = []; // Array para almacenar los dibujos

      // Función para redimensionar canvas
      function resizeCanvas() {
        const container = canvas.parentElement;
        if (container) {
          const rect = container.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            canvas.width = rect.width;
            canvas.height = rect.height;
            console.log(`Canvas redimensionado a ${canvas.width}x${canvas.height}`);
          }
        }
      }

      // Configurar canvas con tamaño fijo inicialmente
      canvas.width = 800;
      canvas.height = 600;

      // Intentar redimensionar si el contenedor es visible
      setTimeout(() => resizeCanvas(), 100);
      console.log(`Canvas configurado: ${canvas.width}x${canvas.height}`);

      // Función para dibujar línea entre dos puntos
      function dibujarLinea(x1, y1, x2, y2, herramientaActual = herramienta, colorActual = color, grosorActual = grosor) {
        context.strokeStyle = colorActual;
        context.lineWidth = grosorActual;
        context.lineCap = 'round';
        context.lineJoin = 'round';

        if (herramientaActual === 'borrador') {
          context.globalCompositeOperation = 'destination-out';
          context.beginPath();
          context.arc(x2, y2, grosorActual / 2, 0, 2 * Math.PI);
          context.fill();
          context.globalCompositeOperation = 'source-over';
        } else {
          context.globalCompositeOperation = 'source-over';
          context.beginPath();
          context.moveTo(x1, y1);
          context.lineTo(x2, y2);
          context.stroke();
        }
      }

      // Eventos del canvas
      canvas.addEventListener('mousedown', (e) => {
        console.log(`Mouse down en pizarra ${tabId}`);
        dibujando = true;
        const rect = canvas.getBoundingClientRect();
        startX = lastX = e.clientX - rect.left;
        startY = lastY = e.clientY - rect.top;
        console.log(`Posición inicial: ${startX}, ${startY}`);

        // Para herramientas que necesitan preview (líneas, figuras)
        if (['linea', 'rectangulo', 'circulo'].includes(herramienta)) {
          // No dibujar nada aún, solo guardar posición inicial
          return;
        }

        // Para lápiz y borrador, empezar a dibujar
        if (socket) {
          socket.emit('pizarra-draw', { tabId, x1: lastX, y1: lastY, x2: lastX, y2: lastY, tipo: 'line', herramienta, color, grosor });
        }
      });

      canvas.addEventListener('mousemove', (e) => {
        if (!dibujando) return;

        const rect = canvas.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;

        if (['linea', 'rectangulo', 'circulo'].includes(herramienta)) {
          // Para preview de figuras, redibujar el canvas con los dibujos existentes + preview
          redrawCanvas();
          drawPreview(currentX, currentY);
          return;
        }

        // Para lápiz y borrador, dibujar línea continua
        dibujarLinea(lastX, lastY, currentX, currentY);
        if (socket) {
          socket.emit('pizarra-draw', { tabId, x1: lastX, y1: lastY, x2: currentX, y2: currentY, tipo: 'line', herramienta, color, grosor });
        }

        lastX = currentX;
        lastY = currentY;
      });

      canvas.addEventListener('mouseup', (e) => {
        if (!dibujando) return;

        const rect = canvas.getBoundingClientRect();
        const endX = e.clientX - rect.left;
        const endY = e.clientY - rect.top;

        if (['linea', 'rectangulo', 'circulo'].includes(herramienta)) {
          // Confirmar la figura
          redrawCanvas();
          drawFinalShape(endX, endY);
          if (socket) {
            socket.emit('pizarra-draw', { tabId, x1: startX, y1: startY, x2: endX, y2: endY, tipo: herramienta, herramienta, color, grosor });
          }
        }

        dibujando = false;
      });

      // Función para redibujar todo el canvas
      function redrawCanvas() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        // Aquí se redibujarían todos los dibujos guardados, pero por ahora usamos el array del servidor
      }

      // Función para dibujar preview de figuras
      function drawPreview(currentX, currentY) {
        context.strokeStyle = color;
        context.lineWidth = grosor;
        context.setLineDash([5, 5]); // Línea punteada para preview

        if (herramienta === 'linea') {
          context.beginPath();
          context.moveTo(startX, startY);
          context.lineTo(currentX, currentY);
          context.stroke();
        } else if (herramienta === 'rectangulo') {
          const width = currentX - startX;
          const height = currentY - startY;
          context.strokeRect(startX, startY, width, height);
        } else if (herramienta === 'circulo') {
          const radius = Math.sqrt((currentX - startX) ** 2 + (currentY - startY) ** 2);
          context.beginPath();
          context.arc(startX, startY, radius, 0, 2 * Math.PI);
          context.stroke();
        }

        context.setLineDash([]); // Resetear línea sólida
      }

      // Función para dibujar la figura final
      function drawFinalShape(endX, endY) {
        context.strokeStyle = color;
        context.lineWidth = grosor;
        context.setLineDash([]); // Línea sólida

        if (herramienta === 'linea') {
          context.beginPath();
          context.moveTo(startX, startY);
          context.lineTo(endX, endY);
          context.stroke();
        } else if (herramienta === 'rectangulo') {
          const width = endX - startX;
          const height = endY - startY;
          context.strokeRect(startX, startY, width, height);
        } else if (herramienta === 'circulo') {
          const radius = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
          context.beginPath();
          context.arc(startX, startY, radius, 0, 2 * Math.PI);
          context.stroke();
        }
      }

      // Controles
      const herramientaSelect = document.querySelector(`#pizarra-header-${tabId} #herramienta-pizarra`);
      const colorInput = document.querySelector(`#pizarra-header-${tabId} #color-pizarra`);
      const grosorInput = document.querySelector(`#pizarra-header-${tabId} #grosor-pizarra`);
      const limpiarBtn = document.querySelector(`#pizarra-header-${tabId} #limpiar-pizarra`);

      if (herramientaSelect) {
        herramientaSelect.addEventListener('change', (e) => {
          herramienta = e.target.value;
          if (herramienta === 'borrador') {
            context.globalCompositeOperation = 'destination-out';
          } else {
            context.globalCompositeOperation = 'source-over';
          }
        });
      }

      if (colorInput) {
        colorInput.addEventListener('change', (e) => {
          color = e.target.value;
        });
      }

      if (grosorInput) {
        grosorInput.addEventListener('input', (e) => {
          grosor = parseInt(e.target.value);
        });
      }

      if (limpiarBtn) {
        limpiarBtn.addEventListener('click', () => {
          context.clearRect(0, 0, canvas.width, canvas.height);
          if (socket) {
            socket.emit('pizarra-clear', { tabId });
          }
        });
      }

      // Guardar en el mapa
      pizarrasPorPestaña.set(tabId, {
        canvas,
        context,
        dibujos,
        nombre,
        resizeCanvas,
        dibujarLinea
      });
    }

    function crearEditorCodeMirror(textarea, tabId) {
      // Verificar si el textarea ya tiene un editor de CodeMirror
      // CodeMirror oculta el textarea y crea un div .CodeMirror adyacente
      if (textarea.cm) {
        // Ya existe un editor, retornarlo
        return textarea.cm;
      }
      
      // Verificar si hay un elemento .CodeMirror en el padre (puede ser que se haya creado pero no esté en textarea.cm)
      const parent = textarea.parentElement;
      if (parent) {
        const existingCM = parent.querySelector('.CodeMirror');
        if (existingCM && existingCM.CodeMirror) {
          // Ya existe, guardar referencia y retornar
          textarea.cm = existingCM.CodeMirror;
          return existingCM.CodeMirror;
        }
      }
      
      // Configuración similar a la del editor original
      const cppKeywords = [
        "if", "else", "while", "for", "do", "switch", "case", "break", "continue", "return",
        "struct", "class", "public", "private", "protected", "void", "int", "float", "double",
        "char", "bool", "true", "false", "namespace", "using", "include", "cout", "cin", "endl",
        "const", "static", "virtual", "override", "template", "typename", "try", "catch", "throw",
        "new", "delete", "this", "operator", "friend", "enum", "typedef", "sizeof", "main"
      ];

      function cppHint(cm) {
        const cursor = cm.getCursor();
        const token = cm.getTokenAt(cursor);
        const start = token.start;
        const end = cursor.ch;
        const currentWord = token.string.slice(0, end - start);
        let list = [];

        if (currentWord.length > 0) {
          list = cppKeywords.filter(k => k.startsWith(currentWord));
        } else {
          list = cppKeywords.slice();
        }

        const anyword = CodeMirror.hint.anyword(cm) || {list:[]};
        let all = [...new Set([...list, ...anyword.list])];

        return {
          list: all,
          from: CodeMirror.Pos(cursor.line, start),
          to: CodeMirror.Pos(cursor.line, end)
        };
      }

      const editor = CodeMirror.fromTextArea(textarea, {
        mode: "text/x-c++src",
        theme: "material",
        lineNumbers: true,
        indentUnit: 4,
        tabSize: 4,
        autoCloseBrackets: true,
        matchBrackets: true,
        styleActiveLine: true,
        foldGutter: true,
        gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
        highlightSelectionMatches: true,
        extraKeys: {
          "Shift-Space": "autocomplete",
          "Ctrl-D": function(cm) {
            let selections = cm.listSelections();
            let lastSel = selections[selections.length - 1];
            let selText = cm.getRange(lastSel.anchor, lastSel.head);
            let isEmpty = selText.length === 0;
            if (isEmpty) {
              let cursor = lastSel.head;
              let line = cm.getLine(cursor.line);
              let start = cursor.ch, end = cursor.ch;
              while (start > 0 && /\w/.test(line.charAt(start - 1))) start--;
              while (end < line.length && /\w/.test(line.charAt(end))) end++;
              if (start === end) return;
              cm.replaceSelection(line.slice(start, end), "around");
              selections = cm.listSelections();
              lastSel = selections[selections.length - 1];
            }
            let word = isEmpty ? selText : cm.getRange(lastSel.anchor, lastSel.head);
            let searchCursor = cm.getSearchCursor(word, lastSel.head);
            while (searchCursor.findNext()) {
              let alreadySelected = selections.some(sel =>
                CodeMirror.cmpPos(sel.anchor, searchCursor.from()) === 0 &&
                CodeMirror.cmpPos(sel.head, searchCursor.to()) === 0
              );
              if (!alreadySelected) {
                cm.addSelection(searchCursor.from(), searchCursor.to());
                break;
              }
            }
          }
        },
        hintOptions: { hint: cppHint }
      });

      // Asegurarse de que el editor tenga altura
      const container = textarea.parentElement;
      if (container) {
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.height = '100%';
        container.style.minHeight = '500px';
      }

      // Calcular altura disponible
      const overlay = document.getElementById('editor-overlay');
      if (overlay && overlay.offsetHeight > 0) {
        const tabsHeight = document.querySelector('.editor-tabs')?.offsetHeight || 50;
        const headerHeight = textarea.closest('.editor-panel')?.querySelector('#editor-header')?.offsetHeight || 60;
        const availableHeight = overlay.offsetHeight - tabsHeight - headerHeight - 200; // espacio para input y output
        editor.setSize("100%", Math.max(400, availableHeight) + "px");
      } else {
        editor.setSize("100%", "500px");
      }
      
      // Inicializar autocompletado personalizado para este editor
      setTimeout(() => {
        inicializarAutocompletadoPersonalizado(editor);
        inicializarSnippets(editor);
      }, 200);
      
      // Refrescar el editor para asegurar que se renderice correctamente
      setTimeout(() => {
        editor.refresh();
        // Forzar re-renderizado
        const cmDisplay = editor.getWrapperElement();
        if (cmDisplay) {
          cmDisplay.style.display = 'block';
          cmDisplay.style.height = '500px';
        }
      }, 100);

      // Actualizar estado inicial de solo lectura
      const puedeEditar = puedeEditarPestaña(tabId);
      editor.setOption('readOnly', !puedeEditar);
      
      // Event listeners para cambios de código
      let cursorTimeout = null;
      
      editor.on('change', function(cm, change) {
        const editorData = editoresPorPestaña.get(tabId);
        if (!editorData) return;

        if (sincronizando) {
          sincronizando = false;
          return;
        }

        const nuevoCodigo = editor.getValue();
        editorData.codigo = nuevoCodigo;

        if (socket && socket.connected && miUsuario && tabId === pestañaActiva) {
          // Verificar si se puede editar (aunque debería estar deshabilitado si no se puede)
          if (!puedeEditarPestaña(tabId)) {
            // Esto no debería ocurrir si readOnly está activo, pero por seguridad
            sincronizando = true;
            editor.setValue(editorData.codigo);
            sincronizando = false;
            return;
          }
          
          socket.emit('cambio-codigo', {
            cambios: { codigo: nuevoCodigo, from: change.from, to: change.to, text: change.text },
            usuario: miUsuario,
            tabId: tabId
          });
        }
      });

      editor.on('cursorActivity', function(cm) {
        if (socket && socket.connected && miUsuario && tabId === pestañaActiva) {
          if (cursorTimeout) clearTimeout(cursorTimeout);
          cursorTimeout = setTimeout(() => {
            const cursor = cm.getCursor();
            socket.emit('cursor-cambio', {
              usuario: miUsuario,
              color: miColor,
              line: cursor.line,
              ch: cursor.ch,
              tabId: tabId
            });
          }, 200);
        }
      });

      return editor;
    }

    function cambiarPestaña(tabId) {
      if (pestañaActiva === tabId) return;
      
      // Si la colaboración está desactivada, verificar que la pestaña pertenezca al usuario
      // A menos que se esté navegando por invitación
      if (!permitirColaboracion && !navegandoPorInvitacion) {
        const docInfo = documentosDisponibles.get(tabId);
        if (docInfo && docInfo.creadorSocketId && docInfo.creadorSocketId !== socket.id) {
          alert('No puedes acceder a esta hoja. Solo puedes acceder a tus propias hojas cuando la colaboración está desactivada.');
          return;
        }
      }

      // Guardar estado de maximización de la pestaña anterior
      if (pestañaActiva) {
        const editorDataAnterior = editoresPorPestaña.get(pestañaActiva);
        if (editorDataAnterior) {
          const overlay = document.getElementById("editor-overlay");
          if (overlay) {
            editorDataAnterior.editorSoloMax = overlay.classList.contains("fullscreen-editor");
          }
        }
        
        const panelAnterior = document.querySelector(`.editor-panel[data-tab-id="${pestañaActiva}"]`) || document.querySelector(`.pizarra-panel[data-tab-id="${pestañaActiva}"]`);
        const tabAnterior = document.querySelector(`.editor-tab[data-tab-id="${pestañaActiva}"]`);
        if (panelAnterior) {
          panelAnterior.classList.remove('active');
          panelAnterior.style.display = 'none';
        }
        if (tabAnterior) tabAnterior.classList.remove('active');
      }

      // Mostrar nuevo panel
      const nuevoPanel = document.querySelector(`.editor-panel[data-tab-id="${tabId}"]`) || document.querySelector(`.pizarra-panel[data-tab-id="${tabId}"]`);
      const nuevoTab = document.querySelector(`.editor-tab[data-tab-id="${tabId}"]`);
      
      if (nuevoPanel) {
        nuevoPanel.classList.add('active');
        nuevoPanel.style.display = 'flex';
        
        // Asegurar que los elementos del panel sean visibles
        const inputArea = nuevoPanel.querySelector('.input-area[data-tab-id="' + tabId + '"]');
        const output = nuevoPanel.querySelector('.output[data-tab-id="' + tabId + '"]');
        if (inputArea) {
          inputArea.style.display = 'block';
          inputArea.style.visibility = 'visible';
        }
        if (output) {
          output.style.display = 'block';
          output.style.visibility = 'visible';
          const outputContent = output.querySelector('.output-content');
          if (outputContent) {
            outputContent.style.display = 'block';
            outputContent.style.visibility = 'visible';
          }
        // Si es una pizarra, redimensionar el canvas
        // if (nuevoPanel.classList.contains('pizarra-panel')) {
        //   const pizarraData = pizarrasPorPestaña.get(tabId);
        //   if (pizarraData && pizarraData.resizeCanvas) {
        //     setTimeout(() => pizarraData.resizeCanvas(), 100);
        //   }
        // }

      // Guardar la pestaña anterior antes de cambiar
      const pestañaAnterior = pestañaActiva;
      
      // IMPORTANTE: Actualizar pestaña activa ANTES de limpiar cursos remotos
      pestañaActiva = tabId;
      
      // Restaurar estado de maximización de la nueva pestaña
      const editorDataNueva = editoresPorPestaña.get(tabId);
      if (editorDataNueva) {
        const overlay = document.getElementById("editor-overlay");
        if (overlay && overlay.style.display === "flex") {
          if (editorDataNueva.editorSoloMax) {
            overlay.classList.add("fullscreen-editor");
            editorMaximizado = true;
          } else {
            overlay.classList.remove("fullscreen-editor");
            editorMaximizado = false;
          }
          
          // Actualizar el botón de maximizar
          const btnMaximizar = document.getElementById("maximizarSoloEditor");
          if (btnMaximizar) {
            if (editorDataNueva.editorSoloMax) {
              btnMaximizar.textContent = "🗗";
              btnMaximizar.title = "Restaurar vista completa";
            } else {
              btnMaximizar.textContent = "🗖";
              btnMaximizar.title = "Maximizar solo el editor";
            }
          }
        }
      }

      // Si estamos cambiando de pestaña (no es la primera vez), limpiar nuestro cursor de la pestaña anterior
      // Esto asegura que nuestro cursor no quede en la pestaña anterior para otros usuarios
      if (pestañaAnterior && pestañaAnterior !== tabId && socket && socket.connected) {
        // Limpiar nuestro cursor de la pestaña anterior localmente
        const editorDataAnterior = editoresPorPestaña.get(pestañaAnterior);
        if (editorDataAnterior && editorDataAnterior.cursosRemotos) {
          editorDataAnterior.cursosRemotos.delete(socket.id);
          // También limpiar el marcador si existe
          const cursoAnterior = editorDataAnterior.cursosRemotos.get(socket.id);
          if (cursoAnterior && cursoAnterior.marker) {
            cursoAnterior.marker.clear();
            cursoAnterior.marker = null;
          }
        }
      }

      // Limpiar cursos remotos de TODAS las otras pestañas (ocultar marcadores)
      // Esto asegura que no se muestren cursos de pestañas no activas
      editoresPorPestaña.forEach((data, otherTabId) => {
        if (otherTabId !== tabId && data.cursosRemotos) {
          data.cursosRemotos.forEach((curso, socketId) => {
            if (curso.marker) {
              curso.marker.clear();
              curso.marker = null;
            }
          });
          // Refrescar el editor para limpiar los marcadores visualmente
          if (data.editorInstance) {
            data.editorInstance.refresh();
          }
        }
      });
      
      // Asegurar que los cursos remotos de la pestaña activa también estén limpios inicialmente
      // Se mostrarán después si el toggle está activado
      const editorDataActiva = editoresPorPestaña.get(tabId);
      if (editorDataActiva && editorDataActiva.cursosRemotos) {
        editorDataActiva.cursosRemotos.forEach((curso, socketId) => {
          if (curso.marker) {
            curso.marker.clear();
            curso.marker = null;
          }
        });
      }

      // Unirse a la pestaña en el servidor
      if (socket && socket.connected) {
        socket.emit('unirse-pestaña', { tabId });
        
        // Enviar posición actual del cursor inmediatamente después de unirse
        setTimeout(() => {
          const editorData = editoresPorPestaña.get(tabId);
          if (editorData && editorData.editorInstance && miUsuario) {
            const cursor = editorData.editorInstance.getCursor();
            socket.emit('cursor-cambio', {
              usuario: miUsuario,
              color: miColor,
              line: cursor.line,
              ch: cursor.ch,
              tabId: tabId
            });
          }
        }, 300);
      }

      // Refrescar editor y enfocar (o crear si no existe)
      let editorData = editoresPorPestaña.get(tabId);
      
      // Actualizar estado de solo lectura cuando se cambia de pestaña
      if (editorData && editorData.editorInstance) {
        const puedeEditar = puedeEditarPestaña(tabId);
        editorData.editorInstance.setOption('readOnly', !puedeEditar);
      }
      
      // Mostrar cursos remotos de esta pestaña si el toggle está activado
      // Solo hacer esto después de limpiar todos los cursos remotos
      if (editorData && editorData.cursosRemotos && mostrarCursosRemotos && pestañaActiva === tabId) {
        setTimeout(() => {
          // Verificar nuevamente que sigamos en la misma pestaña activa
          if (pestañaActiva === tabId) {
            editorData.cursosRemotos.forEach((curso, socketId) => {
              if (curso.line !== undefined && curso.ch !== undefined && curso.username && curso.color) {
                actualizarCursoRemotoEnPestaña(tabId, socketId, curso.username, curso.color, curso.line, curso.ch);
              }
            });
          }
        }, 150);
      }
      
      if (!editorData || !editorData.editorInstance) {
        // Si el editor no existe, crearlo ahora que el panel está visible
        const textarea = nuevoPanel?.querySelector('.editor-textarea[data-tab-id="' + tabId + '"]');
        if (textarea) {
          // Verificar si el textarea ya tiene un editor de CodeMirror
          // crearEditorCodeMirror ya verifica esto internamente, pero verificamos aquí también
          if (textarea.cm) {
            // Ya existe un editor, usarlo
            editorData = {
              editorInstance: textarea.cm,
              codigo: textarea.cm.getValue(),
              cursosRemotos: editoresPorPestaña.get(tabId)?.cursosRemotos || new Map(),
              nombre: documentosDisponibles.get(tabId)?.nombre || 'Pestaña',
              editorSoloMax: editoresPorPestaña.get(tabId)?.editorSoloMax || false
            };
            editoresPorPestaña.set(tabId, editorData);
          } else {
            // No existe editor, crear uno nuevo
            textarea.id = `editor-${tabId}`;
            textarea.style.width = '100%';
            textarea.style.height = '500px';
            textarea.style.minHeight = '500px';
            
            const editorInstance = crearEditorCodeMirror(textarea, tabId);
            if (editorInstance) {
              // Establecer código inicial: primero verificar si hay código del servidor
              const codigoDelDocumento = documentosDisponibles.get(tabId)?.codigo || '';
              const codigoInicial = editorInstance.getValue() || '';
              
              if (codigoDelDocumento.trim() !== '') {
                // Si hay código del servidor, usarlo
                editorInstance.setValue(codigoDelDocumento);
              } else if (!codigoInicial || codigoInicial.trim() === '') {
                // Solo usar plantilla si no hay código del servidor ni código inicial
                editorInstance.setValue(obtenerPlantillaActual());
              }
              
              if (!editorData) {
                editorData = {
                  editorInstance: editorInstance,
                  codigo: editorInstance.getValue(),
                  cursosRemotos: new Map(),
                  nombre: documentosDisponibles.get(tabId)?.nombre || 'Pestaña',
                  editorSoloMax: false
                };
              } else {
                editorData.editorInstance = editorInstance;
                editorData.codigo = editorInstance.getValue();
                if (editorData.editorSoloMax === undefined) {
                  editorData.editorSoloMax = false;
                }
              }
              editoresPorPestaña.set(tabId, editorData);
            }
          }
        }
      }
      
      if (editorData && editorData.editorInstance) {
        setTimeout(() => {
          // Calcular altura correcta ahora que el panel está visible
          const overlay = document.getElementById('editor-overlay');
          if (overlay && overlay.offsetHeight > 0) {
            const tabsHeight = document.querySelector('.editor-tabs')?.offsetHeight || 50;
            const headerHeight = nuevoPanel?.querySelector('[id^="editor-header"]')?.offsetHeight || 60;
            const availableHeight = overlay.offsetHeight - tabsHeight - headerHeight - 200;
            editorData.editorInstance.setSize("100%", Math.max(400, availableHeight) + "px");
          }
          
          editorData.editorInstance.refresh();
          editorData.editorInstance.focus();
          
          // Segundo refresh para asegurar renderizado completo
          setTimeout(() => {
            editorData.editorInstance.refresh();
          }, 100);
        }, 200);
      }
    }

    function cerrarPestaña(tabId) {
      const totalPestañas = editoresPorPestaña.size + pizarrasPorPestaña.size;
      if (totalPestañas <= 1) {
        alert('No puedes cerrar la última pestaña');
        return;
      }

      // Notificar al servidor que se está eliminando la pestaña
      if (socket && socket.connected) {
        socket.emit('eliminar-pestaña', { tabId });
      }

      // Si es la pestaña activa, cambiar a otra
      if (pestañaActiva === tabId) {
        const otrasPestañas = Array.from(editoresPorPestaña.keys()).concat(Array.from(pizarrasPorPestaña.keys())).filter(id => id !== tabId);
        if (otrasPestañas.length > 0) {
          cambiarPestaña(otrasPestañas[0]);
        }
      }

      // Eliminar del DOM y del Map
      const panel = document.querySelector(`.editor-panel[data-tab-id="${tabId}"]`) || document.querySelector(`.pizarra-panel[data-tab-id="${tabId}"]`);
      const tab = document.querySelector(`.editor-tab[data-tab-id="${tabId}"]`);
      
      if (panel) panel.remove();
      if (tab) tab.remove();

      // Limpiar datos del editor o pizarra
      const editorData = editoresPorPestaña.get(tabId);
      if (editorData && editorData.cursosRemotos) {
        editorData.cursosRemotos.forEach(curso => {
          if (curso.marker) curso.marker.clear();
        });
      }

      editoresPorPestaña.delete(tabId);
      pizarrasPorPestaña.delete(tabId);
      documentosDisponibles.delete(tabId);
    }

    function actualizarCursoRemotoEnPestaña(tabId, socketId, username, color, line, ch) {
      const editorData = editoresPorPestaña.get(tabId);
      if (!editorData || !editorData.editorInstance) return;

      const editor = editorData.editorInstance;
      
      if (!editorData.cursosRemotos) {
        editorData.cursosRemotos = new Map();
      }

      if (editorData.cursosRemotos.has(socketId)) {
        const cursoExistente = editorData.cursosRemotos.get(socketId);
        if (cursoExistente.marker) {
          cursoExistente.marker.clear();
        }
      }

      const pos = CodeMirror.Pos(line, ch);
      const widget = document.createElement('span');
      widget.style.backgroundColor = color;
      widget.style.width = '2px';
      widget.style.height = '1.2em';
      widget.style.display = 'inline-block';
      widget.style.marginLeft = '-1px';
      widget.style.verticalAlign = 'text-bottom';

      const label = document.createElement('span');
      label.textContent = obtenerNombreUsuario(username);
      label.style.backgroundColor = color;
      label.style.color = 'white';
      label.style.position = 'absolute';
      label.style.top = '-1.5em';
      label.style.padding = '2px 6px';
      label.style.fontSize = '11px';
      label.style.fontWeight = 'bold';
      label.style.borderRadius = '3px';
      label.style.whiteSpace = 'nowrap';
      label.style.boxShadow = '0 1px 3px rgba(0,0,0,0.3)';
      label.style.zIndex = '1000';
      label.style.pointerEvents = 'none';

      const container = document.createElement('span');
      container.style.position = 'relative';
      container.style.display = 'inline-block';
      container.appendChild(widget);
      container.appendChild(label);

      const marker = editor.setBookmark(pos, {
        widget: container,
        insertLeft: false,
        handleMouseEvents: false
      });

      editorData.cursosRemotos.set(socketId, {
        marker: marker,
        username: username,
        color: color,
        line: line,
        ch: ch
      });

      setTimeout(() => editor.refresh(), 0);
    }

    function eliminarCursoRemotoEnPestaña(tabId, socketId) {
      const editorData = editoresPorPestaña.get(tabId);
      if (!editorData || !editorData.cursosRemotos) return;

      if (editorData.cursosRemotos.has(socketId)) {
        const curso = editorData.cursosRemotos.get(socketId);
        if (curso.marker) {
          curso.marker.clear();
        }
        editorData.cursosRemotos.delete(socketId);
        if (editorData.editorInstance) {
          setTimeout(() => editorData.editorInstance.refresh(), 0);
        }
      }
    }

    // Función auxiliar para obtener solo la parte del correo antes del @
    function obtenerNombreUsuario(correo) {
      if (!correo) return '';
      const partes = correo.split('@');
      return partes[0] || correo;
    }
    
    function actualizarListaUsuarios(usuarios) {
      const lista = document.getElementById('lista-usuarios');
      lista.innerHTML = '';
      
      // Actualizar mapa de usuarios por socketId
      usuariosPorSocketId.clear();
      usuarios.forEach(usuario => {
        usuariosPorSocketId.set(usuario.socketId, {
          username: usuario.username,
          color: usuario.color,
          pestañaActiva: usuario.pestañaActiva,
          nombreArchivo: usuario.nombreArchivo || null,
          indiceEjercicio: usuario.indiceEjercicio || 0
        });
      });
      
      usuarios.forEach(usuario => {
        // No mostrar nuestro propio usuario
        if (usuario.socketId === socket.id) return;
        
        const nombreUsuario = obtenerNombreUsuario(usuario.username);
        
        const item = document.createElement('div');
        item.className = 'usuario-item';
        item.style.cursor = 'pointer';
        item.title = usuario.pestañaActiva ? `Ir a ${usuario.username} (${documentosDisponibles.get(usuario.pestañaActiva)?.nombre || 'Pestaña'})` : `Usuario: ${usuario.username}`;
        item.innerHTML = `
          <span class="usuario-color" style="background-color: ${usuario.color}"></span>
          <span class="usuario-nombre">${nombreUsuario}</span>
          <span class="invitar-simbolo" title="Invitar a ${usuario.username} a mi posición" style="margin-left: 8px; cursor: pointer; font-size: 1.2em; user-select: none;">📍</span>
        `;
        
        // Agregar evento de clic para navegar a la posición del usuario (en el nombre)
        const nombreSpan = item.querySelector('.usuario-nombre');
        nombreSpan.addEventListener('click', (e) => {
          e.stopPropagation();
          navegarAUsuario(usuario.socketId);
        });
        
        // Agregar evento de clic en el símbolo para invitar al usuario a mi posición
        const simbolo = item.querySelector('.invitar-simbolo');
        simbolo.addEventListener('click', (e) => {
          e.stopPropagation();
          invitarAMiPosicion(usuario.socketId);
        });
        
        lista.appendChild(item);
      });
    }
    
    function invitarAMiPosicion(socketIdDestino) {
      if (!permitirColaboracion) {
        alert('La colaboración está desactivada. Activa "Permitir colaboración" para usar esta función.');
        return;
      }
      
      if (!socket || !socket.connected || !miUsuario) {
        alert('No estás conectado');
        return;
      }
      
      if (!pestañaActiva) {
        alert('No estás en ninguna pestaña activa');
        return;
      }
      
      const editorData = editoresPorPestaña.get(pestañaActiva);
      if (!editorData || !editorData.editorInstance) {
        alert('No hay editor activo');
        return;
      }
      
      const cursor = editorData.editorInstance.getCursor();
      
      // Enviar invitación solo al usuario específico
      socket.emit('invitar-a-mi-posicion', {
        tabId: pestañaActiva,
        line: cursor.line,
        ch: cursor.ch,
        usuario: miUsuario,
        color: miColor,
        socketIdDestino: socketIdDestino
      });
    }
    
    function navegarAUsuario(socketId) {
      if (!permitirColaboracion) {
        alert('La colaboración está desactivada. Activa "Permitir colaboración" para usar esta función.');
        return;
      }
      
      const usuarioInfo = usuariosPorSocketId.get(socketId);
      if (!usuarioInfo || !usuarioInfo.pestañaActiva) {
        alert('El usuario no está en ninguna pestaña activa');
        return;
      }
      
      // Verificar si el editor está cerrado y abrirlo si es necesario
      const overlay = document.getElementById("editor-overlay");
      const editorCerrado = !overlay || overlay.style.display !== "flex";
      
      if (editorCerrado) {
        // Abrir el editor primero
        toggleEditor();
        // Esperar a que el editor se abra antes de continuar
        setTimeout(() => {
          navegarAUsuarioInterno(socketId);
        }, 200);
        return;
      }
      
      // Si el editor ya está abierto, proceder directamente
      navegarAUsuarioInterno(socketId);
    }
    
    function navegarAUsuarioInterno(socketId) {
      const usuarioInfo = usuariosPorSocketId.get(socketId);
      if (!usuarioInfo || !usuarioInfo.pestañaActiva) {
        alert('El usuario no está en ninguna pestaña activa');
        return;
      }
      
      // Si el usuario tiene un archivo JS diferente, cargarlo primero
      if (usuarioInfo.nombreArchivo && usuarioInfo.nombreArchivo !== nombreArchivoActual) {
        console.log(`📂 Cargando archivo del usuario: ${usuarioInfo.nombreArchivo}`);
        
        // Obtener la URL del servidor de archivos
        const urlsArchivos = obtenerURLsServidorArchivos();
        const serverURL = urlsArchivos[0] || 'http://localhost:4001';
        
        // Cargar el archivo del usuario
        cargarArchivoSeleccionado(usuarioInfo.nombreArchivo, serverURL)
          .then(() => {
            // Después de cargar el archivo, esperar un momento y luego cargar el índice
            setTimeout(() => {
              if (typeof ejercicios !== 'undefined' && ejercicios.length > 0) {
                const indiceUsuario = usuarioInfo.indiceEjercicio || 0;
                if (indiceUsuario >= 0 && indiceUsuario < ejercicios.length) {
                  indice = indiceUsuario;
                  sessionStorage.setItem("indice", indice);
                  mostrarEjercicio();
                  console.log(`📚 Índice del usuario cargado: ${indice}`);
                }
              }
              
              // Ahora navegar a la posición del cursor
              navegarAPosicionUsuario(socketId, usuarioInfo);
            }, 500);
          })
          .catch(error => {
            console.error('Error al cargar archivo del usuario:', error);
            // Aún así, intentar navegar a la posición
            navegarAPosicionUsuario(socketId, usuarioInfo);
          });
      } else {
        // Si el archivo es el mismo o no hay archivo, solo cargar el índice si es diferente
        if (usuarioInfo.indiceEjercicio !== undefined && usuarioInfo.indiceEjercicio !== indice) {
          if (typeof ejercicios !== 'undefined' && ejercicios.length > 0) {
            const indiceUsuario = usuarioInfo.indiceEjercicio || 0;
            if (indiceUsuario >= 0 && indiceUsuario < ejercicios.length) {
              indice = indiceUsuario;
              sessionStorage.setItem("indice", indice);
              mostrarEjercicio();
              console.log(`📚 Índice del usuario cargado: ${indice}`);
            }
          }
        }
        
        // Navegar a la posición del cursor
        navegarAPosicionUsuario(socketId, usuarioInfo);
      }
    }
    
    function navegarAPosicionUsuario(socketId, usuarioInfo) {
      const tabId = usuarioInfo.pestañaActiva;
      
      // Si la pestaña no es la activa, cambiar a ella primero
      if (pestañaActiva !== tabId) {
        cambiarPestaña(tabId);
      }
      
      // Esperar a que el cambio de pestaña se complete
      setTimeout(() => {
        // Buscar la posición del cursor del usuario en la pestaña activa del usuario
        const editorData = editoresPorPestaña.get(tabId);
        
        if (editorData && editorData.cursosRemotos && editorData.cursosRemotos.has(socketId)) {
          const curso = editorData.cursosRemotos.get(socketId);
          
          // Verificar que tenemos una posición válida
          if (editorData.editorInstance && 
              curso.line !== undefined && curso.ch !== undefined &&
              curso.line !== null && curso.ch !== null) {
            const editor = editorData.editorInstance;
            
            // Validar que la posición sea válida
            if (editor.lineCount() === 0) {
              // Editor vacío, ir al inicio
              editor.focus();
              return;
            }
            
            // Asegurarse de que la línea existe
            const line = Math.max(0, Math.min(curso.line, editor.lineCount() - 1));
            const maxCh = Math.max(0, editor.getLine(line).length);
            const ch = Math.max(0, Math.min(curso.ch, maxCh));
            
            // Mover el cursor a la posición del usuario (incluso si es 0,0, puede ser válido)
            editor.setCursor(CodeMirror.Pos(line, ch));
            editor.scrollIntoView(CodeMirror.Pos(line, ch), 100);
            editor.focus();
            
            // Resaltar brevemente la línea con un marcador visual
            const highlight = document.createElement('div');
            highlight.style.backgroundColor = usuarioInfo.color || '#00ffcc';
            highlight.style.opacity = '0.3';
            highlight.style.position = 'absolute';
            highlight.style.width = '100%';
            highlight.style.height = editor.defaultTextHeight() + 'px';
            highlight.style.marginTop = '-1.2em';
            highlight.style.pointerEvents = 'none';
            highlight.style.transition = 'opacity 2s ease-out';
            
            const marker = editor.setBookmark(CodeMirror.Pos(line, 0), {
              widget: highlight,
              insertLeft: false
            });
            
            setTimeout(() => {
              if (highlight) {
                highlight.style.opacity = '0';
              }
            }, 100);
            
            setTimeout(() => {
              if (marker) marker.clear();
            }, 2000);
          } else {
            // No hay posición válida, solo cambiar a la pestaña
            if (editorData.editorInstance) {
              editorData.editorInstance.focus();
            }
          }
        } else {
          // No encontramos el cursor, solo cambiar a la pestaña y enfocar
          if (editorData && editorData.editorInstance) {
            editorData.editorInstance.focus();
          }
        }
      }, 400);
    }
    
    function navegarAPosicionInvitada(tabId, line, ch, usuario, color) {
      if (!tabId) {
        alert('La pestaña no existe');
        return;
      }
      
      // Permitir acceso temporal a hojas ajenas por invitación
      navegandoPorInvitacion = true;
      
      // Si la pestaña no es la activa, cambiar a ella primero
      if (pestañaActiva !== tabId) {
        cambiarPestaña(tabId);
      }
      
      // Esperar a que el cambio de pestaña se complete
      setTimeout(() => {
        const editorData = editoresPorPestaña.get(tabId);
        
        if (!editorData || !editorData.editorInstance) {
          alert('No se pudo acceder al editor');
          return;
        }
        
        const editor = editorData.editorInstance;
        
        // Validar que la posición sea válida
        if (editor.lineCount() === 0) {
          // Editor vacío, ir al inicio
          editor.focus();
          return;
        }
        
        // Asegurarse de que la línea existe
        const validLine = Math.max(0, Math.min(line, editor.lineCount() - 1));
        const maxCh = Math.max(0, editor.getLine(validLine).length);
        const validCh = Math.max(0, Math.min(ch, maxCh));
        
        // Mover el cursor a la posición invitada
        editor.setCursor(CodeMirror.Pos(validLine, validCh));
        editor.scrollIntoView(CodeMirror.Pos(validLine, validCh), 100);
        editor.focus();
        
        // Resaltar brevemente la línea con un marcador visual
        const highlight = document.createElement('div');
        highlight.style.backgroundColor = color || '#00ffcc';
        highlight.style.opacity = '0.3';
        highlight.style.position = 'absolute';
        highlight.style.width = '100%';
        highlight.style.height = editor.defaultTextHeight() + 'px';
        highlight.style.marginTop = '-1.2em';
        highlight.style.pointerEvents = 'none';
        highlight.style.transition = 'opacity 2s ease-out';
        
        const marker = editor.setBookmark(CodeMirror.Pos(validLine, 0), {
          widget: highlight,
          insertLeft: false
        });
        
        setTimeout(() => {
          if (highlight) {
            highlight.style.opacity = '0';
          }
        }, 100);
        
        setTimeout(() => {
          if (marker) marker.clear();
        }, 2000);
        
        // Restaurar el flag después de navegar
        setTimeout(() => {
          navegandoPorInvitacion = false;
        }, 500);
      }, 400);
    }

    function mostrarIndicadorSincronizacion() {
      const indicator = document.getElementById('sync-indicator');
      indicator.classList.add('active');
      setTimeout(() => {
        indicator.classList.remove('active');
      }, 2000);
    }

    // Funciones para manejar cursos remotos
    function actualizarCursoRemoto(socketId, username, color, line, ch) {
      if (!editorInstance || !mostrarCursosRemotos) return; // Solo mostrar si está activado

      // Si ya existe un marcador para este usuario, eliminarlo primero
      if (cursosRemotos.has(socketId)) {
        const cursoExistente = cursosRemotos.get(socketId);
        if (cursoExistente.marker) {
          cursoExistente.marker.clear();
        }
      }

      // Crear un marcador en la posición del cursor
      const pos = CodeMirror.Pos(line, ch);
      
      // Crear widget personalizado para mostrar el cursor
      const widget = document.createElement('span');
      widget.className = 'remote-cursor-marker';
      widget.style.backgroundColor = color;
      widget.style.width = '2px';
      widget.style.height = '1.2em';
      widget.style.display = 'inline-block';
      widget.style.marginLeft = '-1px';
      widget.style.marginRight = '-1px';
      widget.style.verticalAlign = 'text-bottom';
      widget.style.position = 'relative';
      
      // Crear etiqueta con el nombre del usuario
      const label = document.createElement('span');
      label.className = 'remote-cursor-label';
      label.textContent = obtenerNombreUsuario(username);
      label.style.backgroundColor = color;
      label.style.color = 'white';
      label.style.position = 'absolute';
      label.style.top = '-1.5em';
      label.style.left = '0';
      label.style.padding = '2px 6px';
      label.style.fontSize = '11px';
      label.style.fontWeight = 'bold';
      label.style.borderRadius = '3px';
      label.style.whiteSpace = 'nowrap';
      label.style.boxShadow = '0 1px 3px rgba(0,0,0,0.3)';
      label.style.zIndex = '1000';
      label.style.pointerEvents = 'none';
      
      // Contenedor para el cursor y la etiqueta
      const container = document.createElement('span');
      container.style.position = 'relative';
      container.style.display = 'inline-block';
      container.appendChild(widget);
      container.appendChild(label);

      // Marcar la posición exacta del cursor usando setBookmark
      const marker = editorInstance.setBookmark(pos, {
        widget: container,
        insertLeft: false,
        handleMouseEvents: false
      });

      // Guardar referencia al marcador
      cursosRemotos.set(socketId, {
        marker: marker,
        username: username,
        color: color,
        line: line,
        ch: ch
      });

      // Actualizar cuando el editor se redibuje
      setTimeout(() => {
        editorInstance.refresh();
      }, 0);
    }

    function eliminarCursoRemoto(socketId) {
      if (cursosRemotos.has(socketId)) {
        const curso = cursosRemotos.get(socketId);
        if (curso.marker) {
          curso.marker.clear();
        }
        cursosRemotos.delete(socketId);
        setTimeout(() => {
          editorInstance.refresh();
        }, 0);
      }
    }

    // Limpiar todos los cursos remotos
    function limpiarTodosLosCursosRemotos() {
      cursosRemotos.forEach((curso, socketId) => {
        if (curso.marker) {
          curso.marker.clear();
        }
      });
      cursosRemotos.clear();
      setTimeout(() => {
        if (editorInstance) editorInstance.refresh();
      }, 0);
    }

    // Función para inicializar el arrastre del menú de usuarios
    function inicializarArrastreMenu() {
      const menu = document.getElementById('usuarios-conectados');
      const header = document.getElementById('usuarios-header');
      const minimizarBtn = document.getElementById('minimizar-usuarios-btn');
      
      if (!menu || !header) return;

      // Evitar inicialización múltiple
      if (menu.hasAttribute('data-arrastre-inicializado')) return;
      menu.setAttribute('data-arrastre-inicializado', 'true');

      // Restaurar posición guardada o usar posición por defecto (top center)
      const posicionGuardada = localStorage.getItem('menuUsuariosPosicion');
      if (posicionGuardada) {
        try {
          const pos = JSON.parse(posicionGuardada);
          menu.style.top = pos.top + 'px';
          menu.style.left = pos.left + 'px';
          menu.style.transform = 'none'; // Quitar transform cuando hay posición guardada
        } catch (e) {
          console.warn('Error al restaurar posición del menú:', e);
          // Si hay error, usar posición por defecto
          menu.style.left = '50%';
          menu.style.transform = 'translateX(-50%)';
        }
      } else {
        // Posición por defecto: top center
        menu.style.left = '50%';
        menu.style.transform = 'translateX(-50%)';
      }

      // Prevenir que el botón de minimizar active el arrastre
      minimizarBtn.addEventListener('mousedown', (e) => {
        e.stopPropagation();
      });

      // Evento de inicio de arrastre
      header.addEventListener('mousedown', (e) => {
        // No arrastrar si se hace click en el botón de minimizar
        if (e.target === minimizarBtn || minimizarBtn.contains(e.target)) {
          return;
        }

        arrastrandoMenu = true;
        menu.classList.add('arrastrando');
        
        // Calcular offset del mouse respecto al menú
        const rect = menu.getBoundingClientRect();
        offsetMenu.x = e.clientX - rect.left;
        offsetMenu.y = e.clientY - rect.top;

        e.preventDefault();
      });

      // Evento de movimiento del mouse
      document.addEventListener('mousemove', (e) => {
        if (!arrastrandoMenu) return;

        // Calcular nueva posición
        let nuevaX = e.clientX - offsetMenu.x;
        let nuevaY = e.clientY - offsetMenu.y;

        // Limitar a los bordes de la ventana
        const rect = menu.getBoundingClientRect();
        const maxX = window.innerWidth - rect.width;
        const maxY = window.innerHeight - rect.height;

        nuevaX = Math.max(0, Math.min(nuevaX, maxX));
        nuevaY = Math.max(0, Math.min(nuevaY, maxY));

        // Actualizar posición
        menu.style.top = nuevaY + 'px';
        menu.style.left = nuevaX + 'px';
        menu.style.transition = 'none'; // Desactivar transición durante arrastre
      });

      // Evento de fin de arrastre
      document.addEventListener('mouseup', () => {
        if (arrastrandoMenu) {
          arrastrandoMenu = false;
          menu.classList.remove('arrastrando');
          menu.style.transition = 'box-shadow 0.3s ease'; // Reactivar transición

          // Guardar posición (quitar transform cuando se arrastra)
          menu.style.transform = 'none';
          const rect = menu.getBoundingClientRect();
          const posicion = {
            top: rect.top,
            left: rect.left
          };
          localStorage.setItem('menuUsuariosPosicion', JSON.stringify(posicion));
        }
      });
    }

    // Función para minimizar/maximizar el menú de usuarios
    function toggleMenuUsuarios() {
      const menu = document.getElementById('usuarios-conectados');
      const btn = document.getElementById('minimizar-usuarios-btn');
      
      menuUsuariosMinimizado = !menuUsuariosMinimizado;
      
      if (menuUsuariosMinimizado) {
        menu.classList.add('minimizado');
        btn.textContent = '▲';
        btn.title = 'Maximizar';
      } else {
        menu.classList.remove('minimizado');
        btn.textContent = '▼';
        btn.title = 'Minimizar';
      }
    }

    // Función para abrir/cerrar el menú de usuarios
    function toggleMostrarMenuUsuarios() {
      const menu = document.getElementById('usuarios-conectados');
      if (!menu) return;
      
      if (menu.style.display === 'none' || menu.style.display === '') {
        menu.style.display = 'block';
      } else {
        menu.style.display = 'none';
      }
    }

    // Función para toggle de cursos remotos
    function toggleCursosRemotos() {
      mostrarCursosRemotos = !mostrarCursosRemotos;
      const toggle = document.getElementById('toggle-cursos-remotos');
      
      if (mostrarCursosRemotos) {
        toggle.classList.add('active');
        // Mostrar cursos remotos SOLO de la pestaña activa
        if (pestañaActiva) {
          const editorData = editoresPorPestaña.get(pestañaActiva);
          if (editorData && editorData.cursosRemotos) {
            editorData.cursosRemotos.forEach((curso, socketId) => {
              if (curso.line !== undefined && curso.ch !== undefined && curso.username && curso.color) {
                actualizarCursoRemotoEnPestaña(pestañaActiva, socketId, curso.username, curso.color, curso.line, curso.ch);
              }
            });
          }
        }
      } else {
        toggle.classList.remove('active');
        // Ocultar todos los cursos de TODAS las pestañas (limpiar marcadores pero mantener datos)
        editoresPorPestaña.forEach((editorData, tabId) => {
          if (editorData && editorData.cursosRemotos) {
            editorData.cursosRemotos.forEach((curso, socketId) => {
              if (curso.marker) {
                curso.marker.clear();
                curso.marker = null;
              }
            });
            if (editorData.editorInstance) {
              editorData.editorInstance.refresh();
            }
          }
        });
      }
    }

    function toggleColaboracion() {
      const nuevoEstado = !permitirColaboracion;
      const toggle = document.getElementById('toggle-colaboracion');
      
      if (nuevoEstado) {
        // Intentando activar - pedir contraseña
        if (socket && socket.connected) {
          // Pedir contraseña al usuario
          const contraseñaIngresada = prompt('Ingresá la contraseña para activar la colaboración:');
          
          if (contraseñaIngresada === null) {
            // Usuario canceló
            return;
          }
          
          // Verificar la contraseña con el servidor
          socket.emit('verificar-contraseña-colaboracion', {
            contraseñaIngresada: contraseñaIngresada
          });
        } else {
          alert('No estás conectado al servidor');
          return;
        }
      } else {
        // Desactivando - no requiere contraseña
        permitirColaboracion = false;
        toggle.classList.remove('active');
        // Si se desactiva, notificar a todos los demás usuarios
        if (socket && socket.connected) {
          socket.emit('desactivar-colaboracion-global');
        }
        // Actualizar estado de solo lectura de todos los editores
        actualizarEstadoSoloLecturaTodos();
        
        // Actualizar estado visual de las pestañas
        actualizarEstadoVisualPestañas();
        
        // Mover al usuario a una hoja propia si está en una que no le pertenece
        moverAhojaPropia();
      }
    }

    // Inicializar event listeners después de que el DOM esté listo
    window.addEventListener('DOMContentLoaded', () => {
      // Botón de minimizar menú
      const minimizarBtn = document.getElementById('minimizar-usuarios-btn');
      if (minimizarBtn) {
        minimizarBtn.addEventListener('click', toggleMenuUsuarios);
      }

      // Toggle de cursos remotos
      const toggleCursos = document.getElementById('toggle-cursos-remotos');
      if (toggleCursos) {
        toggleCursos.addEventListener('click', toggleCursosRemotos);
      }

      // Toggle de colaboración
      const toggleColab = document.getElementById('toggle-colaboracion');
      if (toggleColab) {
        toggleColab.addEventListener('click', toggleColaboracion);
      }

      // Inicializar arrastre del menú
      inicializarArrastreMenu();
    });

    // Permitir Enter en el input de usuario y hacer focus automático
    const inputUsuario = document.getElementById('input-usuario');
    if (inputUsuario) {
      // Hacer focus en el input cuando se carga la página
      setTimeout(() => {
        inputUsuario.focus();
      }, 100);
      
      inputUsuario.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          conectarUsuario();
        }
      });
    }

    document.addEventListener('keydown', function(event) {
      if (event.key === 'F8') {
        const resultado = document.getElementById('resultado-validacion');
        if (resultado) {
          resultado.classList.toggle('maximizado');
        }
      }
    });
  