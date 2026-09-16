const { Pool } = require('pg');

let pool = null;

function getPool() {
    if (!pool) {
        const connectionString = process.env.POSTGRES_URL || process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL;
        if (!connectionString) return null;
        pool = new Pool({
            connectionString,
            ssl: { rejectUnauthorized: false },
            max: 3,
            idleTimeoutMillis: 10000
        });
    }
    return pool;
}

async function ensureReservasTable() {
    const p = getPool();
    if (!p) return false;
    try {
        await p.query(`
            CREATE TABLE IF NOT EXISTS bdp_reservas (
                id SERIAL PRIMARY KEY,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                nombre TEXT NOT NULL,
                email TEXT,
                telefono TEXT,
                fecha_evento DATE,
                tipo_evento TEXT,
                lugar TEXT,
                mensaje TEXT,
                estado TEXT DEFAULT 'pendiente'
            )
        `);
        return true;
    } catch (err) {
        console.error('Error creating reservas table:', err.message);
        return false;
    }
}

function sendJson(res, statusCode, data) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const url = new URL(req.url, 'http://localhost');
    const password = url.searchParams.get('password') || (req.headers.authorization || '').replace('Bearer ', '');
    const adminPassword = process.env.ADMIN_PASSWORD || 'labandadelpapi2025';

    await ensureReservasTable();
    const p = getPool();

    if (!p) {
        sendJson(res, 500, { error: 'Base de datos no configurada' });
        return;
    }

    // POST: crear reserva (público)
    if (req.method === 'POST') {
        const buffers = [];
        for await (const chunk of req) buffers.push(chunk);
        let payload;
        try {
            payload = JSON.parse(Buffer.concat(buffers).toString());
        } catch (e) {
            sendJson(res, 400, { error: 'Body inválido' });
            return;
        }

        const { nombre, email, telefono, fecha_evento, tipo_evento, lugar, mensaje } = payload;
        if (!nombre || !mensaje) {
            sendJson(res, 400, { error: 'nombre y mensaje son requeridos' });
            return;
        }

        try {
            const result = await p.query(
                'INSERT INTO bdp_reservas (nombre, email, telefono, fecha_evento, tipo_evento, lugar, mensaje) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
                [nombre, email || '', telefono || '', fecha_evento || null, tipo_evento || '', lugar || '', mensaje]
            );
            sendJson(res, 200, { ok: true, id: result.rows[0].id });
        } catch (err) {
            sendJson(res, 500, { error: err.message });
        }
        return;
    }

    // A partir de aquí requiere auth (GET, DELETE)
    if (password !== adminPassword) {
        sendJson(res, 401, { error: 'No autorizado' });
        return;
    }

    // GET: listar reservas
    if (req.method === 'GET') {
        try {
            const result = await p.query('SELECT id, created_at, nombre, email, telefono, fecha_evento, tipo_evento, lugar, mensaje, estado FROM bdp_reservas ORDER BY created_at DESC LIMIT 200');
            sendJson(res, 200, { count: result.rows.length, reservas: result.rows });
        } catch (err) {
            sendJson(res, 500, { error: err.message });
        }
        return;
    }

    // DELETE: eliminar reserva
    if (req.method === 'DELETE') {
        const id = url.searchParams.get('id');
        if (!id) {
            sendJson(res, 400, { error: 'id requerido' });
            return;
        }
        try {
            await p.query('DELETE FROM bdp_reservas WHERE id = $1', [id]);
            sendJson(res, 200, { ok: true });
        } catch (err) {
            sendJson(res, 500, { error: err.message });
        }
        return;
    }

    // PATCH: actualizar estado
    if (req.method === 'PATCH') {
        const id = url.searchParams.get('id');
        const estado = url.searchParams.get('estado');
        if (!id || !estado) {
            sendJson(res, 400, { error: 'id y estado requeridos' });
            return;
        }
        try {
            await p.query('UPDATE bdp_reservas SET estado = $1 WHERE id = $2', [estado, id]);
            sendJson(res, 200, { ok: true });
        } catch (err) {
            sendJson(res, 500, { error: err.message });
        }
        return;
    }

    sendJson(res, 405, { error: 'Método no permitido' });
};
