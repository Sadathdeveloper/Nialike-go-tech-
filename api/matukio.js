import { kv } from '@vercel/kv';
export default async function handler(req, res){
  if(req.method==='GET'){
    const events = await kv.get('nialike_events') || [];
    return res.status(200).json(events);
  }
  if(req.method==='POST'){
    let events = await kv.get('nialike_events') || [];
    events.unshift(req.body);
    await kv.set('nialike_events', events);
    return res.status(200).json({ok:true});
  }
}