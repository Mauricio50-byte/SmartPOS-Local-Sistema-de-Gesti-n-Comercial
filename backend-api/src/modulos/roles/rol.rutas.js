const { listarRoles, crearRol, actualizarRol } = require('./rol.servicio')

async function registrarRutasRol(app) {
  app.get('/roles', { preHandler: [app.requierePermiso('CREAR_ROL')] }, async () => {
    return listarRoles()
  })

  app.post('/roles', { preHandler: [app.requierePermiso('CREAR_ROL')] }, async (req, res) => {
    const creado = await crearRol(req.body || {})
    res.code(201)
    return creado
  })

  app.put('/roles/:id', { preHandler: [app.requierePermiso('EDITAR_ROL')] }, async (req) => {
    const id = Number(req.params.id)
    return actualizarRol(id, req.body || {})
  })
}

module.exports = { registrarRutasRol }
