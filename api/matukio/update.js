import { kv } from '@vercel/kv';
export default async function handler(req, res){
  if(req.method==='POST'){
    await kv.set('nialike_events', req.body);
    return res.status(200).json({ok:true});
  }
}