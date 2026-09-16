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
            CREATE TABLE IF NOT EXISTS bdp_config (
                key TEXT PRIMARY KEY,
                value TEXT,
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);
        // Valores por defecto
        await p.query(`INSERT INTO bdp_config (key, value) VALUES
            ('whatsapp_number', '56994775389'),
            ('whatsapp_display', '+56 9 9477 5389'),
            ('contact_email', 'contacto@labandadelpapi.cl'),
            ('instagram_url', 'https://www.instagram.com/labandadelpapioficial/'),
            ('tiktok_url', 'https://www.tiktok.com/@la.banda.del.papi'),
            ('youtube_url', 'https://www.youtube.com/@LaBandaDelPapi'),
            ('spotify_artist_url', 'https://open.spotify.com/intl-es/artist/75UgWA8c7eUEmUyWMikOXK')
            ON CONFLICT (key) DO NOTHING
        `);
        return true;
    } catch (err) { console.error('Error creating config table:', err.message); return false; }
}

function sendJson(res, code, data) { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); }

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

    const url = new URL(req.url, 'http://localhost');
    const password = url.searchParams.get('password') || (req.headers.authorization || '').replace('Bearer ', '');
    const adminPassword = process.env.ADMIN_PASSWORD || 'labandadelpapi2025';

    await ensureTable();
    const p = getPool();
    if (!p) { sendJson(res, 500, { error: 'Base de datos no configurada' }); return; }

    // GET: obtener config (publico)
    if (req.method === 'GET') {
        try {
            const result = await p.query('SELECT key, value FROM bdp_config');
            const config = {};
            result.rows.forEach(r => { config[r.key] = r.value; });
            sendJson(res, 200, { config });
        } catch (err) { sendJson(res, 500, { error: err.message }); }
        return;
    }

    // PUT: actualizar config (requiere auth)
    if (req.method === 'PUT') {
        if (password !== adminPassword) { sendJson(res, 401, { error: 'No autorizado' }); return; }
        const buffers = [];
        for await (const chunk of req) buffers.push(chunk);
        let payload;
        try { payload = JSON.parse(Buffer.concat(buffers).toString()); }
        catch (e) { sendJson(res, 400, { error: 'Body invalido' }); return; }

        try {
            for (const [key, value] of Object.entries(payload)) {
                await p.query(
                    'INSERT INTO bdp_config (key, value, updated_at) VALUES ($1, $2, NOW()) ON CONFLICT (key) DO UPDATE SET value=$2, updated_at=NOW()',
                    [key, value]
                );
            }
            sendJson(res, 200, { ok: true });
        } catch (err) { sendJson(res, 500, { error: err.message }); }
        return;
    }

    sendJson(res, 405, { error: 'Metodo no permitido' });
};
