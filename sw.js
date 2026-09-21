/* Japan Master Board · service worker v1
   - map tiles, fonts and sprites from OpenFreeMap: cache-first (once seen, drawn offline)
   - the board page itself: network-first, cached copy when offline
   - everything else (live lookups): network only */
var VERSION='jmb-sw-v1';
var TILE_HOSTS=['tiles.openfreemap.org'];
self.addEventListener('install',function(e){self.skipWaiting();});
self.addEventListener('activate',function(e){e.waitUntil(self.clients.claim());});
self.addEventListener('fetch',function(e){
  var url=new URL(e.request.url);
  if(e.request.method!=='GET')return;
  if(TILE_HOSTS.indexOf(url.host)>=0){
    e.respondWith(caches.open(VERSION+'-tiles').then(function(c){return c.match(e.request).then(function(hit){ if(hit)return hit; return fetch(e.request).then(function(res){ if(res&&res.ok)c.put(e.request,res.clone()); return res; }); });}));
    return;
  }
  if(e.request.mode==='navigate'||(url.origin===self.location.origin&&/\.html$|\/$/.test(url.pathname))){
    e.respondWith(fetch(e.request).then(function(res){ var copy=res.clone(); caches.open(VERSION+'-page').then(function(c){c.put(e.request,copy);}); return res; }).catch(function(){ return caches.open(VERSION+'-page').then(function(c){return c.match(e.request);}).then(function(hit){ return hit||caches.match('/board/board.html')||caches.match('/board/index.html')||new Response('offline',{status:503}); }); }));
    return;
  }
});
self.addEventListener('message',function(e){ if(e.data&&e.data.type==='stats'){ caches.open(VERSION+'-tiles').then(function(c){return c.keys();}).then(function(keys){ e.source&&e.source.postMessage({type:'stats',tiles:keys.length}); }); } if(e.data&&e.data.type==='clear'){ caches.delete(VERSION+'-tiles'); } });
