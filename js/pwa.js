/* FIXED PWA: Install button tu - Hakuna Service Worker wa portal */
let dip;
const std=matchMedia('(display-mode: standalone)').matches||navigator.standalone,ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
addEventListener('beforeinstallprompt',e=>{e.preventDefault();dip=e;const b=$('inst');if(b) b.hidden=false});
addEventListener('appinstalled',()=>{const b=$('inst');if(b) b.hidden=true;dip=null});
if(ios&&!std){const b=$('inst');if(b) b.hidden=false}
function install(){if(dip){dip.prompt();dip.userChoice.finally(()=>{dip=null;const b=$('inst');if(b) b.hidden=true})}else alert(L==='sw'?'Bofya Share (↑) kisha "Add to Home Screen".':'Tap Share (↑) then "Add to Home Screen".')}

// FIX: TUMEZIMA Service Worker wa zamani - ndio aliyekuwa anakupeleka portal na Hitilafu
if('serviceWorker' in navigator){
  navigator.serviceWorker.getRegistrations().then(regs=>{
    regs.forEach(r=>r.unregister());
  });
  // Hatuji-register sw.js tena!
}