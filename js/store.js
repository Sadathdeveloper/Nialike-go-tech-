/* API client. Kusoma = cache (haraka); kuandika = seva kisha cache inasasishwa. Hakuna data ya kudumu kwenye kifaa isipokuwa token na foleni ya scans za offline. */
const DB=(()=>{
const API=(window.NGT_CONFIG&&NGT_CONFIG.API)||'',ls=(k,v)=>{try{return v===undefined?localStorage.getItem(k):v===null?localStorage.removeItem(k):localStorage.setItem(k,v)}catch(e){}};
let tok=ls('ngt_tok')||'',me=null,d={events:[],guests:[],scans:[],users:[],orders:[],settings:{}};
async function call(m,p,b){let r;
 try{r=await fetch(API+p,{method:m,headers:{'Content-Type':'application/json',...(tok?{Authorization:'Bearer '+tok}:{})},body:b?JSON.stringify(b):undefined})}
 catch(e){const x=new Error('Hakuna mtandao / No connection');x.offline=true;throw x}
 const j=await r.json().catch(()=>({}));
 if(!r.ok){const x=new Error(j.error||'Hitilafu');x.status=r.status;if(r.status===401&&tok&&p!=='/api/login'){api.clear();api.onAuthFail&&api.onAuthFail()}throw x}
 return j}
const queue=()=>{try{return JSON.parse(ls('ngt_q')||'[]')}catch(e){return[]}};
const api={
call,d,onAuthFail:null,get token(){return tok},get me(){return me},
clear(){tok='';me=null;ls('ngt_tok',null)},
async needsSetup(){return(await call('GET','/api/setup')).needsSetup},
async auth(path,b){const r=await call('POST',path,b);tok=r.token;ls('ngt_tok',tok);me=r.user;return me},
setup:(name,pin)=>api.auth('/api/setup',{name,pin}),login:pin=>api.auth('/api/login',{pin}),
async restore(){if(!tok)return null;me=(await call('GET','/api/me')).user;return me},
async load(eid){const s=await call('GET','/api/state'+(eid?'?eid='+encodeURIComponent(eid):''));
 d.events=s.events;d.guests=s.guests;d.scans=s.scans;d.settings=s.settings||{};d.messaging=s.messaging||null;if(s.users)d.users=s.users;if(s.orders)d.orders=s.orders;return d},
ev:id=>d.events.find(e=>e.id===id),eventsOf:()=>d.events,guests:eid=>d.guests.filter(g=>g.eid===eid),
stats(eid){const e=api.ev(eid);return e&&e.s?e.s:{total:0,in:0,pending:0,pct:0,bad:0}},
/* kuandika */
addEvent:o=>call('POST','/api/events',o),updEvent:(id,o)=>call('PUT','/api/events/'+id,o),delEvent:id=>call('DELETE','/api/events/'+id),
addGuest:(eid,o)=>call('POST',`/api/events/${eid}/guests`,o),importText:(eid,text)=>call('POST',`/api/events/${eid}/import`,{text}),
delGuest:id=>call('DELETE','/api/guests/'+id),markSent:id=>call('POST',`/api/guests/${id}/sent`,{}),
newUser:o=>call('POST','/api/users',o),resetPin:id=>call('POST',`/api/users/${id}/reset-pin`,{}),setUser:(id,o)=>call('PUT','/api/users/'+id,o),delUser:id=>call('DELETE','/api/users/'+id),
myPin:pin=>call('POST','/api/me/pin',{pin}),patchOrder:(id,o)=>call('PATCH','/api/orders/'+id,o),makeEvent:id=>call('POST',`/api/orders/${id}/create-event`,{}),
sendAll:(eid,mode)=>call('POST',`/api/events/${eid}/send`,{mode}),sendOne:id=>call('POST',`/api/guests/${id}/send`,{}),sendStatus:async eid=>{d.send=await call('GET',`/api/events/${eid}/send-status`);return d.send},updGuest:(id,o)=>call('PUT','/api/guests/'+id,o),audit:()=>call('GET','/api/audit'),
saveSettings:o=>call('PUT','/api/settings',o),backup:()=>call('GET','/api/backup'),
walkin:(eid,name,phone)=>call('POST',`/api/events/${eid}/walkin`,{name,phone}),
/* scan: seva ndiyo mwamuzi; mtandao ukikatika tunathibitisha kwa cache na kuweka foleni */
queued:()=>queue().length,
async scan(eid,x){
 try{const r=await call('POST','/api/scan',{eid,...x,device:'web'});if(r.stats){const e=api.ev(eid);if(e)e.s=r.stats}if(r.guest&&r.res==='ok'){const g=d.guests.find(y=>y.id===r.guest.id);if(g){g.status='in';g.at=r.guest.at}}return r}
 catch(e){if(!e.offline)throw e;
  const c=String(x.code||'').toUpperCase(),g=d.guests.find(y=>x.gid?y.id===x.gid:(y.code===c||(y.short===c&&y.eid===eid)));
  if(!g||g.eid!==eid)return{res:'invalid',guest:null,offline:true};
  if(g.status==='in')return{res:'dup',guest:{name:g.name,table:g.table,gate:g.gate,at:g.at},offline:true};
  g.status='in';g.at=Date.now();const e2=api.ev(eid);if(e2&&e2.s){e2.s.in++;e2.s.pending--;e2.s.pct=Math.round(e2.s.in/Math.max(1,e2.s.total)*100)}
  const q=queue();q.push({eid,gid:g.id,at:g.at});ls('ngt_q',JSON.stringify(q));
  return{res:'ok',guest:{name:g.name,table:g.table,gate:g.gate,at:g.at},offline:true}}},
async flush(){const q=queue();if(!q.length||!tok)return 0;try{await call('POST','/api/scan/batch',{items:q});ls('ngt_q',null);return q.length}catch(e){return 0}}
};
return api})();
const U={
dl(name,text,type='application/json'){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click()},
csv:rows=>'\ufeff'+rows.map(r=>r.map(c=>'"'+String(c??'').replace(/"/g,'""')+'"').join(',')).join('\n'),
phone(p){p=String(p).replace(/[\s\-+]/g,'');return p.startsWith('0')?'255'+p.slice(1):p},
inviteUrl(g){return new URL('invite.html?c='+encodeURIComponent(g.code),location.href).href}};
