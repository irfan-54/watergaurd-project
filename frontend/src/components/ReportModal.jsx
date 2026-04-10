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

  const canComment = true
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment: newComment.trim()
        })
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

  const getCategoryBadge = (category) => {
    const styles = {
      contamination: { background: 'rgba(239,68,68,0.15)', color: '#F87171', border: '1px solid rgba(239,68,68,0.25)' },
      blockage: { background: 'rgba(245,158,11,0.15)', color: '#FBBF24', border: '1px solid rgba(245,158,11,0.25)' },
      leakage: { background: 'rgba(59,130,246,0.15)', color: '#60A5FA', border: '1px solid rgba(59,130,246,0.25)' },
    }
    return styles[category] || { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.12)' }
  }

  const getStatusBadge = (status) => {
    const styles = {
      submitted: { background: 'rgba(245,158,11,0.15)', color: '#FBBF24', border: '1px solid rgba(245,158,11,0.25)' },
      assigned: { background: 'rgba(59,130,246,0.15)', color: '#60A5FA', border: '1px solid rgba(59,130,246,0.25)' },
      verified: { background: 'rgba(167,139,250,0.15)', color: '#A78BFA', border: '1px solid rgba(167,139,250,0.25)' },
      in_progress: { background: 'rgba(245,158,11,0.15)', color: '#FBBF24', border: '1px solid rgba(245,158,11,0.25)' },
      resolved: { background: 'rgba(34,197,94,0.15)', color: '#4ADE80', border: '1px solid rgba(34,197,94,0.25)' },
      rejected: { background: 'rgba(239,68,68,0.15)', color: '#F87171', border: '1px solid rgba(239,68,68,0.25)' },
    }
    return styles[status] || { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.12)' }
  }

  const getStatusLabel = (status) => {
    const labels = {
      submitted: 'Submitted', assigned: 'Assigned', verified: 'Verified',
      in_progress: 'In Progress', resolved: 'Resolved', rejected: 'Rejected',
    }
    return labels[status] || status || 'N/A'
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@300;400;500;600&display=swap');
        .rm-overlay {
          position: fixed;
          inset: 0;
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(4px);
          padding: 16px;
        }
        .rm-card {
          position: relative;
          background: rgba(15,20,35,0.95);
          border: 1px solid rgba(255,255,255,0.1);
          backdrop-filter: blur(20px);
          border-radius: 20px;
          width: 100%;
          max-width: 520px;
          max-height: 90vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05);
        }
        .rm-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 28px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .rm-title {
          font-family: 'Syne', sans-serif;
          font-size: 20px;
          font-weight: 700;
          color: white;
        }
        .rm-close {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: rgba(255,255,255,0.5);
          transition: all 0.2s ease;
        }
        .rm-close:hover {
          background: rgba(255,255,255,0.1);
          color: white;
          border-color: rgba(255,255,255,0.2);
        }
        .rm-content {
          flex: 1;
          overflow-y: auto;
          padding: 24px 28px;
        }
        .rm-content::-webkit-scrollbar {
          width: 4px;
        }
        .rm-content::-webkit-scrollbar-track {
          background: transparent;
        }
        .rm-content::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.15);
          border-radius: 4px;
        }
        .rm-section-label {
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: rgba(255,255,255,0.35);
          margin-bottom: 6px;
        }
        .rm-description {
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          color: rgba(255,255,255,0.8);
          line-height: 1.6;
        }
        .rm-badge {
          display: inline-block;
          padding: 5px 14px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          text-transform: capitalize;
        }
        .rm-divider {
          height: 1px;
          background: rgba(255,255,255,0.08);
          margin: 20px 0;
        }
        .rm-comment-bubble {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 12px 16px;
          margin-bottom: 10px;
        }
        .rm-comment-text {
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          color: rgba(255,255,255,0.8);
          line-height: 1.5;
        }
        .rm-comment-date {
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          color: rgba(255,255,255,0.3);
          margin-top: 6px;
        }
        .rm-comment-input {
          flex: 1;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 10px 14px;
          color: white;
          font-size: 13px;
          font-family: 'Inter', sans-serif;
          outline: none;
          transition: border-color 0.2s;
        }
        .rm-comment-input::placeholder {
          color: rgba(255,255,255,0.3);
        }
        .rm-comment-input:focus {
          border-color: #3B82F6;
        }
        .rm-send-btn {
          background: #3B82F6;
          color: white;
          border: none;
          border-radius: 12px;
          padding: 10px 18px;
          font-size: 13px;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .rm-send-btn:hover:not(:disabled) {
          background: #2563EB;
          box-shadow: 0 4px 12px rgba(59,130,246,0.3);
        }
        .rm-send-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .rm-footer {
          padding: 20px 28px;
          border-top: 1px solid rgba(255,255,255,0.08);
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .rm-action-btn {
          border: none;
          border-radius: 12px;
          padding: 10px 20px;
          font-size: 13px;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .rm-action-btn:hover {
          transform: translateY(-1px);
        }
        .rm-action-blue {
          background: #3B82F6;
          color: white;
        }
        .rm-action-blue:hover {
          background: #2563EB;
          box-shadow: 0 4px 15px rgba(59,130,246,0.35);
        }
        .rm-action-green {
          background: rgba(34,197,94,0.15);
          color: #4ADE80;
          border: 1px solid rgba(34,197,94,0.25);
        }
        .rm-action-green:hover {
          background: rgba(34,197,94,0.25);
          box-shadow: 0 4px 15px rgba(34,197,94,0.2);
        }
        .rm-action-red {
          background: rgba(239,68,68,0.12);
          color: #F87171;
          border: 1px solid rgba(239,68,68,0.25);
        }
        .rm-action-red:hover {
          background: rgba(239,68,68,0.2);
          box-shadow: 0 4px 15px rgba(239,68,68,0.2);
        }
        .rm-action-ghost {
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.7);
          border: 1px solid rgba(255,255,255,0.12);
        }
        .rm-action-ghost:hover {
          background: rgba(255,255,255,0.1);
          color: white;
          border-color: rgba(255,255,255,0.25);
        }
        .rm-italic-hint {
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          color: rgba(255,255,255,0.3);
          font-style: italic;
        }
      `}</style>

      <div className="rm-overlay" onClick={onClose}>
        <div className="rm-card" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="rm-header">
            <h2 className="rm-title">Report Details</h2>
            <button onClick={onClose} className="rm-close">
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="rm-content">
            {/* Report Info */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ marginBottom: 20 }}>
                <div className="rm-section-label">Description</div>
                <p className="rm-description">
                  {report.description.length > 120 ? `${report.description.substring(0, 120)}...` : report.description}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24 }}>
                <div>
                  <div className="rm-section-label">Category</div>
                  <span className="rm-badge" style={getCategoryBadge(report.category)}>
                    {report.category}
                  </span>
                </div>

                <div>
                  <div className="rm-section-label">Status</div>
                  <span className="rm-badge" style={getStatusBadge(report.status)}>
                    {getStatusLabel(report.status)}
                  </span>
                </div>
              </div>
            </div>

            {/* Image Evidence Section */}
            {(report.image_url || report.resolution_image_url) && (
              <div className="rm-divider" />
            )}
            
            {report.image_url && (
              <div style={{ marginBottom: 16 }}>
                <div className="rm-section-label" style={{ marginBottom: 8 }}>
                  {report.resolution_image_url ? 'Before - Original Issue' : 'Evidence Image'}
                </div>
                <img
                  src={report.image_url}
                  alt={report.resolution_image_url ? 'Before - Original issue' : 'Report evidence'}
                  style={{
                    width: '100%',
                    maxHeight: 200,
                    objectFit: 'cover',
                    borderRadius: 12,
                    cursor: 'pointer',
                    border: '1px solid rgba(255,255,255,0.08)'
                  }}
                  onClick={() => window.open(report.image_url, '_blank')}
                />
              </div>
            )}

            {report.resolution_image_url && (
              <div style={{ marginBottom: 16 }}>
                <div className="rm-section-label" style={{ marginBottom: 8 }}>
                  <span style={{ 
                    background: 'rgba(34,197,94,0.2)', 
                    color: '#4ADE80', 
                    padding: '2px 6px', 
                    borderRadius: 3, 
                    fontSize: 9, 
                    fontWeight: 600,
                    marginRight: 6
                  }}>
                    AFTER
                  </span>
                  Resolution Evidence
                </div>
                <img
                  src={report.resolution_image_url}
                  alt="After - Resolution evidence"
                  style={{
                    width: '100%',
                    maxHeight: 200,
                    objectFit: 'cover',
                    borderRadius: 12,
                    cursor: 'pointer',
                    border: '1px solid rgba(34,197,94,0.25)'
                  }}
                  onClick={() => window.open(report.resolution_image_url, '_blank')}
                />
              </div>
            )}

            {/* Comments Section */}
            <div className="rm-divider" />
            <div>
              <div className="rm-section-label" style={{ marginBottom: 14 }}>
                Comments {comments.length > 0 && <span style={{ color: 'rgba(255,255,255,0.5)' }}>({comments.length})</span>}
              </div>

              {commentsLoading ? (
                <div className="rm-italic-hint">Loading comments...</div>
              ) : comments.length === 0 ? (
                <div className="rm-italic-hint" style={{ marginBottom: 14 }}>No comments yet.</div>
              ) : (
                <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 16 }}>
                  {comments.map(comment => (
                    <div key={comment.id} className="rm-comment-bubble">
                      <p style={{fontSize:'11px', color:'#888', marginBottom:'4px'}}>
                        {comment.profiles?.email || 'Unknown'}
                      </p>
                      <p className="rm-comment-text">{comment.comment}</p>
                      <p className="rm-comment-date">{comment.created_at && !isNaN(new Date(comment.created_at)) ? new Date(comment.created_at).toLocaleString() : ''}</p>
                    </div>
                  ))}
                </div>
              )}

              {canComment && (
                <div style={{ display: 'flex', gap: 10 }}>
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                    placeholder="Add a comment..."
                    className="rm-comment-input"
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={submitting || !newComment.trim()}
                    className="rm-send-btn"
                  >
                    {submitting ? '...' : 'Send'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="rm-footer">
            {isAdmin && report.status === 'submitted' && onStartWork && (
              <button onClick={() => onStartWork(report.id)} className="rm-action-btn rm-action-blue">Assign to Department</button>
            )}
            {isAdmin && report.status === 'verified' && onResolve && (
              <button onClick={() => onResolve(report.id)} className="rm-action-btn rm-action-green">Resolve</button>
            )}
            {isAdmin && (report.status === 'submitted' || report.status === 'resolved') && onDelete && (
              <button onClick={() => onDelete(report.id)} className="rm-action-btn rm-action-red">Delete</button>
            )}
            {isDepartment && report.status === 'assigned' && onResolve && (
              <button onClick={() => onResolve(report.id)} className="rm-action-btn rm-action-green">Mark Complete</button>
            )}
            <button 
              onClick={() => navigate(`/track/${report.id}`)}
              className="rm-action-btn rm-action-ghost"
            >
              Track Report →
            </button>
          </div>
        </div>
      </div>
    </>
  )
}