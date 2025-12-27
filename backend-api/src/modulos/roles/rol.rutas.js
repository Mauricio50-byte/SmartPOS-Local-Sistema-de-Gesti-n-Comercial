const { listarRoles, crearRol, actualizarRol, listarPermisos } = require('./rol.servicio')

async function registrarRutasRol(app) {
  const asegurarLectura = async (req, res) => {
    await req.jwtVerify()
    const permisos = Array.isArray(req.user?.permisos) ? req.user.permisos : []
    const roles = Array.isArray(req.user?.roles) ? req.user.roles : []
    const permisosNorm = new Set(permisos.map(p => String(p).toUpperCase()))
    const rolesNorm = new Set(roles.map(r => String(r).toUpperCase()))
    if (rolesNorm.has('ADMIN')) return
    const tienePermiso = permisosNorm.has('CREAR_ROL') ||
      permisosNorm.has('EDITAR_ROL') ||
      permisosNorm.has('GESTION_USUARIOS')
    if (!tienePermiso) {
      req.log.warn({
        ruta: req.raw?.url,
        userId: req.user?.id,
        roles,
        permisos,
        rolesNorm: Array.from(rolesNorm),
        permisosNorm: Array.from(permisosNorm),
        adminPorDefecto: req.user?.adminPorDefecto === true,
        tieneAuthHeader: Boolean(req.headers?.authorization)
      }, '403 /roles|/permisos - No autorizado')
      res.code(403)
      throw new Error('No autorizado')
    }
  }

  const asegurarAdminDefecto = async (req, res) => {
    await req.jwtVerify()
    const roles = Array.isArray(req.user?.roles) ? req.user.roles : []
    const rolesNorm = new Set(roles.map(r => String(r).toUpperCase()))
    const adminPorDefecto = req.user?.adminPorDefecto === true
    if (!(rolesNorm.has('ADMIN') && adminPorDefecto)) { res.code(403); throw new Error('No autorizado') }
  }

  app.get('/roles', { preHandler: [asegurarLectura] }, async () => {
    return listarRoles()
  })

  app.get('/permisos', { preHandler: [asegurarLectura] }, async () => {
    return listarPermisos()
  })

  app.post('/roles', { preHandler: [asegurarAdminDefecto] }, async (req, res) => {
    const creado = await crearRol(req.body || {})
    res.code(201)
    return creado
  })

  app.put('/roles/:id', { preHandler: [asegurarAdminDefecto] }, async (req) => {
    const id = Number(req.params.id)
    return actualizarRol(id, req.body)
  })
}

module.exports = { registrarRutasRol }
