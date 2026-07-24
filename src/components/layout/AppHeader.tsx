'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, User, LogOut, Bell } from "lucide-react";
import clamflowAPI from '../../lib/clamflow-api';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
  userName?: string;
  userRole?: string;
  onLogout?: () => void;
  showLogo?: boolean;
  rightContent?: React.ReactNode;
}

export function AppHeader({
  title,
  subtitle,
  showBackButton = false,
  onBackClick,
  userName,
  userRole,
  onLogout,
  showLogo = true,
  rightContent,
}: AppHeaderProps) {
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const currentTime = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await clamflowAPI.getMyNotifications(true);
        const list = Array.isArray(res) ? res : [];
        setUnreadCount(list.length);
        setNotifications(list.slice(0, 10));
      } catch (_e) {}
    };
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="px-4 py-3 sm:px-6">
        {/* Top row with logo and user info */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {showBackButton && onBackClick && (
              <button
                onClick={onBackClick}
                className="min-h-[44px] min-w-[44px] p-2 rounded-md hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            {showLogo && (
              <img
                src="/icons/icon-96x96.png"
                alt="Relish"
                className="h-8 w-8 object-contain rounded-md"
              />
            )}
          </div>

          <div className="flex items-center gap-3">
            {rightContent}

            {/* Notification bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                className="relative p-2 text-gray-500 hover:text-gray-700 min-h-[44px] min-w-[44px]
                  flex items-center justify-center"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 bg-red-500 text-white text-xs
                    rounded-full w-4 h-4 flex items-center justify-center leading-none">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifs && (
                <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-lg border
                  border-gray-200 z-50 max-h-96 overflow-y-auto">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-800">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => clamflowAPI.markAllNotificationsRead().then(() => {
                          setUnreadCount(0); setShowNotifs(false);
                        })}
                        className="text-xs text-[#8B5CF6] hover:underline"
                      >Mark all read</button>
                    )}
                  </div>
                  {notifications.length === 0 && (
                    <p className="p-4 text-sm text-gray-400">No new notifications.</p>
                  )}
                  {notifications.map((n: any) => (
                    <div
                      key={n.id}
                      className={`px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 ${
                        n.isRead ? 'opacity-60' : ''
                      }`}
                      onClick={() => {
                        clamflowAPI.markNotificationRead(n.id);
                        setShowNotifs(false);
                        if (n.referenceId) {
                          window.location.href = `/compliance`;
                        }
                      }}
                    >
                      <p className={`text-xs font-semibold mb-0.5 ${
                        n.category === 'BREACH'   ? 'text-red-700' :
                        n.category === 'OVERDUE'  ? 'text-amber-700' :
                        n.category === 'RESOLVED' ? 'text-green-700' : 'text-gray-800'
                      }`}>{n.title}</p>
                      <p className="text-xs text-gray-500 line-clamp-2">{n.body}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(n.createdAt).toLocaleString('en-IN')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {userName && (
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-sm font-medium text-gray-900">
                    {userName}
                  </div>
                  {userRole && (
                    <div className="text-xs text-gray-500">{userRole}</div>
                  )}
                </div>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="ml-1 p-2 min-h-[36px] min-w-[36px] rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Title and subtitle */}
        {(title || subtitle) && (
          <div className="text-center">
            {title && (
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
            )}
          </div>
        )}

        {/* Date and time */}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mt-2">
          <span>{currentDate}</span>
          <span className="text-gray-300">•</span>
          <span>{currentTime}</span>
        </div>
      </div>
    </header>
  );
}
