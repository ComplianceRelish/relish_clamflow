'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

interface HeaderProps {
  pageTitle: string;
  pageSubtitle?: string;
}

export default function Header({ pageTitle, pageSubtitle }: HeaderProps) {
  const { user, userProfile, signOut } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
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
                  {userProfile?.full_name || user.email}
                </p>
                {userProfile?.role && (
                  <p className="text-xs text-gray-600 capitalize">
                    {userProfile.role.replace('_', ' ')}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center border border-emerald-200">
                  <span className="text-emerald-700 font-medium text-sm">
                    {(userProfile?.full_name || user.email || '').charAt(0).toUpperCase()}
                  </span>
                </div>
                <button
                  onClick={signOut}
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
  );
}
