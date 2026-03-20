// train.js
// 鉄道遅延情報のダミーデータ生成と画面表示ロジック

let currentTrainDelay = null;
let trainMarker = null;

function generateTrainDelay() {
    // デモ用: 常に固定の遅延トラブルを発生させておく
    if (!currentTrainDelay) {
        currentTrainDelay = {
            line: "JR鹿児島本線",
            section: "博多〜香椎間",
            reason: "踏切内安全確認",
            status: "運転見合わせ",
            lat: 33.5897, // 博多駅
            lon: 130.4207
        };
    }
    return currentTrainDelay;
}

function updateTrainDelays() {
    const delayInfo = generateTrainDelay();
    const banner = document.getElementById('train-banner');
    if (!banner) return;

    if (delayInfo) {
        banner.style.display = 'block';
        banner.innerHTML = `⚠️ <b>${delayInfo.line}</b> (${delayInfo.section}) - ${delayInfo.reason}の影響で <b><span style="color: yellow;">${delayInfo.status}</span></b>！`;
        
        // 地図上に電車遅延用のピン（緊急マーカー）を立てる
        // Leafletが初期化されているかどうかの確認
        if (typeof map !== 'undefined' && map) {
            if (!trainMarker) {
                // カスタムアイコンを使わずにPopupで目立たせます
                trainMarker = L.marker([delayInfo.lat, delayInfo.lon]).addTo(map)
                    .bindPopup(`<strong style="color:var(--accent-danger); font-size: 1.1em;">🚨 鉄道トラブル発生</strong><br><b>${delayInfo.line}</b><br>${delayInfo.reason}の影響により${delayInfo.status}！`);
            }
        }
    } else {
        banner.style.display = 'none';
        if (trainMarker && typeof map !== 'undefined' && map) {
            map.removeLayer(trainMarker);
            trainMarker = null;
        }
    }
}
