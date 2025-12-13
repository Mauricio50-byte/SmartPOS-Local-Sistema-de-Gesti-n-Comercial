const { listarUsuarios, obtenerUsuarioPorId, actualizarUsuario, cambiarPassword, activarUsuario, desactivarUsuario, asignarRolesAUsuario } = require('./usuario.servicio')

async function asegurarAdmin(req, res) {
  await req.jwtVerify()
  const roles = req.user?.roles || []
  const permisos = req.user?.permisos || []
  if (!roles.includes('ADMIN') && !permisos.includes('GESTION_USUARIOS')) { res.code(403); throw new Error('No autorizado') }
}

async function registrarRutasUsuario(app) {
  app.get('/usuarios', { preHandler: [asegurarAdmin] }, async (req, res) => {
    const rol = req.query?.rol
    const activo = req.query?.activo
    const filtro = {}
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
    const dato = await obtenerUsuarioPorId(id)
    if (!dato) { res.code(404); return { mensaje: 'No encontrado' } }
    return dato
  })

  app.put('/usuarios/:id', { preHandler: [asegurarAdmin] }, async (req, res) => {
    const id = Number(req.params.id)
    const actualizado = await actualizarUsuario(id, req.body || {})
    return actualizado
  })

  app.put('/usuarios/:id/password', { preHandler: [asegurarAdmin] }, async (req, res) => {
    const id = Number(req.params.id)
    const { nueva } = req.body || {}
    const resp = await cambiarPassword(id, nueva)
    return resp
  })

  app.put('/usuarios/:id/activar', { preHandler: [asegurarAdmin] }, async (req, res) => {
    const id = Number(req.params.id)
    return activarUsuario(id)
  })

  app.put('/usuarios/:id/desactivar', { preHandler: [asegurarAdmin] }, async (req, res) => {
    const id = Number(req.params.id)
    return desactivarUsuario(id)
  })

  app.put('/usuarios/:id/roles', { preHandler: [asegurarAdmin] }, async (req) => {
    const id = Number(req.params.id)
    const roles = Array.isArray(req.body?.roles) ? req.body.roles : []
    return asignarRolesAUsuario(id, roles)
  })
}

module.exports = { registrarRutasUsuario }
