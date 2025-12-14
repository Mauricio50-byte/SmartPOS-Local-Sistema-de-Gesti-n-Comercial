🛒 Sistema de Gestión Comercial (POS) — Local‑First

Versión: 1.0.0 (MVP)
Arquitectura: Monolito Modular
Licencia: Propietaria (software a la medida)

Descripción general

POS orientado a tiendas, mini‑mercados y emprendimientos para gestionar ventas, inventario y caja sin suscripciones ni internet. Opera 100% local, con datos en el equipo del cliente para máxima seguridad, privacidad y rendimiento.

Características clave

- Operación offline y local‑first
- Punto de venta con búsqueda y código de barras
- Inventario con alertas por stock mínimo
- Historial de ventas y movimientos de caja
- Multiusuario con roles (`ADMIN`, `CAJERO`) y trazabilidad de acciones

Arquitectura

- Monolito modular orientado a rendimiento y despliegue simple
- Backend `Fastify` + `Prisma` sobre `PostgreSQL`
- Frontend `Ionic + Angular` con `Tailwind`
- Orquestación con `Docker Compose`

Tecnologías

| Capa         | Tecnología           | Motivo                                           |
|--------------|----------------------|--------------------------------------------------|
| Frontend     | Ionic + Angular      | Web + móvil con un único código base             |
| Estilos      | Tailwind             | Ligero, moderno y personalizable                 |
| PWA          | PWA Plugin           | Funcionalidad offline y experiencia nativa       |
| Backend      | Node.js + Fastify    | Servidor rápido y eficiente                      |
| Base de datos| PostgreSQL           | Robusta, gratuita y profesional                  |
| ORM          | Prisma               | Migraciones tipadas y DX superior                |
| Contenedores | Docker Compose       | Instalación simple en equipos de clientes        |

Estructura del proyecto (monorepo)

```
/mi-software-pos
├── backend/              # API Fastify + Prisma
│   ├── src/
│   │   ├── controllers/  # Controladores HTTP
│   │   ├── routes/       # Definición de rutas
│   │   ├── services/     # Lógica de negocio
│   │   └── plugins/      # DB, JWT, CORS, etc.
│   ├── prisma/
│   │   └── schema.prisma # Modelo de datos
│   └── Dockerfile
├── frontend/             # Aplicación Ionic + Angular
│   ├── src/app/
│   │   ├── pages/        # Vistas (POS, Inventario, Reportes)
│   │   ├── components/   # UI reutilizable
│   │   └── services/     # Conexión con backend
│   └── Dockerfile
├── docker-compose.yml    # Orquestación de servicios
└── README.md
```

Modelo de datos (resumen)

- Usuarios: `id (UUID)`, `nombre`, `rol (ADMIN|CAJERO)`, `password_hash`
- Productos: `id`, `codigo_barras`, `nombre`, `precio_costo`, `precio_venta`, `stock_actual`, `stock_minimo`
- Ventas (cabecera): `id`, `fecha`, `total`, `metodo_pago`, `cliente_id?`
- Detalle de venta: `venta_id`, `producto_id`, `cantidad`, `precio_unitario`
- Movimientos de caja: `tipo (INGRESO|EGRESO)`, `descripcion`, `monto`, `fecha`

Requisitos

- `Docker Desktop` (Windows / macOS / Linux)
- 4 GB de RAM mínimo
- 2 GB de espacio libre

Instalación y ejecución

1. Clonar el repositorio y abrir la carpeta del proyecto
2. Construir y levantar servicios:

```
docker-compose up --build -d
```

Acceso en red local

- Frontend (POS Web): `http://localhost:8100` o `http://IP_DEL_PC:8100` desde otros dispositivos en la misma red
- API (Backend): `http://localhost:3000`
- PostgreSQL: `localhost:5432`

Comandos útiles (backend)

- Instalar dependencias:

```
npm install
```

- Ejecutar migraciones:

```
npx prisma migrate dev --name init
```

- Servidor de desarrollo:

```
npm run dev
```

Pantallas (MVP)

- Punto de Venta
- Inventario
- Historial de Ventas
- Movimientos de Caja
- Login (Admin / Cajero)

Roadmap de desarrollo

- Backend: Fastify, PostgreSQL + Prisma, CRUD de productos, JWT
- Frontend: base de Ionic, pantalla POS, Inventario
- Integración: frontend ↔ backend, cálculo de stock, ticket PDF, pruebas

Distribución para clientes

Se entrega una carpeta `dist` con:

```
/dist
├── levantar.bat
└── docker-compose.yml
```

El cliente ejecuta `levantar.bat` y el sistema se configura automáticamente.

Documentación

- Detalles de operación y casos de uso: ver `DOCUMNETACION.md`

Licencia

Software propietario del autor. No se permite copia, redistribución ni modificación sin autorización expresa.

Autores

Mauricio Andrés Vergara Fonseca
Ingeniero de Sistemas — Desarrollador Full Stack / Mobile
Barranquilla, Colombia


Jesus David Vega Pernettj
Ingeniero De sistemas Full stack Developer, especialista en seguridad informatica
Barranquilla-Atlantico, colombia