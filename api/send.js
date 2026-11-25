/* POST /api/send – inatuma template ya WhatsApp (header ya picha + vitufe) kwa mgeni mmoja */
const { auth, wa } = require('./_lib');

const P = s => String(s == null ? '' : s).replace(/[\r\n\t]+/g, ' ').replace(/ {2,}/g, ' ').trim().slice(0, 900) || '-';
const txt = v => ({ type: 'text', text: P(v) });

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST tu' });
  if (!auth(req)) return res.status(401).json({ error: 'Funguo si sahihi' });
  try {
    const { type, to, guest, event, dr } = req.body || {};
    if (!/^\d{11,15}$/.test(String(to || ''))) throw new Error('Namba si sahihi');
    if (!guest || !event || !dr) throw new Error('Data haijakamilika');
    const site = (process.env.SITE_URL || '').replace(/\/$/, '') || 'https://' + req.headers.host;
    const T = {
      mwaliko: process.env.T_MWALIKO || 'mwaliko_kadi',
      qr: process.env.T_QR || 'kadi_qr',
      kumbusho: process.env.T_KUMBUSHO || 'kumbusho',
      asante: process.env.T_ASANTE || 'asante'
    };
    const jina = String(guest.name || '').toUpperCase();
    const title = String(dr.title || '').replace(/\{JINA\}/g, jina);
    let name, comps;

    if (type === 'mwaliko') {
      if (!event.card) throw new Error('Tukio halina kadi (picha)');
      name = T.mwaliko;
      comps = [
        { type: 'header', parameters: [{ type: 'image', image: { link: site + '/' + String(event.card).replace(/^\//, '') } }] },
        { type: 'body', parameters: [txt(title), txt(dr.body), txt(dr.map || '-'), txt([dr.pay && 'Michango: ' + dr.pay, dr.close].filter(Boolean).join(' '))] },
        { type: 'button', sub_type: 'quick_reply', index: '0', parameters: [{ type: 'payload', payload: 'yes|' + event.id + '|' + guest.id }] },
        { type: 'button', sub_type: 'quick_reply', index: '1', parameters: [{ type: 'payload', payload: 'no|' + event.id + '|' + guest.id }] }
      ];
    } else if (type === 'qr') {
      name = T.qr;
      const img = 'https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=20&format=png&data=' + encodeURIComponent(guest.code || guest.id);
      comps = [
        { type: 'header', parameters: [{ type: 'image', image: { link: img } }] },
        { type: 'body', parameters: [txt(guest.name), txt([event.name, event.date, event.venue].filter(Boolean).join(', ')), txt([guest.table, guest.cat].filter(Boolean).join(' · '))] }
      ];
    } else if (type === 'kumbusho') {
      name = T.kumbusho;
      comps = [{ type: 'body', parameters: [txt(guest.name), txt(dr.body), txt(dr.map || '-'), txt(dr.close)] }];
    } else if (type === 'asante') {
      name = T.asante;
      comps = [{ type: 'body', parameters: [txt(guest.name), txt(dr.body), txt(dr.close)] }];
    } else throw new Error('Aina ya ujumbe haijulikani');

    const j = await wa({ to, type: 'template', template: { name, language: { code: 'sw' }, components: comps } });
    res.json({ ok: true, id: j.messages && j.messages[0] && j.messages[0].id });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};
