"use client"

import { useState, useEffect } from "react"
import { Plus, X } from "lucide-react"
import { createMLModel, fetchMLModels, type MLModel } from "@/app/controllers/mlModelsController"
import { useRouter, useSearchParams } from "next/navigation"

export default function AddMLModelPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const prefilledVersion = searchParams?.get("version") ?? "" // Safely access searchParams
  const [version, setVersion] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [models, setModels] = useState<MLModel[]>([])

  useEffect(() => {
    async function loadModels() {
      try {
        const fetchedModels = await fetchMLModels()
        setModels(fetchedModels)
      } catch (err) {
        console.error("Failed to fetch models for validation:", err)
      }
    }
    loadModels()
  }, [])

  // Only set prefilled version on initial mount
  useEffect(() => {
    setVersion(prefilledVersion)
  }, [prefilledVersion])

  const isVersionExists = (versionToCheck: string) => {
    return models.some((m) => m.version === versionToCheck)
  }

  const handleAddModel = async () => {
    if (!version.trim()) {
      alert("Please enter the model version")
      return
    }

    const versionRegex = /^\d+\.\d+$/
    if (!versionRegex.test(version.trim())) {
      setError("Please enter a valid version format (e.g., 1.0, 2.1)")
      return
    }

    if (isVersionExists(version.trim())) {
      setError("This version already exists. Please use a different version number.")
      return
    }

    setIsSubmitting(true)
    setError(null)

    const newModel: Partial<MLModel> = {
      version: version.trim(),
      created_at: new Date().toISOString(),
      is_active: false,
      trained_by: "c3b75bee-9829-45ea-b5a6-e6ab3dd66b33",
    }

    try {
      await createMLModel(newModel)
      router.push("/model")
    } catch (err) {
      console.error("Error adding model:", err)
      setError("Failed to add model. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 p-6">
      <div className="max-w-md mx-auto mt-10 bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Add New ML Model</h2>
          <button
            onClick={() => router.push("/model")}
            aria-label="Close"
            className="text-gray-500 hover:text-gray-800"
            disabled={isSubmitting}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && <div className="mb-4 text-red-600 font-medium">{error}</div>}

        <div className="space-y-4">
          <div>
            <label htmlFor="version" className="block mb-1 font-medium">
              Model Version
            </label>
            <input
              type="text"
              id="version"
              placeholder="e.g., 1.0"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            />
          </div>

          <button
            onClick={handleAddModel}
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
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Adding...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Add Model
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
