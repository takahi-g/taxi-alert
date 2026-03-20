// シンプルなService Worker（PWAインストール要件を満たすため）
const CACHE_NAME = 'taxi-alert-v1';

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    // ネットワーク優先ですが、キャッシュはしません（今回はデモのため）
    event.respondWith(
        fetch(event.request).catch(error => {
            console.error('Fetch failed:', error);
            throw error;
        })
    );
});
