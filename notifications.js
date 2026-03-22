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
    if (notifBtn && typeof Notification !== 'undefined') {
        notifBtn.style.display = 'block'; // 通知APIがあるならボタンを表示
        
        // 既に許可されている場合は見た目を変える
        if (Notification.permission === 'granted') {
            notifBtn.textContent = '🔊 音声・通知オン';
            notifBtn.classList.add('granted');
        }

        // 【重要2】iOSのバグ対策: async/awaitを使わず、純粋な同期関数にする
        notifBtn.addEventListener('click', function() {
            // クリックされた瞬間に（1ミリ秒も待たずに）同期的に音声を鳴らす
            speakAlert('設定を開始します');

            // 非同期で通知の許可ダイアログを出す
            Notification.requestPermission().then(function(permission) {
                
                // ------ 【デバッグ調査用】iPhoneが認識している音声を画面に表示する ------
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
                // -------------------------------------------------------------------------

                if (permission === 'granted') {
                    notifBtn.textContent = '🔊 音声・通知オン';
                    notifBtn.classList.add('granted');
                    
                    // iOSは立て続けの処理を嫌うため2秒後に完了報告
                    setTimeout(() => {
                        speakAlert('通知と音声案内が有効になりました。安全運転でお願いします。');
                    }, 2000); 
                    
                    new Notification('TAXI ALERT', { body: '通知と音声が有効になりました！' });
                } else {
                    alert('通知がブロックされました。ブラウザの設定から許可してください。');
                }
            });
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
