import React from 'react'

export default function ReportModal({ report, onClose, isAdmin = false }) {
  if (!report) return null

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  const formatPercentage = (value) => {
    return value ? `${Math.round(value * 100)}%` : 'N/A'
  }

  const formatCoordinates = (lat, lng) => {
    return `${lat?.toFixed(4) || 'N/A'}, ${lng?.toFixed(4) || 'N/A'}`
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl max-w-2xl w-full shadow-lg mx-4 max-h-[85vh] overflow-y-auto relative">
        <div className="p-6 pt-4 overflow-y-auto">
          {/* Fixed Header with Close Button */}
          <div className="sticky top-0 bg-gray-800 pb-4 mb-6 z-10 border-b border-gray-700">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Report Details</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Report Information - Correct Order */}
          <div className="space-y-4">
            {/* Image - First */}
            {report?.image_url && (
              <div className="w-full rounded-lg overflow-hidden mb-6 mt-2">
                <img
                  src={report.image_url}
                  alt="Report"
                  className="w-full h-auto max-h-64 object-cover rounded-lg"
                />
              </div>
            )}

            {/* Description - Second */}
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">Description</h3>
              <p className="text-white">{report.description}</p>
            </div>

            {/* Category - Third */}
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">Category</h3>
              <p className="text-white capitalize">{report.category || 'other'}</p>
            </div>

            {/* Risk Level - Fourth */}
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">Risk Level</h3>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                report.risk_level === 'HIGH' 
                  ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                  : report.risk_level === 'MEDIUM'
                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                  : report.risk_level === 'LOW'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                {report.risk_level || 'N/A'}
              </span>
            </div>

            {/* AI Confidence Scores - Fifth */}
            {isAdmin && (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-1">Text AI</h3>
                  <p className="text-white font-mono">{formatPercentage(report.text_confidence)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-1">Image AI</h3>
                  <p className="text-white font-mono">{formatPercentage(report.image_confidence)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-1">Final AI</h3>
                  <p className="text-white font-mono">{formatPercentage(report.final_confidence)}</p>
                </div>
              </div>
            )}

            {/* Location - Sixth */}
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">Location</h3>
              <p className="text-white font-mono">📍 {formatCoordinates(report.latitude, report.longitude)}</p>
            </div>

            {/* Status - Seventh */}
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">Status</h3>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                report.status === 'OPEN'
                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                  : report.status === 'IN_PROGRESS'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : report.status === 'RESOLVED'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                {report.status || 'N/A'}
              </span>
            </div>

            {/* Created Date - Eighth */}
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">Created</h3>
              <p className="text-white">{formatDate(report.created_at)}</p>
            </div>
          </div>

          {/* Action Buttons - Always Last */}
          <div className="sticky bottom-0 bg-gray-800 pt-6 mt-6 border-t border-gray-700 flex flex-wrap gap-3">
            {/* Admin Workflow Actions */}
            {isAdmin && report.status === 'OPEN' && (
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Start Work
              </button>
            )}
            {isAdmin && report.status === 'IN_PROGRESS' && (
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Resolve
              </button>
            )}
            
            {/* Citizen Edit Action */}
            {!isAdmin && report.status === 'OPEN' && (
              <button 
                onClick={() => {
                  // Navigate to edit page
                  window.location.href = `/edit-report/${report.id}`
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Edit
              </button>
            )}
            
            {/* Delete Action - Available to all */}
            {(report.status === 'OPEN' || report.status === 'RESOLVED') && (
              <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Delete
              </button>
            )}
            
            {/* Close Action - Always available */}
            <button 
              onClick={onClose}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
