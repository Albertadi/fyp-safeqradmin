'use client';

import { useState, useEffect } from 'react';
import { getScanDetails } from '../../controllers/scanActionsController';
import { checkUrlExists } from '../../controllers/verifiedLinksController';

interface ScanDetails {
  scan_id: string;
  user_id: string;
  decoded_content: string;
  security_status: string;
  scanned_at: string;
}

type Status = 'idle' | 'loading' | 'success' | 'duplicate' | 'error';

export default function ExportModal({
  scanId,
  onClose,
  onSubmit,
}: {
  scanId: string;
  onClose: () => void;
  onSubmit: (label: 'Safe' | 'Malicious') => void;
}) {
  const [label, setLabel] = useState<'Safe' | 'Malicious'>('Safe');
  const [scanDetails, setScanDetails] = useState<ScanDetails | null>(null);
  const [status, setStatus] = useState<Status>('idle');

  useEffect(() => {
    async function fetchScanDetails() {
      try {
        const result = await getScanDetails(scanId);
        if (result) {
          setScanDetails(result);
        } else {
          setScanDetails(null);
        }
      } catch (error) {
        console.error('Error fetching scan details:', error);
        setScanDetails(null);
      }
    }

    fetchScanDetails();
  }, [scanId]);

  const handleSubmit = async () => {
    if (!scanDetails) return;
    setStatus('loading');

    try {
      const exists = await checkUrlExists(scanDetails.decoded_content);
      if (exists) {
        setStatus('duplicate');
        return;
      }

      await onSubmit(label);
      setStatus('success');

      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error submitting:', error);
      setStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-auto">
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-black opacity-50 backdrop-blur-md transition-opacity duration-150"></div>

      {/* Modal Content */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6 md:p-8 z-10">
        {status === 'duplicate' ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 9v2m0 4h.01M21 12A9 9 0 1 1 3 12a9 9 0 0 1 18 0z"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-yellow-800 mb-2 text-center">This link has already been verified.</h3>
            <p className="text-gray-600 text-center">You cannot verify it again.</p>
            <button onClick={onClose} className="mt-6 px-4 py-2 rounded-md bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition">
              Close
            </button>
          </div>
        ) : status === 'success' ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Successfully Submitted!</h3>
            <p className="text-gray-600 text-center">Your verification has been recorded.</p>
          </div>
        ) : status === 'error' ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">Submission Failed</h3>
            <p className="text-gray-600 text-center mb-4">Something went wrong. Please try again.</p>
            <button onClick={handleSubmit} className="px-4 py-2 rounded-md bg-red-600 text-white font-semibold hover:bg-red-700 transition">
              Retry
            </button>
          </div>
        ) : !scanDetails ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Loading scan details...</div>
          </div>
        ) : (
          <>
            <h5 className="text-lg font-semibold mb-1 text-gray-900 text-left">
              Export URL:
            </h5>
            <p className="text-sm text-gray-500 mb-4">
              Export URL to verified links as training data
            </p>
            <span
              className="text-blue-600 break-all text-s md:text-sm"
              title={scanDetails.decoded_content}
            >
              {scanDetails.decoded_content}
            </span>

            <label htmlFor="labelSelect" className="block mt-6 mb-2 text-gray-800 font-semibold">
              True Label of URL Link:
            </label>
            <select
              id="labelSelect"
              value={label}
              onChange={(e) => setLabel(e.target.value as 'Safe' | 'Malicious')}
              className="w-full rounded-md border border-gray-300 px-4 py-2 mb-6 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition"
              disabled={status === 'loading'}
            >
              <option value="Safe">Safe</option>
              <option value="Malicious">Malicious</option>
            </select>

            <div className="flex justify-end space-x-4">
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-md border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition"
                disabled={status === 'loading'}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-5 py-2 rounded-md bg-green-600 text-white font-semibold hover:bg-green-700 shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                disabled={status === 'loading'}
              >
                {status === 'loading' ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  'Confirm'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
