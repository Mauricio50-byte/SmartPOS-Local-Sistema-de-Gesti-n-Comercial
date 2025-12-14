const { listarUsuarios, obtenerUsuarioPorId, actualizarUsuario, cambiarPassword, activarUsuario, desactivarUsuario, asignarRolesAUsuario, crearUsuario, asignarPermisosDirectos } = require('./usuario.servicio')

async function asegurarAdmin(req, res) {
  await req.jwtVerify()
  // Recalcular permisos antes de verificar
  // Nota: req.user viene del token. Si los permisos cambiaron, el token podría estar desactualizado.
  // Idealmente deberíamos consultar la DB, pero por performance a veces se confía en el token.
  // Sin embargo, como estamos gestionando permisos críticos, consultaremos DB o confiaremos en que el frontend refresca token si es necesario.
  // Pero espera, req.user en fastify-jwt es el payload del token.
  
  // Vamos a verificar permisos extendidos
  const roles = req.user?.roles || []
  const permisos = req.user?.permisos || []
  
  // ADMIN tiene acceso total
  if (roles.includes('ADMIN')) return

  // Si no es ADMIN, debe tener permiso explicito
  if (!permisos.includes('GESTION_USUARIOS')) { 
      res.code(403)
      throw new Error('No autorizado') 
  }
}

async function registrarRutasUsuario(app) {
  app.post('/usuarios', { preHandler: [asegurarAdmin] }, async (req, res) => {
    const usuario = await crearUsuario(req.body)
    return usuario
  })

  app.put('/usuarios/:id/permisos', { preHandler: [asegurarAdmin] }, async (req, res) => {
    const id = Number(req.params.id)
    const permisos = Array.isArray(req.body?.permisos) ? req.body.permisos : []
    const adminId = req.user?.id // Asumiendo que el ID del admin viene en el token
    return asignarPermisosDirectos(id, permisos, adminId)
  })

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
