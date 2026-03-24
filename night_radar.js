// night_radar.js
// 終電レーダーと深夜（ネオン）モードの管理モジュール

let isNightMode = false;
let nightMarker = null;
let nightAlertNotified = false;

const lastTrainData = {
    name: "天神駅周辺 (地下鉄/西鉄)",
    type: "終電間際の大混雑",
    lat: 33.5901,
    lon: 130.3986,
    reason: "まもなく終電です。飲み屋街から自宅へ向かう長距離客が急増します！"
};

function enableNightMode() {
    isNightMode = true;
    document.body.classList.add('night-mode');
    
    if (!nightAlertNotified) {
        nightAlertNotified = true;
        
        // 1. マップに特大ピンを立てる
        if (typeof map !== 'undefined' && map) {
            const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${lastTrainData.lat},${lastTrainData.lon}`;
            nightMarker = L.marker([lastTrainData.lat, lastTrainData.lon]).addTo(map)
                .bindPopup(`<strong style="color:#dfb6ff; font-size: 1.2em;">🌙 深夜特需アラート</strong><br><b>${lastTrainData.name}</b><br>${lastTrainData.reason}<br><a href="${navUrl}" target="_blank" class="nav-btn" style="background:#8a2be2;">📍 現場へ急行する</a>`);
            
            // 地図の中心を移動
            map.setView([lastTrainData.lat, lastTrainData.lon], 13);
            nightMarker.openPopup();
        }

        // 2. 音声アナウンス
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted' || window.isVoiceEnabledOnly) {
            if (typeof speakAlert === 'function') {
                speakAlert(`深夜特需レーダーが反応しました。${lastTrainData.name}で、${lastTrainData.reason}周辺に向かってください。`);
            }
        }
        
        // 3. UIトースト
        const container = document.getElementById('toast-container');
        if (container) {
            const toast = document.createElement('div');
            toast.className = `toast toast-danger`;
            toast.innerHTML = `
                <div class="toast-header"><span>🌙 深夜特需アラート</span><button class="close-btn">&times;</button></div>
                <div class="toast-body">あと<strong style="color:#dfb6ff;font-size:1.1rem;">わずか</strong>で<br>「<strong style="color:var(--text-main);">${lastTrainData.name}</strong>」にて<br>${lastTrainData.type} が発生します！</div>
            `;
            container.appendChild(toast);
            toast.querySelector('.close-btn').addEventListener('click', () => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 400);
            });
            setTimeout(() => toast.classList.add('show'), 100);
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 400);    
            }, 12000);
        }
    }
}

function disableNightMode() {
    isNightMode = false;
    document.body.classList.remove('night-mode');
    if (nightMarker && typeof map !== 'undefined') {
        map.removeLayer(nightMarker);
        nightMarker = null;
    }
    nightAlertNotified = false;
}

function updateNightRadar() {
    const now = new Date();
    const hours = now.getHours();
    
    // 23時台〜翌2時台までは自動でナイトモードにする（本番動作）
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
