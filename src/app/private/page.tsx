// src/app/private/page.tsx
import { getDashboardStats, isBackendOnline } from './actions';
import {
  Activity,
  Users,
  ChevronRight,
  BarChart3,
  UserCheck,
  UserX,
  QrCode
} from 'lucide-react';
import Link from 'next/link';


export default async function PrivatePage() {

  const [stats, online] = await Promise.all([
    getDashboardStats(),
    isBackendOnline()
  ]);

  const { totalUsers, activeUsers, suspendedUsers, totalScans } = stats;


  const statsCards = [
    {
      title: 'Total Registered Users',
      value: totalUsers,
      icon: Users,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      title: 'Active Users',
      value: activeUsers,
      icon: UserCheck,
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      title: 'Suspended Users',
      value: suspendedUsers,
      icon: UserX,
      bgColor: 'bg-red-50',
      textColor: 'text-red-600'
    },
    {
      title: 'Total QR Scans',
      value: totalScans,
      icon: QrCode,
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    }
  ];

  return (
    <div className="p-6 bg-gray-50 h-full overflow-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">SafeQR Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Welcome back! Here's an overview of your SafeQR system.</p>
          </div>
          <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow-sm border">
            <Activity className={`w-5 h-5 ${online ? 'text-green-500' : 'text-red-500'}`} />
            <span className={`text-sm font-medium ${online ? 'text-gray-700' : 'text-red-600'}`}>
              {online ? 'Service Online' : 'Service Offline'}
            </span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-lg`}>
                    <Icon className={`w-6 h-6 ${stat.textColor}`} />
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
              <Link
                href="/management"
                className="w-full flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Manage Users</span>
                </div>
                <ChevronRight className="w-4 h-4 text-blue-600" />
              </Link>
              <Link
                href="/private/analytics"
                className="w-full flex items-center justify-between p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-purple-900">View Analytics</span>
                </div>
                <ChevronRight className="w-4 h-4 text-purple-600" />
              </Link>
            </div>
          </div>
          

          {/* System Health */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Database Status</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-600">Healthy</span> {/* PLACEHOLDER */}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">API Response Time</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-600">~120ms</span> {/* PLACEHOLDER */}
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
  );
}
