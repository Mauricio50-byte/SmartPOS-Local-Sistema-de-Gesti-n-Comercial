const fastify = require('fastify')
const cors = require('@fastify/cors')
const jwtPlugin = require('@fastify/jwt')
const { PUERTO, JWT_SECRETO } = require('./configuracion/entorno')
const { registrarRutasProducto } = require('./modulos/productos/producto.rutas')
const { registrarRutasCliente } = require('./modulos/clientes/cliente.rutas')
const { registrarRutasVenta } = require('./modulos/ventas/venta.rutas')
const { registrarRutasAuth } = require('./modulos/auth/auth.rutas')
const { registrarRutasUsuario } = require('./modulos/usuarios/usuario.rutas')
const { asegurarPermisosYAdmin } = require('./infraestructura/bootstrap')
const { prisma } = require('./infraestructura/bd')

async function iniciar() {
  const app = fastify({ logger: true })
  await app.register(cors, { origin: true })
  if (JWT_SECRETO) await app.register(jwtPlugin, { secret: JWT_SECRETO })
  app.decorate('requierePermiso', (clave) => async (req, res) => { await req.jwtVerify(); const permisos = req.user?.permisos || []; if (!permisos.includes(clave)) { res.code(403); throw new Error('No autorizado') } })
  app.decorate('prisma', prisma)

  app.get('/salud', async () => ({ ok: true }))

  await asegurarPermisosYAdmin()

  await registrarRutasAuth(app)
  await registrarRutasUsuario(app)
  await registrarRutasProducto(app)
  await registrarRutasCliente(app)
  await registrarRutasVenta(app)

  try {
    await app.listen({ port: PUERTO, host: '0.0.0.0' })
  } catch (e) {
    process.exit(1)
  }
}

iniciar()
