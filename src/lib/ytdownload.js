import axios from 'axios';
import { spawnSync, execSync } from 'child_process';
import { readFileSync, unlinkSync, existsSync, readdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

// ── API 1: cobalt.tools ───────────────────────────────────────────────────────
async function tryCobalt(url) {
    const res = await axios.post('https://api.cobalt.tools/', {
        url,
        downloadMode: 'audio',
        audioFormat: 'mp3',
        audioQuality: '128'
    }, {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        timeout: 20000
    });

    const { status, url: dlUrl } = res.data;
    if (!dlUrl) throw new Error(`cobalt sin URL (status: ${status})`);

    const audio = await axios.get(dlUrl, {
        responseType: 'arraybuffer',
        timeout: 90000,
        maxContentLength: 100 * 1024 * 1024
    });
    const buf = Buffer.from(audio.data);
    if (buf.length < 1000) throw new Error('Buffer vacío desde cobalt');
    return buf;
}

// ── API 2: yt-dlp via subprocess (si está instalado en el sistema) ─────────────
function ytdlpInstalled() {
    try { execSync('yt-dlp --version', { stdio: 'ignore' }); return true; } catch { return false; }
}

async function tryYtDlp(url) {
    if (!ytdlpInstalled()) throw new Error('yt-dlp no instalado');

    const tmpFile = join(tmpdir(), `ytbot_${Date.now()}`);

    const result = spawnSync('yt-dlp', [
        '-x',
        '--audio-format', 'mp3',
        '--audio-quality', '5',
        '-o', `${tmpFile}.%(ext)s`,
        '--no-playlist',
        '--no-check-certificates',
        '--quiet',
        url
    ], { timeout: 120000 });

    if (result.status !== 0) {
        throw new Error(result.stderr?.toString().split('\n').find(l => l.includes('ERROR')) || 'yt-dlp falló');
    }

    // Buscar el archivo generado
    const files = readdirSync(tmpdir()).filter(f => f.startsWith(`ytbot_${Date.now()}`) || f.startsWith('ytbot_'));
    const mp3 = files.find(f => f.endsWith('.mp3') || f.endsWith('.m4a') || f.endsWith('.opus'));
    const finalPath = mp3 ? join(tmpdir(), mp3) : `${tmpFile}.mp3`;

    if (!existsSync(finalPath)) throw new Error('yt-dlp: archivo no generado');

    const buf = readFileSync(finalPath);
    try { unlinkSync(finalPath); } catch { }
    return buf;
}

// ── API 3: loader de respaldo (otro endpoint público) ─────────────────────────
async function tryAnotherApi(url) {
    const videoId = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1];
    if (!videoId) throw new Error('No se pudo extraer videoId');

    // API pública alternativa (sin key)
    const apiUrl = `https://api.vevioz.com/api/button/mp3/${videoId}`;
    const res = await axios.get(apiUrl, { timeout: 15000 });

    const match = res.data?.match(/href="(https?:\/\/[^"]+\.mp3[^"]*)"/i);
    if (!match) throw new Error('No se encontró link MP3 en la respuesta');

    const audio = await axios.get(match[1], {
        responseType: 'arraybuffer',
        timeout: 90000,
        maxContentLength: 100 * 1024 * 1024
    });
    const buf = Buffer.from(audio.data);
    if (buf.length < 1000) throw new Error('Buffer vacío');
    return buf;
}

// ── Orquestador ───────────────────────────────────────────────────────────────
export async function downloadYTAudio(videoUrl) {
    const apis = [
        { name: 'cobalt.tools', fn: () => tryCobalt(videoUrl) },
        { name: 'yt-dlp',       fn: () => tryYtDlp(videoUrl) },
        { name: 'vevioz API',   fn: () => tryAnotherApi(videoUrl) },
    ];

    const errores = [];

    for (const { name, fn } of apis) {
        try {
            process.stdout.write(`  [play] Intentando ${name}...\n`);
            const buf = await fn();
            process.stdout.write(`  [play] ✓ OK con ${name} (${(buf.length / 1024 / 1024).toFixed(1)} MB)\n`);
            return buf;
        } catch (e) {
            process.stdout.write(`  [play] ✗ ${name}: ${e.message}\n`);
            errores.push(`${name}: ${e.message}`);
        }
    }

    throw new Error(
        'No se pudo descargar con ningún método.\n\n' +
        '💡 *Solución rápida:* instala yt-dlp en tu sistema:\n' +
        '`pip3 install yt-dlp` o `sudo apt install yt-dlp`\n\n' +
        `_Detalles: ${errores[0]}_`
    );
}
