const {
  listarProductos,
  obtenerProductoPorId,
  crearProducto,
  actualizarProducto,
  eliminarProducto
} = require('./producto.servicio')

const tipoToModuloId = {
  ROPA: 'ropa',
  ALIMENTO: 'alimentos',
  SERVICIO: 'servicios',
  FARMACIA: 'farmacia',
  PAPELERIA: 'papeleria',
  RESTAURANTE: 'restaurante'
}

function asegurarAccesoTipoProducto(req, res, tipo) {
  const roles = req.user?.roles || []
  const adminPorDefecto = req.user?.adminPorDefecto === true
  if (roles.includes('ADMIN') && adminPorDefecto) return
  const t = String(tipo || 'GENERAL').toUpperCase()
  if (t === 'GENERAL') return
  const moduloId = tipoToModuloId[t]
  const modulos = Array.isArray(req.user?.modulos) ? req.user.modulos : []
  if (!moduloId || !modulos.includes(moduloId)) {
    res.code(403)
    throw new Error('No autorizado')
  }
}

function filtrarProductosPorModulos(req, productos) {
  const roles = req.user?.roles || []
  const adminPorDefecto = req.user?.adminPorDefecto === true
  if (roles.includes('ADMIN') && adminPorDefecto) return productos
  const modulos = Array.isArray(req.user?.modulos) ? req.user.modulos : []
  const tiposPermitidos = new Set(['GENERAL'])
  for (const moduloId of modulos) {
    const tipo = Object.keys(tipoToModuloId).find(t => tipoToModuloId[t] === moduloId)
    if (tipo) tiposPermitidos.add(tipo)
  }
  return (productos || []).filter(p => tiposPermitidos.has(String(p?.tipo || 'GENERAL').toUpperCase()))
}

async function registrarRutasProducto(app) {
  app.get('/productos', { preHandler: [app.autenticar] }, async (req, res) => {
    const datos = await listarProductos()
    return res.send(filtrarProductosPorModulos(req, datos))
  })

  app.get('/productos/:id', { preHandler: [app.autenticar] }, async (req, res) => {
    const id = Number(req.params.id)
    const dato = await obtenerProductoPorId(id)
    if (!dato) {
      res.code(404)
      return { mensaje: 'No encontrado' }
    }
    try {
      asegurarAccesoTipoProducto(req, res, dato.tipo)
    } catch (e) {
      res.code(404)
      return { mensaje: 'No encontrado' }
    }
    return dato
  })

  app.post('/productos', { preHandler: [app.requierePermiso('GESTION_INVENTARIO')] }, async (req, res) => {
    const cuerpo = req.body
    asegurarAccesoTipoProducto(req, res, cuerpo?.tipo)
    const creado = await crearProducto(cuerpo)
    res.code(201)
    return creado
  })

  app.put('/productos/:id', { preHandler: [app.requierePermiso('GESTION_INVENTARIO')] }, async (req, res) => {
    const id = Number(req.params.id)
    const cuerpo = req.body
    const actual = await obtenerProductoPorId(id)
    if (!actual) {
      res.code(404)
      return { mensaje: 'No encontrado' }
    }
    asegurarAccesoTipoProducto(req, res, actual.tipo)
    const actualizado = await actualizarProducto(id, cuerpo)
    return actualizado
  })

  app.delete('/productos/:id', { preHandler: [app.requierePermiso('GESTION_INVENTARIO')] }, async (req, res) => {
    const id = Number(req.params.id)
    const actual = await obtenerProductoPorId(id)
    if (!actual) {
      res.code(404)
      return { mensaje: 'No encontrado' }
    }
    asegurarAccesoTipoProducto(req, res, actual.tipo)
    const eliminado = await eliminarProducto(id)
    return eliminado
  })
}

module.exports = { registrarRutasProducto }
