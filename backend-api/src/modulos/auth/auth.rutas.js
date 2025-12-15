const { crearAdministrador, crearUsuarioConRoles, ingresar } = require('./auth.servicio')
const { prisma } = require('../../infraestructura/bd')

async function registrarRutasAuth(app) {
  app.decorate('autenticar', async (req, res) => { await req.jwtVerify() })

  app.post('/auth/ingresar', async (req, res) => {
    const { correo, password } = req.body || {}
    try {
      const { usuario, roles, permisos } = await ingresar({ correo, password })
      const token = await res.jwtSign({ id: usuario.id, roles, permisos, nombre: usuario.nombre })
      return { token, usuario: { id: usuario.id, roles, permisos, nombre: usuario.nombre, correo: usuario.correo } }
    } catch (e) {
      if (e && e.message === 'Credenciales inválidas') {
        res.code(401)
        return { mensaje: e.message }
      }
      throw e
    }
  })

  app.post('/auth/registrar-admin', async (req, res) => {
    const totalAdmins = await prisma.usuario.count({ where: { roles: { some: { rol: { nombre: 'ADMIN' } } } } })
    if (totalAdmins > 0) {
      await req.jwtVerify()
      const roles = req.user?.roles || []
      if (!roles.includes('ADMIN')) { res.code(403); throw new Error('No autorizado') }
    }
    const { nombre, correo, password } = req.body || {}
    const creado = await crearAdministrador({ nombre, correo, password })
    res.code(201)
    return { id: creado.id }
  })

  app.post('/auth/registrar-usuario', { preHandler: [app.requierePermiso('GESTION_USUARIOS')] }, async (req, res) => {
    const { nombre, correo, password, roles = [] } = req.body || {}
    const creado = await crearUsuarioConRoles({ nombre, correo, password, roles })
    res.code(201)
    return { id: creado.id }
  })

  app.get('/auth/perfil', { preHandler: [app.autenticar] }, async (req, res) => {
    // Consultar la base de datos para obtener los permisos actualizados
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.user.id },
      include: {
        roles: {
          include: {
            rol: {
              include: {
                permisos: { include: { permiso: true } }
              }
            }
          }
        },
        permisos: { include: { permiso: true } }
      }
    })

    if (!usuario || !usuario.activo) {
      res.code(401)
      return { mensaje: 'Usuario no autorizado' }
    }

    const roles = usuario.roles.map(ur => ur.rol.nombre)
    const permisosRoles = usuario.roles.flatMap(ur => ur.rol.permisos.map(rp => rp.permiso.clave))
    const permisosDirectos = usuario.permisos.map(up => up.permiso.clave)
    const permisos = Array.from(new Set([...permisosRoles, ...permisosDirectos]))

    return {
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        roles,
        permisos
      }
    }
  })
}

module.exports = { registrarRutasAuth }
