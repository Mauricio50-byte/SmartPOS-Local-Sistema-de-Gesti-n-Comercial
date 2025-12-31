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
powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile 'cloudflared.exe'"

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
echo [INFO] Verificando estado del servidor...

REM Reconstruir frontend para asegurar que existe la carpeta www
echo [INFO] Verificando archivos del frontend...
if not exist "frontend-app\www\index.html" (
    echo [INFO] Construyendo frontend - puede tardar unos minutos...
    cd frontend-app
    call npm.cmd install
    call npm.cmd run build
    cd ..
)

REM Matar proceso en puerto 3000 usando PowerShell para evitar errores de sintaxis en Batch
echo [INFO] Asegurando que el servidor este actualizado...
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Get-NetTCPConnection -LocalPort 3000 -ErrorAction Stop | Select-Object -ExpandProperty OwningProcess | Where-Object { $_ -ne 0 } | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue } } catch {}"

echo [INFO] Iniciando Backend POS...
start "BACKEND POS" cmd /k "cd backend-api && npm.cmd start"
echo [INFO] Esperando a que el sistema cargue (15s)...
timeout /t 15 >nul

:tunnel_start
REM 3. Iniciar Tunel
echo.
echo [INFO] Estableciendo conexion segura con Cloudflare...
echo.
echo ========================================================
echo   INSTRUCCIONES:
echo ========================================================
echo.
echo   1. Copia el enlace que termina en ".trycloudflare.com"
echo      (Aparecera abajo en unos segundos)
echo   2. Ve al Sistema POS -^> Conectar -^> Internet.
echo   3. Pega el enlace y genera el QR.
echo.
echo ========================================================
echo.

REM Ejecutar el tunel
cloudflared.exe tunnel --protocol http2 --url http://localhost:3000

REM Si cloudflared se cierra, pausamos para ver el error
echo.
echo [ATENCION] El tunel se ha cerrado.
pause
