// ChatPulse — real-time rooms built on the Nexconn Chat SDK (Web)
import './style.css';
import {
  NCEngine, OpenChannel, SendTextMessageParams, ConnectionStatusHandler, MessageHandler,
  ConnectionStatus, MessageDirection,
} from '@nexconn/chat';

const $app = document.getElementById('app');

const state = {
  me: null,          // {userId, name}
  token: null,
  appKey: null,
  rooms: [],
  activeRoom: null,  // {id, name}
  channel: null,     // entered OpenChannel
  msgs: [],          // {name, text, ts, mine}
  handlers: [],
  unread: {},        // roomId -> count
};
window.__cp = state; // debug

window.__errs = [];
window.addEventListener('error', e => console.error('[cp]', e.message, e.lineno));
window.addEventListener('unhandledrejection', e => console.error('[cp]', e.reason));

function msgText(c) {
  if (typeof c === 'string') return c;
  if (c && typeof c.text === 'string') return c.text;
  if (c && typeof c.content === 'string') return c.content;
  return JSON.stringify(c ?? '');
}
function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function time(ts) { return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }

function renderLogin() {
  $app.innerHTML = `
  <div class="center-wrap">
    <div class="card login-card">
      <div class="logo">💬 ChatPulse</div>
      <p class="tagline">Rooms that feel alive — real-time chat powered by the <b>Nexconn Chat SDK</b>.</p>
      <form id="join-form">
        <input id="name" maxlength="24" placeholder="Pick a display name" autocomplete="off" autofocus />
        <button type="submit">Join the pulse →</button>
      </form>
      <p class="note">Open Innovation · Nexconn Build Challenge 2026</p>
    </div>
  </div>`;
  document.getElementById('join-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    if (!name) return;
    const btn = e.target.querySelector('button');
    btn.disabled = true; btn.textContent = 'Connecting…';
    const res = await fetch('/api/join', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
    const data = await res.json();
    if (!res.ok) { btn.textContent = 'Error — try again'; btn.disabled = false; return; }
    state.me = { userId: data.userId, name: data.name };
    state.token = data.token; state.appKey = data.appKey;
    await connectEngine();
  });
}

async function connectEngine() {
  NCEngine.initialize({ appKey: state.appKey });

  NCEngine.addConnectionStatusHandler('cp-status', new ConnectionStatusHandler({
    onConnectionStatusChanged({ status, code }) {
      window.__conn = window.__conn || [];
      window.__conn.push(Date.now().toString().slice(-6) + ':' + status + (code ? '/' + code : ''));
      const el = document.getElementById('conn-dot');
      if (el) {
        el.className = 'dot ' + (status === ConnectionStatus.CONNECTED ? 'dot-on' : 'dot-off');
        el.title = 'Connection: ' + status;
      }
    },
  }));

  NCEngine.addMessageHandler('cp-msgs', new MessageHandler({
    onMessageReceived({ messages }) {
      for (const m of messages) {
        const mine = m.direction === MessageDirection.SEND;
        state.msgs.push({ name: mine ? state.me.name : (m.senderUserName || m.senderUserId || 'Stranger'), text: msgText(m.content), ts: m.sentTime || Date.now(), mine });
      }
      renderRoom(state.activeRoom, true);
    },
  }));

  const res = await NCEngine.connect({ token: state.token });
  if (res.code !== 0) { alert('Connect failed: ' + res.code); return; }
  state.rooms = await (await fetch('/api/rooms')).json();
  renderLobby();
}

function renderLobby() {
  const unreadBadge = (id) => state.unread[id] ? `<span class="badge">${state.unread[id]}</span>` : '';
  $app.innerHTML = `
  <div class="shell">
    <aside class="sidebar">
      <div class="logo sm">💬 ChatPulse <span id="conn-dot" class="dot dot-on" title="connected"></span></div>
      <div class="me">👤 ${esc(state.me.name)}</div>
      <nav class="rooms">
        ${state.rooms.map(r => `
          <button class="room-item ${state.activeRoom?.id === r.id ? 'active' : ''}" data-room="${r.id}">
            <span class="room-name">${esc(r.name)}</span>
            <span class="room-desc">${esc(r.desc)}</span>
            ${unreadBadge(r.id)}
          </button>`).join('')}
      </nav>
      <p class="note">Built with Nexconn Chat SDK · Open Channels</p>
    </aside>
    <main class="main" id="main"></main>
  </div>`;
  $app.querySelectorAll('.room-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const room = state.rooms.find(r => r.id === btn.dataset.room);
      openRoom(room);
    });
  });
  if (!state.activeRoom) openRoom(state.rooms[0]);
}

async function openRoom(room) {
  if (state.activeRoom?.id === room.id && state.channel) return;
  // leave previous
  if (state.channel) { try { await state.channel.exitChannel(); } catch {} state.channel = null; }
  state.activeRoom = room;
  state.msgs = [];
  delete state.unread[room.id];
  renderLobby();
  renderRoom(room);

  try {
    const ch = new OpenChannel(room.id);
    const r = await ch.enterChannel({ messageCount: 10 });
    if (r.code !== 0) throw new Error('enter code ' + r.code);
    state.channel = ch;
    // load history (best-effort — SDK query shape varies)
    try {
      const q = ch.createOpenChannelMessagesQuery ? ch.createOpenChannelMessagesQuery({ pageSize: 30 }) : null;
      if (q) {
        const h = await q.loadNextPage();
        if (h.code === 0 && Array.isArray(h.data)) {
          for (const m of h.data.reverse()) {
            const mine = m.direction === MessageDirection.SEND;
            state.msgs.push({ name: mine ? state.me.name : (m.senderUserName || m.senderUserId || 'Stranger'), text: msgText(m.content), ts: m.sentTime || Date.now(), mine });
          }
          renderRoom(room, true);
        }
      }
    } catch (err) { console.warn('[cp] history skip', err.message); }
    addSysMsg(`Connected to ${room.name} — messages are live via Nexconn.`);
  } catch (e) {
    console.error('[cp] openRoom ERR', e);
    addSysMsg('⚠️ ' + e.message);
  }
}

function addSysMsg(text) {
  state.msgs.push({ name: 'system', text, ts: Date.now(), mine: false, sys: true });
  renderRoom(state.activeRoom, true);
}

function renderRoom(room, quiet) {
  const main = document.getElementById('main');
  if (!main) return;
  const msgsHtml = state.msgs.map(m => m.sys
    ? `<div class="msg sys">${esc(m.text)}</div>`
    : `<div class="msg ${m.mine ? 'mine' : ''}">
         <div class="meta">${esc(m.name)} · ${time(m.ts)}</div>
         <div class="bubble">${esc(m.text)}</div>
       </div>`).join('');
  main.innerHTML = `
    <header class="room-head">
      <h2>${esc(room.name)}</h2>
      <p>${esc(room.desc)}</p>
    </header>
    <div class="msgs" id="msgs">${msgsHtml}</div>
    <form class="composer" id="composer">
      <input id="text" placeholder="Message ${esc(room.name)}…" autocomplete="off" maxlength="500" />
      <button type="submit">Send</button>
    </form>`;
  const msgsEl = document.getElementById('msgs');
  msgsEl.scrollTop = msgsEl.scrollHeight;
  document.getElementById('composer').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('text');
    const text = input.value.trim();
    if (!text || !state.channel) return;
    input.value = '';
    try {
      const r = await state.channel.sendMessage(new SendTextMessageParams({ text }));
      if (r.code === 0) {
        state.msgs.push({ name: state.me.name, text, ts: Date.now(), mine: true });
        renderRoom(state.activeRoom, true);
      } else {
        addSysMsg('⚠️ send failed code ' + r.code);
      }
    } catch (err) {
      addSysMsg('⚠️ ' + err.message);
    }
  });
}

renderLogin();
