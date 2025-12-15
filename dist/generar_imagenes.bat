@echo off
setlocal enableextensions enabledelayedexpansion

echo Verificando Docker Desktop...
where docker >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo Docker no esta instalado o no esta en PATH.
  echo Descargue e instale Docker Desktop: https://www.docker.com/products/docker-desktop/
  pause
  exit /b 1
)

rem Tag de version (por defecto 1.0.0). Usar: generar_imagenes.bat 1.0.0
set TAG=%1
if "%TAG%"=="" set TAG=1.0.0

set OUTDIR=imagenes
if not exist "%OUTDIR%" mkdir "%OUTDIR%"

echo Construyendo imagen del backend (sistema-pos-backend:%TAG%)...
docker build -t sistema-pos-backend:%TAG% ..\backend-api
if %ERRORLEVEL% NEQ 0 (
  echo Error construyendo backend.
  pause
  exit /b 1
)
docker tag sistema-pos-backend:%TAG% sistema-pos-backend:latest

echo Construyendo imagen del frontend (sistema-pos-frontend:%TAG%)...
docker build -t sistema-pos-frontend:%TAG% ..\frontend-app
if %ERRORLEVEL% NEQ 0 (
  echo Error construyendo frontend.
  pause
  exit /b 1
)
docker tag sistema-pos-frontend:%TAG% sistema-pos-frontend:latest

echo Exportando imagenes a archivos .tar...
docker save -o "%OUTDIR%\backend.tar" sistema-pos-backend:latest
if %ERRORLEVEL% NEQ 0 (
  echo Error exportando backend.
  pause
  exit /b 1
)
docker save -o "%OUTDIR%\frontend.tar" sistema-pos-frontend:latest
if %ERRORLEVEL% NEQ 0 (
  echo Error exportando frontend.
  pause
  exit /b 1
)

echo Descargando imagen oficial de PostgreSQL (postgres:16-alpine)...
docker pull postgres:16-alpine
if %ERRORLEVEL% NEQ 0 (
  echo Error descargando postgres:16-alpine.
  pause
  exit /b 1
)

echo Exportando imagen de PostgreSQL a .tar...
docker save -o "%OUTDIR%\postgres.tar" postgres:16-alpine
if %ERRORLEVEL% NEQ 0 (
  echo Error exportando postgres.
  pause
  exit /b 1
)

echo.
echo Listo. Archivos generados:
echo  - %CD%\%OUTDIR%\backend.tar
echo  - %CD%\%OUTDIR%\frontend.tar
echo  - %CD%\%OUTDIR%\postgres.tar
echo.
echo Para cargar en el equipo del cliente:
echo  Simplemente ejecute levantar.bat
echo.
pause
endlocal
