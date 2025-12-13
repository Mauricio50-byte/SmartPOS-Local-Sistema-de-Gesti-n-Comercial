@echo off
setlocal enableextensions

echo Verificando Docker Desktop...
where docker >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo Docker no esta instalado o no esta en PATH.
  echo Descargue e instale Docker Desktop: https://www.docker.com/products/docker-desktop/
  pause
  exit /b 1
)

echo Usando archivo .env (si existe)...
if exist .env (
  echo Cargando variables desde .env
) else (
  echo No se encontro .env, use dist/.env.example como referencia.
)

echo Levantando servicios...
docker compose --env-file .env -f docker-compose.yml up -d
if %ERRORLEVEL% NEQ 0 (
  echo Error al levantar contenedores.
  pause
  exit /b 1
)

echo Creando reglas de firewall (puertos 3000 y 8100)...
netsh advfirewall firewall add rule name="POS Backend" dir=in action=allow protocol=TCP localport=3000 >nul 2>nul
netsh advfirewall firewall add rule name="POS Frontend" dir=in action=allow protocol=TCP localport=8100 >nul 2>nul

echo Servicios levantados.
echo Backend: http://localhost:3000
echo Frontend: http://localhost:8100
pause
endlocal
