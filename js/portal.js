/* PORTAL v2 – Admin / Staff (QR Scanner) / Client – localStorage only */
const $=s=>document.querySelector(s),E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const CARDS=['Blush Floral QR','Lace & Ribbon','Golden Rose','Ivory & Emerald','Emerald Heritage','Forest Duo','Crimson Romance'];
const S={u:null,eid:null,tab:'events',q:''};let stream=null,timer=null,last='',lastAt=0;
try{const i=sessionStorage.getItem('ngt_u');if(i)S.u=DB.user(i)}catch(e){}
const T=t=>t?new Date(t).toLocaleTimeString('sw-TZ',{hour:'2-digit',minute:'2-digit'}):'—';
const D=t=>t?new Date(t).toLocaleDateString('sw-TZ'):'—';
const val=id=>($('#'+id)||{}).value||'';

function stop(){clearInterval(timer);if(stream){stream.getTracks().forEach(t=>t.stop());stream=null}}

/* ─── RENDER ─── */
function render(){
  stop();const a=$('#app');
  if(!DB.d.users.some(u=>u.role==='admin')){
    if(!location.search.includes('master=NIALIKE2024')){
      a.innerHTML=`<div class="login"><div class="logo-lg">Nialike <i>Go Tech</i></div><p class="m" style="color:#f87171">⛔ System imefungwa. Wasiliana na Admin mkuu.</p></div>`;
      return;
    }
    a.innerHTML=`<div class="login">
      <div class="logo-lg">Nialike <i>Go Tech</i></div>
      <p class="m">Tengeneza akaunti ya Admin (mara ya kwanza tu)</p>
      <input id="s_name" placeholder="Jina lako kamili">
      <input id="s_pin" type="password" inputmode="numeric" placeholder="PIN (tarakimu 4–8)">
      <input id="s_pin2" type="password" inputmode="numeric" placeholder="Rudia PIN">
      <button class="b full" data-a="setup">Tengeneza akaunti ya Admin</button>
    </div>`;
    return;
  }
  if(!S.u){
    a.innerHTML=`<div class="login">
      <div class="logo-lg">Nialike <i>Go Tech</i></div>
      <p class="m">Ingiza PIN yako</p>
      <p class="m" style="margin-bottom:8px;font-size:.7rem">Admin · Msimamizi wa Mlango · Mteja</p>
      <input id="pin" type="password" inputmode="numeric" placeholder="••••••" autofocus>
      <button class="b full" data-a="login">Ingia</button>
    </div>`;
    return;
  }
  const u=S.u,adm=u.role==='admin';
  const tabs=adm&&!S.eid?[['events','🏷 Matukio'],['users','👤 Watumiaji'],['orders','📦 Maagizo'],['sync','🔄 Sync']]:[];
  const warn=adm&&NGT_CONFIG.MODE==='local'?`<div class="warn">⚠ Data iko kwenye kifaa hiki tu. Backend haijaungwa. Tumia <b>Sync</b> kuhamisha kati ya vifaa.</div>`:'';
  a.innerHTML=
    `<header>
      <b>Nialike <i>Go Tech</i></b>
      <span>${E(u.name)} <em class="role">${u.role}</em></span>
      <button class="b o s" data-a="out">Toka</button>
    </header>`+warn+
    (tabs.length?`<nav>${tabs.map(([k,l])=>`<button data-a="tab" data-k="${k}" class="${S.tab===k?'on':''}">${l}</button>`).join('')}</nav>`:'')+
    `<main>${body()}</main>`;
  if(u.role==='staff'&&S.eid)startCam();
}

/* ─── BODY ─── */
function body(){
  const u=S.u,ev=DB.eventsOf(u);
  if(u.role!=='admin'&&!S.eid){
    if(ev.length===1){S.eid=ev[0].id;return body()}
    return `<h2>Chagua tukio lako</h2>`+
      (ev.map(e=>`<div class="c"><b>${E(e.name)}</b><p class="m">📅 ${e.date} ${e.time} · 📍 ${E(e.venue)} · 📦 ${E(e.pkg)}</p><button class="b" data-a="open" data-id="${e.id}">Fungua →</button></div>`).join('')||
      `<div class="c"><p class="m">Hujapangiwa tukio. Omba admin akupangie tukio na PIN yako.</p></div>`)+vSync();
  }
  if(S.eid)return u.role==='staff'?vScan():vEvent();
  return {events:vEvents,users:vUsers,orders:vOrders,sync:vSync}[S.tab]();
}

/* ─── ADMIN: MATUKIO ─── */
function vEvents(){
  const evs=DB.d.events;
  return `<h2>Matukio (${evs.length})</h2>`+
  evs.map(e=>{const s=DB.stats(e.id);return`<div class="c ev-card">
    <div class="ev-top"><div><b>${E(e.name)}</b><p class="m">📅 ${e.date} ${e.time} · 📍 ${E(e.venue)}</p><p class="m">📦 ${E(e.pkg)} · 🎨 ${E(CARDS[parseInt(e.card?.match(/card(\d)/)?.[1]||1)-1]||'—')}</p></div>
    <button class="b" data-a="open" data-id="${e.id}">Fungua →</button></div>
    <div class="bar"><i style="width:${s.pct}%"></i></div>
    <div class="ev-stats"><span>👥 ${s.total} walioalikwa</span><span>✓ ${s.in} walioingia</span><span>⏳ ${s.pending} wanasubiri</span><span>📊 ${s.pct}%</span></div>
  </div>`}).join('')+
  `<h3>+ Ongeza Tukio Jipya</h3>
  <div class="c">
    <div class="row"><input id="n_name" placeholder="Jina la tukio *"><input id="n_type" placeholder="Aina (Harusi, Send-Off, Birthday...)"></div>
    <div class="row"><input id="n_date" type="date"><input id="n_time" type="time"></div>
    <input id="n_venue" placeholder="Mahali / Venue *">
    <div class="row">
      <select id="n_pkg"><option>Basic</option><option selected>Standard</option><option>Premium</option></select>
      <select id="n_card">${CARDS.map((c,i)=>`<option value="${i+1}">${c}</option>`).join('')}</select>
    </div>
    <button class="b" data-a="newev">💾 Hifadhi Tukio</button>
  </div>`;
}

/* ─── ADMIN: WATUMIAJI ─── */
function vUsers(){
  return `<h2>Watumiaji (${DB.d.users.length})</h2>
  <p class="m" style="margin-bottom:12px">Msimamizi = anascan QR mlangoni. Mteja = anaona dashboard ya tukio lake.</p>`+
  DB.d.users.map(u=>`<div class="g">
    <div><b>${E(u.name)}</b> <span class="tag">${u.role}</span>
    <p class="m">PIN: <code>${E(u.pin)}</code> · Matukio: ${u.events.map(id=>E((DB.ev(id)||{}).name||id)).join(', ')||'—'}</p></div>
    ${u.role!=='admin'?`<button class="b r s" data-a="deluser" data-id="${u.id}">✕ Futa</button>`:'<span class="m">Admin</span>'}
  </div>`).join('')+
  `<h3>+ Mtumiaji Mpya</h3>
  <div class="c">
    <div class="row"><input id="u_name" placeholder="Jina *"><input id="u_pin" inputmode="numeric" placeholder="PIN (tarakimu 4+) *"></div>
    <select id="u_role"><option value="staff">👁 Msimamizi wa Mlango (Staff)</option><option value="client">📱 Mteja (Client)</option></select>
    <p class="m" style="margin:8px 0">Panga kwa matukio:</p>
    <div class="chk-group">${DB.d.events.map(e=>`<label class="chk"><input type="checkbox" class="u_ev" value="${e.id}"> ${E(e.name)}</label>`).join('')}</div>
    <button class="b" style="margin-top:10px" data-a="newuser">+ Ongeza Mtumiaji</button>
  </div>`;
}

/* ─── ADMIN: MAAGIZO (Orders from website) ─── */
function vOrders(){
  const orders=DB.d.orders;
  const badge=s=>s==='done'?'<span class="tag in">✓ Imefanywa</span>':s==='cancelled'?'<span class="tag bad">Imekataliwa</span>':'<span class="tag new">🔔 Mpya</span>';
  return `<h2>Maagizo (${orders.length})</h2>
  <p class="m" style="margin-bottom:12px">Maagizo yanayokuja kutoka tovuti. Bofya "Tengeneza Tukio" kuongeza tukio na PIN ya mteja moja kwa moja.</p>`+
  (orders.length===0?`<div class="c"><p class="m">Hakuna maagizo bado. Maagizo yataonekana hapa baada ya wateja kutuma fomu kwenye tovuti.</p></div>`:'')+
  orders.map(o=>`<div class="c order-card">
    <div class="order-top">
      <div><b>${E(o.eventName||'—')}</b> ${badge(o.status)}</div>
      <span class="m">${D(o.at)}</span>
    </div>
    <div class="order-grid">
      <div><span class="m">Mteja</span><b>${E(o.name)}</b></div>
      <div><span class="m">Simu</span><b><a href="tel:${E(o.phone)}">${E(o.phone)}</a></b></div>
      <div><span class="m">Pakiti</span><b>${E(o.pkg)}</b></div>
      <div><span class="m">Kadi</span><b>${E(o.card||'—')}</b></div>
      <div><span class="m">Tarehe</span><b>${E(o.date)}</b></div>
      <div><span class="m">Mahali</span><b>${E(o.venue)}</b></div>
      <div><span class="m">Malipo</span><b>${E(o.pay||'—')}</b></div>
      <div><span class="m">Wageni (kwenye fomu)</span><b>${o.guests?.length||0}</b></div>
    </div>
    ${o.guests?.length?`<details><summary class="m">Ona orodha ya wageni (${o.guests.length})</summary><div class="gl-preview">${o.guests.map((g,i)=>`<div class="g-row"><span>${i+1}. ${E(g)}</span></div>`).join('')}</div></details>`:''}
    ${o.status==='new'?`<div class="row" style="margin-top:10px">
      <button class="b" data-a="mkev" data-id="${o.id}">⚡ Tengeneza Tukio + PIN ya Mteja</button>
      <a class="b o" href="https://wa.me/${U.phone(o.phone)}?text=${encodeURIComponent('Habari '+o.name+', agizo lako la '+o.eventName+' limepokelewa. Tutawasiliana nawe hivi karibuni. – Nialike Go Tech')}" target="_blank" rel="noopener">💬 WhatsApp Mteja</a>
      <button class="b r" data-a="cancelorder" data-id="${o.id}">✕ Kataa</button>
    </div>`:''}
  </div>`).join('');
}

/* ─── SYNC ─── */
function vSync(){
  if(S.u?.role==='client') return '';
  return `<h2>Sync - Kuhamisha Data</h2>
  <p class="m" style="margin-bottom:14px">Data iko kwenye kifaa hiki tu. Hamisha kati ya vifaa kwa faili la JSON.</p>
  <div class="c">
    <h3>Tuma data (admin → msimamizi)</h3>
    <p class="m">Admin anatuma "pack" ya tukio kwa msimamizi wa mlango – ina wageni na QR codes.</p>
    ${S.u?.role!=='client'?`<button class="b o" data-a="expev">↓ Pack (Sync)</button>`:''}
    <button class="b o" data-a="expall" style="margin-top:8px">⬇ Data Yote</button>
  </div>
  <div class="c">
    <h3>Pokea data (msimamizi → admin)</h3>
    <p class="m">Msimamizi anatuma scans zake kwa admin baada ya tukio.</p>
   ${S.u?.role!=='client'?`<label class="b o" style="cursor:pointer">↑ Ingiza Pack<input type="file" accept=".json" hidden data-a="impfile"></label>`:''}
  </div>
  ${S.u?.role==='admin'?`<div class="c" style="border-color:rgba(239,68,68,.3)">
    <h3 style="color:#f87171">Hatari: Futa Data</h3>
    <p class="m">Hii itafuta MATUKIO, WAGENI, na SCANS zote kwenye kifaa hiki. Usifanye bila backup.</p>
    <button class="b r" data-a="reset">🗑 Futa Data Yote</button>
  </div>`:''}`;
}

/* ─── EVENT VIEW (Admin/Client) ─── */
function rows(){
  const q=S.q.toLowerCase(),adm=S.u.role==='admin';
  const filtered=DB.guests(S.eid).filter(g=>(g.name+g.phone+g.table).toLowerCase().includes(q));
  if(!filtered.length)return `<p class="m">Hakuna wageni ${q?'wanaolingana na utafutaji':'bado'}.</p>`;
  return filtered.map(g=>`<div class="g">
    <div>
      <b>${E(g.name)}</b>
      <div class="m">${E(g.phone)||'—'} ${g.table?'· Meza '+E(g.table):''}</div>
    </div>
    <div class="g-right">
      <span class="tag ${g.status==='in'?'in':''}">${g.status==='in'?'✓ '+T(g.at):'⏳ anasubiri'}</span>
      ${g.sent?'<span class="tag in" style="font-size:.6rem">📨 imetumwa</span>':''}
      ${adm?`<div class="row" style="margin:0;gap:4px">
        <button class="b o s" data-a="card" data-id="${g.id}" title="Ona kadi">🎫</button>
        <button class="b o s" data-a="wa" data-id="${g.id}" title="Tuma WhatsApp">💬</button>
        <button class="b r s" data-a="delg" data-id="${g.id}" title="Futa">✕</button>
      </div>`:''}
    </div>
  </div>`).join('');
}

function stats(){
  const s=DB.stats(S.eid);
  return `<div class="st">
    <div><b>${s.total}</b>Walioalikwa</div>
    <div><b style="color:var(--g)">${s.in}</b>Walioingia</div>
    <div><b>${s.pending}</b>Wanasubiri</div>
    <div><b style="color:${s.bad?'#f87171':'inherit'}">${s.bad}</b>Zilizokataliwa</div>
  </div>
  <div class="bar"><i style="width:${s.pct}%"></i></div>
  <p class="m">${s.pct}% wamefika · Ilisasishwa ${new Date().toLocaleTimeString('sw-TZ',{hour:'2-digit',minute:'2-digit'})}</p>`;
}

function vEvent(){
  const e=DB.ev(S.eid),adm=S.u.role==='admin';
  return `<button class="b o s" data-a="back">← Rudi</button>
  <h2>${E(e.name)}</h2>
  <p class="m">📅 ${e.date} ${e.time} · 📍 ${E(e.venue)} · 📦 ${E(e.pkg)}</p>
  <div id="stats">${stats()}</div>
  <div class="row" style="margin-top:14px">
    <button class="b o" data-a="csv">⬇ CSV Ripoti</button>
    <button class="b o" onclick="print()">🖨 Print</button>
    <button class="b o" data-a="expev">⬇ Pack (Sync)</button>
    <label class="b o" style="cursor:pointer">⬆ Ingiza Pack<input type="file" accept=".json" hidden data-a="impfile"></label>
    ${adm?`<button class="b" data-a="queue">📨 Tuma Mialiko (Foleni)</button>
    <button class="b o" data-a="cards">⬇ Kadi Zote</button>
    <button class="b o" data-a="links">⬇ Links CSV</button>`:''}
  </div>
  ${adm?`<h3>Ongeza Wageni</h3>
  <div class="c">
    <div class="row"><input id="g_n" placeholder="Jina *"><input id="g_p" type="tel" placeholder="0712... (hiari)"><input id="g_t" placeholder="Meza (hiari)"><button class="b" data-a="addg">+ Ongeza</button></div>
    <textarea id="g_bulk" rows="4" placeholder="Bandika orodha nyingi (kila mstari: Jina, Namba, Meza)&#10;Mfano:&#10;Amina Juma, 0712345678, Meza 5&#10;Baraka Ali, 0755123456"></textarea>
    <div class="row">
      <button class="b o" data-a="bulk">📋 Ingiza Orodha</button>
      <label class="b o" style="cursor:pointer">📁 Pakia CSV/TXT<input type="file" accept=".csv,.txt" hidden data-a="csvfile"></label>
    </div>
  </div>`:''}
  <h3>Orodha ya Wageni</h3>
  <input id="q" placeholder="🔍 Tafuta jina, namba, au meza..." value="${E(S.q)}" style="margin-bottom:10px">
  <div id="gt">${rows()}</div>`;
}

/* ─── STAFF QR SCANNER ─── */
function vScan(){
  const e=DB.ev(S.eid);
  return `${DB.eventsOf(S.u).length>1?'<button class="b o s" data-a="back">← Matukio</button>':''}
  <h2>🔲 Scan – ${E(e.name)}</h2>
  <div id="stats">${stats()}</div>
  <div class="cam">
    <video id="v" playsinline muted></video>
    <div id="res" class="res">📷 Elekeza QR kwenye kamera</div>
  </div>
  <div class="row" style="margin-top:10px">
    <input id="code" placeholder="Au andika code ya QR mwenyewe...">
    <button class="b" data-a="code">✓ Thibitisha</button>
  </div>
  <h3 style="margin-top:18px">Tafuta / Ingiza kwa Mkono</h3>
  <input id="q" placeholder="🔍 Tafuta jina au namba..." value="${E(S.q)}">
  <div id="gt" style="margin-top:10px">${rows2()}</div>
  <div class="c" style="margin-top:14px">
    <h3>Mgeni asiye kwenye orodha (Walk-in)</h3>
    <div class="row">
      <input id="w_n" placeholder="Jina la mgeni *">
      <input id="w_p" type="tel" placeholder="Namba (hiari)">
      <button class="b" data-a="walk">+ Ingiza</button>
    </div>
  </div>
  <div class="row" style="margin-top:14px">
    <button class="b o" data-a="expev">⬇ Tuma Scans kwa Admin</button>
    <label class="b o" style="cursor:pointer">⬆ Pokea Pack ya Admin<input type="file" accept=".json" hidden data-a="impfile"></label>
  </div>`;
}

function rows2(){
  const q=S.q.toLowerCase();
  const list=DB.guests(S.eid).filter(g=>q?(g.name+g.phone).toLowerCase().includes(q):g.status!=='in').slice(0,30);
  if(!list.length&&!q)return`<p class="m">Wageni wote wameingia ✓</p>`;
  if(!list.length)return`<p class="m">Hakuna matokeo ya "${E(q)}"</p>`;
  return list.map(g=>`<div class="g">
    <div><b>${E(g.name)}</b><div class="m">${E(g.phone)||'—'} ${g.table?'· '+E(g.table):''}</div></div>
    ${g.status==='in'
      ?`<span class="tag in">✓ ${T(g.at)}</span>`
      :`<button class="b s" data-a="man" data-id="${g.id}">✓ Ingiza</button>`}
  </div>`).join('');
}

async function startCam(){
  const r=$('#res');
  if(!('BarcodeDetector' in window)||!navigator.mediaDevices){
    r.innerHTML='📵 Kamera ya QR haipatikani hapa.<br><small>Tumia Chrome/Edge kwenye Android, au andika code mwenyewe hapo juu.</small>';
    return;
  }
  try{
    stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment',width:{ideal:1280}}});
    const v=$('#v');v.srcObject=stream;await v.play();
    const det=new BarcodeDetector({formats:['qr_code']});
    timer=setInterval(async()=>{
      try{const f=await det.detect(v);if(f[0]){const c=f[0].rawValue;if(c!==last||Date.now()-lastAt>3000){last=c;lastAt=Date.now();handle(c)}}}catch(e){}
    },300);
  }catch(e){r.innerHTML='🚫 Ruhusa ya kamera imekataliwa.<br><small>Ruhusa kamera kwenye mipangilio ya kivinjari, kisha reload.</small>';}
}

function show(r){
  const el=$('#res'),g=r.g;if(!el)return;
  const m={
    ok:['ok','✅ RUHUSA YA KUINGIA',`${E(g?.name)}<small>${[g?.table,g?.gate].filter(Boolean).join(' · ')}</small>`],
    dup:['bad','⚠ AMEKWISHA INGIA',`${E(g?.name)}<small>Aliingia saa ${T(g?.at)}</small>`],
    invalid:['bad','❌ QR SI SAHIHI','Haipo kwenye mfumo. Angalia ID.'],
    other:['bad','⛔ SI TUKIO HILI','Mgeni ni wa tukio lingine.']
  }[r.res];
  el.className='res '+m[0];
  el.innerHTML=m[1]+'<small style="font-size:1.05rem;font-weight:700;display:block;margin-top:4px">'+m[2]+'</small>';
  navigator.vibrate&&navigator.vibrate(r.res==='ok'?[100]:[200,80,200]);
  try{$('#stats').innerHTML=stats();$('#gt').innerHTML=rows2()}catch(e){}
}
const handle=c=>show(DB.scan(c.trim(),S.u.id,[S.eid]));

/* ─── DIALOG ─── */
const dlg=h=>{
  const d=$('#dg');
  d.innerHTML=h+`<div class="row" style="justify-content:center;margin-top:14px"><button class="b o" onclick="document.getElementById('dg').close()">Funga</button></div>`;
  d.showModal();
};
const gst=id=>DB.d.guests.find(g=>g.id===id);
const dlimg=async(g,e)=>{const b=await cardPng(g,e);return{b,u:URL.createObjectURL(b),f:g.name.replace(/\W+/g,'_')+'.png'}};
const msg=(g,e)=>`Habari ${g.name},\n\nUmealikwa kwenye: *${e.name}*\n📅 ${e.date} saa ${e.time}\n📍 ${e.venue}\n\n🎫 Fungua mwaliko wako na QR ya kuingia:\n${U.inviteUrl(g,e)}\n\nTunaomba uwe muda mzuri.\n– Nialike Go Tech`;

/* ─── WhatsApp QUEUE ─── */
const Q={l:[],i:0};
function qStep(){
  const g=Q.l[Q.i];
  if(!g){dlg('<h3>✅ Imekamilika!</h3><p class="m">Wageni wote kwenye foleni wameshughulikiwa.</p>');return}
  dlg(`<p class="m">${Q.i+1} / ${Q.l.length}</p>
  <h3>${E(g.name)}</h3>
  <p class="m">📱 ${E(g.phone)}</p>
  <div class="row" style="justify-content:center;margin-top:12px">
    <button class="b" data-a="qsend">💬 Tuma WhatsApp</button>
    <button class="b o" data-a="qshare">🖼 Share Kadi</button>
    <button class="b o" data-a="qskip">Ruka →</button>
  </div>`);
}

/* ─── ACTIONS ─── */
const A={
  setup(){
    const n=val('s_name'),p=val('s_pin');
    if(!n||p.length<4)return alert('Jina na PIN (tarakimu 4+) vinahitajika.');
    if(p!==val('s_pin2'))return alert('PIN hazilingani. Jaribu tena.');
    DB.addUser({name:n,role:'admin',pin:p});
    S.u=DB.login(p);
    try{sessionStorage.setItem('ngt_u',S.u.id)}catch(e){}
    render();
  },
  login(){
    const u=DB.login(val('pin'));
    if(!u)return alert('PIN si sahihi. Jaribu tena.');
    S.u=u;S.eid=null;
    try{sessionStorage.setItem('ngt_u',u.id)}catch(e){}
    render();
  },
  out(){S.u=null;S.eid=null;try{sessionStorage.removeItem('ngt_u')}catch(e){}render()},
  tab:d=>{S.tab=d.k;render()},
  open:d=>{S.eid=d.id;S.q='';render()},
  back(){S.eid=null;S.q='';render()},

  newev(){
    if(!val('n_name')||!val('n_venue'))return alert('Jaza jina la tukio na mahali (*).');
    DB.addEvent({name:val('n_name'),type:val('n_type'),date:val('n_date'),time:val('n_time'),venue:val('n_venue'),pkg:val('n_pkg'),card:'assets/cards/card'+val('n_card')+'.jpg'});
    render();
  },
   newuser(){
    let name=val('u_name').trim();
    let pin=val('u_pin').trim();
    if(!name) return alert('Jina linahitajika');
    if(!pin){
      pin=String(Math.floor(1000+Math.random()*9000));
    }
    if(pin.length<4) return alert('PIN angalau 4');
    if(DB.d.users.some(u=>u.pin===pin)){
      pin=String(Math.floor(1000+Math.random()*9000));
    }
    const u=DB.addUser({name,role:val('u_role'),pin,events:[...document.querySelectorAll('.u_ev:checked')].map(x=>x.value)});
    alert('✅ Ametengenezwa!\n\nJina: '+u.name+'\nPIN yake: '+u.pin+'\nRole: '+u.role+'\n\nMtumie PIN hii!');
    render();
  },
  deluser:d=>{if(confirm('Futa mtumiaji huyu?')){DB.delUser(d.id);render()}},

  mkev:d=>{
    const o=DB.d.orders.find(x=>x.id===d.id);
    if(!o)return;
    const e=DB.addEvent({name:o.eventName,type:o.type,date:o.date,time:o.time,venue:o.venue,pkg:(o.pkg||'').split('–')[0].trim(),card:o.cardImg||'assets/cards/card1.jpg'});
    (o.guests||[]).forEach(g=>{const p=g.split('|');DB.addGuest(e.id,p[0].trim(),(p[1]||'').trim())});
    const pin=String(1000+Math.floor(Math.random()*9000));
    DB.addUser({name:o.name,role:'client',pin,events:[e.id]});
    DB.setOrder(o.id,'done');
    dlg(`<h3>✅ Tukio Limetengenezwa!</h3>
    <p class="m"><b>${E(o.eventName)}</b> na wageni ${o.guests?.length||0} imeongezwa.</p>
    <p class="m">PIN ya mteja <b>${E(o.name)}</b>:</p>
    <div style="font-size:2.5rem;font-weight:800;color:var(--g);text-align:center;padding:12px;letter-spacing:.2em">${pin}</div>
    <p class="m" style="text-align:center">Tuma PIN hii kwa mteja kupitia WhatsApp.</p>
    <div class="row" style="justify-content:center">
      <a class="b" href="https://wa.me/${U.phone(o.phone)}?text=${encodeURIComponent('Habari '+o.name+', tukio lako '+o.eventName+' limetengenezwa. Ingia portal kwa PIN: '+pin+' – Nialike Go Tech')}" target="_blank">💬 Tuma PIN kwa WhatsApp</a>
    </div>`);
    render();
  },
  cancelorder:d=>{if(confirm('Kataa agizo hili?')){DB.setOrder(d.id,'cancelled');render()}},

  addg(){if(!val('g_n'))return alert('Weka jina la mgeni.');DB.addGuest(S.eid,val('g_n'),val('g_p'),{table:val('g_t')});render()},
  bulk(){const n=DB.importText(S.eid,val('g_bulk'));alert(n+' wageni wameongezwa.');render()},
  csvfile:(d,el)=>{const f=el.files[0];if(f){const r=new FileReader();r.onload=()=>{alert(DB.importText(S.eid,r.result)+' wageni wameongezwa.');render()};r.readAsText(f)}},
  delg:d=>{if(confirm('Futa mgeni huyu?')){DB.delGuest(d.id);render()}},

  card:async d=>{
    const g=gst(d.id),e=DB.ev(g.eid);
    try{
      const x=await dlimg(g,e);
      dlg(`<h3>${E(g.name)}</h3>
      <img src="${x.u}" alt="kadi ya mwaliko" style="border-radius:10px">
      <div class="row" style="justify-content:center;margin-top:10px">
        <a class="b" download="${x.f}" href="${x.u}">⬇ Pakua PNG</a>
        <button class="b o" data-a="share" data-id="${g.id}">🔗 Share</button>
        <button class="b o" data-a="wa" data-id="${g.id}">💬 WhatsApp</button>
      </div>`);
    }catch(e){dlg('<p class="m">⚠ Kadi haikutengenezwa. Fungua tovuti kwa HTTPS (si file://).</p>')}
  },
  share:async d=>{
    const g=gst(d.id),e=DB.ev(g.eid);
    try{
      const x=await dlimg(g,e),f=new File([x.b],x.f,{type:'image/png'});
      if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f],text:msg(g,e)})}
      else{alert('Share ya picha haipatikani kwenye kivinjari hiki. Tumia Pakua.')}
    }catch(e){}
  },
  wa:d=>{const g=gst(d.id),e=DB.ev(g.eid);open('https://wa.me/'+U.phone(g.phone)+'?text='+encodeURIComponent(msg(g,e)),'_blank')},
  cards:async()=>{
    const e=DB.ev(S.eid),gs=DB.guests(S.eid);
    if(!gs.length)return alert('Hakuna wageni.');
    if(!confirm(`Pakua kadi ${gs.length} kwa ${E(e.name)}? Itachukua muda.`))return;
    for(const g of gs){try{const x=await dlimg(g,e),a=document.createElement('a');a.href=x.u;a.download=x.f;a.click();await new Promise(r=>setTimeout(r,600))}catch(e){}}
  },
  links(){const e=DB.ev(S.eid);U.dl('links-'+e.id+'.csv',U.csv([['Jina','Namba','Link']].concat(DB.guests(S.eid).map(g=>[g.name,g.phone,U.inviteUrl(g,e)]))),'text/csv')},
  csv(){
    const e=DB.ev(S.eid),s=DB.stats(S.eid);
    U.dl('ripoti-'+e.name.replace(/\W+/g,'-')+'.csv',U.csv(
      [['RIPOTI YA TUKIO – '+e.name],['Tarehe ya Ripoti',new Date().toLocaleString('sw-TZ')],['Tukio',e.name],['Tarehe',e.date],['Mahali',e.venue],['Pakiti',e.pkg],[],
       ['Walioalikwa',s.total],['Walioingia',s.in],['Wanasubiri',s.pending],['Asilimia',s.pct+'%'],[],
       ['Jina','Namba','Meza','Hali','Saa ya Kuingia']].concat(
        DB.guests(S.eid).map(g=>[g.name,g.phone,g.table||'',g.status==='in'?'Ameingia':'Hajaingia',g.status==='in'?T(g.at):''])
      )
    ),'text/csv');
  },
  expev(){U.dl('pack-'+S.eid+'.json',JSON.stringify(DB.exportPack(S.eid)))},
  expall(){U.dl('ngt-data-'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify(DB.exportPack()))},
  impfile:(d,el)=>{
    const f=el.files[0];if(!f)return;
    const r=new FileReader();
    r.onload=()=>{
      try{const n=DB.importPack(JSON.parse(r.result));alert(`✓ Imeingizwa:\nMatukio: ${n.e}\nWageni: ${n.g}\nScans: ${n.s}\nWatumiaji: ${n.u}`);render()}
      catch(e){alert('Kosa: '+e.message)}
    };
    r.readAsText(f);
  },
  reset(){if(confirm('⚠ FUTA DATA YOTE?\n\nHii haitaweza kurudishwa. Hakikisha una backup kwanza.')){DB.reset();A.out()}},
  queue(){Q.l=DB.guests(S.eid).filter(g=>!g.sent&&g.phone);Q.i=0;if(!Q.l.length)return alert('Hakuna wageni wenye namba ambao hawajatumwa mwaliko.');qStep()},
  qsend(){const g=Q.l[Q.i];A.wa({id:g.id});DB.markSent(g.id);Q.i++;qStep()},
  qskip(){Q.i++;qStep()},
  async qshare(){const g=Q.l[Q.i];await A.share({id:g.id});DB.markSent(g.id);Q.i++;qStep()},
  code(){const c=val('code').trim();if(c)handle(c);else alert('Weka code ya QR.')},
  man:d=>show(DB.manual(d.id,S.u.id,[S.eid])),
  walk(){
    if(!val('w_n'))return alert('Weka jina la mgeni.');
    const g=DB.addGuest(S.eid,val('w_n'),val('w_p'),{table:'Walk-in'});
    show(DB.scan(g.code,S.u.id,[S.eid]));
  },
};

/* ─── EVENT LISTENERS ─── */
document.addEventListener('click',e=>{const a=e.target.closest('[data-a]');if(a&&a.tagName!=='INPUT'&&A[a.dataset.a])A[a.dataset.a](a.dataset,a)});
document.addEventListener('change',e=>{const a=e.target.closest('input[type=file][data-a]');if(a&&A[a.dataset.a])A[a.dataset.a](a.dataset,a)});
document.addEventListener('input',e=>{if(e.target.id==='q'){S.q=e.target.value;const gt=$('#gt');if(gt)gt.innerHTML=S.u?.role==='staff'?rows2():rows()}});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='pin')A.login();if(e.key==='Enter'&&e.target.id==='code')A.code()});
$('#dg').addEventListener('close',()=>{if(S.u&&S.eid&&S.u.role==='admin')try{$('#stats').innerHTML=stats();$('#gt').innerHTML=rows()}catch(e){}});
render();
