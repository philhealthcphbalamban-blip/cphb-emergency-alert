import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { GlobalAlertModal } from '@/components/GlobalAlertModal';

export const metadata: Metadata = {
  title: 'Hospital Rapid Emergency Alert System | CPH Balamban & iHOMIS Plus',
  description: 'Ultra-fast hospital emergency code broadcasting and responder management system synced with iHOMIS Plus.',
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
        </div>
      </body>
    </html>
  );
}
