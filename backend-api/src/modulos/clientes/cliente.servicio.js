const { prisma } = require('../../infraestructura/bd')

async function listarClientes() {
  return prisma.cliente.findMany({ orderBy: { id: 'asc' } })
}

async function obtenerClientePorId(id) {
  return prisma.cliente.findUnique({ where: { id } })
}

async function crearCliente(datos) {
  return prisma.cliente.create({ data: datos })
}

async function actualizarCliente(id, datos) {
  return prisma.cliente.update({ where: { id }, data: datos })
}

async function eliminarCliente(id) {
  return prisma.cliente.delete({ where: { id } })
}

module.exports = {
  listarClientes,
  obtenerClientePorId,
  crearCliente,
  actualizarCliente,
  eliminarCliente
}
