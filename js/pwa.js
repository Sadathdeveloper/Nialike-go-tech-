/* PWA: install button + service worker (needs HTTPS) */
let dip;
const std=matchMedia('(display-mode: standalone)').matches||navigator.standalone,ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
addEventListener('beforeinstallprompt',e=>{e.preventDefault();dip=e;$('inst').hidden=false});
addEventListener('appinstalled',()=>{$('inst').hidden=true;dip=null});
if(ios&&!std)$('inst').hidden=false;
function install(){if(dip){dip.prompt();dip.userChoice.finally(()=>{dip=null;$('inst').hidden=true})}else alert(L==='sw'?'Bofya Share (⬆) kisha "Add to Home Screen".':'Tap Share (⬆) then "Add to Home Screen".')}
if('serviceWorker' in navigator&&location.protocol.startsWith('http'))addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
