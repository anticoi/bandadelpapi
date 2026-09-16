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

async function ensureNewsletterTable() {
    const p = getPool();
    if (!p) return false;
    try {
        await p.query(`
            CREATE TABLE IF NOT EXISTS bdp_newsletter (
                id SERIAL PRIMARY KEY,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                email TEXT NOT NULL UNIQUE,
                activo BOOLEAN DEFAULT true
            )
        `);
        return true;
    } catch (err) {
        console.error('Error creating newsletter table:', err.message);
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

    await ensureNewsletterTable();
    const p = getPool();

    if (!p) {
        sendJson(res, 500, { error: 'Base de datos no configurada' });
        return;
    }

    // POST: suscribir (público)
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

        const { email } = payload;
        if (!email || !email.includes('@')) {
            sendJson(res, 400, { error: 'email válido es requerido' });
            return;
        }

        try {
            await p.query(
                'INSERT INTO bdp_newsletter (email) VALUES ($1) ON CONFLICT (email) DO UPDATE SET activo = true',
                [email]
            );
            sendJson(res, 200, { ok: true });
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

    // GET: listar suscriptores
    if (req.method === 'GET') {
        try {
            const result = await p.query('SELECT id, created_at, email, activo FROM bdp_newsletter ORDER BY created_at DESC');
            sendJson(res, 200, { count: result.rows.length, suscriptores: result.rows });
        } catch (err) {
            sendJson(res, 500, { error: err.message });
        }
        return;
    }

    // DELETE: eliminar suscriptor
    if (req.method === 'DELETE') {
        const id = url.searchParams.get('id');
        if (!id) {
            sendJson(res, 400, { error: 'id requerido' });
            return;
        }
        try {
            await p.query('DELETE FROM bdp_newsletter WHERE id = $1', [id]);
            sendJson(res, 200, { ok: true });
        } catch (err) {
            sendJson(res, 500, { error: err.message });
        }
        return;
    }

    sendJson(res, 405, { error: 'Método no permitido' });
};
