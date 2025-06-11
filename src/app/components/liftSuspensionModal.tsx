'use client'

import React from 'react'

interface LiftSuspensionModalProps {
  isOpen: boolean
  username: string
  daysLeft: number
  onCancel: () => void
  onConfirm: (userId: string) => void
  userId: string
}

export default function LiftSuspensionModal({
  isOpen,
  username,
  daysLeft,
  onCancel,
  onConfirm,
  userId,
}: LiftSuspensionModalProps) {
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
            Lift Suspension for{' '}
            <span className="text-green-600">{username}</span>
          </h3>
          <p className="text-sm text-gray-500">
            This user has <strong>{daysLeft}</strong> day{daysLeft !== 1 ? 's' : ''} left in suspension.
          </p>
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
            onClick={() => onConfirm(userId)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Lift Suspension
          </button>
        </div>
      </div>
    </div>
  )
}
