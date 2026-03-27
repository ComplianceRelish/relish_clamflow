'use client';

import { ArrowLeft, User, LogOut } from "lucide-react";

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
                src="/icons/logo-relish.png"
                alt="Relish"
                className="h-8 w-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
          </div>

          <div className="flex items-center gap-3">
            {rightContent}
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
