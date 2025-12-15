const fastify = require('fastify')
const cors = require('@fastify/cors')
const jwtPlugin = require('@fastify/jwt')
const fastifyStatic = require('@fastify/static')
const path = require('path')
const { PUERTO, JWT_SECRETO } = require('./configuracion/entorno')
const { registrarRutasProducto } = require('./modulos/productos/producto.rutas')
const { registrarRutasCliente } = require('./modulos/clientes/cliente.rutas')
const { registrarRutasVenta } = require('./modulos/ventas/venta.rutas')
const { registrarRutasAuth } = require('./modulos/auth/auth.rutas')
const { registrarRutasUsuario } = require('./modulos/usuarios/usuario.rutas')
const { registrarRutasDeuda } = require('./modulos/deudas/deuda.rutas')
const { registrarRutasSistema } = require('./modulos/sistema/sistema.rutas')
const { asegurarPermisosYAdmin } = require('./infraestructura/bootstrap')
const { prisma } = require('./infraestructura/bd')

async function iniciar() {
  const app = fastify({ logger: true })
  await app.register(cors, { origin: true })
  if (JWT_SECRETO) await app.register(jwtPlugin, { secret: JWT_SECRETO })
  
  // Servir frontend estático
  const frontendPath = path.join(__dirname, '../../frontend-app/www');
  await app.register(fastifyStatic, {
    root: frontendPath,
    prefix: '/' // servir en la raíz
  })

  app.setNotFoundHandler((req, res) => {
    // Si la ruta no es de API (no empieza por /auth, /clientes, etc), devolvemos index.html
    // Esto es necesario para el enrutado de Angular (SPA)
    if (!req.raw.url.startsWith('/auth') && 
        !req.raw.url.startsWith('/clientes') &&
        !req.raw.url.startsWith('/productos') &&
        !req.raw.url.startsWith('/ventas') &&
        !req.raw.url.startsWith('/usuarios') &&
        !req.raw.url.startsWith('/sistema')) {
        return res.sendFile('index.html')
    }
    // Si es una ruta de API desconocida, devolvemos 404 normal
    res.code(404).send({ mensaje: 'Ruta no encontrada' })
  })

  app.decorate('requierePermiso', (clave) => async (req, res) => { 
    await req.jwtVerify(); 
    const permisos = req.user?.permisos || []; 
    const roles = req.user?.roles || [];
    // Si el usuario tiene el rol de ADMIN, le damos paso libre (o verificamos si la clave es 'ADMIN' específicamente)
    if (roles.includes('ADMIN') || permisos.includes(clave)) {
        return;
    }
    // Caso especial: si se pide permiso 'ADMIN', verificamos si tiene el ROL 'ADMIN'
    if (clave === 'ADMIN' && roles.includes('ADMIN')) {
        return;
    }
    
    res.code(403); 
    throw new Error('No autorizado') 
  })
  app.decorate('prisma', prisma)

  app.get('/salud', async () => ({ ok: true }))

  await asegurarPermisosYAdmin()

  await registrarRutasAuth(app)
  await registrarRutasUsuario(app)
  await registrarRutasProducto(app)
  await registrarRutasCliente(app)
  await registrarRutasVenta(app)
  await registrarRutasDeuda(app)
  await registrarRutasSistema(app)

  try {
    await app.listen({ port: PUERTO, host: '0.0.0.0' })
  } catch (e) {
    process.exit(1)
  }
}

iniciar()
