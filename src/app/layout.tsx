import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Toaster } from "@/components/ui/toaster"
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import './globals.css';
import { TaskQuestProvider } from '@/context/task-quest-context';
import AppShell from '@/components/app-shell';

export const metadata: Metadata = {
  title: 'Pollytasks',
  description: 'Track your habits and become the hero of your own story!',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#65d01e",
  // Prevents viewport from resizing when keyboard appears on some devices
  interactiveWidget: 'resizes-content',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Spline+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased noise-bg" suppressHydrationWarning>
        {/* Google tag (gtag.js) */}
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-Y1N5618EQW" />
        <Script id="google-analytics">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-Y1N5618EQW');
          `}
        </Script>
        <ConvexClientProvider>
          <TaskQuestProvider>
            <AppShell>
              {children}
            </AppShell>
          </TaskQuestProvider>
        </ConvexClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
