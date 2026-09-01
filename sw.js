// sw.js - Service Worker（离线缓存 index_all_in_one.html 整包）
const CACHE_NAME = 'viet-pronounce-v3';
const ENTRY = './index_all_in_one.html';
const ASSETS = [
    ENTRY,
    './',
    './manifest.json',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './icons/apple-touch-icon.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
            )
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const req = event.request;
    if (req.method !== 'GET') return;
    const url = new URL(req.url);
    if (url.origin !== self.location.origin) return;

    // 导航请求（打开页面）：网络优先，失败回退已缓存入口
    if (req.mode === 'navigate') {
        event.respondWith(
            fetch(req).catch(() =>
                caches.match(ENTRY).then(r => r || caches.match('./'))
            )
        );
        return;
    }

    // 其他资源：缓存优先，缺失再走网络并写入缓存
    event.respondWith(
        caches.match(req).then(res =>
            res || fetch(req).then(net => {
                const clone = net.clone();
                caches.open(CACHE_NAME).then(c => c.put(req, clone));
                return net;
            }).catch(() => res)
        )
    );
});
