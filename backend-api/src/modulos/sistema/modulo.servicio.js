const { prisma } = require('../../infraestructura/bd')

const MODULOS_DISPONIBLES = [
  { id: 'ventas', nombre: 'Punto de Venta', descripcion: 'Facturación y caja' },
  { id: 'inventario', nombre: 'Inventario y Productos', descripcion: 'Gestión de productos y stock' },
  { id: 'clientes', nombre: 'Clientes', descripcion: 'Directorio de clientes' },
  { id: 'finanzas', nombre: 'Finanzas', descripcion: 'Gastos, deudas y reportes' },
  { id: 'ropa', nombre: 'Tienda de Ropa', descripcion: 'Gestión de tallas, colores y colecciones' },
  { id: 'alimentos', nombre: 'Alimentos y Perecederos', descripcion: 'Control de vencimientos y lotes' },
  { id: 'servicios', nombre: 'Servicios Profesionales', descripcion: 'Citas, responsables y duración' },
  { id: 'farmacia', nombre: 'Farmacia y Droguería', descripcion: 'Control de medicamentos, laboratorios y recetas' },
  { id: 'papeleria', nombre: 'Papelería y Miscelánea', descripcion: 'Gestión de útiles, tipos de papel y dimensiones' },
  { id: 'restaurante', nombre: 'Restaurante y Bar', descripcion: 'Menú, ingredientes, preparación y dietas' }
]

async function inicializarModulos() {
  // Asegurar que los módulos base existan en la BD
  for (const mod of MODULOS_DISPONIBLES) {
    const existe = await prisma.modulo.findUnique({ where: { id: mod.id } })
    if (!existe) {
      await prisma.modulo.create({
        data: {
          id: mod.id,
          nombre: mod.nombre,
          descripcion: mod.descripcion,
          activo: false
        }
      })
    }
  }
}

async function ensureNegocioModulos(negocioId) {
  if (!Number.isFinite(negocioId)) return
  const negocio = await prisma.negocio.findUnique({ where: { id: negocioId }, select: { id: true } })
  if (!negocio) throw new Error('Negocio no encontrado')

  const modulos = await prisma.modulo.findMany({ select: { id: true } })
  if (!modulos.length) return

  await prisma.negocioModulo.createMany({
    data: modulos.map(m => ({ negocioId, moduloId: m.id, activo: false })),
    skipDuplicates: true
  })
}

async function listarCatalogoModulos() {
  await inicializarModulos()
  return prisma.modulo.findMany({ orderBy: { nombre: 'asc' } })
}

async function listarModulos(negocioId) {
  await inicializarModulos()
  const negocioIdNum = Number(negocioId)
  if (!Number.isFinite(negocioIdNum)) {
    return prisma.modulo.findMany({ orderBy: { nombre: 'asc' } })
  }

  await ensureNegocioModulos(negocioIdNum)

  const filas = await prisma.negocioModulo.findMany({
    where: { negocioId: negocioIdNum },
    include: { modulo: true },
    orderBy: { moduloId: 'asc' }
  })

  return filas
    .map(f => ({
      ...f.modulo,
      activo: f.activo
    }))
    .sort((a, b) => String(a.nombre).localeCompare(String(b.nombre)))
}

async function toggleModulo(negocioId, id, activo) {
  await inicializarModulos()
  const negocioIdNum = Number(negocioId)
  if (!Number.isFinite(negocioIdNum)) {
    return prisma.modulo.update({
      where: { id },
      data: { activo: Boolean(activo) }
    })
  }

  await ensureNegocioModulos(negocioIdNum)
  const actualizado = await prisma.negocioModulo.update({
    where: { negocioId_moduloId: { negocioId: negocioIdNum, moduloId: id } },
    data: { activo: Boolean(activo) }
  })

  const modulo = await prisma.modulo.findUnique({ where: { id } })
  if (!modulo) throw new Error('Módulo no encontrado')
  return { ...modulo, activo: actualizado.activo }
}

async function actualizarConfig(id, config) {
  return prisma.modulo.update({
    where: { id },
    data: { config }
  })
}

module.exports = {
  listarCatalogoModulos,
  listarModulos,
  toggleModulo,
  actualizarConfig
}
