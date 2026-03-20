// notifications.js
const notifiedEvents = new Set(); // 通知済みイベントを管理

// 音声を再生する共通関数
function speakAlert(text) {
    if ('speechSynthesis' in window) {
        // 現在喋っている音声をキャンセルし、iOSバグ対策としてresume()を呼ぶ
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ja-JP';
        utterance.rate = 1.1; // 運転中でも聞き取れるよう少し早め
        utterance.pitch = 1.0;
        
        window.speechSynthesis.speak(utterance);
    }
}

function setupNotificationButton() {
    const notifBtn = document.getElementById('enable-notif-btn');
    if (notifBtn && typeof Notification !== 'undefined') {
        notifBtn.style.display = 'block'; // 通知APIがあるならボタンを表示
        
        // 既に許可されている場合は見た目を変える
        if (Notification.permission === 'granted') {
            notifBtn.textContent = '🔊 音声・通知オン';
            notifBtn.classList.add('granted');
        }

        notifBtn.addEventListener('click', async () => {
            // 【重要】iOS(iPhone) Safari対策
            // 非同期処理（await）を挟むと「ユーザーの直接操作」とみなされず音声がブロックされるため、
            // awaitの前に必ず同期的に一度SpeechSynthesisを実行してOSのロックを解除します。
            speakAlert('設定を開始します。許可ボタンを押してください。');

            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                notifBtn.textContent = '🔊 音声・通知オン';
                notifBtn.classList.add('granted');
                
                // ロックは解除されているので通知許可後も喋るようになる
                setTimeout(() => {
                    speakAlert('通知と音声案内が有効になりました。安全運転でお願いします。');
                }, 1000); // 先行する「設定を開始します〜」とかぶらないように少し遅らせる
                
                new Notification('TAXI ALERT', { body: '通知と音声が有効になりました！' });
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

    // ✅ もし通知が許可されていれば、バックグラウンド通知と音声読み上げを行う
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        // 音声の読み上げ
        speakAlert(`特需アラートです。${event.name}にて、${event.type}があと${diffMins}分で発生します。周辺に向かってください。`);

        // システム通知
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
