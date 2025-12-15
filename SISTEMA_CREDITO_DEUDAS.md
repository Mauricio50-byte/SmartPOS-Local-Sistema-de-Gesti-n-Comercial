# Sistema de Gestión de Clientes con Control de Crédito y Deudas

## 📋 Resumen de Implementación

Se ha implementado un sistema completo de gestión de clientes que incluye:

1. **Registro opcional de clientes** durante la venta
2. **Sistema de puntos de fidelidad** (1 punto por cada $1000 en compras pagadas)
3. **Control de crédito/fiado** con límites configurables
4. **Gestión de deudas** con seguimiento detallado
5. **Registro de abonos** con historial completo
6. **Ventas rápidas** sin necesidad de registrar cliente

---

## 🗄️ Cambios en la Base de Datos

### Modelo Cliente (Expandido)
```prisma
model Cliente {
  id            Int      @id @default(autoincrement())
  nombre        String
  correo        String?  @unique
  telefono      String?
  cedula        String?  @unique  // Documento de identidad
  direccion     String?
  activo        Boolean  @default(true)
  creditoMaximo Float    @default(0)  // Límite de crédito permitido
  saldoDeuda    Float    @default(0)  // Deuda actual total
  puntos        Int      @default(0)  // Puntos de fidelidad
  creadoEn      DateTime @default(now())
  actualizadoEn DateTime @updatedAt
}
```

### Modelo Venta (Expandido)
```prisma
model Venta {
  id             Int      @id @default(autoincrement())
  fecha          DateTime @default(now())
  total          Float
  clienteId      Int?
  usuarioId      Int
  metodoPago     String   @default("EFECTIVO")  // EFECTIVO, TRANSFERENCIA, TARJETA, NEQUI
  estadoPago     String   @default("PAGADO")    // PAGADO, FIADO, PARCIAL
  montoPagado    Float    @default(0)
  saldoPendiente Float    @default(0)
}
```

### Modelo Deuda (Nuevo)
```prisma
model Deuda {
  id               Int      @id @default(autoincrement())
  clienteId        Int
  ventaId          Int      @unique
  montoTotal       Float
  saldoPendiente   Float
  estado           String   @default("PENDIENTE")  // PENDIENTE, PAGADO, VENCIDO
  fechaCreacion    DateTime @default(now())
  fechaVencimiento DateTime?
}
```

### Modelo Abono (Nuevo)
```prisma
model Abono {
  id         Int      @id @default(autoincrement())
  deudaId    Int
  clienteId  Int
  monto      Float
  metodoPago String   @default("EFECTIVO")
  fecha      DateTime @default(now())
  usuarioId  Int?
  nota       String?
}
```

---

## 🔧 Pasos para Aplicar los Cambios

### 1. Generar y Aplicar Migración de Prisma

```powershell
cd backend-api
npx prisma migrate dev --name agregar_sistema_credito_deudas
```

Esto creará las nuevas tablas y columnas en la base de datos.

### 2. Generar Cliente de Prisma

```powershell
npx prisma generate
```

### 3. Reiniciar el Backend

Si está corriendo con nodemon, se reiniciará automáticamente. Si no:

```powershell
npm run dev
```

---

## 📡 Nuevos Endpoints API

### Clientes

#### GET `/clientes/:id/estado-cuenta`
Obtiene el estado de cuenta completo de un cliente:
- Información del cliente
- Deudas pendientes con detalles
- Crédito disponible

**Respuesta:**
```json
{
  "cliente": {
    "id": 1,
    "nombre": "Juan Pérez",
    "telefono": "3001234567",
    "creditoMaximo": 500000,
    "saldoDeuda": 150000,
    "puntos": 45
  },
  "deudas": [...],
  "creditoDisponible": 350000
}
```

#### POST `/clientes/:id/validar-credito`
Valida si un cliente tiene crédito disponible para una compra.

**Body:**
```json
{
  "monto": 50000
}
```

**Respuesta:**
```json
{
  "disponible": true,
  "creditoMaximo": 500000,
  "saldoDeuda": 150000,
  "creditoDisponible": 350000,
  "montoSolicitado": 50000
}
```

### Deudas

#### GET `/deudas`
Lista todas las deudas con filtros opcionales.

**Query params:**
- `estado`: PENDIENTE, PAGADO, VENCIDO
- `clienteId`: ID del cliente

#### GET `/deudas/cliente/:clienteId`
Obtiene todas las deudas pendientes de un cliente específico.

#### GET `/deudas/:id`
Obtiene una deuda específica con todos sus detalles y abonos.

#### POST `/deudas/:id/abonos`
Registra un abono a una deuda.

**Body:**
```json
{
  "monto": 50000,
  "metodoPago": "EFECTIVO",
  "nota": "Abono parcial"
}
```

**Respuesta:**
```json
{
  "abono": {...},
  "deudaActualizada": {
    "id": 1,
    "montoTotal": 150000,
    "saldoPendiente": 100000,
    "estado": "PENDIENTE",
    "abonos": [...]
  }
}
```

#### GET `/abonos/cliente/:clienteId`
Obtiene el historial completo de abonos de un cliente.

#### POST `/deudas/marcar-vencidas`
Marca como vencidas las deudas que pasaron su fecha de vencimiento.

### Ventas

#### POST `/ventas`
Crear una venta (actualizado para soportar ventas fiadas y registro de clientes).

**Venta al contado sin cliente:**
```json
{
  "items": [
    { "productoId": 1, "cantidad": 2 },
    { "productoId": 3, "cantidad": 1 }
  ],
  "usuarioId": 1,
  "metodoPago": "EFECTIVO",
  "estadoPago": "PAGADO"
}
```

**Venta fiada con cliente existente:**
```json
{
  "clienteId": 5,
  "items": [
    { "productoId": 1, "cantidad": 2 }
  ],
  "usuarioId": 1,
  "metodoPago": "EFECTIVO",
  "estadoPago": "FIADO"
}
```

**Venta fiada registrando nuevo cliente:**
```json
{
  "items": [
    { "productoId": 1, "cantidad": 2 }
  ],
  "usuarioId": 1,
  "metodoPago": "EFECTIVO",
  "estadoPago": "FIADO",
  "registrarCliente": true,
  "datosCliente": {
    "nombre": "María González",
    "telefono": "3009876543",
    "cedula": "1234567890",
    "creditoMaximo": 300000
  }
}
```

---

## 🔄 Flujo de Trabajo

### Escenario 1: Venta Rápida (Sin Cliente)
1. Vendedor selecciona productos
2. Vendedor selecciona método de pago
3. Se registra la venta sin cliente
4. No se acumulan puntos

### Escenario 2: Venta con Cliente Registrado (Pagada)
1. Vendedor busca/selecciona cliente
2. Vendedor selecciona productos
3. Vendedor selecciona método de pago
4. Se registra la venta
5. **Se acumulan puntos** (1 punto por cada $1000)

### Escenario 3: Venta Fiada (Cliente Nuevo)
1. Cliente solicita crédito
2. Vendedor pregunta si quiere registrarse
3. Cliente acepta y proporciona datos
4. Sistema valida que el monto no exceda el crédito máximo
5. Se crea el cliente
6. Se registra la venta con `estadoPago: "FIADO"`
7. **Se crea automáticamente una deuda**
8. Se actualiza el `saldoDeuda` del cliente

### Escenario 4: Venta Fiada (Cliente Existente)
1. Vendedor busca cliente
2. Sistema valida crédito disponible
3. Si tiene crédito suficiente, se procede
4. Se registra la venta fiada
5. Se crea la deuda
6. Se actualiza el saldo del cliente

### Escenario 5: Cliente Abona a su Deuda
1. Cliente llega a pagar
2. Vendedor busca las deudas del cliente
3. Vendedor selecciona la deuda a abonar
4. Vendedor ingresa el monto y método de pago
5. Sistema valida que el monto no exceda el saldo pendiente
6. Se registra el abono
7. Se actualiza el `saldoPendiente` de la deuda
8. Se actualiza el `saldoDeuda` del cliente
9. Si el saldo llega a 0, la deuda se marca como "PAGADO"

---

## ✅ Validaciones Implementadas

1. **Crédito disponible**: No se permite venta fiada si excede el límite de crédito
2. **Stock de productos**: Se valida antes de crear la venta
3. **Monto de abono**: No puede ser mayor al saldo pendiente
4. **Cédula única**: No se permiten clientes duplicados con la misma cédula
5. **Eliminación de clientes**: No se puede eliminar un cliente con deudas pendientes

---

## 📊 Cálculos Automáticos

### Puntos de Fidelidad
- Se otorga **1 punto por cada $1000** en compras pagadas
- Solo aplica para ventas con `estadoPago: "PAGADO"`
- Se calcula automáticamente al crear la venta

### Actualización de Saldos
Cuando se crea una venta fiada:
- `cliente.saldoDeuda += venta.total`

Cuando se registra un abono:
- `deuda.saldoPendiente -= abono.monto`
- `cliente.saldoDeuda -= abono.monto`
- `venta.montoPagado += abono.monto`
- `venta.saldoPendiente -= abono.monto`

Si el saldo de la deuda llega a 0:
- `deuda.estado = "PAGADO"`
- `venta.estadoPago = "PAGADO"`

---

## 🎯 Próximos Pasos

### Backend ✅
- [x] Modelos de base de datos actualizados
- [x] Servicios de clientes, deudas y abonos
- [x] Rutas API completas
- [x] Validaciones de negocio
- [x] Cálculos automáticos

### Frontend (Pendiente)
- [ ] Componente de ventas actualizado
- [ ] Modal para registro rápido de cliente
- [ ] Selector de método de pago
- [ ] Selector de tipo de venta (contado/fiado)
- [ ] Vista de deudas por cliente
- [ ] Modal para registrar abonos
- [ ] Dashboard de estado de cuenta del cliente
- [ ] Alertas de crédito insuficiente

---

## 🧪 Pruebas Recomendadas

1. **Crear cliente con crédito:**
   ```bash
   POST /clientes
   {
     "nombre": "Test Cliente",
     "telefono": "3001234567",
     "creditoMaximo": 500000
   }
   ```

2. **Venta fiada:**
   ```bash
   POST /ventas
   {
     "clienteId": 1,
     "items": [{"productoId": 1, "cantidad": 2}],
     "usuarioId": 1,
     "estadoPago": "FIADO"
   }
   ```

3. **Consultar deudas del cliente:**
   ```bash
   GET /deudas/cliente/1
   ```

4. **Registrar abono:**
   ```bash
   POST /deudas/1/abonos
   {
     "monto": 50000,
     "metodoPago": "EFECTIVO"
   }
   ```

5. **Ver estado de cuenta:**
   ```bash
   GET /clientes/1/estado-cuenta
   ```

---

## 📝 Notas Importantes

- Las deudas se crean **automáticamente** cuando se registra una venta con `estadoPago: "FIADO"`
- El sistema **NO permite** ventas fiadas que excedan el crédito disponible
- Los puntos solo se acumulan en ventas **pagadas completamente**
- El `saldoDeuda` del cliente se actualiza automáticamente con cada venta fiada y cada abono
- Se puede configurar una `fechaVencimiento` opcional para las deudas
- El endpoint `/deudas/marcar-vencidas` puede ejecutarse periódicamente (ej: con un cron job)

---

## 🚀 Comandos Rápidos

```powershell
# Aplicar cambios a la base de datos
cd backend-api
npx prisma migrate dev --name agregar_sistema_credito_deudas
npx prisma generate

# Reiniciar backend
npm run dev

# Ver estado de la base de datos
npx prisma studio
```
