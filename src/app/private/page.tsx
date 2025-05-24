// src/app/private/page.tsx
'use client'

import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getDashboardStats } from './actions';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Home, Users, LogOut, ChevronLeft, ChevronRight, BarChart3, Shield, Activity, UserCheck, UserX, QrCode } from 'lucide-react';

interface PrivatePageProps {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  totalScans: number;
}

export default function PrivatePage() {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // For demo purposes - replace with actual data fetching
  const totalUsers = 1250;
  const activeUsers = 1180;
  const suspendedUsers = 70;
  const totalScans = 45230;

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const statsCards = [
    {
      title: 'Total Registered Users',
      value: totalUsers,
      icon: Users,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      title: 'Active Users',
      value: activeUsers,
      icon: UserCheck,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      title: 'Suspended Users',
      value: suspendedUsers,
      icon: UserX,
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600'
    },
    {
      title: 'Total QR Scans',
      value: totalScans,
      icon: QrCode,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    }
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`bg-blue-800 text-white transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
        <div className="flex justify-between items-center p-4 border-b border-blue-700">
          {!sidebarCollapsed && (
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
            onClick={toggleSidebar} 
            className={`p-1 rounded-md hover:bg-blue-700 ${sidebarCollapsed ? 'mx-auto' : ''}`}
          >
            {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
        
        <nav className="mt-6">
          <div className={`px-4 py-3 flex items-center ${sidebarCollapsed ? 'justify-center' : ''} bg-blue-900 rounded-md mx-2 cursor-pointer`}>
            <Home className="w-5 h-5 mr-2" />
            {!sidebarCollapsed && <span>Dashboard</span>}
          </div>
          <div 
            className={`px-4 py-3 flex items-center ${sidebarCollapsed ? 'justify-center' : ''} hover:bg-blue-700 rounded-md mx-2 cursor-pointer mt-2`}
            onClick={() => router.push('/management')}
          >
            <Users className="w-5 h-5 mr-2" />
            {!sidebarCollapsed && <span>User Management</span>}
          </div>
        </nav>
        
        <div className="absolute bottom-0 w-full mb-8">
          <div 
            className={`px-4 py-3 flex items-center ${sidebarCollapsed ? 'justify-center' : ''} rounded-md mx-2 cursor-pointer`} 
            onClick={() => router.push('/login')}
          >
            <LogOut className="w-5 h-5 mr-2" />
            {!sidebarCollapsed && <span>Logout</span>}
          </div>
        </div>

      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">SafeQR Admin Dashboard</h1>
                  <p className="text-gray-600 mt-2">Welcome back! Here's an overview of your SafeQR system.</p>
                </div>
                <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow-sm border">
                  <Activity className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium text-gray-700">System Online</span>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {statsCards.map((stat, index) => {
                const IconComponent = stat.icon;
                return (
                  <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                        <p className="text-3xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
                      </div>
                      <div className={`${stat.bgColor} p-3 rounded-lg`}>
                        <IconComponent className={`w-6 h-6 ${stat.textColor}`} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button 
                    onClick={() => router.push('/private/users')}
                    className="w-full flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Users className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-blue-900">Manage Users</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-blue-600" />
                  </button>
                  <button 
                    onClick={() => router.push('/private/analytics')}
                    className="w-full flex items-center justify-between p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <BarChart3 className="w-5 h-5 text-purple-600" />
                      <span className="font-medium text-purple-900">View Analytics</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-purple-600" />
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Database Status</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-green-600">Healthy</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">API Response Time</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-green-600">~120ms</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Active Sessions</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium text-blue-600">{activeUsers}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Activity tracking will be displayed here</p>
                <p className="text-sm text-gray-400">User registrations, logins, and system events</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}