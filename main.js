// main.js - エントリーポイント（初期化処理）
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    // 1. Service Workerの登録 (PWAの要件)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker registered'))
            .catch(err => console.error('Service Worker registration failed:', err));
    }

    // 2. 通知ボタンの制御
    if (typeof setupNotificationButton === 'function') {
        setupNotificationButton();
    }

    // 3. 初期データの取得と表示
    updateTime();
    if (typeof updateEvents === 'function') updateEvents();
    
    // 4. 定期更新 (1分ごと)
    setInterval(() => {
        updateTime();
        if (typeof updateEvents === 'function') updateEvents();
    }, 60000);
    
    // 5. 現在地を取得して天気APIを叩き、マップも初期化する処理をキック
    if (typeof requestLocationAndWeather === 'function') {
        requestLocationAndWeather();
    }
}

function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    const updateEl = document.getElementById('update-time');
    if(updateEl) {
        updateEl.textContent = `最終更新: ${timeString}`;
    }
}
