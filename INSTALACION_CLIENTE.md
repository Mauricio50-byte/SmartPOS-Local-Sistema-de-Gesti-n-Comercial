# Guía de Instalación y Puesta en Marcha (Servidor Local)

Esta guía explica cómo instalar el Sistema POS en el equipo del cliente y usarlo como servidor para que los trabajadores accedan desde otros dispositivos en la red local.

## Requisitos

- Windows 10/11 con Docker Desktop instalado y ejecutándose.
- Puertos libres: `5432` (PostgreSQL), `3000` (Backend/API), `8100` (Frontend/PWA).
- Recursos mínimos: 2 CPU, 4 GB RAM, 2 GB de almacenamiento libre.

## Entregable

- Carpeta `dist` con:
  - `docker-compose.yml` (orquesta servicios con imágenes preconstruidas) (`dist/docker-compose.yml:1-35`).
  - `docker-compose.bind.yml` (opción con carpeta local para datos de PostgreSQL) (`dist/docker-compose.bind.yml:1-4`).
  - `.env.example` (plantilla de configuración) (`dist/.env.example:1-8`).
  - `levantar.bat` (levanta servicios con volumen Docker) (`dist/levantar.bat:1-36`).
  - `levantar_bind.bat` (levanta servicios con carpeta local `dist/data/postgres`) (`dist/levantar_bind.bat:1-41`).

> Nota: El archivo `dist/docker-compose.yml` referencia imágenes `sistema-pos-backend:latest` y `sistema-pos-frontend:latest`. Estas imágenes deben estar cargadas en el Docker del cliente. Si no han sido entregadas como `.tar`, ver la sección “Construcción de imágenes”.

### ¿Qué son esas imágenes y cómo obtenerlas/cargarlas?

- Contienen la aplicación ya preparada: backend (Fastify + Prisma) y frontend (Ionic/Angular).
- Deben existir en el host donde se ejecutará `docker compose` para que el sistema levante sin usar el código fuente.

- Opciones para tenerlas disponibles:
  - Entrega por archivos `.tar` (recomendado para clientes):
    1. Recibir `sistema-pos-backend.tar` y `sistema-pos-frontend.tar` del proveedor.
    2. Cargar en Docker (Windows/PowerShell):
       - `docker load -i sistema-pos-backend.tar`
       - `docker load -i sistema-pos-frontend.tar`
    3. Verificar que existen: `docker images`.
    4. Si se cargaron con un tag de versión (por ejemplo `1.0.0`), alinearlas con `latest` (como espera `dist/docker-compose.yml`):
       - `docker tag sistema-pos-backend:1.0.0 sistema-pos-backend:latest`
       - `docker tag sistema-pos-frontend:1.0.0 sistema-pos-frontend:latest`

  - Imagen de base de datos (PostgreSQL):
    - El `docker-compose.yml` usa la imagen oficial `postgres:16-alpine` (`dist/docker-compose.yml:2-11`).
    - Online: se descarga automáticamente al ejecutar `docker compose up` o manualmente con `docker pull postgres:16-alpine`.
    - Offline: entregar también `postgres-16-alpine.tar` y cargar con `docker load -i postgres-16-alpine.tar`.
    - Para generar este `.tar` desde tu entorno, usa el script: `dist/generar_imagenes.bat` (produce `dist/imagenes/postgres-16-alpine.tar`).

  - Construcción local desde el código fuente (alternativa técnica):
    1. Backend: `docker build -t sistema-pos-backend:latest ./backend-api`.
    2. Frontend: `docker build -t sistema-pos-frontend:latest ./frontend-app`.
    3. Volver a `dist` y ejecutar `levantar.bat` o `levantar_bind.bat`.
    4. Para generar `.tar` listos para entregar, usar el script automático:
       - `cd dist`
       - `generar_imagenes.bat 1.0.0` (opcional: reemplace `1.0.0` por su versión)
       - Obtendrá: `dist/imagenes/sistema-pos-backend-1.0.0.tar` y `dist/imagenes/sistema-pos-frontend-1.0.0.tar`
       - Referencia del script: `dist/generar_imagenes.bat:1-65`

  - Registro privado (si el proveedor lo ofrece):
    1. `docker login <registro>`.
    2. `docker pull <registro>/sistema-pos-backend:latest`.
    3. `docker pull <registro>/sistema-pos-frontend:latest`.
    4. Opcional: retag a nombres locales si el `docker-compose.yml` no usa el prefijo del registro.

- Si prefiere usar un tag distinto a `latest`, editar `dist/docker-compose.yml` para que apunte a ese tag específico (`dist/docker-compose.yml:14` y `dist/docker-compose.yml:26`).

- Consideración de arquitectura (opcional): en equipos ARM (p. ej., Apple M1/M2) puede requerirse imagen `linux/arm64`. Solicitar imágenes multi‑arquitectura o construir con `docker buildx`.

## Configuración

1. Copiar `dist/.env.example` a `dist/.env` y editar valores:
   - `POSTGRES_USER`: usuario de base de datos.
   - `POSTGRES_PASSWORD`: contraseña segura.
   - `POSTGRES_DB`: nombre de base de datos (por defecto `sistema_pos`).
   - `POSTGRES_PORT`: puerto externo para PostgreSQL (por defecto `5432`).
   - `JWT_SECRETO`: secreto robusto para autenticación backend.
   - `BACKEND_PORT`: puerto del backend (por defecto `3000`).
   - `FRONTEND_PORT`: puerto del frontend (por defecto `8100`).

## Opción A (recomendada): Datos en carpeta local (bind)

- Persistencia de datos de PostgreSQL en `dist/data/postgres` visible para respaldos.
- Pasos:
  1. Abrir `dist` y editar `dist/.env` con valores definitivos.
  2. Ejecutar `levantar_bind.bat` (`dist/levantar_bind.bat:24-39`).
  3. Esperar confirmación de servicios levantados:
     - Backend: `http://localhost:${BACKEND_PORT}` (por defecto `http://localhost:3000`).
     - Frontend: `http://localhost:${FRONTEND_PORT}` (por defecto `http://localhost:8100`).
  4. Verificar acceso desde otros dispositivos de la red:
     - Obtener IP del servidor: abrir PowerShell y ejecutar `ipconfig`.
     - Usar `http://IP_DEL_PC:8100` en navegadores de móviles/PC de la misma red.

## Opción B: Datos en volumen Docker

- Más simple, sin carpeta local. Usar `levantar.bat` (`dist/levantar.bat:20-35`).
- Los datos se guardan en el volumen `pgdata` de Docker; respaldos vía comandos Docker.

## Construcción de imágenes (si no se entregaron `.tar`)

- Si se dispone del código fuente:
  1. Backend: `docker build -t sistema-pos-backend:latest ./backend-api` (`backend-api/Dockerfile:1-11`).
  2. Frontend: `docker build -t sistema-pos-frontend:latest ./frontend-app` (`frontend-app/Dockerfile:1-7`).
  3. Luego, en `dist`, ejecutar `levantar.bat` o `levantar_bind.bat`.
- Si se entregan `.tar` con imágenes:
  - Cargar imágenes:
    - `docker load -i sistema-pos-backend.tar`
    - `docker load -i sistema-pos-frontend.tar`
  - Luego ejecutar el script de levantamiento.

## Acceso y uso

- Frontend (PWA): `http://localhost:8100` (o `http://IP_DEL_PC:8100`).
  - Instalación PWA desde el navegador (Add to Home Screen).
  - Service Worker y manifest ya configurados (`frontend-app/src/index.html:12-18`, `frontend-app/ngsw-config.json:1-45`, `frontend-app/src/manifest.webmanifest:1-15`).
- Backend/API: `http://localhost:3000`.
  - Login `POST /auth/ingresar` y perfil `GET /auth/perfil` ya implementados en el frontend (`frontend-app/src/app/core/services/auth.service.ts:32-50`).

## Operación multiusuario

- Los trabajadores se conectan desde dispositivos en la misma red local usando `http://IP_DEL_PC:8100`.
- Recomendaciones:
  - Asignar IP local fija al equipo servidor (reservar en router/DHCP).
  - Mantener el servidor encendido durante la jornada.

## Seguridad

- Usar contraseñas robustas y un `JWT_SECRETO` largo y aleatorio en `.env`.
- Los scripts agregan reglas de firewall para puertos `3000` y `8100` (`dist/levantar*.bat:28-34`).
- Para acceso desde otras redes, considerar VPN; no se recomienda exponer directamente a internet.

## Respaldos

- Opción bind (carpeta local): copiar `dist/data/postgres` periódicamente a un medio externo.
- Opción volumen Docker:
  - Dump de base de datos desde el contenedor de Postgres:
    - Obtener nombre de contenedor: `docker compose ps`.
    - Ejecutar respaldo lógico:
      - `docker exec -t <contenedor_postgres> pg_dump -U ${POSTGRES_USER} -d ${POSTGRES_DB} > backup.sql`

## Actualizaciones

- Si se usa `dist` con imágenes preconstruidas:
  - Cargar nuevas imágenes `.tar` y reiniciar servicios: `docker compose -f docker-compose.yml up -d`.
- Si se construye desde código fuente:
  - Reconstruir imágenes y reiniciar: `docker build ...` y luego `docker compose up -d`.

## Solución de problemas

- Docker no instalado:
  - Instalar Docker Desktop y reiniciar.
- Puertos ocupados:
  - Cambiar `BACKEND_PORT`/`FRONTEND_PORT` en `.env`.
- `.env` ausente:
  - Crear a partir de `.env.example` (`dist/.env.example:1-8`).
- Imágenes no encontradas:
  - Construir desde código o cargar `.tar` con `docker load`.
- Sin acceso desde otros dispositivos:
  - Verificar IP del servidor, firewall y estar en la misma red.

## Comandos útiles

- Levantar servicios (volumen Docker): `levantar.bat`.
- Levantar servicios (bind carpeta local): `levantar_bind.bat`.
- Estado: `docker compose ps`.
- Logs backend: `docker compose logs -f backend`.
- Detener servicios: `docker compose down`.
- Detener y borrar datos (volumen Docker): `docker compose down -v`.

---

Este paquete habilita un sistema local‑first: la base de datos y la API corren en el equipo del cliente, y la PWA se sirve a toda la red local con un único comando. Para soporte o personalizaciones, contactar al proveedor del software.
