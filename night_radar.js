// night_radar.js
// 終電レーダーと深夜（ネオン）モードの管理モジュール

let isNightMode = false;
let nightAlertNotified = false;

const lastTrainData = {
    id: 'night-radar',
    title: '🌙 深夜特需アラート',
    body: `あと<strong style="color:#dfb6ff;font-size:1.1rem;">わずか</strong>で 「天神駅周辺」 にて 終電間際の大混雑 が発生します！`,
    soundText: '深夜特需レーダーが反応しました。天神駅周辺で、まもなく終電です。周辺に向かってください。',
    lat: 33.5901,
    lon: 130.3986,
    popupHtml: `
        <strong style="color:#dfb6ff; font-size: 1.2em;">🌙 深夜特需アラート</strong><br>
        <b>天神駅周辺 (地下鉄/西鉄)</b><br>
        まもなく終電です。飲み屋街から自宅へ向かう長距離客が急増します！<br>
        <a href="https://www.google.com/maps/dir/?api=1&destination=33.5901,130.3986" target="_blank" class="nav-btn" style="background:#8a2be2;">📍 現場へ急行する</a>
    `
};

function enableNightMode() {
    isNightMode = true;
    document.body.classList.add('night-mode');
    
    if (!nightAlertNotified) {
        nightAlertNotified = true;
        if (typeof displayEmergencyAlert === 'function') {
            displayEmergencyAlert(lastTrainData);
        }
    }
}

function disableNightMode() {
    isNightMode = false;
    document.body.classList.remove('night-mode');
    if (typeof removeEmergencyAlert === 'function') {
        removeEmergencyAlert('night-radar');
    }
    nightAlertNotified = false;
}

function updateNightRadar() {
    const now = new Date();
    const hours = now.getHours();
    
    // 23時台〜翌2時台までは自動でナイトモードにする
    if (hours >= 23 || hours <= 2) {
        if (!isNightMode) enableNightMode();
    }
}

// DOM読み込み時にボタンのイベントを登録
document.addEventListener('DOMContentLoaded', () => {
    const testBtn = document.getElementById('test-night-btn');
    if (testBtn) {
        testBtn.addEventListener('click', () => {
            if (isNightMode) {
                disableNightMode();
                testBtn.textContent = '🌙 深夜テスト';
                testBtn.style.background = 'var(--accent-warning)';
            } else {
                enableNightMode();
                testBtn.textContent = '☀️ 昼間へ戻す';
                testBtn.style.background = '#8a2be2';
            }
        });
    }
});
