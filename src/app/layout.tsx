import type { Metadata, Viewport } from 'next';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import FloatingThemeToggle from '@/components/FloatingThemeToggle';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tracker - Track Your Applications',
  description: 'Track and manage your job applications with Tracker',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const themeScript = `
    (function() {
      try {
        var t = localStorage.getItem('theme');
        if (t === 'dark') document.documentElement.className = 'dark overflow-x-hidden';
        else if (t === 'light') document.documentElement.className = 'overflow-x-hidden';
        else {
          var d = window.matchMedia('(prefers-color-scheme: dark)').matches;
          document.documentElement.className = d ? 'dark overflow-x-hidden' : 'overflow-x-hidden';
        }
      } catch (e) {}
    })();
  `;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="overflow-x-hidden antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
          <FloatingThemeToggle />
        </ThemeProvider>
      </body>
    </html>
  );
}
