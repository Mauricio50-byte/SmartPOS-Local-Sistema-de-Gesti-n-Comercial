@echo off
setlocal
echo ========================================================
echo   CONFIGURADOR DE RED PARA SISTEMA POS (DEV MODE)
echo ========================================================
echo.
echo Este script abrira los puertos 3000 (Backend) y 8100 (Frontend)
echo en el Firewall de Windows para permitir la conexion desde el celular.
echo.
echo [!] Requiere permisos de Administrador.
echo.

:: Verificar permisos
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [!] No tienes permisos de administrador.
    echo.
    echo Por favor, haz click derecho sobre este archivo y selecciona:
    echo "Ejecutar como administrador"
    echo.
    pause
    exit /b
)

echo [*] Abriendo puerto 3000 (Backend)...
netsh advfirewall firewall delete rule name="POS Backend Dev" >nul 2>&1
netsh advfirewall firewall add rule name="POS Backend Dev" dir=in action=allow protocol=TCP localport=3000 profile=private,domain,public

echo [*] Abriendo puerto 8100 (Frontend)...
netsh advfirewall firewall delete rule name="POS Frontend Dev" >nul 2>&1
netsh advfirewall firewall add rule name="POS Frontend Dev" dir=in action=allow protocol=TCP localport=8100 profile=private,domain,public

echo.
echo [OK] Reglas de Firewall aplicadas correctamente.
echo.
echo Asegurate de que tu red WiFi este configurada como "Privada" o "Domestica"
echo para mayor compatibilidad, aunque hemos habilitado el acceso Publico tambien.
echo.
echo Ahora intenta escanear el QR nuevamente.
echo.
pause
