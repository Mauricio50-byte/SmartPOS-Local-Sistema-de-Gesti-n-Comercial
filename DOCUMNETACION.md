📘 Documento de Funcionamiento — Sistema de Gestión Comercial (Local‑First)

Basado en la arquitectura definida en `PROJECT_PLAN.md`.

Introducción

Solución integral de gestión comercial que opera 100% en red local, sin depender de internet. Arquitectura monolítica modular optimizada para equipos de bajo consumo, orientada a negocios que buscan una alternativa profesional sin suscripciones.

Permite administrar: inventario, ventas, servicios, cuentas por cobrar/pagar, flujo de caja, estadísticas avanzadas, múltiples usuarios y gestión de empleados; todo desde el computador del negocio que actúa como servidor.

Arquitectura funcional

Enfoque local‑first: todos los módulos y datos funcionan en la red local del negocio.

Componentes principales

| Componente                  | Tecnología         | Función                                                                          |
|----------------------------|--------------------|----------------------------------------------------------------------------------|
| Aplicación servidor        | Node.js + Fastify  | Procesa operaciones internas: ventas, autenticación, inventario, reportes       |
| Base de datos local        | PostgreSQL         | Persiste todos los registros en el PC del administrador                          |
| Aplicación cliente (PWA)   | Ionic + Angular    | Interfaz para dueños y trabajadores desde navegador o Android                    |
| Contenedores               | Docker Compose     | Simplifica instalación, aislamiento y estabilidad del sistema                    |

Operación sin internet

- Diseñado para entornos sin conexión o con internet inestable
- Instalación con un solo comando en el servidor local:

```
docker-compose up -d
```

- Acceso desde dispositivos en la misma red (WiFi/LAN): `http://IP_DEL_PC:8100`
- Modos de uso del cliente: PWA en navegador, app instalable en Android, UI optimizada para móviles
- Persistencia local: todas las acciones (ventas, inventario, reportes, gastos) se almacenan en el servidor sin internet
- Resiliencia: continúa operando sin salida a internet y soporta reinicios breves gracias a los contenedores

Multiusuario y roles

- Múltiples trabajadores pueden usar el sistema simultáneamente desde distintos dispositivos

Roles

- Administrador (dueño/gerente): crea productos/servicios, ve reportes detallados, gestiona trabajadores, inventario completo, controla caja/gastos/deudas, estadísticas en tiempo real, exporta reportes, configura el negocio
- Trabajador: registra ventas y servicios, agrega productos vendidos, registra fiados/abonos, consulta inventario permitido, abre/cierra caja diaria

Auditoría

- Cada acción registra: fecha, usuario, hora, tipo de operación y monto, permitiendo monitoreo total del negocio

Inventario, productos y servicios

- Inventario automático con las tablas del modelo de datos (Productos, Movimientos, Detalle_Venta, etc.)

Funciones clave

- Control de stock en tiempo real
- Descuento automático después de cada venta
- Alertas por stock mínimo
- Registro de precio costo y precio venta
- Gestión de código de barras
- Reportes de productos más vendidos

Gestión de servicios

- Registro de servicios (billares por tiempo, alquiler de mesas, barbería, restaurante, reparaciones, lavados, cortes, consultas, etc.)

Ventas, caja y contabilidad

Ventas

- Registro desde móviles o PC
- Soporta múltiples métodos de pago (efectivo, transferencia —p. ej. Nequi—, tarjeta, etc.) con selección manual del medio utilizado
- Permite ventas fiadas con control de deudas y abonos

Caja

- Registro de ingresos y egresos
- Control de gastos operativos
- Flujo de caja diario
- Historial de cierres por trabajador

Contabilidad automática

- Cálculo de ingresos diarios/semanales/mensuales
- Gastos totales
- Ganancia neta y bruta
- Rentabilidad por producto
- Punto de equilibrio
- Comparativas entre periodos

Estadísticas y reportes

- Filtros y visualizaciones en gráficos/tablas para:
- Ventas por día/semana/mes
- Ventas por trabajador
- Productos y servicios más vendidos
- Horas de mayor movimiento
- Deudas de clientes y del negocio
- Crecimiento mensual
- Balance general
- Dashboards modernos con Ionic + TailwindCSS

Casos de uso por tipo de negocio

- Tienda de barrio: inventario completo, venta con escáner, control de fiados, reportes diarios, múltiples cajeros
- Billar / negocio nocturno: registro de mesas por horas, venta de bebidas, turnos de empleados, caja por turno, gráficos de consumo por hora
- Barbería: servicios (corte, barba, tintura), control de barberos, comisiones por trabajador, registro de productos (shampoo, cera)
- Restaurante: menú configurable, comandas rápidas, mesas activas, control de ingredientes por receta
- Alquileres: artículos alquilados, comisión por hora/día, control de inventario retornado
- Papelería: servicios (impresiones, minutos, copias), inventario amplio de productos pequeños, ventas mixtas

Flujo completo del sistema

1. El administrador instala el software con Docker Compose
2. Se levantan Backend, Frontend y Base de datos
3. Se configura el negocio (productos y/o servicios)
4. Los trabajadores se conectan desde sus dispositivos vía IP local
5. Se registran ventas, servicios, gastos y movimientos
6. Fastify procesa las operaciones; PostgreSQL persiste cada registro
7. Ionic muestra dashboards y estadísticas actualizadas
8. El administrador consulta reportes diarios, mensuales y anuales
9. Operación sin internet: rápida, segura y centralizada
