'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Scale, Package, Droplets, Beaker, ClipboardList, FileText, BarChart3, Tag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['all'] },
    { href: '/weight-notes', label: 'Weight Notes', icon: Scale, roles: ['production_staff', 'gatekeeper'] },
    { href: '/lots', label: 'Lot Management', icon: Package, roles: ['production_staff', 'production_lead'] },
    { href: '/washing', label: 'Washing', icon: Droplets, roles: ['production_staff'] },
    { href: '/depuration', label: 'Depuration', icon: Beaker, roles: ['production_staff'] },
    { href: '/ppc', label: 'PPC Forms', icon: ClipboardList, roles: ['qc_staff', 'qc_lead'] },
    { href: '/fp', label: 'FP Forms', icon: FileText, roles: ['qc_staff', 'qc_lead'] },
    { href: '/inventory', label: 'Inventory', icon: BarChart3, roles: ['all'] },
    { href: '/rfid', label: 'RFID Tracking', icon: Tag, roles: ['production_lead', 'qc_lead'] },
  ];

  const filteredItems = menuItems.filter(item => 
    item.roles.includes('all') || 
    (user?.role && item.roles.includes(user.role.toLowerCase().replace(' ', '_')))
  );

  return (
    <aside className="w-64 bg-white border-r border-gray-200 shadow-sm h-[calc(100vh-4rem)]">
      <nav className="p-3">
        <ul className="space-y-1">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
