/* store.js - FIXED - DATA LAYER – cache ya kifaa + cloud (Redis). PIN inathibitishwa na seva (/api/data). */
const DB=(()=>{
const K='ngt_db',QK='ngt_q',API='/api/data',CS=['users','events','guests','scans','orders'];
const uid=p=>p+Math.random().toString(36).slice(2,8).toUpperCase();
const blank=()=>({users:[],events:[],guests:[],scans:[],orders:[]});
let d;try{d=JSON.parse(localStorage.getItem(K))}catch(e){}
if(!d||typeof d!=='object')d=blank();
CS.forEach(c=>{if(!Array.isArray(d[c]))d[c]=[]});
let Q=[];try{Q=JSON.parse(localStorage.getItem(QK))||[]}catch(e){}
let pin='';try{pin=sessionStorage.getItem('ngt_pin')||''}catch(e){}
let lastS='',flushing=false,tm=null,blocked401=false;
const cache=()=>{try{localStorage.setItem(K,JSON.stringify(d))}catch(e){}};
const saveQ=()=>{try{localStorage.setItem(QK,JSON.stringify(Q))}catch(e){}};
const H=()=>{const h={'Content-Type':'application/json'};if(pin)h['x-pin']=pin;try{const k=localStorage.getItem('ngt_key');if(k)h['x-portal-key']=k}catch(e){}return h};
const sched=ms=>{clearTimeout(tm);tm=setTimeout(flush,ms||400)};
const op=o=>{Q.push(o);saveQ();cache();sched()};
const put=(c,v)=>op({t:'put',c,v});
const del=(c,id)=>op({t:'del',c,id});
const authFail=()=>{blocked401=true;api.authFailed=true;if(api.onAuth)api.onAuth()};

async function flush(){
  if(flushing||!Q.length||blocked401)return;flushing=true;
  const n=Math.min(Q.length,200),batch=Q.slice(0,n);
  try{
    const r=await fetch(API,{method:'POST',headers:H(),body:JSON.stringify({ops:batch})});
    if(r.status===401){authFail();return}
    if(r.status===429||r.status>=500)throw new Error('retry');
    Q.splice(0,n);saveQ();
    if(Q.length)sched(100);
  }catch(e){sched(15000)}
  finally{flushing=false}
}

const rec=(code,by,res,g)=>({id:uid('S'),code,by,at:Date.now(),res,eid:g?g.eid:null,gid:g?g.id:null});
function localScan(code,by,allowed){
  const g=d.guests.find(x=>x.code===code||x.id===code);
  let res;
  if(!g)res='invalid';else if(!allowed.includes(g.eid))res='other';else if(g.status==='in')res='dup';
  else{res='ok';g.status='in';g.at=Date.now();put('guests',g)}
  const r=rec(code,by,res,g);d.scans.push(r);put('scans',r);return{res,g};
}

function addG(eid,name,phone,o={}){
  const g={id:uid('G'),eid,name,phone:U.phone(phone),table:o.table||'',cat:o.cat||'Kawaida',pax:o.pax||1,status:'pending',code:uid('QR'),at:null,sent:false};
  d.guests.push(g);put('guests',g);return g;
}

const api={
cloud:'',authFailed:false,onChange:null,onAuth:null,
get d(){return d},
load(){return d},
loadRemote(){return Promise.resolve(d)},
setPin(p){pin=String(p||'');blocked401=false;try{if(pin)sessionStorage.setItem('ngt_pin',pin);else sessionStorage.removeItem('ngt_pin')}catch(e){}api.authFailed=false;if(pin)sched(300)},
user:id=>d.users.find(u=>u.id===id),
login(p){console.warn('login() imezimwa - tumia loginRemote()');return null},
async loginRemote(p){
  let r;
  try{r=await fetch(API,{headers:{'x-pin':String(p)}})}catch(e){throw new Error('Hakuna mtandao. Unganisha intaneti ili kuingia kwa mara ya kwanza kwenye kifaa hiki.')}
  if(r.status===401)return null;
  if(r.status===429)throw new Error('Majaribio mengi. Subiri dakika 10.');
  if(!r.ok)throw new Error('Seva imeshindwa (HTTP '+r.status+').');
  const j=await r.json();if(j.empty||!j.me)return null;
  d=Object.assign(blank(),j.data);cache();lastS=JSON.stringify(j.data);api.cloud='ok';api.setPin(p);
  return d.users.find(u=>u.id===j.me.id)||null;
},
async pull(){
  if(!pin)return false;
  try{
    const r=await fetch(API,{headers:H()});
    if(r.status===401){authFail();return false}
    if(!r.ok)return false;
    const j=await r.json();
    if(j.empty){api.cloud='empty';return false}
    api.cloud='ok';
    await flush();if(Q.length)return false;
    const s=JSON.stringify(j.data);if(s===lastS)return false;
    lastS=s;d=Object.assign(blank(),j.data);cache();
    if(api.onChange)api.onChange();return true;
  }catch(e){return false}
},
async pushAll(){
  const r=await fetch(API,{method:'POST',headers:H(),body:JSON.stringify({ops:[{t:'import',data:d}]})});
  const j=await r.json().catch(()=>({}));
  if(!r.ok||j.rej)throw new Error(j.error||(j.rej?'Seva imekataa (funguo si sahihi?)':'HTTP '+r.status));
  api.cloud='ok';return true;
},
flush,
ev:id=>d.events.find(e=>e.id===id),
eventsOf:u=>u.role==='admin'?d.events:d.events.filter(ev=>(u.events||[]).includes(ev.id)),
guests:eid=>d.guests.filter(g=>g.eid===eid),
addEvent(o){const e={id:uid('EV'),...o};d.events.push(e);put('events',e);return e},
addGuest:(eid,n,p,o)=>addG(eid,n,p,o),
updGuest(id,patch){const g=d.guests.find(x=>x.id===id);if(g){Object.assign(g,patch);put('guests',g)}return g},
delGuest(id){d.guests=d.guests.filter(g=>g.id!==id);del('guests',id)},
importText(eid,txt){let n=0;txt.split(/\r?\n/).forEach(line=>{line=line.trim();if(!line)return;const parts=line.split(',');const name=parts[0]?.trim();if(!name)return;addG(eid,name,parts[1]||'',{table:parts[2]||''});n++});return n},
addUser(o){const u={id:uid('U'),events:[],...o};d.users.push(u);put('users',u);return u},
delUser(id){d.users=d.users.filter(u=>u.id!==id);del('users',id)},
scan:localScan,
async scanA(code,by,allowed){
  const g=d.guests.find(x=>x.code===code||x.id===code);
  if(!g||!allowed.includes(g.eid)||g.status==='in')return localScan(code,by,allowed);
  const at=Date.now();let first=true,sat=at;
  try{
    await flush();
    const c=new AbortController(),t=setTimeout(()=>c.abort(),3500);
    const r=await fetch(API,{method:'POST',headers:H(),body:JSON.stringify({ops:[{t:'scan',gid:g.id,code,by,at,eid:g.eid,rid:'r'}]}),signal:c.signal});
    clearTimeout(t);
    if(r.status===401)authFail();
    if(!r.ok)throw new Error('x');
    const j=await r.json(),s=j.scan&&j.scan.r;
    if(s){first=!!s.first;sat=s.at||at}
  }catch(e){Q.push({t:'scan',gid:g.id,code,by,at,eid:g.eid});saveQ();sched(8000)}
  if(!first){g.status='in';g.at=sat;d.scans.push(rec(code,by,'dup',g));cache();return{res:'dup',g}}
  g.status='in';g.at=at;d.scans.push(rec(code,by,'ok',g));cache();return{res:'ok',g};
},
manual(gid,by,allowed){const g=d.guests.find(x=>x.id===gid);if(!g)return{res:'invalid'};return localScan(g.code,by,allowed)},
manualA(gid,by,allowed){const g=d.guests.find(x=>x.id===gid);if(!g)return Promise.resolve({res:'invalid'});return api.scanA(g.code,by,allowed)},
stats(eid){const g=api.guests(eid),i=g.filter(x=>x.status==='in');return{total:g.length,in:i.length,pending:g.length-i.length,bad:0,pct:g.length?Math.round(i.length/g.length*100):0}},
addOrder(o){const v={id:uid('NGT-'),at:Date.now(),status:'new',...o};d.orders.unshift(v);op({t:'order',v})},
setOrder(id,st){const o=d.orders.find(x=>x.id===id);if(o){o.status=st;put('orders',o)}},
exportPack(eid){const E=eid?d.events.filter(e=>e.id===eid):d.events;const safeUsers=(d.users||[]).map(u=>{const {pin,...rest}=u;return rest});return{v:1,at:Date.now(),events:E,guests:d.guests.filter(g=>eid?g.eid===eid:true),scans:d.scans.filter(s=>eid?s.eid===eid:true),users:safeUsers}},
importPack(p){
  if(!p||p.v!==1)throw new Error('Pack si sahihi');
  let c={e:0,g:0,s:0,u:0};
  p.events.forEach(e=>{if(!api.ev(e.id)){d.events.push(e);put('events',e);c.e++}});
  p.guests.forEach(g=>{if(!d.guests.find(x=>x.id===g.id)){d.guests.push(g);put('guests',g);c.g++}});
  p.scans.forEach(s=>{if(!d.scans.some(x=>x.id===s.id)){d.scans.push(s);put('scans',s);c.s++}});
  (p.users||[]).forEach(u=>{if(!api.user(u.id)){d.users.push(u);put('users',u);c.u++}});
  cache();return c;
},
reset(){d=blank();Q=[{t:'reset'}];saveQ();cache();lastS='';sched(200)},
markSent(id){const g=d.guests.find(x=>x.id===id);if(g){g.sent=true;put('guests',g)}}
};
if(Q.length)sched(1500);
return api})();

const U={
dl(name,text,type='application/json'){const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000)},
csv:rows=>'\ufeff'+rows.map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\n'),
phone:(p)=>{let s=String(p||'').replace(/[\s\-]/g,'');if(s.startsWith('00'))s='+'+s.slice(2);if(s.startsWith('0')&&s.length===10)s='+255'+s.slice(1);return s},
b64:o=>{const s=JSON.stringify(o);const bytes=new TextEncoder().encode(s);let bin='';bytes.forEach(b=>bin+=String.fromCharCode(b));return btoa(bin)},
unb64:s=>{const bin=atob(s);const bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);return JSON.parse(new TextDecoder().decode(bytes))},
inviteUrl(g,e){const u=new URL('invite.html',location.href);u.searchParams.set('g',g.id);u.searchParams.set('e',e.id);return u.toString()}
};