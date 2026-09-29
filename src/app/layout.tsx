import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '桜水産市場 業務支援システム（プロトタイプ）',
  description: '研修用プロトタイプ。架空の市場・架空のデータです。',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
