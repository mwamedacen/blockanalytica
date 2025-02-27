import '@coinbase/onchainkit/styles.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../styles/globals.css';
import { Providers } from './components/provider';
const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'BlockAnalytica',
  description: 'Blockchain Forensics Tool',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
