const { listarRoles, crearRol, actualizarRol, listarPermisos } = require('./rol.servicio')

async function registrarRutasRol(app) {
  app.get('/roles', { preHandler: [app.autenticar] }, async (req, res) => {
    return listarRoles()
  })

  app.get('/permisos', { preHandler: [app.autenticar] }, async (req, res) => {
    return listarPermisos()
  })

  app.post('/roles', { preHandler: [app.requierePermiso('ADMIN')] }, async (req, res) => {
    const rol = await crearRol(req.body)
    res.code(201)
    return rol
  })

  app.put('/roles/:id', { preHandler: [app.requierePermiso('ADMIN')] }, async (req, res) => {
    const id = Number(req.params.id)
    return actualizarRol(id, req.body)
  })
}

module.exports = { registrarRutasRol }
