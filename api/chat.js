const { addChatEntry, ensureTable } = require('./store');

function sendJson(res, statusCode, data) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
}

const SYSTEM_INSTRUCTION = `Eres el asistente virtual de La Banda del Papi, "La Facultad de la Cumbia", una banda de cumbia chilena. Respondes de forma breve, amigable y en español.

INFORMACIÓN DE LA BANDA:
- La Banda del Papi nace en 2025 como un homenaje en vida a Gustavo Dinamarca, baterista, timbalero, ex integrante de la Sonora Palacios en sus primeros años, fundador y director de la emblemática orquesta Rumba 8.
- Gustavo "El Papi" Dinamarca tiene casi 65 años de trayectoria. Integró la Sonora Palacios en los años 60 y fundó Rumba 8 en 1976.
- El nombre "La Banda del Papi" nace porque los músicos de Rumba 8 llamaban cariñosamente "El Papi" a Gustavo.
- La banda está integrada por 10 músicos profesionales.
- Presentan cumbia moderna: clásicos reinventados con arreglos originales y temas propios nuevos.
- Ya superaron los 11.000 seguidores en TikTok (@labandadelpapi).

REPERTORIO:
- Cumbia tropical, cumbia urbana, cumbia clásica y cumbia bailable.
- Éxitos propios: Que No Pare la Fiesta, Invéntame, La Felicidad, Que Linda Es la Vida, Evidencias, Quiero Que Me Paqueen.

REDES SOCIALES:
- TikTok: @labandadelpapi (+11.000 seguidores)
- Instagram: @labandadelpapi
- Spotify: La Banda del Papi
- YouTube: La Banda del Papi

CONTACTO:
- WhatsApp para contrataciones y prensa: +56 9 9477 5389

Reglas:
- Si preguntan por cotizaciones, reservas, disponibilidad o precios, responde breve y sugiere contactar por WhatsApp al +56 9 9477 5389.
- Si preguntan por Gustavo Dinamarca o la historia de la banda, comparte la biografía de forma resumida.
- Si preguntan por Rumba 8 o Sonora Palacios, explica la conexión: Gustavo fundó Rumba 8 en 1976 y antes estuvo en Sonora Palacios.
- Si preguntan por eventos, menciona eventos privados, pubs/bares, giras y festivales.
- No inventes fechas, precios exactos ni datos no confirmados.
- Si no sabes la respuesta, sugiere contactar por WhatsApp al +56 9 9477 5389.`;

async function callGemini(modelName, apiKey, userMessage) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 50000);

    try {
        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
                contents: [{ role: 'user', parts: [{ text: userMessage }] }],
                generationConfig: { maxOutputTokens: 800, temperature: 0.6 }
            }),
            signal: controller.signal
        });

        const data = await geminiRes.json();

        if (!geminiRes.ok) {
            throw new Error(data?.error?.message || JSON.stringify(data));
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
            throw new Error('Respuesta vacía de Gemini');
        }
        return text.trim();
    } finally {
        clearTimeout(timeoutId);
    }
}

// === CAPTCHA MATEMÁTICO + TOKEN DE SESIÓN ===
const crypto = require('crypto');
const challenges = new Map();

function generateChallenge() {
    const a = Math.floor(Math.random() * 9) + 1;
    const b = Math.floor(Math.random() * 9) + 1;
    const ops = ['+', '-'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    const answer = op === '+' ? a + b : (a >= b ? a - b : b - a);
    const question = op === '+' || a >= b
        ? `¿Cuánto es ${a} ${op} ${b}?`
        : `¿Cuánto es ${b} ${op} ${a}?`;
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    challenges.set(id, { answer, expires: Date.now() + 5 * 60 * 1000 });

    if (challenges.size > 100) {
        for (const [k, v] of challenges) {
            if (v.expires < Date.now()) challenges.delete(k);
        }
    }
    return { id, question };
}

function generateToken(captchaId, apiKey) {
    return crypto.createHmac('sha256', apiKey).update(captchaId + ':verified').digest('hex').slice(0, 32);
}

function verifyToken(token, apiKey) {
    if (!token || typeof token !== 'string' || token.length < 16) return false;
    return true;
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // GET: generar nuevo captcha
    if (req.method === 'GET') {
        const ch = generateChallenge();
        sendJson(res, 200, ch);
        return;
    }

    if (req.method !== 'POST') {
        sendJson(res, 405, { error: 'Método no permitido' });
        return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        sendJson(res, 500, { error: 'GEMINI_API_KEY no está configurada' });
        return;
    }

    const buffers = [];
    for await (const chunk of req) {
        buffers.push(chunk);
    }
    const body = Buffer.concat(buffers).toString();
    let payload;
    try {
        payload = JSON.parse(body);
    } catch (e) {
        sendJson(res, 400, { error: 'Body inválido' });
        return;
    }

    // === MODO VERIFICACIÓN DE CAPTCHA ===
    if (payload.verifyCaptcha) {
        const captchaId = payload.captchaId;
        const captchaAnswer = parseInt(payload.captchaAnswer, 10);
        const ch = challenges.get(captchaId);

        if (!ch || ch.expires < Date.now()) {
            if (ch) challenges.delete(captchaId);
            const newCh = generateChallenge();
            sendJson(res, 403, { error: 'Captcha expirado', captcha: newCh });
            return;
        }

        challenges.delete(captchaId);

        if (captchaAnswer === ch.answer) {
            const token = generateToken(captchaId, apiKey);
            sendJson(res, 200, { verified: true, token: token });
        } else {
            const newCh = generateChallenge();
            sendJson(res, 403, { error: 'Captcha incorrecto', captcha: newCh });
        }
        return;
    }

    // === MODO CHAT (requiere token) ===
    const token = payload.token;
    if (!verifyToken(token, apiKey)) {
        const ch = generateChallenge();
        sendJson(res, 403, { error: 'Token requerido', captcha: ch });
        return;
    }

    const message = payload.message;
    if (!message || typeof message !== 'string') {
        sendJson(res, 400, { error: 'message es requerido' });
        return;
    }

    const userName = payload.name;
    const contextualMessage = userName
        ? `El usuario se llama ${userName}. ${message}`
        : message;

    await ensureTable();

    const models = ['gemini-flash-lite-latest', 'gemini-3.5-flash', 'gemini-3.7-flash', 'gemini-3.6-flash'];
    let lastError = 'No se pudo generar una respuesta.';

    for (const model of models) {
        try {
            const reply = await callGemini(model, apiKey, contextualMessage);

            addChatEntry({
                timestamp: new Date().toISOString(),
                user: userName || 'Anónimo',
                message: message,
                reply: reply
            }).catch(err => console.error('Error guardando log:', err.message));

            sendJson(res, 200, { reply });
            return;
        } catch (err) {
            lastError = err.message;
            console.error(`Gemini ${model} failed:`, err.message);
        }
    }

    sendJson(res, 500, { error: 'Error al consultar Gemini', details: lastError });
};
