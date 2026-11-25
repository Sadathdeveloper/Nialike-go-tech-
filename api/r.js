/* GET /api/r?a=yes|no&ev=..&g=.. – kiungo cha RSVP kwa wanaotumiwa ujumbe wa mkono */
const { setRsvp } = require('./_lib');

module.exports = async (req, res) => {
  const { a, ev, g } = req.query;
  const ok = /^(yes|no)$/.test(a || '') && /^[^\s|]{1,80}$/.test(ev || '') && /^[^\s|]{1,80}$/.test(g || '');
  let msg;
  if (!ok) msg = 'Kiungo si sahihi.';
  else {
    try {
      if (!(await setRsvp(g, ev, a))) throw new Error('mgeni');
      msg = a === 'yes' ? 'Asante! Tumepokea jibu lako: utashiriki.' : 'Asante kwa kutujulisha. Tumepokea jibu lako.';
    } catch (e) { msg = 'Tatizo la muda. Jaribu tena baadaye.'; }
  }
  res.setHeader('content-type', 'text/html; charset=utf-8');
  res.status(ok ? 200 : 400).send('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font-family:system-ui;background:#06120b;color:#e8f5ec;display:grid;place-items:center;min-height:100vh;margin:0;text-align:center;padding:20px"><div><h2>Nialike Go Tech</h2><p>' + msg + '</p></div></body>');
};
