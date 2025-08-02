// src/app/components/Sidebar.tsx
'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { logout } from '@/app/components/actions';
import {
  Home,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  BarChart3,
  Brain,
  Link, // New icon for Verified Links
  QrCode
} from 'lucide-react';

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const toggle = () => setCollapsed(!collapsed);

  const menuItems = [
    { label: 'Dashboard', icon: Home, href: '/private' },
    { label: 'User Management', icon: Users, href: '/management' },
    { label: 'Reports Management', icon: BarChart3, href: '/private/Reports' },
    { label: 'Model Management', icon: Brain, href: '/model' },
    { label: 'Verified Links', icon: Link, href: '/links' },
    { label: 'QR Management', icon: QrCode, href: '/private/QRmanagement'},
  ];

  return (
    <div className={`h-screen bg-blue-800 text-white transition-all duration-300 sticky top-0 z-40 ${collapsed ? 'w-16' : 'w-64'}`}>

      <div className="h-[76px] p-4 border-b border-blue-700 flex items-center justify-between">
        <div
          className={`flex items-center space-x-3 overflow-hidden transition-all ease-in-out duration-300 ${
            collapsed
              ? 'opacity-0 max-w-0 delay-0'
              : 'opacity-100 max-w-xs delay-100'
          }`}
        >
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold whitespace-nowrap">SafeQR</h2>
            <p className="text-xs text-blue-200 whitespace-nowrap">Admin Portal</p>
          </div>
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-md hover:bg-blue-700 transition-colors duration-300"
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
                'py-3 flex items-center rounded-md cursor-pointer transition-all duration-300 h-[44px]',
                'mx-2',
                isSelected ? 'bg-blue-900' : 'bg-blue-800 hover:bg-blue-700',
                index > 0 ? 'mt-2' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <div className="pl-4 flex items-center">
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span
                  className={`overflow-hidden whitespace-nowrap transition-all ease-in-out duration-300 ${
                    collapsed
                      ? 'max-w-0 opacity-0 delay-0'
                      : 'max-w-xs opacity-100 delay-100 ml-2'
                  }`}
                >
                  {label}
                </span>

              </div>
            </div>
          );
        })}
      </nav>

      <div className="absolute bottom-0 w-full mb-8">
        <div
          className={`py-3 flex items-center rounded-md mx-2 cursor-pointer transition-all duration-300 h-[44px]`}
          onClick={() => logout()}
        >
          <div className="pl-4 flex items-center">
            <LogOut className="w-5 h-5 flex-shrink-0" />
          <span
            className={`overflow-hidden whitespace-nowrap transition-all ease-in-out duration-300 ${
              collapsed
                ? 'max-w-0 opacity-0 delay-0'
                : 'max-w-xs opacity-100 delay-100 ml-2'
            }`}
          >
            Logout
          </span>

          </div>
        </div>
      </div>
    </div>
  );
}
