const CACHE = 'viet-pronounce-v7';
const ASSETS = ['./', './index.html', './manifest.json',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// ⭐ 网络优先：在线时始终拉取最新代码/音频，彻底避免手机旧缓存导致"修了没变"
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  // ⭐ 音频/媒体请求不拦截，交给浏览器原生处理：iOS 播放 <audio> 必须服务器返回 206 Range 响应，
  //    Service Worker 一旦拦截音频就会缓存/改写，导致 iOS 拒绝播放（表现为手机无声、桌面正常）
  if (/\.(mp3|wav|ogg|m4a|mp4|webm)$/i.test(url.pathname)) return;
  e.respondWith(
    fetch(e.request).then(resp => {
      const cp = resp.clone();
      caches.open(CACHE).then(c => c.put(e.request, cp));
      return resp;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
