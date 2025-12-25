@echo off
title INICIAR MODO ONLINE (INTERNET)
color 0a

echo ========================================================
echo        SISTEMA POS - MODO ONLINE (ACCESO REMOTO)
echo ========================================================
echo.
echo Este script permitira conectar dispositivos desde cualquier
echo lugar a traves de Internet usando un Tunel Seguro.
echo.

:: 1. Iniciar Backend
echo [1/2] Iniciando Servidor Backend...
start "BACKEND POS" cmd /k "cd backend-api && npm start"

:: 2. Esperar un momento
echo Esperando a que el servidor arranque...
timeout /t 8 >nul

:: 3. Iniciar Tunel
echo.
echo [2/2] Creando Tunel Seguro...
echo.
echo --------------------------------------------------------
echo  INSTRUCCIONES IMPORTANTES:
echo --------------------------------------------------------
echo  1. Se abrira una ventana (o iniciara aqui) el tunel.
echo  2. Busca la linea que dice: "your url is: https://..."
echo  3. COPIA esa URL completa.
echo  4. Ve al sistema POS en tu PC -> Conectar Dispositivo.
echo  5. Activa la pestana "Internet (Tunel)" y PEGA la URL.
echo --------------------------------------------------------
echo.
echo Lanzando tunel con LocalTunnel...
echo (Si es la primera vez, puede pedir instalarse, acepta con 'y')
echo.

:: Usamos npx localtunnel apuntando al puerto 3000
cmd /k "npx localtunnel --port 3000"
