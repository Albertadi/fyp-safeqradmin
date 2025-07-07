'use client';

import React, { useState, useEffect } from 'react';
import {
  Upload,
  Play,
  Trash2,
  RefreshCw,
  Star,
  CheckCircle,
  AlertCircle,
  Activity,
  Clock,
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
  const [activeTab, setActiveTab] = useState<'trained' | 'untrained'>('trained');
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

  const handleDeployModel = async (model_id: string) => {
    try {
      await updateMLModel(model_id, {
        accuracy: Math.random() * 10 + 90,
      });
      await loadModels();
    } catch (err) {
      console.error('Deployment failed:', err);
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

  const handleTrainModel = async (model_id: string) => {
    try {
      await updateMLModel(model_id, {
        accuracy: Math.random() * 10 + 90,
        train_time_seconds: Math.floor(Math.random() * 100 + 30),
      });
      await loadModels();
    } catch (err) {
      console.error('Train failed:', err);
    }
  };

  const goToAddModelPage = () => {
    router.push('/model/addmodel');
  };

  function getStatusColor(isActive: boolean) {
    return isActive
      ? 'bg-green-100 text-green-700 hover:bg-green-200'
      : 'bg-gray-100 text-gray-700 hover:bg-gray-200';
  }

  // Filter models based on training status
  const filteredModels = models.filter((m) =>
    activeTab === 'trained' ? !!m.train_time_seconds : !m.train_time_seconds
  );

  return (
    <div className="p-6 w-full min-h-screen bg-white">
      <div className="max-w-6xl mx-auto">

        {/* Header + Add Button */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Model Management</h1>
            <p className="text-gray-600 mt-1">Manage AI models for QR code detection and classification</p>
          </div>

          <button
            onClick={goToAddModelPage}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            <Upload className="w-4 h-4" />
            Add New Model
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-4">
          <div className="flex space-x-1 p-1 bg-gray-100 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab('trained')}
              className={`relative flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                activeTab === 'trained'
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Trained Model</span>
            </button>
            <button
              onClick={() => setActiveTab('untrained')}
              className={`relative flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                activeTab === 'untrained'
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Untrained Model</span>
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
                  {filteredModels.map((model) => (
                    <tr key={model.model_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">v{model.version}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {model.accuracy !== undefined ? (model.accuracy * 100).toFixed(1) : '-'}%
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{model.train_time_seconds || '-'}</td>

                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleSetActiveModel(model.model_id)}
                          className={`px-3 py-1 text-sm font-medium rounded-full transition-colors inline-flex items-center gap-1 ${getStatusColor(model.is_active ?? false)}`}
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

                      <td className="px-6 py-4 flex gap-2">
                        {model.train_time_seconds ? (
                          // Trained models: Deploy, Set Active, Delete
                          <>
                            <button
                              onClick={() => handleDeployModel(model.model_id)}
                              title="Deploy"
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Play className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleSetActiveModel(model.model_id)}
                              title="Set Active"
                              className="flex items-center justify-center w-6 h-6"
                            >
                              <Star className={`w-4 h-4 ${model.is_active ? 'text-yellow-500' : 'text-gray-400'}`} />
                            </button>

                            <button
                              onClick={() => handleDeleteModel(model.model_id)}
                              title="Delete"
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          // Untrained models: Train, Set Active, Delete
                          <>
                            <button
                              onClick={() => handleTrainModel(model.model_id)}
                              title="Train Model"
                              className="text-green-600 hover:text-green-900"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleSetActiveModel(model.model_id)}
                              title="Set Active"
                              className="flex items-center justify-center w-6 h-6"
                            >
                              <Star className={`w-4 h-4 ${model.is_active ? 'text-yellow-500' : 'text-gray-400'}`} />
                            </button>

                            <button
                              onClick={() => handleDeleteModel(model.model_id)}
                              title="Delete"
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
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
