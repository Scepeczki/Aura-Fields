// Service worker: gra działa offline po pierwszym uruchomieniu z serwera (np. GitHub Pages).
const CACHE='aura-fields-1.0.1';
const FILES=['./','./index.html','./data.js','./game.js','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png','./bg/wiosna-dzien.jpg','./bg/lato-dzien.jpg','./bg/jesien-dzien.jpg','./bg/zima-dzien.jpg','./bg/wiosna-noc.jpg','./bg/lato-noc.jpg','./bg/jesien-noc.jpg','./bg/zima-noc.jpg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
// najpierw sieć (świeża wersja gry), a bez sieci kopia z pamięci podręcznej
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;
  e.respondWith(fetch(e.request).then(r=>{const cp=r.clone();caches.open(CACHE).then(c=>c.put(e.request,cp));return r}).catch(()=>caches.match(e.request)))});
