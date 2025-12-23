const { prisma } = require('../../infraestructura/bd')
const bcrypt = require('bcryptjs')
const { ADMIN_CORREO } = require('../../configuracion/entorno')

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
      negocioId: true,
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
    usuario.adminPorDefecto = String(usuario.correo || '').trim().toLowerCase() === String(ADMIN_CORREO || '').trim().toLowerCase()
    const rolesNombres = usuario.roles.map(r => r.rol.nombre)
    // Flatten permissions from roles
    const permisosRoles = usuario.roles.flatMap(r => r.rol.permisos.map(p => p.permiso.clave))
    // Flatten direct permissions
    const permisosDirectos = usuario.permisos.map(p => p.permiso.clave)
    
    usuario.roles = rolesNombres
    usuario.permisos = [...new Set([...permisosRoles, ...permisosDirectos])]
    usuario.permisosDirectos = permisosDirectos // To distinguish in frontend if needed
    usuario.modulos = usuario.modulos.map(m => m.moduloId)
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

async function obtenerModulosActivosNegocio(negocioId) {
  if (!negocioId) return []
  const activos = await prisma.negocioModulo.findMany({
    where: { negocioId, activo: true },
    select: { moduloId: true }
  })
  return activos.map(a => a.moduloId)
}

async function asignarModulosAUsuario(id, modulos = []) {
  await prisma.usuarioModulo.deleteMany({ where: { usuarioId: id } })
  if (Array.isArray(modulos) && modulos.length) {
    await prisma.usuarioModulo.createMany({
      data: modulos.map(moduloId => ({ usuarioId: id, moduloId })),
      skipDuplicates: true
    })
  }
  return { id }
}

async function crearUsuario(datos, actor) {
  const passwordHash = await bcrypt.hash(datos.password, 10)

  const actorNegocioId = actor?.negocioId ?? null
  const actorRoles = Array.isArray(actor?.roles) ? actor.roles : []
  const actorPermisos = Array.isArray(actor?.permisos) ? actor.permisos : []
  const actorAdminPorDefecto = actor?.adminPorDefecto === true
  const creandoAdmin = datos.rol === 'ADMIN'
  const crearNuevoNegocio = datos?.crearNuevoNegocio === true

  if (creandoAdmin && !actorAdminPorDefecto) {
    throw new Error('No autorizado para crear administradores')
  }

  if (creandoAdmin && !actorRoles.includes('ADMIN') && !actorPermisos.includes('CREAR_ADMIN')) {
    throw new Error('No autorizado para crear administradores')
  }

  let negocioId = actorNegocioId
  if (creandoAdmin && (crearNuevoNegocio || !actorNegocioId)) {
    const negocioNombre = typeof datos.negocioNombre === 'string' && datos.negocioNombre.trim()
      ? datos.negocioNombre.trim()
      : `Negocio ${datos.nombre}`

    const negocio = await prisma.negocio.create({
      data: { nombre: negocioNombre }
    })
    negocioId = negocio.id
  }
  
  // Create user
  const usuario = await prisma.usuario.create({
    data: {
      nombre: datos.nombre,
      correo: datos.correo,
      passwordHash,
      activo: datos.activo !== undefined ? datos.activo : true,
      negocioId
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
    }
  }

  if (negocioId) {
    const modulosSolicitados = Array.isArray(datos.modulos) ? datos.modulos : []
    if (creandoAdmin && (crearNuevoNegocio || !actorNegocioId)) {
      if (modulosSolicitados.length) {
        const modulosDb = await prisma.modulo.findMany({ where: { id: { in: modulosSolicitados } }, select: { id: true } })
        const validosSet = new Set(modulosDb.map(m => m.id))
        const invalidos = modulosSolicitados.filter(m => !validosSet.has(m))
        if (invalidos.length) throw new Error('Módulos inválidos')
        await prisma.negocioModulo.createMany({
          data: modulosSolicitados.map(moduloId => ({ negocioId, moduloId, activo: true })),
          skipDuplicates: true
        })
        await asignarModulosAUsuario(usuario.id, modulosSolicitados)
      }
    } else if (creandoAdmin) {
      const activosNegocio = await obtenerModulosActivosNegocio(negocioId)
      const modulosParaUsuario = modulosSolicitados.length ? modulosSolicitados : activosNegocio
      const activosSet = new Set(activosNegocio)
      const invalidos = modulosParaUsuario.filter(m => !activosSet.has(m))
      if (invalidos.length) throw new Error('Módulos inválidos para este negocio')
      await asignarModulosAUsuario(usuario.id, modulosParaUsuario)
    } else {
      const activosNegocio = await obtenerModulosActivosNegocio(negocioId)
      const heredarModulos = actor && Array.isArray(actor?.modulos) && actor.modulos.length > 0
      const modulosParaUsuario = heredarModulos
        ? actor.modulos
        : (modulosSolicitados.length ? modulosSolicitados : activosNegocio)
      const activosSet = new Set(activosNegocio)
      const invalidos = modulosParaUsuario.filter(m => !activosSet.has(m))
      if (invalidos.length) throw new Error('Módulos inválidos para este negocio')
      await asignarModulosAUsuario(usuario.id, modulosParaUsuario)
    }
  }

  const heredarPermisos = !creandoAdmin && actor && actorRoles.includes('ADMIN') && !actorAdminPorDefecto
  if (heredarPermisos && actorPermisos.length) {
    const permitidosSet = new Set(['VENDER', 'GESTION_INVENTARIO', 'GESTION_CLIENTES', 'VER_REPORTES', 'GESTION_FINANZAS'])
    const filtrados = actorPermisos.filter(p => permitidosSet.has(p))
    const permisosDb = await prisma.permiso.findMany({ where: { clave: { in: filtrados } }, select: { id: true, clave: true } })
    if (permisosDb.length) {
      await prisma.usuarioPermiso.createMany({
        data: permisosDb.map(p => ({ usuarioId: usuario.id, permisoId: p.id })),
        skipDuplicates: true
      })
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

module.exports = {
  listarUsuarios,
  obtenerUsuarioPorId,
  actualizarUsuario,
  cambiarPassword,
  activarUsuario,
  desactivarUsuario,
  asignarRolesAUsuario,
  asignarModulosAUsuario,
  crearUsuario,
  asignarPermisosDirectos,
  obtenerModulosActivosNegocio
}
