document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    updateTime();
    updateEvents();
    // 1分ごとに時計とデータを更新
    setInterval(() => {
        updateTime();
        updateEvents();
    }, 60000);
    
    // 現在地を取得して天気APIを叩く
    requestLocationAndWeather();
}

function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('update-time').textContent = `最終更新: ${timeString}`;
}

function requestLocationAndWeather() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                document.getElementById('location-name').textContent = `GPS座標 (${lat.toFixed(2)}, ${lon.toFixed(2)})`;
                fetchWeather(lat, lon);
            },
            (error) => {
                console.warn("位置情報の取得に失敗しました。デフォルト位置（博多駅周辺）を使用します。", error);
                document.getElementById('location-name').textContent = "博多駅周辺 (デフォルト)";
                fetchWeather(33.5897, 130.4207);
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    } else {
        document.getElementById('location-name').textContent = "博多駅周辺 (デフォルト)";
        fetchWeather(33.5897, 130.4207);
    }
}

async function fetchWeather(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=precipitation_probability,precipitation&timezone=Asia%2FTokyo`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        
        const now = new Date();
        const currentHourStr = now.toISOString().slice(0,14) + "00";
        
        let currentIndex = 0;
        const times = data.hourly.time;
        for (let i = 0; i < times.length; i++) {
            const timeDate = new Date(times[i]);
            if (timeDate >= now) {
                currentIndex = i;
                break;
            }
        }

        const prob = data.hourly.precipitation_probability[currentIndex];
        const amount = data.hourly.precipitation[currentIndex];

        updateUI(prob, amount);

    } catch (error) {
        console.error("天気データの取得に失敗しました", error);
        document.getElementById('status-message').textContent = "データ取得エラー";
    }
}

function updateUI(probability, amount) {
    const probEl = document.getElementById('rain-prob');
    const amountEl = document.getElementById('rain-amount');
    const statusCard = document.getElementById('alert-status-card');
    const statusIcon = document.getElementById('status-icon');
    const statusMessage = document.getElementById('status-message');
    const statusDetail = document.getElementById('status-detail');

    probEl.classList.add('fade-in');
    
    probEl.textContent = `${probability}%`;
    amountEl.textContent = `${amount} mm/h`;

    // クラスリセット
    statusCard.className = 'card';
    document.body.className = '';

    if (probability >= 70 || amount >= 2.0) {
        // 大雨特需アラート
        statusCard.classList.add('status-danger');
        document.body.classList.add('danger-mode');
        statusIcon.textContent = "🚨";
        statusMessage.textContent = "大雨特需 チャンス！";
        statusDetail.textContent = "現在地周辺で強い雨が予測されています。雨宿り・帰宅客のタクシー需要が爆発的に増加します！";
    } else if (probability >= 30 || amount >= 0.1) {
        // 注意アラート
        statusCard.classList.add('status-warning');
        document.body.classList.add('warning-mode');
        statusIcon.textContent = "⚠️";
        statusMessage.textContent = "雨雲接近中 配車待機";
        statusDetail.textContent = "パラパラと降り始める可能性があります。駅周辺など傘を持たない人が多い場所へ移動を推奨します。";
    } else {
        // 安全圏（降水なし）
        statusCard.classList.add('status-safe');
        statusIcon.textContent = "✅";
        statusMessage.textContent = "通常営業・安全圏";
        statusDetail.textContent = "現在地周辺で特段の需要増（雨雲など）は予測されていません。通常通り流し営業を継続してください。";
    }
}

// --- Event Logic ---
let generatedEvents = null;

function generateEventsOnce() {
    if (generatedEvents) return generatedEvents;
    const now = new Date();
    // デモ用: 現在時刻から25分後、45分後、120分後に特需が発生するように時間を計算
    generatedEvents = [
        { name: 'みずほPayPayドーム福岡', type: 'ライブ終了・帰宅ラッシュ', time: new Date(now.getTime() + 25 * 60000), demand: 'high' },
        { name: '中洲エリア（那珂川沿い）', type: '飲食層の帰宅ピーク', time: new Date(now.getTime() + 45 * 60000), demand: 'medium' },
        { name: '天神・大名周辺', type: '大型イベント・終電間際', time: new Date(now.getTime() + 120 * 60000), demand: 'medium' }
    ];
    return generatedEvents;
}

function updateEvents() {
    const events = generateEventsOnce();
    const listEl = document.getElementById('event-list');
    if (!listEl) return;
    
    const now = new Date();
    listEl.innerHTML = '';
    
    // 過去になったイベントは見せない等のロジックも今後追加可能
    events.forEach(event => {
        // 残り時間を計算 (分)
        const diffMs = event.time - now;
        const diffMins = Math.floor(diffMs / 60000);
        
        // 発生済みの場合は非表示
        if (diffMins < -30) return; // 30分経過したら消す

        const timeString = event.time.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
        
        const li = document.createElement('li');
        
        // 30分以内のイベントは強調表示
        if (diffMins > 0 && diffMins <= 30) {
            li.classList.add('event-soon');
        }
        
        const timeSpan = document.createElement('span');
        timeSpan.className = 'time';
        timeSpan.textContent = timeString;
        
        const placeSpan = document.createElement('span');
        placeSpan.className = 'place';
        placeSpan.textContent = event.name;
        
        const tagSpan = document.createElement('span');
        tagSpan.className = 'tag evt-' + event.demand;
        if (diffMins > 0 && diffMins <= 30) {
            tagSpan.textContent = event.type + ` (あと${diffMins}分!)`;
        } else if (diffMins <= 0) {
            tagSpan.textContent = event.type + ` (発生中)`;
        } else {
            tagSpan.textContent = event.type;
        }
        
        li.appendChild(timeSpan);
        li.appendChild(placeSpan);
        li.appendChild(tagSpan);
        
        listEl.appendChild(li);
    });
}
