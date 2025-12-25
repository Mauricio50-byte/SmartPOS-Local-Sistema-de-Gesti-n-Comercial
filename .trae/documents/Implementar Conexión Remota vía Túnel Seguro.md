# Implementación de Modo Online (Tunneling) para Conexión Segura

Esta solución permitirá conectar los dispositivos móviles a través de un túnel seguro de internet, eliminando los problemas de red local y firewall.

## 1. Modificaciones en el Frontend (Modal QR)
**Archivo:** `src/app/shared/components/conexion-qr/conexion-qr.component.ts` y `.html`
- Agregar un interruptor (toggle) o pestaña para alternar entre "Modo Local (WiFi)" y "Modo Online (Internet)".
- En "Modo Online", mostrar un campo de texto para pegar la URL pública (ej. `https://mi-pos.loca.lt`).
- Lógica para generar el QR combinando la URL pública ingresada + el token de autenticación del usuario seleccionado.
- Guardar esta URL en `localStorage` para no tener que escribirla cada vez.

## 2. Preparación del Backend
**Archivo:** `backend-api/src/servidor.js` (Verificación)
- Confirmar que el backend sirve correctamente los archivos estáticos del frontend en la ruta raíz `/` (ya verificado en pasos anteriores, pero haremos una prueba de integridad).
- Esto es crucial para que, al entrar a la URL del túnel (puerto 3000), se cargue la App automáticamente.

## 3. Script de Automatización
**Nuevo Archivo:** `iniciar_modo_online.bat`
- Script automatizado para Windows.
- **Paso 1:** Inicia el servidor backend normalmente.
- **Paso 2:** Instala/Ejecuta `localtunnel` (o `ngrok` si prefieres) apuntando al puerto 3000.
- **Paso 3:** Muestra en pantalla la URL generada para que el usuario la copie y pegue en el sistema.

## Resultado Esperado
1. Ejecutas `iniciar_modo_online.bat`.
2. Copias la URL que aparece (ej. `https://happy-dog-22.loca.lt`).
3. Abres el sistema en tu PC, vas a "Conectar Dispositivo".
4. Pegas la URL.
5. Los trabajadores escanean el QR y se conectan instantáneamente, ya sea por WiFi o Datos Móviles, con conexión segura HTTPS.
