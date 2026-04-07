const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');
const SITE_NAME = '英語Lab';
const TOPIC = '英語学習・TOEIC・英会話';
const CRITERIA = '効果・コスパ・続けやすさ・サポート・口コミ';
const AMAZON_TAG = process.env.AMAZON_TRACKING_ID || 'haircolorab22-22';
const RAKUTEN_ID = process.env.RAKUTEN_AFFILIATE_ID || '5253b9ed.08f9d938.5253b9ee.e71aefe8';
const KEYWORDS = [
  TOPIC + 'おすすめランキング', TOPIC + '比較', TOPIC + '選び方',
  TOPIC + '初心者向け', TOPIC + '効果', TOPIC + '口コミ',
  TOPIC + '人気', TOPIC + 'コスパ最強', TOPIC + 'プロおすすめ', TOPIC + '最新',
];
async function generateArticle(keyword) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const amzLink = 'https://www.amazon.co.jp/s?k=' + encodeURIComponent(keyword) + '&tag=' + AMAZON_TAG;
  const rakLink = 'https://search.rakuten.co.jp/search/mall/' + encodeURIComponent(keyword) + '/?af=' + RAKUTEN_ID;
  const today = new Date().toISOString().slice(0,10);
  const lines = [
    'あなたはCRO専門家でもあるプロのレビューライターです。',
    '「' + keyword + '」について購買行動を起こしやすい比較ランキング記事を書いてください。',
    'サイト名：' + SITE_NAME,
    'テーマ：' + TOPIC,
    '評価基準：' + CRITERIA,
    '原則：1.冒頭に結論 2.デメリットも書く 3.アフィリエイトリンク3箇所以上',
    'Amazon例: [商品名](' + amzLink + ')',
    '楽天例: [商品名](' + rakLink + ')',
    'フォーマット：',
    '---',
    'title: "記事タイトル"',
    'date: "' + today + '"',
    'genre: "ジャンル"',
    'excerpt: "120字以内の概要"',
    '---',
    '# 記事タイトル',
    '本文（1500字以上、日本語）',
  ];
  const prompt = lines.join('\n');
  const res = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 3000,
    messages: [{ role: 'user', content: prompt }],
  });
  return res.content[0].text;
}
async function main() {
  const blogDir = path.join(process.cwd(), 'content', 'blog');
  if (!fs.existsSync(blogDir)) fs.mkdirSync(blogDir, { recursive: true });
  const existing = fs.readdirSync(blogDir).filter(function(f){ return f.endsWith('.md') || f.endsWith('.mdx'); });
  const count = existing.length;
  console.log('現在の記事数: ' + count);
  if (count >= 50) { console.log('50記事達成済み'); return; }
  const needed = Math.min(50 - count, 5);
  for (let i = 0; i < needed; i++) {
    const kw = KEYWORDS[Math.floor(Math.random() * KEYWORDS.length)];
    console.log('生成中: ' + kw);
    try {
      const content = await generateArticle(kw);
      const fname = Date.now() + '.mdx';
      fs.writeFileSync(path.join(blogDir, fname), content, 'utf-8');
      console.log('保存: ' + fname);
      await new Promise(function(r){ setTimeout(r, 2000); });
    } catch(e) { console.error('エラー: ' + e.message); }
  }
}
main();