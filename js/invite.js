/* Mwaliko wa mgeni: data inatoka seva kwa code (invite.html?c=CODE) */
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const w=document.getElementById('w'),code=new URLSearchParams(location.search).get('c');
const fail=()=>{w.innerHTML='<h1>Mwaliko haupatikani</h1><p class="m">Link si sahihi. Omba mwenyeji akutumie tena.<br>Invalid link.</p>'};
(async()=>{
 if(!code)return fail();
 let r;try{r=await fetch(((window.NGT_CONFIG&&NGT_CONFIG.API)||'')+'/api/invite/'+encodeURIComponent(code));if(!r.ok)return fail();r=await r.json()}catch(e){w.innerHTML='<h1>Hakuna mtandao</h1><p class="m">Jaribu tena ukiwa na mtandao.</p>';return}
 const g=r.guest,e=r.event;
 w.innerHTML=`<img class="cd" id="cp" alt="Kadi" src="${qrImg(g.code)}"><p class="eb">Umealikwa · You're invited</p><h1>${E(g.name)}</h1><p>${E(e.name)}</p><p class="m">📅 ${E(e.date)} · ${E(e.time)}<br>📍 ${E(e.venue)}${g.table?'<br>🪑 '+E(g.table):''}</p>
 <a class="b" id="sv" download="mwaliko.png">⬇ Hifadhi kadi (picha) / Save card</a>
 <p class="m">Onyesha kadi hii mlangoni au taja code: <b>${E(g.short)}</b>. Itumike mara moja tu.<br>Show this card at the gate or say your code. One-time use.</p>
 <a class="b" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(e.venue)}">📍 Ramani / Map</a>
 <button class="b o" id="ics">📅 Weka kwenye kalenda / Add to calendar</button>`;
 cardPng({name:g.name,code:g.code,table:g.table,short:g.short},{name:e.name,card:e.card}).then(b=>{const u=URL.createObjectURL(b);document.getElementById('cp').src=u;document.getElementById('sv').href=u}).catch(()=>document.getElementById('sv').remove());
 document.getElementById('ics').onclick=()=>{const d=(e.date||'').replace(/-/g,''),t=(e.time||'1800').replace(':','')+'00',s=['BEGIN:VCALENDAR','VERSION:2.0','BEGIN:VEVENT','DTSTART:'+d+'T'+t,'SUMMARY:'+e.name,'LOCATION:'+e.venue,'END:VEVENT','END:VCALENDAR'].join('\r\n'),a=document.createElement('a');a.href=URL.createObjectURL(new Blob([s],{type:'text/calendar'}));a.download='mwaliko.ics';a.click()}
})();
