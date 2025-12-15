const { prisma } = require('../../infraestructura/bd')
const { crearDeuda } = require('../deudas/deuda.servicio')

async function listarVentas(filtro = {}) {
  return prisma.venta.findMany({
    where: filtro,
    orderBy: { id: 'desc' },
    include: {
      detalles: {
        include: { producto: true }
      },
      cliente: true,
      usuario: {
        select: { id: true, nombre: true }
      }
    }
  })
}

async function obtenerVentaPorId(id) {
  return prisma.venta.findUnique({
    where: { id },
    include: {
      detalles: {
        include: { producto: true }
      },
      cliente: true,
      usuario: {
        select: { id: true, nombre: true }
      },
      deuda: {
        include: {
          abonos: true
        }
      }
    }
  })
}

async function crearVenta(payload) {
  const {
    clienteId = null,
    items = [],
    usuarioId,
    metodoPago = 'EFECTIVO',
    estadoPago = 'PAGADO',
    montoPagado = 0,
    registrarCliente = false,
    datosCliente = null
  } = payload

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Sin items')
  }

  return prisma.$transaction(async tx => {
    let clienteIdFinal = clienteId

    // Si se solicita registrar un nuevo cliente
    if (registrarCliente && datosCliente) {
      const nuevoCliente = await tx.cliente.create({
        data: {
          nombre: datosCliente.nombre,
          telefono: datosCliente.telefono,
          cedula: datosCliente.cedula,
          correo: datosCliente.correo,
          direccion: datosCliente.direccion,
          creditoMaximo: datosCliente.creditoMaximo || 0
        }
      })
      clienteIdFinal = nuevoCliente.id
    }

    // Validar crédito disponible si es venta fiada
    if (estadoPago === 'FIADO' && clienteIdFinal) {
      const cliente = await tx.cliente.findUnique({ where: { id: clienteIdFinal } })
      if (!cliente) throw new Error('Cliente no encontrado')

      // Calcular total primero
      const productos = await tx.producto.findMany({
        where: { id: { in: items.map(i => Number(i.productoId)) } }
      })
      const mapa = new Map(productos.map(p => [p.id, p]))
      let totalCalculado = 0

      items.forEach(i => {
        const p = mapa.get(Number(i.productoId))
        if (p) {
          totalCalculado += Number(i.cantidad) * Number(p.precio)
        }
      })

      const creditoDisponible = cliente.creditoMaximo - cliente.saldoDeuda
      if (creditoDisponible < totalCalculado) {
        throw new Error(`Crédito insuficiente. Disponible: $${creditoDisponible}, Solicitado: $${totalCalculado}`)
      }
    }

    // Obtener productos y validar stock
    const productos = await tx.producto.findMany({
      where: { id: { in: items.map(i => Number(i.productoId)) } }
    })
    const mapa = new Map(productos.map(p => [p.id, p]))

    let total = 0
    const detalles = items.map(i => {
      const p = mapa.get(Number(i.productoId))
      if (!p) throw new Error(`Producto con ID ${i.productoId} no existe`)
      if (p.stock < Number(i.cantidad)) {
        throw new Error(`Stock insuficiente para ${p.nombre}. Disponible: ${p.stock}, Solicitado: ${i.cantidad}`)
      }
      const cantidad = Number(i.cantidad)
      const precioUnitario = Number(p.precio)
      const subtotal = cantidad * precioUnitario
      total += subtotal
      return { productoId: p.id, cantidad, precioUnitario, subtotal }
    })

    // Calcular saldo pendiente
    const montoPagadoFinal = estadoPago === 'PAGADO' ? total : Number(montoPagado)
    const saldoPendiente = total - montoPagadoFinal

    // Crear la venta
    const venta = await tx.venta.create({
      data: {
        clienteId: clienteIdFinal,
        total,
        usuarioId,
        metodoPago,
        estadoPago,
        montoPagado: montoPagadoFinal,
        saldoPendiente
      }
    })

    // Crear detalles y actualizar stock
    for (const d of detalles) {
      await tx.detalleVenta.create({
        data: {
          ventaId: venta.id,
          productoId: d.productoId,
          cantidad: d.cantidad,
          precioUnitario: d.precioUnitario,
          subtotal: d.subtotal
        }
      })
      await tx.producto.update({
        where: { id: d.productoId },
        data: { stock: { decrement: d.cantidad } }
      })
    }

    // Si es venta fiada, crear la deuda
    if (estadoPago === 'FIADO' && clienteIdFinal) {
      await tx.deuda.create({
        data: {
          clienteId: clienteIdFinal,
          ventaId: venta.id,
          montoTotal: saldoPendiente,
          saldoPendiente: saldoPendiente
        }
      })

      // Actualizar saldo de deuda del cliente
      await tx.cliente.update({
        where: { id: clienteIdFinal },
        data: {
          saldoDeuda: { increment: saldoPendiente }
        }
      })
    }

    // Agregar puntos al cliente si aplica (1 punto por cada $1000)
    if (clienteIdFinal && estadoPago === 'PAGADO') {
      const puntosGanados = Math.floor(total / 1000)
      if (puntosGanados > 0) {
        await tx.cliente.update({
          where: { id: clienteIdFinal },
          data: {
            puntos: { increment: puntosGanados }
          }
        })
      }
    }

    return obtenerVentaPorId(venta.id)
  })
}

module.exports = { listarVentas, obtenerVentaPorId, crearVenta }
