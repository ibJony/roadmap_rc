import React from 'react';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { TooltipProvider } from '@/components/ui/tooltip';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const viewport: Viewport = {
  themeColor: '#6B4C9A',
};

export const metadata: Metadata = {
  title: 'RMLAB Roadmap',
  description: 'A product roadmap tool for modern teams — plan, prioritize, and ship with clarity.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'RMLAB Roadmap',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var stored = localStorage.getItem('rmlab-auth');
                  var appearance = stored ? JSON.parse(stored)?.state?.appearance : null;
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var isDark =
                    appearance === 'dark' ||
                    (appearance !== 'light' && prefersDark);
                  if (isDark) document.documentElement.classList.add('dark');
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <TooltipProvider delayDuration={300}>
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
