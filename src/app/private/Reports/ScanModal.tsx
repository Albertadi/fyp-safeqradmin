// src/app/private/Reports/ScanModal.tsx
'use client';

import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getScanDetails } from '../../controllers/scanActionsController';

interface ScanDetails {
  scan_id: string;
  user_id: string;
  decoded_content: string;
  security_status: string;
  scanned_at: string;
}

interface ScanModalProps {
  scanId: string;
  onClose: () => void;
}

export default function ScanModal({ scanId, onClose }: ScanModalProps) {
  const [scanDetails, setScanDetails] = useState<ScanDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchScanDetails() {
      try {
        const result = await getScanDetails(scanId);

        if (result) {
          const details: ScanDetails = {
            scan_id: result.scan_id,
            user_id: result.user_id,
            decoded_content: result.decoded_content,
            security_status: result.security_status,
            scanned_at: result.scanned_at,
          };
          setScanDetails(details);
        } else {
          setScanDetails(null);
        }
      } catch (error) {
        console.error('Error fetching scan details:', error);
        setScanDetails(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchScanDetails();
  }, [scanId]);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Scan Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Loading scan details...</div>
            </div>
          ) : scanDetails ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Scan ID</label>
                <p className="mt-1 text-sm text-gray-900">{scanDetails.scan_id}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">User ID</label>
                <p className="mt-1 text-sm text-gray-900">{scanDetails.user_id}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Decoded Content</label>
                <p className="mt-1 text-sm text-gray-900 break-all">{scanDetails.decoded_content}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Security Status</label>
                <span
                  className={`mt-1 inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    scanDetails.security_status === 'secure'
                      ? 'bg-green-100 text-green-800'
                      : scanDetails.security_status === 'flagged'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {scanDetails.security_status}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Scanned At</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(scanDetails.scanned_at).toLocaleString()}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Scan details not found</div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
