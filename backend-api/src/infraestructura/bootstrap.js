const { prisma } = require('./bd')
const { ADMIN_CORREO, ADMIN_PASSWORD } = require('../configuracion/entorno')
const bcrypt = require('bcryptjs')

async function asegurarPermisosYAdmin() {
  const permisosDefinidos = [
    { clave: 'GESTION_USUARIOS', descripcion: 'Gestión completa de usuarios (crear, editar, eliminar)' },
    { clave: 'CREAR_ROL', descripcion: 'Capacidad para crear nuevos roles en el sistema' },
    { clave: 'EDITAR_ROL', descripcion: 'Capacidad para modificar roles existentes y sus permisos' },
    { clave: 'ASIGNAR_PERMISOS', descripcion: 'Capacidad para asignar permisos específicos a usuarios' },
    { clave: 'VENDER', descripcion: 'Acceso al módulo de punto de venta para realizar ventas' },
    { clave: 'GESTION_INVENTARIO', descripcion: 'Control de stock, productos y categorías' },
    { clave: 'GESTION_CLIENTES', descripcion: 'Administración de la base de datos de clientes' },
    { clave: 'VER_REPORTES', descripcion: 'Acceso a reportes de ventas y estadísticas' },
    { clave: 'GESTION_FINANZAS', descripcion: 'Acceso a módulos financieros, gastos y deudas' },
    { clave: 'GESTION_MODULOS', descripcion: 'Capacidad para activar/desactivar y configurar módulos del sistema' },
    { clave: 'ADMIN', descripcion: 'Acceso total al sistema sin restricciones' }
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
  const ya = new Set(existentes.map(rp => `${rp.rolId}-${rp.permisoId}`))
  for (const p of permisos) {
    const k = `${adminRol.id}-${p.id}`
    if (!ya.has(k)) {
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
  }
}

module.exports = { asegurarPermisosYAdmin }
