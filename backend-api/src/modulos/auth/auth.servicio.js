const { prisma } = require('../../infraestructura/bd')
const bcrypt = require('bcryptjs')
const { ADMIN_CORREO } = require('../../configuracion/entorno')

async function obtenerModulosActivosNegocio(negocioId) {
  if (!negocioId) return []
  const activos = await prisma.negocioModulo.findMany({
    where: { negocioId, activo: true },
    select: { moduloId: true }
  })
  return activos.map(a => a.moduloId)
}

async function crearAdministrador({ nombre, correo, password }) {
  const c = (correo || '').trim().toLowerCase()
  const existe = await prisma.usuario.findUnique({ where: { correo: c } })
  if (existe) throw new Error('Correo ya registrado')
  const passwordHash = await bcrypt.hash(password, 10)
  const usuario = await prisma.usuario.create({ data: { nombre, correo: c, passwordHash } })
  const rolAdmin = await prisma.rol.findUnique({ where: { nombre: 'ADMIN' } })
  if (rolAdmin) await prisma.usuarioRol.create({ data: { usuarioId: usuario.id, rolId: rolAdmin.id } })
  return usuario
}

async function crearUsuarioConRoles({ nombre, correo, password, roles = [] }) {
  const c = (correo || '').trim().toLowerCase()
  const existe = await prisma.usuario.findUnique({ where: { correo: c } })
  if (existe) throw new Error('Correo ya registrado')
  const passwordHash = await bcrypt.hash(password, 10)
  const usuario = await prisma.usuario.create({ data: { nombre, correo: c, passwordHash } })
  if (Array.isArray(roles) && roles.length > 0) {
    const rolesDb = await prisma.rol.findMany({ where: { nombre: { in: roles } } })
    for (const r of rolesDb) {
      await prisma.usuarioRol.create({ data: { usuarioId: usuario.id, rolId: r.id } })
    }
  }
  return usuario
}

async function ingresar({ correo, password }) {
  const c = (correo || '').trim().toLowerCase()
  // Incluir tanto los permisos del rol como los permisos directos del usuario
  const usuario = await prisma.usuario.findUnique({ 
    where: { correo: c }, 
    include: { 
      roles: { 
        include: { 
          rol: { 
            include: { 
              permisos: { include: { permiso: true } } 
            } 
          } 
        } 
      },
      permisos: { include: { permiso: true } },
      modulos: true
    } 
  })
  if (!usuario || !usuario.activo) throw new Error('Credenciales inválidas')
  const ok = await bcrypt.compare(password, usuario.passwordHash)
  if (!ok) throw new Error('Credenciales inválidas')
  const roles = usuario.roles.map(ur => ur.rol.nombre)
  // Combinar permisos del rol con permisos directos del usuario
  const permisosRoles = usuario.roles.flatMap(ur => ur.rol.permisos.map(rp => rp.permiso.clave))
  const permisosDirectos = usuario.permisos.map(up => up.permiso.clave)
  const permisos = Array.from(new Set([...permisosRoles, ...permisosDirectos]))

  const adminPorDefecto = c === String(ADMIN_CORREO || '').trim().toLowerCase()
  const negocioId = usuario.negocioId ?? null
  let modulos = []
  if (negocioId) {
    const activos = await obtenerModulosActivosNegocio(negocioId)
    if (roles.includes('ADMIN') && adminPorDefecto) {
      modulos = activos
    } else if (roles.includes('ADMIN')) {
      const asignados = Array.isArray(usuario.modulos) ? usuario.modulos.map(m => m.moduloId) : []
      modulos = asignados.length ? asignados : activos.slice(0, 3)
    } else {
      const asignados = Array.isArray(usuario.modulos) ? usuario.modulos.map(m => m.moduloId) : []
      modulos = asignados.length ? asignados : activos
    }
  }

  return { usuario, roles, permisos, negocioId, modulos, adminPorDefecto }
}

module.exports = { crearAdministrador, crearUsuarioConRoles, ingresar, obtenerModulosActivosNegocio }
