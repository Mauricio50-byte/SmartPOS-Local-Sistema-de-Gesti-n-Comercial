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

async function listarModulos() {
  await inicializarModulos()
  return prisma.modulo.findMany({ orderBy: { nombre: 'asc' } })
}

async function toggleModulo(id, activo) {
  return prisma.modulo.update({
    where: { id },
    data: { activo }
  })
}

async function actualizarConfig(id, config) {
  return prisma.modulo.update({
    where: { id },
    data: { config }
  })
}

module.exports = {
  listarModulos,
  toggleModulo,
  actualizarConfig
}
