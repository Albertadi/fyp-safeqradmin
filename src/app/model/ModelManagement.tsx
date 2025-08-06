'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Upload,
  Trash2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  X,
  Loader2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  fetchMLModels,
  deleteMLModel,
  updateMLModel,
  type MLModel,
} from '../controllers/mlModelsController';

export default function ModelManagement() {
  const [models, setModels] = useState<MLModel[]>([]);
  const [prevModels, setPrevModels] = useState<MLModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  const [isSettingActiveId, setIsSettingActiveId] = useState<string | null>(null);
  const [modelToDelete, setModelToDelete] = useState<MLModel | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    loadModels();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const stillTraining = models.some(
        (m) => m.accuracy == null || m.train_time_seconds == null
      );
      if (stillTraining) {
        setIsAutoRefreshing(true);
        loadModels();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [models]);

  const loadModels = async () => {
    try {
      if (!isAutoRefreshing) setLoading(true);
      const result = await fetchMLModels();

      result.forEach((model) => {
        const prev = prevModels.find((m) => m.model_id === model.model_id);
        if (
          prev &&
          (prev.accuracy == null || prev.train_time_seconds == null) &&
          model.accuracy != null &&
          model.train_time_seconds != null
        ) {
          setSuccessMessage(`Model v${model.version} retrained successfully!`);
          setTimeout(() => setSuccessMessage(null), 4000); // hide after 4s
        }
      });

      setPrevModels(result);
      setModels(result);
    } catch (err) {
      console.error('Error loading models:', err);
    } finally {
      if (!isAutoRefreshing) setLoading(false);
    }
  };

  const handleSetActiveModel = async (model_id: string) => {
    setIsSettingActiveId(model_id);
    try {
      await Promise.all(
        models.map((m) =>
          updateMLModel(m.model_id, { is_active: m.model_id === model_id })
        )
      );
      await loadModels();
    } catch (err) {
      console.error('Set active failed:', err);
    } finally {
      setIsSettingActiveId(null);
    }
  };

  const openDeleteModal = useCallback((model: MLModel) => {
    setModelToDelete(model);
    setDeleteError(null);
  }, []);

  const handleConfirmDelete = async () => {
    if (!modelToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteMLModel(modelToDelete.model_id);
      setModelToDelete(null);
      setTimeout(() => setSuccessMessage(null), 4000);
      await loadModels();
    } catch (err) {
      console.log(err)
      setDeleteError('Failed to delete the model. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const goToAddModelPage = () => {
    if (models.length === 0) {
      return router.push('/model/addmodel?version=1.0');
    }

    const versionNumbers = models
      .map((m) => parseFloat(m.version))
      .filter((v) => !isNaN(v))
      .sort((a, b) => b - a);

    const latestVersion = versionNumbers[0] ?? 1.0;
    const nextVersion = (latestVersion + 0.1).toFixed(1);

    router.push(`/model/addmodel?version=${nextVersion}`);
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
        <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Model Management</h1>
            <p className="text-gray-600 mt-1">
              Manage AI models for QR code detection and classification
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={goToAddModelPage}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              <Upload className="w-4 h-4" />
              Train New Model
            </button>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 px-4 py-3 bg-green-100 text-green-700 rounded border border-green-300">
            {successMessage}
          </div>
        )}

        {/* Models Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {loading ? (
            <div className="p-6 text-gray-600">Loading models...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Version
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Accuracy
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Train Time (s)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {models.map((model) => (
                    <tr key={model.model_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        v{model.version}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-900">
                        {model.accuracy != null ? (
                          <div className="text-left w-20">{(model.accuracy * 100).toFixed(1)}%</div>
                        ) : (
                          <div className="flex flex items-center w-20">
                            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-900">
                        {model.train_time_seconds != null ? (
                          <div className="text-left w-20">{model.train_time_seconds}</div>
                        ) : (
                          <div className="flex flex items-center w-20">
                            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                          </div>
                        )}
                      </td>


                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleSetActiveModel(model.model_id)}
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-colors gap-1 ${getStatusColor(
                            model.is_active ?? false
                          )}`}
                          title={`Click to set status to ${model.is_active ? 'Idle' : 'Active'}`}
                          disabled={isSettingActiveId !== null}
                        >
                          {isSettingActiveId === model.model_id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : model.is_active ? (
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
                          onClick={() => openDeleteModal(model)}
                          title="Delete"
                          className="text-red-600 hover:text-red-800"
                          disabled={isSettingActiveId !== null}
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

      {/* Delete ML Model Modal */}
      {modelToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto">
          <div className="absolute inset-0 bg-black opacity-50 transition-opacity duration-150"></div>

          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 transition-all duration-150">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Delete ML Model</h2>
              <button onClick={() => setModelToDelete(null)} className="text-gray-400 hover:text-gray-600" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-center">
              <p className="text-gray-800">
                Are you sure you want to delete <strong>Model Version v{modelToDelete.version}</strong>?
              </p>
              <p className="text-sm text-gray-700">
                Status: <span className={modelToDelete.is_active ? "text-green-600" : "text-yellow-600"}>
                  {modelToDelete.is_active ? "Active" : "Idle"}
                </span>
              </p>
              {deleteError && <div className="text-red-600 text-sm">{deleteError}</div>}
              <div className="flex justify-center space-x-4 mt-6">
                <button
                  onClick={() => setModelToDelete(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className={`px-4 py-2 text-sm rounded-md text-white ${isDeleting ? "bg-red-300" : "bg-red-600 hover:bg-red-700"}`}
                >
                  {isDeleting ? "Deleting..." : "Delete Model"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
