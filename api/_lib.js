/* Msaada wa pamoja: funguo, Supabase (REST), PIN za watumiaji, WhatsApp Cloud API */
const crypto = require('crypto');

const auth = req => {
  const k = process.env.PORTAL_KEY || '';
  const h = String(req.headers['x-portal-key'] || '');
  return k.length >= 8 && h.length === k.length && crypto.timingSafeEqual(Buffer.from(h), Buffer.from(k));
};

const C = ['users', 'events', 'guests', 'scans', 'orders'];
const enc = encodeURIComponent;
const T = c => 'ngt_' + c;

const rq = async (path, { method = 'GET', body, prefer, range } = {}) => {
  const base = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_KEY;
  if (!base || !key) throw new Error('Supabase haijaunganishwa (SUPABASE_URL / SUPABASE_SERVICE_KEY)');
  const h = { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' };
  if (prefer) h.Prefer = prefer;
  if (range) { h.Range = range; h['Range-Unit'] = 'items'; }
  const r = await fetch(base.replace(/\/$/, '') + '/rest/v1' + path, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) });
  const t = await r.text();
  let j = null; try { j = t ? JSON.parse(t) : null; } catch (e) { /* si JSON */ }
  if (!r.ok) throw new Error((j && (j.message || j.hint)) || 'Supabase HTTP ' + r.status);
  return j;
};

const all = async c => {
  const out = [];
  for (let i = 0; ; i += 1000) {
    const rows = (await rq('/' + T(c) + '?select=data&order=id', { range: i + '-' + (i + 999) })) || [];
    out.push(...rows.map(r => r.data));
    if (rows.length < 1000) break;
  }
  return out;
};
const get = async (c, id) => { const r = await rq('/' + T(c) + '?id=eq.' + enc(id) + '&select=data&limit=1'); return r && r[0] ? r[0].data : null; };
const put = async (c, objs) => {
  const a = (Array.isArray(objs) ? objs : [objs]).map(v => ({ id: v.id, data: v }));
  for (let i = 0; i < a.length; i += 200) await rq('/' + T(c), { method: 'POST', body: a.slice(i, i + 200), prefer: 'resolution=merge-duplicates,return=minimal' });
};
const del = (c, id) => rq('/' + T(c) + '?id=eq.' + enc(id), { method: 'DELETE' });
const any = async c => { const r = await rq('/' + T(c) + '?select=id&limit=1'); return !!(r && r.length); };
const clearAll = async () => { for (const c of [...C, 'in']) await rq('/' + T(c) + '?id=not.is.null', { method: 'DELETE' }); };

/* Mgeni kuingia mara moja tu: kuingiza safu ya kwanza kunafanikiwa, ya pili inapuuzwa (atomiki) */
const claim = async (gid, at) => { const r = await rq('/ngt_in', { method: 'POST', body: [{ id: gid, at }], prefer: 'resolution=ignore-duplicates,return=representation' }); return !!(r && r.length); };
const getIn = async gid => { const r = await rq('/ngt_in?id=eq.' + enc(gid) + '&select=at&limit=1'); return r && r[0] ? Number(r[0].at) : 0; };

const ip = req => String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'x';
const rateGet = async k => { const r = await rq('/ngt_rate?key=eq.' + enc(k) + '&select=n,until&limit=1'); const x = r && r[0]; return x && Number(x.until) > Date.now() ? Number(x.n) : 0; };
const rateHit = async (k, secs) => { const n = (await rateGet(k)) + 1; await rq('/ngt_rate', { method: 'POST', body: [{ key: k, n, until: Date.now() + secs * 1000 }], prefer: 'resolution=merge-duplicates,return=minimal' }); return n; };
const rate = async (k, max, secs) => (await rateHit(k, secs)) <= max;

/* Mtumiaji kwa PIN (header x-pin). Majaribio mabaya 15 kwa dakika 10 kwa kila IP. */
const who = async req => {
  const pin = String(req.headers['x-pin'] || '').trim();
  if (!pin) return null;
  const k = 'bad:' + ip(req);
  if ((await rateGet(k)) >= 15) { const e = new Error('rl'); e.code = 429; throw e; }
  const u = (await all('users')).find(x => String(x.pin) === pin) || null;
  if (!u) await rateHit(k, 600);
  return u;
};

const setRsvp = async (gid, ev, a) => {
  const g = await get('guests', gid);
  if (!g || g.eid !== ev) return false;
  g.rsvp = a; g.rsvpAt = Date.now();
  await put('guests', g);
  return true;
};

const wa = async body => {
  if (!process.env.WA_TOKEN || !process.env.WA_PHONE_ID) throw new Error('WA_TOKEN / WA_PHONE_ID hazijawekwa');
  const r = await fetch('https://graph.facebook.com/v21.0/' + process.env.WA_PHONE_ID + '/messages', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + process.env.WA_TOKEN, 'content-type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', ...body })
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((j.error && j.error.message) || 'WhatsApp HTTP ' + r.status);
  return j;
};

module.exports = { auth, C, all, get, put, del, any, clearAll, claim, getIn, ip, rate, who, setRsvp, wa };
