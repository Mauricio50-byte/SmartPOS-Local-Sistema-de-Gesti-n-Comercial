const { prisma } = require('./bd')
const { ADMIN_CORREO, ADMIN_PASSWORD } = require('../configuracion/entorno')
const bcrypt = require('bcryptjs')

async function asegurarPermisosYAdmin() {
  const permisosDefinidos = [
    // Ventas
    { clave: 'VER_VENTAS', descripcion: 'Ver historial y lista de ventas' },
    { clave: 'CREAR_VENTA', descripcion: 'Registrar nuevas ventas y facturar' },
    { clave: 'EDITAR_VENTA', descripcion: 'Modificar ventas existentes' },
    { clave: 'ANULAR_VENTA', descripcion: 'Anular ventas realizadas' },
    { clave: 'REPORTES_VENTAS', descripcion: 'Ver reportes específicos de ventas' },
    { clave: 'VENDER', descripcion: 'Acceso general al punto de venta' }, // Deprecado, mantener por compatibilidad o migrar

    // Inventario (Productos)
    { clave: 'VER_INVENTARIO', descripcion: 'Ver lista de productos y stock' },
    { clave: 'CREAR_PRODUCTO', descripcion: 'Crear nuevos productos' },
    { clave: 'EDITAR_PRODUCTO', descripcion: 'Editar información de productos' },
    { clave: 'ELIMINAR_PRODUCTO', descripcion: 'Eliminar productos del sistema' },
    { clave: 'AJUSTAR_STOCK', descripcion: 'Realizar ajustes manuales de inventario' },
    { clave: 'GESTION_INVENTARIO', descripcion: 'Gestión completa de inventario' }, // Deprecado

    // Clientes
    { clave: 'VER_CLIENTES', descripcion: 'Ver lista de clientes' },
    { clave: 'CREAR_CLIENTE', descripcion: 'Registrar nuevos clientes' },
    { clave: 'EDITAR_CLIENTE', descripcion: 'Modificar datos de clientes' },
    { clave: 'ELIMINAR_CLIENTE', descripcion: 'Eliminar clientes' },
    { clave: 'GESTION_CLIENTES', descripcion: 'Gestión completa de clientes' }, // Deprecado

    // Finanzas
    { clave: 'VER_FINANZAS', descripcion: 'Ver información financiera general' },
    { clave: 'REGISTRAR_MOVIMIENTO', descripcion: 'Registrar gastos o ingresos manuales' },
    { clave: 'CERRAR_CAJA', descripcion: 'Realizar cierres de caja' },
    { clave: 'GESTION_FINANZAS', descripcion: 'Gestión completa de finanzas' }, // Deprecado

    // Usuarios
    { clave: 'VER_USUARIOS', descripcion: 'Ver lista de usuarios' },
    { clave: 'CREAR_USUARIO', descripcion: 'Crear nuevos usuarios' },
    { clave: 'EDITAR_USUARIO', descripcion: 'Editar usuarios existentes' },
    { clave: 'ELIMINAR_USUARIO', descripcion: 'Eliminar usuarios' },
    { clave: 'ACTIVAR_USUARIO', descripcion: 'Activar o desactivar usuarios' },
    { clave: 'ASIGNAR_ROLES', descripcion: 'Asignar roles a usuarios' },
    
    // Roles (Sub-módulo de Usuarios)
    { clave: 'VER_ROLES', descripcion: 'Ver roles disponibles' },
    { clave: 'CREAR_ROL', descripcion: 'Crear nuevos roles' },
    { clave: 'EDITAR_ROL', descripcion: 'Editar roles y permisos' },
    
    { clave: 'GESTION_USUARIOS', descripcion: 'Gestión completa de usuarios' }, // Deprecado

    // Módulos
    { clave: 'GESTION_MODULOS', descripcion: 'Activar/desactivar módulos del sistema' },

    // Reportes
    { clave: 'VER_REPORTES', descripcion: 'Visualizar reportes del sistema' },
    { clave: 'EXPORTAR_REPORTES', descripcion: 'Exportar datos y reportes' },

    // Configuración
    { clave: 'VER_CONFIGURACION', descripcion: 'Ver configuración del negocio' },
    { clave: 'EDITAR_CONFIGURACION', descripcion: 'Modificar configuración del negocio' },

    // Dashboard
    { clave: 'VER_DASHBOARD', descripcion: 'Acceso al dashboard principal' },

    // Admin Global (Legacy/System)
    { clave: 'ADMIN', descripcion: 'Acceso total al sistema' }
  ]

  for (const p of permisosDefinidos) {
    await prisma.permiso.upsert({
      where: { clave: p.clave },
      update: { descripcion: p.descripcion },
      create: { clave: p.clave, descripcion: p.descripcion }
    })
  }

  const adminRol = await prisma.rol.upsert({
    where: { nombre: 'ADMIN' },
    update: { descripcion: 'Acceso total al sistema' },
    create: { nombre: 'ADMIN', descripcion: 'Acceso total al sistema' }
  })

  await prisma.rol.upsert({
    where: { nombre: 'TRABAJADOR' },
    update: { descripcion: 'Acceso limitado para ventas y operaciones básicas' },
    create: { nombre: 'TRABAJADOR', descripcion: 'Acceso limitado para ventas y operaciones básicas' }
  })

  const permisos = await prisma.permiso.findMany({})
  const existentes = await prisma.rolPermiso.findMany({ where: { rolId: adminRol.id } })
  
  // Solo asignar permisos por defecto si el rol no tiene ninguno (primera vez)
  if (existentes.length === 0) {
    for (const p of permisos) {
        await prisma.rolPermiso.create({ data: { rolId: adminRol.id, permisoId: p.id } })
    }
  }

  const totalAdmins = await prisma.usuario.count({
    where: { roles: { some: { rol: { nombre: 'ADMIN' } } } }
  })
  if (totalAdmins === 0) {
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10)
    const usuario = await prisma.usuario.upsert({
      where: { correo: ADMIN_CORREO },
      update: { activo: true },
      create: { nombre: 'Administrador', correo: ADMIN_CORREO, passwordHash, activo: true }
    })
    const yaRol = await prisma.usuarioRol.findUnique({ where: { usuarioId_rolId: { usuarioId: usuario.id, rolId: adminRol.id } } })
    if (!yaRol) await prisma.usuarioRol.create({ data: { usuarioId: usuario.id, rolId: adminRol.id } })

    if (!usuario.negocioId) {
      const existente = await prisma.negocio.findFirst({ select: { id: true } })
      const negocio = existente
        ? existente
        : await prisma.negocio.create({ data: { nombre: 'Negocio Principal' }, select: { id: true } })
      await prisma.usuario.update({ where: { id: usuario.id }, data: { negocioId: negocio.id } })
    }
  } else {
    const usuario = await prisma.usuario.findUnique({ where: { correo: ADMIN_CORREO }, select: { id: true, negocioId: true } })
    if (usuario && !usuario.negocioId) {
      const existente = await prisma.negocio.findFirst({ select: { id: true } })
      const negocio = existente
        ? existente
        : await prisma.negocio.create({ data: { nombre: 'Negocio Principal' }, select: { id: true } })
      await prisma.usuario.update({ where: { id: usuario.id }, data: { negocioId: negocio.id } })
    }
  }
}

module.exports = { asegurarPermisosYAdmin }
