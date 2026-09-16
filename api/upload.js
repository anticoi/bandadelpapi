const { put } = require('@vercel/blob');
const { Pool } = require('pg');
const Busboy = require('busboy');

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

    const url = new URL(req.url, 'http://localhost');
    const password = url.searchParams.get('password') || (req.headers.authorization || '').replace('Bearer ', '');
    const adminPassword = process.env.ADMIN_PASSWORD || 'labandadelpapi2025';
    if (password !== adminPassword) { sendJson(res, 401, { error: 'No autorizado' }); return; }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
        sendJson(res, 500, { error: 'BLOB_READ_WRITE_TOKEN no configurado' });
        return;
    }

    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('multipart/form-data')) {
        sendJson(res, 400, { error: 'Se requiere multipart/form-data' });
        return;
    }

    return new Promise((resolve) => {
        const busboy = Busboy({ headers: req.headers });
        const fields = {};
        let fileBuffer = null;
        let fileInfo = null;

        busboy.on('file', (fieldname, file, info) => {
            fileInfo = info;
            const chunks = [];
            file.on('data', (chunk) => chunks.push(chunk));
            file.on('end', () => {
                if (fieldname === 'file') {
                    fileBuffer = Buffer.concat(chunks);
                }
            });
        });

        busboy.on('field', (fieldname, value) => {
            fields[fieldname] = value;
        });

        busboy.on('finish', async () => {
            if (!fileBuffer) {
                sendJson(res, 400, { error: 'No se encontro el archivo' });
                return resolve();
            }

            const title = fields.title || (fileInfo && fileInfo.filename ? fileInfo.filename.replace(/\.[^.]+$/, '') : 'Foto');
            const description = fields.description || '';
            const orden = parseInt(fields.orden) || 0;

            const ext = (fileInfo && fileInfo.filename && fileInfo.filename.match(/\.[^.]+$/)?.[0]) || '.jpg';
            const safeName = 'bdp-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + ext;

            try {
                const blob = await put(safeName, fileBuffer, {
                    access: 'public',
                    addRandomSuffix: false
                });

                const p = getPool();
                if (p) {
                    try {
                        await p.query(
                            'INSERT INTO bdp_photos (title, description, filename, orden, publicado) VALUES ($1, $2, $3, $4, true)',
                            [title, description, blob.url, orden]
                        );
                    } catch (err) { console.error('Error guardando en DB:', err.message); }
                }

                sendJson(res, 200, { ok: true, url: blob.url });
            } catch (err) {
                console.error('Error upload:', err);
                sendJson(res, 500, { error: err.message });
            }
            resolve();
        });

        req.pipe(busboy);
    });
};
