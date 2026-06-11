// scrape_kyuhaku.js
// 九州国立博物館の特別展スケジュールを自動取得するスクリプト

const fs = require('fs');
const path = require('path');

// 九博の特別展スケジュールページ
const TARGET_URL = 'https://www.kyuhaku.jp/exhibition/exhibition_s.html';

async function scrapeKyuhaku() {
    console.log('Fetching Kyushu National Museum info...');
    
    try {
        const response = await fetch(TARGET_URL);
        const html = await response.text();

        // 特別展のタイトルを抽出 (HTML構造に依存するため、簡易的な正規表現を使用)
        // 実際には <h3 class="ex_title">展覧会名</h3> のような形を想定
        const titleMatch = html.match(/<h3[^>]*>(.*?)<\/h3>/) || html.match(/<h2[^>]*>(.*?)<\/h2>/);
        const exhibitionTitle = titleMatch ? titleMatch[1].replace(/<br[^>]*>/g, ' ').trim() : '開催中の特別展';

        // 開催期間を抽出 (例: 2026年4月1日〜6月1日)
        const dateMatch = html.match(/(\d{4}年\d{1,2}月\d{1,2}日).*?(\d{4}年\d{1,2}月\d{1,2}日)/);
        const startDate = dateMatch ? dateMatch[1] : '';
        const endDate = dateMatch ? dateMatch[2] : '';

        // 曜日別の閉館時間設定
        // 土曜: 19:00, それ以外: 17:00
        const eventData = {
            id: 'kyuhaku-auto',
            name: exhibitionTitle,
            location: '九州国立博物館',
            lat: 33.5181,
            lon: 130.5376,
            period: {
                start: startDate,
                end: endDate
            },
            closingTimes: {
                default: "17:00",
                saturday: "19:00"
            },
            updatedAt: new Date().toISOString()
        };

        const dataDir = path.join(__dirname, 'data');
        if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
        
        fs.writeFileSync(
            path.join(dataDir, 'kyuhaku_events.json'),
            JSON.stringify(eventData, null, 2)
        );

        console.log('Successfully updated: data/kyuhaku_events.json');
        console.log('Current Exhibition:', exhibitionTitle);
        
    } catch (error) {
        console.error('Scraping Failed:', error);
        process.exit(1);
    }
}

scrapeKyuhaku();
