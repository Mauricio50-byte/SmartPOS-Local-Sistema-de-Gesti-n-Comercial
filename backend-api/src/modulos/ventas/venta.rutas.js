const { listarVentas, obtenerVentaPorId, crearVenta } = require('./venta.servicio')

async function asegurarAccesoVenta(req, res, ventaId) {
  const actorNegocioId = req.user?.negocioId ?? null
  if (!actorNegocioId) return
  const venta = await obtenerVentaPorId(ventaId)
  const negocioIdVenta = venta?.usuario?.negocioId ?? null
  if (!venta || negocioIdVenta !== actorNegocioId) {
    res.code(404)
    throw new Error('No encontrado')
  }
}

async function registrarRutasVenta(app) {
  app.get('/ventas', { preHandler: [app.autenticar] }, async (req, res) => {
    const actorNegocioId = req.user?.negocioId ?? null
    const filtro = actorNegocioId ? { usuario: { is: { negocioId: actorNegocioId } } } : {}
    const datos = await listarVentas(filtro)
    return res.send(datos)
  })

  app.get('/ventas/:id', { preHandler: [app.autenticar] }, async (req, res) => {
    const id = Number(req.params.id)
    await asegurarAccesoVenta(req, res, id)
    const dato = await obtenerVentaPorId(id)
    if (!dato) {
      res.code(404)
      return { mensaje: 'No encontrado' }
    }
    return dato
  })

  app.post('/ventas', { preHandler: [app.requierePermiso('VENDER')] }, async (req, res) => {
    const creado = await crearVenta({ ...req.body, usuarioId: req.user.id }, { roles: req.user?.roles || [], modulos: req.user?.modulos || [] })
    res.code(201)
    return creado
  })
}

module.exports = { registrarRutasVenta }
