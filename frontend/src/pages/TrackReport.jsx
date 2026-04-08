import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import ReportStepper from '../components/ReportStepper'

export default function TrackReport() {
  const { reportId } = useParams()
  const navigate = useNavigate()
  const [report, setReport] = useState(null)
  const [logs, setLogs] = useState([])
  const [comments, setComments] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState(false)
  const [newComment, setNewComment] = useState('')

  useEffect(() => {
    fetchAll()
  }, [reportId])

  async function fetchAll() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUser(user)

    const { data: report } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single()
    setReport(report)

    const { data: logs } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('report_id', reportId)
      .order('created_at', { ascending: true })
    setLogs(logs || [])

    const { data: comments } = await supabase
      .from('comments')
      .select('*')
      .eq('report_id', reportId)
      .order('created_at', { ascending: true })
    setComments(comments || [])

    setLoading(false)
  }

  async function submitComment() {
    if (!newComment.trim()) return
    await supabase.from('comments').insert({
      report_id: reportId,
      content: newComment,
      user_id: currentUser.id
    })
    setNewComment('')
    fetchAll()
  }

  function formatDate(ts) {
    return new Date(ts).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
  }

  function formatDateTime(ts) {
    return new Date(ts).toLocaleString('en-IN', {
      day: 'numeric', month: 'short',
      hour: '2-digit', minute: '2-digit'
    })
  }

  function getStatusMessage(report) {
    const dept = report.department_name || 'Department assignment pending'
    const reason = report.rejection_reason || 'No reason provided'
    const map = {
      submitted: 'Your report has been received. We are reviewing it.',
      verified: 'Your report has been verified by our system.',
      assigned: `Your report has been assigned to ${dept}.`,
      in_progress: `${dept} is actively working on this issue.`,
      resolved: 'This issue has been resolved. Thank you for reporting.',
      rejected: `Your report was not accepted. Reason: ${reason}`
    }
    return map[report.status] || 'Status unknown.'
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-900 dark:text-white">Loading report...</p>
    </div>
  )

  if (!report) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-900 dark:text-white">Report not found or you don't have access.</p>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 
                  min-h-screen bg-gray-50 dark:bg-gray-900">

      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-gray-600 
                   dark:text-gray-400 hover:text-gray-900 
                   dark:hover:text-white mb-4"
      >
        ← Back
      </button>

      {/* SECTION 1: HEADER */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-900 dark:text-white dark:text-gray-700 dark:text-gray-300 mb-1">
          #WG-{report.id.slice(0, 6).toUpperCase()}
        </p>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white capitalize mb-2">
          {report.category}
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-600 dark:text-gray-400">{report.location}</p>
        <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">{formatDate(report.created_at)}</p>
      </div>

      {/* SECTION 2: STEPPER */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
        <ReportStepper currentStatus={report.status} />
      </div>

      {/* SECTION 3: STATUS CARD */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
        <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          {getStatusMessage(report)}
        </p>
        {report.department_name && (
          <p className="text-xs text-gray-900 dark:text-white dark:text-gray-700 dark:text-gray-300">
            Department: {report.department_name}
          </p>
        )}
        {report.estimated_resolution && (
          <p className="text-xs text-gray-900 dark:text-white dark:text-gray-700 dark:text-gray-300 mt-1">
            ETA: {report.estimated_resolution}
          </p>
        )}
      </div>

      {/* SECTION 4: TIMELINE */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
          Activity Timeline
        </h2>
        {logs.length === 0 ? (
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Updates will appear here as your report progresses.
          </p>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                  <div className="w-px flex-1 bg-gray-200 dark:bg-gray-700 mt-1" />
                </div>
                <div className="pb-4">
                  <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                    {log.event_type}
                  </p>
                  {log.message && (
                    <p className="text-xs text-gray-900 dark:text-white dark:text-gray-700 dark:text-gray-300">{log.message}</p>
                  )}
                  <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5">{formatDateTime(log.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 5: IMAGE */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Image Evidence
        </h2>
        {report.image_url ? (
          <>
            <img
              src={report.image_url}
              alt="Report evidence"
              className="w-full max-h-64 object-cover rounded-lg cursor-pointer"
              onClick={() => setLightbox(true)}
            />
            {lightbox && (
              <div
                className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
                onClick={() => setLightbox(false)}
              >
                <img
                  src={report.image_url}
                  alt="Full size"
                  className="max-w-full max-h-full rounded-lg"
                />
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-700 dark:text-gray-300">No image attached to this report.</p>
        )}
      </div>

      {/* SECTION 6: COMMENTS */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
          Comments
        </h2>
        {comments.length === 0 ? (
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">No comments yet.</p>
        ) : (
          <div className="space-y-3 mb-4">
            {comments.map((c) => (
              <div key={c.id} className="border-b border-gray-100 dark:border-gray-700 pb-3">
                <p className="text-xs text-gray-900 dark:text-white dark:text-gray-700 dark:text-gray-300 mb-1">
                  {formatDateTime(c.created_at)}
                </p>
                <p className="text-sm text-gray-900 dark:text-white">{c.content}</p>
              </div>
            ))}
          </div>
        )}
        {currentUser && report.user_id === currentUser.id && (
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 text-sm border border-gray-200 dark:border-gray-600 
                         rounded-lg px-3 py-2 bg-transparent 
                         text-gray-900 dark:text-white
                         focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={submitComment}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              Send
            </button>
          </div>
        )}
      </div>

    </div>
  )
}