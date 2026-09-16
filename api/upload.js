const { put } = require('@vercel/blob');
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

function sendJson(res, code, data) { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); }

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

    if (req.method !== 'POST') { sendJson(res, 405, { error: 'Metodo no permitido' }); return; }

    // Verificar auth
    const url = new URL(req.url, 'http://localhost');
    const password = url.searchParams.get('password') || (req.headers.authorization || '').replace('Bearer ', '');
    const adminPassword = process.env.ADMIN_PASSWORD || 'labandadelpapi2025';
    if (password !== adminPassword) { sendJson(res, 401, { error: 'No autorizado' }); return; }

    // Verificar que BLOB_READ_WRITE_TOKEN este configurado
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
        sendJson(res, 500, { error: 'BLOB_READ_WRITE_TOKEN no configurado. Habilita Vercel Blob en el proyecto.' });
        return;
    }

    // Leer el body completo (multipart/form-data crudo)
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('multipart/form-data')) {
        sendJson(res, 400, { error: 'Se requiere multipart/form-data' });
        return;
    }

    try {
        // Parsear multipart manualmente
        const buffers = [];
        for await (const chunk of req) buffers.push(chunk);
        const raw = Buffer.concat(buffers);

        const boundary = contentType.split('boundary=')[1];
        if (!boundary) { sendJson(res, 400, { error: 'Boundary no encontrado' }); return; }

        const parts = raw.split(Buffer.from('--' + boundary));
        let fileBuffer = null;
        let filename = 'foto.jpg';
        let title = '';
        let description = '';
        let orden = 0;

        for (const part of parts) {
            if (part.length < 10) continue;
            // Remover CRLF iniciales
            let p = part;
            if (p[0] === 0x0d && p[1] === 0x0a) p = p.slice(2);

            const headerEnd = p.indexOf(Buffer.from('\r\n\r\n'));
            if (headerEnd < 0) continue;

            const headerStr = p.slice(0, headerEnd).toString('utf8');
            const bodyBuf = p.slice(headerEnd + 4, p.length - 2); // remover \r\n final

            if (headerStr.includes('name="file"')) {
                fileBuffer = bodyBuf;
                const match = headerStr.match(/filename="([^"]+)"/);
                if (match) filename = match[1];
            } else if (headerStr.includes('name="title"')) {
                title = bodyBuf.toString('utf8');
            } else if (headerStr.includes('name="description"')) {
                description = bodyBuf.toString('utf8');
            } else if (headerStr.includes('name="orden"')) {
                orden = parseInt(bodyBuf.toString('utf8')) || 0;
            }
        }

        if (!fileBuffer) { sendJson(res, 400, { error: 'No se encontro el archivo' }); return; }
        if (!title) title = filename.replace(/\.[^.]+$/, '');

        // Generar nombre unico para el blob
        const ext = filename.match(/\.[^.]+$/)?.[0] || '.jpg';
        const safeName = 'bdp-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + ext;

        // Subir a Vercel Blob
        const blob = await put(safeName, fileBuffer, {
            access: 'public',
            contentType: req.headers['content-type'] ? undefined : 'image/jpeg'
        });

        // Guardar en la base de datos
        const p = getPool();
        if (p) {
            try {
                await p.query(
                    'INSERT INTO bdp_photos (title, description, filename, orden, publicado) VALUES ($1, $2, $3, $4, true)',
                    [title, description, blob.url, orden]
                );
            } catch (err) { console.error('Error guardando en DB:', err.message); }
        }

        sendJson(res, 200, { ok: true, url: blob.url, filename: blob.url });
    } catch (err) {
        console.error('Error upload:', err);
        sendJson(res, 500, { error: err.message });
    }
};
