@echo off
title Configurar Firewall para Sistema POS
color 1f

echo ========================================================
echo   CONFIGURACION AUTOMATICA DE FIREWALL - SISTEMA POS
echo ========================================================
echo.

:: Verificar permisos de administrador
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [OK] Permisos de administrador detectados.
) else (
    echo [ERROR] No tienes permisos de administrador.
    echo.
    echo Por favor, haz CLICK DERECHO sobre este archivo
    echo y selecciona "EJECUTAR COMO ADMINISTRADOR".
    echo.
    pause
    exit
)

echo.
echo 1. Abriendo puerto 3000 (Backend API)...
netsh advfirewall firewall delete rule name="Sistema POS - Backend" >nul 2>&1
netsh advfirewall firewall add rule name="Sistema POS - Backend" dir=in action=allow protocol=TCP localport=3000

echo 2. Abriendo puerto 8100 (Frontend Ionic)...
netsh advfirewall firewall delete rule name="Sistema POS - Frontend" >nul 2>&1
netsh advfirewall firewall add rule name="Sistema POS - Frontend" dir=in action=allow protocol=TCP localport=8100

echo 3. Abriendo puerto 4200 (Frontend Angular Dev)...
netsh advfirewall firewall delete rule name="Sistema POS - Angular" >nul 2>&1
netsh advfirewall firewall add rule name="Sistema POS - Angular" dir=in action=allow protocol=TCP localport=4200

echo.
echo ========================================================
echo   LISTO! LAS REGLAS HAN SIDO AGREGADAS.
echo ========================================================
echo.
echo Ahora intenta escanear el codigo QR nuevamente.
echo.
pause
