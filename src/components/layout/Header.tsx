// src/components/layout/Header.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  pageTitle: string;
  pageSubtitle?: string;
}

export default function Header({ pageTitle, pageSubtitle }: HeaderProps) {
  const { user, logout } = useAuth();

  return (
    <>
      {/* Mobile Header - Includes Logo, Title, and Sign Out */}
      <header className="lg:hidden bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        {/* Main Header Row: 12px padding + 36px content = 48px total */}
        <div className="flex items-center justify-between h-12 px-3">
          {/* Logo + ClamFlow Title Only */}
          <Link href="/dashboard" className="flex items-center space-x-2 min-w-0 flex-1">
            <div className="w-6 h-6 bg-white rounded-md shadow-sm border border-gray-200 flex items-center justify-center flex-shrink-0">
              <Image
                src="/logo-relish.png"
                alt="ClamFlow"
                width={16}
                height={16}
                className="rounded-sm"
                priority
              />
            </div>
            <span className="text-base font-bold text-gray-900 truncate">ClamFlow</span>
          </Link>

          {/* User Info and Sign Out Button - Right aligned */}
          <div className="flex items-center space-x-2 ml-2"> {/* Added ml-2 for spacing */}
            {user && (
              <div className="flex items-center space-x-1">
                <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center border border-emerald-200">
                  <span className="text-emerald-700 font-medium text-xs">
                    {(user.full_name || user.username || '').charAt(0).toUpperCase()}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="text-xs text-gray-600 hover:text-gray-900 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200 min-h-[28px] min-w-[44px] flex items-center justify-center"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Separate Gray Bar for Current Page Title */}
        <div className="px-3 py-1 bg-gray-50 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-700 truncate">{pageTitle}</p>
        </div>
      </header>

      {/* Desktop Header - Full Layout */}
      <header className="hidden lg:block bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Branding */}
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                <div className="flex items-center justify-center w-10 h-10 bg-white rounded-lg shadow-sm border border-gray-200">
                  <Image
                    src="/logo-relish.png"
                    alt="Relish Logo"
                    width={32}
                    height={32}
                    className="rounded-md"
                    priority
                  />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">ClamFlow</h1>
                  <p className="text-xs text-gray-600">Quality • Productivity</p>
                </div>
              </Link>
            </div>

            {/* Page Title */}
            <div className="flex-1 text-center">
              <h2 className="text-xl font-semibold text-gray-800">{pageTitle}</h2>
              {pageSubtitle && (
                <p className="text-sm text-gray-600">{pageSubtitle}</p>
              )}
            </div>

            {/* User Info */}
            {user && (
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user.full_name || user.username}
                  </p>
                  {user.role && (
                    <p className="text-xs text-gray-600 capitalize">
                      {user.role}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center border border-emerald-200">
                    <span className="text-emerald-700 font-medium text-sm">
                      {(user.full_name || user.username || '').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1 rounded-md hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}