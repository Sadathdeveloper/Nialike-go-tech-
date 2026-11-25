/* GET /api/rsvp – jaribio la muunganisho (funguo + Supabase) kutoka Mipangilio */
const { auth, any } = require('./_lib');

module.exports = async (req, res) => {
  if (!auth(req)) return res.status(401).json({ error: 'Funguo si sahihi' });
  try { await any('users'); res.json({ ok: true, rsvp: {} }); }
  catch (e) { res.status(500).json({ error: e.message }); }
};
