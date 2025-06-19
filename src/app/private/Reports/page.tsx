// src/app/private/Reports/page.tsx
import { Search } from 'lucide-react';
import { getReports } from './actions';
import StatusDropdown from './statusDropdown';

export default async function ReportsPage() {
  const reports = await getReports();

  return (
    <div className="p-6 bg-gray-50 h-full overflow-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-2">All reports in the SafeQR system</p>
        </div>

        {/* Search */}
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
                <th className="px-6 py-4 font-medium text-gray-600">Report ID</th>
                <th className="px-6 py-4 font-medium text-gray-600">Scan ID</th>
                <th className="px-6 py-4 font-medium text-gray-600">User ID</th>
                <th className="px-6 py-4 font-medium text-gray-600">Reason</th>
                <th className="px-6 py-4 font-medium text-gray-600">Status</th>
                <th className="px-6 py-4 font-medium text-gray-600">Created</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.report_id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4">{report.report_id}</td>
                  <td className="px-6 py-4">{report.scan_id}</td>
                  <td className="px-6 py-4">{report.user_id}</td>
                  <td className="px-6 py-4">{report.reason}</td>
                  <td className="px-6 py-4">
                    <StatusDropdown
                      reportId={report.report_id}
                      initialStatus={report.status}
                    />
                  </td>
                  <td className="px-6 py-4">
                    {new Date(report.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
