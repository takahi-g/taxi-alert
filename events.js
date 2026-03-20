// events.js
// --- Event Logic ---
let generatedEvents = null;

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
    if (typeof map !== 'undefined' && map) {
        if(typeof eventMarkers !== 'undefined') {
            eventMarkers.forEach(m => map.removeLayer(m));
            eventMarkers.length = 0; // 配列を空にする
        }
    }
    
    // 過去になったイベントは見せない等のロジックも今後追加可能
    events.forEach(event => {
        // 残り時間を計算 (分)
        const diffMs = event.time - now;
        const diffMins = Math.floor(diffMs / 60000);
        
        // 発生済みの場合は非表示
        if (diffMins < -30) return; // 30分経過したら消す

        // マップへの特需マーカー描画
        if (typeof map !== 'undefined' && map && event.lat && event.lon) {
            let marker = L.marker([event.lat, event.lon]).addTo(map)
                .bindPopup(`<strong style="color:var(--text-main)">${event.name}</strong><br>${event.type}<br>あと <strong>${diffMins}分</strong>`);
            if(typeof eventMarkers !== 'undefined') {
                eventMarkers.push(marker);
            }
        }

        const timeString = event.time.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
        
        const li = document.createElement('li');
        
        // 30分以内のイベントは強調表示
        if (diffMins > 0 && diffMins <= 30) {
            li.classList.add('event-soon');
            
            // ポップアップ通知のトリガー
            const eventId = event.name + "_" + event.time.getTime();
            if (typeof notifiedEvents !== 'undefined' && !notifiedEvents.has(eventId)) {
                if (typeof showToast === 'function') {
                    showToast(event, diffMins);
                }
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
