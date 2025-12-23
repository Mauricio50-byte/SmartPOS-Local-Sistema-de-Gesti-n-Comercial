const { listarRoles, crearRol, actualizarRol, listarPermisos } = require('./rol.servicio')

async function registrarRutasRol(app) {
  const asegurarLectura = async (req, res) => {
    await req.jwtVerify()
    const permisos = req.user?.permisos || []
    const roles = req.user?.roles || []
    const adminPorDefecto = req.user?.adminPorDefecto === true
    if (roles.includes('ADMIN') && !adminPorDefecto) { res.code(403); throw new Error('No autorizado') }
    const tienePermiso = permisos.includes('CREAR_ROL') ||
      permisos.includes('EDITAR_ROL') ||
      permisos.includes('GESTION_USUARIOS') ||
      (roles.includes('ADMIN') && adminPorDefecto)
    if (!tienePermiso) { res.code(403); throw new Error('No autorizado') }
  }

  const asegurarAdminDefecto = async (req, res) => {
    await req.jwtVerify()
    const roles = req.user?.roles || []
    const adminPorDefecto = req.user?.adminPorDefecto === true
    if (!(roles.includes('ADMIN') && adminPorDefecto)) { res.code(403); throw new Error('No autorizado') }
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
