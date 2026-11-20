import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import type { ReactNode } from 'react';
import { HERMON_PATH } from '@/paths';
import './globals.css';

const geist = localFont({
  src: './fonts/geist.woff2', weight: '100 900', variable: '--font-sans', display: 'swap',
});

export const metadata: Metadata = {
  title: 'Mount Hermon at dawn',
  description: 'Fly above Mount Hermon in the days of Jared in a game inspired by 1 Enoch 6.',
  manifest: `${HERMON_PATH}/manifest.webmanifest`,
  icons: { icon: `${HERMON_PATH}/mountain.svg` },
  appleWebApp: { capable: true, title: 'Mount Hermon', statusBarStyle: 'black-translucent' },
  other: { 'apple-mobile-web-app-capable': 'yes' },
};

export const viewport: Viewport = {
  width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#14111d',
};

export default function HermonLayout({ children }: { children: ReactNode }) {
  return <html lang="en" className={geist.variable}><body>{children}</body></html>;
}
