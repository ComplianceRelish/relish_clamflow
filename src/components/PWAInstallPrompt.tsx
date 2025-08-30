'use client';

import React, { useState, useEffect } from 'react';
import { XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode
    setIsStandalone(
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    );

    // Check if iOS
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Only show after user has been on site for a bit
      setTimeout(() => setShowInstallPrompt(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('ClamFlow PWA installed successfully');
      }
      
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('clamflow-pwa-dismissed', Date.now().toString());
  };

  // Don't show if already installed, dismissed recently, or not supported
  const dismissedTime = localStorage.getItem('clamflow-pwa-dismissed');
  const recentlyDismissed = dismissedTime && (Date.now() - parseInt(dismissedTime)) < 7 * 24 * 60 * 60 * 1000; // 7 days

  if (isStandalone || recentlyDismissed) {
    return null;
  }

  // iOS Install Instructions
  if (isIOS && !isStandalone) {
    return (
      <div className="fixed bottom-4 left-4 right-4 bg-black rounded-xl shadow-2xl border border-gray-700 p-4 z-50 lg:max-w-sm lg:left-auto lg:right-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 relative">
              <Image
                src="/icons/icon-96x96.png"
                alt="ClamFlow"
                width={32}
                height={32}
                className="rounded-lg"
              />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Install ClamFlow</h3>
              <p className="text-xs text-gray-400">Add to Home Screen</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
        
        <div className="text-xs text-gray-300 space-y-2">
          <p className="flex items-center">
            <span className="inline-block w-5 h-5 bg-blue-500 rounded text-center mr-2 text-white font-bold">1</span>
            Tap the Share button 
            <svg className="w-4 h-4 ml-1 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.50-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
            </svg>
          </p>
          <p className="flex items-center">
            <span className="inline-block w-5 h-5 bg-blue-500 rounded text-center mr-2 text-white font-bold">2</span>
            Select "Add to Home Screen"
          </p>
        </div>
      </div>
    );
  }

  // Android/Desktop Install Prompt
  if (showInstallPrompt && deferredPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 bg-black rounded-xl shadow-2xl border border-gray-700 p-4 z-50 lg:max-w-sm lg:left-auto lg:right-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 relative">
              <Image
                src="/icons/icon-96x96.png"
                alt="ClamFlow"
                width={32}
                height={32}
                className="rounded-lg"
              />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Install ClamFlow</h3>
              <p className="text-xs text-gray-400">Get the native app experience</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
        
        <p className="text-xs text-gray-300 mb-4">
          Install ClamFlow for quick access, offline capabilities, and native app performance.
        </p>
        
        <div className="flex space-x-2">
          <button
            onClick={handleInstallClick}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-medium py-2.5 px-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            <span>Install App</span>
          </button>
          <button
            onClick={handleDismiss}
            className="flex-1 bg-gray-700 text-gray-300 text-xs font-medium py-2.5 px-3 rounded-lg hover:bg-gray-600 hover:text-white transition-colors"
          >
            Not Now
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default PWAInstallPrompt;