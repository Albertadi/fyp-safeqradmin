// src/app/private/page.tsx
import { getDashboardStats, isBackendOnline } from '@/app/controllers/dashboardStatisticsController';
import { Activity, Users, QrCode, Shield, ShieldAlert, Clock, TrendingUp, AlertTriangle } from 'lucide-react';

export default async function PrivatePage() {
  const [stats, online] = await Promise.all([
    getDashboardStats(),
    isBackendOnline(),
  ]);

  const { 
    totalUsers, 
    activeUsers, 
    suspendedUsers, 
    totalScans, 
    safeScans, 
    maliciousScans, 
  } = stats;

  // User stats cards (keeping original design)
  const userStatsCards = [
    {
      title: 'Total Registered Users',
      value: totalUsers,
      icon: Users,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: 'Active Users',
      value: activeUsers,
      icon: Users,
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      title: 'Suspended Users',
      value: suspendedUsers,
      icon: Users,
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
    },
  ];

  // Security stats cards (redesigned)
  const securityStatsCards = [
    {
      title: 'Total QR Scans',
      value: totalScans,
      icon: QrCode,
      bgColor: 'bg-gradient-to-br from-purple-50 to-purple-100',
      textColor: 'text-purple-600',
      description: 'QR scans processed',
    },
    {
      title: 'Safe Contents Scanned',
      value: safeScans,
      icon: Shield,
      bgColor: 'bg-gradient-to-br from-emerald-50 to-emerald-100',
      textColor: 'text-emerald-600',
      description: 'Verified safe',
    },
    {
      title: 'Malicious Contents Detected',
      value: maliciousScans,
      icon: ShieldAlert,
      bgColor: 'bg-gradient-to-br from-red-50 to-red-100',
      textColor: 'text-red-600',
      description: 'Threats blocked',
    },
  ];

  // Calculate security stats percentages
  const securityStatsPercentage = totalScans > 0 ? {
    safePercentage: Math.round((safeScans / totalScans) * 100),
    maliciousPercentage: Math.round((maliciousScans / totalScans) * 100),
  } : { safePercentage: 0, maliciousPercentage: 0 };

  return (
    <div className="p-6 bg-gray-50 h-full overflow-auto">
      <div className="">
        <div className="max-w-7xl mx-auto">
          {/* Header with enhanced styling */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  SafeQR Admin Dashboard
                </h1>
                <p className="text-gray-600 mt-2">
                  Monitor your system performance and security metrics in real-time
                </p>
              </div>
              <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow-sm border">
                <div className={`w-3 h-3 rounded-full ${online ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <Activity className={`w-5 h-5 ${online ? 'text-green-500' : 'text-red-500'}`} />
                <span className={`text-sm font-medium ${online ? 'text-gray-700' : 'text-red-600'}`}>
                  {online ? 'Service Online' : 'Service Offline'}
                </span>
              </div>
            </div>
          </div>
          {/* User Statistics Section (Original Design) */}
          <div className="mb-10">
            <div className="flex items-center mb-6">
              <Users className="w-6 h-6 text-gray-700 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">User Statistics</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {userStatsCards.map((stat, idx) => {
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
          </div>

          {/* Security Overview Section (Enhanced Design) */}
          <div className="mb-10">
            <div className="flex items-center mb-6">
              <Shield className="w-6 h-6 text-gray-700 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">Security Overview</h2>
            </div>

            {/* Security Stats Percentage (Improved Layout) */}
            {totalScans > 0 && (
              <div className="mb-8 bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                  <div className="text-center p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500 rounded-full mb-4">
                      <Shield className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-4xl font-bold text-emerald-600 mb-2">{securityStatsPercentage.safePercentage}%</div>
                    <div className="text-emerald-700 font-medium">Safe Contents Scanned</div>
                    <div className="text-sm text-emerald-600 mt-1">{safeScans.toLocaleString()} safe scans</div>
                  </div>
                  
                  <div className="text-center p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500 rounded-full mb-4">
                      <AlertTriangle className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-4xl font-bold text-red-600 mb-2">{securityStatsPercentage.maliciousPercentage}%</div>
                    <div className="text-red-700 font-medium">Malicious Contents Blocked</div>
                    <div className="text-sm text-red-600 mt-1">{maliciousScans.toLocaleString()} threats blocked</div>
                  </div>
                </div>
              </div>
            )}

          </div>


        </div>
      </div>
    </div>
  );
}