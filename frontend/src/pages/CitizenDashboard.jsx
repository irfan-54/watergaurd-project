import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import ReportModal from '../components/ReportModal'

const ReportIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)
const ClockIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)
const ProgressIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
)
const CheckIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

function CitizenDashboard() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedReport, setSelectedReport] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteReportId, setDeleteReportId] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  useEffect(() => {
  fetchReports()

  const channel = supabase
    .channel("reports-live")
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "reports"
      },
      (payload) => {
        fetchReports()
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [location.key])

  const fetchReports = async () => {
    setCurrentPage(1)
    try {
      setLoading(true); setError(null)
      const { data, error } = await supabase
        .from('reports').select('*').eq('user_id', user.id).eq('ai_processed', true).order('created_at', { ascending: false })
      if (error) setError(error.message)
      else setReports(data || [])
    } catch (err) { setError('Failed to fetch reports') }
    finally { setLoading(false) }
  }

  const totalReports = reports.length
  const pendingReports = reports.filter(r => r.status === 'PENDING').length
  const assignedReports = reports.filter(r => r.status === 'IN_PROGRESS').length
  const resolvedReports = reports.filter(r => r.status === 'RESOLVED').length

  const totalPages = Math.ceil(reports.length / ITEMS_PER_PAGE)
  const paginatedReports = reports.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 ring-1 ring-yellow-200 dark:ring-yellow-800'
      case 'IN_PROGRESS': return 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-800'
      case 'RESOLVED': return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 ring-1 ring-emerald-200 dark:ring-emerald-800'
      case 'REJECTED': return 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 ring-1 ring-red-200 dark:ring-red-800'
      default: return 'bg-gray-50 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300 ring-1 ring-gray-200 dark:ring-gray-800'
    }
  }

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'PENDING': return 'Pending'
      case 'ASSIGNED': return 'Assigned'
      case 'IN_PROGRESS': return 'In Progress'
      case 'RESOLVED': return 'Resolved'
      case 'REJECTED': return 'Rejected'
      default: return status
    }
  }

  const getRiskBadgeClass = (riskLevel) => {
    switch (riskLevel) {
      case 'LOW': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'HIGH': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const handleDeleteClick = (id) => { setDeleteReportId(id); setShowDeleteModal(true) }

  const handleDelete = async () => {
    try {
      const { error } = await supabase.from('reports').delete().eq('id', deleteReportId)
      if (error) setError(error.message)
      else setReports(reports.filter(r => r.id !== deleteReportId))
    } catch (err) { setError('Failed to delete report') }
    finally { setShowDeleteModal(false); setDeleteReportId(null) }
  }

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
          <Navbar />
          <div className="w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[1,2,3,4].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 md:p-6 animate-pulse">
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-20 mb-2"></div>
                  <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-16"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-red-600 dark:text-red-400 mb-4">Error: {error}</div>
          <button onClick={fetchReports} className="px-4 py-2 bg-blue-600 text-gray-900 dark:text-white rounded-xl hover:bg-blue-700 transition-colors">Retry</button>
        </div>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:0.3 }}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 space-y-6">

          {/* ── Page header ─────────────────────────────────────────────────── */}
          <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.35 }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
          >
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-900 dark:text-white tracking-tight">Citizen Dashboard</h1>
              <p className="text-sm text-gray-900 dark:text-white mt-1">Track and manage your water issue reports</p>
            </div>
            <button
              onClick={() => navigate('/create-report')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-gray-900 dark:text-white rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow"
            >
              🚨 Report Issue
            </button>
          </motion.div>

          {/* ── Stat cards ───────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 overflow-hidden group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-blue-500 opacity-10 -translate-y-6 translate-x-6" />
              <div className="inline-flex p-2.5 rounded-xl bg-blue-500 bg-opacity-15 mb-3 text-gray-900 dark:text-white">
                <div className="p-2 rounded-xl bg-blue-500 bg-opacity-10">
                  <span className="opacity-80"><ReportIcon /></span>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-900 dark:text-white tracking-tight">{totalReports}</p>
              <p className="text-sm text-gray-900 dark:text-white mt-0.5 font-medium">My Reports</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 overflow-hidden group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-amber-500 opacity-10 -translate-y-6 translate-x-6" />
              <div className="inline-flex p-2.5 rounded-xl bg-amber-500 bg-opacity-15 mb-3 text-gray-900 dark:text-white">
                <div className="p-2 rounded-xl bg-amber-500 bg-opacity-10">
                  <span className="opacity-80"><ClockIcon /></span>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-900 dark:text-white tracking-tight">{pendingReports}</p>
              <p className="text-sm text-gray-900 dark:text-white mt-0.5 font-medium">Pending</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 overflow-hidden group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-blue-500 opacity-10 -translate-y-6 translate-x-6" />
              <div className="inline-flex p-2.5 rounded-xl bg-blue-500 bg-opacity-15 mb-3 text-gray-900 dark:text-white">
                <div className="p-2 rounded-xl bg-blue-500 bg-opacity-10">
                  <span className="opacity-80"><ProgressIcon /></span>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-900 dark:text-white tracking-tight">{assignedReports}</p>
              <p className="text-sm text-gray-900 dark:text-white mt-0.5 font-medium">In Progress</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 overflow-hidden group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-emerald-500 opacity-10 -translate-y-6 translate-x-6" />
              <div className="inline-flex p-2.5 rounded-xl bg-emerald-500 bg-opacity-15 mb-3 text-gray-900 dark:text-white">
                <div className="p-2 rounded-xl bg-emerald-500 bg-opacity-10">
                  <span className="opacity-80"><CheckIcon /></span>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-900 dark:text-white tracking-tight">{resolvedReports}</p>
              <p className="text-sm text-gray-900 dark:text-white mt-0.5 font-medium">Resolved</p>
            </motion.div>
            </div>

            {/* Reports Section */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
              {reports.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">📋</div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-900 dark:text-white mb-2">No reports yet</h3>
                  <p className="text-gray-600 dark:text-gray-700 dark:text-gray-300 mb-6">Start by reporting water issues in your community</p>
                  <button onClick={() => navigate('/create-report')} className="bg-blue-600 hover:bg-blue-700 text-gray-900 dark:text-white px-6 py-3 rounded-xl font-medium shadow-sm hover:shadow transition-colors">
                    Report a Water Issue
                  </button>
                </div>
              ) : (
                <>
                  {/* ── MOBILE: clean 4-row cards ── */}
                  <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
                    {paginatedReports.map((report) => (
                      <div
                        key={report.id}
                        onClick={() => setSelectedReport(report)}
                        className="p-4 cursor-pointer hover:bg-gray-700/20 transition"
                      >
                        {/* Row 1: ID + badges */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-xs text-gray-700 dark:text-gray-300">#{report.id.slice(0, 8)}</span>
                          <div className="flex gap-1.5">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskBadgeClass(report.risk_level || 'LOW')}`}>{report.risk_level || 'LOW'}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(report.status)}`}>{getStatusDisplay(report.status)}</span>
                          </div>
                        </div>
                        {report.status === 'REJECTED' && report.rejection_reason && (
                          <p className="text-xs text-red-500 dark:text-red-400 mt-1">Reason: {report.rejection_reason}</p>
                        )}

                        {/* Row 2: Description — full width */}
                        <p className="text-sm text-gray-900 dark:text-gray-100 mb-2 line-clamp-2 leading-snug">
                          {report.description}
                        </p>

                        {/* Row 3: category · date */}
                        <p className="text-xs text-gray-900 dark:text-white mb-3">
                          <span className={`capitalize font-semibold ${
    report.ai_processed
      ? (report.category === 'contamination'
        ? 'text-red-500 dark:text-red-400'
        : report.category === 'blockage'
        ? 'text-yellow-500 dark:text-yellow-400'
        : report.category === 'leakage'
        ? 'text-blue-500 dark:text-blue-400'
        : 'text-gray-700 dark:text-gray-600 dark:text-gray-700 dark:text-gray-300')
      : "text-yellow-600 animate-pulse"
  }`}>
  {report.ai_processed ? (report.category || "Processing...") : "Processing..."}
</span>
                          <span className="mx-1">·</span>
                          <span>{new Date(report.created_at).toLocaleDateString()}</span>
                        </p>

                        {/* Row 3.5: AI confidence and explanation */}
                        {report.ai_processed && (
                          <div className="text-xs text-gray-900 dark:text-white mb-3 space-y-1">
                            {report.final_confidence && (
                              <p>Confidence: {report.final_confidence > 1 ? `${report.final_confidence.toFixed(2)}%` : `${(report.final_confidence * 100).toFixed(2)}%`}</p>
                            )}
                            {report.ai_explanation && (
                              <p className="italic">{report.ai_explanation}</p>
                            )}
                          </div>
                        )}

                        {/* Row 4: buttons — full width, own row */}
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => navigate(`/track/${report.id}`)}
                            className="px-3 py-1 bg-blue-600 text-gray-900 dark:text-white 
                                       rounded-lg hover:bg-blue-700 mr-2"
                          >
                            Track
                          </button>
                          {report.status === 'PENDING' && (
                            <button
                              onClick={() => navigate(`/edit-report/${report.id}`)}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-gray-900 dark:text-white py-2 rounded-xl text-xs font-medium transition-colors"
                            >
                              Edit
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteClick(report.id)}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-gray-900 dark:text-white py-2 rounded-xl text-xs font-medium transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl mt-2">
                      <div className="text-sm text-gray-600 dark:text-gray-600 dark:text-gray-700 dark:text-gray-300">
                        Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, reports.length)} of {reports.length} reports
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPage(p => p - 1)}
                          disabled={currentPage === 1}
                          className="px-3 py-1 rounded text-sm text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                        >
                          ← Prev
                        </button>
                        <span className="text-sm text-gray-700 dark:text-gray-200 px-2">
                          Page {currentPage} of {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage(p => p + 1)}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1 rounded text-sm text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                        >
                          Next →
                        </button>
                      </div>
                    </div>
                  )}
                  {/* ── DESKTOP: original table unchanged ── */}
                  <div className="hidden md:block overflow-x-auto overflow-y-auto max-h-[420px] border rounded-2xl">
                    <table className="w-full text-sm divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wider">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-600 dark:text-gray-700 dark:text-gray-300 uppercase tracking-wider">ID</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-600 dark:text-gray-700 dark:text-gray-300 uppercase tracking-wider">Description</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-600 dark:text-gray-700 dark:text-gray-300 uppercase tracking-wider">Category</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-600 dark:text-gray-700 dark:text-gray-300 uppercase tracking-wider">Risk</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-600 dark:text-gray-700 dark:text-gray-300 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-600 dark:text-gray-700 dark:text-gray-300 uppercase tracking-wider">Created</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-600 dark:text-gray-700 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {paginatedReports.map((report) => (
                          <tr key={report.id} onClick={() => setSelectedReport(report)} className="cursor-pointer border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <td className="px-5 py-4 text-xs text-gray-900 dark:text-gray-100 whitespace-nowrap font-mono">#{report.id.slice(0, 8)}</td>
                            <td className="px-5 py-4 text-sm text-gray-900 dark:text-gray-100 truncate" title={report.description}>{report.description}</td>
                            <td className="px-5 py-4">
                              <span className={`whitespace-nowrap text-sm font-semibold capitalize ${
                                report.ai_processed
                                  ? (report.category === 'contamination'
                                    ? 'text-red-500 dark:text-red-400'
                                    : report.category === 'blockage'
                                    ? 'text-yellow-500 dark:text-yellow-400'
                                    : report.category === 'leakage'
                                    ? 'text-blue-500 dark:text-blue-400'
                                    : 'text-gray-700 dark:text-gray-600 dark:text-gray-700 dark:text-gray-300')
                                  : "text-yellow-600 dark:text-yellow-400 animate-pulse"
                              }`}>
                                {report.ai_processed ? (report.category || "Processing...") : "Processing..."}
                              </span>
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap"><span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskBadgeClass(report.risk_level || 'LOW')}`}>{report.risk_level || 'LOW'}</span></td>
                            <td className="px-5 py-4 whitespace-nowrap"><span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(report.status)}`}>{getStatusDisplay(report.status)}</span></td>
                            <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{new Date(report.created_at).toLocaleDateString()}</td>
                            <td className="px-5 py-4 text-sm font-medium">
                              <div className="flex flex-wrap gap-2">
                                <button onClick={(e) => { e.stopPropagation(); navigate(`/track/${report.id}`) }} className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 mr-2">Track</button>
                                {report.status === 'PENDING' && (
                                  <button onClick={(e) => { e.stopPropagation(); navigate(`/edit-report/${report.id}`) }} className="bg-emerald-600 hover:bg-emerald-700 text-gray-900 dark:text-white px-2 py-1 rounded text-xs transition-colors">Edit</button>
                                )}
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(report.id) }} className="bg-red-600 hover:bg-red-700 text-gray-900 dark:text-white px-2 py-1 rounded text-xs transition-colors">Delete</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>

        {selectedReport && <ReportModal report={selectedReport} isAdmin={false} onClose={() => setSelectedReport(null)} />}

        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 w-full max-w-md mx-4 shadow-xl">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-center text-gray-900 dark:text-gray-900 dark:text-white mb-2">Delete Report</h3>
              <p className="text-center text-gray-600 dark:text-gray-700 dark:text-gray-300 mb-6">Are you sure you want to delete this report? This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => { setShowDeleteModal(false); setDeleteReportId(null) }} className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-600 dark:text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium">Cancel</button>
                <button onClick={handleDelete} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-gray-900 dark:text-white rounded-xl transition-colors font-medium">Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default CitizenDashboard