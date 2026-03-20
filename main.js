document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    // 1. Service Workerの登録 (PWAの要件)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker registered'))
            .catch(err => console.error('Service Worker registration failed:', err));
    }

    // 2. 通知ボタンの制御
    const notifBtn = document.getElementById('enable-notif-btn');
    if (notifBtn && typeof Notification !== 'undefined') {
        notifBtn.style.display = 'block'; // 通知APIがあるならボタンを表示
        
        // 既に許可されている場合は見た目を変える
        if (Notification.permission === 'granted') {
            notifBtn.textContent = '🔔 通知オン';
            notifBtn.classList.add('granted');
        }

        notifBtn.addEventListener('click', async () => {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                notifBtn.textContent = '🔔 通知オン';
                notifBtn.classList.add('granted');
                new Notification('TAXI ALERT', { body: '通知が有効になりました！イベント30分前にスマホにお知らせします。' });
            } else {
                alert('通知がブロックされました。ブラウザの設定から許可してください。');
            }
        });
    }
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
                initMap(lat, lon);
                fetchWeather(lat, lon);
            },
            (error) => {
                console.warn("位置情報の取得に失敗しました。デフォルト位置（博多駅周辺）を使用します。", error);
                document.getElementById('location-name').textContent = "博多駅周辺 (デフォルト)";
                initMap(33.5897, 130.4207);
                fetchWeather(33.5897, 130.4207);
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    } else {
        document.getElementById('location-name').textContent = "博多駅周辺 (デフォルト)";
        initMap(33.5897, 130.4207);
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

// --- Map Status ---
let map = null;
let eventMarkers = [];
let userMarker = null;

function initMap(lat, lon) {
    if (!map) {
        const mapEl = document.getElementById('map');
        if(!mapEl) return;
        map = L.map('map').setView([lat, lon], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
        }).addTo(map);
    } else {
        map.setView([lat, lon], 13);
    }
    
    // 現在地マーカー
    if(userMarker) {
        userMarker.setLatLng([lat, lon]);
    } else {
        userMarker = L.marker([lat, lon]).addTo(map).bindPopup("<b>あなたの現在地</b>").openPopup();
    }
}

// --- Event Logic ---
let generatedEvents = null;
const notifiedEvents = new Set(); // 通知済みイベントを管理

function generateEventsOnce() {
    if (generatedEvents) return generatedEvents;
    const now = new Date();
    // デモ用: 現在時刻から25分後、45分後、120分後に特需が発生するように時間を計算し、緯度・経度を設定
    generatedEvents = [
        { name: 'みずほPayPayドーム福岡', type: 'ライブ終了・帰宅ラッシュ', time: new Date(now.getTime() + 25 * 60000), demand: 'high', lat: 33.5953, lon: 130.3621 },
        { name: '中洲エリア（那珂川沿い）', type: '飲食層の帰宅ピーク', time: new Date(now.getTime() + 45 * 60000), demand: 'medium', lat: 33.5933, lon: 130.4045 },
        { name: '天神・大名周辺', type: '大型イベント・終電間際', time: new Date(now.getTime() + 120 * 60000), demand: 'medium', lat: 33.5880, lon: 130.3955 }
    ];
    return generatedEvents;
}

function updateEvents() {
    const events = generateEventsOnce();
    const listEl = document.getElementById('event-list');
    if (!listEl) return;
    
    const now = new Date();
    listEl.innerHTML = '';

    // 古いマーカーをクリア
    if (map) {
        eventMarkers.forEach(m => map.removeLayer(m));
        eventMarkers = [];
    }
    
    // 過去になったイベントは見せない等のロジックも今後追加可能
    events.forEach(event => {
        // 残り時間を計算 (分)
        const diffMs = event.time - now;
        const diffMins = Math.floor(diffMs / 60000);
        
        // 発生済みの場合は非表示
        if (diffMins < -30) return; // 30分経過したら消す

        // マップへの特需マーカー描画
        if (map && event.lat && event.lon) {
            let marker = L.marker([event.lat, event.lon]).addTo(map)
                .bindPopup(`<strong style="color:var(--text-main)">${event.name}</strong><br>${event.type}<br>あと <strong>${diffMins}分</strong>`);
            eventMarkers.push(marker);
        }

        const timeString = event.time.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
        
        const li = document.createElement('li');
        
        // 30分以内のイベントは強調表示
        if (diffMins > 0 && diffMins <= 30) {
            li.classList.add('event-soon');
            
            // ポップアップ通知のトリガー
            const eventId = event.name + "_" + event.time.getTime();
            if (!notifiedEvents.has(eventId)) {
                showToast(event, diffMins);
                notifiedEvents.add(eventId);
            }
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

// ポップアップ（トースト）表示処理
function showToast(event, diffMins) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${event.demand}`;
    
    // ヘッダー
    const header = document.createElement('div');
    header.className = 'toast-header';
    header.innerHTML = `<span>🔔 特需アラート</span><button class="close-btn">&times;</button>`;
    
    // ボディ
    const body = document.createElement('div');
    body.className = 'toast-body';
    body.innerHTML = `あと<strong style="color:var(--text-main);font-size:1.1rem;">${diffMins}分</strong>で<br>「<strong style="color:var(--text-main);">${event.name}</strong>」にて<br>${event.type} が発生します！`;

    toast.appendChild(header);
    toast.appendChild(body);
    container.appendChild(toast);

    // 閉じるボタンの処理
    toast.querySelector('.close-btn').addEventListener('click', () => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    });

    // 少し遅れて表示アニメーション
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    // ✅ もしOS全体（スマホ・PC）の通知が許可されていれば、バックグラウンド通知も送る
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification(`🚕 特需アラート: ${event.name}`, {
            body: `あと${diffMins}分で ${event.type} が発生します！需要が高まります！`,
            icon: 'https://cdn-icons-png.flaticon.com/512/3202/3202926.png'
        });
    }

    // 10秒後に自動で消える
    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }
    }, 10000);
}
