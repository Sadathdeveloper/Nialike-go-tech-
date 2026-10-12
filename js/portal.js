/* PORTAL – Admin / Msimamizi (scanner) / Mteja. Inaongea na backend kupitia js/store.js */
const $=s=>document.querySelector(s),E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const CARDS=['Blush Floral QR','Lace & Ribbon','Golden Rose','Ivory & Emerald','Emerald Heritage','Forest Duo','Crimson Romance'];
const ST={new:['Mpya','new'],awaiting_payment:['Inasubiri malipo','new'],paid:['Imelipwa','in'],done:['Tukio limetengenezwa','in'],cancelled:['Imekataliwa','bad']};
const S={u:null,eid:null,tab:'events',q:'',f:'all',setup:false,err:''};
let stream=null,timer=null,last='',lastAt=0,poll=null,resT=null,snd=localStorage.getItem('ngt_snd')!=='0';
const T=t=>t?new Date(t).toLocaleTimeString('sw-TZ',{hour:'2-digit',minute:'2-digit'}):'—';
const D=t=>t?new Date(t).toLocaleDateString('sw-TZ'):'—';
const val=id=>($('#'+id)||{}).value||'';
const TZS=n=>'TZS '+Number(n||0).toLocaleString('en-US');
const WA=(ph,t)=>'https://wa.me/'+(ph?U.phone(ph):'')+'?text='+encodeURIComponent(t);
const stop=()=>{clearInterval(timer);if(stream){stream.getTracks().forEach(t=>t.stop());stream=null}};

/* ---------- RENDER ---------- */
function render(){stop();const a=$('#app');
 if(S.err){a.innerHTML=`<div class="login"><div class="logo-lg">Nialike <i>Go Tech</i></div><div class="warn">${E(S.err)}</div><button class="b full" onclick="location.reload()">Jaribu tena</button></div>`;return}
 if(S.setup){a.innerHTML=`<div class="login"><div class="logo-lg">Nialike <i>Go Tech</i></div><p class="m">Tengeneza akaunti ya Admin (mara ya kwanza tu)</p><input id="s_name" placeholder="Jina lako kamili"><input id="s_pin" type="password" inputmode="numeric" placeholder="PIN (tarakimu 6–8)"><input id="s_pin2" type="password" inputmode="numeric" placeholder="Rudia PIN"><button class="b full" data-a="setup">Tengeneza akaunti ya Admin</button></div>`;return}
 if(!S.u){a.innerHTML=`<div class="login"><div class="logo-lg">Nialike <i>Go Tech</i></div><p class="m">Ingiza PIN yako</p><p class="m" style="font-size:.7rem;margin-bottom:8px">Admin · Msimamizi wa Mlango · Mteja</p><input id="pin" type="password" inputmode="numeric" placeholder="••••••" autofocus><button class="b full" data-a="login">Ingia</button><p class="m" style="margin-top:14px;font-size:.72rem">Umesahau PIN? Wasiliana na admin wa Nialike Go Tech.</p></div>`;return}
 const u=S.u,adm=u.role==='admin',nOrd=adm?DB.d.orders.filter(o=>o.status==='new').length:0;
 const tabs=adm&&!S.eid?[['events','🏷 Matukio'],['orders','📦 Maagizo'+(nOrd?` (${nOrd})`:'')],['users','👤 Watumiaji'],['settings','⚙ Mipangilio']]:[];
 a.innerHTML=`<header><b>Nialike <i>Go Tech</i></b><span>${E(u.name)} <em class="role">${u.role}</em></span><button class="b o s" data-a="out">Toka</button></header><div id="off" class="warn" style="display:none"></div>`+
 (tabs.length?`<nav>${tabs.map(([k,l])=>`<button data-a="tab" data-k="${k}" class="${S.tab===k?'on':''}">${l}</button>`).join('')}</nav>`:'')+`<main>${body()}</main>`;
 offBar();if(u.role==='staff'&&S.eid&&$('#v'))startCam()}
function offBar(){const el=$('#off');if(!el)return;const q=DB.queued(),off=!navigator.onLine;el.style.display=q||off?'block':'none';el.innerHTML=(off?'📵 Hakuna mtandao – scans zinahifadhiwa. ':'')+(q?`⏳ ${q} zinasubiri kutumwa.`:'')}
function body(){const u=S.u,ev=DB.eventsOf();
 if(u.role!=='admin'&&!S.eid){if(ev.length===1){S.eid=ev[0].id;DB.load(S.eid).then(render);return '<p class="m">Inapakia…</p>'}
  return `<h2>Chagua tukio</h2>`+(ev.map(e=>`<div class="c"><b>${E(e.name)}</b><p class="m">📅 ${e.date} ${e.time} · 📍 ${E(e.venue)}</p><button class="b" data-a="open" data-id="${e.id}">Fungua →</button></div>`).join('')||`<div class="c"><p class="m">Hujapangiwa tukio. Omba admin akupangie.</p></div>`)}
 if(S.eid)return u.role==='staff'?vScan():vEvent();
 return {events:vEvents,orders:vOrders,users:vUsers,settings:vSettings}[S.tab]()}

/* ---------- ADMIN: MATUKIO ---------- */
function vEvents(){const evs=DB.d.events;
 const tg=evs.reduce((a,e)=>a+e.s.total,0),ti=evs.reduce((a,e)=>a+e.s.in,0),no=DB.d.orders.filter(o=>o.status==='new').length;
 return `<h2>Matukio (${evs.length})</h2><div class="st"><div><b>${evs.length}</b>Matukio</div><div><b>${tg}</b>Wageni wote</div><div><b style="color:var(--g)">${ti}</b>Walioingia</div><div><b style="color:${no?'var(--gold)':'inherit'}">${no}</b>Maagizo mapya</div></div>`+(evs.map(e=>{const s=e.s;return `<div class="c ev-card"><div class="ev-top"><div><b>${E(e.name)}</b><p class="m">📅 ${e.date} ${e.time} · 📍 ${E(e.venue)}</p><p class="m">📦 ${E(e.pkg)}</p></div><button class="b" data-a="open" data-id="${e.id}">Fungua →</button></div><div class="bar"><i style="width:${s.pct}%"></i></div><div class="ev-stats"><span>👥 ${s.total}</span><span>✓ ${s.in}</span><span>⏳ ${s.pending}</span><span>📊 ${s.pct}%</span></div></div>`}).join('')||'<div class="c"><p class="m">Hakuna matukio bado. Tengeneza kutoka kwenye agizo, au hapa chini.</p></div>')+
 `<h3>+ Tukio jipya</h3><div class="c">${evForm({})}<button class="b" data-a="newev">💾 Hifadhi Tukio</button></div>`}
const evForm=e=>`<div class="row"><input id="n_name" placeholder="Jina la tukio *" value="${E(e.name)}"><input id="n_type" placeholder="Aina (Harusi...)" value="${E(e.type)}"></div><div class="row"><input id="n_date" type="date" value="${E(e.date)}"><input id="n_time" type="time" value="${E(e.time)}"></div><input id="n_venue" placeholder="Mahali *" value="${E(e.venue)}"><div class="row"><select id="n_pkg">${['Basic','Standard','Premium'].map(p=>`<option ${e.pkg===p||(!e.pkg&&p==='Standard')?'selected':''}>${p}</option>`).join('')}</select><select id="n_card">${CARDS.map((c,i)=>`<option value="${i+1}" ${e.card&&e.card.includes('card'+(i+1)+'.')?'selected':''}>${c}</option>`).join('')}</select></div>`;
const evData=()=>({name:val('n_name'),type:val('n_type'),date:val('n_date'),time:val('n_time'),venue:val('n_venue'),pkg:val('n_pkg'),card:'assets/cards/card'+val('n_card')+'.jpg'});

/* ---------- ADMIN: MAAGIZO + MALIPO ---------- */
function vOrders(){const os=DB.d.orders;
 return `<h2>Maagizo (${os.length})</h2><p class="m" style="margin-bottom:12px">Mteja anapata namba ya agizo (NGT-XXXXXX). Weka kiasi, tuma maelekezo ya malipo, thibitisha ukishapokea, kisha tengeneza tukio na PIN ya mteja.</p>`+
 (os.map(o=>{const [lb,cl]=ST[o.status]||['—',''];return `<div class="c order-card"><div class="order-top"><div><b>${E(o.eventName)}</b> <span class="tag ${cl}">${lb}</span></div><span class="m">${D(o.at)}</span></div>
 <p style="margin:6px 0"><b style="font-size:1.15rem;letter-spacing:.06em;color:var(--gold)">${E(o.ref)}</b></p>
 <div class="order-grid"><div><span class="m">Mteja</span><b>${E(o.name)}</b></div><div><span class="m">Simu</span><b><a href="tel:${E(o.phone)}">${E(o.phone)}</a></b></div><div><span class="m">Pakiti</span><b>${E(o.pkg)}</b></div><div><span class="m">Tarehe</span><b>${E(o.date)} ${E(o.time)}</b></div><div><span class="m">Mahali</span><b>${E(o.venue)}</b></div><div><span class="m">Kadi</span><b>${E(o.card||'—')}</b></div><div><span class="m">Ziada</span><b>${E(o.extras||'—')}</b></div><div><span class="m">Wageni</span><b>${o.guests.length}</b></div></div>
 ${o.notes?`<p class="m">📝 ${E(o.notes)}</p>`:''}${o.guests.length?`<details><summary class="m">Orodha ya wageni (${o.guests.length})</summary><div class="gl-preview">${o.guests.map((g,i)=>`<div class="g-row">${i+1}. ${E(g)}</div>`).join('')}</div></details>`:''}
 ${['new','awaiting_payment','paid'].includes(o.status)?`<div class="row" style="margin-top:10px"><input id="amt_${o.id}" type="number" min="0" value="${o.amount}" style="max-width:150px" title="Kiasi (TZS)"><input id="pn_${o.id}" placeholder="Maelekezo maalum ya malipo (hiari – la sivyo ya jumla)" value="${E(o.paymentNote)}"></div>
 <div class="row"><button class="b" data-a="ordsend" data-id="${o.id}">💬 Tuma maelekezo ya malipo</button><button class="b o" data-a="ordpaid" data-id="${o.id}">✅ Imelipwa</button><button class="b" data-a="mkev" data-id="${o.id}">⚡ Tengeneza tukio + PIN</button><button class="b r" data-a="cancelorder" data-id="${o.id}">✕ Kataa</button></div>`:''}
 ${o.eventId?`<button class="b o s" data-a="open" data-id="${o.eventId}" style="margin-top:8px">Fungua tukio →</button>`:''}</div>`}).join('')||'<div class="c"><p class="m">Hakuna maagizo bado.</p></div>')}

/* ---------- ADMIN: WATUMIAJI ---------- */
function vUsers(){const us=DB.d.users;
 return `<h2>Watumiaji (${us.length})</h2><p class="m" style="margin-bottom:12px">Ni admin pekee anayetengeneza PIN. Msimamizi = anascan mlangoni. Mteja = anaona dashboard ya tukio lake. PIN inaonekana mara moja tu ikitengenezwa.</p>`+
 us.map(u=>`<div class="g"><div><b>${E(u.name)}</b> <span class="tag">${u.role}</span> ${u.active?'':'<span class="tag bad">imezimwa</span>'}<p class="m">Matukio: ${u.events.map(id=>E((DB.ev(id)||{}).name||id)).join(', ')||'—'}</p></div>
 ${u.role!=='admin'?`<div class="row" style="margin:0;gap:4px"><button class="b o s" data-a="uev" data-id="${u.id}">Matukio</button><button class="b o s" data-a="upin" data-id="${u.id}">PIN mpya</button><button class="b o s" data-a="utog" data-id="${u.id}">${u.active?'Zima':'Washa'}</button><button class="b r s" data-a="deluser" data-id="${u.id}">✕</button></div>`:'<span class="m">Admin</span>'}</div>`).join('')+
 `<h3>+ Mtumiaji mpya</h3><div class="c"><input id="u_name" placeholder="Jina *"><select id="u_role"><option value="staff">👁 Msimamizi wa Mlango</option><option value="client">📱 Mteja</option></select><p class="m" style="margin:8px 0">Panga kwa matukio:</p><div class="chk-group">${DB.d.events.map(e=>`<label class="chk"><input type="checkbox" class="u_ev" value="${e.id}"> ${E(e.name)}</label>`).join('')||'<span class="m">Tengeneza tukio kwanza.</span>'}</div><button class="b" style="margin-top:10px" data-a="newuser">+ Tengeneza (PIN itatolewa na mfumo)</button></div>`}

/* ---------- ADMIN: MIPANGILIO ---------- */
const msgStatus=()=>{const m=DB.d.messaging||{};return `<p class="m">WhatsApp Business API: <b style="color:${m.whatsapp?'var(--g)':'#f87171'}">${m.whatsapp?'imewekwa ✓':'haijawekwa'}</b> · SMS (Beem): <b style="color:${m.sms?'var(--g)':'#f87171'}">${m.sms?'imewekwa ✓':'haijawekwa'}</b></p><p class="m">Link ya mialiko: ${E(m.publicUrl||'(itawekwa kiotomatiki utakapotuma)')}</p>${m.whatsapp||m.sms?'':'<p class="m" style="color:var(--gold)">Weka WA_TOKEN, WA_PHONE_ID, WA_TEMPLATE (na/au BEEM_*) kwenye faili ya .env kisha anzisha upya seva. Maelekezo: README.md → "Kutuma mialiko automatic".</p>'}`};
function vSettings(){return `<h2>Mipangilio</h2>
 <div class="c"><h3>Maelekezo ya malipo (yanaonekana kwa mteja)</h3><p class="m">Mfano: "Lipa M-Pesa 0XXX XXX XXX (jina), kisha weka namba ya agizo kama kumbukumbu." Mteja anayaona akiangalia hali ya agizo, baada ya wewe kubofya "Tuma maelekezo ya malipo".</p><textarea id="set_pay" rows="5" placeholder="Namba ya malipo na maelekezo…">${E(DB.d.settings.payment_info||'')}</textarea><button class="b" data-a="savesettings">💾 Hifadhi</button></div>
 <div class="c"><h3>Badilisha PIN yangu</h3><div class="row"><input id="my_pin" type="password" inputmode="numeric" placeholder="PIN mpya (tarakimu 6–8)"><button class="b" data-a="mypin">Badilisha</button></div></div>
 <div class="c"><h3>Kutuma mialiko automatic</h3>${msgStatus()}</div>
 <div class="c"><h3>Kumbukumbu za matendo</h3><p class="m">Nani alifanya nini na lini (100 za mwisho).</p><button class="b o" data-a="audit">📜 Angalia</button></div>
 <div class="c"><h3>Backup</h3><p class="m">Pakua nakala ya data yote (JSON). Fanya mara kwa mara, hasa kabla ya tukio kubwa.</p><button class="b o" data-a="backup">⬇ Pakua Backup</button></div>`}

/* ---------- TUKIO (admin/mteja) ---------- */
const MB={queued:['⏳ foleni',''],sent:['✓ imetumwa','in'],delivered:['✓✓ imefika','in'],read:['👁 imesomwa','in'],failed:['✕ imeshindwa','bad']};
const FL=[['all','Wote'],['in','Wameingia'],['pending','Wanasubiri'],['unsent','Hawajatumiwa'],['failed','Imeshindwa']];
const fOK=g=>S.f==='in'?g.status==='in':S.f==='pending'?g.status!=='in':S.f==='unsent'?!g.msg&&!g.sent:S.f==='failed'?g.msg==='failed':true;
function rows(){const q=S.q.toLowerCase(),adm=S.u.role==='admin',l=DB.guests(S.eid).filter(g=>fOK(g)&&(g.name+g.phone+g.table+g.short).toLowerCase().includes(q));
 if(!l.length)return `<p class="m">Hakuna wageni ${q?'wanaolingana':'bado'}.</p>`;
 return l.map(g=>`<div class="g"><div><b>${E(g.name)}</b><div class="m">${E(g.phone)||'—'} ${g.table?'· '+E(g.table):''} · Code ${g.short}</div></div><div class="g-right"><span class="tag ${g.status==='in'?'in':''}">${g.status==='in'?'✓ '+T(g.at):'⏳ anasubiri'}</span>${g.msg&&MB[g.msg]?`<span class="tag ${MB[g.msg][1]}" style="font-size:.62rem" title="${E(g.msgCh+' '+g.msgErr)}">${MB[g.msg][0]}${g.msgCh?' · '+g.msgCh:''}</span>`:g.sent?'<span class="tag in" style="font-size:.62rem">📨 kwa mkono</span>':''}${g.msg==='failed'&&g.msgErr?`<span class="m" style="font-size:.65rem;color:#f87171">${E(g.msgErr)}</span>`:''}${adm?`<div class="row" style="margin:0;gap:4px"><button class="b o s" data-a="editg" data-id="${g.id}">✏</button><button class="b o s" data-a="card" data-id="${g.id}">🎫</button><button class="b o s" data-a="resend" data-id="${g.id}" title="Tuma tena">🔁</button><button class="b r s" data-a="delg" data-id="${g.id}">✕</button></div>`:''}</div></div>`).join('')}
function stats(){const s=DB.stats(S.eid);return `<div class="st"><div><b>${s.total}</b>Walioalikwa</div><div><b style="color:var(--g)">${s.in}</b>Walioingia</div><div><b>${s.pending}</b>Wanasubiri</div><div><b style="color:${s.bad?'#f87171':'inherit'}">${s.bad}</b>Zilizokataliwa</div></div><div class="bar"><i style="width:${s.pct}%"></i></div><p class="m">${s.pct}% wamefika · Live ${new Date().toLocaleTimeString('sw-TZ',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</p>`}
function vEvent(){const e=DB.ev(S.eid),adm=S.u.role==='admin';if(!e)return '<button class="b o s" data-a="back">← Rudi</button><p class="m">Tukio halipatikani.</p>';
 return `<button class="b o s" data-a="back">← Rudi</button><h2>${E(e.name)}</h2><p class="m">📅 ${e.date} ${e.time} · 📍 ${E(e.venue)} · 📦 ${E(e.pkg)}</p><div id="stats">${stats()}</div>
 <div class="row" style="margin-top:14px"><button class="b o" data-a="csv">⬇ Ripoti CSV</button><button class="b o" onclick="print()">🖨 Print</button>${adm?`<button class="b" data-a="sendall">🚀 Tuma kwa wote (automatic)</button><button class="b o" data-a="cards">⬇ Kadi Zote</button><button class="b o" data-a="links">⬇ Links CSV</button><button class="b o" data-a="editev">✏ Hariri</button><button class="b r" data-a="delev">🗑 Futa</button>`:''}</div>
 ${adm?`<h3>Ongeza Wageni</h3><div class="c"><div class="row"><input id="g_n" placeholder="Jina *"><input id="g_p" type="tel" placeholder="0712… (hiari)"><input id="g_t" placeholder="Meza"><button class="b" data-a="addg">+ Ongeza</button></div><textarea id="g_bulk" rows="4" placeholder="Bandika orodha (kila mstari: Jina, Namba, Meza)"></textarea><div class="row"><button class="b o" data-a="bulk">📋 Ingiza Orodha</button><label class="b o" style="cursor:pointer">📁 Pakia CSV/TXT<input type="file" accept=".csv,.txt" hidden data-a="csvfile"></label></div></div>`:''}
 ${adm?`<div id="sendbox">${sendBox()}</div>`:''}<h3>Orodha ya Wageni</h3><div class="chips2">${FL.filter(f=>adm||!['unsent','failed'].includes(f[0])).map(([k,l])=>`<button data-a="filt" data-k="${k}" class="${S.f===k?'on':''}">${l}</button>`).join('')}</div><input id="q" placeholder="🔍 Tafuta jina, namba, meza au code…" value="${E(S.q)}" style="margin-bottom:10px"><div id="gt">${rows()}</div>${adm?`<h3>Scans za hivi karibuni</h3><div id="scans">${scansBox()}</div>`:''}`}
function sendBox(){const s=DB.d.send;if(!s)return '';const done=s.sent+s.delivered+s.read,act=s.queued,tot=Math.max(1,s.total-s.noPhone);
 return `<div class="c"><b>📨 Hali ya mialiko</b><div class="bar" style="margin:8px 0"><i style="width:${Math.round(done/tot*100)}%"></i></div><p class="m">✓ ${done} zimetumwa${s.delivered+s.read?` (${s.delivered+s.read} zimefika)`:''} · ⏳ ${act} zinaendelea · ✕ ${s.failed} zimeshindwa · ${s.noPhone} bila namba sahihi</p>${s.failed?'<button class="b o s" data-a="sendfailed" style="margin-top:6px">🔁 Jaribu tena zilizoshindwa</button>':''}</div>`}
function scansBox(){const n={ok:'✅ Aliingia',dup:'⚠ Mara ya pili',invalid:'❌ QR si sahihi',other:'⛔ Tukio lingine'};return DB.d.scans.slice(0,12).map(s=>{const g=DB.d.guests.find(x=>x.id===s.guest_id);return `<div class="g"><div>${n[s.res]||s.res} <b>${E(g?g.name:s.code)}</b></div><span class="m">${T(s.at)}</span></div>`}).join('')||'<p class="m">Hakuna scans bado.</p>'}

/* ---------- MSIMAMIZI: SCANNER RAHISI ---------- */
function vScan(){const e=DB.ev(S.eid);if(!e)return '<p class="m">Tukio halipatikani.</p>';
 return `${DB.eventsOf().length>1?'<button class="b o s" data-a="back">← Matukio</button>':''}<h2>🔲 ${E(e.name)}</h2><div id="stats">${stats()}</div>
 <div class="cam"><video id="v" playsinline muted></video><div id="res" class="res">📷 Inaanzisha kamera…</div></div>
 <div class="row"><button class="b o" data-a="snd" id="sndb">${snd?'🔊 Sauti ON':'🔇 Sauti OFF'}</button><button class="b o" data-a="cam">📷 Anza upya kamera</button></div>
 <details id="alt" class="c"><summary><b>Njia nyingine</b> (code fupi / tafuta jina / mgeni mpya)</summary>
 <div class="row"><input id="code" inputmode="numeric" placeholder="Code fupi (tarakimu 6) au code ya QR"><button class="b" data-a="code">✓ Thibitisha</button></div>
 <input id="q" placeholder="🔍 Tafuta jina au namba…" value="${E(S.q)}"><div id="gt" style="margin-top:8px">${rows2()}</div>
 <h3>Mgeni asiye kwenye orodha</h3><div class="row"><input id="w_n" placeholder="Jina *"><input id="w_p" type="tel" placeholder="Namba (hiari)"><button class="b" data-a="walk">+ Ingiza</button></div></details>`}
function rows2(){const q=S.q.toLowerCase(),l=DB.guests(S.eid).filter(g=>q?(g.name+g.phone+g.short).toLowerCase().includes(q):g.status!=='in').slice(0,30);
 if(!l.length)return `<p class="m">${q?'Hakuna matokeo.':'Wageni wote wameingia ✓'}</p>`;
 return l.map(g=>`<div class="g"><div><b>${E(g.name)}</b><div class="m">${E(g.phone)||'—'} ${g.table?'· '+E(g.table):''} · #${g.short}</div></div>${g.status==='in'?`<span class="tag in">✓ ${T(g.at)}</span>`:`<button class="b s" data-a="man" data-id="${g.id}">✓ Ingiza</button>`}</div>`).join('')}
async function startCam(){const r=$('#res');
 if(!('BarcodeDetector' in window)||!navigator.mediaDevices){r.innerHTML='📵 Kamera ya QR haipatikani kwenye kivinjari hiki.<br><small>Tumia Chrome ya Android, au "Njia nyingine" hapa chini.</small>';$('#alt').open=true;return}
 try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment',width:{ideal:1280}}});const v=$('#v');v.srcObject=stream;await v.play();
  const det=new BarcodeDetector({formats:['qr_code']});ready();
  timer=setInterval(async()=>{try{const f=await det.detect(v);if(f[0])handle(f[0].rawValue)}catch(e){}},250)}
 catch(e){r.innerHTML='🚫 Ruhusa ya kamera imekataliwa.<br><small>Ruhusu kamera kwenye mipangilio ya kivinjari, kisha "Anza upya kamera".</small>';$('#alt').open=true}}
const ready=()=>{const r=$('#res');if(r){r.className='res';r.innerHTML='📷 Tayari – elekeza QR kwenye kamera'}};
function beep(ok){if(!snd)return;try{const a=beep.c||(beep.c=new(window.AudioContext||window.webkitAudioContext)()),t=a.currentTime;a.state==='suspended'&&a.resume();(ok?[[880,0,.12],[1320,.13,.18]]:[[220,0,.2],[170,.24,.28]]).forEach(([f,d,l])=>{const o=a.createOscillator(),g=a.createGain();o.type=ok?'sine':'square';o.frequency.value=f;g.gain.setValueAtTime(.25,t+d);g.gain.exponentialRampToValueAtTime(.001,t+d+l);o.connect(g);g.connect(a.destination);o.start(t+d);o.stop(t+d+l)})}catch(e){}}
function show(r){const el=$('#res');if(!el)return;const g=r.guest||{};
 const m={ok:['ok','✅ RUHUSA YA KUINGIA',`${E(g.name)}<small>${[g.table,g.gate].filter(Boolean).join(' · ')}</small>`],dup:['bad','⚠ AMEKWISHA INGIA',`${E(g.name)}<small>Aliingia saa ${T(g.at)}</small>`],invalid:['bad','❌ QR SI SAHIHI','<small>Haipo kwenye mfumo</small>'],other:['bad','⛔ SI TUKIO HILI','<small>Mgeni wa tukio lingine</small>']}[r.res];
 el.className='res '+m[0];el.innerHTML=m[1]+'<div style="font-size:1.15rem;margin-top:4px">'+m[2]+'</div>'+(r.offline?'<small>(offline – itatumwa mtandao ukirudi)</small>':'');
 beep(r.res==='ok');navigator.vibrate&&navigator.vibrate(r.res==='ok'?[100]:[200,80,200]);
 try{$('#stats').innerHTML=stats();$('#gt').innerHTML=rows2();offBar()}catch(e){}
 clearTimeout(resT);resT=setTimeout(ready,4000)}
async function handle(c,manual){c=String(c).trim();if(!c)return;if(!manual&&c===last&&Date.now()-lastAt<2500)return;last=c;lastAt=Date.now();show(await DB.scan(S.eid,{code:c}))}

/* ---------- DIALOGS / MESSAGES ---------- */
const dlg=h=>{const d=$('#dg');d.innerHTML=h+`<div class="row" style="justify-content:center;margin-top:14px"><button class="b o" onclick="document.getElementById('dg').close()">Funga</button></div>`;d.showModal()};
const gst=id=>DB.d.guests.find(g=>g.id===id);
const dlimg=async(g,e)=>{const b=await cardPng(g,e);return{b,u:URL.createObjectURL(b),f:g.name.replace(/\W+/g,'_')+'.png'}};
const msg=(g,e)=>`Habari ${g.name},\n\nUmealikwa kwenye: *${e.name}*\n📅 ${e.date} saa ${e.time}\n📍 ${e.venue}\n\n🎫 Fungua mwaliko wako na QR ya kuingia:\n${U.inviteUrl(g)}\n\n(Code yako: ${g.short})\n– Nialike Go Tech`;
const pinDlg=(title,who,pin,phone)=>dlg(`<h3>${title}</h3><p class="m">${E(who)}</p><div class="pinbig">${pin}</div><p class="m">PIN hii inaonekana mara hii tu. Mpe mhusika sasa.</p><div class="row" style="justify-content:center"><button class="b o" onclick="navigator.clipboard&&navigator.clipboard.writeText('${pin}');this.textContent='✓ Imenakiliwa'">Nakili</button><a class="b" target="_blank" rel="noopener" href="${WA(phone,'Habari '+who+', PIN yako ya kuingia Nialike Go Tech ni: '+pin+'\nIngia: '+location.origin+'/portal.html')}">💬 Tuma WhatsApp</a></div>`);
const Q={l:[],i:0};
function qStep(){const g=Q.l[Q.i];if(!g){dlg('<h3>✅ Imekamilika!</h3><p class="m">Wageni wote kwenye foleni wameshughulikiwa.</p>');return}
 dlg(`<p class="m">${Q.i+1} / ${Q.l.length}</p><h3>${E(g.name)}</h3><p class="m">📱 ${E(g.phone)}</p><div class="row" style="justify-content:center"><button class="b" data-a="qsend">💬 Tuma WhatsApp</button><button class="b o" data-a="qshare">🖼 Share Kadi</button><button class="b o" data-a="qskip">Ruka →</button></div>`)}
const reload=async()=>{await DB.load(S.eid);render()};

/* ---------- ACTIONS ---------- */
const A={
async setup(){const n=val('s_name'),p=val('s_pin');if(!n)return alert('Weka jina.');if(!/^\d{6,8}$/.test(p))return alert('PIN iwe tarakimu 6–8.');if(p!==val('s_pin2'))return alert('PIN hazilingani.');
 S.u=await DB.setup(n,p);S.setup=false;await DB.load();render()},
async login(){const p=val('pin');if(!p)return;try{S.u=await DB.login(p)}catch(e){return alert(e.message)}S.eid=null;S.tab='events';await DB.load();render()},
out(){DB.clear();S.u=null;S.eid=null;render()},
async tab(d){S.tab=d.k;await DB.load();render()},
async open(d){S.eid=d.id;S.q='';S.f='all';await DB.load(S.eid);if(S.u.role==='admin')await DB.sendStatus(S.eid);render()},
async back(){S.eid=null;S.q='';await DB.load();render()},
async newev(){const o=evData();if(!o.name||!o.venue)return alert('Jaza jina la tukio na mahali (*).');await DB.addEvent(o);await DB.load();render()},
async editev(){const e=DB.ev(S.eid);dlg(`<h3>Hariri tukio</h3><div style="text-align:left">${evForm(e)}</div><button class="b" data-a="saveev">💾 Hifadhi</button>`)},
async saveev(){await DB.updEvent(S.eid,evData());$('#dg').close();await reload()},
async delev(){const e=DB.ev(S.eid);if(prompt(`Utafuta "${e.name}" pamoja na wageni na scans zote. Andika FUTA kuthibitisha:`)!=='FUTA')return;await DB.delEvent(S.eid);S.eid=null;await DB.load();render()},
async newuser(){const n=val('u_name');if(!n)return alert('Weka jina.');const evs=[...document.querySelectorAll('.u_ev:checked')].map(x=>x.value),role=val('u_role');
 if(!evs.length&&!confirm('Hujachagua tukio lolote. Endelea?'))return;const r=await DB.newUser({name:n,role,events:evs});await DB.load();render();pinDlg(role==='staff'?'PIN ya Msimamizi':'PIN ya Mteja',n,r.pin)},
async upin(d){const u=DB.d.users.find(x=>x.id===d.id);if(!confirm(`Tengeneza PIN mpya ya ${u.name}? PIN ya zamani itaacha kufanya kazi.`))return;const r=await DB.resetPin(d.id);pinDlg('PIN mpya',u.name,r.pin)},
async utog(d){const u=DB.d.users.find(x=>x.id===d.id);await DB.setUser(d.id,{active:!u.active});await DB.load();render()},
async uev(d){const u=DB.d.users.find(x=>x.id===d.id);dlg(`<h3>Matukio ya ${E(u.name)}</h3><div class="chk-group" style="text-align:left">${DB.d.events.map(e=>`<label class="chk"><input type="checkbox" class="ue" value="${e.id}" ${u.events.includes(e.id)?'checked':''}> ${E(e.name)}</label>`).join('')}</div><button class="b" data-a="saveuev" data-id="${u.id}">💾 Hifadhi</button>`)},
async saveuev(d){await DB.setUser(d.id,{events:[...document.querySelectorAll('.ue:checked')].map(x=>x.value)});$('#dg').close();await DB.load();render()},
async deluser(d){if(!confirm('Futa mtumiaji huyu?'))return;await DB.delUser(d.id);await DB.load();render()},
/* maagizo + malipo */
async ordsend(d){const o=DB.d.orders.find(x=>x.id===d.id),amount=+val('amt_'+o.id)||0,pn=val('pn_'+o.id);await DB.patchOrder(o.id,{status:'awaiting_payment',amount,payment_note:pn});
 await DB.load();render();const info=pn||DB.d.settings.payment_info||'(Maelekezo ya malipo yatatumwa hivi karibuni)';
 open(WA(o.phone,`Habari ${o.name},\n\nAgizo lako *${o.ref}* (${o.eventName}) limepokelewa.\nKiasi: *${TZS(amount)}*\n\n💳 Malipo:\n${info}\n\nTumia namba ya agizo *${o.ref}* kama kumbukumbu. Fuatilia hali ya agizo: ${location.origin}/?ref=${o.ref}#track\n\n– Nialike Go Tech`),'_blank')},
async ordpaid(d){const o=DB.d.orders.find(x=>x.id===d.id);await DB.patchOrder(o.id,{status:'paid',amount:+val('amt_'+o.id)||o.amount,payment_note:val('pn_'+o.id)});await DB.load();render()},
async cancelorder(d){if(!confirm('Kataa agizo hili?'))return;await DB.patchOrder(d.id,{status:'cancelled'});await DB.load();render()},
async mkev(d){const o=DB.d.orders.find(x=>x.id===d.id);if(o.status!=='paid'&&!confirm('Malipo bado hayajathibitishwa. Tengeneza tukio hata hivyo?'))return;
 const r=await DB.makeEvent(o.id);await DB.load();render();pinDlg('✅ Tukio limetengenezwa – PIN ya Mteja',o.name,r.pin,o.phone)},
async savesettings(){await DB.saveSettings({payment_info:val('set_pay')});alert('Imehifadhiwa ✓');await DB.load();render()},
async mypin(){const p=val('my_pin');if(!/^\d{6,8}$/.test(p))return alert('PIN iwe tarakimu 6–8.');await DB.myPin(p);alert('PIN imebadilishwa ✓');$('#my_pin').value=''},
async backup(){U.dl('ngt-backup-'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify(await DB.backup()))},
/* wageni */
async addg(){if(!val('g_n'))return alert('Weka jina la mgeni.');await DB.addGuest(S.eid,{name:val('g_n'),phone:val('g_p'),table:val('g_t')});await reload()},
async bulk(){const r=await DB.importText(S.eid,val('g_bulk'));alert(r.added+' wageni wameongezwa.');await reload()},
csvfile(d,el){const f=el.files[0];if(!f)return;const r=new FileReader();r.onload=async()=>{try{const x=await DB.importText(S.eid,r.result);alert(x.added+' wageni wameongezwa.');await reload()}catch(e){alert(e.message)}};r.readAsText(f)},
async delg(d){if(!confirm('Futa mgeni huyu?'))return;await DB.delGuest(d.id);await reload()},
async card(d){const g=gst(d.id),e=DB.ev(g.eid);try{const x=await dlimg(g,e);dlg(`<h3>${E(g.name)}</h3><img src="${x.u}" alt="kadi" style="border-radius:10px"><div class="row" style="justify-content:center;margin-top:10px"><a class="b" download="${x.f}" href="${x.u}">⬇ Pakua PNG</a><button class="b o" data-a="share" data-id="${g.id}">🔗 Share</button><button class="b o" data-a="wa" data-id="${g.id}">💬 WhatsApp</button></div>`)}catch(x){dlg('<p class="m">⚠ Kadi haikutengenezwa.</p>')}},
async share(d){const g=gst(d.id),e=DB.ev(g.eid);try{const x=await dlimg(g,e),f=new File([x.b],x.f,{type:'image/png'});navigator.canShare&&navigator.canShare({files:[f]})?await navigator.share({files:[f],text:msg(g,e)}):alert('Share ya picha haipatikani hapa. Tumia Pakua.')}catch(x){}},
wa(d){const g=gst(d.id),e=DB.ev(g.eid);open(WA(g.phone,msg(g,e)),'_blank');DB.markSent(g.id).then(()=>{g.sent=true})},
async sendall(){
 const m=await DB.call('GET','/api/messaging');
 if(!m.whatsapp&&!m.sms&&!m.mock){dlg(`<h3>Kutuma automatic bado haijawekwa</h3><p class="m" style="text-align:left">Ili mfumo utume mialiko kwa wote bila kubofya, weka WhatsApp Business API (na/au SMS) kwenye faili ya <code>.env</code> kisha anzisha upya seva. Maelekezo kamili yako kwenye README.md.</p><p class="m" style="text-align:left">Wakati huo, tumia njia ya mkono:</p><button class="b o" data-a="queue">📨 Tuma kwa foleni (mkono)</button>`);return}
 const gs=DB.guests(S.eid),n=gs.filter(g=>g.phone&&((!g.msg&&!g.sent)||g.msg==='failed')).length;
 if(!n)return alert('Hakuna wageni waliobaki kutumiwa (wote wametumiwa au hawana namba). Tumia 🔁 kwa mgeni mmoja kutuma tena.');
 if(!confirm(`Tuma mialiko kwa wageni ${n} sasa hivi? Mfumo utatuma wenyewe (WhatsApp, na SMS ikiwa WhatsApp imeshindwa).`))return;
 const r=await DB.sendAll(S.eid,'unsent');await DB.sendStatus(S.eid);await DB.load(S.eid);render();
 if(r.noPhone)alert(`Wageni ${r.noPhone} hawana namba sahihi – hawakutumiwa.`)},
async sendfailed(){await DB.sendAll(S.eid,'failed');await DB.sendStatus(S.eid);await DB.load(S.eid);render()},
async resend(d){try{await DB.sendOne(d.id)}catch(e){if(e.message==='NOT_CONFIGURED'){alert('Kutuma automatic bado haijawekwa (angalia Mipangilio). Tumia 💬 ya mkono.');return}throw e}await DB.sendStatus(S.eid);await DB.load(S.eid);render()},
editg(d){const g=gst(d.id);dlg(`<h3>Hariri mgeni</h3><div style="text-align:left"><input id="eg_n" value="${E(g.name)}" placeholder="Jina"><input id="eg_p" value="${E(g.phone)}" placeholder="Namba 0712…"><div class="row"><input id="eg_t" value="${E(g.table)}" placeholder="Meza"><input id="eg_g" value="${E(g.gate)}" placeholder="Lango"></div></div><button class="b" data-a="saveg" data-id="${g.id}">💾 Hifadhi</button>`)},
async saveg(d){await DB.updGuest(d.id,{name:val('eg_n'),phone:val('eg_p'),table:val('eg_t'),gate:val('eg_g')});$('#dg').close();await reload()},
filt(d){S.f=d.k;render()},
async audit(){const r=await DB.audit();dlg(`<h3>Kumbukumbu</h3><div style="text-align:left;max-height:50vh;overflow:auto">${r.map(x=>`<div class="g"><div><b>${E(x.name||'—')}</b> · ${E(x.action)}<div class="m">${E(x.detail)}</div></div><span class="m">${D(x.at)} ${T(x.at)}</span></div>`).join('')||'<p class="m">Tupu.</p>'}</div>`)},
async cards(){const e=DB.ev(S.eid),gs=DB.guests(S.eid);if(!gs.length)return alert('Hakuna wageni.');if(!confirm(`Pakua kadi ${gs.length}?`))return;for(const g of gs){try{const x=await dlimg(g,e),a=document.createElement('a');a.href=x.u;a.download=x.f;a.click();await new Promise(r=>setTimeout(r,600))}catch(x){}}},
links(){const e=DB.ev(S.eid);U.dl('links-'+e.id+'.csv',U.csv([['Jina','Namba','Code','Link']].concat(DB.guests(S.eid).map(g=>[g.name,g.phone,g.short,U.inviteUrl(g)]))),'text/csv')},
csv(){const e=DB.ev(S.eid),s=DB.stats(S.eid);U.dl('ripoti-'+e.name.replace(/\W+/g,'-')+'.csv',U.csv([['RIPOTI – '+e.name],['Tarehe ya ripoti',new Date().toLocaleString('sw-TZ')],['Tarehe',e.date],['Mahali',e.venue],[],['Walioalikwa',s.total],['Walioingia',s.in],['Wanasubiri',s.pending],['Asilimia',s.pct+'%'],[],['Jina','Namba','Meza','Hali','Saa']].concat(DB.guests(S.eid).map(g=>[g.name,g.phone,g.table||'',g.status==='in'?'Ameingia':'Hajaingia',g.status==='in'?T(g.at):'']))),'text/csv')},
queue(){Q.l=DB.guests(S.eid).filter(g=>!g.sent&&g.phone);Q.i=0;if(!Q.l.length)return alert('Hakuna wageni wenye namba ambao hawajatumwa.');qStep()},
qsend(){const g=Q.l[Q.i];A.wa({id:g.id});Q.i++;qStep()},qskip(){Q.i++;qStep()},async qshare(){const g=Q.l[Q.i];await A.share({id:g.id});DB.markSent(g.id);Q.i++;qStep()},
/* scanner */
cam(){stop();startCam()},
snd(){snd=!snd;localStorage.setItem('ngt_snd',snd?'1':'0');$('#sndb').textContent=snd?'🔊 Sauti ON':'🔇 Sauti OFF';beep(true)},
code(){const c=val('code');if(c){handle(c,true);$('#code').value=''}},
async man(d){show(await DB.scan(S.eid,{gid:d.id}))},
async walk(){if(!val('w_n'))return alert('Weka jina.');try{show(await DB.walkin(S.eid,val('w_n'),val('w_p')));await DB.load(S.eid);$('#gt').innerHTML=rows2()}catch(e){alert(e.message)}}};

document.addEventListener('click',e=>{const a=e.target.closest('[data-a]');if(a&&a.tagName!=='INPUT'&&A[a.dataset.a])Promise.resolve(A[a.dataset.a](a.dataset,a)).catch(x=>alert(x.message))});
document.addEventListener('change',e=>{const a=e.target.closest('input[type=file][data-a]');if(a&&A[a.dataset.a])A[a.dataset.a](a.dataset,a)});
document.addEventListener('input',e=>{if(e.target.id==='q'){S.q=e.target.value;const g=$('#gt');if(g)g.innerHTML=S.u&&S.u.role==='staff'?rows2():rows()}});
document.addEventListener('keydown',e=>{if(e.key==='Enter'){if(e.target.id==='pin')A.login();if(e.target.id==='code')A.code()}});
addEventListener('online',()=>{DB.flush().then(()=>S.u&&S.eid&&reload())});addEventListener('offline',offBar);
DB.onAuthFail=()=>{S.u=null;S.eid=null;render()};

/* sasisha live (skrini ya tukio) na tuma foleni ya offline */
setInterval(async()=>{if(!S.u)return;await DB.flush();
 if(S.eid){try{await DB.load(S.eid);if(S.u.role==='admin'){await DB.sendStatus(S.eid);const sb=$('#sendbox'),sc=$('#scans');if(sb)sb.innerHTML=sendBox();if(sc)sc.innerHTML=scansBox()}const s=$('#stats'),g=$('#gt');if(s)s.innerHTML=stats();if(g&&document.activeElement!==$('#q'))g.innerHTML=S.u.role==='staff'?rows2():rows();offBar()}catch(e){offBar()}}
 else if(S.u.role==='admin'&&S.tab!=='settings'&&!document.querySelector('input:focus,textarea:focus,select:focus')&&!$('#dg').open){try{const sg=()=>JSON.stringify([DB.d.orders.map(o=>o.id+o.status),DB.d.events.map(e=>e.id+e.s.in+e.s.total)]),before=sg();await DB.load();if(sg()!==before)render()}catch(e){}}},4000);
$('#dg').addEventListener('close',()=>{if(S.u&&S.u.role==='admin'&&S.eid){const s=$('#stats'),g=$('#gt');if(s)s.innerHTML=stats();if(g)g.innerHTML=rows()}});

(async()=>{try{S.setup=await DB.needsSetup()}catch(e){S.err='Seva haipatikani. Hakikisha backend inaendesha (npm start) na una mtandao.'}
 if(!S.err&&!S.setup&&DB.token){try{S.u=await DB.restore();await DB.load()}catch(e){S.u=null}}
 render()})();
