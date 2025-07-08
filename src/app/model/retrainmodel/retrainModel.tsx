'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCw, X, AlertCircle } from 'lucide-react';
import { fetchMLModels, type MLModel } from '../../controllers/mlModelsController';
import { useRouter } from 'next/navigation';

export default function RetrainModelPage() {
  const router = useRouter();

  const [selectedModelId, setSelectedModelId] = useState('');
  const [newVersion, setNewVersion] = useState('');
  const [isRetraining, setIsRetraining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [models, setModels] = useState<MLModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadModels() {
      try {
        const fetchedModels = await fetchMLModels();
        setModels(fetchedModels);
      } catch (err) {
        console.error('Failed to fetch models:', err);
        setError('Failed to load models. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    loadModels();
  }, []);

  const selectedModel = useMemo(() => {
    return models.find(m => m.model_id === selectedModelId) || null;
  }, [models, selectedModelId]);

    useEffect(() => {
    if (selectedModel) {
        setNewVersion(selectedModel.version); 
    } else {
        setNewVersion('');
    }
    }, [selectedModel]);


  const handleRetrainModel = async () => {
    if (!selectedModel || !newVersion.trim()) {
      setError('Please select a model and provide a new version.');
      return;
    }

    setIsRetraining(true);
    setError(null);
    setSuccess(null);

    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      setSuccess(`Model retrained successfully`);
      setSelectedModelId('');
      setNewVersion('');

      setTimeout(() => {
        router.push('/model');
      }, 2000);
    } catch (err) {
      console.error('Retrain failed:', err);
      setError('Failed to retrain model. Please try again.');
    } finally {
      setIsRetraining(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 p-6">
      <div className="max-w-md mx-auto mt-10 bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Retrain ML Model</h2>
          <button
            onClick={() => router.push('/model')}
            className="text-gray-500 hover:text-gray-800"
            disabled={isRetraining}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-green-600" />
              <span className="text-green-700">{success}</span>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="modelSelect" className="block mb-1 font-medium">
              Select Model to Retrain
            </label>
            {loading ? (
              <div className="text-gray-500">Loading models...</div>
            ) : (
              <select
                id="modelSelect"
                value={selectedModelId}
                onChange={(e) => setSelectedModelId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:outline-none"
                disabled={isRetraining}
              >
                <option value="">-- Select a model --</option>
                {models.map((model) => (
                  <option key={model.model_id} value={model.model_id}>
                    v{model.version} {model.is_active ? '(Active)' : '(Idle)'}
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedModel && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
              <h4 className="font-medium text-gray-800 mb-2">Selected Model Info:</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div>Version: v{selectedModel.version}</div>
                <div>
                  Accuracy: {selectedModel.accuracy !== undefined
                    ? `${(selectedModel.accuracy * 100).toFixed(1)}%`
                    : 'N/A'}
                </div>
                <div>
                  Status: {selectedModel.is_active ? 'Active' : 'Idle'}
                </div>
              </div>
            </div>
          )}


          <button
            onClick={handleRetrainModel}
            disabled={isRetraining || !selectedModelId || !newVersion.trim()}
            className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isRetraining ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Retraining...
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                Retrain Model
              </>
            )}
          </button>
        </div>


      </div>
    </div>
  );
}
