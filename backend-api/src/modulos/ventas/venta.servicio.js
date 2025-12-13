const { prisma } = require('../../infraestructura/bd')

async function listarVentas() {
  return prisma.venta.findMany({ orderBy: { id: 'desc' }, include: { detalles: true } })
}

async function obtenerVentaPorId(id) {
  return prisma.venta.findUnique({ where: { id }, include: { detalles: true, cliente: true } })
}

async function crearVenta(payload) {
  const { clienteId = null, items = [], usuarioId } = payload
  if (!Array.isArray(items) || items.length === 0) throw new Error('Sin items')
  return prisma.$transaction(async tx => {
    const productos = await tx.producto.findMany({ where: { id: { in: items.map(i => Number(i.productoId)) } } })
    const mapa = new Map(productos.map(p => [p.id, p]))
    let total = 0
    const detalles = items.map(i => {
      const p = mapa.get(Number(i.productoId))
      if (!p) throw new Error('Producto inexistente')
      if (p.stock < Number(i.cantidad)) throw new Error('Stock insuficiente')
      const cantidad = Number(i.cantidad)
      const precioUnitario = Number(p.precio)
      const subtotal = cantidad * precioUnitario
      total += subtotal
      return { productoId: p.id, cantidad, precioUnitario, subtotal }
    })
    
    const venta = await tx.venta.create({ data: { clienteId, total, usuarioId } })
    for (const d of detalles) {
      await tx.detalleVenta.create({ data: { ventaId: venta.id, productoId: d.productoId, cantidad: d.cantidad, precioUnitario: d.precioUnitario, subtotal: d.subtotal } })
      await tx.producto.update({ where: { id: d.productoId }, data: { stock: { decrement: d.cantidad } } })
    }
    return obtenerVentaPorId(venta.id)
  })
}

module.exports = { listarVentas, obtenerVentaPorId, crearVenta }
