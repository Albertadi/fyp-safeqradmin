// src/app/private/Reports/page.tsx
import {ChevronRight,Search,Users,UserCheck,UserX} from 'lucide-react';
import { getReports } from './actions';
import Link from 'next/link';

export default function ReportsPage() {

  return (
    <div className="p-6 bg-gray-50 h-full overflow-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-2">All reports in the SafeQR system</p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex w-full md:max-w-md">
            <div className="relative w-full">
              <div className="absolute left-3 top-2.5 text-gray-400">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="Search reports by ID or name..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white shadow-sm border border-gray-100 rounded-xl overflow-x-auto">
          <table className="min-w-full text-sm text-left text-gray-700">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 font-medium text-gray-600">ID</th>
                <th className="px-6 py-4 font-medium text-gray-600">Username</th>
                <th className="px-6 py-4 font-medium text-gray-600">Role</th>
                <th className="px-6 py-4 font-medium text-gray-600">Status</th>
                <th className="px-6 py-4 font-medium text-gray-600">Created</th>
                <th className="px-6 py-4 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
