const { prisma } = require('../../infraestructura/bd')
const bcrypt = require('bcryptjs')

async function crearAdministrador({ nombre, correo, password }) {
  const existe = await prisma.usuario.findUnique({ where: { correo } })
  if (existe) throw new Error('Correo ya registrado')
  const passwordHash = await bcrypt.hash(password, 10)
  const usuario = await prisma.usuario.create({ data: { nombre, correo, passwordHash } })
  const rolAdmin = await prisma.rol.findUnique({ where: { nombre: 'ADMIN' } })
  if (rolAdmin) await prisma.usuarioRol.create({ data: { usuarioId: usuario.id, rolId: rolAdmin.id } })
  return usuario
}

async function crearUsuarioConRoles({ nombre, correo, password, roles = [] }) {
  const existe = await prisma.usuario.findUnique({ where: { correo } })
  if (existe) throw new Error('Correo ya registrado')
  const passwordHash = await bcrypt.hash(password, 10)
  const usuario = await prisma.usuario.create({ data: { nombre, correo, passwordHash } })
  if (Array.isArray(roles) && roles.length > 0) {
    const rolesDb = await prisma.rol.findMany({ where: { nombre: { in: roles } } })
    for (const r of rolesDb) {
      await prisma.usuarioRol.create({ data: { usuarioId: usuario.id, rolId: r.id } })
    }
  }
  return usuario
}

async function ingresar({ correo, password }) {
  const usuario = await prisma.usuario.findUnique({ where: { correo }, include: { roles: { include: { rol: { include: { permisos: { include: { permiso: true } } } } } } } })
  if (!usuario || !usuario.activo) throw new Error('Credenciales inválidas')
  const ok = await bcrypt.compare(password, usuario.passwordHash)
  if (!ok) throw new Error('Credenciales inválidas')
  const roles = usuario.roles.map(ur => ur.rol.nombre)
  const permisos = Array.from(new Set(usuario.roles.flatMap(ur => ur.rol.permisos.map(rp => rp.permiso.clave))))
  return { usuario, roles, permisos }
}

module.exports = { crearAdministrador, crearUsuarioConRoles, ingresar }
