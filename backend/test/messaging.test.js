/* Jaribio la kutuma mialiko automatic: seva bandia za WhatsApp (Graph) na SMS (Beem) – hakuna ujumbe halisi unaotumwa. */
const { spawn } = require('child_process'), http = require('http'), os = require('os'), fs = require('fs'), path = require('path'), assert = require('assert'), crypto = require('crypto');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ngtm-')), port = 4000 + Math.floor(Math.random() * 900), B = `http://localhost:${port}`;
const waLog = [], smsLog = []; let flaky = 0;
const fake = http.createServer((req, res) => { let b = ''; req.on('data', c => b += c); req.on('end', () => {
  const j = b ? JSON.parse(b) : {}, out = (c, o) => { res.writeHead(c, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)); };
  if (req.url.endsWith('/messages')) {
    waLog.push({ auth: req.headers.authorization, body: j, url: req.url }); const to = j.to;
    if (to.endsWith('1111')) return out(400, { error: { code: 131026, message: 'Message undeliverable' } });
    if (to.endsWith('2222') && flaky++ < 1) return out(500, { error: { code: 2, message: 'temporary' } });
    if (to.endsWith('3333')) return out(400, { error: { code: 131026, message: 'not on whatsapp' } });
    return out(200, { messages: [{ id: 'wamid.' + to }] });
  }
  if (req.url.startsWith('/sms')) { smsLog.push({ auth: req.headers.authorization, body: j }); if (j.recipients[0].dest_addr.endsWith('3333')) return out(400, { message: 'invalid' }); return out(200, { successful: true, request_id: 77 }); }
  out(404, {}); }); });
const call = async (m, p, body, tok, raw, hdr = {}) => { const r = await fetch(B + p, { method: m, headers: { 'Content-Type': 'application/json', ...(tok ? { Authorization: 'Bearer ' + tok } : {}), ...hdr }, body: raw || (body ? JSON.stringify(body) : undefined) }); const t = await r.text(); let j; try { j = JSON.parse(t); } catch (e) { j = t; } return { s: r.status, j }; };
const ok = n => console.log('  ✓', n), wait = ms => new Promise(r => setTimeout(r, ms));
let srv;
(async () => {
  await new Promise(r => fake.listen(0, r)); const fp = fake.address().port;
  const env = { ...process.env, PORT: port, DATA_DIR: dir, PUBLIC_URL: 'https://nialike.test', WA_TOKEN: 'tok123', WA_PHONE_ID: '555', WA_TEMPLATE: 'mwaliko', WA_API_BASE: `http://localhost:${fp}/v21`, BEEM_API_KEY: 'k', BEEM_SECRET: 's', SMS_SENDER: 'NIALIKE', BEEM_API_BASE: `http://localhost:${fp}/sms`, SEND_RETRY_MS: '150', WA_VERIFY_TOKEN: 'vt', WA_APP_SECRET: 'appsec' };
  srv = spawn(process.execPath, ['--disable-warning=ExperimentalWarning', path.join(__dirname, '..', 'index.js')], { env, stdio: 'ignore' });
  for (let i = 0; i < 50; i++) { try { await fetch(B + '/api/health'); break; } catch (e) { await wait(100); } }
  const AT = (await call('POST', '/api/setup', { name: 'B', pin: '482916' })).j.token;
  const eid = (await call('POST', '/api/events', { name: 'Harusi M', date: '2027-01-01', time: '16:00', venue: 'DSM' }, AT)).j.id;
  const mk = async (n, p) => (await call('POST', `/api/events/${eid}/guests`, { name: n, phone: p }, AT)).j;
  const gOk = await mk('Ok', '0712000001'), gFb = await mk('Fallback', '0712001111'), gRt = await mk('Retry', '0712002222'), gNo = await mk('NoPhone', ''), gBad = await mk('Bad', '0712003333');
  assert.equal((await call('GET', '/api/messaging', null, AT)).j.whatsapp, true); ok('messaging configured');
  assert.equal((await call('POST', `/api/events/${eid}/send`, { mode: 'unsent' })).s, 401); ok('send needs admin');
  const q = await call('POST', `/api/events/${eid}/send`, { mode: 'unsent' }, AT); assert.equal(q.j.queued, 4); assert.equal(q.j.noPhone, 1); ok('queued 4, 1 bila namba');
  const dup = await call('POST', `/api/events/${eid}/send`, { mode: 'unsent' }, AT); assert.equal(dup.j.queued, 0); ok('hakuna ujumbe mara mbili wakati foleni inaendelea');
  let st; for (let i = 0; i < 60; i++) { st = (await call('GET', `/api/events/${eid}/send-status`, null, AT)).j; if (!st.queued) break; await wait(200); }
  assert.equal(st.queued, 0); ok('foleni imeisha');
  const gs = (await call('GET', `/api/state?eid=${eid}`, null, AT)).j.guests, by = n => gs.find(g => g.name === n);
  assert.equal(by('Ok').msg, 'sent'); assert.equal(by('Ok').msgCh, 'whatsapp'); ok('WhatsApp imetumwa');
  assert.equal(by('Fallback').msg, 'sent'); assert.equal(by('Fallback').msgCh, 'sms'); ok('WhatsApp ikishindwa -> SMS');
  assert.equal(by('Retry').msg, 'sent'); assert.equal(by('Retry').msgCh, 'whatsapp'); ok('hitilafu ya muda -> retry -> imetumwa');
  assert.equal(by('Bad').msg, 'failed'); assert(by('Bad').msgErr); ok('ikishindwa kote -> failed + sababu');
  assert.equal(by('NoPhone').msg, ''); ok('bila namba hapaswi kutumwa');
  const w = waLog.find(x => x.body.to === '255712000001'); assert.equal(w.auth, 'Bearer tok123'); assert(w.url.includes('/555/messages'));
  assert.equal(w.body.type, 'template'); assert.equal(w.body.template.name, 'mwaliko'); assert.equal(w.body.template.language.code, 'sw');
  const p = w.body.template.components[0].parameters.map(x => x.text); assert.equal(p[0], 'Ok'); assert.equal(p[1], 'Harusi M'); assert(p[4] === 'https://nialike.test/invite.html?c=' + gOk.code); ok('muundo wa ombi la WhatsApp ni sahihi (template, namba 255, link ya mwaliko)');
  assert(smsLog[0].auth.startsWith('Basic ') && smsLog[0].body.source_addr === 'NIALIKE' && smsLog[0].body.message.includes(gFb.short)); ok('muundo wa ombi la SMS ni sahihi');
  assert.equal((await call('GET', `/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=zz&hub.challenge=1`)).s, 403);
  assert.equal((await call('GET', `/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=vt&hub.challenge=CH42`)).j, 'CH42'); ok('webhook verify');
  const ev = JSON.stringify({ entry: [{ changes: [{ value: { statuses: [{ id: 'wamid.255712000001', status: 'delivered' }, { id: 'wamid.255712002222', status: 'read' }] } }] }] });
  assert.equal((await call('POST', '/api/webhooks/whatsapp', null, null, ev)).s, 403); ok('webhook bila saini inakataliwa');
  const sig = 'sha256=' + crypto.createHmac('sha256', 'appsec').update(ev).digest('hex');
  assert.equal((await call('POST', '/api/webhooks/whatsapp', null, null, ev, { 'x-hub-signature-256': sig })).s, 200);
  const g2 = (await call('GET', `/api/state?eid=${eid}`, null, AT)).j.guests; assert.equal(g2.find(g => g.name === 'Ok').msg, 'delivered'); assert.equal(g2.find(g => g.name === 'Retry').msg, 'read'); ok('webhook inasasisha delivered/read');
  const rt = await call('POST', `/api/events/${eid}/send`, { mode: 'failed' }, AT); assert.equal(rt.j.queued, 1); ok('retry ya zilizoshindwa');
  for (let i = 0; i < 40; i++) { if (!(await call('GET', `/api/events/${eid}/send-status`, null, AT)).j.queued) break; await wait(150); }
  await call('PUT', `/api/guests/${gBad.id}`, { name: 'Bad Fixed', phone: '0712004444', table: 'M3' }, AT);
  const one = await call('POST', `/api/guests/${gBad.id}/send`, {}, AT); await wait(300);
  const g3 = (await call('GET', `/api/state?eid=${eid}`, null, AT)).j.guests.find(g => g.id === gBad.id); assert.equal(g3.name, 'Bad Fixed'); assert.equal(g3.table, 'M3'); assert.equal(g3.msg, 'sent'); ok('hariri mgeni + tuma tena kwake');
  assert((await call('GET', '/api/audit', null, AT)).j.length > 0); ok('audit log');
  console.log('\nVipimo vya kutuma vimepita ✓');
})().catch(e => { console.error('\n✗ FAILED:', e.message); process.exitCode = 1; }).finally(() => { srv && srv.kill(); fake.close(); fs.rmSync(dir, { recursive: true, force: true }); });
