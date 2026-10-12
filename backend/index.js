'use strict';
/* Server: API (/api/*) + tovuti (public/). Hakuna dependencies. */
const http = require('http'), fs = require('fs'), path = require('path');
const A = require('./auth'), D = require('./db'), { R, bad } = require('./routes'), M = require('./messaging');

const PORT = +process.env.PORT || 3000, PUB = path.join(__dirname, '..'), TRUST = process.env.TRUST_PROXY === '1';
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8' };
const CORS = (process.env.CORS_ORIGIN || '').split(',').map(x => x.trim()).filter(Boolean);
const OK_ROOT = /^\/(index|portal|invite|check)\.html$|^\/(sw\.js|manifest\.webmanifest|favicon\.ico)$/, OK_DIR = /^\/(css|js|assets)\//;
const SEC = { 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'same-origin' };

const corsH = req => { const o = req.headers.origin; return o && CORS.includes(o) ? { 'Access-Control-Allow-Origin': o, Vary: 'Origin', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS' } : {}; };
const send = (res, code, body, h = {}) => { res.writeHead(code, { ...SEC, ...(res.cors || {}), ...h }); res.end(body); };
const json = (res, code, o) => send(res, code, JSON.stringify(o), { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
const ipOf = req => (TRUST && String(req.headers['x-forwarded-for'] || '').split(',')[0].trim()) || req.socket.remoteAddress || '?';

function readBody(req) {
  return new Promise((ok, no) => {
    let n = 0; const ch = [];
    req.on('data', c => { n += c.length; if (n > 1e6) { no(bad(413, 'Data ni kubwa mno')); req.destroy(); } else ch.push(c); });
    req.on('end', () => { if (!ch.length) return ok({}); req.raw = Buffer.concat(ch).toString(); try { ok(JSON.parse(req.raw)); } catch (e) { no(bad(400, 'JSON si sahihi')); } });
    req.on('error', no);
  });
}

async function api(req, res, url) {
  try {
    const hit = R.find(([m, re]) => m === req.method && re.test(url.pathname));
    if (!hit) return json(res, R.some(([, re]) => re.test(url.pathname)) ? 405 : 404, { error: 'Haipatikani' });
    const [, re, roles, fn] = hit, ctx = { ip: ipOf(req), query: url.searchParams, params: re.exec(url.pathname).groups || {}, user: null, body: {}, headers: req.headers, raw: '', origin: (TRUST && req.headers['x-forwarded-proto'] || (req.socket.encrypted ? 'https' : 'http')) + '://' + (req.headers['x-forwarded-host'] && TRUST ? req.headers['x-forwarded-host'] : req.headers.host || 'localhost') };
    if (roles) {
      ctx.user = A.verify((req.headers.authorization || '').replace(/^Bearer /, ''));
      if (!ctx.user) return json(res, 401, { error: 'Ingia tena' });
      if (!roles.includes(ctx.user.role)) return json(res, 403, { error: 'Huna ruhusa' });
    }
    if (req.method !== 'GET' && req.method !== 'DELETE') { ctx.body = await readBody(req); ctx.raw = req.raw || ''; }
    const out = await fn(ctx);
    if (out && out.__raw !== undefined) send(res, 200, out.__raw, { 'Content-Type': 'text/plain; charset=utf-8' }); else json(res, 200, out);
  } catch (e) {
    if (!e.status) console.error('[ERR]', req.method, url.pathname, e);
    json(res, e.status || 500, { error: e.status ? e.message : 'Hitilafu ya seva' });
  }
}

function serve(req, res, url) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed');
  let p; try { p = decodeURIComponent(url.pathname); } catch (e) { return send(res, 400, 'Bad request'); }
  if (p === '/') p = '/index.html';
  if (p.includes('\0') || p.includes('/.') || !(OK_ROOT.test(p) || OK_DIR.test(p))) return send(res, 404, '<h1>404</h1><p><a href="/">Nyumbani</a></p>', { 'Content-Type': 'text/html; charset=utf-8' });
  let f = path.normalize(path.join(PUB, p));
  if (f !== PUB && !f.startsWith(PUB + path.sep)) return send(res, 403, 'Forbidden');
  try {
    if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
    else if (!path.extname(f) && fs.existsSync(f + '.html')) f += '.html';
    const st = fs.statSync(f); if (!st.isFile()) throw 0;
    const ext = path.extname(f).toLowerCase(), etag = `W/"${st.size}-${Math.round(st.mtimeMs)}"`;
    const h = { 'Content-Type': MIME[ext] || 'application/octet-stream', ETag: etag, 'Cache-Control': f.includes(path.sep + 'assets' + path.sep) ? 'public, max-age=604800' : 'no-cache' };
    if (req.headers['if-none-match'] === etag) return send(res, 304, '', h);
    res.writeHead(200, { ...SEC, ...(res.cors || {}), ...h, 'Content-Length': st.size });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(f).pipe(res);
  } catch (e) { send(res, 404, '<h1>404</h1><p><a href="/">Nyumbani</a></p>', { 'Content-Type': 'text/html; charset=utf-8' }); }
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  res.cors = corsH(req);
  if (req.method === 'OPTIONS') return send(res, 204, '');
  if (url.pathname.startsWith('/api/')) return api(req, res, url);
  serve(req, res, url);
});
M.start();
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log('Nialike Go Tech online port', PORT));
process.on('SIGTERM', () => server.close(() => process.exit(0)));
