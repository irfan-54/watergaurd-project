import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../config/api'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function ReportModal({ report, onClose, isAdmin = false, isDepartment = false, onStartWork, onResolve, onDelete }) {
  if (!report) return null

  const { role } = useAuth()
  const navigate = useNavigate()
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const formatDate = (dateString) => new Date(dateString).toLocaleString()
  const formatPercentage = (value) => {
    if (value === null || value === undefined) return 'N/A'
    if (value > 1) {
      // Already in percentage format (like 50.96)
      return `${value.toFixed(2)}%`
    } else {
      // In decimal format (like 0.87) - convert to percentage
      return `${(value * 100).toFixed(2)}%`
    }
  }
  const formatCoordinates = (lat, lng) => `${lat?.toFixed(4) || 'N/A'}, ${lng?.toFixed(4) || 'N/A'}`

  const canComment = isAdmin || isDepartment
  const isCitizen = !isAdmin && !isDepartment

  useEffect(() => {
    fetchComments()

    // Set up real-time comments subscription
    const commentsChannel = supabase
      .channel(`comments-${report.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `report_id=eq.${report.id}`
        },
        (payload) => {
          setComments(prev => [...prev, payload.new])
        }
      )
      .subscribe()

    return () => {
      commentsChannel.unsubscribe()
    }
  }, [report.id])

  const fetchComments = async () => {
    setCommentsLoading(true)
    try {
      const response = await apiFetch(`/reports/${report.id}/comments`)
      if (response.error) throw response.error
      setComments(response.data || [])
    } catch (error) {
      console.error('Error fetching comments:', error)
      toast.error('Failed to load comments')
    } finally {
      setCommentsLoading(false)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || !canComment) return

    setSubmitting(true)
    try {
      const response = await apiFetch(`/reports/${report.id}/comments`, {
        method: 'POST',
        body: { comment: newComment.trim() }
      })
      if (response.error) throw response.error
      setNewComment('')
      setComments(prev => [...prev, response.data])
      toast.success('Comment added')
    } catch (error) {
      console.error('Error adding comment:', error)
      toast.error('Failed to add comment')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center 
             justify-center bg-black/40 backdrop-blur-[2px]">
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Report Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4">
          {/* Report Info */}
          <div className="space-y-4 mb-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</h3>
              <p className="text-gray-900 dark:text-white">
                {report.description.length > 120 ? `${report.description.substring(0, 120)}...` : report.description}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</h3>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium capitalize ${
                  report.category === 'contamination'
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    : report.category === 'blockage'
                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    : report.category === 'leakage'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                }`}>
                  {report.category}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</h3>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                  report.status === 'submitted' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                    : report.status === 'assigned' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : report.status === 'verified' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                    : report.status === 'in_progress' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                    : report.status === 'resolved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    : report.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
                }`}>
                  {report.status === 'submitted' ? 'Submitted'
                    : report.status === 'assigned' ? 'Assigned'
                    : report.status === 'verified' ? 'Verified'
                    : report.status === 'in_progress' ? 'In Progress'
                    : report.status === 'resolved' ? 'Resolved'
                    : report.status === 'rejected' ? 'Rejected'
                    : report.status || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Comments {comments.length > 0 && <span className="ml-1 text-gray-600 dark:text-gray-400">({comments.length})</span>}
            </h3>

            {commentsLoading ? (
              <div className="text-xs text-gray-600 dark:text-gray-400 italic">Loading comments...</div>
            ) : comments.length === 0 ? (
              <div className="text-xs text-gray-600 dark:text-gray-400 italic mb-3">No comments yet.</div>
            ) : (
              <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                {comments.map(comment => (
                  <div key={comment.id} className="bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
                    <p className="text-sm text-gray-900 dark:text-white">{comment.comment}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{formatDate(comment.created_at)}</p>
                  </div>
                ))}
              </div>
            )}

            {canComment && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                  placeholder="Add a comment..."
                  className="flex-1 px-3 py-2 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleAddComment}
                  disabled={submitting || !newComment.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
                >
                  {submitting ? '...' : 'Send'}
                </button>
              </div>
            )}

            {isCitizen && (
              <p className="text-xs text-gray-600 dark:text-gray-400 italic mt-2">Comments are added by department handling your report.</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex flex-wrap gap-3">
          {isAdmin && report.status === 'submitted' && onStartWork && (
            <button onClick={() => onStartWork(report.id)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">Assign to Department</button>
          )}
          {isAdmin && report.status === 'verified' && onResolve && (
            <button onClick={() => onResolve(report.id)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">Resolve</button>
          )}
          {isAdmin && (report.status === 'submitted' || report.status === 'resolved') && onDelete && (
            <button onClick={() => onDelete(report.id)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">Delete</button>
          )}
          {isDepartment && report.status === 'assigned' && onResolve && (
            <button onClick={() => onResolve(report.id)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">Mark Complete</button>
          )}
          <button 
            onClick={() => navigate(`/track/${report.id}`)}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Track Report →
          </button>
        </div>
      </div>
    </div>
  )
}