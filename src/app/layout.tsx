import type { Metadata, Viewport } from 'next'
import './globals.css';
import { Inter } from 'next/font/google';
import { AuthProvider } from '../context/AuthContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ClamFlow - Quality Management System | Relish',
  description: 'Professional clam processing quality management and workflow system powered by Relish',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ClamFlow',
    startupImage: '/icons/icon-512x512.png',
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'ClamFlow',
    'application-name': 'ClamFlow',
    'msapplication-TileColor': '#000000',
    'msapplication-TileImage': '/icons/icon-144x144.png',
    'theme-color': '#000000',
  }
}

export const viewport: Viewport = {
  themeColor: '#000000', // Black background like your logo
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* PWA Icons */}
        <link rel="icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-192x192.png" />
        
        {/* PWA Meta Tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ClamFlow" />
        <meta name="application-name" content="ClamFlow" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
        <meta name="theme-color" content="#000000" />
        
        {/* PWA Startup Images for iOS */}
        <link rel="apple-touch-startup-image" href="/icons/icon-512x512.png" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
        
        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('ClamFlow PWA: Service Worker registered successfully');
                    })
                    .catch(function(registrationError) {
                      console.log('ClamFlow PWA: Service Worker registration failed:', registrationError);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}