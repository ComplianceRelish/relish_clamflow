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
        {/* Mobile Header - Ultra Clean: Logo + Title Only, Height 48px */}
        <div className="lg:hidden">
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

            {/* Hamburger Menu - 44px touch target */}
            <button
              onClick={() => setShowMobileMenu(true)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 active:bg-gray-200 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0"
            >
              <Bars3Icon className="h-5 w-5" />
            </button>
          </div>

          {/* Separate Gray Bar for Current Page Title */}
          <div className="px-3 py-1 bg-gray-50 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-700 truncate">{pageTitle}</p>
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

      {/* Mobile Menu Slide-out - Full Implementation */}
      {showMobileMenu && (
        <>
          {/* Overlay with proper z-index */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden"
            onClick={() => setShowMobileMenu(false)}
          />
          
          {/* Menu Panel - Slide from right with smooth transition */}
          <div className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-50 lg:hidden mobile-menu-enter">
            {/* Menu Header - Proper Branding */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-center">
                  <Image
                    src="/logo-relish.png"
                    alt="ClamFlow"
                    width={20}
                    height={20}
                    className="rounded-sm"
                  />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">ClamFlow</h3>
                  <p className="text-xs text-gray-600">Quality • Productivity</p>
                </div>
              </div>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="p-2 rounded-lg text-gray-600 hover:bg-white hover:text-gray-900 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            {/* Full User Information in Dedicated Space */}
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
                
                {/* Current Page Context Clearly Displayed */}
                <div className="bg-blue-50 rounded-lg p-3 mb-4">
                  <p className="text-xs text-blue-600 font-medium mb-1">Current Page</p>
                  <p className="text-sm text-blue-900 font-semibold truncate">{pageTitle}</p>
                  {pageSubtitle && (
                    <p className="text-xs text-blue-700 truncate mt-1">{pageSubtitle}</p>
                  )}
                </div>
                
                {/* Sign Out - Touch-friendly */}
                <button
                  onClick={() => {
                    logout();
                    setShowMobileMenu(false);
                  }}
                  className="w-full bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 px-4 py-3 rounded-lg text-sm font-medium transition-colors border border-red-200 min-h-[44px]"
                >
                  Sign Out
                </button>
              </div>
            )}

            {/* Quick Actions for Common Tasks */}
            <div className="p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h4>
              <div className="space-y-2">
                <Link
                  href="/dashboard"
                  className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors min-h-[44px] flex items-center"
                  onClick={() => setShowMobileMenu(false)}
                >
                  🏠 Dashboard Home
                </Link>
                
                {/* Shift Scheduling - Only for authorized roles */}
                {user && ['Production Lead', 'QC Lead', 'Admin', 'Super Admin'].includes(user.role) && (
                  <Link
                    href="/shift-scheduling"
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors min-h-[44px] flex items-center"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    📅 Shift Scheduling
                  </Link>
                )}
                
                <button
                  onClick={() => {
                    window.location.reload();
                    setShowMobileMenu(false);
                  }}
                  className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors min-h-[44px] flex items-center"
                >
                  🔄 Refresh Page
                </button>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors min-h-[44px] flex items-center"
                >
                  📱 Mobile Settings
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}