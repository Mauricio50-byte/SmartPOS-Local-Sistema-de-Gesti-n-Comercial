const { listarModulos, toggleModulo, actualizarConfig } = require('./modulo.servicio')

async function registrarRutasModulos(app) {
  app.get('/modulos', { preHandler: [app.requierePermiso('GESTION_MODULOS')] }, async (req, res) => {
    return listarModulos()
  })

  app.patch('/modulos/:id/toggle', { preHandler: [app.requierePermiso('GESTION_MODULOS')] }, async (req, res) => {
    const { id } = req.params
    const { activo } = req.body
    return toggleModulo(id, activo)
  })

  app.put('/modulos/:id/config', { preHandler: [app.requierePermiso('GESTION_MODULOS')] }, async (req, res) => {
    const { id } = req.params
    const { config } = req.body
    return actualizarConfig(id, config)
  })
}

module.exports = { registrarRutasModulos }
