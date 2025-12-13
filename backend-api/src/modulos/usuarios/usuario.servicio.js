const { prisma } = require('../../infraestructura/bd')
const bcrypt = require('bcryptjs')

async function listarUsuarios(filtro = {}) {
  return prisma.usuario.findMany({ where: filtro, orderBy: { id: 'asc' }, select: { id: true, nombre: true, correo: true, rol: true, activo: true, creadoEn: true } })
}

async function obtenerUsuarioPorId(id) {
  return prisma.usuario.findUnique({ where: { id }, select: { id: true, nombre: true, correo: true, rol: true, activo: true, creadoEn: true } })
}

async function actualizarUsuario(id, datos) {
  const campos = {}
  if (typeof datos.nombre === 'string') campos.nombre = datos.nombre
  if (typeof datos.correo === 'string') campos.correo = datos.correo
  if (typeof datos.activo === 'boolean') campos.activo = datos.activo
  return prisma.usuario.update({ where: { id }, data: campos, select: { id: true, nombre: true, correo: true, rol: true, activo: true } })
}

async function cambiarPassword(id, nueva) {
  const passwordHash = await bcrypt.hash(nueva, 10)
  await prisma.usuario.update({ where: { id }, data: { passwordHash } })
  return { id }
}

async function activarUsuario(id) {
  return prisma.usuario.update({ where: { id }, data: { activo: true }, select: { id: true, activo: true } })
}

async function desactivarUsuario(id) {
  return prisma.usuario.update({ where: { id }, data: { activo: false }, select: { id: true, activo: true } })
}

async function asignarRolesAUsuario(id, roles = []) {
  await prisma.usuarioRol.deleteMany({ where: { usuarioId: id } })
  if (Array.isArray(roles) && roles.length) {
    const rolesDb = await prisma.rol.findMany({ where: { nombre: { in: roles } } })
    for (const r of rolesDb) await prisma.usuarioRol.create({ data: { usuarioId: id, rolId: r.id } })
  }
  return { id }
}

module.exports = { listarUsuarios, obtenerUsuarioPorId, actualizarUsuario, cambiarPassword, activarUsuario, desactivarUsuario, asignarRolesAUsuario }
