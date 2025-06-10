// src/app/components/Sidebar.tsx
'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { logout } from '@/app/components/actions'
import {
  Home,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield
} from 'lucide-react';

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const toggle = () => setCollapsed(!collapsed);

  const menuItems = [
    { label: 'Dashboard', icon: Home, href: '/private' },
    { label: 'User Management', icon: Users, href: '/management' },
  ];

  return (
    <div className={`bg-blue-800 text-white transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
      <div className="flex justify-between items-center p-4 border-b border-blue-700">
        {!collapsed && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">SafeQR</h2>
              <p className="text-xs text-blue-200">Admin Portal</p>
            </div>
          </div>
        )}
        <button
          onClick={toggle}
          className={`p-1 rounded-md hover:bg-blue-700 ${collapsed ? 'mx-auto' : ''}`}
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      <nav className="mt-6">
        {menuItems.map(({ label, icon: Icon, href }, index) => {
          const isSelected = pathname === href;
          return (
            <div
              key={href}
              onClick={() => router.push(href)}
              className={[
                'px-4 py-3 flex items-center rounded-md mx-2 cursor-pointer',
                collapsed && 'justify-center',
                isSelected
                  ? 'bg-blue-900'
                  : 'bg-blue-800 hover:bg-blue-700',
                index > 0 && 'mt-2'
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <Icon className="w-5 h-5 mr-2" />
              {!collapsed && <span>{label}</span>}
            </div>
          );
        })}
      </nav>

      <div className="absolute bottom-0 w-full mb-8">
        <div
          className={`px-4 py-3 flex items-center ${collapsed ? 'justify-center' : ''} rounded-md mx-2 cursor-pointer`}
          onClick={() => logout()}
        >
          <LogOut className="w-5 h-5 mr-2" />
          {!collapsed && <span>Logout</span>}
        </div>
      </div>
    </div>
  );
}
