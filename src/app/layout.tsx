import './globals.css';
import { Inter } from 'next/font/google';
import { AuthProvider } from '../context/AuthContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'ClamFlow - Quality Management System | Relish',
  description: 'Professional clam processing quality management and workflow system powered by Relish',
  icons: {
    icon: '/logo-relish.png',
    shortcut: '/logo-relish.png',
    apple: '/logo-relish.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}