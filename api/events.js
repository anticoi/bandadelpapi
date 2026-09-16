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

async function ensureEventTable() {
    const p = getPool();
    if (!p) return false;
    try {
        await p.query(`
            CREATE TABLE IF NOT EXISTS events (
                id SERIAL PRIMARY KEY,
                event_date DATE NOT NULL UNIQUE,
                title TEXT NOT NULL,
                location TEXT,
                type TEXT DEFAULT 'private',
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);
        return true;
    } catch (err) {
        console.error('Error creating events table:', err.message);
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

    await ensureEventTable();
    const p = getPool();

    if (!p) {
        sendJson(res, 500, { error: 'Base de datos no configurada' });
        return;
    }

    // GET: listar eventos (público, sin auth)
    if (req.method === 'GET') {
        try {
            const result = await p.query('SELECT id, event_date, title, location, type FROM events ORDER BY event_date ASC');
            const events = {};
            result.rows.forEach(r => {
                const d = r.event_date;
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                events[key] = { id: r.id, title: r.title, location: r.location, type: r.type };
            });
            sendJson(res, 200, { events });
        } catch (err) {
            sendJson(res, 500, { error: err.message });
        }
        return;
    }

    // A partir de aquí, requiere auth (POST, DELETE)
    if (password !== adminPassword) {
        sendJson(res, 401, { error: 'No autorizado' });
        return;
    }

    // POST: agregar evento
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

        const { date, title, location, type } = payload;
        if (!date || !title) {
            sendJson(res, 400, { error: 'date y title son requeridos' });
            return;
        }

        try {
            await p.query(
                'INSERT INTO events (event_date, title, location, type) VALUES ($1, $2, $3, $4) ON CONFLICT (event_date) DO UPDATE SET title=$2, location=$3, type=$4',
                [date, title, location || '', type || 'private']
            );
            sendJson(res, 200, { ok: true });
        } catch (err) {
            sendJson(res, 500, { error: err.message });
        }
        return;
    }

    // DELETE: eliminar evento
    if (req.method === 'DELETE') {
        const id = url.searchParams.get('id');
        if (!id) {
            sendJson(res, 400, { error: 'id requerido' });
            return;
        }
        try {
            await p.query('DELETE FROM events WHERE id = $1', [id]);
            sendJson(res, 200, { ok: true });
        } catch (err) {
            sendJson(res, 500, { error: err.message });
        }
        return;
    }

    sendJson(res, 405, { error: 'Método no permitido' });
};
