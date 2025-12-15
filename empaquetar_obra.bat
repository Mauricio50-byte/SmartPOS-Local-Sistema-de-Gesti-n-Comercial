@echo off
setlocal
title EMPAQUETADOR DE SISTEMA POS (PARA DESARROLLADOR)

echo ===================================================
echo   GENERADOR DE INSTALADOR OFFLINE
echo ===================================================
echo.
echo   Este script preparara la carpeta 'dist' para ser entregada
echo   a un cliente SIN INTERNET.
echo.
echo   Pasos que realizara:
echo   1. Construir las imagenes de Docker (Frontend y Backend).
echo   2. Descargar la imagen de Postgres.
echo   3. Exportar todas las imagenes a archivos .tar en 'dist/imagenes'.
echo.
pause

:: Crear carpeta de imagenes si no existe
if not exist "dist\imagenes" mkdir "dist\imagenes"

echo.
echo [1/4] Construyendo imagenes del sistema...
docker-compose build
if %ERRORLEVEL% NEQ 0 (
    echo [X] Fallo la construccion. Revisa errores.
    pause
    exit /b
)

echo.
echo [2/4] Etiquetando imagenes para distribucion...
:: Asegurarnos que los nombres coincidan con el docker-compose.yml de dist
docker tag sistema-pos-backend:latest sistema-pos-backend:latest
docker tag sistema-pos-frontend:latest sistema-pos-frontend:latest
:: Nota: Docker Compose suele usar sistema-pos_backend, ajustaremos los nombres

:: Vamos a forzar los nombres esperados
docker tag sistema-pos-backend sistema-pos-backend:latest
docker tag sistema-pos-frontend sistema-pos-frontend:latest
:: Asegurar postgres
docker pull postgres:16-alpine

echo.
echo [3/4] Guardando imagenes en archivos .tar (Esto demora unos minutos)...
echo    - Guardando Postgres...
docker save -o dist/imagenes/postgres.tar postgres:16-alpine

echo    - Guardando Backend...
:: El nombre de la imagen construida por compose suele ser 'carpeta_servicio'
for /f "tokens=*" %%i in ('docker compose images -q backend') do set BACKEND_ID=%%i
docker tag %BACKEND_ID% sistema-pos-backend:latest
docker save -o dist/imagenes/backend.tar sistema-pos-backend:latest

echo    - Guardando Frontend...
for /f "tokens=*" %%i in ('docker compose images -q frontend') do set FRONTEND_ID=%%i
docker tag %FRONTEND_ID% sistema-pos-frontend:latest
docker save -o dist/imagenes/frontend.tar sistema-pos-frontend:latest

echo.
echo [4/4] Finalizando...
echo.
echo   LISTO! La carpeta 'dist' ahora contiene todo lo necesario.
echo   Puedes comprimir la carpeta 'dist' y entregarla al cliente.
echo.
pause
