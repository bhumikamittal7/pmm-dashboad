import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { DashboardProvider } from './context/DashboardContext';
import TopNavBar from './components/TopNavBar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PM Dashboard - GitHub Analytics',
  description: 'Comprehensive analytics for GitHub repository activity',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <DashboardProvider>
          <div className="min-h-screen bg-gray-50">
            <TopNavBar />
            <main className="p-6">{children}</main>
          </div>
        </DashboardProvider>
      </body>
    </html>
  );
}
