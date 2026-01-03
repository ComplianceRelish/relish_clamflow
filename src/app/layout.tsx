import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '../context/AuthContext'
import ServiceWorkerRegister from '../components/ServiceWorkerRegister'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ClamFlow - Seafood Processing System',
  description: 'Complete seafood processing management system',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ClamFlow',
  },
  formatDetection: {
    telephone: false,
  },
  metadataBase: new URL('https://clamflowcloud.vercel.app'),
  openGraph: {
    type: 'website',
    url: 'https://clamflowcloud.vercel.app',
    title: 'ClamFlow - Seafood Processing System',
    description: 'Complete seafood processing management system',
    siteName: 'ClamFlow',
    images: [
      {
        url: '/icons/icon-512x512.png',
        width: 512,
        height: 512,
      },
    ],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#7c3aed',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ClamFlow" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <ServiceWorkerRegister />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}