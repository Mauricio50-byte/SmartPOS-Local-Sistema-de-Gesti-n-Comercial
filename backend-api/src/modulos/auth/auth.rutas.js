const { crearAdministrador, crearUsuarioConRoles, ingresar, obtenerModulosActivosNegocio } = require('./auth.servicio')
const { prisma } = require('../../infraestructura/bd')
const { ADMIN_CORREO } = require('../../configuracion/entorno')

async function registrarRutasAuth(app) {
  app.decorate('autenticar', async (req, res) => { await req.jwtVerify() })

  app.post('/auth/ingresar', async (req, res) => {
    const { correo, password } = req.body || {}
    try {
      const { usuario, roles, permisos, negocioId, modulos, adminPorDefecto } = await ingresar({ correo, password })
      const token = await res.jwtSign({ id: usuario.id, roles, permisos, nombre: usuario.nombre, correo: usuario.correo, negocioId, modulos, adminPorDefecto })
      return {
        token,
        usuario: {
          id: usuario.id,
          roles,
          permisos,
          nombre: usuario.nombre,
          correo: usuario.correo,
          negocioId,
          modulos,
          adminPorDefecto
        }
      }
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
      const adminPorDefecto = req.user?.adminPorDefecto === true
      if (!(roles.includes('ADMIN') && adminPorDefecto)) { res.code(403); throw new Error('No autorizado') }
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
        permisos: { include: { permiso: true } },
        modulos: true
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

    const negocioId = usuario.negocioId ?? null
    const adminPorDefecto = String(usuario.correo || '').trim().toLowerCase() === String(ADMIN_CORREO || '').trim().toLowerCase()
    let modulos = []
    if (negocioId) {
      const activos = await obtenerModulosActivosNegocio(negocioId)
      if (roles.includes('ADMIN') && adminPorDefecto) {
        modulos = activos
      } else if (roles.includes('ADMIN')) {
        const asignados = Array.isArray(usuario.modulos) ? usuario.modulos.map(m => m.moduloId) : []
        modulos = asignados.length ? asignados : activos.slice(0, 3)
      } else {
        const asignados = Array.isArray(usuario.modulos) ? usuario.modulos.map(m => m.moduloId) : []
        modulos = asignados.length ? asignados : activos
      }
    }

    return {
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        roles,
        permisos,
        negocioId,
        modulos,
        adminPorDefecto
      },
      token: await res.jwtSign({ id: usuario.id, roles, permisos, nombre: usuario.nombre, correo: usuario.correo, negocioId, modulos, adminPorDefecto })
    }
  })
}

module.exports = { registrarRutasAuth }
