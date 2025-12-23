const { prisma } = require('../../infraestructura/bd')

const MODULOS_DISPONIBLES = [
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

async function listarCatalogoModulos() {
  await inicializarModulos()
  return prisma.modulo.findMany({ orderBy: { nombre: 'asc' } })
}

async function listarModulos(negocioId) {
  await inicializarModulos()
  if (!negocioId) throw new Error('Negocio requerido')

  const negocio = await prisma.negocio.findUnique({ where: { id: negocioId } })
  if (!negocio) throw new Error('Negocio no encontrado')

  const modulos = await prisma.modulo.findMany({ orderBy: { nombre: 'asc' } })
  const estados = await prisma.negocioModulo.findMany({ where: { negocioId } })
  const estadoMap = new Map(estados.map(e => [e.moduloId, e.activo]))
  return modulos.map(m => ({ ...m, activo: estadoMap.get(m.id) ?? false }))
}

async function toggleModulo(negocioId, id, activo) {
  await inicializarModulos()
  if (!negocioId) throw new Error('Negocio requerido')

  const negocio = await prisma.negocio.findUnique({ where: { id: negocioId } })
  if (!negocio) throw new Error('Negocio no encontrado')

  const existente = await prisma.negocioModulo.findUnique({
    where: { negocioId_moduloId: { negocioId, moduloId: id } }
  })
  const yaActivo = existente?.activo === true

  if (activo && !yaActivo) {
    const activos = await prisma.negocioModulo.count({ where: { negocioId, activo: true } })
    if (activos >= negocio.planMaxModulos) {
      throw new Error(`Tu plan incluye ${negocio.planMaxModulos} módulos. Para habilitar más, contacta al proveedor.`)
    }
  }

  await prisma.negocioModulo.upsert({
    where: { negocioId_moduloId: { negocioId, moduloId: id } },
    update: { activo: !!activo },
    create: { negocioId, moduloId: id, activo: !!activo }
  })

  const modulo = await prisma.modulo.findUnique({ where: { id } })
  return { ...modulo, activo: !!activo }
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
