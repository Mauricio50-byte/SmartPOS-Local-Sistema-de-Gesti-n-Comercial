# Guía Definitiva de Conexión Remota (PC como Servidor)

Esta guía describe la solución recomendada para permitir que los trabajadores accedan al sistema POS desde sus celulares (o desde sus casas) utilizando el PC del negocio como servidor central, sin configuraciones complejas de red.

## 🚀 La Solución: Cloudflare Tunnel

Hemos implementado una nueva lógica basada en **Cloudflare Tunnel**. A diferencia de soluciones anteriores (como Serveo o Ngrok), esta tecnología ofrece:
1.  **Estabilidad:** No se desconecta cada 2 horas.
2.  **Velocidad:** Usa la red global de Cloudflare.
3.  **Seguridad:** Todo el tráfico viaja encriptado (HTTPS).
4.  **Cero Configuración:** No necesitas abrir puertos en el router ni llamar a tu proveedor de internet.

---

## 📋 Instrucciones de Uso

### Paso 1: Iniciar el Modo Nube
En lugar de usar el archivo antiguo, hemos creado un nuevo script automatizado.

1. Ve a la carpeta del proyecto en el Escritorio.
2. Haz doble clic en el archivo:
   👉 **`iniciar_nube_segura.bat`**
   *(Si es la primera vez, descargará automáticamente la herramienta necesaria. Solo espera unos segundos).*
3. Se abrirá una ventana negra. Busca la URL que dice:
   `https://[palabras-aleatorias].trycloudflare.com`
   *(Ejemplo: https://tienda-pepe-luna.trycloudflare.com)*

> **Nota:** No cierres esta ventana negra mientras quieras que el sistema esté accesible desde internet.

### Paso 2: Generar el QR de Conexión
1. En el PC del negocio, abre el sistema POS (usualmente en `http://localhost:8100` o la versión instalada).
2. Ve al menú y selecciona **"Conectar Dispositivo"** (icono de celular/QR).
3. Cambia la pestaña superior a **"Internet (Túnel)"**.
4. Pega la URL que copiaste en el paso anterior (la que termina en `.trycloudflare.com`).
5. El sistema generará un **Código QR Único**.

### Paso 3: Conexión del Trabajador
1. El trabajador escanea el código QR con su celular.
2. Se abrirá el navegador con el sistema POS.
3. **Login:** El trabajador ingresa con **su propio Usuario y Contraseña** (asignados previamente por el administrador).
4. **Listo:** El trabajador puede realizar ventas, revisar inventario, etc.

---

## 🔒 ¿Cómo funciona la seguridad?
- **Datos Centralizados:** Aunque el trabajador use su celular, **ningún dato se guarda en su teléfono**. Todo se guarda inmediatamente en la base de datos de tu PC (`c:\Users\andre\OneDrive\Escritorio\sistema-pos\backend-api\prisma\dev.db` o PostgreSQL).
- **Sesión Controlada:** El QR generado tiene una validez de 24 horas por defecto, pero el sistema requiere autenticación real.
- **Sin Instalaciones:** El trabajador no necesita instalar ninguna App, todo funciona desde Chrome/Safari en su móvil.

## 💡 Opción PRO (Para usuarios avanzados)
Si te molesta que la URL cambie cada vez que reinicias el servidor (ej. `tienda-luna.trycloudflare.com` hoy, y `gato-feliz.trycloudflare.com` mañana), Cloudflare ofrece **Túneles con Nombre Fijo** gratis.

1. Crea una cuenta gratuita en [Cloudflare Zero Trust](https://one.dash.cloudflare.com/).
2. Ve a **Access > Tunnels** y crea uno nuevo.
3. Sigue las instrucciones para instalar el servicio en tu PC Windows.
4. Así tendrás siempre la misma URL (ej: `pos.mitienda.com`) y no tendrás que copiar y pegar enlaces nunca más.

*Por ahora, el script `iniciar_nube_segura.bat` es la forma más rápida y sin registro para empezar.*
