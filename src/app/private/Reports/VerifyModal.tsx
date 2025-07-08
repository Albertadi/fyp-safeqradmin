'use client';

import { useState, useEffect } from 'react';
import { getScanDetails } from '../../controllers/scanActionsController';

interface ScanDetails {
  scan_id: string;
  user_id: string;
  decoded_content: string;
  security_status: string;
  scanned_at: string;
}

export default function VerifyModal({
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
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

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

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(label);
      setIsSubmitting(false);
      setShowSuccess(true);
      // Auto-close after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error submitting:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-opacity-50 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 md:p-8">
        {showSuccess ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Successfully Submitted!
            </h3>
            <p className="text-gray-600 text-center">
              Your verification has been recorded.
            </p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Loading scan details...</div>
          </div>
        ) : scanDetails ? (
          <>
            <h5 className="text-lg font-semibold mb-3 text-gray-900 text-left">
              Verify URL Link:
              <br />
              <span
                className="text-blue-600 break-all text-s md:text-sm"
                title={scanDetails.decoded_content}  // show full on hover
              >
                {scanDetails.decoded_content}
              </span>
            </h5>

            <label
              htmlFor="labelSelect"
              className="block mb-2 text-gray-800 font-semibold"
            >
              True Label of URL Link:
            </label>
            <select
              id="labelSelect"
              value={label}
              onChange={(e) => setLabel(e.target.value as 'Safe' | 'Malicious')}
              className="w-full rounded-md border border-gray-300 px-4 py-2 mb-6 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition"
              disabled={isSubmitting}
            >
              <option value="Safe">Safe</option>
              <option value="Malicious">Malicious</option>
            </select>

            <div className="flex justify-end space-x-4">
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-md border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-5 py-2 rounded-md bg-green-600 text-white font-semibold hover:bg-green-700 shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  'Confirm'
                )}
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Scan details not found</div>
          </div>
        )}
      </div>
    </div>
  );
}