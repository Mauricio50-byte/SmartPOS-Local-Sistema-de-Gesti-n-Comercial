const {
  listarClientes,
  obtenerClientePorId,
  crearCliente,
  actualizarCliente,
  eliminarCliente
} = require('./cliente.servicio')

async function registrarRutasCliente(app) {
  app.get('/clientes', async (req, res) => {
    const datos = await listarClientes()
    return res.send(datos)
  })

  app.get('/clientes/:id', async (req, res) => {
    const id = Number(req.params.id)
    const dato = await obtenerClientePorId(id)
    if (!dato) {
      res.code(404)
      return { mensaje: 'No encontrado' }
    }
    return dato
  })

  app.post('/clientes', { preHandler: [app.requierePermiso('GESTION_CLIENTES')] }, async (req, res) => {
    const cuerpo = req.body
    const creado = await crearCliente(cuerpo)
    res.code(201)
    return creado
  })

  app.put('/clientes/:id', { preHandler: [app.requierePermiso('GESTION_CLIENTES')] }, async (req, res) => {
    const id = Number(req.params.id)
    const cuerpo = req.body
    const actualizado = await actualizarCliente(id, cuerpo)
    return actualizado
  })

  app.delete('/clientes/:id', { preHandler: [app.requierePermiso('GESTION_CLIENTES')] }, async (req, res) => {
    const id = Number(req.params.id)
    const eliminado = await eliminarCliente(id)
    return eliminado
  })
}

module.exports = { registrarRutasCliente }
