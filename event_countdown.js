// event_countdown.js
// イベント終了までの秒読みカウントダウン管理

let countdownInterval = null;
let isCountdownActive = false;

const sampleEvent = {
    id: 'event-end',
    name: "PayPayドーム (大型ライブ)",
    lat: 33.5954,
    lon: 130.3622,
    locationName: "PayPayドーム周辺",
    message: "ライブが終了しました！約3万人の観客が一斉に退場を開始しました。タクシー需要が爆発しています！"
};

/**
 * カウントダウンの開始 (テスト用にも使用)
 * @param {number} durationSeconds - カウントダウン秒数
 */
function startCountdown(durationSeconds) {
    if (isCountdownActive) return;
    isCountdownActive = true;

    const card = document.getElementById('countdown-card');
    const minEl = document.getElementById('cd-minutes');
    const secEl = document.getElementById('cd-seconds');
    const timerEl = document.querySelector('.countdown-timer');
    
    if (card) card.style.display = 'block';

    let remainingTime = durationSeconds;

    function updateDisplay() {
        const mins = Math.floor(remainingTime / 60);
        const secs = remainingTime % 60;
        
        if (minEl) minEl.textContent = String(mins).padStart(2, '0');
        if (secEl) secEl.textContent = String(secs).padStart(2, '0');

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

function finishCountdown() {
    isCountdownActive = false;
    const card = document.getElementById('countdown-card');
    if (card) card.style.display = 'none';

    // 共通アラート機能でド派手に通知！
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
    if (card) card.style.display = 'none';
    if (typeof removeEmergencyAlert === 'function') {
        removeEmergencyAlert('event-end-alert');
    }
}

// テストボタンのイベント登録
document.addEventListener('DOMContentLoaded', () => {
    const testBtn = document.getElementById('test-countdown-btn');
    if (testBtn) {
        testBtn.addEventListener('click', () => {
            if (isCountdownActive) {
                stopCountdown();
                testBtn.textContent = '⌛️ 終了テ';
                testBtn.style.background = '#e91e63';
            } else {
                // テスト用に、3分(180秒)のカウントダウンを開始
                startCountdown(180);
                testBtn.textContent = '⏹ 停止';
                testBtn.style.background = 'var(--text-main)';
            }
        });
    }
});
