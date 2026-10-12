'use strict';
/* Kutuma mialiko automatic: WhatsApp Cloud API (template) -> SMS (Beem) kama mbadala. Foleni (outbox) + retry + webhook ya hali. */
const D = require('./db');
const { all, one, run } = D;
const env = process.env;

const cfg = () => ({ whatsapp: !!(env.WA_TOKEN && env.WA_PHONE_ID && env.WA_TEMPLATE), sms: !!(env.BEEM_API_KEY && env.BEEM_SECRET && env.SMS_SENDER), mock: env.NGT_MOCK_SEND === '1' });
const WA_BASE = () => env.WA_API_BASE || 'https://graph.facebook.com/v21.0';
const BEEM = () => env.BEEM_API_BASE || 'https://apisms.beem.africa/v1/send';
const RATE = () => +env.SEND_RATE || 5, RETRY = () => +env.SEND_RETRY_MS || 30000, MAX_TRIES = 3;

const tz = p => { p = String(p || '').replace(/[\s\-+()]/g, ''); if (/^0[67]\d{8}$/.test(p)) return '255' + p.slice(1); if (/^255[67]\d{8}$/.test(p)) return p; return null; };
const base = () => (env.PUBLIC_URL || D.setting('public_url') || '').replace(/\/$/, '');
const link = g => base() + '/invite.html?c=' + g.code;
const clean = t => String(t ?? '-').replace(/[\n\t\r]+/g, ' ').replace(/ {4,}/g, '   ').trim().slice(0, 500) || '-';

const PERMANENT = [131026, 131021, 131030, 131008, 132000, 132001, 132005, 132007, 132012, 132015, 132016, 190, 100];
async function sendWA(g, e, to) {
  const r = await fetch(`${WA_BASE()}/${env.WA_PHONE_ID}/messages`, {
    method: 'POST', headers: { Authorization: 'Bearer ' + env.WA_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'template', template: { name: env.WA_TEMPLATE, language: { code: env.WA_LANG || 'sw' },
      components: [{ type: 'body', parameters: [g.name, e.name, [e.date, e.time].filter(Boolean).join(' '), e.venue, link(g)].map(t => ({ type: 'text', text: clean(t) })) }] } })
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const er = j.error || {}; throw Object.assign(new Error(er.message || 'WhatsApp ' + r.status), { permanent: PERMANENT.includes(er.code) || (r.status >= 400 && r.status < 500 && r.status !== 429) }); }
  return (j.messages && j.messages[0] && j.messages[0].id) || '';
}
async function sendSMS(g, e, to) {
  const message = `Habari ${g.name}, umealikwa ${e.name} ${e.date || ''}. Mwaliko wako: ${link(g)} Code: ${g.short}`;
  const r = await fetch(BEEM(), { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Basic ' + Buffer.from(env.BEEM_API_KEY + ':' + env.BEEM_SECRET).toString('base64') },
    body: JSON.stringify({ source_addr: env.SMS_SENDER, schedule_time: '', encoding: 0, message, recipients: [{ recipient_id: 1, dest_addr: to }] }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.successful === false) throw Object.assign(new Error(j.message || 'SMS ' + r.status), { permanent: r.status >= 400 && r.status < 500 });
  return j.request_id ? String(j.request_id) : '';
}
const mocked = [];
function mockSend(ch, g, to) { mocked.push({ ch, to, guest: g.id }); if (to.endsWith('0000')) throw Object.assign(new Error('mock: namba imekataliwa'), { permanent: true }); return 'mock-' + mocked.length; }

async function attempt(g, e, to, tries) {
  const c = cfg(); let last = null;
  if (c.whatsapp || c.mock) {
    try { return { channel: 'whatsapp', id: c.mock && !c.whatsapp ? mockSend('whatsapp', g, to) : await sendWA(g, e, to) }; }
    catch (x) { last = x; if (!x.permanent && tries < MAX_TRIES - 1) throw x; }
  }
  if (c.sms || c.mock) {
    try { return { channel: 'sms', id: c.mock && !c.sms ? mockSend('sms', g, to) : await sendSMS(g, e, to) }; }
    catch (x) { throw Object.assign(last || x, { permanent: true }); }
  }
  throw last || Object.assign(new Error('Hakuna WhatsApp/SMS iliyowekwa'), { permanent: true });
}
function markFail(j, gid, msg) {
  run("UPDATE outbox SET status='failed',attempts=attempts+1,error=? WHERE id=?", String(msg).slice(0, 250), j.id);
  run("UPDATE guests SET msg_status='failed',msg_error=?,msg_at=? WHERE id=?", String(msg).slice(0, 250), Date.now(), gid);
}
async function work(j) {
  run("UPDATE outbox SET status='sending' WHERE id=?", j.id);
  const g = one('SELECT * FROM guests WHERE id=?', j.guest_id), e = g && one('SELECT * FROM events WHERE id=?', g.event_id);
  if (!g || !e) return run("UPDATE outbox SET status='failed',error='mgeni/tukio halipo' WHERE id=?", j.id);
  const to = tz(g.phone); if (!to) return markFail(j, g.id, 'Namba ya simu si sahihi');
  try {
    const r = await attempt(g, e, to, j.attempts);
    run("UPDATE outbox SET status='sent',attempts=attempts+1,error='' WHERE id=?", j.id);
    run("UPDATE guests SET sent=1,msg_status='sent',msg_channel=?,msg_error='',msg_at=?,wa_id=? WHERE id=?", r.channel, Date.now(), r.id || '', g.id);
  } catch (x) {
    if (!x.permanent && j.attempts < MAX_TRIES - 1) run("UPDATE outbox SET status='queued',attempts=attempts+1,next_at=?,error=? WHERE id=?", Date.now() + RETRY() * (j.attempts + 1), x.message.slice(0, 200), j.id);
    else markFail(j, g.id, x.message);
  }
}
let busy = false;
async function tick() {
  if (busy) return; busy = true;
  try { await Promise.all(all("SELECT * FROM outbox WHERE status='queued' AND next_at<=? ORDER BY id LIMIT ?", Date.now(), RATE()).map(work)); }
  catch (e) { console.error('[outbox]', e); } finally { busy = false; }
}
function start() { run("UPDATE outbox SET status='queued' WHERE status='sending'"); setInterval(tick, 1000).unref(); }

/* mode: unsent | failed | all | ids */
function enqueue(eid, mode, ids) {
  let gs = all('SELECT * FROM guests WHERE event_id=? ORDER BY created_at', eid);
  if (mode === 'unsent') gs = gs.filter(g => (!g.msg_status && !g.sent) || g.msg_status === 'failed');
  else if (mode === 'failed') gs = gs.filter(g => g.msg_status === 'failed');
  else if (mode === 'ids') gs = gs.filter(g => (ids || []).includes(g.id));
  let queued = 0, noPhone = 0, busyN = 0;
  for (const g of gs) {
    if (!tz(g.phone)) { noPhone++; continue; }
    if (one("SELECT 1 x FROM outbox WHERE guest_id=? AND status IN ('queued','sending')", g.id)) { busyN++; continue; }
    run("INSERT INTO outbox(guest_id,event_id,status,next_at,created_at) VALUES(?,?,'queued',?,?)", g.id, eid, Date.now(), Date.now());
    run("UPDATE guests SET msg_status='queued',msg_error='' WHERE id=?", g.id); queued++;
  }
  setImmediate(tick);
  return { queued, noPhone, alreadyQueued: busyN };
}
function status(eid) {
  const o = { total: 0, queued: 0, sent: 0, delivered: 0, read: 0, failed: 0, none: 0, noPhone: 0 };
  all('SELECT msg_status, phone, sent FROM guests WHERE event_id=?', eid).forEach(g => { o.total++; if (!tz(g.phone)) o.noPhone++; if (g.msg_status && o[g.msg_status] !== undefined) o[g.msg_status]++; else if (!g.msg_status) o.none++; });
  return o;
}
function webhookStatus(id, st, err) {
  const m = { sent: 'sent', delivered: 'delivered', read: 'read', failed: 'failed' }[st]; if (!m || !id) return;
  const rank = { queued: 0, sent: 1, delivered: 2, read: 3 }, g = one('SELECT msg_status FROM guests WHERE wa_id=?', id); if (!g) return;
  if (m === 'failed') run("UPDATE guests SET msg_status='failed',msg_error=?,msg_at=? WHERE wa_id=?", String(err || 'Imeshindwa kufika').slice(0, 250), Date.now(), id);
  else if ((rank[m] || 0) >= (rank[g.msg_status] || 0)) run('UPDATE guests SET msg_status=?,msg_at=? WHERE wa_id=?', m, Date.now(), id);
}
module.exports = { cfg, enqueue, status, start, webhookStatus, mocked, tz };
