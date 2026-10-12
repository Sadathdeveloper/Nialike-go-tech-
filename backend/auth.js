'use strict';
/* PIN (HMAC), token iliyosainiwa, rate-limit */
const crypto = require('crypto'), fs = require('fs'), path = require('path');
const { DIR, one } = require('./db');

function loadSecret() {
  if (process.env.NGT_SECRET) return process.env.NGT_SECRET;
  const f = path.join(DIR, '.secret');
  try { return fs.readFileSync(f, 'utf8').trim(); } catch (e) {}
  const s = crypto.randomBytes(32).toString('hex');
  fs.writeFileSync(f, s, { mode: 0o600 });
  return s;
}
const SECRET = loadSecret();
const hmac = (s, k = SECRET) => crypto.createHmac('sha256', k).update(s).digest('hex');
const pinKey = pin => hmac('pin:' + String(pin).trim());
const b64 = b => Buffer.from(b).toString('base64url');

const TTL = 24 * 3600 * 1000;
const sign = uid => { const p = b64(JSON.stringify({ u: uid, e: Date.now() + TTL })); return p + '.' + hmac(p); };
function verify(tok) {
  if (!tok || typeof tok !== 'string') return null;
  const [p, s] = tok.split('.');
  if (!p || !s) return null;
  const good = hmac(p);
  if (s.length !== good.length || !crypto.timingSafeEqual(Buffer.from(s), Buffer.from(good))) return null;
  try {
    const o = JSON.parse(Buffer.from(p, 'base64url').toString());
    if (o.e < Date.now()) return null;
    const u = one('SELECT id,name,role,active FROM users WHERE id=?', o.u);
    return u && u.active ? u : null;
  } catch (e) { return null; }
}

const hits = new Map();
function limit(key, max, windowMs) {
  const now = Date.now(), h = hits.get(key);
  if (!h || h.until < now) { hits.set(key, { n: 1, until: now + windowMs }); return true; }
  return ++h.n <= max;
}
setInterval(() => { const n = Date.now(); for (const [k, v] of hits) if (v.until < n) hits.delete(k); }, 60000).unref();

module.exports = { pinKey, sign, verify, limit };
