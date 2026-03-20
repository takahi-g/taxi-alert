// notifications.js
const notifiedEvents = new Set(); // 通知済みイベントを管理

function setupNotificationButton() {
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
