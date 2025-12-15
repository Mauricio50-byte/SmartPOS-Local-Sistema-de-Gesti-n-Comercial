const os = require('os')

function obtenerIpLocal() {
    const interfaces = os.networkInterfaces()
    let ipCandidata = '127.0.0.1';

    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            if (iface.family === 'IPv4' && !iface.internal) {
                // Si encontramos una 192.168.x.x, es casi seguro la buena (WiFi/LAN Hogar)
                if (iface.address.startsWith('192.168.')) {
                    return iface.address;
                }
                // Si no, guardamos la primera que encontremos como backup (podría ser 172.x o 10.x)
                if (ipCandidata === '127.0.0.1') {
                    ipCandidata = iface.address;
                }
            }
        }
    }
    return ipCandidata;
}

async function obtenerDatosConexion(req, reply) {
    // Asegurarnos de que tenemos el usuario solicitante (Admin)
    const usuario = req.user

    // Generar token que dura 24 horas con la misma info del usuario
    // Esto permitirá que quien escanee "sea" este usuario por 24h.
    // Idealmente, en el futuro, se podría seleccionar "Para qué usuario es el token".
    const payload = {
        id: usuario.id,
        roles: usuario.roles,
        permisos: usuario.permisos,
        nombre: usuario.nombre,
        es_conexion_qr: true,
        fecha: new Date().toISOString()
    }

    const token = req.server.jwt.sign(payload, { expiresIn: '24h' })

    const ip = obtenerIpLocal()

    return {
        ip,
        puerto: 3000,
        url: `http://${ip}:3000?token=${token}`,
        token
    }
}

module.exports = {
    obtenerDatosConexion
}
