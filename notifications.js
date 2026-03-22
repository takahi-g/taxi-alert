// notifications.js
const notifiedEvents = new Set(); // 通知済みイベントを管理

// iOSバグ対策: ページ読み込み時点で音声リストの取得を強制的にスタートさせる
if ('speechSynthesis' in window) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices(); // ロード完了時に再取得
    };
}

// 音声を再生する共通関数
function speakAlert(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // 連続再生のバグ防止

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ja-JP';
        utterance.rate = 1.0; // カタコトになりやすいため標準速度に変更
        
        // より自然な「プレミアム（高音質）音声」が存在すれば優先的に選択する（iOS対策）
        const voices = window.speechSynthesis.getVoices();
        const jaVoices = voices.filter(v => v.lang.includes('ja') || v.lang.includes('JP'));
        
        if (jaVoices.length > 0) {
            // ダウンロードされた可能性のある「O-ren (拡張)」を絶対の最優先に設定
            const oRenVoice = jaVoices.find(v => v.name.toLowerCase().includes('o-ren') || v.name.includes('オーレン'));
            const enhancedVoice = jaVoices.find(v => 
                v.name.includes('Enhanced') || 
                v.name.includes('拡張') || 
                v.name.includes('Premium') || 
                v.name.includes('Siri')
            );
            utterance.voice = oRenVoice || enhancedVoice || jaVoices[0];
        }

        window.speechSynthesis.speak(utterance);
    }
}

function setupNotificationButton() {
    const notifBtn = document.getElementById('enable-notif-btn');
    const hasNotification = typeof Notification !== 'undefined';
    const hasSpeech = 'speechSynthesis' in window;

    if (notifBtn && (hasNotification || hasSpeech)) {
        notifBtn.style.display = 'block'; 
        
        if (hasNotification && Notification.permission === 'granted') {
            notifBtn.textContent = '🔊 音声・通知オン';
            notifBtn.classList.add('granted');
        } else if (!hasNotification && hasSpeech) {
            notifBtn.textContent = '🔊 音声許可 (通知非対応)';
            if (window.isVoiceEnabledOnly) notifBtn.classList.add('granted');
        }

        notifBtn.addEventListener('click', function() {
            speakAlert('設定を開始します');

            if (hasNotification) {
                Notification.requestPermission().then(function(permission) {
                    const voices = window.speechSynthesis.getVoices();
                    const jaVoices = voices.filter(v => v.lang.includes('ja') || v.lang.includes('JP'));
                    let selectedName = "標準(設定なし)";
                    if (jaVoices.length > 0) {
                        const oRenVoice = jaVoices.find(v => v.name.toLowerCase().includes('o-ren') || v.name.includes('オーレン'));
                        const enhancedVoice = jaVoices.find(v => v.name.includes('Enhanced') || v.name.includes('拡張') || v.name.includes('Premium') || v.name.includes('Siri'));
                        const selectedVoice = oRenVoice || enhancedVoice || jaVoices[0];
                        if (selectedVoice) selectedName = selectedVoice.name;
                    }
                    alert("【調査用】ブラウザが認識している日本語音声：\n" + (jaVoices.map(v => v.name).join("\n") || "なし(読込失敗)") + "\n\n【現在選択された音声】\n" + selectedName);

                    if (permission === 'granted') {
                        notifBtn.textContent = '🔊 音声・通知オン';
                        notifBtn.classList.add('granted');
                        window.isVoiceEnabledOnly = true;
                        
                        setTimeout(() => {
                            speakAlert('通知と音声案内が有効になりました。安全運転でお願いします。');
                        }, 2000); 
                        
                        new Notification('TAXI ALERT', { body: '通知と音声が有効になりました！' });
                    } else {
                        alert('通知がブロックされました。ブラウザの設定から許可してください。');
                    }
                });
            } else {
                const voices = window.speechSynthesis.getVoices();
                const jaVoices = voices.filter(v => v.lang.includes('ja') || v.lang.includes('JP'));
                alert("【調査用・Safari等】ブラウザが認識している日本語音声：\n" + (jaVoices.map(v => v.name).join("\n") || "なし"));

                notifBtn.textContent = '🔊 音声オン (通知非対応)';
                notifBtn.classList.add('granted');
                window.isVoiceEnabledOnly = true; 

                setTimeout(() => {
                    speakAlert('音声案内が有効になりました。安全運転でお願いします。');
                }, 2000);
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
    const canNotify = typeof Notification !== 'undefined' && Notification.permission === 'granted';
    const canVoice = canNotify || window.isVoiceEnabledOnly;

    if (canVoice) {
        // 音声の読み上げ
        speakAlert(`特需アラートです。${event.name}にて、${event.type}があと${diffMins}分で発生します。周辺に向かってください。`);
    }

    if (canNotify) {
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
