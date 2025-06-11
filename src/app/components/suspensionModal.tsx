'use client'

import React from 'react'

interface SuspensionModalProps {
  isOpen: boolean
  username: string
  days: number
  onDaysChange: (days: number) => void
  onCancel: () => void
  onConfirm: () => void
}

export default function SuspensionModal({
  isOpen,
  username,
  days,
  onDaysChange,
  onCancel,
  onConfirm,
}: SuspensionModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          aria-label="Close modal"
        >
          ×
        </button>

        {/* Modal Header */}
        <div className="mb-4">
          <h3 className="text-2xl font-semibold text-gray-800">
            Suspend{' '}
            <span className="text-indigo-600">{username}</span>
          </h3>
          <p className="text-sm text-gray-500">
            Enter the number of days you want to suspend this user.
          </p>
        </div>

        {/* Input */}
        <div className="mb-6">
          <label
            htmlFor="suspend-days"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Days to suspend
          </label>
          <input
            id="suspend-days"
            type="number"
            min={1}
            value={days}
            onChange={(e) => onDaysChange(Number(e.target.value))}
            className="block w-full border border-gray-300 text-gray-500 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Suspend
          </button>
        </div>
      </div>
    </div>
  )
}
