// airport.js
// 福岡空港フライト到着ラッシュ・シミュレーター

let airportMarker = null;
let airportAlertNotified = false;

// 福岡空港 国内線ターミナル
const airportData = {
    name: "福岡空港 国内線ターミナル",
    lat: 33.5852,
    lon: 130.4507,
    detail: "羽田および成田からの大型便が3便連続で到着します。15分後、タクシー乗り場にて数百人規模の列が発生する見込みです！"
};

function triggerAirportAlert() {
    if (airportAlertNotified) return;
    airportAlertNotified = true;

    // 1. マップに飛行機ピンを立てる
    if (typeof map !== 'undefined' && map) {
        const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${airportData.lat},${airportData.lon}`;
        
        // 飛行機アイコン（絵文字をアイコンとして使用）
        const flightIcon = L.divIcon({
            html: '<div style="font-size: 24px;">✈️</div>',
            className: 'flight-icon-marker',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });

        airportMarker = L.marker([airportData.lat, airportData.lon], { icon: flightIcon }).addTo(map)
            .bindPopup(`<strong style="color:#3fb1e3; font-size: 1.1em;">✈️ フライト到着ラッシュ</strong><br><b>${airportData.name}</b><br>${airportData.detail}<br><a href="${navUrl}" target="_blank" class="nav-btn" style="background:#0071c5;">📍 空港へ急行する</a>`);
        
        // 地図を空港へ移動
        map.setView([airportData.lat, airportData.lon], 14);
        airportMarker.openPopup();
    }

    // 2. 音声アラート
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted' || window.isVoiceEnabledOnly) {
        if (typeof speakAlert === 'function') {
            speakAlert(`空港特需アラートです。${airportData.name}にて、大型便の到着ラッシュが発生します。15分後、タクシー待ちが大量発生する見込みです。空港へ向かってください。`);
        }
    }

    // 3. UI通知（トースト）
    const container = document.getElementById('toast-container');
    if (container) {
        const toast = document.createElement('div');
        toast.className = `toast toast-warning`; // 空港は警告色
        toast.style.borderLeft = "5px solid #0071c5";
        toast.innerHTML = `
            <div class="toast-header"><span>✈️ 空港ラッシュ予測</span><button class="close-btn">&times;</button></div>
            <div class="toast-body">
                まもなく<strong style="color:var(--text-main); font-size:1.1rem;">大型便が3便集中</strong>！<br>
                「<strong style="color:var(--text-main);">${airportData.name}</strong>」にて<br>
                記録的な客待ちが発生します！
            </div>
        `;
        container.appendChild(toast);
        toast.querySelector('.close-btn').addEventListener('click', () => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        });
        setTimeout(() => toast.classList.add('show'), 100);
        
        // 空港は重要度が高いので少し長めに表示（15秒）
        setTimeout(() => {
            if (toast.parentElement) {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 400);
            }
        }, 15000);
    }
}

function clearAirportAlert() {
    airportAlertNotified = false;
    if (airportMarker && typeof map !== 'undefined') {
        map.removeLayer(airportMarker);
        airportMarker = null;
    }
}

// テスト用ボタンのイベント登録
document.addEventListener('DOMContentLoaded', () => {
    const testBtn = document.getElementById('test-airport-btn');
    if (testBtn) {
        testBtn.addEventListener('click', () => {
            if (airportAlertNotified) {
                clearAirportAlert();
                testBtn.textContent = '✈️ 空港テスト';
                testBtn.style.background = '#0071c5';
            } else {
                triggerAirportAlert();
                testBtn.textContent = '✈️ アラート解除';
                testBtn.style.background = 'var(--accent-danger)';
            }
        });
    }
});
