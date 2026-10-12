const CACHE='nialike-v3';
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['/portal.html','/manifest.webmanifest']).catch(()=>{})).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(self.clients.claim())});
self.addEventListener('fetch',e=>{if(e.request.url.includes('/api/')){e.respondWith(fetch(e.request).catch(()=>new Response('{"offline":true}',{headers:{'Content-Type':'application/json'}})))}else{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)).catch(()=>caches.match('/portal.html')))}});
