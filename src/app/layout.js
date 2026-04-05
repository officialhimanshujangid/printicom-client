import './globals.css';
import Providers from '@/components/Providers';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AuthModal from '@/components/auth/AuthModal';
import CartSidebar from '@/components/cart/CartSidebar';
import { Toaster } from 'react-hot-toast';

export const metadata = {
  title: { default: 'Printicom – Custom Photo Printing & Personalized Gifts', template: '%s | Printicom' },
  description: 'Print your memories on mugs, calendars, photo prints & more. Best custom gifting store in India.',
  keywords: 'custom mugs, photo prints, personalized gifts, photo calendar, canvas print, Printicom',
  authors: [{ name: 'Printicom' }],
  metadataBase: new URL('https://printicom.in'),
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://printicom.in',
    siteName: 'Printicom',
    title: 'Printicom – Custom Photo Printing & Personalized Gifts',
    description: 'Print personalized gifts – mugs, calendars, photo prints & more. Fast delivery across India.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Printicom' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Printicom – Custom Photo Printing',
    description: 'Print your memories on amazing products.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <Providers>
          <Header />
          <main className="page-content">{children}</main>
          <Footer />
          <AuthModal />
          <CartSidebar />
          <Toaster
            position="top-right"
            toastOptions={{
              className: 'hot-toast',
              duration: 3500,
              style: {
                background: '#18181F',
                color: '#F2F2F7',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                fontFamily: 'Inter, sans-serif',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
