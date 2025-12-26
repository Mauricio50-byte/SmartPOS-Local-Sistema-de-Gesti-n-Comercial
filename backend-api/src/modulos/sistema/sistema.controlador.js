const os = require('os')
const { obtenerUsuarioPorId } = require('../usuarios/usuario.servicio')

function obtenerIpsLocales() {
    const interfaces = os.networkInterfaces()
    const ips = [];

    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            if (iface.family === 'IPv4' && !iface.internal) {
                ips.push({
                    nombre: name,
                    ip: iface.address
                });
            }
        }
    }
    
    // Ordenar: preferir 192.168.x.x
    return ips.sort((a, b) => {
        const aEs192 = a.ip.startsWith('192.168.');
        const bEs192 = b.ip.startsWith('192.168.');
        if (aEs192 && !bEs192) return -1;
        if (!aEs192 && bEs192) return 1;
        return 0;
    });
}

async function obtenerDatosConexion(req, reply) {
    // Asegurarnos de que tenemos el usuario solicitante (Admin)
    let usuario = req.user
    const { usuarioId } = req.query

    // Si se especifica un ID de usuario y el solicitante es Admin, generamos token para ese usuario
    if (usuarioId && (usuario.roles.includes('ADMIN') || usuario.adminPorDefecto)) {
        const usuarioObjetivo = await obtenerUsuarioPorId(parseInt(usuarioId))
        if (usuarioObjetivo) {
            usuario = usuarioObjetivo
        }
    }

    // Generar token que dura 24 horas con la misma info del usuario
    // Esto permitirá que quien escanee "sea" este usuario por 24h.
    const payload = {
        id: usuario.id,
        roles: usuario.roles,
        permisos: usuario.permisos,
        nombre: usuario.nombre,
        correo: usuario.correo,
        negocioId: usuario.negocioId,
        modulos: usuario.modulos,
        adminPorDefecto: usuario.adminPorDefecto,
        es_conexion_qr: true,
        fecha: new Date().toISOString()
    }

    const token = req.server.jwt.sign(payload, { expiresIn: '24h' })

    const ips = obtenerIpsLocales()
    // IP principal (la primera de la lista ordenada)
    const ipPrincipal = ips.length > 0 ? ips[0].ip : '127.0.0.1';

    return {
        ip: ipPrincipal,
        ips: ips, // Enviamos todas las IPs
        puerto: 3000,
        url: `http://${ipPrincipal}:3000?token=${token}`,
        token
    }
}

module.exports = {
    obtenerDatosConexion
}
