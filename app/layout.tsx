import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: '英語LAB', template: '%s | 英語LAB' },
  description: '英語学習の効率的な方法とおすすめ教材・アプリを紹介',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;700&family=DM+Sans:wght@400;600;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <header className="site-header">
          <div className="header-inner">
            <a href="/" className="site-logo">
              <span className="logo-mark">🗣️</span>
              <span className="logo-text">英語LAB</span>
            </a>
            <nav className="site-nav">
              <a href="/">ホーム</a>
              <a href="/blog">記事一覧</a>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <div className="footer-inner">
            <p>© 2025 英語LAB</p>
            <p className="footer-note">本サイトはアフィリエイト広告を含みます</p>
          </div>
        </footer>
      </body>
    </html>
  );
}