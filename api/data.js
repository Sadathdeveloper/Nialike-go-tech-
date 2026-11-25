/* /api/data – hifadhi kuu ya mfumo (Supabase) yenye ulinzi wa PIN
   GET  (x-pin)       -> data ya mtumiaji huyo (Admin: yote; Staff/Client: matukio yao tu)
   POST {ops:[...]}   -> mabadiliko. put/del/import/reset: Admin. scan: Admin/Staff. order: yeyote (tovuti). */
const { auth, C, all, get, put, del, any, clearAll, claim, getIn, ip, rate, who } = require('./_lib');

const send = (res, c, o) => res.status(c).json(o);
const okId = v => v && typeof v === 'object' && typeof v.id === 'string' && v.id.length > 0 && v.id.length <= 80;

module.exports = async (req, res) => {
  try {
    const keyOk = auth(req);
    let me = null;
    try { me = await who(req); }
    catch (e) { if (e.code === 429) return send(res, 429, { error: 'Majaribio mengi. Subiri dakika 10.' }); throw e; }
    const hasUsers = await any('users');
    if (req.headers['x-pin'] && !me && !keyOk && hasUsers) return send(res, 401, { error: 'PIN si sahihi' });

    if (req.method === 'GET') {
      if (!hasUsers) return send(res, 200, { empty: true });
      if (!me && !keyOk) return send(res, 401, { error: 'Ingia kwa PIN' });
      const rows = await Promise.all(C.map(c => all(c)));
      const A = {}; C.forEach((c, i) => { A[c] = rows[i]; });
      let data = A;
      if (me && me.role !== 'admin') {
        const ev = new Set(me.events || []);
        data = { users: [me], events: A.events.filter(e => ev.has(e.id)), guests: A.guests.filter(g => ev.has(g.eid)), scans: A.scans.filter(s => ev.has(s.eid)), orders: [] };
      }
      return send(res, 200, { me: me ? { id: me.id, role: me.role } : null, data });
    }

    if (req.method !== 'POST') return send(res, 405, { error: 'Njia si sahihi' });
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const ops = Array.isArray(body.ops) ? body.ops.slice(0, 500) : [];
    const admin = (me && me.role === 'admin') || keyOk;
    const evOk = id => admin || (me && (me.events || []).includes(id));
    const out = { ok: 0, rej: 0, scan: {} };

    const apply = async o => {
      if (!o || typeof o !== 'object') throw new Error('op');
      if (o.t === 'order') {
        if (!okId(o.v) || JSON.stringify(o.v).length > 20000) throw new Error('order');
        if (!me && !(await rate('ord:' + ip(req), 20, 3600))) throw new Error('rate');
        await put('orders', o.v); return;
      }
      if (o.t === 'put') {
        if (!C.includes(o.c) || !okId(o.v)) throw new Error('put');
        if (!admin && !((o.c === 'guests' || o.c === 'scans') && evOk(o.v.eid))) throw new Error('ruhusa');
        await put(o.c, o.v); return;
      }
      if (o.t === 'del') {
        if (!admin || !C.includes(o.c) || typeof o.id !== 'string') throw new Error('del');
        await del(o.c, o.id); return;
      }
      if (o.t === 'scan') {
        if (!me || !(me.role === 'admin' || me.role === 'staff')) throw new Error('ruhusa');
        const g = await get('guests', String(o.gid));
        if (!g || !evOk(g.eid)) throw new Error('mgeni');
        const at = Number(o.at) || Date.now();
        const first = await claim(g.id, at);
        let sat = at;
        if (first) {
          g.status = 'in'; g.at = at;
          await put('guests', g);
          await put('scans', { id: 'S' + g.id + at, code: o.code, by: me.id, at, res: 'ok', eid: g.eid, gid: g.id });
        } else sat = (await getIn(g.id)) || at;
        if (o.rid) out.scan[o.rid] = { first, at: sat };
        return;
      }
      if (o.t === 'import') {
        if (!admin) throw new Error('ruhusa');
        const d = o.data || {};
        for (const c of C) await put(c, (Array.isArray(d[c]) ? d[c] : []).filter(okId));
        for (const g of (Array.isArray(d.guests) ? d.guests : [])) if (g && g.status === 'in' && okId(g)) await claim(g.id, g.at || Date.now());
        return;
      }
      if (o.t === 'reset') {
        if (!admin) throw new Error('ruhusa');
        await clearAll(); return;
      }
      throw new Error('op');
    };

    for (const o of ops) { try { await apply(o); out.ok++; } catch (e) { out.rej++; } }
    return send(res, 200, out);
  } catch (e) {
    return send(res, 500, { error: e.message });
  }
};
