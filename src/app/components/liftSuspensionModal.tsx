'use client'

import React, { useState, useEffect } from 'react'
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
  autoLiftExpired?: boolean
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
  autoLiftExpired = false,
}: LiftSuspensionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasAutoLifted, setHasAutoLifted] = useState(false)
  const [autoLiftError, setAutoLiftError] = useState<string | null>(null)

  // Calculate if suspension is actually expired based on end date
  const isActuallyExpired = () => {
    if (!suspensionEndDate) return isExpired || daysLeft <= 0
    const endDate = new Date(suspensionEndDate)
    const now = new Date()
    return endDate < now
  }

  // Auto-lift expired suspensions
  useEffect(() => {
    const shouldAutoLift = () => {
      if (!autoLiftExpired || !isOpen || hasAutoLifted) return false
      return isActuallyExpired()
    }

    const performAutoLift = async () => {
      if (shouldAutoLift()) {
        setHasAutoLifted(true)
        setIsSubmitting(true)
        setAutoLiftError(null)
        
        try {
          await onConfirm(userId, 'Automatically lifted - suspension period expired')
          console.log(`Suspension automatically lifted for user: ${username}`)
        } catch (error) {
          console.error('Failed to auto-lift suspension:', error)
          setAutoLiftError('Failed to automatically lift suspension. Please try manually.')
          setHasAutoLifted(false)
        } finally {
          setIsSubmitting(false)
        }
      }
    }

    if (isOpen) {
      // Small delay to ensure UI is ready
      const timer = setTimeout(performAutoLift, 100)
      return () => clearTimeout(timer)
    }
  }, [isOpen, suspensionEndDate, autoLiftExpired, hasAutoLifted, onConfirm, userId, username])

  // Reset states when modal closes
  useEffect(() => {
    if (!isOpen) {
      setHasAutoLifted(false)
      setAutoLiftError(null)
      setIsSubmitting(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleConfirm = async () => {
    setIsSubmitting(true)
    setAutoLiftError(null)
    try {
      await onConfirm(userId, undefined)
    } catch (error) {
      console.error('Failed to lift suspension:', error)
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
    if (hasAutoLifted) {
      return {
        icon: <CheckCircle className="w-5 h-5 text-green-500" />,
        text: 'Suspension automatically lifted',
        textColor: 'text-green-700',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      }
    } else if (isActuallyExpired()) {
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
  const isCurrentlyExpired = isActuallyExpired()

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
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
              {hasAutoLifted ? 'Suspension Lifted' : 'Lift Suspension'}
            </h3>
          </div>
          <p className="text-gray-600">
            {hasAutoLifted ? 'Suspension automatically lifted for' : 'Reviewing suspension for'}{' '}
            <span className="font-semibold text-indigo-600">{username}</span>
          </p>
        </div>

        {/* Auto-lift success notification */}
        {hasAutoLifted && !autoLiftError && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-green-800 text-sm">Suspension Automatically Lifted</h4>
                <p className="text-green-700 text-sm mt-1">
                  The suspension period has expired and has been automatically lifted. The user can now access the system normally.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Auto-lift error notification */}
        {autoLiftError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-red-800 text-sm">Auto-lift Failed</h4>
                <p className="text-red-700 text-sm mt-1">
                  {autoLiftError}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Suspension Status */}
        <div className={`p-4 rounded-lg border ${status.bgColor} ${status.borderColor} mb-6`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {status.icon}
              <span className={`ml-2 font-medium ${status.textColor}`}>
                {status.text}
              </span>
            </div>
            {(isCurrentlyExpired || hasAutoLifted) && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                {hasAutoLifted ? 'Auto-lifted' : 'Auto-eligible'}
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
                <p className="text-gray-600 mt-1">{formatDate(suspensionStartDate)}</p>
              </div>
              <div>
                <label className="font-medium text-gray-700">End Date:</label>
                <p className="text-gray-600 mt-1">{formatDate(suspensionEndDate)}</p>
              </div>
            </div>
          )}
          
          {suspensionReason && (
            <div>
              <label className="font-medium text-gray-700 text-sm">Original Reason:</label>
              <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-md mt-1 border">
                {suspensionReason}
              </p>
            </div>
          )}

          {/* Current date for reference */}
          <div className="text-xs text-gray-500 border-t pt-3">
            <span className="font-medium">Current Date:</span> {formatDate(new Date().toISOString())}
          </div>
        </div>

        {/* Warning for early lifting */}
        {!isCurrentlyExpired && !hasAutoLifted && daysLeft > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
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

        {/* Processing indicator */}
        {isSubmitting && !hasAutoLifted && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
              <span className="text-blue-700 text-sm font-medium">
                {autoLiftExpired && isCurrentlyExpired ? 'Automatically lifting suspension...' : 'Processing request...'}
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            disabled={isSubmitting}
          >
            {hasAutoLifted ? 'Close' : 'Cancel'}
          </button>
          {!hasAutoLifted && (
            <button
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
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
          )}
        </div>
      </div>
    </div>
  )
}