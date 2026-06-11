// dazaifu_onsen.js
// 太宰府観光および二日市温泉街の特需アラート管理

document.addEventListener('DOMContentLoaded', () => {
    const dazaifuBtn = document.getElementById('test-dazaifu-btn');
    const onsenBtn = document.getElementById('test-onsen-btn');

    let dazaifuActive = false;
    let onsenActive = false;

    // 太宰府 観光客ラッシュ（夕方の帰宅やトラブル時のタクシー需要）
    if (dazaifuBtn) {
        dazaifuBtn.addEventListener('click', () => {
            dazaifuActive = !dazaifuActive;
            
            if (dazaifuActive) {
                dazaifuBtn.style.background = '#e91e63';
                dazaifuBtn.textContent = '⏹ 観光停止';
                document.body.classList.add('warning-mode');

                if (typeof displayEmergencyAlert === 'function') {
                    displayEmergencyAlert({
                        id: 'dazaifu-rush',
                        title: '⛩️ 太宰府 観光客ラッシュ発生',
                        body: '太宰府駅発のバスが満員です！西鉄二日市・JR二日市間のタクシー需要が爆発しています！',
                        soundText: '太宰府観光客ラッシュです。バスが満員のため、二日市駅周辺でのタクシー移動需要が急増しています。',
                        lat: 33.5002, // 二日市駅付近
                        lon: 130.5168,
                        toastClass: 'warning',
                        popupHtml: `
                            <b style="color:#e91e63;">⛩️ 観光客溢れ！</b><br>
                            バス停大混雑のため、タクシーでの移動希望者が多数発生中。<br>
                            太宰府方面・西鉄二日市駅へ向かってください！
                        `
                    });
                }
            } else {
                dazaifuBtn.style.background = 'var(--text-main)';
                dazaifuBtn.textContent = '⛩️ 太宰府観光';
                document.body.classList.remove('warning-mode');
                
                if (typeof removeEmergencyAlert === 'function') {
                    removeEmergencyAlert('dazaifu-rush');
                }
            }
        });
    }

    // 二日市温泉 ラッシュ（朝のチェックアウトや夜の歓楽街移動）
    if (onsenBtn) {
        onsenBtn.addEventListener('click', () => {
            onsenActive = !onsenActive;
            
            if (onsenActive) {
                onsenBtn.style.background = '#0071c5';
                onsenBtn.textContent = '⏹ 温泉停止';
                document.body.classList.add('warning-mode');

                if (typeof displayEmergencyAlert === 'function') {
                    displayEmergencyAlert({
                        id: 'onsen-rush',
                        title: '♨️ 二日市温泉 送迎ラッシュ',
                        body: '温泉街の各旅館でチェックアウト・移動ラッシュ開始！',
                        soundText: '二日市温泉街からの配車要請が増加しています。大観荘などの老舗旅館付近へ向かってください。',
                        lat: 33.4947, // 二日市温泉街付近
                        lon: 130.5125,
                        toastClass: 'warning',
                        popupHtml: `
                            <b style="color:#0071c5;">♨️ 温泉街特需</b><br>
                            宿泊客の駅への移動ラッシュ。<br>
                            旅館前での客待ちが有効です！
                        `
                    });
                }
            } else {
                onsenBtn.style.background = 'var(--text-main)';
                onsenBtn.textContent = '♨️ 二日市温泉';
                document.body.classList.remove('warning-mode');
                
                if (typeof removeEmergencyAlert === 'function') {
                    removeEmergencyAlert('onsen-rush');
                }
            }
        });
    }
});
