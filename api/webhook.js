/* /api/webhook?k=WEBHOOK_SECRET – Meta inatuma majibu ya vitufe (Nitashiriki / Sitashiriki) hapa */
const { setRsvp, wa } = require('./_lib');

module.exports = async (req, res) => {
  const secret = process.env.WEBHOOK_SECRET || '';
  if (!secret || (req.query.k || '') !== secret) return res.status(403).end('forbidden');

  if (req.method === 'GET') {
    if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === process.env.WA_VERIFY_TOKEN)
      return res.status(200).send(req.query['hub.challenge']);
    return res.status(403).end('forbidden');
  }

  try {
    const msgs = [];
    ((req.body && req.body.entry) || []).forEach(en => (en.changes || []).forEach(c => ((c.value && c.value.messages) || []).forEach(m => msgs.push(m))));
    for (const m of msgs) {
      const pl = (m.button && m.button.payload) || (m.interactive && m.interactive.button_reply && m.interactive.button_reply.id) || '';
      const [a, ev, gid] = pl.split('|');
      if (!/^(yes|no)$/.test(a || '') || !ev || !gid) continue;
      if (!(await setRsvp(gid, ev, a))) continue;
      try {
        await wa({ to: m.from, type: 'text', text: { body: a === 'yes' ? 'Asante! Tumepokea jibu lako, tunakusubiri.' : 'Asante kwa kutujulisha. Tumepokea jibu lako.' } });
      } catch (e) { /* jibu la shukrani ni la hiari */ }
    }
  } catch (e) { console.error(e); }
  res.status(200).end('ok');
};
