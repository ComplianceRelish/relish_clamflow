'use client';

import { ReactNode } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: ReactNode;
  pageTitle: string;
  pageSubtitle?: string;
}

export default function Layout({ children, pageTitle, pageSubtitle }: LayoutProps) {
  return (
    <div className="min-h-screen bg-logo">
      <Header pageTitle={pageTitle} pageSubtitle={pageSubtitle} />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

