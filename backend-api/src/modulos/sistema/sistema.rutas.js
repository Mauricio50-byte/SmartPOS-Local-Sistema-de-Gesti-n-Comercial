const { obtenerDatosConexion } = require('./sistema.controlador')

async function registrarRutasSistema(app) {
    app.get('/sistema/conexion-qr', {
        // Proteger esta ruta para que solo el admin pueda generar el QR
        preHandler: app.requierePermiso('ADMIN')
    }, obtenerDatosConexion)
}

module.exports = {
    registrarRutasSistema
}
