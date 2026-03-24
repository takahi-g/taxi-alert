// train.js
// 鉄道遅延情報の管理モジュール
let isTrainDelayActive = false;

function updateTrainDelays() {
    // 本来はAPIから取得するが、モックデータを定義
    const delayInfo = {
        id: 'train-delay',
        active: true,
        title: '⚠️ 鉄道運行情報',
        body: `JR鹿児島本線（博多〜香椎間）にて、踏切内安全確認の影響で <strong style="color:red;">運転見合わせ</strong>！博多駅にてタクシー需要が急増します。`,
        soundText: '鉄道運行情報です。JR鹿児島本線が運転見合わせ中です。博多駅にてタクシー需要が急増しています。周辺に向かってください。',
        lat: 33.5897,
        lon: 130.4207,
        popupHtml: `
            <strong style="color:red; font-size: 1.1em;">⚠️ 運転見合わせ中</strong><br>
            <b>博多駅 周辺</b><br>
            JR鹿児島本線の運休により、タクシー乗り場が大混雑しています。<br>
            <a href="https://www.google.com/maps/dir/?api=1&destination=33.5897,130.4207" target="_blank" class="nav-btn" style="background:#d32f2f;">📍 駅へ向かう</a>
        `
    };

    const banner = document.getElementById('train-banner');

    if (delayInfo.active && !isTrainDelayActive) {
        isTrainDelayActive = true;
        
        // 共通アラート機能の呼び出し
        if (typeof displayEmergencyAlert === 'function') {
            displayEmergencyAlert(delayInfo);
        }

        // 上部のスクロールバナーも表示
        if (banner) {
            banner.innerHTML = `⚠️ <b>JR鹿児島本線</b> (博多〜香椎間) - 踏切内安全確認の影響で <b><span style="color: yellow;">運転見合わせ</span></b>！`;
            banner.style.display = 'block';
        }
    } else if (!delayInfo.active && isTrainDelayActive) {
        isTrainDelayActive = false;
        if (typeof removeEmergencyAlert === 'function') {
            removeEmergencyAlert('train-delay');
        }
        if (banner) banner.style.display = 'none';
    }
}
