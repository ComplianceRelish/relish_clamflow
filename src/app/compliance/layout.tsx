'use client';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const ALLOWED_ROLES = ['EIA Officer', 'QC Lead', 'Production Lead', 'Admin', 'Super Admin'];

export default function ComplianceLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
    if (!isLoading && user && !ALLOWED_ROLES.includes(user.role)) router.replace('/dashboard');
  }, [user, isLoading, router]);

  if (isLoading || !user) return <div className="min-h-screen bg-[#F0EBE0]" />;

  // EIA Officer gets a minimal chrome — no ClamFlow sidebar
  if (user.role === 'EIA Officer') {
    return (
      <div className="min-h-screen bg-[#F0EBE0]">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="text-base font-semibold text-[#8B5CF6]">EIA / EIC Compliance Records</h1>
            <p className="text-xs text-gray-400">Relish Hao Hao Chi Foods (RHHF) · Panavally</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user.full_name}</span>
            <button
              onClick={() => {
                localStorage.removeItem('clamflow_token');
                localStorage.removeItem('clamflow_user');
                router.replace('/login');
              }}
              className="text-sm text-red-500 hover:text-red-700 min-h-[44px] px-2"
            >
              Logout
            </button>
          </div>
        </header>
        <main className="p-4 md:p-6">{children}</main>
      </div>
    );
  }

  // All other allowed roles: just render children (their normal layout wraps this)
  return <>{children}</>;
}
