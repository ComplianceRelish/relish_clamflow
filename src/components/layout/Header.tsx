'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';
import { Bars3Icon, XMarkIcon, UserCircleIcon } from '@heroicons/react/24/outline';

interface HeaderProps {
  pageTitle: string;
  pageSubtitle?: string;
}

export default function Header({ pageTitle, pageSubtitle }: HeaderProps) {
  const { user, logout } = useAuth();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Mobile Layout */}
          <div className="flex items-center justify-between w-full lg:hidden">
            {/* Logo + Title (Mobile) */}
            <Link href="/dashboard" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <div className="flex items-center justify-center w-8 h-8 bg-white rounded-lg shadow-sm border border-gray-200">
                <Image
                  src="/logo-relish.png"
                  alt="Relish Logo"
                  width={24}
                  height={24}
                  className="rounded-md"
                  priority
                />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-gray-900 truncate">ClamFlow</h1>
              </div>
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              {showMobileMenu ? (
                <XMarkIcon className="h-5 w-5" />
              ) : (
                <Bars3Icon className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:flex items-center justify-between w-full">
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

        {/* Mobile Page Title (Below header) */}
        <div className="lg:hidden pb-3 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 truncate">{pageTitle}</h2>
          {pageSubtitle && (
            <p className="text-sm text-gray-600 truncate">{pageSubtitle}</p>
          )}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setShowMobileMenu(false)} />
          <div className="fixed top-0 right-0 z-50 w-64 h-full bg-white shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Menu</h3>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            {user && (
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center border border-emerald-200">
                    <span className="text-emerald-700 font-medium">
                      {(user.full_name || user.username || '').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {user.full_name || user.username}
                    </p>
                    {user.role && (
                      <p className="text-xs text-gray-600 capitalize">
                        {user.role}
                      </p>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    logout();
                    setShowMobileMenu(false);
                  }}
                  className="w-full text-left text-sm text-red-600 hover:text-red-900 px-3 py-2 rounded-md hover:bg-red-50 transition-colors border border-red-200"
                >
                  Sign Out
                </button>
              </div>
            )}

            {/* Mobile Navigation Links */}
            <div className="p-4">
              <nav className="space-y-2">
                <Link
                  href="/dashboard"
                  className="block px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Dashboard
                </Link>
                {/* Add more navigation links as needed */}
              </nav>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}