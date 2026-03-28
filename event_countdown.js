// event_countdown.js
// イベント終了までの秒読みカウントダウン管理

let countdownInterval = null;
let isCountdownActive = false;
let departureAlertSent = false;

const sampleEvent = {
    id: 'event-end',
    name: "PayPayドーム (大型ライブ)",
    lat: 33.5954,
    lon: 130.3622,
    locationName: "PayPayドーム周辺",
    message: "ライブが終了しました！約3万人の観客が一斉に退場を開始しました。タクシー需要が爆発しています！"
};

/**
 * 2地点間の直線距離を計算 (km/Haversine)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // 地球の半径 (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * 移動時間を予測 (分) - 街中の実効速度30km/hと想定
 */
function getDrivingETA(distanceKm) {
    const speedKmh = 30; 
    return Math.ceil((distanceKm / speedKmh) * 60);
}

/**
 * カウントダウンの開始
 */
function startCountdown(durationSeconds) {
    if (isCountdownActive) return;
    isCountdownActive = true;
    departureAlertSent = false;

    const card = document.getElementById('countdown-card');
    const minEl = document.getElementById('cd-minutes');
    const secEl = document.getElementById('cd-seconds');
    const etaEl = document.getElementById('eta-display'); // 新設
    const timerEl = document.querySelector('.countdown-timer');
    
    if (card) {
        card.style.display = 'block';
        card.classList.remove('departure-alert');
    }

    let remainingTime = durationSeconds;

    function updateDisplay() {
        const mins = Math.floor(remainingTime / 60);
        const secs = remainingTime % 60;
        
        if (minEl) minEl.textContent = String(mins).padStart(2, '0');
        if (secEl) secEl.textContent = String(secs).padStart(2, '0');

        // 現在地取得 (weather.js 等で取得済みの位置情報があればそれを使う、なければデフォルト)
        // ここでは一旦デモ用に適当な現在地を設定（本来は navigator.geolocation で取得）
        const currentLat = 33.5897; // 博多駅
        const currentLon = 130.4207;
        
        const dist = calculateDistance(currentLat, currentLon, sampleEvent.lat, sampleEvent.lon);
        const etaMin = getDrivingETA(dist);
        
        if (etaEl) {
            etaEl.textContent = `現在地から車で約 ${etaMin} 分`;
        }

        // 出発推奨アラート判定 (残り時間 <= ETA + 5分バッファ)
        const bufferMin = 5;
        if (!departureAlertSent && remainingTime <= (etaMin + bufferMin) * 60) {
            triggerDepartureAlert(etaMin);
        }

        // 5分(300秒)を切ったら点滅開始
        if (remainingTime <= 300) {
            timerEl.classList.add('blink');
        } else {
            timerEl.classList.remove('blink');
        }
    }

    updateDisplay();

    countdownInterval = setInterval(() => {
        remainingTime--;
        updateDisplay();

        if (remainingTime <= 0) {
            clearInterval(countdownInterval);
            finishCountdown();
        }
    }, 1000);
}

function triggerDepartureAlert(etaMin) {
    departureAlertSent = true;
    const card = document.getElementById('countdown-card');
    if (card) card.classList.add('departure-alert');

    if (typeof displayEmergencyAlert === 'function') {
        displayEmergencyAlert({
            id: 'departure-alert',
            title: '🚕 出発推奨アラート',
            body: `会場まで約${etaMin}分です。そろそろ移動を開始してください！`,
            soundText: `走行開始の時間です。会場まで約${etaMin}分かかります。イベント終了に間に合わせるため、移動を開始してください。`,
            lat: sampleEvent.lat,
            lon: sampleEvent.lon,
            toastClass: 'warning'
        });
    }
}

function finishCountdown() {
    isCountdownActive = false;
    const card = document.getElementById('countdown-card');
    if (card) {
        card.style.display = 'none';
        card.classList.remove('departure-alert');
    }

    if (typeof displayEmergencyAlert === 'function') {
        displayEmergencyAlert({
            id: 'event-end-alert',
            title: '🎉 イベント終了・特需発生',
            body: `「${sampleEvent.name}」終了！3万人の退場が始まりました！`,
            soundText: `イベント終了アラートです。${sampleEvent.name}が終了しました。約3万人の観客が一斉に退場を開始しました。タクシー需要が爆発しています。今すぐドーム周辺へ向かってください！`,
            lat: sampleEvent.lat,
            lon: sampleEvent.lon,
            popupHtml: `
                <strong style="color:#e91e63; font-size: 1.1em;">🎉 イベント終了！</strong><br>
                <b>${sampleEvent.locationName}</b><br>
                ${sampleEvent.message}<br>
                <a href="https://www.google.com/maps/dir/?api=1&destination=${sampleEvent.lat},${sampleEvent.lon}" target="_blank" class="nav-btn" style="background:#e91e63;">📍 現場へ急行する</a>
            `,
            toastClass: 'danger'
        });
    }
}

function stopCountdown() {
    clearInterval(countdownInterval);
    isCountdownActive = false;
    const card = document.getElementById('countdown-card');
    if (card) {
        card.style.display = 'none';
        card.classList.remove('departure-alert');
    }
    if (typeof removeEmergencyAlert === 'function') {
        removeEmergencyAlert('event-end-alert');
        removeEmergencyAlert('departure-alert');
    }
}

// テストボタンのイベント登録
document.addEventListener('DOMContentLoaded', () => {
    const testBtn = document.getElementById('test-countdown-btn');
    if (testBtn) {
        testBtn.addEventListener('click', () => {
            if (isCountdownActive) {
                stopCountdown();
                testBtn.textContent = '⌛️ 終了テスト';
                testBtn.style.background = '#e91e63';
            } else {
                // テスト用に、10分(600秒)のカウントダウンを開始（博多駅→ドームは約5.5km、ETA約11分なので即アラート対象になるはず）
                startCountdown(600);
                testBtn.textContent = '⏹ 停止';
                testBtn.style.background = 'var(--text-main)';
            }
        });
    }
});
