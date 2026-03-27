// src/components/layout/Header.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { User, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  pageTitle: string;
  pageSubtitle?: string;
}

export default function Header({ pageTitle, pageSubtitle }: HeaderProps) {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="px-4 py-3 sm:px-6">
        {/* Top row: Logo + Page Title center + User info */}
        <div className="flex items-center justify-between">
          {/* Logo and Branding */}
          <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="flex items-center justify-center w-10 h-10 bg-white rounded-lg shadow-sm border border-gray-200">
              <Image
                src="/logo-relish.png"
                alt="Relish Logo"
                width={28}
                height={28}
                className="rounded-md"
                priority
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-gray-900 leading-tight">ClamFlow</h1>
              <p className="text-[10px] text-gray-500 leading-tight">Quality • Productivity • Assured</p>
            </div>
          </Link>

          {/* Page Title - Center */}
          <div className="flex-1 text-center px-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">{pageTitle}</h2>
            {pageSubtitle && (
              <p className="text-xs sm:text-sm text-gray-500">{pageSubtitle}</p>
            )}
          </div>

          {/* User Info */}
          {user && (
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-sm font-medium text-gray-900">
                  {user.full_name || user.username}
                </div>
                {user.role && (
                  <div className="text-xs text-gray-500">{user.role}</div>
                )}
              </div>
              <button
                onClick={logout}
                className="ml-1 p-2 min-h-[36px] min-w-[36px] rounded-md hover:bg-gray-100 transition-colors flex items-center justify-center"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}