import { kv } from '@vercel/kv';
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    if (req.method === 'GET') {
      const data = await kv.get('ngt_db');
      return res.status(200).json(data || null);
    }
    if (req.method === 'POST') {
      await kv.set('ngt_db', req.body);
      return res.status(200).json({ ok: true });
    }
  } catch (e) {
    return res.status(200).json(null);
  }
}