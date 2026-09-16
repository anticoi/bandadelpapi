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

async function ensureBlogTable() {
    const p = getPool();
    if (!p) return false;
    try {
        await p.query(`
            CREATE TABLE IF NOT EXISTS bdp_blog (
                id SERIAL PRIMARY KEY,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                titulo TEXT NOT NULL,
                resumen TEXT,
                contenido TEXT,
                imagen_url TEXT,
                publicado BOOLEAN DEFAULT true
            )
        `);
        return true;
    } catch (err) {
        console.error('Error creating blog table:', err.message);
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
    const postId = url.searchParams.get('id');

    await ensureBlogTable();
    const p = getPool();

    if (!p) {
        sendJson(res, 500, { error: 'Base de datos no configurada' });
        return;
    }

    // GET: listar posts (público solo publicados, con auth todos)
    if (req.method === 'GET') {
        try {
            const isAdmin = password === adminPassword;
            const query = isAdmin
                ? 'SELECT id, created_at, titulo, resumen, contenido, imagen_url, publicado FROM bdp_blog ORDER BY created_at DESC LIMIT 100'
                : 'SELECT id, created_at, titulo, resumen, contenido, imagen_url FROM bdp_blog WHERE publicado = true ORDER BY created_at DESC LIMIT 50';
            const result = await p.query(query);
            sendJson(res, 200, { count: result.rows.length, posts: result.rows });
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

    // POST: crear/actualizar post
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

        const { titulo, resumen, contenido, imagen_url, publicado } = payload;
        if (!titulo) {
            sendJson(res, 400, { error: 'titulo es requerido' });
            return;
        }

        try {
            if (postId) {
                await p.query(
                    'UPDATE bdp_blog SET titulo=$1, resumen=$2, contenido=$3, imagen_url=$4, publicado=$5 WHERE id=$6',
                    [titulo, resumen || '', contenido || '', imagen_url || '', publicado !== false, postId]
                );
                sendJson(res, 200, { ok: true, id: parseInt(postId) });
            } else {
                const result = await p.query(
                    'INSERT INTO bdp_blog (titulo, resumen, contenido, imagen_url, publicado) VALUES ($1, $2, $3, $4, $5) RETURNING id',
                    [titulo, resumen || '', contenido || '', imagen_url || '', publicado !== false]
                );
                sendJson(res, 200, { ok: true, id: result.rows[0].id });
            }
        } catch (err) {
            sendJson(res, 500, { error: err.message });
        }
        return;
    }

    // DELETE: eliminar post
    if (req.method === 'DELETE') {
        if (!postId) {
            sendJson(res, 400, { error: 'id requerido' });
            return;
        }
        try {
            await p.query('DELETE FROM bdp_blog WHERE id = $1', [postId]);
            sendJson(res, 200, { ok: true });
        } catch (err) {
            sendJson(res, 500, { error: err.message });
        }
        return;
    }

    sendJson(res, 405, { error: 'Método no permitido' });
};
