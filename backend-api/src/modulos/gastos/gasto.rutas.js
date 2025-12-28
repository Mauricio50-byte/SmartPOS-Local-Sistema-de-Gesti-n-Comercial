const gastoServicio = require('./gasto.servicio')

async function registrarRutasGasto(app) {
    // Listar gastos
    app.get('/gastos', { preHandler: [app.autenticar, app.requiereModulo('finanzas')] }, async (request, reply) => {
        try {
            const gastos = await gastoServicio.listarGastos(request.query)
            return gastos
        } catch (error) {
            reply.code(500).send({ error: error.message })
        }
    })

    // Obtener resumen financiero
    app.get('/gastos/resumen', { preHandler: [app.autenticar, app.requiereModulo('finanzas')] }, async (request, reply) => {
        try {
            const resumen = await gastoServicio.obtenerResumenFinanzas()
            return resumen
        } catch (error) {
            reply.code(500).send({ error: error.message })
        }
    })

    // Obtener gasto por ID
    app.get('/gastos/:id', { preHandler: [app.autenticar, app.requiereModulo('finanzas')] }, async (request, reply) => {
        try {
            const gasto = await gastoServicio.obtenerGastoPorId(request.params.id)
            if (!gasto) return reply.code(404).send({ error: 'Gasto no encontrado' })
            return gasto
        } catch (error) {
            reply.code(500).send({ error: error.message })
        }
    })

    // Crear nuevo gasto
    app.post('/gastos', { preHandler: [app.autenticar, app.requiereModulo('finanzas')] }, async (request, reply) => {
        try {
            const gasto = await gastoServicio.crearGasto(request.body)
            return gasto
        } catch (error) {
            reply.code(400).send({ error: error.message })
        }
    })

    // Registrar pago a gasto
    app.post('/gastos/:id/pagos', { preHandler: [app.autenticar, app.requiereModulo('finanzas')] }, async (request, reply) => {
        try {
            const { id } = request.params
            const datos = { ...request.body, gastoId: id, usuarioId: request.user?.id }
            const resultado = await gastoServicio.registrarPagoGasto(datos)
            return resultado
        } catch (error) {
            reply.code(400).send({ error: error.message })
        }
    })
}

module.exports = { registrarRutasGasto }
