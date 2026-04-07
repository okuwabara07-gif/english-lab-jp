const https = require('https');
const fs = require('fs');
const path = require('path');

const SITE_NAME = '英語Lab';
const TOPIC = '英語学習・TOEIC・英会話';
const CRITERIA = '効果・コスパ・続けやすさ・サポート・口コミ';
const AMAZON_TAG = process.env.AMAZON_TRACKING_ID || 'haircolorab22-22';
const RAKUTEN_ID = process.env.RAKUTEN_AFFILIATE_ID || '5253b9ed.08f9d938.5253b9ee.e71aefe8';

const KEYWORDS = [
  TOPIC+' おすすめランキング', TOPIC+' 比較', TOPIC+' 選び方',
  TOPIC+' 初心者向け', TOPIC+' 効果', TOPIC+' 口コミ',
  TOPIC+' 人気', TOPIC+' コスパ', TOPIC+' プロおすすめ', TOPIC+' 最新',
];

function callAnthropic(prompt) {
  return new Promise(function(resolve, reject) {
    var body = JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }]
    });
    var options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body)
      }
    };
    var req = https.request(options, function(res) {
      var data = '';
      res.on('data', function(chunk) { data += chunk; });
      res.on('end', function() {
        try {
          var parsed = JSON.parse(data);
          if (parsed.content && parsed.content[0]) {
            resolve(parsed.content[0].text);
          } else {
            reject(new Error('API error: ' + data));
          }
        } catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  var blogDir = path.join(process.cwd(), 'content', 'blog');
  if (!fs.existsSync(blogDir)) fs.mkdirSync(blogDir, { recursive: true });
  var existing = fs.readdirSync(blogDir).filter(function(f){ return f.endsWith('.md')||f.endsWith('.mdx'); });
  var count = existing.length;
  console.log('現在の記事数: ' + count);
  if (count >= 50) { console.log('50記事達成済み'); return; }
  var needed = Math.min(50 - count, 5);
  var today = new Date().toISOString().slice(0,10);
  for (var i = 0; i < needed; i++) {
    var kw = KEYWORDS[Math.floor(Math.random() * KEYWORDS.length)];
    var amz = 'https://www.amazon.co.jp/s?k=' + encodeURIComponent(kw) + '&tag=' + AMAZON_TAG;
    var rak = 'https://search.rakuten.co.jp/search/mall/' + encodeURIComponent(kw) + '/?af=' + RAKUTEN_ID;
    var prompt = [
      'あなたはCRO専門家のプロレビューライターです。',
      '「' + kw + '」について比較ランキング記事を日本語で書いてください。',
      'サイト名：' + SITE_NAME + ' テーマ：' + TOPIC + ' 評価基準：' + CRITERIA,
      '原則：冒頭に結論、デメリットも記載、アフィリエイトリンク3箇所以上',
      'Amazon: [商品名](' + amz + ')  楽天: [商品名](' + rak + ')',
      '必ずこの形式で出力：',
      '---',
      'title: "タイトル"',
      'date: "' + today + '"',
      'genre: "ジャンル"',
      'excerpt: "概要"',
      '---',
      '# タイトル',
      '本文1500字以上',
    ].join('\n');
    console.log('生成中: ' + kw);
    try {
      var content = await callAnthropic(prompt);
      var fname = Date.now() + '.mdx';
      fs.writeFileSync(path.join(blogDir, fname), content, 'utf-8');
      console.log('保存: ' + fname);
      await new Promise(function(r){ setTimeout(r, 2000); });
    } catch(e) { console.error('エラー: ' + e.message); }
  }
}

main();