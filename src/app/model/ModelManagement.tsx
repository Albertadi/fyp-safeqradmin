'use client';

import React, { useState, useEffect } from 'react';
import {
  Upload,
  Trash2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import {
  fetchMLModels,
  deleteMLModel,
  updateMLModel,
  type MLModel,
} from '../controllers/mlModelsController';
import { useRouter } from 'next/navigation';

export default function ModelManagement() {
  const [models, setModels] = useState<MLModel[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      setLoading(true);
      const result = await fetchMLModels();
      setModels(result);
    } catch (err) {
      console.error('Error loading models:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSetActiveModel = async (model_id: string) => {
    try {
      await Promise.all(
        models.map((m) =>
          updateMLModel(m.model_id, { is_active: m.model_id === model_id })
        )
      );
      await loadModels();
    } catch (err) {
      console.error('Set active failed:', err);
    }
  };

  const handleDeleteModel = async (model_id: string) => {
    try {
      await deleteMLModel(model_id);
      await loadModels();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const goToAddModelPage = () => {
    router.push('/model/addmodel');
  };

  const goToRetrainPage = () => {
    router.push('/model/retrainmodel'); // ✅ Redirect to retrain model page
  };

  function getStatusColor(isActive: boolean) {
    return isActive
      ? 'bg-green-100 text-green-700 hover:bg-green-200'
      : 'bg-gray-100 text-gray-700 hover:bg-gray-200';
  }

  return (
    <div className="p-6 w-full min-h-screen bg-white">
      <div className="max-w-6xl mx-auto">

        {/* Header + Buttons */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Model Management</h1>
            <p className="text-gray-600 mt-1">Manage AI models for QR code detection and classification</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={goToRetrainPage}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-orange-700 transition-colors whitespace-nowrap"
            >
              <RefreshCw className="w-4 h-4" />
              Retrain Model
            </button>

            <button
              onClick={goToAddModelPage}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              <Upload className="w-4 h-4" />
              Add New Model
            </button>
          </div>
        </div>

        {/* Models Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {loading ? (
            <div className="p-6 text-gray-600">Loading models...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Version</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Accuracy</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Train Time (s)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {models.map((model) => (
                    <tr key={model.model_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">v{model.version}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {model.accuracy !== undefined ? (model.accuracy * 100).toFixed(1) : '-'}%
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{model.train_time_seconds || '-'}</td>

                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleSetActiveModel(model.model_id)}
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-colors gap-1 ${getStatusColor(model.is_active ?? false)}`}
                          title={`Click to set status to ${model.is_active ? 'Idle' : 'Active'}`}
                        >
                          {model.is_active ? (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Active
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-4 h-4" />
                              Idle
                            </>
                          )}
                        </button>
                      </td>

                      <td className="px-6 py-4">
                        <button
                          onClick={() =>
                            router.push(
                              `/model/deletemodel?model_id=${model.model_id}&version=${model.version}&is_active=${model.is_active}`
                            )
                          }
                          title="Delete"
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>


                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
