@echo off
title SERVIDOR NUBE SEGURO (CLOUDFLARE)
color 0b

echo ========================================================
echo   MODO ONLINE DEFINITIVO - SISTEMA POS (CLOUDFLARE)
echo ========================================================
echo.
echo Este script utiliza la infraestructura global de Cloudflare
echo para crear un enlace seguro y rapido a tu PC.
echo.

REM 1. Verificar si existe el ejecutable de Cloudflared
if exist "cloudflared.exe" goto :backend_check

echo [INFO] Herramienta de tunel no encontrada.
echo [....] Descargando Cloudflared (esto solo pasa la primera vez)...
echo.

REM Usamos PowerShell para descargar
powershell -Command "Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile 'cloudflared.exe'"

if not exist "cloudflared.exe" (
    echo [ERROR] No se pudo descargar automaticamente.
    echo.
    echo Por favor descarga 'cloudflared-windows-amd64.exe' manualmente de:
    echo https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe
    echo y colocalo en esta carpeta con el nombre 'cloudflared.exe'.
    echo.
    pause
    exit
)
echo [OK] Descarga completada.
echo.

:backend_check
REM 2. Iniciar Backend (si no esta corriendo)
netstat -an | find "3000" >nul
if %errorlevel% equ 0 (
    echo [INFO] Servidor local ya detectado en puerto 3000.
    goto :tunnel_start
)

echo [1/2] El servidor local no parece estar activo.
echo        Iniciando Backend en segundo plano...
start "BACKEND POS" /B cmd /c "cd backend-api && npm start"
echo        Esperando 15 segundos a que inicie...
timeout /t 15 >nul

:tunnel_start
REM 3. Iniciar Tunel
echo.
echo [2/2] Estableciendo conexion segura con Cloudflare...
echo.
echo ========================================================
echo   INSTRUCCIONES PARA EL USUARIO:
echo ========================================================
echo.
echo   1. Espera a que aparezca un cuadro con enlaces abajo.
echo   2. Busca el enlace que termina en ".trycloudflare.com"
echo      (Suele ser el ultimo o estar dentro de un cuadro)
echo   3. Copia ese enlace.
echo   4. Ve al Sistema POS -^> Conectar -^> Internet.
echo   5. Pega el enlace y genera el QR.
echo.
echo ========================================================
echo.

REM Ejecutar el tunel
cloudflared.exe tunnel --url http://localhost:3000

REM Si cloudflared se cierra, pausamos para ver el error
echo.
echo [ATENCION] El tunel se ha cerrado.
pause
