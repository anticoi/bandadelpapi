const { Pool } = require('pg');

let pool = null;
function getPool() {
    if (!pool) {
        const cs = process.env.POSTGRES_URL || process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL;
        if (!cs) return null;
        pool = new Pool({ connectionString: cs, ssl: { rejectUnauthorized: false }, max: 3, idleTimeoutMillis: 10000 });
    }
    return pool;
}

async function ensureTable() {
    const p = getPool();
    if (!p) return false;
    try {
        await p.query(`
            CREATE TABLE IF NOT EXISTS bdp_photos (
                id SERIAL PRIMARY KEY,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                title TEXT NOT NULL,
                description TEXT,
                filename TEXT NOT NULL,
                orden INTEGER DEFAULT 0,
                publicado BOOLEAN DEFAULT true
            )
        `);
        return true;
    } catch (err) { console.error('Error creating photos table:', err.message); return false; }
}

function sendJson(res, code, data) { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); }

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

    const url = new URL(req.url, 'http://localhost');
    const password = url.searchParams.get('password') || (req.headers.authorization || '').replace('Bearer ', '');
    const adminPassword = process.env.ADMIN_PASSWORD || 'labandadelpapi2025';
    const id = url.searchParams.get('id');

    await ensureTable();
    const p = getPool();
    if (!p) { sendJson(res, 500, { error: 'Base de datos no configurada' }); return; }

    // GET: listar fotos (publico solo publicadas, admin todas)
    if (req.method === 'GET') {
        try {
            const isAdmin = password === adminPassword;
            const q = isAdmin
                ? 'SELECT id, title, description, filename, orden, publicado FROM bdp_photos ORDER BY orden ASC, id DESC'
                : 'SELECT id, title, description, filename FROM bdp_photos WHERE publicado = true ORDER BY orden ASC, id DESC';
            const result = await p.query(q);
            sendJson(res, 200, { count: result.rows.length, photos: result.rows });
        } catch (err) { sendJson(res, 500, { error: err.message }); }
        return;
    }

    // A partir de aqui requiere auth
    if (password !== adminPassword) { sendJson(res, 401, { error: 'No autorizado' }); return; }

    // POST: agregar foto
    if (req.method === 'POST') {
        const buffers = [];
        for await (const chunk of req) buffers.push(chunk);
        let payload;
        try { payload = JSON.parse(Buffer.concat(buffers).toString()); }
        catch (e) { sendJson(res, 400, { error: 'Body invalido' }); return; }
        const { title, description, filename, orden, publicado } = payload;
        if (!title || !filename) { sendJson(res, 400, { error: 'title y filename son requeridos' }); return; }
        try {
            const result = await p.query(
                'INSERT INTO bdp_photos (title, description, filename, orden, publicado) VALUES ($1, $2, $3, $4, $5) RETURNING id',
                [title, description || '', filename, orden || 0, publicado !== false]
            );
            sendJson(res, 200, { ok: true, id: result.rows[0].id });
        } catch (err) { sendJson(res, 500, { error: err.message }); }
        return;
    }

    // PUT: actualizar foto
    if (req.method === 'PUT' && id) {
        const buffers = [];
        for await (const chunk of req) buffers.push(chunk);
        let payload;
        try { payload = JSON.parse(Buffer.concat(buffers).toString()); }
        catch (e) { sendJson(res, 400, { error: 'Body invalido' }); return; }
        const { title, description, filename, orden, publicado } = payload;
        try {
            await p.query(
                'UPDATE bdp_photos SET title=$1, description=$2, filename=$3, orden=$4, publicado=$5 WHERE id=$6',
                [title, description || '', filename, orden || 0, publicado !== false, id]
            );
            sendJson(res, 200, { ok: true });
        } catch (err) { sendJson(res, 500, { error: err.message }); }
        return;
    }

    // DELETE: eliminar foto
    if (req.method === 'DELETE' && id) {
        try {
            await p.query('DELETE FROM bdp_photos WHERE id = $1', [id]);
            sendJson(res, 200, { ok: true });
        } catch (err) { sendJson(res, 500, { error: err.message }); }
        return;
    }

    sendJson(res, 405, { error: 'Metodo no permitido' });
};
