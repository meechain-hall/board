import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MeeChain Network Status',
  description: 'Live infrastructure health and network status for MeeChain.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
