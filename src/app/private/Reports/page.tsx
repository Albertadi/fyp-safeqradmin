'use client';

import { Search } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { getReports } from './actions';
import StatusDropdown from './statusDropdown';
import ScanModal from '../Reports/ScanModal';
import UserModal from '../Reports/UserModal';
import VerifyModal from '../Reports/VerifyModal';
import { getScanById, addVerifiedLink } from '../../controllers/verifiedLinksController';
import { updateReportStatus } from '../../controllers/verifiedLinksController';

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
  const [verifyTarget, setVerifyTarget] = useState<{ scanId: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

  // Filter reports based on search term
  const filteredReports = useMemo(() => {
    if (!searchTerm.trim()) {
      return reports;
    }

    const searchLower = searchTerm.toLowerCase().trim();
    return reports.filter((report) => 
      report.report_id.toLowerCase().includes(searchLower) ||
      report.scan_id.toLowerCase().includes(searchLower) ||
      report.user_id.toLowerCase().includes(searchLower) ||
      report.reason.toLowerCase().includes(searchLower)
    );
  }, [reports, searchTerm]);

  const handleScanClick = (scanId: string) => {
    setSelectedScanId(scanId);
  };

  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId);
  };

  const closeScanModal = () => {
    setSelectedScanId(null);
  };

  const closeUserModal = () => {
    setSelectedUserId(null);
  };

  const openVerifyModal = (scanId: string) => {
    setVerifyTarget({ scanId });
  };

  const closeVerifyModal = () => {
    setVerifyTarget(null);
  };

const confirmVerify = async (securityStatus: 'Safe' | 'Malicious'): Promise<boolean> => {
  if (!verifyTarget) return false;

  setIsLoading(true);

  try {
    const scanData = await getScanById(verifyTarget.scanId);
    if (!scanData) throw new Error('Scan not found.');

    // No duplicate check here - done in modal

    await addVerifiedLink(scanData.url, securityStatus);

    const relatedReport = reports.find(r => r.scan_id === verifyTarget.scanId);
    if (relatedReport) {
      await updateReportStatus(relatedReport.report_id, 'Closed');
    }

    const updatedReports = await getReports();
    setReports(updatedReports);

    return true; // success
  } catch (error) {
    console.error('Error verifying link:', error);
    alert(error instanceof Error ? error.message : 'Unknown error');
    return false;
  } finally {
    setIsLoading(false);
  }
};


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
              placeholder="Search reports by ID, scan ID, user ID, or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
          </div>
        </div>

        {/* Search Results Info */}
        {searchTerm.trim() && (
          <div className="mb-4 text-sm text-gray-600">
            {filteredReports.length === 0 ? (
              <p>No reports found matching "{searchTerm}"</p>
            ) : (
              <p>
                Found {filteredReports.length} report{filteredReports.length !== 1 ? 's' : ''} matching "{searchTerm}"
              </p>
            )}
          </div>
        )}

        {/* Reports Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Report ID
                  </th>
                  <th className="px-6 py-4 w-56 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scan ID
                  </th>
                  <th className="px-6 py-4 w-56 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Verify
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      Loading reports...
                    </td>
                  </tr>
                ) : filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      {searchTerm.trim() ? 'No reports found matching your search.' : 'No reports available.'}
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((report) => (
                    <tr key={`${report.report_id}-${report.scan_id}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 align-middle">
                        {report.report_id}
                      </td>
                      <td className="px-6 py-4 w-56 text-sm text-gray-900 align-middle">
                        <button
                          onClick={() => handleScanClick(report.scan_id)}
                          className="text-blue-600 hover:text-blue-800 hover:underline truncate w-full text-left"
                          title={report.scan_id}
                        >
                          {report.scan_id}
                        </button>
                      </td>
                      <td className="px-6 py-4 w-56 text-sm text-gray-900 align-middle">
                        <button
                          onClick={() => handleUserClick(report.user_id)}
                          className="text-blue-600 hover:text-blue-800 hover:underline truncate w-full text-left"
                          title={report.user_id}
                        >
                          {report.user_id}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 align-middle">
                        {report.reason}
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <StatusDropdown
                          reportId={report.report_id}
                          initialStatus={report.status}
                        />
                      </td>
                      <td className="px-6 py-4 text-sm align-middle">
                      {report.status === 'Closed' ? (
                        <span className="text-gray-400 cursor-not-allowed">Verified</span>
                      ) : (
                        <button
                          onClick={() => openVerifyModal(report.scan_id)}
                          className="text-green-600 hover:text-green-800 hover:underline"
                        >
                          Verify
                        </button>
                      )}

                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modals */}
        {selectedScanId && <ScanModal scanId={selectedScanId} onClose={closeScanModal} />}
        {selectedUserId && <UserModal userId={selectedUserId} onClose={closeUserModal} />}
        {verifyTarget && (
          <VerifyModal
            scanId={verifyTarget.scanId}
            onClose={closeVerifyModal}
            onSubmit={confirmVerify}
          />
        )}
      </div>
    </div>
  );
}