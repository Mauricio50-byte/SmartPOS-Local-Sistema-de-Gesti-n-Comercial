# 🚀 Guía de Despliegue y Entrega al Cliente

Esta guía explica cómo empaquetar tu sistema POS para entregarlo a un cliente que **NO TIENE INTERNET**, usando la arquitectura Docker pero con una experiencia de instalación sencilla.

## 1. Preparación (En tu PC de Desarrollo)

Hemos creado un script llamado `empaquetar_obra.bat` en la raíz de tu proyecto. Este script hará todo el trabajo sucio.

1.  Asegúrate de que tu Docker Desktop esté corriendo.
2.  Ejecuta el archivo `empaquetar_obra.bat`.
    *   Construirá las últimas versiones de tu Backend y Frontend.
    *   Descargará la imagen de PostgreSQL.
    *   Guardará todas las imágenes en archivos `.tar` dentro de `dist/imagenes`.

**Nota:** Este proceso puede tardar unos minutos y ocupará varios cientos de megas en disco.

## 2. Qué entregar al Cliente

Una vez finalizado el script anterior, tendrás una carpeta `dist` lista. Debes entregarle al cliente **toda la carpeta `dist`** (puedes comprimirla en un `.zip` o copiarla a una USB).

La estructura que el cliente recibe será:

```text
/Carpeta_POS_Entregable
  ├── imagenes/             # Archivos pesados .tar (Backend, Frontend, Postgres)
  ├── .env.example          # Configuración base
  ├── docker-compose.yml    # Orquestadora
  └── levantar.bat          # << EL CLIENTE SOLO USA ESTO
```

## 3. Instalación (En el PC del Cliente)

Instrucciones para tu cliente:

1.  **Copiar** la carpeta al Escritorio (o Documentos).
2.  **Clic derecho** en `levantar.bat` -> **Ejecutar como Administrador**.
    *   *¿Por qué Administrador?* Para configurar el Firewall de Windows automáticamente y permitir que los celulares se conecten.
3.  El sistema verificará si tiene Docker.
    *   Si **NO** tiene Docker, le pedirá instalarlo (puedes incluir el instalador de Docker Desktop en la USB para ser 100% offline).
    *   Si **SI** tiene Docker, cargará las imágenes y levantará el sistema.
4.  Se creará un acceso directo en el Escritorio llamado **"INICIAR SISTEMA POS"**.
5.  Se abrirá el navegador automáticamente.

## 4. Conexión de Celulares (Modo Offline)

Como no hay internet, no hay dominio `.com`. Usamos la IP local.

1.  Abre el sistema en el PC Servidor.
2.  Inicia sesión como **Administrador**.
3.  En la barra superior (derecha), verás un icono de **Código QR**. Dale clic.
4.  Aparecerá un QR grande.
5.  El empleado escanea ese QR con su celular (conectado al mismo WiFi).
6.  **¡Listo!** El celular se conecta y se loguea automáticamente (Magic Link de 24 horas).

### Solución de Problemas Comunes

*   **"No conecta el celular":** Verifica que el PC y el Celular estén en la misma red WiFi. El script `levantar.bat` ya configuró el firewall, pero a veces los antivirus de terceros (McAfee, Avast) bloquean puertos. Desactívalos temporalmente para probar.
*   **"El QR no funciona":** Si el PC está conectado por cable y el celular por WiFi, a veces tienen rangos de IP distintos. Asegúrate de que se "van" entre ellos (ping).
