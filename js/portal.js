/* PORTAL v4 – Admin (muonekano mpya) / Staff (QR Scanner) / Client – faili moja safi */
const $=s=>document.querySelector(s),E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const CARDS=['Blush Floral QR','Lace & Ribbon','Golden Rose','Ivory & Emerald','Emerald Heritage','Forest Duo','Crimson Romance'];
const S={u:null,eid:null,tab:'dash',q:'',gev:null,f:'all',gq:'',sel:new Set(),step:1,mev:null,dr:{},sq:[],si:0};
let stream=null,timer=null,last='',lastAt=0;
try{const i=sessionStorage.getItem('ngt_u');if(i)S.u=DB.user(i)}catch(e){}
const T=t=>t?new Date(t).toLocaleTimeString('sw-TZ',{hour:'2-digit',minute:'2-digit'}):'—';
const D=t=>t?new Date(t).toLocaleDateString('sw-TZ'):'—';
const val=id=>($('#'+id)||{}).value||'';
const EV=()=>DB.d.events,GS=id=>DB.guests(id);
const ini=n=>String(n||'?').trim().split(/\s+/).slice(0,2).map(w=>w[0]).join('').toUpperCase();
const curE=()=>(S.gev&&DB.ev(S.gev))||EV()[0];
const cardName=e=>CARDS[parseInt(e.card?.match(/card(\d)/)?.[1]||1)-1]||'—';
function stop(){clearInterval(timer);if(stream){stream.getTracks().forEach(t=>t.stop());stream=null}}

/* ─── CSS ─── */
(()=>{const s=document.createElement('style');s.textContent=`
.v4h{display:flex;align-items:center;gap:10px;padding:14px 16px;background:#08170f;border-bottom:1px solid rgba(255,255,255,.06);position:sticky;top:0;z-index:20}
.v4h i{color:#22c55e;font-style:normal}.v4h small{display:block;font-size:.6rem;color:#22c55e;letter-spacing:.08em}.sp{flex:1}
.v4m{padding:14px 14px 110px;max-width:640px;margin:0 auto}
.v4c{background:#0b1d13;border:1px solid rgba(255,255,255,.07);border-radius:16px;padding:14px;margin-bottom:14px}
.v4c h3{margin:0 0 12px;font-size:.95rem}
.hi{display:flex;justify-content:space-between;align-items:center;gap:10px}.hi h2{margin:2px 0 0;font-size:1.5rem}
.badge{background:rgba(234,179,8,.15);color:#facc15;border-radius:999px;padding:3px 10px;font-size:.65rem}
.sg,.qa{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.sg a,.qa a{background:#0f2a1b;border:1px solid rgba(255,255,255,.06);border-radius:12px;padding:10px 6px;text-align:center;cursor:pointer;font-size:.68rem;color:#cbd5c9}
.sg b{display:block;font-size:1.4rem;color:#fff;margin:4px 0}
.qa a{display:flex;flex-direction:column;gap:6px;align-items:center;padding:14px 4px}.qa span{font-size:1.4rem}
.ev4{background:#0f2a1b;border:1px solid rgba(255,255,255,.06);border-radius:12px;padding:12px;margin-bottom:10px;cursor:pointer}
.ev4 .t{display:flex;justify-content:space-between;gap:8px}.ev4 small{color:#8aa394;display:block;margin-top:3px}
.ev4 .bar{margin-top:10px}.ev4 .fo{display:flex;justify-content:space-between;font-size:.7rem;color:#8aa394;margin-top:6px}
.chips{display:flex;gap:8px;overflow-x:auto;margin:10px 0}
.chips a{white-space:nowrap;padding:9px 14px;border-radius:10px;background:#0b1d13;border:1px solid rgba(255,255,255,.08);font-size:.8rem;cursor:pointer}
.chips a.on{background:#16a34a;border-color:#16a34a;color:#fff}
.v4g{display:flex;align-items:center;gap:10px;padding:11px 2px;border-bottom:1px solid rgba(255,255,255,.06)}
.ck{width:22px;height:22px;border:2px solid #3b5546;border-radius:6px;display:grid;place-items:center;color:transparent;font-size:.8rem;cursor:pointer;flex:none}
.ck.on{background:#22c55e;border-color:#22c55e;color:#06120b;font-weight:800}
.av{width:38px;height:38px;border-radius:50%;background:#12324a;display:grid;place-items:center;font-style:normal;font-size:.75rem;color:#7dd3fc;flex:none}
.gi{flex:1;min-width:0}.gi b{display:block}.gi small{color:#8aa394}
.gr{text-align:right;display:flex;flex-direction:column;gap:3px;align-items:flex-end}.gr small{color:#8aa394;font-size:.65rem}
.bd{padding:3px 9px;border-radius:7px;font-size:.7rem}.bd.ok{background:rgba(34,197,94,.15);color:#4ade80}.bd.no{background:rgba(239,68,68,.14);color:#f87171}
.sb{position:fixed;left:0;right:0;bottom:64px;background:#0b1d13;border-top:1px solid rgba(255,255,255,.08);padding:10px 14px;display:flex;align-items:center;gap:10px;z-index:25}
.nav4{position:fixed;left:0;right:0;bottom:0;height:64px;background:#08170f;border-top:1px solid rgba(255,255,255,.07);display:flex;align-items:center;justify-content:space-around;z-index:30}
.nav4 a{display:flex;flex-direction:column;align-items:center;gap:2px;font-size:.65rem;color:#8aa394;cursor:pointer;padding:6px 8px}.nav4 a span{font-size:1.15rem}
.nav4 a.on{color:#22c55e}.nav4 .plus{width:48px;height:48px;border-radius:50%;background:#16a34a;color:#fff;font-size:1.6rem;justify-content:center;padding:0}
.stp{display:flex;align-items:center;gap:6px;margin:6px 0 16px;font-size:.72rem}
.stp span{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:#1c2b22;color:#8aa394;font-weight:700}
.stp span.on{background:#16a34a;color:#fff}.stp span.dn{background:#14532d;color:#4ade80}.stp hr{flex:1;border:0;border-top:1px solid #2a3d31;margin:0}
.lbl{display:flex;justify-content:space-between;color:#8aa394;font-size:.75rem;margin:12px 0 5px}
.wa{background:#13231a;border-radius:16px;padding:10px}
.wa .bub{background:#0d3b24;border-radius:10px;padding:8px;color:#e8f5ec;font-size:.85rem;line-height:1.45;white-space:pre-wrap}
.wa img{width:100%;border-radius:8px;margin-bottom:8px;display:block}.wa .tm{text-align:right;font-size:.65rem;color:#8aa394;margin-top:4px}
`;document.head.appendChild(s)})();

/* ─── RENDER ─── */
function render(){
  stop();const a=$('#app');
  if(!DB.d.users.some(u=>u.role==='admin')){
    if(!location.search.includes('master=NIALIKE2024')){
      a.innerHTML=`<div class="login"><div class="logo-lg">Nialike <i>Go Tech</i></div><p class="m" style="color:#f87171">⛔ System imefungwa. Wasiliana na Admin mkuu.</p></div>`;return;
    }
    a.innerHTML=`<div class="login"><div class="logo-lg">Nialike <i>Go Tech</i></div>
      <p class="m">Tengeneza akaunti ya Admin (mara ya kwanza tu)</p>
      <input id="s_name" placeholder="Jina lako kamili">
      <input id="s_pin" type="password" inputmode="numeric" placeholder="PIN (tarakimu 4–8)">
      <input id="s_pin2" type="password" inputmode="numeric" placeholder="Rudia PIN">
      <button class="b full" data-a="setup">Tengeneza akaunti ya Admin</button></div>`;return;
  }
  if(!S.u){
    a.innerHTML=`<div class="login"><div class="logo-lg">Nialike <i>Go Tech</i></div>
      <p class="m">Ingiza PIN yako</p>
      <p class="m" style="margin-bottom:8px;font-size:.7rem">Admin · Msimamizi wa Mlango · Mteja</p>
      <input id="pin" type="password" inputmode="numeric" placeholder="••••••" autofocus>
      <button class="b full" data-a="login">Ingia</button></div>`;return;
  }
  const u=S.u;
  if(u.role==='admin'){
    const N=(k,i,t)=>`<a data-a="nav" data-k="${k}" class="${!S.eid&&S.tab===k?'on':''}"><span>${i}</span>${t}</a>`;
    a.innerHTML=`<header class="v4h"><div><b>Nialike <i>Go Tech</i></b><small>ADMIN PORTAL</small></div><span class="sp"></span><span class="m">${E(u.name)}</span><button class="b o s" data-a="out">Toka</button></header>
    <main class="v4m">${S.eid?vEvent():(V[S.tab]||vDash)()}</main>
    <nav class="nav4">${N('dash','🏠','Dashibodi')}${N('events','📅','Matukio')}${N('guests','👥','Wageni')}<a class="plus" data-a="nav" data-k="events">+</a>${N('send','✈️','Mialiko')}${N('report','📊','Ripoti')}</nav>`;
    return;
  }
  a.innerHTML=`<header><b>Nialike <i>Go Tech</i></b><span>${E(u.name)} <em class="role">${u.role}</em></span><button class="b o s" data-a="out">Toka</button></header><main>${body()}</main>`;
  if(u.role==='staff'&&S.eid)startCam();
}

/* ─── BODY (Staff / Client) ─── */
function body(){
  const u=S.u,ev=DB.eventsOf(u);
  if(!S.eid){
    if(ev.length===1){S.eid=ev[0].id;return body()}
    return `<h2>Chagua tukio lako</h2>`+
      (ev.map(e=>`<div class="c"><b>${E(e.name)}</b><p class="m">📅 ${e.date} ${e.time} · 📍 ${E(e.venue)} · 📦 ${E(e.pkg)}</p><button class="b" data-a="open" data-id="${e.id}">Fungua →</button></div>`).join('')||
      `<div class="c"><p class="m">Hujapangiwa tukio. Omba admin akupangie tukio na PIN yako.</p></div>`);
  }
  return u.role==='staff'?vScan():vEvent();
}

/* ─── ADMIN: DASHIBODI ─── */
function vDash(){
  const ev=EV(),gs=DB.d.guests,inn=gs.filter(g=>g.status==='in').length;
  const sg=[['📅',ev.length,'Matukio Yote','events'],['👥',gs.length,'Wageni Wote','guests'],['⏳',gs.length-inn,'Wanasubiri','guests'],['✅',inn,'Wameingia','report']];
  const qa=[['🗓','Tukio Jipya','events'],['➕','Ongeza Mgeni','guests'],['✈️','Tuma Mwaliko','send'],['📷','Scan QR','events'],['📊','Ripoti','report'],['📦','Maagizo','orders'],['👤','Watumiaji','users'],['⚙️','Mipangilio','sync']];
  return `<div class="v4c hi"><div><small class="m">Karibu tena,</small><h2>${E(S.u.name)} <span class="badge">SUPER ADMIN</span></h2></div><small class="m">${new Date().toLocaleDateString('sw-TZ',{weekday:'long',day:'numeric',month:'short',year:'numeric'})}</small></div>
  <div class="v4c"><h3>Muhtasari wa Haraka</h3><div class="sg">${sg.map(x=>`<a data-a="nav" data-k="${x[3]}">${x[0]}<b>${x[1]}</b>${x[2]}</a>`).join('')}</div></div>
  <div class="v4c"><h3>Vitendo vya Haraka</h3><div class="qa">${qa.map(x=>`<a data-a="nav" data-k="${x[2]}"><span>${x[0]}</span>${x[1]}</a>`).join('')}</div></div>
  <div class="v4c"><h3>Matukio ya Hivi Punde</h3>${ev.slice(-3).reverse().map(e=>{const s=DB.stats(e.id);return `<div class="ev4" data-a="open" data-id="${e.id}"><div class="t"><b>${E(e.name)}</b><span class="m">${E(e.date)}</span></div><small>📍 ${E(e.venue)} · 📦 ${E(e.pkg)}</small><div class="bar"><i style="width:${s.pct}%"></i></div><div class="fo"><span>👥 ${s.total} walioalikwa</span><span>✓ ${s.in} walioingia</span><span>${s.pct}%</span></div></div>`}).join('')||'<p class="m">Hakuna tukio bado. Bofya "Tukio Jipya".</p>'}</div>`;
}

/* ─── ADMIN: MATUKIO ─── */
function vEvents(){
  const evs=EV();
  return `<h2>Matukio (${evs.length})</h2>`+
  evs.map(e=>{const s=DB.stats(e.id);return`<div class="v4c">
    <div class="hi"><div><b>${E(e.name)}</b><p class="m">📅 ${e.date} ${e.time} · 📍 ${E(e.venue)}</p><p class="m">📦 ${E(e.pkg)} · 🎨 ${E(cardName(e))}</p>${e.host?`<p class="m">👤 ${E(e.host)}</p>`:''}${e.contact?`<p class="m">📞 ${E(e.contact)}</p>`:''}</div>
    <button class="b" data-a="open" data-id="${e.id}">Fungua →</button></div>
    <div class="bar" style="margin-top:10px"><i style="width:${s.pct}%"></i></div>
    <p class="m">👥 ${s.total} · ✓ ${s.in} · ⏳ ${s.pending} · 📊 ${s.pct}%</p>
  </div>`}).join('')+
  `<h3>+ Ongeza Tukio Jipya</h3>
  <div class="v4c">
    <div class="row"><input id="n_name" placeholder="Jina la tukio *"><input id="n_type" placeholder="Aina (Harusi, Send-Off, Birthday...)"></div>
    <div class="row"><input id="n_date" type="date"><input id="n_time" type="time"></div>
    <input id="n_venue" placeholder="Mahali / Venue *">
    <input id="n_host" placeholder="Mwenye Shughuli / Familia (mfano: Familia ya John)">
    <div class="row"><input id="n_contact" placeholder="Mawasiliano (mfano: 0712...)"><input id="n_location" placeholder="Link ya Location (Google Maps)"></div>
    <input id="n_note" placeholder="Maelezo ya ziada (mfano: Watoto hawaruhusiwi / Fika mapema)">
    <div class="row"><select id="n_pkg"><option>Basic</option><option selected>Standard</option><option>Premium</option></select>
    <select id="n_card">${CARDS.map((c,i)=>`<option value="${i+1}">${c}</option>`).join('')}</select></div>
    <button class="b" data-a="newev">💾 Hifadhi Tukio</button>
  </div>`;
}

/* ─── ADMIN: WAGENI ─── */
function gRows(){
  const e=curE();if(!e)return '';
  const q=(S.gq||'').toLowerCase();
  const l=GS(e.id).filter(g=>(S.f==='all'||(S.f==='sent'?g.sent:!g.sent))&&(g.name+g.phone).toLowerCase().includes(q));
  return l.length?l.map(g=>`<div class="v4g"><span class="ck ${S.sel.has(g.id)?'on':''}" data-a="gsel" data-id="${g.id}">✓</span><i class="av">${E(ini(g.name))}</i><div class="gi"><b>${E(g.name)}</b><small>${E(g.phone)||'—'}${g.table?' · Meza '+E(g.table):''}</small></div><div class="gr"><span class="bd ${g.sent?'ok':'no'}">${g.sent?'Waliotumwa':'Hawajatumwa'}</span><small>${g.status==='in'?'✓ '+T(g.at):''}</small></div><button class="b o s" data-a="card" data-id="${g.id}" title="Ona kadi">🎫</button><button class="b o s" onclick="tumaKadiYaQR('${g.id}')" title="Amelipa - Tuma QR">✅</button><button class="b r s" data-a="delg2" data-id="${g.id}" title="Futa">✕</button></div>`).join(''):'<p class="m" style="padding:14px 0">Hakuna wageni hapa. Ongeza mgeni hapo chini.</p>';
}
const sbar=()=>S.sel.size?`<span>☑ ${S.sel.size} wamechaguliwa</span><span class="sp"></span><button class="b" data-a="tosend">Tuma Mwaliko →</button>`:'';
function vGuests(){
  const e=curE();
  if(!e)return `<div class="v4c"><p class="m">Tengeneza tukio kwanza.</p><button class="b" data-a="nav" data-k="events">Tukio Jipya</button></div>`;
  const all=GS(e.id),sent=all.filter(g=>g.sent).length,f=S.f;
  return `<h2>Wageni</h2>
  <select id="gev" style="margin-bottom:8px">${EV().map(x=>`<option value="${x.id}" ${x.id===e.id?'selected':''}>${E(x.name)} · ${E(x.date)}</option>`).join('')}</select>
  <div class="chips"><a data-a="gf" data-k="all" class="${f==='all'?'on':''}">Wote (${all.length})</a><a data-a="gf" data-k="sent" class="${f==='sent'?'on':''}">Waliotumwa (${sent})</a><a data-a="gf" data-k="unsent" class="${f==='unsent'?'on':''}">Hawajatumwa (${all.length-sent})</a></div>
  <input id="gq" placeholder="🔍 Tafuta mgeni..." value="${E(S.gq)}">
  <div class="v4c" style="margin-top:12px;padding:8px 14px"><div id="gl">${gRows()}</div></div>
  <details class="v4c"><summary><b>+ Ongeza Wageni</b></summary>
    <div class="row" style="margin-top:10px"><input id="g_n" placeholder="Jina *"><input id="g_p" type="tel" placeholder="0712... "><input id="g_t" placeholder="Meza"><button class="b" data-a="addg2">+ Ongeza</button></div>
    <textarea id="g_bulk" rows="4" placeholder="Bandika orodha (Jina, Namba, Meza kila mstari)"></textarea>
    <div class="row"><button class="b o" data-a="bulk2">📋 Ingiza Orodha</button><label class="b o" style="cursor:pointer">📁 Pakia CSV/TXT<input type="file" accept=".csv,.txt" hidden data-a="csvfile2"></label></div>
  </details>
  <div class="sb" id="sb" ${S.sel.size?'':'hidden'}>${sbar()}</div>`;
}

/* ─── ADMIN: TUMA MWALIKO (wizard) ─── */
const defDr=e=>({title:'Habari {JINA}!',body:`Tafadhali pokea mwaliko wa ${String(e.name).toUpperCase()}, itakayofanyika tarehe ${e.date}, ${e.venue}, SAA ${e.time||''}.`,map:e.location||'',close:'Karibu sana na uwe na wakati mwema!'});
const ldDr=e=>{try{return JSON.parse(localStorage.getItem('v4dr'+e.id))||defDr(e)}catch(x){return defDr(e)}};
const build=g=>{const d=S.dr;return `${(d.title||'').replace(/\{JINA\}/g,g.name)}\n\n${d.body||''}\n\n${d.map?'Tafadhali tumia kiungo hapa chini kupata ramani ya kufika ukumbini.\n📍 '+d.map+'\n\n':''}${d.close||''}`};
function vSend(){
  const e=S.mev&&DB.ev(S.mev);if(!e)S.step=1;
  const bar=`<div class="stp">${['Chagua Tukio','Wapokeaji','Ujumbe'].map((t,i)=>`<span class="${S.step>i+1?'dn':S.step===i+1?'on':''}">${S.step>i+1?'✓':i+1}</span><em>${t}</em>`).join('<hr>')}</div>`;
  if(S.step===1)return `<h2>Tuma Mwaliko</h2>${bar}`+(EV().map(x=>{const s=DB.stats(x.id);return `<div class="ev4" data-a="sev" data-id="${x.id}"><div class="t"><b>${E(x.name)}</b><span class="m">${E(x.date)}</span></div><small>📍 ${E(x.venue)} · 👥 ${s.total} wageni</small></div>`}).join('')||'<p class="m">Hakuna tukio.</p>');
  if(S.step===2){
    const l=GS(e.id).filter(g=>g.phone);
    return `<h2>Tuma Mwaliko</h2><p class="m">${E(e.name)}</p>${bar}
    <div class="row"><button class="b o s" data-a="selu">Wasiotumwa</button><button class="b o s" data-a="sela">Wote</button><button class="b o s" data-a="selc">Futa chaguo</button></div>
    <div class="v4c" style="margin-top:10px;padding:8px 14px">${l.map(g=>`<div class="v4g"><span class="ck ${S.sel.has(g.id)?'on':''}" data-a="gsel2" data-id="${g.id}">✓</span><i class="av">${E(ini(g.name))}</i><div class="gi"><b>${E(g.name)}</b><small>${E(g.phone)}</small></div><span class="bd ${g.sent?'ok':'no'}">${g.sent?'Imetumwa':'Haijatumwa'}</span></div>`).join('')||'<p class="m">Hakuna wageni wenye namba.</p>'}</div>
    <div class="sb"><span>☑ ${S.sel.size}</span><span class="sp"></span><button class="b o" data-a="sstep" data-k="1">← Rudi</button><button class="b" data-a="sstep" data-k="3">Endelea →</button></div>`;
  }
  const d=S.dr,first=GS(e.id).find(g=>S.sel.has(g.id))||{name:'Mgeni'};
  const f=(id,l,v,max,ta)=>`<div class="lbl"><span>${l}</span><span id="${id}_n">${v.length}/${max}</span></div>${ta?`<textarea id="${id}" rows="4" maxlength="${max}">${E(v)}</textarea>`:`<input id="${id}" maxlength="${max}" value="${E(v)}">`}`;
  return `<h2>Tuma Mwaliko</h2><p class="m">${E(e.name)}</p>${bar}
  <div class="v4c"><div class="lbl" style="margin:0"><span>Kadi ya Mwaliko</span></div><div class="row" style="align-items:center;margin-top:8px">${e.card?`<img src="${E(e.card)}" style="width:80px;border-radius:8px" onerror="this.remove()">`:''}<div><b>${E(cardName(e))}</b><p class="m">Template ya tukio</p></div></div></div>
  ${f('m_title','Kichwa cha ujumbe',d.title||'',50)}${f('m_body','Maelezo ya Tukio',d.body||'',500,1)}${f('m_map','Kiungo cha Ramani (Google Maps)',d.map||'',300)}${f('m_close','Hitimisho',d.close||'',100)}
  <div class="lbl"><span>Preview ya WhatsApp</span></div>
  <div class="wa">${e.card?`<img src="${E(e.card)}" onerror="this.remove()">`:''}<div class="bub" id="pv">${E(build(first))}</div><div class="tm">${new Date().toLocaleTimeString('sw-TZ',{hour:'2-digit',minute:'2-digit'})} ✓✓</div></div>
  <p class="m" style="margin-top:8px">ℹ Kila mgeni atapokea ujumbe wenye jina lake.</p>
  <div class="sb"><button class="b o" data-a="sdraft">Hifadhi Draft</button><span class="sp"></span><button class="b" data-a="sstep" data-k="2">←</button><button class="b" data-a="vsend0">✈ Tuma (${S.sel.size})</button></div>`;
}

/* ─── ADMIN: RIPOTI ─── */
function vReport(){
  return `<h2>Ripoti</h2>`+(EV().map(e=>{const s=DB.stats(e.id);return `<div class="v4c"><b>${E(e.name)}</b><p class="m">${E(e.date)} · ${E(e.venue)}</p><div class="bar"><i style="width:${s.pct}%"></i></div><p class="m">👥 ${s.total} · ✓ ${s.in} · ⏳ ${s.pending} · ${s.pct}%</p><div class="row"><button class="b o s" data-a="csv2" data-id="${e.id}">⬇ CSV</button><button class="b o s" data-a="open" data-id="${e.id}">Fungua →</button></div></div>`}).join('')||'<p class="m">Hakuna ripoti bado.</p>');
}

/* ─── ADMIN: WATUMIAJI ─── */
function vUsers(){
  return `<h2>Watumiaji (${DB.d.users.length})</h2>
  <p class="m" style="margin-bottom:12px">Msimamizi = anascan QR mlangoni. Mteja = anaona dashboard ya tukio lake.</p>`+
  DB.d.users.map(u=>`<div class="g"><div><b>${E(u.name)}</b> <span class="tag">${u.role}</span>
    <p class="m">PIN: <code>${E(u.pin)}</code> · Matukio: ${u.events.map(id=>E((DB.ev(id)||{}).name||id)).join(', ')||'—'}</p></div>
    ${u.role!=='admin'?`<button class="b r s" data-a="deluser" data-id="${u.id}">✕ Futa</button>`:'<span class="m">Admin</span>'}</div>`).join('')+
  `<h3>+ Mtumiaji Mpya</h3>
  <div class="v4c">
    <div class="row"><input id="u_name" placeholder="Jina *"><input id="u_pin" inputmode="numeric" placeholder="PIN (tarakimu 4+) *"></div>
    <select id="u_role"><option value="staff">👁 Msimamizi wa Mlango (Staff)</option><option value="client">📱 Mteja (Client)</option></select>
    <p class="m" style="margin:8px 0">Panga kwa matukio:</p>
    <div class="chk-group">${EV().map(e=>`<label class="chk"><input type="checkbox" class="u_ev" value="${e.id}"> ${E(e.name)}</label>`).join('')}</div>
    <button class="b" style="margin-top:10px" data-a="newuser">+ Ongeza Mtumiaji</button>
  </div>`;
}

/* ─── ADMIN: MAAGIZO ─── */
function vOrders(){
  const orders=DB.d.orders;
  const badge=s=>s==='done'?'<span class="tag in">✓ Imefanywa</span>':s==='cancelled'?'<span class="tag bad">Imekataliwa</span>':'<span class="tag new">🔔 Mpya</span>';
  return `<h2>Maagizo (${orders.length})</h2>
  <p class="m" style="margin-bottom:12px">Maagizo yanayokuja kutoka tovuti. Bofya "Tengeneza Tukio" kuongeza tukio na PIN ya mteja moja kwa moja.</p>`+
  (orders.length===0?`<div class="v4c"><p class="m">Hakuna maagizo bado.</p></div>`:'')+
  orders.map(o=>`<div class="v4c">
    <div class="hi"><div><b>${E(o.eventName||'—')}</b> ${badge(o.status)}</div><span class="m">${D(o.at)}</span></div>
    <div class="order-grid">
      <div><span class="m">Mteja</span><b>${E(o.name)}</b></div>
      <div><span class="m">Simu</span><b><a href="tel:${E(o.phone)}">${E(o.phone)}</a></b></div>
      <div><span class="m">Pakiti</span><b>${E(o.pkg)}</b></div>
      <div><span class="m">Kadi</span><b>${E(o.card||'—')}</b></div>
      <div><span class="m">Tarehe</span><b>${E(o.date)}</b></div>
      <div><span class="m">Mahali</span><b>${E(o.venue)}</b></div>
      <div><span class="m">Malipo</span><b>${E(o.pay||'—')}</b></div>
      <div><span class="m">Wageni</span><b>${o.guests?.length||0}</b></div>
    </div>
    ${o.guests?.length?`<details><summary class="m">Ona orodha ya wageni (${o.guests.length})</summary><div class="gl-preview">${o.guests.map((g,i)=>`<div class="g-row"><span>${i+1}. ${E(g)}</span></div>`).join('')}</div></details>`:''}
    ${o.status==='new'?`<div class="row" style="margin-top:10px">
      <button class="b" data-a="mkev" data-id="${o.id}">⚡ Tengeneza Tukio + PIN ya Mteja</button>
      <a class="b o" href="https://wa.me/${U.phone(o.phone)}?text=${encodeURIComponent('Habari '+o.name+', agizo lako la '+o.eventName+' limepokelewa. Tutawasiliana nawe hivi karibuni. – Nialike Go Tech')}" target="_blank" rel="noopener">💬 WhatsApp Mteja</a>
      <button class="b r" data-a="cancelorder" data-id="${o.id}">✕ Kataa</button></div>`:''}
  </div>`).join('');
}

/* ─── ADMIN: SYNC / MIPANGILIO ─── */
function vSync(){
  return `<h2>Mipangilio – Sync</h2>
  <p class="m" style="margin-bottom:14px">Data iko kwenye kifaa hiki tu. Hamisha kati ya vifaa kwa faili la JSON.</p>
  <div class="v4c"><h3>Tuma data (admin → msimamizi)</h3>
    <p class="m">Admin anatuma "pack" ya tukio kwa msimamizi wa mlango – ina wageni na QR codes.</p>
    <button class="b o" data-a="expall">⬇ Data Yote</button></div>
  <div class="v4c"><h3>Pokea data (msimamizi → admin)</h3>
    <p class="m">Msimamizi anatuma scans zake kwa admin baada ya tukio.</p>
    <label class="b o" style="cursor:pointer">↑ Ingiza Pack<input type="file" accept=".json" hidden data-a="impfile"></label></div>
  <div class="v4c" style="border-color:rgba(239,68,68,.3)"><h3 style="color:#f87171">Hatari: Futa Data</h3>
    <p class="m">Hii itafuta MATUKIO, WAGENI, na SCANS zote kwenye kifaa hiki. Usifanye bila backup.</p>
    <button class="b r" data-a="reset">🗑 Futa Data Yote</button></div>`;
}
const V={dash:vDash,events:vEvents,guests:vGuests,send:vSend,report:vReport,users:vUsers,orders:vOrders,sync:vSync};

/* ─── EVENT VIEW (Admin/Client) ─── */
function rows(){
  const q=S.q.toLowerCase(),adm=S.u.role==='admin';
  const filtered=GS(S.eid).filter(g=>(g.name+g.phone+g.table).toLowerCase().includes(q));
  if(!filtered.length)return `<p class="m">Hakuna wageni ${q?'wanaolingana na utafutaji':'bado'}.</p>`;
  return filtered.map(g=>`<div class="g"><div><b>${E(g.name)}</b><div class="m">${E(g.phone)||'—'} ${g.table?'· Meza '+E(g.table):''}</div></div>
    <div class="g-right">
      <span class="tag ${g.status==='in'?'in':''}">${g.status==='in'?'✓ '+T(g.at):'⏳ anasubiri'}</span>
      ${g.sent?'<span class="tag in" style="font-size:.6rem">📨 imetumwa</span>':''}
      ${adm?`<div class="row" style="margin:0;gap:4px"><button class="b o s" data-a="card" data-id="${g.id}" title="Ona kadi">🎫</button><button class="b o s" onclick="tumaKadiYaQR('${g.id}')" title="Amelipa - Tuma QR">✅</button><button class="b r s" data-a="delg" data-id="${g.id}" title="Futa">✕</button></div>`:''}
    </div></div>`).join('');
}
function stats(){
  const s=DB.stats(S.eid);
  return `<div class="st"><div><b>${s.total}</b>Walioalikwa</div><div><b style="color:var(--g)">${s.in}</b>Walioingia</div><div><b>${s.pending}</b>Wanasubiri</div><div><b style="color:${s.bad?'#f87171':'inherit'}">${s.bad}</b>Zilizokataliwa</div></div>
  <div class="bar"><i style="width:${s.pct}%"></i></div>
  <p class="m">${s.pct}% wamefika · Ilisasishwa ${new Date().toLocaleTimeString('sw-TZ',{hour:'2-digit',minute:'2-digit'})}</p>`;
}
function vEvent(){
  const e=DB.ev(S.eid),adm=S.u.role==='admin';
  return `<button class="b o s" data-a="back">← Rudi</button>
  <h2>${E(e.name)}</h2>
  <p class="m">📅 ${e.date} ${e.time} · 📍 ${E(e.venue)} · 📦 ${E(e.pkg)}</p>
  ${e.host?`<p class="m">👤 ${E(e.host)}</p>`:''}${e.contact?`<p class="m">📞 Mawasiliano: ${E(e.contact)}</p>`:''}
  ${e.location?`<p class="m">📍 Location: <a href="${E(e.location)}" target="_blank">Fungua Ramani</a></p>`:''}${e.note?`<p class="m">📝 ${E(e.note)}</p>`:''}
  <div id="stats">${stats()}</div>
  <div class="row" style="margin-top:14px">
    <button class="b o" data-a="csv">⬇ CSV Ripoti</button><button class="b o" onclick="print()">🖨 Print</button>
    <button class="b o" data-a="expev">⬇ Pack (Sync)</button>
    <label class="b o" style="cursor:pointer">⬆ Ingiza Pack<input type="file" accept=".json" hidden data-a="impfile"></label>
    ${adm?`<button class="b o" data-a="cards">⬇ Kadi Zote</button><button class="b o" data-a="links">⬇ Links CSV</button>`:''}
  </div>
  ${adm?`<h3>Ongeza Wageni</h3><div class="c">
    <div class="row"><input id="g_n" placeholder="Jina *"><input id="g_p" type="tel" placeholder="0712... (hiari)"><input id="g_t" placeholder="Meza (hiari)"><button class="b" data-a="addg">+ Ongeza</button></div>
    <textarea id="g_bulk" rows="4" placeholder="Bandika orodha nyingi (kila mstari: Jina, Namba, Meza)"></textarea>
    <div class="row"><button class="b o" data-a="bulk">📋 Ingiza Orodha</button>
    <label class="b o" style="cursor:pointer">📁 Pakia CSV/TXT<input type="file" accept=".csv,.txt" hidden data-a="csvfile"></label></div></div>`:''}
  <h3>Orodha ya Wageni</h3>
  <input id="q" placeholder="🔍 Tafuta jina, namba, au meza..." value="${E(S.q)}" style="margin-bottom:10px">
  <div id="gt">${rows()}</div>`;
}

/* ─── STAFF QR SCANNER ─── */
function vScan(){
  const e=DB.ev(S.eid);
  return `${DB.eventsOf(S.u).length>1?'<button class="b o s" data-a="back">← Matukio</button>':''}
  <h2>🔲 Scan – ${E(e.name)}</h2><div id="stats">${stats()}</div>
  <div class="cam"><video id="v" playsinline muted></video><div id="res" class="res">📷 Elekeza QR kwenye kamera</div></div>
  <div class="row" style="margin-top:10px"><input id="code" placeholder="Au andika code ya QR mwenyewe..."><button class="b" data-a="code">✓ Thibitisha</button></div>
  <h3 style="margin-top:18px">Tafuta / Ingiza kwa Mkono</h3>
  <input id="q" placeholder="🔍 Tafuta jina au namba..." value="${E(S.q)}">
  <div id="gt" style="margin-top:10px">${rows2()}</div>
  <div class="c" style="margin-top:14px"><h3>Mgeni asiye kwenye orodha (Walk-in)</h3>
    <div class="row"><input id="w_n" placeholder="Jina la mgeni *"><input id="w_p" type="tel" placeholder="Namba (hiari)"><button class="b" data-a="walk">+ Ingiza</button></div></div>
  <div class="row" style="margin-top:14px"><button class="b o" data-a="expev">⬇ Tuma Scans kwa Admin</button>
    <label class="b o" style="cursor:pointer">⬆ Pokea Pack ya Admin<input type="file" accept=".json" hidden data-a="impfile"></label></div>`;
}
function rows2(){
  const q=S.q.toLowerCase();
  const list=GS(S.eid).filter(g=>q?(g.name+g.phone).toLowerCase().includes(q):g.status!=='in').slice(0,30);
  if(!list.length&&!q)return`<p class="m">Wageni wote wameingia ✓</p>`;
  if(!list.length)return`<p class="m">Hakuna matokeo ya "${E(q)}"</p>`;
  return list.map(g=>`<div class="g"><div><b>${E(g.name)}</b><div class="m">${E(g.phone)||'—'} ${g.table?'· '+E(g.table):''}</div></div>
    ${g.status==='in'?`<span class="tag in">✓ ${T(g.at)}</span>`:`<button class="b s" data-a="man" data-id="${g.id}">✓ Ingiza</button>`}</div>`).join('');
}
async function startCam(){
  const r=$('#res');
  if(!('BarcodeDetector' in window)||!navigator.mediaDevices){r.innerHTML='📵 Kamera ya QR haipatikani hapa.<br><small>Tumia Chrome/Edge kwenye Android, au andika code mwenyewe hapo juu.</small>';return}
  try{
    stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment',width:{ideal:1280}}});
    const v=$('#v');v.srcObject=stream;await v.play();
    const det=new BarcodeDetector({formats:['qr_code']});
    timer=setInterval(async()=>{try{const f=await det.detect(v);if(f[0]){const c=f[0].rawValue;if(c!==last||Date.now()-lastAt>3000){last=c;lastAt=Date.now();handle(c)}}}catch(e){}},300);
  }catch(e){r.innerHTML='🚫 Ruhusa ya kamera imekataliwa.<br><small>Ruhusa kamera kwenye mipangilio ya kivinjari, kisha reload.</small>'}
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

/* ─── DIALOG & MESSAGE ─── */
const dlg=h=>{const d=$('#dg');d.innerHTML=h+`<div class="row" style="justify-content:center;margin-top:14px"><button class="b o" onclick="document.getElementById('dg').close()">Funga</button></div>`;if(!d.open)d.showModal()};
const gst=id=>DB.d.guests.find(g=>g.id===id);
const dlimg=async(g,e)=>{const b=await cardPng(g,e);return{b,u:URL.createObjectURL(b),f:g.name.replace(/\W+/g,'_')+'.png'}};
const msg=(g,e)=>{
  const base=location.origin+location.pathname;
  const linkYes=`${base}?rsvp=yes&ev=${e.id}&g=${g.id}`,linkNo=`${base}?rsvp=no&ev=${e.id}&g=${g.id}`;
  const host=e.host||'Mwenye Shughuli',contact=e.contact||'—',loc=e.location||'',note=e.note?`\n${e.note}\n`:'';
  const cardNo=(g.code||g.id||'').toString().slice(0,8).toUpperCase();
  return `Kadi ya Mualiko\n\nHabari, ${g.name}!\nPokea kadi yako ya mwaliko kutoka kwa ${host}.\n\nUkumbi: ${e.venue} Saa ${e.time||''}\nCard No: ${cardNo}\n\nLocation: ${loc}\nMawasiliano: ${contact}\n${note}\nKARIBU SANA! 🎉\nInvio, Rafiki yako kwa shughuli yako\n\nUtaweza kufika?\n✅ Nitaweza Kufika: ${linkYes}\n❌ Sitaweza Kufika: ${linkNo}`;
};
const rf=()=>{const l=$('#gl'),s=$('#sb');if(l)l.innerHTML=gRows();if(s){s.hidden=!S.sel.size;s.innerHTML=sbar()}};

/* ─── ACTIONS ─── */
const A={
  setup(){
    const n=val('s_name'),p=val('s_pin');
    if(!n||p.length<4)return alert('Jina na PIN (tarakimu 4+) vinahitajika.');
    if(p!==val('s_pin2'))return alert('PIN hazilingani. Jaribu tena.');
    DB.addUser({name:n,role:'admin',pin:p});S.u=DB.login(p);
    try{sessionStorage.setItem('ngt_u',S.u.id)}catch(e){}render();
  },
  login(){
    const u=DB.login(val('pin'));if(!u)return alert('PIN si sahihi. Jaribu tena.');
    S.u=u;S.eid=null;S.tab='dash';
    try{sessionStorage.setItem('ngt_u',u.id)}catch(e){}render();
  },
  out(){S.u=null;S.eid=null;try{sessionStorage.removeItem('ngt_u')}catch(e){}render()},
  nav:d=>{S.eid=null;S.tab=d.k;S.q='';render();scrollTo(0,0)},
  open:d=>{S.eid=d.id;S.q='';render()},
  back(){S.eid=null;S.q='';render()},
  newev(){
    if(!val('n_name')||!val('n_venue'))return alert('Jaza jina la tukio na mahali (*).');
    DB.addEvent({name:val('n_name'),type:val('n_type'),date:val('n_date'),time:val('n_time'),venue:val('n_venue'),host:val('n_host'),contact:val('n_contact'),location:val('n_location'),note:val('n_note'),pkg:val('n_pkg'),card:'assets/cards/card'+val('n_card')+'.jpg'});
    render();
  },
  newuser(){
    let name=val('u_name').trim(),pin=val('u_pin').trim();
    if(!name)return alert('Jina linahitajika');
    if(!pin)pin=String(Math.floor(1000+Math.random()*9000));
    if(pin.length<4)return alert('PIN angalau 4');
    if(DB.d.users.some(u=>u.pin===pin))pin=String(Math.floor(1000+Math.random()*9000));
    const u=DB.addUser({name,role:val('u_role'),pin,events:[...document.querySelectorAll('.u_ev:checked')].map(x=>x.value)});
    alert('✅ Ametengenezwa!\n\nJina: '+u.name+'\nPIN yake: '+u.pin+'\nRole: '+u.role+'\n\nMtumie PIN hii!');render();
  },
  deluser:d=>{if(confirm('Futa mtumiaji huyu?')){DB.delUser(d.id);render()}},
  mkev:d=>{
    const o=DB.d.orders.find(x=>x.id===d.id);if(!o)return;
    const e=DB.addEvent({name:o.eventName,type:o.type,date:o.date,time:o.time,venue:o.venue,host:o.name,contact:o.phone,location:o.location||'',note:o.note||'',pkg:(o.pkg||'').split('–')[0].trim(),card:o.cardImg||'assets/cards/card1.jpg'});
    (o.guests||[]).forEach(g=>{const p=g.split('|');DB.addGuest(e.id,p[0].trim(),(p[1]||'').trim())});
    const pin=String(1000+Math.floor(Math.random()*9000));
    DB.addUser({name:o.name,role:'client',pin,events:[e.id]});DB.setOrder(o.id,'done');
    dlg(`<h3>✅ Tukio Limetengenezwa!</h3><p class="m"><b>${E(o.eventName)}</b> na wageni ${o.guests?.length||0} imeongezwa.</p>
    <p class="m">PIN ya mteja <b>${E(o.name)}</b>:</p>
    <div style="font-size:2.5rem;font-weight:800;color:var(--g);text-align:center;padding:12px;letter-spacing:.2em">${pin}</div>
    <div class="row" style="justify-content:center"><a class="b" href="https://wa.me/${U.phone(o.phone)}?text=${encodeURIComponent('Habari '+o.name+', tukio lako '+o.eventName+' limetengenezwa. Ingia portal kwa PIN: '+pin+' – Nialike Go Tech')}" target="_blank">💬 Tuma PIN kwa WhatsApp</a></div>`);
    render();
  },
  cancelorder:d=>{if(confirm('Kataa agizo hili?')){DB.setOrder(d.id,'cancelled');render()}},
  /* wageni – ndani ya tukio */
  addg(){if(!val('g_n'))return alert('Weka jina la mgeni.');DB.addGuest(S.eid,val('g_n'),val('g_p'),{table:val('g_t')});render()},
  bulk(){alert(DB.importText(S.eid,val('g_bulk'))+' wageni wameongezwa.');render()},
  csvfile:(d,el)=>{const f=el.files[0];if(f){const r=new FileReader();r.onload=()=>{alert(DB.importText(S.eid,r.result)+' wageni wameongezwa.');render()};r.readAsText(f)}},
  delg:d=>{if(confirm('Futa mgeni huyu?')){DB.delGuest(d.id);render()}},
  /* wageni – tab ya Wageni */
  gf:d=>{S.f=d.k;render()},
  gsel:d=>{S.sel.has(d.id)?S.sel.delete(d.id):S.sel.add(d.id);rf()},
  gsel2:d=>{S.sel.has(d.id)?S.sel.delete(d.id):S.sel.add(d.id);render()},
  addg2(){if(!val('g_n'))return alert('Weka jina la mgeni.');DB.addGuest(curE().id,val('g_n'),val('g_p'),{table:val('g_t')});render()},
  bulk2(){alert(DB.importText(curE().id,val('g_bulk'))+' wageni wameongezwa.');render()},
  csvfile2:(d,el)=>{const f=el.files[0];if(f){const r=new FileReader();r.onload=()=>{alert(DB.importText(curE().id,r.result)+' wageni wameongezwa.');render()};r.readAsText(f)}},
  delg2:d=>{if(confirm('Futa mgeni huyu?')){DB.delGuest(d.id);S.sel.delete(d.id);render()}},
  /* Tuma Mwaliko wizard */
  tosend:()=>{const e=curE();S.mev=e.id;S.dr=ldDr(e);S.step=2;S.tab='send';render();scrollTo(0,0)},
  sev:d=>{const e=DB.ev(d.id);S.mev=e.id;S.dr=ldDr(e);S.sel=new Set();S.step=2;render()},
  sstep:d=>{if(d.k==='3'&&!S.sel.size)return alert('Chagua angalau mgeni mmoja.');S.step=+d.k;render();scrollTo(0,0)},
  selu:()=>{S.sel=new Set(GS(S.mev).filter(g=>g.phone&&!g.sent).map(g=>g.id));render()},
  sela:()=>{S.sel=new Set(GS(S.mev).filter(g=>g.phone).map(g=>g.id));render()},
  selc:()=>{S.sel=new Set();render()},
  sdraft:()=>{try{localStorage.setItem('v4dr'+S.mev,JSON.stringify(S.dr));alert('✅ Draft imehifadhiwa.')}catch(x){alert('Draft haikuhifadhiwa.')}},
  vsend0:()=>{
    S.sq=GS(S.mev).filter(g=>S.sel.has(g.id)&&g.phone).map(g=>g.id);S.si=0;
    if(!S.sq.length)return alert('Hakuna mgeni mwenye namba kwenye chaguo.');A.vq();
  },
  vq:()=>{
    const g=gst(S.sq[S.si]);
    if(!g){S.sel=new Set();S.step=1;S.mev=null;$('#dg').close();render();return alert('✅ Mialiko yote imeshughulikiwa.')}
    dlg(`<p class="m">${S.si+1} / ${S.sq.length}</p><h3>${E(g.name)}</h3><p class="m">📱 ${E(g.phone)}</p>
    <div class="row" style="justify-content:center;margin-top:12px"><button class="b" data-a="vgo">💬 Tuma WhatsApp</button><button class="b o" data-a="vskip">Ruka →</button></div>`);
  },
  vgo:()=>{const g=gst(S.sq[S.si]);open('https://wa.me/'+U.phone(g.phone)+'?text='+encodeURIComponent(build(g)),'_blank');DB.markSent(g.id);S.si++;A.vq()},
  vskip:()=>{S.si++;A.vq()},
  /* kadi */
  card:async d=>{
    const g=gst(d.id),e=DB.ev(g.eid);
    try{
      const x=await dlimg(g,e);
      dlg(`<h3>${E(g.name)}</h3><img src="${x.u}" alt="kadi ya mwaliko" style="border-radius:10px">
      <div class="row" style="justify-content:center;margin-top:10px"><a class="b" download="${x.f}" href="${x.u}">⬇ Pakua PNG</a>
      <button class="b o" data-a="share" data-id="${g.id}">🔗 Share</button><button class="b o" data-a="wa" data-id="${g.id}">💬 WhatsApp</button></div>`);
    }catch(e){dlg('<p class="m">⚠ Kadi haikutengenezwa. Fungua tovuti kwa HTTPS (si file://).</p>')}
  },
  share:async d=>{
    const g=gst(d.id),e=DB.ev(g.eid);
    try{const x=await dlimg(g,e),f=new File([x.b],x.f,{type:'image/png'});
      if(navigator.canShare&&navigator.canShare({files:[f]}))await navigator.share({files:[f],text:msg(g,e)});
      else alert('Share ya picha haipatikani kwenye kivinjari hiki. Tumia Pakua.');
    }catch(e){}
  },
  wa:d=>{const g=gst(d.id),e=DB.ev(g.eid);open('https://wa.me/'+U.phone(g.phone)+'?text='+encodeURIComponent(msg(g,e)),'_blank')},
  cards:async()=>{
    const e=DB.ev(S.eid),gs=GS(S.eid);
    if(!gs.length)return alert('Hakuna wageni.');
    if(!confirm(`Pakua kadi ${gs.length} kwa ${E(e.name)}? Itachukua muda.`))return;
    for(const g of gs){try{const x=await dlimg(g,e),a=document.createElement('a');a.href=x.u;a.download=x.f;a.click();await new Promise(r=>setTimeout(r,600))}catch(e){}}
  },
  links(){const e=DB.ev(S.eid);U.dl('links-'+e.id+'.csv',U.csv([['Jina','Namba','Link']].concat(GS(S.eid).map(g=>[g.name,g.phone,U.inviteUrl(g,e)]))),'text/csv')},
  csv(){
    const e=DB.ev(S.eid),s=DB.stats(S.eid);
    U.dl('ripoti-'+e.name.replace(/\W+/g,'-')+'.csv',U.csv(
      [['RIPOTI YA TUKIO – '+e.name],['Tarehe ya Ripoti',new Date().toLocaleString('sw-TZ')],['Tukio',e.name],['Tarehe',e.date],['Mahali',e.venue],['Pakiti',e.pkg],[],
       ['Walioalikwa',s.total],['Walioingia',s.in],['Wanasubiri',s.pending],['Asilimia',s.pct+'%'],[],['Jina','Namba','Meza','Hali','Saa ya Kuingia']]
      .concat(GS(S.eid).map(g=>[g.name,g.phone,g.table||'',g.status==='in'?'Ameingia':'Hajaingia',g.status==='in'?T(g.at):'']))
    ),'text/csv');
  },
  csv2:d=>{S.eid=d.id;A.csv();S.eid=null},
  expev(){U.dl('pack-'+S.eid+'.json',JSON.stringify(DB.exportPack(S.eid)))},
  expall(){U.dl('ngt-data-'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify(DB.exportPack()))},
  impfile:(d,el)=>{
    const f=el.files[0];if(!f)return;const r=new FileReader();
    r.onload=()=>{try{const n=DB.importPack(JSON.parse(r.result));alert(`✓ Imeingizwa:\nMatukio: ${n.e}\nWageni: ${n.g}\nScans: ${n.s}\nWatumiaji: ${n.u}`);render()}catch(e){alert('Kosa: '+e.message)}};
    r.readAsText(f);
  },
  reset(){if(confirm('⚠ FUTA DATA YOTE?\n\nHii haitaweza kurudishwa. Hakikisha una backup kwanza.')){DB.reset();A.out()}},
  /* staff */
  code(){const c=val('code').trim();if(c)handle(c);else alert('Weka code ya QR.')},
  man:d=>show(DB.manual(d.id,S.u.id,[S.eid])),
  walk(){
    if(!val('w_n'))return alert('Weka jina la mgeni.');
    const g=DB.addGuest(S.eid,val('w_n'),val('w_p'),{table:'Walk-in'});show(DB.scan(g.code,S.u.id,[S.eid]));
  },
};

/* ─── EVENT LISTENERS ─── */
document.addEventListener('click',e=>{const a=e.target.closest('[data-a]');if(a&&a.tagName!=='INPUT'&&A[a.dataset.a])A[a.dataset.a](a.dataset,a)});
document.addEventListener('change',e=>{
  const a=e.target.closest('input[type=file][data-a]');if(a&&A[a.dataset.a])A[a.dataset.a](a.dataset,a);
  if(e.target.id==='gev'){S.gev=e.target.value;S.sel=new Set();render()}
});
document.addEventListener('input',e=>{
  const id=e.target.id;
  if(id==='q'){S.q=e.target.value;const gt=$('#gt');if(gt)gt.innerHTML=S.u?.role==='staff'?rows2():rows()}
  else if(id==='gq'){S.gq=e.target.value;rf()}
  else if(/^m_(title|body|map|close)$/.test(id)){
    S.dr[id.slice(2)]=e.target.value;
    const n=$('#'+id+'_n');if(n)n.textContent=e.target.value.length+'/'+e.target.maxLength;
    const g=GS(S.mev).find(x=>S.sel.has(x.id))||{name:'Mgeni'},p=$('#pv');if(p)p.textContent=build(g);
  }
});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='pin')A.login();if(e.key==='Enter'&&e.target.id==='code')A.code()});
$('#dg').addEventListener('close',()=>{if(S.u&&S.eid&&S.u.role==='admin')try{$('#stats').innerHTML=stats();$('#gt').innerHTML=rows()}catch(e){}});
render();

/* ─── KADI YA QR (Amelipa) ─── */
async function canvasToFile(canvas,jina){
  const blob=await new Promise(r=>canvas.toBlob(r,'image/png'));
  return new File([blob],jina,{type:'image/png'});
}
async function shareFileUjumbe(file,ujumbe,simu){
  if(navigator.canShare&&navigator.canShare({files:[file]})){
    try{await navigator.share({files:[file],text:ujumbe,title:'Nialike Go Tech'});return true}catch(e){return false}
  }
  window.open(`https://wa.me/${simu}?text=${encodeURIComponent(ujumbe)}`,'_blank');return false;
}
window.tumaKadiYaQR=async function(gId){
  const g=gst(gId),ev=g&&DB.ev(g.eid);
  if(!g)return alert('Mgeni hajapatikana');
  if(!confirm(g.name+' amelipa mchango? Tuma Kadi ya QR?'))return;
  const qr=new Image();qr.crossOrigin='anonymous';
  qr.src=`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent('NIALIKE-'+g.id+'-'+g.name)}`;
  qr.onload=async()=>{
    const cv=document.createElement('canvas');cv.width=800;cv.height=1100;
    const c=cv.getContext('2d');
    c.fillStyle='#fff';c.fillRect(0,0,800,1100);
    c.fillStyle='#1a1a2e';c.fillRect(0,0,800,10);c.textAlign='center';
    c.font='bold 32px Arial';c.fillText('KADI YA KUINGIA',400,80);
    c.font='bold 38px Arial';c.fillText(g.name,400,140);
    c.font='24px Arial';c.fillText(ev.name+' | '+ev.date,400,190);
    c.drawImage(qr,250,230,300,300);
    c.font='bold 28px Arial';c.fillText('ONESHA HII GETINI',400,620);
    c.font='22px Arial';c.fillText('📍 '+ev.venue,400,680);
    const file=await canvasToFile(cv,'QR-'+g.name+'.png');
    const ujumbe=`Habari ${g.name}\nAsante! Malipo yamepokelewa ✅\nHii hapo juu ni Kadi yako ya kuingia yenye QR.\n📅 ${ev.date} | 📍 ${ev.venue}\nKuwa nayo siku ya tukio, utaionesha getini.\nKaribu Sana! - Nialike Go Tech`;
    g.paid=true;if(typeof save==='function')save();
    await shareFileUjumbe(file,ujumbe,U.phone(g.phone||g.p||''));
  };
};
