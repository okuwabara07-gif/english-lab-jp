const fs = require('fs');
const path = require('path');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const AMAZON_ID = process.env.AMAZON_TRACKING_ID || '';
const RAKUTEN_ID = process.env.RAKUTEN_AFFILIATE_ID || '';

const KEYWORDS = [
  {kw:"\u82f1\u8a9e \u52c9\u5f37\u6cd5 \u793e\u4f1a\u4eba \u72ec\u5b66",genre:"speaking"},
  {kw:"TOEIC 800\u70b9 \u52c9\u5f37\u6cd5",genre:"toeic"},
  {kw:"\u82f1\u5358\u8a9e \u899a\u3048\u65b9 \u52b9\u7387\u7684",genre:"grammar"},
  {kw:"\u82f1\u4f1a\u8a71\u30a2\u30d7\u30ea \u304a\u3059\u3059\u3081",genre:"app"},
  {kw:"\u82f1\u8a9e \u30ea\u30b9\u30cb\u30f3\u30b0 \u4e0a\u9054 \u65b9\u6cd5",genre:"listening"},
  {kw:"\u82f1\u6587\u6cd5 \u57fa\u790e \u3084\u308a\u76f4\u3057",genre:"grammar"},
  {kw:"\u30aa\u30f3\u30e9\u30a4\u30f3\u82f1\u4f1a\u8a71 \u304a\u3059\u3059\u3081",genre:"speaking"},
  {kw:"\u82f1\u8a9e \u767a\u97f3 \u30b3\u30c4 \u7df4\u7fd2",genre:"speaking"},
  {kw:"\u82f1\u8a9e\u65e5\u8a18 \u66f8\u304d\u65b9 \u4f8b\u6587",genre:"grammar"},
  {kw:"TOEIC \u5358\u8a9e\u5e33 \u304a\u3059\u3059\u3081",genre:"toeic"}
];

const SYS = `あなたは英語学習専門ライターです。読者目線で分かりやすく、SEOに強い記事を書きます。見出しはH2/H3を使ってください。文字数2000字以上。Markdown形式で出力。記事内でおすすめ商品を紹介する箇所には[AMAZON:商品名]と[RAKUTEN:商品名]を合計5箇所挿入してください。`;

function insertLinks(text) {
  text = text.replace(/\[AMAZON:([^\]]+)\]/g, (_, p) => {
    return `[🛒 ${p}をAmazonでチェック](https://www.amazon.co.jp/s?k=${encodeURIComponent(p)}&tag=${AMAZON_ID})`;
  });
  text = text.replace(/\[RAKUTEN:([^\]]+)\]/g, (_, p) => {
    return `[🛍 ${p}を楽天でチェック](https://search.rakuten.co.jp/search/mall/${encodeURIComponent(p)}/?rafcid=${RAKUTEN_ID})`;
  });
  return text;
}

function toSlug(kw) {
  return kw.replace(/[\s\u3000]+/g, '-').replace(/[^a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF-]/g, '') + '-' + Date.now();
}

async function generateArticle(kw, genre) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      system: SYS,
      messages: [{ role: 'user', content: `ジャンル：${genre}\nキーワード：「${kw}」\n\nSEO記事をMarkdownで書いてください。` }],
    }),
  });
  const data = await res.json();
  return data.content?.map(c => c.text || '').join('') || '';
}

async function main() {
  const contentDir = path.join(process.cwd(), 'content/blog');
  if (!fs.existsSync(contentDir)) fs.mkdirSync(contentDir, { recursive: true });

  const targets = KEYWORDS.sort(() => Math.random() - 0.5).slice(0, 5);

  for (const { kw, genre } of targets) {
    console.log(`生成中: ${kw}`);
    try {
      let text = await generateArticle(kw, genre);
      text = insertLinks(text);
      const slug = toSlug(kw);
      const content = `---\ntitle: "${kw}"\ndate: "${new Date().toISOString().split('T')[0]}"\ngenre: "${genre}"\ntags: [${genre}]\n---\n\n${text}\n`;
      fs.writeFileSync(path.join(contentDir, `${slug}.mdx`), content);
      console.log(`完了: ${slug}.mdx`);
      await new Promise(r => setTimeout(r, 1000));
    } catch (e) {
      console.error(`エラー: ${kw}`, e.message);
    }
  }
  console.log('全記事生成完了！');
}

main();
