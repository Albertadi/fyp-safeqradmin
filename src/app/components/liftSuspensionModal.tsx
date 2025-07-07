'use client'

import React, { useState } from 'react'
import { Clock, AlertTriangle, CheckCircle, Ban } from 'lucide-react'

interface LiftSuspensionModalProps {
  isOpen: boolean
  username: string
  daysLeft: number
  onCancel: () => void
  onConfirm: (userId: string, reason?: string) => void
  userId: string
  suspensionReason?: string
  suspensionStartDate?: string
  suspensionEndDate?: string
  isExpired?: boolean
}

export default function LiftSuspensionModal({
  isOpen,
  username,
  daysLeft,
  onCancel,
  onConfirm,
  userId,
  suspensionReason,
  suspensionStartDate,
  suspensionEndDate,
  isExpired = false,
}: LiftSuspensionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleConfirm = async () => {
    setIsSubmitting(true)
    try {
      await onConfirm(userId, undefined)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getSuspensionStatus = () => {
    if (isExpired || daysLeft <= 0) {
      return {
        icon: <CheckCircle className="w-5 h-5 text-green-500" />,
        text: 'Suspension has expired',
        textColor: 'text-green-700',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      }
    } else {
      return {
        icon: <Clock className="w-5 h-5 text-orange-500" />,
        text: `${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining`,
        textColor: 'text-orange-700',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200'
      }
    }
  }

  const status = getSuspensionStatus()

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
          aria-label="Close modal"
          disabled={isSubmitting}
        >
          ×
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="flex items-center mb-2">
            <Ban className="w-6 h-6 text-red-500 mr-2" />
            <h3 className="text-2xl font-semibold text-gray-800">
              Lift Suspension
            </h3>
          </div>
          <p className="text-gray-600">
            Reviewing suspension for <span className="font-semibold text-indigo-600">{username}</span>
          </p>
        </div>

        {/* Suspension Status */}
        <div className={`p-4 rounded-lg border ${status.bgColor} ${status.borderColor} mb-6`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {status.icon}
              <span className={`ml-2 font-medium ${status.textColor}`}>
                {status.text}
              </span>
            </div>
            {isExpired && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                Auto-eligible
              </span>
            )}
          </div>
        </div>

        {/* Suspension Details */}
        <div className="space-y-4 mb-6">
          {(suspensionStartDate || suspensionEndDate) && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="font-medium text-gray-700">Start Date:</label>
                <p className="text-gray-600">{formatDate(suspensionStartDate)}</p>
              </div>
              <div>
                <label className="font-medium text-gray-700">End Date:</label>
                <p className="text-gray-600">{formatDate(suspensionEndDate)}</p>
              </div>
            </div>
          )}
          
          {suspensionReason && (
            <div>
              <label className="font-medium text-gray-700 text-sm">Original Reason:</label>
              <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-md mt-1">
                {suspensionReason}
              </p>
            </div>
          )}
        </div>

        {/* Warning for early lifting */}
        {!isExpired && daysLeft > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800 text-sm">Early Suspension Lift</h4>
                <p className="text-yellow-700 text-sm mt-1">
                  This suspension still has {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining. 
                  Please ensure you have valid reasons for lifting it early.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Lift Suspension
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}