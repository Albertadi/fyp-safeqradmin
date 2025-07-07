'use client';

import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { createVerifiedLink, type CreateVerifiedLinkData } from '../../controllers/verifiedLinksController';
import { useRouter } from 'next/navigation';

const SECURITY_STATUS = {
  SAFE: 'Safe' as const,
  MALICIOUS: 'Malicious' as const,
};

interface AddVerifiedLinkProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function AddVerifiedLink({ onSuccess, onCancel }: AddVerifiedLinkProps) {
  const router = useRouter();

  const [newLink, setNewLink] = useState({
    url: '',
    security_status: SECURITY_STATUS.SAFE as 'Safe' | 'Malicious',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddVerifiedLink = async () => {
    if (!newLink.url) {
      alert('Please enter a URL');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const linkData: CreateVerifiedLinkData = {
        url: newLink.url,
        security_status: newLink.security_status,
        added_by: '80a9d353-421f-4589-aea9-37b907398450',
      };

      await createVerifiedLink(linkData);

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/links');
      }
    } catch (err) {
      console.error('Error adding link:', err);
      setError('Failed to add link. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 p-6">
      <div className="max-w-md mx-auto mt-10 bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Add New Verified Link</h2>
          <button
            onClick={() => {
              if (onCancel) onCancel();
              else router.push('/links');
            }}
            aria-label="Close"
            className="text-gray-500 hover:text-gray-800"
            disabled={isSubmitting}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 text-red-600 font-medium">{error}</div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="url" className="block mb-1 font-medium">
              URL
            </label>
            <input
              type="url"
              id="url"
              placeholder="https://example.com"
              value={newLink.url}
              onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="status" className="block mb-1 font-medium">
              Security Status
            </label>
            <select
              id="status"
              value={newLink.security_status}
              onChange={(e) =>
                setNewLink({ ...newLink, security_status: e.target.value as 'Safe' | 'Malicious' })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            >
              <option value="Safe">Safe</option>
              <option value="Malicious">Malicious</option>
            </select>
          </div>

          <button
            onClick={handleAddVerifiedLink}
            disabled={isSubmitting}
            className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
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
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                Adding...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Add Link
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
