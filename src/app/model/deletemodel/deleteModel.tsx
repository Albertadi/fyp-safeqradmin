'use client';

import React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { deleteMLModel } from '../../controllers/mlModelsController';
import { X, Trash2 } from 'lucide-react';

export default function DeleteMLModelPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const model_id = searchParams.get('model_id');
  const version = searchParams.get('version');
  const is_active = searchParams.get('is_active') === 'true';

  const handleDelete = async () => {
    if (!model_id) return;
    try {
      await deleteMLModel(model_id);
      router.push('/model');
    } catch (err) {
      console.error('Failed to delete model:', err);
      alert('Failed to delete model. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 p-6">
      <div className="max-w-md mx-auto mt-10 bg-white rounded-lg shadow-md p-6 border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-black-600">Delete ML Model</h2>
          <button
            onClick={() => router.push('/model')}
            aria-label="Close"
            className="text-gray-500 hover:text-gray-800"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Confirmation Section */}
        <div className="space-y-4">
          <div>
            <p className="text-gray-800 text-base mb-4">
              Are you sure you want to delete <strong>Model Version v{version}</strong>?
            </p>

            <div className="mt-4">
              <p className="text-sm text-gray-700">
                Status:{' '}
                <span className={is_active ? 'text-green-600' : 'text-yellow-600'}>
                  {is_active ? 'Active' : 'Idle'}
                </span>
              </p>
            </div>

          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => router.push('/model')}
              className="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Model
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
