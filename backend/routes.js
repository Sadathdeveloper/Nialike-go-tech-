'use strict';
/* API routes. Kila route: [method, path, roles|null(public), handler] */
const crypto = require('crypto');
const D = require('./db');
const A = require('./auth');
const M = require('./messaging');
const { all, one, run, tx, rtext, rid } = D;

const bad = (status, msg) => Object.assign(new Error(msg), { status });
const s = (v, max = 200) => String(v ?? '').trim().slice(0, max);
const PRICE = { Basic: 150000, Standard: 350000, Premium: 700000 };
const pkgName = p => { const k = s(p, 40).split(/[\s–-]/)[0]; return PRICE[k] ? k : 'Standard'; };
const phoneOk = p => /^(\+?255|0)[67]\d{8}$/.test(String(p).replace(/[\s-]/g, ''));
const cardOk = c => /^assets\/cards\/card[1-7]\.jpg$/.test(c) ? c : 'assets/cards/card1.jpg';

/* ---------- views ---------- */
const gView = g => ({ id: g.id, eid: g.event_id, name: g.name, phone: g.phone, table: g.tbl, gate: g.gate, code: g.code, short: g.short, status: g.status, at: g.at, by: g.by, sent: !!g.sent, msg: g.msg_status || '', msgCh: g.msg_channel || '', msgErr: g.msg_error || '' });
function stats(eid) {
  const t = one(`SELECT COUNT(*) t, SUM(status='in') i FROM guests WHERE event_id=?`, eid), b = one(`SELECT COUNT(*) n FROM scans WHERE event_id=? AND res IN ('dup','other')`, eid);
  const total = t.t || 0, inn = t.i || 0;
  return { total, in: inn, pending: total - inn, pct: total ? Math.round(inn / total * 100) : 0, bad: b.n };
}
const eventIds = u => u.role === 'admin' ? all('SELECT id FROM events').map(e => e.id) : all('SELECT event_id id FROM user_events WHERE user_id=?', u.id).map(e => e.id);
const canSee = (u, eid) => u.role === 'admin' || !!one('SELECT 1 x FROM user_events WHERE user_id=? AND event_id=?', u.id, eid);
const uView = u => ({ id: u.id, name: u.name, role: u.role, active: !!u.active, events: all('SELECT event_id e FROM user_events WHERE user_id=?', u.id).map(r => r.e) });
const oView = o => ({ id: o.id, ref: o.ref, name: o.name, phone: o.phone, type: o.type, eventName: o.event_name, date: o.date, time: o.time, venue: o.venue, pkg: o.pkg, card: o.card, cardImg: o.card_img, extras: o.extras, pay: o.pay, lang: o.lang, notes: o.notes, guests: JSON.parse(o.guests || '[]'), amount: o.amount, paymentNote: o.payment_note, status: o.status, eventId: o.event_id, at: o.created_at });

function newGuest(eid, name, phone, tbl = '', gate = '') {
  name = s(name, 120); if (!name) return null;
  for (let i = 0; i < 20; i++) {
    const short = String(crypto.randomInt(100000, 1000000));
    if (one('SELECT 1 x FROM guests WHERE event_id=? AND short=?', eid, short)) continue;
    const g = { id: rid('G'), event_id: eid, name, phone: s(phone, 30), tbl: s(tbl, 40), gate: s(gate, 40), code: rtext(12), short, status: 'pending', at: null, by: null, sent: 0 };
    run('INSERT INTO guests(id,event_id,name,phone,tbl,gate,code,short,created_at) VALUES(?,?,?,?,?,?,?,?,?)', g.id, eid, g.name, g.phone, g.tbl, g.gate, g.code, g.short, Date.now());
    return g;
  }
  throw bad(500, 'Imeshindwa kutengeneza code');
}
function newUser(name, role, events, pin) {
  name = s(name, 80); if (!name) throw bad(400, 'Jina linahitajika');
  if (!['staff', 'client', 'admin'].includes(role)) throw bad(400, 'Role si sahihi');
  if (pin && !/^\d{6,8}$/.test(pin)) throw bad(400, 'PIN iwe tarakimu 6–8');
  for (let i = 0; i < 30; i++) {
    const p = pin || String(crypto.randomInt(100000, 1000000));
    if (one('SELECT 1 x FROM users WHERE pin_key=?', A.pinKey(p))) { if (pin) throw bad(409, 'PIN tayari inatumika'); continue; }
    const id = rid('U');
    run('INSERT INTO users(id,name,role,pin_key,created_at) VALUES(?,?,?,?,?)', id, name, role, A.pinKey(p), Date.now());
    for (const e of events || []) if (one('SELECT 1 x FROM events WHERE id=?', e)) run('INSERT OR IGNORE INTO user_events VALUES(?,?)', id, e);
    return { id, pin: p };
  }
  throw bad(500, 'Imeshindwa kutengeneza PIN');
}
function newEvent(o) {
  const name = s(o.name, 150); if (!name) throw bad(400, 'Jina la tukio linahitajika');
  const id = rid('EV');
  run('INSERT INTO events(id,name,type,date,time,venue,pkg,card,order_id,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)', id, name, s(o.type, 60), s(o.date, 12), s(o.time, 8), s(o.venue, 200), pkgName(o.pkg), cardOk(o.card), o.order_id || null, Date.now());
  return id;
}
function importText(eid, txt) {
  let n = 0;
  String(txt || '').slice(0, 400000).split(/\r?\n/).slice(0, 5000).forEach(l => {
    const p = l.split(/[,;\t|]/).map(x => x.trim());
    if (p[0] && !/^(jina|name)$/i.test(p[0]) && newGuest(eid, p[0], p[1], p[2], p[3])) n++;
  });
  return n;
}

/* ---------- scan (server ndiye mwamuzi) ---------- */
function doScan(u, b) {
  const eid = s(b.eid, 40), code = s(b.code, 40).toUpperCase(), now = Date.now();
  let at = Number(b.at) || now; if (at > now || at < now - 3 * 864e5) at = now; // scans za offline
  return tx(() => {
    let g = b.gid ? one('SELECT * FROM guests WHERE id=?', s(b.gid, 40)) : one('SELECT * FROM guests WHERE code=?', code);
    if (!g && /^\d{6}$/.test(code) && eid) g = one('SELECT * FROM guests WHERE event_id=? AND short=?', eid, code);
    let res;
    if (!g) res = 'invalid';
    else if (!canSee(u, g.event_id) || (eid && g.event_id !== eid)) res = 'other';
    else if (g.status === 'in') res = 'dup';
    else { res = 'ok'; run(`UPDATE guests SET status='in',at=?,by=? WHERE id=?`, at, u.id, g.id); g = { ...g, status: 'in', at, by: u.id }; }
    run('INSERT INTO scans(id,event_id,guest_id,code,res,at,by,device) VALUES(?,?,?,?,?,?,?,?)', rid('S'), g && res !== 'other' ? g.event_id : null, g ? g.id : null, code.slice(0, 40), res, at, u.id, s(b.device, 40));
    const out = { res, guest: g && res !== 'other' ? { id: g.id, name: g.name, table: g.tbl, gate: g.gate, at: g.at, status: g.status } : null };
    if (g && res !== 'other') out.stats = stats(g.event_id);
    return out;
  });
}

/* ---------- handlers ---------- */
const R = [];
const route = (m, p, roles, fn) => R.push([m, new RegExp('^' + p.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$'), roles, fn]);
const ADM = ['admin'], ANY = ['admin', 'staff', 'client'], FIELD = ['admin', 'staff'];

route('GET', '/api/health', null, () => ({ ok: true, time: Date.now() }));
route('GET', '/api/setup', null, () => ({ needsSetup: !one(`SELECT 1 x FROM users WHERE role='admin'`) }));
route('POST', '/api/setup', null, c => {
  if (one(`SELECT 1 x FROM users WHERE role='admin'`)) throw bad(403, 'Admin tayari yupo');
  if (!A.limit('setup:' + c.ip, 10, 36e5)) throw bad(429, 'Jaribu tena baadaye');
  const r = newUser(c.body.name, 'admin', [], s(c.body.pin, 10)); D.audit(r.id, 'setup');
  return { token: A.sign(r.id), user: { id: r.id, name: s(c.body.name, 80), role: 'admin', events: [] } };
});
route('POST', '/api/login', null, c => {
  if (!A.limit('login:' + c.ip, 8, 10 * 6e4)) throw bad(429, 'Majaribio mengi. Subiri dakika 10.');
  const u = one('SELECT * FROM users WHERE pin_key=?', A.pinKey(s(c.body.pin, 12)));
  if (!u || !u.active) throw bad(401, 'PIN si sahihi');
  D.audit(u.id, 'login'); return { token: A.sign(u.id), user: uView(u) };
});
route('GET', '/api/me', ANY, c => ({ user: uView(one('SELECT * FROM users WHERE id=?', c.user.id)) }));
route('POST', '/api/me/pin', ANY, c => {
  const p = s(c.body.pin, 10); if (!/^\d{6,8}$/.test(p)) throw bad(400, 'PIN iwe tarakimu 6–8');
  if (one('SELECT 1 x FROM users WHERE pin_key=? AND id<>?', A.pinKey(p), c.user.id)) throw bad(409, 'PIN tayari inatumika');
  run('UPDATE users SET pin_key=? WHERE id=?', A.pinKey(p), c.user.id); D.audit(c.user.id, 'change-pin'); return { ok: true };
});

/* state: kila kitu mtumiaji anachoruhusiwa kuona */
route('GET', '/api/state', ANY, c => {
  const u = c.user, ids = eventIds(u), eid = c.query.get('eid');
  const events = ids.map(id => { const e = one('SELECT * FROM events WHERE id=?', id); return { ...e, s: stats(id) }; }).sort((a, b) => b.created_at - a.created_at);
  const out = { events, guests: [], scans: [], settings: {} };
  if (eid && ids.includes(eid)) {
    out.guests = all('SELECT * FROM guests WHERE event_id=? ORDER BY created_at,name', eid).map(gView);
    out.scans = all('SELECT * FROM scans WHERE event_id=? ORDER BY at DESC LIMIT 30', eid);
  }
  if (u.role === 'admin') {
    out.users = all('SELECT * FROM users ORDER BY created_at').map(uView);
    out.orders = all('SELECT * FROM orders ORDER BY created_at DESC LIMIT 300').map(oView);
    out.settings = { payment_info: D.setting('payment_info') };
    out.messaging = { ...M.cfg(), publicUrl: process.env.PUBLIC_URL || D.setting('public_url') };
  }
  return out;
});

/* events (admin) */
route('POST', '/api/events', ADM, c => { const id = newEvent(c.body); D.audit(c.user.id, 'event+', id); return { id }; });
route('PUT', '/api/events/:id', ADM, c => {
  const e = one('SELECT * FROM events WHERE id=?', c.params.id); if (!e) throw bad(404, 'Tukio halipo');
  const b = c.body;
  run('UPDATE events SET name=?,type=?,date=?,time=?,venue=?,pkg=?,card=? WHERE id=?', s(b.name, 150) || e.name, s(b.type, 60), s(b.date, 12), s(b.time, 8), s(b.venue, 200), pkgName(b.pkg || e.pkg), cardOk(b.card || e.card), e.id);
  return { ok: true };
});
route('DELETE', '/api/events/:id', ADM, c => {
  tx(() => { run('DELETE FROM scans WHERE event_id=?', c.params.id); run('DELETE FROM events WHERE id=?', c.params.id); });
  D.audit(c.user.id, 'event-', c.params.id); return { ok: true };
});

/* guests */
route('POST', '/api/events/:id/guests', ADM, c => {
  if (!one('SELECT 1 x FROM events WHERE id=?', c.params.id)) throw bad(404, 'Tukio halipo');
  const g = newGuest(c.params.id, c.body.name, c.body.phone, c.body.table, c.body.gate); if (!g) throw bad(400, 'Jina linahitajika'); return gView(g);
});
route('POST', '/api/events/:id/import', ADM, c => {
  if (!one('SELECT 1 x FROM events WHERE id=?', c.params.id)) throw bad(404, 'Tukio halipo');
  return { added: tx(() => importText(c.params.id, c.body.text)) };
});
route('POST', '/api/events/:id/walkin', FIELD, c => {
  if (!canSee(c.user, c.params.id)) throw bad(403, 'Huna ruhusa');
  const g = tx(() => newGuest(c.params.id, c.body.name, c.body.phone, 'Walk-in')); if (!g) throw bad(400, 'Jina linahitajika');
  return doScan(c.user, { eid: c.params.id, gid: g.id });
});
route('PUT', '/api/guests/:id', ADM, c => {
  const g = one('SELECT * FROM guests WHERE id=?', c.params.id); if (!g) throw bad(404, 'Mgeni hayupo');
  const name = s(c.body.name, 120) || g.name, phone = s(c.body.phone, 30);
  run('UPDATE guests SET name=?,phone=?,tbl=?,gate=?,msg_status=CASE WHEN phone<>? THEN \'\' ELSE msg_status END WHERE id=?', name, phone, s(c.body.table, 40), s(c.body.gate, 40), phone, g.id);
  return gView(one('SELECT * FROM guests WHERE id=?', g.id));
});
/* kutuma mialiko automatic */
const needSender = () => { const k = M.cfg(); if (!k.whatsapp && !k.sms && !k.mock) throw bad(400, 'NOT_CONFIGURED'); };
const rememberBase = c => { if (!process.env.PUBLIC_URL && c.origin) D.setSetting('public_url', c.origin); };
route('GET', '/api/messaging', ADM, () => ({ ...M.cfg(), publicUrl: process.env.PUBLIC_URL || D.setting('public_url') }));
route('POST', '/api/events/:id/send', ADM, c => {
  if (!one('SELECT 1 x FROM events WHERE id=?', c.params.id)) throw bad(404, 'Tukio halipo'); needSender(); rememberBase(c);
  const mode = ['unsent', 'failed', 'all'].includes(c.body.mode) ? c.body.mode : 'unsent'; D.audit(c.user.id, 'send-invites', c.params.id + ' ' + mode);
  return M.enqueue(c.params.id, mode);
});
route('GET', '/api/events/:id/send-status', ADM, c => M.status(c.params.id));
route('POST', '/api/guests/:id/send', ADM, c => {
  const g = one('SELECT event_id FROM guests WHERE id=?', c.params.id); if (!g) throw bad(404, 'Mgeni hayupo'); needSender(); rememberBase(c);
  return M.enqueue(g.event_id, 'ids', [c.params.id]);
});
route('GET', '/api/audit', ADM, () => all('SELECT a.at,a.action,a.detail,u.name FROM audit a LEFT JOIN users u ON u.id=a.user_id ORDER BY a.id DESC LIMIT 100'));
/* webhook ya WhatsApp (hali: delivered/read/failed) */
route('GET', '/api/webhooks/whatsapp', null, c => {
  if (c.query.get('hub.mode') === 'subscribe' && process.env.WA_VERIFY_TOKEN && c.query.get('hub.verify_token') === process.env.WA_VERIFY_TOKEN) return { __raw: c.query.get('hub.challenge') || '' };
  throw bad(403, 'Forbidden');
});
route('POST', '/api/webhooks/whatsapp', null, c => {
  const sec = process.env.WA_APP_SECRET;
  if (sec) { const sig = String(c.headers['x-hub-signature-256'] || ''), good = 'sha256=' + crypto.createHmac('sha256', sec).update(c.raw || '').digest('hex'); if (sig.length !== good.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good))) throw bad(403, 'Saini si sahihi'); }
  for (const en of c.body.entry || []) for (const ch of en.changes || []) for (const st of (ch.value && ch.value.statuses) || []) M.webhookStatus(st.id, st.status, st.errors && st.errors[0] && (st.errors[0].title || st.errors[0].message));
  return { ok: true };
});
route('DELETE', '/api/guests/:id', ADM, c => { run('DELETE FROM guests WHERE id=?', c.params.id); return { ok: true }; });
route('POST', '/api/guests/:id/sent', ADM, c => { run('UPDATE guests SET sent=1 WHERE id=?', c.params.id); return { ok: true }; });
route('POST', '/api/scan', FIELD, c => doScan(c.user, c.body));
route('POST', '/api/scan/batch', FIELD, c => ({ results: (Array.isArray(c.body.items) ? c.body.items : []).slice(0, 500).map(i => doScan(c.user, i)) }));

/* users (admin pekee ndiye anaunda PIN) */
route('POST', '/api/users', ADM, c => {
  if (c.body.role === 'admin') throw bad(403, 'Haiwezekani');
  const r = tx(() => newUser(c.body.name, c.body.role, c.body.events)); D.audit(c.user.id, 'user+', r.id); return r;
});
route('POST', '/api/users/:id/reset-pin', ADM, c => {
  const u = one('SELECT * FROM users WHERE id=?', c.params.id); if (!u) throw bad(404, 'Haipo');
  for (let i = 0; i < 30; i++) { const p = String(crypto.randomInt(100000, 1000000)); if (one('SELECT 1 x FROM users WHERE pin_key=?', A.pinKey(p))) continue; run('UPDATE users SET pin_key=? WHERE id=?', A.pinKey(p), u.id); D.audit(c.user.id, 'pin-reset', u.id); return { pin: p }; }
  throw bad(500, 'Imeshindwa');
});
route('PUT', '/api/users/:id', ADM, c => {
  const u = one('SELECT * FROM users WHERE id=?', c.params.id); if (!u) throw bad(404, 'Haipo');
  if (u.role === 'admin' && c.body.active === false) throw bad(400, 'Admin hawezi kuzimwa');
  tx(() => {
    if (c.body.name) run('UPDATE users SET name=? WHERE id=?', s(c.body.name, 80), u.id);
    if (typeof c.body.active === 'boolean') run('UPDATE users SET active=? WHERE id=?', c.body.active ? 1 : 0, u.id);
    if (Array.isArray(c.body.events)) { run('DELETE FROM user_events WHERE user_id=?', u.id); for (const e of c.body.events) if (one('SELECT 1 x FROM events WHERE id=?', e)) run('INSERT OR IGNORE INTO user_events VALUES(?,?)', u.id, e); }
  });
  return { ok: true };
});
route('DELETE', '/api/users/:id', ADM, c => {
  const u = one('SELECT role FROM users WHERE id=?', c.params.id); if (!u) throw bad(404, 'Haipo');
  if (u.role === 'admin') throw bad(400, 'Admin hawezi kufutwa'); run('DELETE FROM users WHERE id=?', c.params.id); D.audit(c.user.id, 'user-', c.params.id); return { ok: true };
});

/* orders: umma anaunda; admin anasimamia malipo */
route('POST', '/api/orders', null, c => {
  if (!A.limit('order:' + c.ip, 10, 36e5)) throw bad(429, 'Maagizo mengi. Jaribu baadaye.');
  const b = c.body, name = s(b.name, 80), phone = s(b.phone, 30), eventName = s(b.eventName, 150);
  if (!name || !eventName) throw bad(400, 'Jina na jina la tukio vinahitajika');
  if (!phoneOk(phone)) throw bad(400, 'Namba ya simu si sahihi');
  const pkg = pkgName(b.pkg), guests = (Array.isArray(b.guests) ? b.guests : []).slice(0, 2000).map(g => s(g, 160)).filter(Boolean);
  let ref; do { ref = 'NGT-' + rtext(6); } while (one('SELECT 1 x FROM orders WHERE ref=?', ref));
  const now = Date.now();
  run(`INSERT INTO orders(id,ref,name,phone,type,event_name,date,time,venue,pkg,card,card_img,extras,pay,lang,notes,guests,amount,created_at,updated_at)
       VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, rid('O'), ref, name, phone, s(b.type, 60), eventName, s(b.date, 12), s(b.time, 8), s(b.venue, 200), pkg, s(b.card, 60), cardOk(s(b.cardImg, 60)), s(b.extras, 300), s(b.pay, 30), s(b.lang, 20), s(b.notes, 1000), JSON.stringify(guests), PRICE[pkg], now, now);
  return { ref, amount: PRICE[pkg], pkg };
});
route('GET', '/api/orders/:ref/status', null, c => {
  if (!A.limit('track:' + c.ip, 60, 10 * 6e4)) throw bad(429, 'Subiri kidogo');
  const o = one('SELECT * FROM orders WHERE ref=?', s(c.params.ref, 20).toUpperCase()); if (!o) throw bad(404, 'Namba ya agizo haipatikani');
  const show = o.status === 'awaiting_payment';
  return { ref: o.ref, status: o.status, eventName: o.event_name, pkg: o.pkg, amount: o.amount, paymentInfo: show ? (o.payment_note || D.setting('payment_info')) : '', date: o.date, createdAt: o.created_at };
});
route('PATCH', '/api/orders/:id', ADM, c => {
  const o = one('SELECT * FROM orders WHERE id=?', c.params.id); if (!o) throw bad(404, 'Agizo halipo');
  const st = c.body.status ?? o.status; if (!['new', 'awaiting_payment', 'paid', 'done', 'cancelled'].includes(st)) throw bad(400, 'Hali si sahihi');
  run('UPDATE orders SET status=?,amount=?,payment_note=?,updated_at=? WHERE id=?', st, Number.isFinite(+c.body.amount) ? Math.max(0, Math.round(+c.body.amount)) : o.amount, c.body.payment_note !== undefined ? s(c.body.payment_note, 600) : o.payment_note, Date.now(), o.id);
  D.audit(c.user.id, 'order', o.ref + ' -> ' + st); return { ok: true };
});
route('POST', '/api/orders/:id/create-event', ADM, c => {
  const o = one('SELECT * FROM orders WHERE id=?', c.params.id); if (!o) throw bad(404, 'Agizo halipo');
  if (o.event_id) throw bad(409, 'Tukio tayari limetengenezwa');
  return tx(() => {
    const eid = newEvent({ name: o.event_name, type: o.type, date: o.date, time: o.time, venue: o.venue, pkg: o.pkg, card: o.card_img, order_id: o.id });
    JSON.parse(o.guests || '[]').forEach(l => { const p = l.split(/[|,;\t]/).map(x => x.trim()); newGuest(eid, p[0], p[1]); });
    const u = newUser(o.name, 'client', [eid]);
    run(`UPDATE orders SET event_id=?,status='done',updated_at=? WHERE id=?`, eid, Date.now(), o.id);
    D.audit(c.user.id, 'order-event', o.ref); return { eventId: eid, pin: u.pin, clientId: u.id };
  });
});

/* settings, backup */
route('PUT', '/api/settings', ADM, c => { D.setSetting('payment_info', s(c.body.payment_info, 1500)); return { ok: true }; });
route('GET', '/api/backup', ADM, c => {
  const t = n => all('SELECT * FROM ' + n);
  D.audit(c.user.id, 'backup');
  return { at: Date.now(), events: t('events'), guests: t('guests'), scans: t('scans'), orders: t('orders'), users: all('SELECT id,name,role,active,created_at FROM users'), user_events: t('user_events'), settings: t('settings') };
});

/* mwaliko wa mgeni (umma, code isiyobashirika) */
route('GET', '/api/invite/:code', null, c => {
  if (!A.limit('inv:' + c.ip, 120, 6e4)) throw bad(429, 'Subiri kidogo');
  const g = one('SELECT * FROM guests WHERE code=?', s(c.params.code, 40).toUpperCase()); if (!g) throw bad(404, 'Mwaliko haupatikani');
  const e = one('SELECT name,date,time,venue,card FROM events WHERE id=?', g.event_id);
  return { guest: { name: g.name, table: g.tbl, gate: g.gate, short: g.short, code: g.code }, event: e };
});

module.exports = { R, bad };
