import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '영어 쓰기 데이터 수집 플랫폼',
  description: 'English Writing Data Collection Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
