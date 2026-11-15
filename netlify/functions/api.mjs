// Netlify Functions v2 handler — /api/* routes for ChatPulse
import crypto from 'node:crypto';

const APP_KEY = process.env.APP_KEY || '6tnym1br6iaf7';
const APP_SECRET = process.env.APP_SECRET || '';
const API_HOST = 'https://api.sg-light-api.com';

const ROOMS = [
  { id: 'pulse-lobby', name: '🌍 Pulse Lobby', desc: 'Say hi — everyone lands here first' },
  { id: 'pulse-design', name: '🎨 Design Crit', desc: 'Drop screenshots, get feedback' },
  { id: 'pulse-shipping', name: '🚀 Shipping Room', desc: 'Launch day chatter' },
  { id: 'pulse-voice-notes', name: '🎤 Standup Stand-in', desc: 'Async standups in text' },
];

function signedHeaders() {
  const nonce = crypto.randomBytes(8).toString('hex').slice(0, 16);
  const ts = Date.now().toString();
  const signature = crypto.createHash('sha1').update(APP_SECRET + nonce + ts).digest('hex');
  return { 'App-Key': APP_KEY, Nonce: nonce, Timestamp: ts, Signature: signature, 'Content-Type': 'application/json' };
}

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export default async (req) => {
  const { pathname } = new URL(req.url);

  if (pathname.endsWith('/api/health')) return json({ ok: true });

  if (pathname.endsWith('/api/rooms')) return json(ROOMS);

  if (pathname.endsWith('/api/join') && req.method === 'POST') {
    const { name } = await req.json();
    const clean = String(name || '').trim().slice(0, 24);
    if (!clean) return json({ error: 'name required' }, 400);
    const userId = 'u_' + crypto.randomBytes(6).toString('hex');
    const r = await fetch(`${API_HOST}/v4/auth/access-token/issue`, {
      method: 'POST', headers: signedHeaders(),
      body: JSON.stringify({ userId, name: clean, avatarUrl: '' }),
    }).then(x => x.json());
    if (r.code !== 0) return json({ error: 'token issue failed', detail: r }, 502);
    fetch(`${API_HOST}/v4/user/profile/set`, {
      method: 'POST', headers: signedHeaders(),
      body: JSON.stringify({ userId, userProfile: { name: clean } }),
    }).catch(() => {});
    return json({ userId, name: clean, token: r.result.accessToken, appKey: APP_KEY });
  }

  return json({ error: 'not found' }, 404);
};
