const { prisma } = require('../../infraestructura/bd')
const { ADMIN_CORREO } = require('../../configuracion/entorno')
const {
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
} = require('./usuario.servicio')

async function asegurarAdmin(req, res) {
  await req.jwtVerify()
  // Recalcular permisos antes de verificar
  // Nota: req.user viene del token. Si los permisos cambiaron, el token podría estar desactualizado.
  // Idealmente deberíamos consultar la DB, pero por performance a veces se confía en el token.
  // Sin embargo, como estamos gestionando permisos críticos, consultaremos DB o confiaremos en que el frontend refresca token si es necesario.
  // Pero espera, req.user en fastify-jwt es el payload del token.
  
  // Vamos a verificar permisos extendidos
  const roles = req.user?.roles || []
  const permisos = req.user?.permisos || []
  const adminPorDefecto = req.user?.adminPorDefecto === true
  
  // ADMIN tiene acceso total
  if (roles.includes('ADMIN') && adminPorDefecto) return

  // Si no es ADMIN, debe tener permiso explicito
  if (!permisos.includes('GESTION_USUARIOS')) { 
      res.code(403)
      throw new Error('No autorizado') 
  }
}

async function asegurarAdminPorDefecto(req, res) {
  await req.jwtVerify()
  const roles = req.user?.roles || []
  const adminPorDefecto = req.user?.adminPorDefecto === true
  if (roles.includes('ADMIN') && adminPorDefecto) return
  res.code(403)
  throw new Error('No autorizado')
}

async function asegurarAccesoMismoNegocio(req, res, usuarioId) {
  const actorNegocioId = req.user?.negocioId ?? null
  const actorRoles = req.user?.roles || []
  const actorAdminPorDefecto = req.user?.adminPorDefecto === true
  if (actorRoles.includes('ADMIN') && actorAdminPorDefecto) return
  if (!actorNegocioId) return
  const objetivo = await prisma.usuario.findUnique({ where: { id: usuarioId }, select: { negocioId: true } })
  if (!objetivo || objetivo.negocioId !== actorNegocioId) {
    res.code(403)
    throw new Error('No autorizado')
  }
}

async function registrarRutasUsuario(app) {
  app.post('/usuarios', { preHandler: [asegurarAdmin] }, async (req, res) => {
    const usuario = await crearUsuario(req.body, req.user)
    return usuario
  })

  app.put('/usuarios/:id/permisos', { preHandler: [asegurarAdmin] }, async (req, res) => {
    const id = Number(req.params.id)
    await asegurarAccesoMismoNegocio(req, res, id)
    const permisos = Array.isArray(req.body?.permisos) ? req.body.permisos : []
    const actorRoles = req.user?.roles || []
    const actorPermisos = Array.isArray(req.user?.permisos) ? req.user.permisos : []
    const actorAdminPorDefecto = req.user?.adminPorDefecto === true

    if (!actorAdminPorDefecto) {
      if (!actorRoles.includes('ADMIN')) { res.code(403); throw new Error('No autorizado') }
      const objetivo = await prisma.usuario.findUnique({
        where: { id },
        select: { id: true, roles: { select: { rol: { select: { nombre: true } } } } }
      })
      if (!objetivo) { res.code(404); return { mensaje: 'No encontrado' } }
      const objetivoRoles = Array.isArray(objetivo?.roles) ? objetivo.roles.map(r => r.rol.nombre) : []
      if (!objetivoRoles.includes('TRABAJADOR')) { res.code(403); throw new Error('No autorizado') }

      const permitidosSet = new Set(['VENDER', 'GESTION_INVENTARIO', 'GESTION_CLIENTES', 'VER_REPORTES', 'GESTION_FINANZAS'])
      const actorSet = new Set(actorPermisos)
      const filtrados = permisos.filter(p => permitidosSet.has(p) && actorSet.has(p))
      const adminId = req.user?.id ?? null
      return asignarPermisosDirectos(id, filtrados, adminId)
    }

    const adminId = req.user?.id // Asumiendo que el ID del admin viene en el token
    return asignarPermisosDirectos(id, permisos, adminId)
  })

  app.get('/usuarios', { preHandler: [asegurarAdmin] }, async (req, res) => {
    const rol = req.query?.rol
    const activo = req.query?.activo
    const filtro = {}
    const actorNegocioId = req.user?.negocioId ?? null
    const actorRoles = req.user?.roles || []
    const actorAdminPorDefecto = req.user?.adminPorDefecto === true
    if (actorNegocioId && !(actorRoles.includes('ADMIN') && actorAdminPorDefecto)) filtro.negocioId = actorNegocioId
    if (rol) {
      filtro.roles = {
        some: {
          rol: {
            nombre: rol
          }
        }
      }
    }
    if (typeof activo !== 'undefined') filtro.activo = activo === 'true'
    const datos = await listarUsuarios(filtro)
    return res.send(datos)
  })

  app.get('/usuarios/:id', { preHandler: [asegurarAdmin] }, async (req, res) => {
    const id = Number(req.params.id)
    await asegurarAccesoMismoNegocio(req, res, id)
    const dato = await obtenerUsuarioPorId(id)
    if (!dato) { res.code(404); return { mensaje: 'No encontrado' } }
    return dato
  })

  app.put('/usuarios/:id', { preHandler: [asegurarAdmin] }, async (req, res) => {
    const id = Number(req.params.id)
    await asegurarAccesoMismoNegocio(req, res, id)
    const actualizado = await actualizarUsuario(id, req.body || {})
    return actualizado
  })

  app.put('/usuarios/:id/password', { preHandler: [asegurarAdmin] }, async (req, res) => {
    const id = Number(req.params.id)
    await asegurarAccesoMismoNegocio(req, res, id)
    const { nueva } = req.body || {}
    const resp = await cambiarPassword(id, nueva)
    return resp
  })

  app.put('/usuarios/:id/activar', { preHandler: [asegurarAdmin] }, async (req, res) => {
    const id = Number(req.params.id)
    await asegurarAccesoMismoNegocio(req, res, id)
    return activarUsuario(id)
  })

  app.put('/usuarios/:id/desactivar', { preHandler: [asegurarAdmin] }, async (req, res) => {
    const id = Number(req.params.id)
    await asegurarAccesoMismoNegocio(req, res, id)
    return desactivarUsuario(id)
  })

  app.put('/usuarios/:id/roles', { preHandler: [asegurarAdmin] }, async (req, res) => {
    const id = Number(req.params.id)
    await asegurarAccesoMismoNegocio(req, res, id)
    const roles = Array.isArray(req.body?.roles) ? req.body.roles : []
    const actorAdminPorDefecto = req.user?.adminPorDefecto === true
    if (!actorAdminPorDefecto && roles.includes('ADMIN')) {
      res.code(403)
      throw new Error('No autorizado')
    }
    return asignarRolesAUsuario(id, roles)
  })

  app.put('/usuarios/:id/modulos', { preHandler: [asegurarAdminPorDefecto] }, async (req, res) => {
    const id = Number(req.params.id)
    await asegurarAccesoMismoNegocio(req, res, id)

    const modulos = Array.isArray(req.body?.modulos) ? req.body.modulos : []
    const objetivo = await prisma.usuario.findUnique({ where: { id }, select: { negocioId: true } })
    const negocioId = objetivo?.negocioId
    if (!negocioId) return asignarModulosAUsuario(id, [])

    const activosNegocio = await obtenerModulosActivosNegocio(negocioId)
    const activosSet = new Set(activosNegocio)
    const invalidos = modulos.filter(m => !activosSet.has(m))
    if (invalidos.length) {
      res.code(400)
      return { mensaje: 'Módulos inválidos para este negocio' }
    }
    await asignarModulosAUsuario(id, modulos)
    return obtenerUsuarioPorId(id)
  })
}

module.exports = { registrarRutasUsuario }
