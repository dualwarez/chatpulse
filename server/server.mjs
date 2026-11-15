// ChatPulse server — token issuing via Nexconn Chat Server API + static hosting
import crypto from 'node:crypto';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const APP_KEY = '6tnym1br6iaf7';
const APP_SECRET = '5ljIzEkWb2vK8M';
const API_HOST = 'https://api.sg-light-api.com';
const PORT = process.env.PORT || 8787;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

// in-memory user registry (demo scale)
const users = new Map(); // userId -> {name, createdAt}

function signedHeaders() {
  const nonce = crypto.randomBytes(8).toString('hex').slice(0, 16);
  const ts = Date.now().toString();
  const signature = crypto.createHash('sha1').update(APP_SECRET + nonce + ts).digest('hex');
  return {
    'App-Key': APP_KEY, Nonce: nonce, Timestamp: ts, Signature: signature,
    'Content-Type': 'application/json',
  };
}

function issueToken(userId, name) {
  return fetch(`${API_HOST}/v4/auth/access-token/issue`, {
    method: 'POST',
    headers: signedHeaders(),
    body: JSON.stringify({ userId, name, avatarUrl: '' }),
  }).then(r => r.json());
}

async function setProfile(userId, name) {
  try {
    await fetch(`${API_HOST}/v4/user/profile/set`, {
      method: 'POST', headers: signedHeaders(),
      body: JSON.stringify({ userId, userProfile: { name } }),
    });
  } catch (e) { console.warn('profile set failed', e.message); }
}

// join / login: {name} -> {userId, token, appKey}
app.post('/api/join', async (req, res) => {
  const name = String(req.body?.name || '').trim().slice(0, 24);
  if (!name) return res.status(400).json({ error: 'name required' });
  const userId = 'u_' + crypto.randomBytes(6).toString('hex');
  const r = await issueToken(userId, name);
  if (r.code !== 0) return res.status(502).json({ error: 'token issue failed', detail: r });
  setProfile(userId, name);
  users.set(userId, { name, createdAt: Date.now() });
  res.json({ userId, name, token: r.result.accessToken, appKey: APP_KEY });
});

// health + stats
app.get('/api/health', (req, res) => res.json({ ok: true, users: users.size }));

// rooms registry (metadata shown in lobby; actual rooms are Nexconn open channels)
const ROOMS = [
  { id: 'pulse-lobby', name: '🌍 Pulse Lobby', desc: 'Say hi — everyone lands here first' },
  { id: 'pulse-design', name: '🎨 Design Crit', desc: 'Drop screenshots, get feedback' },
  { id: 'pulse-shipping', name: '🚀 Shipping Room', desc: 'Launch day chatter' },
  { id: 'pulse-voice-notes', name: '🎤 Standup Stand-in', desc: 'Async standups in text' },
];
app.get('/api/rooms', (req, res) => res.json(ROOMS));

// ensure open channels exist on the Nexconn side (7-day TTL)
async function ensureRooms() {
  for (const r of ROOMS) {
    try {
      const res = await fetch(`${API_HOST}/v4/open-channel/create`, {
        method: 'POST',
        headers: signedHeaders(),
        body: JSON.stringify({ channelId: r.id, destroyType: 0, ttlMinutes: 10080 }),
      });
      const j = await res.json().catch(() => ({}));
      console.log(`room ${r.id}: code=${j.code}`);
    } catch (e) { console.warn(`room ${r.id} create failed:`, e.message); }
  }
}
ensureRooms();

const dist = path.join(__dirname, '..', 'dist');
app.use(express.static(dist));
app.use((req, res) => res.sendFile(path.join(dist, 'index.html')));

app.listen(PORT, () => console.log(`ChatPulse server on http://localhost:${PORT}`));
