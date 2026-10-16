/* Nialike Go Tech – main logic: language, cards, guests, order -> WhatsApp */
let L='sw';
function setLang(){
  L=L==='sw'?'en':'sw';
  document.documentElement.lang=L;
  document.getElementById('lg').textContent=L==='sw'?'EN':'SW';
 // FIX: Tambua admin kutoka portal
if(localStorage.getItem('isAdmin')==='true' || localStorage.getItem('ngt_tok')==='admin-ok'){
  localStorage.setItem('ngt_role','admin');
  // Lazimisha kuonyesha dashboard ya admin, si ya mteja
  if(location.hash==='#admin' || localStorage.getItem('isAdmin')){
    // hapa code yako ya kuonyesha admin panel ipo
    console.log('ADMIN MODE ACTIVE - Moyo wa system');
  }
} document.querySelectorAll('[t]').forEach(e=>e.textContent=e.getAttribute('t').split('|')[L==='sw'?0:1]);
}
document.querySelectorAll('[t]').forEach(e=>e.textContent=e.getAttribute('t').split('|')[0]);
document.querySelectorAll('.pk').forEach(p=>p.onclick=()=>{document.querySelectorAll('.pk').forEach(x=>x.classList.remove('on'));p.classList.add('on')});

let card='Blush Floral QR';
document.querySelectorAll('.cd').forEach(c=>c.onclick=()=>{document.querySelectorAll('.cd').forEach(x=>x.classList.remove('on'));c.classList.add('on');card=c.dataset.v;document.getElementById('cnote').textContent='✓ '+card});
function prev(){const n=document.getElementById('en').value||'Jina la Tukio',d=document.getElementById('d').value||'Tarehe';
document.querySelectorAll('.pn').forEach(e=>e.textContent=n);document.querySelectorAll('.pd').forEach(e=>e.textContent=d)}
['en','d'].forEach(i=>document.getElementById(i).addEventListener('input',prev));
function zoom(e,i){e.stopPropagation();const l=document.getElementById("lb");l.firstChild.src=e.currentTarget.closest(".cd").querySelector("img").src;l.classList.add("on")}
function addG(n='',p=''){const r=document.createElement('div');r.className='gr';
r.innerHTML='<input placeholder="Jina / Name"><input type="tel" placeholder="+255 7XX"><button type="button" onclick="this.parentElement.remove()">✕</button>';
r.children[0].value=n;r.children[1].value=p;document.getElementById('gl').appendChild(r)}
addG();addG();
function guests(){const l=[...document.querySelectorAll('#gl .gr')].map(r=>[r.children[0].value.trim(),r.children[1].value.trim()].join(' | ')).filter(x=>x!==' | ');
return l.concat(document.getElementById('bulk').value.split('\n').map(x=>x.trim()).filter(Boolean))}
const LIM={Basic:100,Standard:300},F=['n','ph','ev','en','d','t','v','gc','nt','lang','pay'],$=id=>document.getElementById(id);
const DOCS={p:['Sera ya Faragha|Privacy Policy','Tunakusanya majina na namba za wageni kwa ajili ya mialiko na ingizo la tukio pekee.|We collect guest names and phone numbers only for invitations and event admission.','Data haiuzwi wala kushirikishwa, na inafutwa ukiomba baada ya tukio.|Data is never sold or shared, and is deleted on request after the event.'],
t:['Masharti|Terms of Service','Agizo linathibitishwa baada ya malipo kuthibitishwa na Nialike Go Tech.|A booking is confirmed once payment is verified by Nialike Go Tech.','Mteja anahakikisha ana ruhusa ya kutumia namba za wageni; kughairi na mabadiliko vinakubaliwa kabla ya tukio.|The client confirms permission to use guest numbers; cancellations and changes are agreed before the event.']};
function doc(k){const d=DOCS[k],i=L==='sw'?0:1;$('dgb').innerHTML='<h3>'+d[0].split('|')[i]+'</h3><p>'+d[1].split('|')[i]+'</p><p>'+d[2].split('|')[i]+'</p>';$('dg').showModal()}
const okp=p=>/^(\+?255|0)[67]\d{8}$/.test(p.replace(/[\s-]/g,''));
function sm(){const pk=document.querySelector('.pk.on').dataset.v,lim=LIM[pk.split(' ')[0]],n=guests().length,g=+$('gc').value||0,i=L==='sw'?0:1;
$('sm').innerHTML='<p><b>'+(i?'Summary':'Muhtasari')+'</b></p><p>📦 '+pk+'</p><p>🎨 '+card+'</p><p>👥 '+n+' / '+(g||'—')+'</p>'+(lim&&Math.max(n,g)>lim?'<p class="w">⚠ '+(i?'Over the package limit of ':'Zaidi ya kikomo cha pakiti: ')+lim+'</p>':'')}
function save(){try{const o={};F.forEach(k=>o[k]=$(k).value);localStorage.setItem('ngt',JSON.stringify(o))}catch(e){}}
try{const o=JSON.parse(localStorage.getItem('ngt')||'{}');F.forEach(k=>o[k]&&($(k).value=o[k]))}catch(e){}
$('d').min=new Date().toISOString().slice(0,10);
$('fu').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{$('bulk').value=($('bulk').value+'\n'+r.result).trim();sm()};r.readAsText(f)};
document.addEventListener('input',()=>{save();sm()});document.addEventListener('click',()=>setTimeout(sm));
sm();addEventListener('scroll',()=>$('up').classList.toggle('on',scrollY>600));
const API=(window.NGT_CONFIG&&NGT_CONFIG.API)||'',WA_NO='255692081628',LBL={sw:{new:'Imepokelewa – tunalikagua agizo lako.',awaiting_payment:'Tunasubiri malipo yako.',paid:'Malipo yamethibitishwa. Tunaandaa tukio lako.',done:'Tukio lako limeandaliwa. Utapewa PIN ya portal kupitia WhatsApp.',cancelled:'Agizo hili limekataliwa. Wasiliana nasi kwa WhatsApp.'},en:{new:'Received – we are reviewing your order.',awaiting_payment:'Waiting for your payment.',paid:'Payment confirmed. We are preparing your event.',done:'Your event is ready. You will get your portal PIN on WhatsApp.',cancelled:'This order was cancelled. Contact us on WhatsApp.'}};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function send(e){
  e.preventDefault();
  const sw=L==='sw';
  if(!okp($('ph').value)){alert(sw?'Namba ya simu si sahihi (mfano 0712345678).':'Invalid phone number (e.g. 0712345678).');$('ph').focus();return}
  const lim=LIM[document.querySelector('.pk.on').dataset.v.split(' ')[0]];
  if(lim&&Math.max(guests().length,+$('gc').value)>lim&&!confirm(sw?'Wageni wamezidi kikomo cha pakiti. Endelea?':'Guests exceed the package limit. Continue?'))return;
  const v=id=>$(id).value||'',btn=document.querySelector('#order form button.btn.w'),pk=document.querySelector('.pk.on').dataset.v;
  const body={name:v('n'),phone:v('ph'),type:v('ev').split(' ')[0],eventName:v('en'),date:v('d'),time:v('t'),venue:v('v'),pkg:pk,card,cardImg:document.querySelector('.cd.on img')?.getAttribute('src'),extras:[...document.querySelectorAll('.ex input:checked')].map(x=>x.value).join(', '),pay:v('pay'),lang:v('lang'),notes:v('nt'),guests:guests()};
  btn.disabled=true;
  try{
    const r=await fetch(API+'/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),j=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(j.error||'Hitilafu');
    const wa='https://wa.me/'+WA_NO+'?text='+encodeURIComponent(`Habari Nialike Go Tech,\nNimetuma agizo.\nNamba ya agizo: ${j.ref}\nTukio: ${body.eventName}\nPakiti: ${j.pkg}\nJina: ${body.name}\nTafadhali nitumie maelekezo ya malipo.`);
    $('done').innerHTML=`<div class="c" style="max-width:560px;border-color:var(--g)"><p class="ok"><b>✓ ${sw?'Agizo limepokelewa!':'Order received!'}</b></p><p class="mu">${sw?'Namba ya agizo lako:':'Your order number:'}</p><p style="font-size:1.8rem;font-weight:800;letter-spacing:.08em;color:var(--gold)" id="refv">${esc(j.ref)}</p><p class="mu">${sw?'Hifadhi au shiriki namba hii. Tutakutumia maelekezo ya malipo; tumia namba hii kama kumbukumbu ya malipo yako.':'Save or share this number. We will send payment instructions; use it as your payment reference.'}</p><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button class="btn sm" type="button" onclick="navigator.clipboard&&navigator.clipboard.writeText('${esc(j.ref)}');this.textContent='✓'">${sw?'Nakili namba':'Copy number'}</button><a class="btn w sm" target="_blank" rel="noopener" href="${wa}">${sw?'Tuma WhatsApp kwa Nialike':'Send to Nialike on WhatsApp'}</a><a class="btn o sm" href="?ref=${esc(j.ref)}#track">${sw?'Fuatilia agizo':'Track order'}</a></div></div>`;
    $('done').scrollIntoView({behavior:'smooth',block:'center'});
    try{localStorage.removeItem('ngt')}catch(x){}
  }catch(err){alert((sw?'Agizo halikutumwa: ':'Order failed: ')+err.message+(sw?'\nJaribu tena au tuma kwa WhatsApp.':'\nTry again or contact us on WhatsApp.'))}
  finally{btn.disabled=false}
}
async function track(){
  const ref=($('tr').value||'').trim().toUpperCase(),box=$('trr'),sw=L==='sw';if(!ref)return;
  box.style.display='block';box.textContent='…';
  try{
    const r=await fetch(API+'/api/orders/'+encodeURIComponent(ref)+'/status'),j=await r.json();
    if(!r.ok)throw new Error(j.error);
    box.innerHTML=`<p style="font-weight:800;letter-spacing:.06em;color:var(--gold)">${esc(j.ref)}</p><p><b>${esc(j.eventName)}</b> · ${esc(j.pkg)}</p><p class="mu">${esc(LBL[sw?'sw':'en'][j.status]||j.status)}</p>`+(j.status==='awaiting_payment'?`<p style="margin-top:8px"><b>${sw?'Kiasi':'Amount'}: TZS ${Number(j.amount).toLocaleString('en-US')}</b></p><p style="white-space:pre-wrap;margin-top:6px">${esc(j.paymentInfo||(sw?'Maelekezo ya malipo yatatumwa kwa WhatsApp.':'Payment instructions will be sent on WhatsApp.'))}</p><p class="mu" style="margin-top:6px">${sw?'Weka namba ya agizo kama kumbukumbu.':'Use the order number as reference.'}</p>`:'');
  }catch(err){box.innerHTML='<p class="mu">'+esc(err.message||'Hitilafu')+'</p>'}
}
(()=>{const r=new URLSearchParams(location.search).get('ref');if(r){$('tr').value=r;addEventListener('load',()=>track())}})();
