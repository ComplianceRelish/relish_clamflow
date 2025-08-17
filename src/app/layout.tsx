import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ClamFlow - Clam Processing & Quality Control',
  description: 'Comprehensive clam processing and quality control management system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-background">
          <header className="border-b border-border bg-card">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h1 className="text-2xl font-bold text-foreground">
                    ClamFlow
                  </h1>
                  <span className="text-sm text-muted-foreground">
                    Processing & QC System
                  </span>
                </div>
                <nav className="flex items-center space-x-4">
                  <a href="/" className="text-foreground hover:text-primary">
                    Dashboard
                  </a>
                  <a href="/forms" className="text-foreground hover:text-primary">
                    Forms
                  </a>
                  <a href="/reports" className="text-foreground hover:text-primary">
                    Reports
                  </a>
                </nav>
              </div>
            </div>
          </header>
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}