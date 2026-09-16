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

async function ensureTestimoniosTable() {
    const p = getPool();
    if (!p) return false;
    try {
        await p.query(`
            CREATE TABLE IF NOT EXISTS bdp_testimonios (
                id SERIAL PRIMARY KEY,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                nombre TEXT NOT NULL,
                evento TEXT,
                calificacion INTEGER DEFAULT 5,
                mensaje TEXT NOT NULL,
                aprobado BOOLEAN DEFAULT false
            )
        `);
        return true;
    } catch (err) {
        console.error('Error creating testimonios table:', err.message);
        return false;
    }
}

function sendJson(res, statusCode, data) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const url = new URL(req.url, 'http://localhost');
    const password = url.searchParams.get('password') || (req.headers.authorization || '').replace('Bearer ', '');
    const adminPassword = process.env.ADMIN_PASSWORD || 'labandadelpapi2025';
    const id = url.searchParams.get('id');

    await ensureTestimoniosTable();
    const p = getPool();

    if (!p) {
        sendJson(res, 500, { error: 'Base de datos no configurada' });
        return;
    }

    // GET: listar (público solo aprobados, admin todos)
    if (req.method === 'GET') {
        try {
            const isAdmin = password === adminPassword;
            const query = isAdmin
                ? 'SELECT id, created_at, nombre, evento, calificacion, mensaje, aprobado FROM bdp_testimonios ORDER BY created_at DESC LIMIT 100'
                : 'SELECT id, nombre, evento, calificacion, mensaje FROM bdp_testimonios WHERE aprobado = true ORDER BY created_at DESC LIMIT 20';
            const result = await p.query(query);
            sendJson(res, 200, { count: result.rows.length, testimonios: result.rows });
        } catch (err) {
            sendJson(res, 500, { error: err.message });
        }
        return;
    }

    // POST: crear testimonio (público)
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

        const { nombre, evento, calificacion, mensaje } = payload;
        if (!nombre || !mensaje) {
            sendJson(res, 400, { error: 'nombre y mensaje son requeridos' });
            return;
        }

        try {
            const result = await p.query(
                'INSERT INTO bdp_testimonios (nombre, evento, calificacion, mensaje) VALUES ($1, $2, $3, $4) RETURNING id',
                [nombre, evento || '', Math.min(5, Math.max(1, calificacion || 5)), mensaje]
            );
            sendJson(res, 200, { ok: true, id: result.rows[0].id });
        } catch (err) {
            sendJson(res, 500, { error: err.message });
        }
        return;
    }

    // A partir de aquí requiere auth
    if (password !== adminPassword) {
        sendJson(res, 401, { error: 'No autorizado' });
        return;
    }

    // PATCH: aprobar/desaprobar
    if (req.method === 'PATCH') {
        if (!id) {
            sendJson(res, 400, { error: 'id requerido' });
            return;
        }
        const aprobado = url.searchParams.get('aprobado') === 'true';
        try {
            await p.query('UPDATE bdp_testimonios SET aprobado = $1 WHERE id = $2', [aprobado, id]);
            sendJson(res, 200, { ok: true });
        } catch (err) {
            sendJson(res, 500, { error: err.message });
        }
        return;
    }

    // DELETE: eliminar
    if (req.method === 'DELETE') {
        if (!id) {
            sendJson(res, 400, { error: 'id requerido' });
            return;
        }
        try {
            await p.query('DELETE FROM bdp_testimonios WHERE id = $1', [id]);
            sendJson(res, 200, { ok: true });
        } catch (err) {
            sendJson(res, 500, { error: err.message });
        }
        return;
    }

    sendJson(res, 405, { error: 'Método no permitido' });
};
