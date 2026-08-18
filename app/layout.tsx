import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Toaster } from 'sonner';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: {
    default: 'Rexus Gift | Thoughtfully Chosen Gifts',
    template: '%s | Rexus Gift',
  },
  description:
    'Make every moment special with thoughtfully chosen gifts for the people who matter most. Premium flowers, hampers, personalized gifts and more — delivered across Kenya.',
  keywords: ['gifts Kenya', 'flowers Nairobi', 'gift hampers', 'personalized gifts', 'Rexus Gift'],
  openGraph: {
    type: 'website',
    locale: 'en_KE',
    siteName: 'Rexus Gift',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col antialiased">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <Toaster position="top-right" richColors />
        </Providers>
      </body>
    </html>
  );
}
