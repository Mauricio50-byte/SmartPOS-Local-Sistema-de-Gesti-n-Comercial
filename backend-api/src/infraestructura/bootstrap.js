const { prisma } = require('./bd')
const { ADMIN_CORREO, ADMIN_PASSWORD } = require('../configuracion/entorno')
const bcrypt = require('bcryptjs')

async function asegurarPermisosYAdmin() {
  const claves = [
    'GESTION_USUARIOS',
    'CREAR_ROL',
    'EDITAR_ROL',
    'ASIGNAR_PERMISOS',
    'VENDER',
    'GESTION_INVENTARIO',
    'GESTION_CLIENTES',
    'VER_REPORTES',
    'GESTION_FINANZAS'
  ]

  for (const clave of claves) {
    await prisma.permiso.upsert({
      where: { clave },
      update: {},
      create: { clave }
    })
  }

  const adminRol = await prisma.rol.upsert({
    where: { nombre: 'ADMIN' },
    update: {},
    create: { nombre: 'ADMIN' }
  })

  await prisma.rol.upsert({
    where: { nombre: 'TRABAJADOR' },
    update: {},
    create: { nombre: 'TRABAJADOR' }
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
