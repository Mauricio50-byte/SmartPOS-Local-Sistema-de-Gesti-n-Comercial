const { prisma } = require('../../infraestructura/bd')
const bcrypt = require('bcryptjs')

async function listarUsuarios(filtro = {}) {
  const usuarios = await prisma.usuario.findMany({
    where: filtro,
    orderBy: { id: 'asc' },
    select: {
      id: true,
      nombre: true,
      correo: true,
      activo: true,
      creadoEn: true,
      roles: { select: { rol: { select: { nombre: true } } } }
    }
  })
  return usuarios.map(u => ({ ...u, roles: u.roles.map(r => r.rol.nombre) }))
}

async function obtenerUsuarioPorId(id) {
  const usuario = await prisma.usuario.findUnique({
    where: { id },
    select: {
      id: true,
      nombre: true,
      correo: true,
      activo: true,
      creadoEn: true,
      negocioId: true,
      roles: { select: { rol: { select: { nombre: true, permisos: { select: { permiso: { select: { clave: true } } } } } } } },
      permisos: { select: { permiso: { select: { clave: true } } } },
      modulos: { select: { moduloId: true } }
    }
  })
  if (usuario) {
    const rolesNombres = usuario.roles.map(r => r.rol.nombre)
    // Flatten permissions from roles
    const permisosRoles = usuario.roles.flatMap(r => r.rol.permisos.map(p => p.permiso.clave))
    // Flatten direct permissions
    const permisosDirectos = usuario.permisos.map(p => p.permiso.clave)
    
    usuario.roles = rolesNombres
    usuario.permisos = [...new Set([...permisosRoles, ...permisosDirectos])]
    usuario.permisosDirectos = permisosDirectos // To distinguish in frontend if needed
    usuario.modulos = Array.isArray(usuario.modulos) ? usuario.modulos.map(m => m.moduloId) : []
  }
  return usuario
}

async function actualizarUsuario(id, datos) {
  const campos = {}
  if (typeof datos.nombre === 'string') campos.nombre = datos.nombre
  if (typeof datos.correo === 'string') campos.correo = datos.correo
  if (typeof datos.activo === 'boolean') campos.activo = datos.activo
  const usuario = await prisma.usuario.update({
    where: { id },
    data: campos,
    select: {
      id: true,
      nombre: true,
      correo: true,
      activo: true,
      roles: { select: { rol: { select: { nombre: true } } } }
    }
  })
  usuario.roles = usuario.roles.map(r => r.rol.nombre)
  return usuario
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
  const usuario = await prisma.usuario.findUnique({ where: { id } })
  if (usuario && usuario.correo === ADMIN_CORREO) {
    throw new Error('No se puede desactivar el usuario administrador principal')
  }
  return prisma.usuario.update({ where: { id }, data: { activo: false }, select: { id: true, activo: true } })
}

async function eliminarUsuario(id) {
  const usuario = await prisma.usuario.findUnique({ where: { id } })
  if (!usuario) {
    throw new Error('Usuario no encontrado')
  }
  if (usuario.correo === ADMIN_CORREO) {
    throw new Error('No se puede eliminar el usuario administrador principal')
  }
  return prisma.usuario.delete({ where: { id } })
}

async function asignarRolesAUsuario(id, roles = []) {
  await prisma.usuarioRol.deleteMany({ where: { usuarioId: id } })
  if (Array.isArray(roles) && roles.length) {
    const rolesDb = await prisma.rol.findMany({ where: { nombre: { in: roles } } })
    for (const r of rolesDb) await prisma.usuarioRol.create({ data: { usuarioId: id, rolId: r.id } })
  }
  return { id }
}

async function crearUsuario(datos) {
  const passwordHash = await bcrypt.hash(datos.password, 10)
  
  // Create user
  const usuario = await prisma.usuario.create({
    data: {
      nombre: datos.nombre,
      correo: datos.correo,
      passwordHash,
      activo: datos.activo !== undefined ? datos.activo : true
    }
  })

  // Assign role if provided
  if (datos.rol) {
    const rol = await prisma.rol.findUnique({ where: { nombre: datos.rol } })
    if (rol) {
      await prisma.usuarioRol.create({
        data: {
          usuarioId: usuario.id,
          rolId: rol.id
        }
      })
    } else if (datos.rol === 'trabajador') {
        // Create 'trabajador' role if it doesn't exist? 
        // Better to assume roles should exist. 
        // But for safety let's try to find 'TRABAJADOR' (uppercase usually) or whatever the convention is.
        // bootstrap.js created 'ADMIN'. Let's see if there are other roles.
        // For now, let's just try to find by name.
    }
  }

  return obtenerUsuarioPorId(usuario.id)
}

async function asignarPermisosDirectos(id, permisos = [], adminId = null) {
  // Clear existing direct permissions
  await prisma.usuarioPermiso.deleteMany({ where: { usuarioId: id } })
  
  if (Array.isArray(permisos) && permisos.length > 0) {
    const permsDb = await prisma.permiso.findMany({ where: { clave: { in: permisos } } })
    for (const p of permsDb) {
      await prisma.usuarioPermiso.create({
        data: { usuarioId: id, permisoId: p.id }
      })
    }
  }

  // Log audit
  if (adminId) {
    await prisma.auditLog.create({
      data: {
        usuarioId: adminId,
        accion: 'ASIGNAR_PERMISOS_USUARIO',
        detalle: `Usuario ID: ${id}, Permisos: ${permisos.join(', ')}`
      }
    })
  }

  return obtenerUsuarioPorId(id)
}

async function asignarModulosAUsuario(id, modulos = []) {
  await prisma.usuarioModulo.deleteMany({ where: { usuarioId: id } })
  const ids = Array.from(new Set((Array.isArray(modulos) ? modulos : []).map(m => String(m)).filter(Boolean)))
  if (ids.length) {
    const existentes = await prisma.modulo.findMany({ where: { id: { in: ids } }, select: { id: true } })
    const validos = existentes.map(m => m.id)
    if (validos.length) {
      await prisma.usuarioModulo.createMany({
        data: validos.map(moduloId => ({ usuarioId: id, moduloId })),
        skipDuplicates: true
      })
    }
  }
  return obtenerUsuarioPorId(id)
}

module.exports = { listarUsuarios, obtenerUsuarioPorId, actualizarUsuario, cambiarPassword, activarUsuario, desactivarUsuario, eliminarUsuario, asignarRolesAUsuario, crearUsuario, asignarPermisosDirectos, asignarModulosAUsuario }
