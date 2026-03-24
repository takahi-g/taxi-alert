// airport.js
// 福岡空港フライト到着ラッシュ・シミュレーター

let airportAlertNotified = false;

function triggerAirportAlert() {
    if (airportAlertNotified) return;
    airportAlertNotified = true;

    if (typeof displayEmergencyAlert === 'function') {
        const airportData = {
            id: 'airport-rush',
            title: '✈️ 空港ラッシュ予測',
            body: `まもなく<strong style="color:var(--text-main); font-size:1.1rem;">大型便が3便集中</strong>！<br>福岡空港にて記録的な客待ちが発生します！`,
            soundText: '空港特需アラートです。福岡空港にて、大型便の到着ラッシュが発生します。15分後、タクシー待ちが大量発生する見込みです。空港へ向かってください。',
            lat: 33.5852,
            lon: 130.4507,
            popupHtml: `
                <strong style="color:#3fb1e3; font-size: 1.1em;">✈️ フライト到着ラッシュ</strong><br>
                <b>福岡空港 国内線ターミナル</b><br>
                羽田および成田からの大型便が3便連続で到着します。15分後、タクシー乗り場にて数百人規模の列が発生する見込みです！<br>
                <a href="https://www.google.com/maps/dir/?api=1&destination=33.5852,130.4507" target="_blank" class="nav-btn" style="background:#0071c5;">📍 空港へ急行する</a>
            `
        };
        displayEmergencyAlert(airportData);
    }
}

function clearAirportAlert() {
    airportAlertNotified = false;
    if (typeof removeEmergencyAlert === 'function') {
        removeEmergencyAlert('airport-rush');
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
