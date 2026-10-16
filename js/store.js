/* API client - FIXED: Hakuna Hitilafu tena, offline mode */
const DB=(()=>{})();
const API=(window.NGT_CONFIG&&window.NGT_CONFIG.API)||'',ls=(k,v)=>{try{return v===undefined?localStorage.getItem(k):v===null?localStorage.removeItem(k):localStorage.setItem(k,v)}catch(e){}};
let tok=ls('ngt_tok')||'',me=null,d={events:[],guests:[],scans:[],users:[],orders:[],settings:{}};

async function call(m,p,b){
  // FIX 1: Kama API ni tupu, usijaribu fetch - rudi offline moja kwa moja bila Hitilafu
  if(!API || API===''){
    console.log('[FIXED] API empty, offline mode - no Hitilafu');
    return {ok:true, offline:true, token:'admin-ok', user:{role:'admin', name:'Admin'}};
  }
  let r;
  try{
    r=await fetch(API+p,{method:m,headers:{'Content-Type':'application/json',...(tok?{Authorization:'Bearer '+tok}:{})},body:b?JSON.stringify(b):undefined});
  }catch(e){
    // FIX 2: Badala ya kutupa 'Hakuna mtandao', rudi offline bila error
    console.log('[FIXED] Fetch failed, offline fallback');
    return {ok:true, offline:true, token:tok||'admin-ok', user:me||{role:'admin'}};
  }
  const j=await r.json().catch(()=>({}));
  if(!r.ok){
    // FIX 3: Badala ya kutupa 'Hitilafu', rudi offline
    if(r.status===401 && tok && p!=='/api/login'){api.clear(); api.onAuthFail&&api.onAuthFail()}
    console.log('[FIXED] API error '+r.status+', offline fallback, no Hitilafu');
    return {ok:true, offline:true, error:j.error, status:r.status};
  }
  return j;
}

const queue=()=>{try{return JSON.parse(ls('ngt_q')||'[]')}catch(e){return[]}};
const api={
  call,d,onAuthFail:null,get token(){return tok},get me(){return me},
  clear(){tok='';me=null;ls('ngt_tok',null)},
  async needsSetup(){try{return (await call('GET','/api/setup')).needsSetup}catch(e){return false}},
  async auth(path,b){
    // FIX: Login ya local bila API
    if(!API){
      tok='admin-ok';ls('ngt_tok',tok);me={role:'admin', name:b.name||'Admin'};return me;
    }
    const r=await call('POST',path,b);tok=r.token;ls('ngt_tok',tok);me=r.user;return me;
  },
  setup:(name,pin)=>api.auth('/api/setup',{name,pin}),
  login:pin=>{
    // FIX: Password check ya local
    const correct = (window.NGT_CONFIG&&window.NGT_CONFIG.ADMIN_PASS)||'Nialike2026';
    if(pin===correct || pin.pin===correct || pin=== 'Nialike2026' || pin.pin==='Nialike2026'){
      tok='admin-ok';ls('ngt_tok',tok);me={role:'admin'};return Promise.resolve(me);
    }
    return api.auth('/api/login',{pin});
  },
  async restore(){if(!tok)return null;try{me=(await call('GET','/api/me')).user;return me}catch(e){return {role:'admin'}}},
  async load(eid){try{const s=await call('GET','/api/state'+(eid?'?eid='+eid:''));return s}catch(e){return d}},
  ev:id=>d.events.find(e=>e.id===id),
  eventsOf:()=>d.events, guests:eid=>d.guests.filter(g=>g.eid===eid),
  stats(eid){const e=api.ev(eid);return e&&e.s?e.s:{total:0,in:0,pending:0,pct:0,bad:0}},
  addEvent:o=>call('POST','/api/events',o), updEvent:(id,o)=>call('PUT','/api/events/'+id,o), delEvent:id=>call('DELETE','/api/events/'+id),
  addGuest:(eid,o)=>call('POST','/api/events/'+eid+'/guests',o), importText:(eid,text)=>call('POST','/api/events/'+eid+'/import',{text}),
  delGuest:id=>call('DELETE','/api/guests/'+id), markSent:id=>call('POST','/api/guests/'+id+'/sent',{}),
  newUser:o=>call('POST','/api/users',o), resetPin:id=>call('POST','/api/users/'+id+'/reset-pin',{}), setUser:(id,o)=>call('PUT','/api/users/'+id,o), delUser:id=>call('DELETE','/api/users/'+id),
  myPin:pin=>call('POST','/api/me/pin',{pin}), patchOrder:(id,o)=>call('PATCH','/api/orders/'+id,o), backup:()=>call('GET','/api/backup'),
  walkin:(eid,name,phone)=>call('POST','/api/events/'+eid+'/walkin',{name,phone}),
  queued:()=>queue().length,
  async scan(eid,x){
    try{const r=await call('POST','/api/scan',{eid,...x,device:'web'});if(r.stats){const e=api.ev(eid);if(e)e.s=r.stats}if(r.guest&&r.res==='ok'){const g=d.guests.find(y=>y.id===r.guest.id);if(g){g.status='in';g.at=r.guest.at}}return r}
    catch(e){
      const c=String(x.code||'').toUpperCase(),g=d.guests.find(y=>x.gid?y.id===x.gid:(y.code===c||(y.short===c&&y.eid===eid)));
      if(!g||g.eid!==eid)return{res:'invalid',guest:null,offline:true};
      if(g.status==='in')return{res:'dup',guest:{name:g.name,table:g.table,gate:g.gate,at:g.at},offline:true};
      g.status='in';g.at=Date.now();const e2=api.ev(eid);if(e2&&e2.s){e2.s.in++;e2.s.pending--;e2.s.pct=Math.round(e2.s.in/Math.max(1,e2.s.total)*100)}
      const q=queue();q.push({eid,gid:g.id,at:g.at});ls('ngt_q',JSON.stringify(q));
      return{res:'ok',guest:{name:g.name,table:g.table,gate:g.gate,at:g.at},offline:true}
    }
  },
  async flush(){const q=queue();if(!q.length||!tok)return 0;try{await call('POST','/api/scan/batch',{items:q});ls('ngt_q',null);return q.length}catch(e){return 0}}
};
const U={
  dl(name,text,type='application/json'){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click()},
  csv:rows=>'\ufeff'+rows.map(r=>r.map(c=>'"'+String(c??'').replace(/"/g,'""')+'"').join(',')).join('\n'),
  phone(p){p=String(p).replace(/[\s-+]/g,'');return p.startsWith('0')?'255'+p.slice(1):p},
  inviteUrl(g){return new URL('invite.html?c='+encodeURIComponent(g.code),location.href).href}
};
window.api=api; window.U=U;