'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    // Only register in browser environment
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Wait for page to fully load before registering
      if (document.readyState === 'complete') {
        registerServiceWorker();
      } else {
        window.addEventListener('load', registerServiceWorker);
        return () => window.removeEventListener('load', registerServiceWorker);
      }
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      // Check if service worker is supported
      if (!('serviceWorker' in navigator)) {
        console.warn('Service Workers are not supported in this browser');
        return;
      }

      // Register the service worker
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none', // Always check for updates
      });

      console.log('✅ Service Worker registered successfully:', registration);

      // Check for updates every hour
      setInterval(() => {
        registration.update().catch((error) => {
          console.warn('Service Worker update check failed:', error);
        });
      }, 60 * 60 * 1000);

      // Handle service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('🔄 New Service Worker version available');
            // Optionally show update notification to user
          }
        });
      });
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
      
      // Log specific error details
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
    }
  };

  return null; // This component doesn't render anything
}
