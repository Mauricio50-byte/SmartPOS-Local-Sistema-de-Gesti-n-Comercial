@echo off
setlocal enableextensions enabledelayedexpansion
title INSTALADOR SISTEMA POS - CARGANDO...

echo ===================================================
echo   SISTEMA DE GESTION COMERCIAL - LOCAL FIRST
echo ===================================================
echo.

:: 1. Verificando Permisos
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [!] Requiere permisos de Administrador para configurar red.
    echo     Click derecho -> Ejecutar como administrador.
    pause
    exit /b
)

:: 2. Docker Check
where docker >nul 2>&1
if %errorLevel% neq 0 (
    echo [X] Docker no esta instalado.
    echo     Por favor instale Docker Desktop desde: https://www.docker.com/products/docker-desktop
    start https://www.docker.com/products/docker-desktop
    pause
    exit /b
)

docker info >nul 2>&1
if %errorLevel% neq 0 (
    echo [X] Docker esta instalado pero no esta corriendo.
    echo     Inicie Docker Desktop y vuelva a intentar.
    pause
    exit /b
)

:: 3. Cargar Imagenes Offline (Si existen)
if exist "imagenes\postgres.tar" (
    echo [*] Verificando imagenes offline...
    
    docker image inspect postgres:16-alpine >nul 2>&1
    if %errorLevel% neq 0 (
        echo     - Cargando Postgres...
        docker load -i imagenes\postgres.tar
    )
    
    docker image inspect sistema-pos-backend:latest >nul 2>&1
    if %errorLevel% neq 0 (
        echo     - Cargando Backend...
        docker load -i imagenes\backend.tar
    )
    
    docker image inspect sistema-pos-frontend:latest >nul 2>&1
    if %errorLevel% neq 0 (
        echo     - Cargando Frontend...
        docker load -i imagenes\frontend.tar
    )
)

:: 4. Firewall
echo [*] Configurando Firewall...
netsh advfirewall firewall show rule name="POS Sistema Local" >nul
if %errorLevel% neq 0 (
    netsh advfirewall firewall add rule name="POS Sistema Local" dir=in action=allow protocol=TCP localport=3000,8100,5432 profile=private,domain >nul
)

:: 5. Levantar
echo [*] Iniciando servicios...
docker-compose up -d --remove-orphans

if %errorLevel% neq 0 (
    echo [X] Error iniciando. Revise si los puertos estan ocupados.
    pause
    exit /b
)

:: 6. Acceso Directo
set "SHORTCUT_PATH=%USERPROFILE%\Desktop\INICIAR SISTEMA POS.lnk"
set "TARGET_PATH=%~dp0levantar.bat"
if not exist "%SHORTCUT_PATH%" (
    powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%SHORTCUT_PATH%'); $s.TargetPath = '%TARGET_PATH%'; $s.WorkingDirectory = '%~dp0'; $s.IconLocation = 'shell32.dll,239'; $s.Save()"
)

echo.
echo   SISTEMA LISTO!
echo   Acceda en: http://localhost:8100
echo.
timeout /t 3 >nul
start http://localhost:8100
pause
