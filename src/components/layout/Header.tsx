'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

interface HeaderProps {
  pageTitle: string;
  pageSubtitle?: string;
}

export default function Header({ pageTitle, pageSubtitle }: HeaderProps) {
  const { user, logout } = useAuth();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        {/* Mobile Header - Ultra Clean */}
        <div className="lg:hidden">
          <div className="flex items-center justify-between h-12 px-3">
            {/* Logo Only */}
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-center">
                <Image
                  src="/logo-relish.png"
                  alt="ClamFlow"
                  width={20}
                  height={20}
                  className="rounded-sm"
                  priority
                />
              </div>
              <span className="text-lg font-bold text-gray-900">ClamFlow</span>
            </Link>

            {/* Menu Button */}
            <button
              onClick={() => setShowMobileMenu(true)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 active:bg-gray-200 touch-manipulation"
            >
              <Bars3Icon className="h-5 w-5" />
            </button>
          </div>

          {/* Mobile Page Title - Separate Row */}
          <div className="px-3 pb-2 bg-gray-50 border-t border-gray-100">
            <h2 className="text-sm font-medium text-gray-800 truncate">{pageTitle}</h2>
          </div>
        </div>

        {/* Desktop Header - Full Layout */}
        <div className="hidden lg:block">
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
        </div>
      </header>

      {/* Mobile Menu Slide-out */}
      {showMobileMenu && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden"
            onClick={() => setShowMobileMenu(false)}
          />
          
          {/* Menu Panel */}
          <div className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-50 lg:hidden transform transition-transform duration-300">
            {/* Menu Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-center">
                  <Image
                    src="/logo-relish.png"
                    alt="ClamFlow"
                    width={24}
                    height={24}
                    className="rounded-sm"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">ClamFlow</h3>
                  <p className="text-xs text-gray-600">Quality • Productivity</p>
                </div>
              </div>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="p-2 rounded-lg text-gray-600 hover:bg-white hover:text-gray-900 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            {/* User Info */}
            {user && (
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center border border-emerald-200">
                    <span className="text-emerald-700 font-medium text-lg">
                      {(user.full_name || user.username || '').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.full_name || user.username}
                    </p>
                    {user.role && (
                      <p className="text-xs text-gray-600 capitalize truncate">
                        {user.role}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Current Page Info */}
                <div className="bg-blue-50 rounded-lg p-3 mb-3">
                  <p className="text-xs text-blue-600 font-medium">Current Page</p>
                  <p className="text-sm text-blue-900 font-semibold truncate">{pageTitle}</p>
                  {pageSubtitle && (
                    <p className="text-xs text-blue-700 truncate">{pageSubtitle}</p>
                  )}
                </div>
                
                <button
                  onClick={() => {
                    logout();
                    setShowMobileMenu(false);
                  }}
                  className="w-full bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-red-200"
                >
                  Sign Out
                </button>
              </div>
            )}

            {/* Quick Actions */}
            <div className="p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h4>
              <div className="space-y-2">
                <Link
                  href="/dashboard"
                  className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  onClick={() => setShowMobileMenu(false)}
                >
                  🏠 Dashboard Home
                </Link>
                <button
                  onClick={() => {
                    window.location.reload();
                    setShowMobileMenu(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  🔄 Refresh Page
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}