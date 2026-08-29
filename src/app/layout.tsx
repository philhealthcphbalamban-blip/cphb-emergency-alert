import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { GlobalAlertModal } from '@/components/GlobalAlertModal';
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';

export const metadata: Metadata = {
  title: {
    default: 'CPHB Code Alert | Rapid Emergency System',
    template: '%s | CPHB Code Alert',
  },
  description: 'Ultra-fast hospital emergency code broadcasting and responder management system synced with iHOMIS Plus.',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-100 text-slate-900 antialiased selection:bg-blue-600 selection:text-white">
        <div className="relative min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1 pb-16">
            {children}
          </main>
          <GlobalAlertModal />
          <ServiceWorkerRegister />
        </div>
      </body>
    </html>
  );
}
