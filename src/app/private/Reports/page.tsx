'use client';

import { Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getReports } from './actions';
import StatusDropdown from './statusDropdown';
import ScanModal from '../Reports/ScanModal';
import UserModal from '../Reports/UserModal';
import { createVerifiedLink } from '../../controllers/verifiedLinksController';

interface Report {
  report_id: string;
  scan_id: string;
  user_id: string;
  reason: string;
  status: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchReports() {
      try {
        const reportsData = await getReports();
        setReports(reportsData);
      } catch (error) {
        console.error('Error fetching reports:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchReports();
  }, []);

  const handleScanClick = (scanId: string) => setSelectedScanId(scanId);
  const handleUserClick = (userId: string) => setSelectedUserId(userId);
  const closeScanModal = () => setSelectedScanId(null);
  const closeUserModal = () => setSelectedUserId(null);

  const handleVerifyClick = async () => {
    const url = prompt('Enter the URL to verify:');
    if (!url) return;

    const statusInput = prompt('Enter status: Safe or Malicious');
    const status = statusInput === 'Safe' || statusInput === 'Malicious' ? statusInput : null;
    if (!status) {
      alert('Invalid status');
      return;
    }

    try {
      await createVerifiedLink({
        url,
        security_status: status,
        added_by: '80a9d353-421f-4589-aea9-37b907398450',
      });
      alert('Link verified and added!');
    } catch (err: any) {
      alert(err.message || 'Error verifying link');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 w-full min-h-screen bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading reports...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 w-full min-h-screen bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-1">All reports in the SafeQR system</p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative w-full">
            <div className="absolute left-3 top-2.5 text-gray-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              placeholder="Search reports by ID or name..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-500"
            />
          </div>
        </div>

        {/* Reports Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4">Report ID</th>
                  <th className="px-6 py-4 w-56">Scan ID</th>
                  <th className="px-6 py-4 w-56">User ID</th>
                  <th className="px-6 py-4">Reason</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reports.map((report) => (
                  <tr key={report.report_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {report.report_id}
                    </td>
                    <td className="px-6 py-4 w-56">
                      <button
                        onClick={() => handleScanClick(report.scan_id)}
                        className="text-blue-600 hover:text-blue-800 hover:underline truncate w-full text-left"
                        title={report.scan_id}
                      >
                        {report.scan_id}
                      </button>
                    </td>
                    <td className="px-6 py-4 w-56">
                      <button
                        onClick={() => handleUserClick(report.user_id)}
                        className="text-blue-600 hover:text-blue-800 hover:underline truncate w-full text-left"
                        title={report.user_id}
                      >
                        {report.user_id}
                      </button>
                    </td>
                    <td className="px-6 py-4">{report.reason}</td>
                    <td className="px-6 py-4">
                      <StatusDropdown
                        reportId={report.report_id}
                        initialStatus={report.status}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={handleVerifyClick}
                        className="text-sm text-green-600 hover:underline"
                      >
                        Verify
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modals */}
        {selectedScanId && (
          <ScanModal scanId={selectedScanId} onClose={closeScanModal} />
        )}
        {selectedUserId && (
          <UserModal userId={selectedUserId} onClose={closeUserModal} />
        )}
      </div>
    </div>
  );
}
