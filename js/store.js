/* DATA LAYER - REAL Vercel KV + localStorage fallback */
const DB=(()=>{
const K='ngt_db', API='/api/db';
const uid=p=>p+Math.random().toString(36).slice(2,8).toUpperCase();
let d; 
const blank=()=>({users:[],events:[],guests:[],scans:[],orders:[]});
try{d=JSON.parse(localStorage.getItem(K))}catch(e){}
if(!d)d=blank();

// Load from REAL server on start
fetch(API).then(r=>r.json()).then(remote=>{
  if(remote && remote.users){
    d=remote;
    try{localStorage.setItem(K,JSON.stringify(d))}catch(e){}
    // auto reload portal if loaded
    if(typeof render==='function') try{render()}catch(e){}
  }
}).catch(()=>{});

const save=()=>{
  try{localStorage.setItem(K,JSON.stringify(d))}catch(e){}
  try{
    fetch(API,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(d)
    });
  }catch(e){}
};

function addG(eid,name,phone,o={}){const g={id:uid('G'),eid,name,phone:U.phone(phone),table:o.table||'',status:'pending',code:uid('QR'),at:null,sent:false};d.guests.push(g);save();return g;}

const api={
get(){return d},
get d(){return d},
user:id=>d.users.find(u=>u.id===id),
login:pin=>d.users.find(u=>u.pin===String(pin)),
ev:id=>d.events.find(e=>e.id===id),
eventsOf:u=>u.role==='admin'?d.events:d.events.filter(ev=>u.events.includes(ev.id)),
guests:eid=>d.guests.filter(g=>g.eid===eid),
addEvent(o){const e={id:uid('EV'),...o};d.events.push(e);save();return e;},
addGuest:(eid,n,p,o)=>addG(eid,n,p,o),
delGuest(id){d.guests=d.guests.filter(g=>g.id!==id);save()},
importText(eid,txt){let n=0;txt.split(/\r?\n/).forEach(line=>{line=line.trim();if(!line)return;const parts=line.split(',');const name=parts[0]?.trim();if(!name)return;addG(eid,name,parts[1]||'',{table:parts[2]||''});n++});return n;},
addUser(o){const u={id:uid('U'),events:[],...o};d.users.push(u);save();return u;},
delUser(id){d.users=d.users.filter(u=>u.id!==id);save()},
scan(code,by,allowed){
  const g=d.guests.find(x=>x.code===code||x.id===code);
  let res='invalid'; let r={id:uid('S'),code,by,at:Date.now(),res:'',eid:null,gid:null};
  if(!g)res='invalid';else if(!allowed.includes(g.eid))res='other';else if(g.status==='in')res='dup';else{res='ok';g.status='in';g.at=r.at;}
  r.eid=g?.eid||null;r.gid=g?.id||null;r.res=res;d.scans.push(r);save();return{res,g};
},
manual(gid,by,allowed){const g=d.guests.find(x=>x.id===gid);if(!g)return{res:'invalid'};return api.scan(g.code,by,allowed)},
stats(eid){const g=api.guests(eid),i=g.filter(x=>x.status==='in');return{total:g.length,in:i.length,pending:g.length-i.length,bad:0,pct:g.length?Math.round(i.length/g.length*100):0}},
addOrder(o){d.orders.unshift({id:uid('NGT-'),at:Date.now(),status:'new',...o});save()},
setOrder(id,st){const o=d.orders.find(x=>x.id===id);if(o){o.status=st;save()}},
exportPack(eid){const E=eid?d.events.filter(e=>e.id===eid):d.events;return{v:1,at:Date.now(),events:E,guests:d.guests.filter(g=>eid?g.eid===eid:true),scans:d.scans.filter(s=>eid?s.eid===eid:true),users:d.users}},
importPack(p){if(!p||p.v!==1)throw new Error('Pack si sahihi');let c={e:0,g:0,s:0,u:0};p.events.forEach(e=>{if(!api.ev(e.id)){d.events.push(e);c.e++}});p.guests.forEach(g=>{if(!d.guests.find(x=>x.id===g.id)){d.guests.push(g);c.g++}});p.scans.forEach(s=>{if(!d.scans.some(x=>x.id===s.id)){d.scans.push(s);c.s++}});(p.users||[]).forEach(u=>{if(!api.user(u.id)){d.users.push(u);c.u++}});save();return c;},
reset(){d=blank();save()},
markSent(id){const g=d.guests.find(x=>x.id===id);if(g){g.sent=true;save()}}
};
return api})();

const U={
dl(name,text,type='application/json'){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click()},
csv:rows=>'\ufeff'+rows.map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\n'),
phone:(p)=>String(p).replace(/[\s\-\+]/g,''),
b64:o=>btoa(unescape(encodeURIComponent(JSON.stringify(o)))),
unb64:s=>JSON.parse(decodeURIComponent(escape(atob(s)))),
inviteUrl(g,e){const u=new URL('invite.html',location.href);u.searchParams.set('g',g.id);u.searchParams.set('e',e.id);return u.toString()}
};