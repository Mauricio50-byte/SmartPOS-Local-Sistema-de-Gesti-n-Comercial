@echo off
title ACTUALIZAR SISTEMA POS (FORZADO)
color 0e

echo ========================================================
echo   ACTUALIZADOR DEL SISTEMA POS - MODO ROBUSTO
echo ========================================================
echo.
echo 1. Deteniendo procesos de Node.js y Cloudflared...
taskkill /F /IM node.exe /T >nul 2>&1
taskkill /F /IM cloudflared.exe /T >nul 2>&1
timeout /t 2 >nul

echo.
echo 2. Limpiando carpeta 'www' (intentando desbloquear)...
cd frontend-app
if exist "www" (
    REM Intentar renombrar primero si esta bloqueado
    ren www www_old >nul 2>&1
    if exist "www_old" (
        rmdir /s /q "www_old" >nul 2>&1
    )
    
    REM Si aun existe www (renombrado fallo), intentar borrar directo
    if exist "www" (
        rmdir /s /q "www"
    )
)
cd ..

echo.
echo 3. Esperando liberacion de archivos (OneDrive)...
timeout /t 3 >nul

echo.
echo 4. Iniciando construccion del frontend...
cd frontend-app
call npm.cmd run build
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Fallo la construccion. 
    echo Posible causa: OneDrive esta bloqueando los archivos.
    echo SOLUCION: Pausa la sincronizacion de OneDrive momentaneamente e intenta de nuevo.
    pause
    exit /b
)
cd ..

echo.
echo ========================================================
echo   ACTUALIZACION COMPLETADA EXITOSAMENTE
echo ========================================================
echo.
echo Ahora puedes ejecutar "iniciar_nube_segura.bat"
echo.
pause