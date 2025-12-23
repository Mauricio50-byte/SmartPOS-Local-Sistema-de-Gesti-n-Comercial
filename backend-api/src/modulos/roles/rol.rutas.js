const { listarRoles, crearRol, actualizarRol } = require('./rol.servicio')

async function registrarRutasRol(app) {
  // Permitir listar roles si se tiene permiso de crear roles, editar roles O gestionar usuarios
  app.get('/roles', { 
    preHandler: [async (req, res) => {
      await req.jwtVerify()
      const permisos = req.user?.permisos || []
      const roles = req.user?.roles || []
      const adminPorDefecto = req.user?.adminPorDefecto === true
      if (roles.includes('ADMIN') && !adminPorDefecto) {
        res.code(403)
        throw new Error('No autorizado')
      }
      const tienePermiso = permisos.includes('CREAR_ROL') || 
                           permisos.includes('EDITAR_ROL') || 
                           permisos.includes('GESTION_USUARIOS') ||
                           (roles.includes('ADMIN') && adminPorDefecto)
      if (!tienePermiso) {
        res.code(403)
        throw new Error('No autorizado')
      }
    }] 
  }, async () => {
    return listarRoles()
  })

  app.post('/roles', { preHandler: [async (req, res) => {
    await req.jwtVerify()
    const roles = req.user?.roles || []
    const adminPorDefecto = req.user?.adminPorDefecto === true
    if (!(roles.includes('ADMIN') && adminPorDefecto)) { res.code(403); throw new Error('No autorizado') }
  }] }, async (req, res) => {
    const creado = await crearRol(req.body || {})
    res.code(201)
    return creado
  })

  app.put('/roles/:id', { preHandler: [async (req, res) => {
    await req.jwtVerify()
    const roles = req.user?.roles || []
    const adminPorDefecto = req.user?.adminPorDefecto === true
    if (!(roles.includes('ADMIN') && adminPorDefecto)) { res.code(403); throw new Error('No autorizado') }
  }] }, async (req) => {
    const id = Number(req.params.id)
    return actualizarRol(id, req.body || {})
  })
}

module.exports = { registrarRutasRol }
