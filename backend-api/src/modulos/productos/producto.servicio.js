const { prisma } = require('../../infraestructura/bd')

async function listarProductos() {
  return prisma.producto.findMany({ orderBy: { id: 'asc' } })
}

async function obtenerProductoPorId(id) {
  return prisma.producto.findUnique({ where: { id } })
}

async function crearProducto(datos) {
  return prisma.producto.create({ data: datos })
}

async function actualizarProducto(id, datos) {
  return prisma.producto.update({ where: { id }, data: datos })
}

async function eliminarProducto(id) {
  return prisma.producto.delete({ where: { id } })
}

module.exports = {
  listarProductos,
  obtenerProductoPorId,
  crearProducto,
  actualizarProducto,
  eliminarProducto
}
