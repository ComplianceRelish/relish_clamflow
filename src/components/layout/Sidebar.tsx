'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function Sidebar() {
  const pathname = usePathname();
  const { userProfile } = useAuth();

  const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊', roles: ['all'] },
    { href: '/weight-notes', label: 'Weight Notes', icon: '⚖️', roles: ['production_staff', 'gatekeeper'] },
    { href: '/lots', label: 'Lot Management', icon: '📦', roles: ['production_staff', 'production_lead'] },
    { href: '/washing', label: 'Washing', icon: '🧽', roles: ['production_staff'] },
    { href: '/depuration', label: 'Depuration', icon: '💧', roles: ['production_staff'] },
    { href: '/ppc', label: 'PPC Forms', icon: '📋', roles: ['qc_staff', 'qc_lead'] },
    { href: '/fp', label: 'FP Forms', icon: '📄', roles: ['qc_staff', 'qc_lead'] },
    { href: '/inventory', label: 'Inventory', icon: '📈', roles: ['all'] },
    { href: '/rfid', label: 'RFID Tracking', icon: '🏷️', roles: ['production_lead', 'qc_lead'] },
  ];

  const filteredItems = menuItems.filter(item => 
    item.roles.includes('all') || 
    (userProfile?.role && item.roles.includes(userProfile.role))
  );

  return (
    <aside className="w-64 bg-white shadow-sm border-r border-gray-200 h-[calc(100vh-4rem)]">
      <nav className="p-4">
        <ul className="space-y-2">
          {filteredItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
