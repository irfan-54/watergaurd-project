import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../config/api'
import Navbar from '../components/Navbar'
import ReportModal from '../components/ReportModal'
import toast from 'react-hot-toast'

function DepartmentDashboard() {
  const { department } = useAuth()
  const [reports, setReports] = useState([])
  const [filteredReports, setFilteredReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState({})
  const [filters, setFilters] = useState({ risk: '', status: '' })
  const [selectedReport, setSelectedReport] = useState(null)
  const [pagination, setPagination] = useState({
    page: 1, limit: 20, total_count: 0, total_pages: 0, has_next: false, has_prev: false
  })

  useEffect(() => { fetchReports(1, filters) }, [])
  useEffect(() => { fetchReports(1, filters) }, [filters])

  const fetchReports = async (page = 1, currentFilters = filters) => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams({ page, limit: 20, ai_processed: true })
      if (currentFilters.status) params.append('status', currentFilters.status)
      if (currentFilters.risk) params.append('risk_level', currentFilters.risk)
      const data = await apiFetch(`/department/reports?${params.toString()}`)
      if (data.status === 'success') {
        setReports(data.data || [])
        setFilteredReports(data.data || [])
        setPagination(data.pagination || {})
      } else {
        setError(data.message || 'Failed to fetch reports')
      }
    } catch (err) {
      toast.error('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (newPage) => fetchReports(newPage, filters)
  const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }))

  const handleAction = async (reportId, action) => {
    setActionLoading(prev => ({ ...prev, [reportId]: action }))
    try {
      await apiFetch(`/reports/${reportId}/${action}`, { method: 'PUT' })
      await fetchReports()
      if (action === 'resolve') toast.success('Marked as complete. Awaiting admin review.')
    } catch (err) {
      toast.error(`Failed to update report`)
    } finally {
      setActionLoading(prev => ({ ...prev, [reportId]: null }))
    }
  }

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'PENDING': return 'Pending'
      case 'IN_PROGRESS': return 'In Progress'
      case 'ASSIGNED': return 'Assigned'
      case 'RESOLVED': return 'Resolved'
      case 'REJECTED': return 'Rejected'
      default: return status
    }
  }

  const getRiskBadgeClass = (riskLevel) => {
    switch (riskLevel) {
      case 'HIGH': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 px-2 py-1 rounded-full text-xs font-medium'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 px-2 py-1 rounded-full text-xs font-medium'
      case 'LOW': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded-full text-xs font-medium'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 px-2 py-1 rounded-full text-xs font-medium'
    }
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 ring-1 ring-yellow-200 dark:ring-yellow-800 px-2 py-1 rounded-full text-xs font-medium'
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-800 px-2 py-1 rounded-full text-xs font-medium'
      case 'ASSIGNED': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 ring-1 ring-indigo-200 dark:ring-indigo-800 px-2 py-1 rounded-full text-xs font-medium'
      case 'AWAITING_REVIEW': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 ring-1 ring-purple-200 dark:ring-purple-800 px-2 py-1 rounded-full text-xs font-medium'
      case 'RESOLVED': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 ring-1 ring-emerald-200 dark:ring-emerald-800 px-2 py-1 rounded-full text-xs font-medium'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-600 dark:text-gray-400 ring-1 ring-gray-200 dark:ring-gray-800 px-2 py-1 rounded-full text-xs font-medium'
    }
  }

  const deptLabel = department
    ? department.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : 'Department'

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded-2xl w-64"></div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
              {[1,2,3].map(i => (
                <div key={i} className="h-24 bg-gray-300 dark:bg-gray-700 rounded-2xl"></div>
              ))}
            </div>
          </div>
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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{deptLabel} Dashboard</h1>
              <p className="text-sm text-gray-900 dark:text-white mt-1">Manage and resolve reports assigned to your department</p>
            </div>
          </motion.div>

            {error && (
              <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}
                className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-2xl flex justify-between items-center text-sm"
              >
                <span>{error}</span>
                <button onClick={() => setError(null)} className="font-bold opacity-60 hover:opacity-100">✕</button>
              </motion.div>
            )}

          {/* ── Stat cards ───────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'Total Assigned', value: pagination.total_count || reports.length, color: 'text-blue-600 dark:text-blue-400' },
              { label: 'In Progress', value: reports.filter(r => r.status === 'IN_PROGRESS').length, color: 'text-blue-600 dark:text-blue-400' },
              { label: 'Resolved', value: reports.filter(r => r.status === 'RESOLVED').length, color: 'text-emerald-600 dark:text-emerald-400' },
            ].map((card, index) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 overflow-hidden group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className={`absolute top-0 right-0 w-24 h-24 rounded-full ${card.color.includes('blue') ? 'bg-blue-500' : card.color.includes('emerald') ? 'bg-emerald-500' : 'bg-gray-500'} opacity-10 -translate-y-6 translate-x-6`} />
                <div className="inline-flex p-2.5 rounded-xl bg-opacity-15 mb-3 text-white"
                     style={{ background: 'none' }}>
                  <div className={`p-2 rounded-xl bg-opacity-10`}>
                    <span className="opacity-80">{card.label.includes('Total') ? '📋' : card.label.includes('In Progress') ? '⚡' : '✓'}</span>
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{card.value}</p>
                <p className="text-sm text-gray-900 dark:text-white mt-0.5 font-medium">{card.label}</p>
              </motion.div>
            ))}
          </div>

          {/* ── Filters ─────────────────────────────────────────────────────── */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-600 dark:text-gray-400 mb-2">Risk Level</label>
                <select value={filters.risk} onChange={(e) => handleFilterChange('risk', e.target.value)} className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all">
                  <option value="">All Risks</option>
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-600 dark:text-gray-400 mb-2">Status</label>
                <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)} className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all">
                  <option value="">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          {/* ── Reports Table ─────────────────────────────────────────────── */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
            {filteredReports.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No reports found</h3>
                <p className="text-gray-600 dark:text-gray-400">Try adjusting your filters or check back later.</p>
              </div>
              ) : (
                <>
                  {/* Mobile */}
                  <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredReports.map((report) => (
                      <div key={report.id} className="p-4 space-y-2" onClick={() => setSelectedReport(report)}>
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs text-gray-400">#{report.id.slice(0, 8)}</span>
                          <div className="flex gap-1.5">
                            <span className={getRiskBadgeClass(report.risk_level)}>{report.risk_level}</span>
                            <span className={getStatusBadgeClass(report.status)}>{getStatusDisplay(report.status)}</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-900 dark:text-gray-100 line-clamp-2">{report.description}</p>
                        <p className="text-xs text-gray-500 capitalize">{report.category || 'other'} · {new Date(report.created_at).toLocaleDateString()}</p>
                        <div className="flex gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                          {report.status === 'IN_PROGRESS' && (
                            <button onClick={() => handleAction(report.id, 'resolve')} disabled={!!actionLoading[report.id]} className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-2 rounded-xl text-xs font-medium transition-colors">
                              {actionLoading[report.id] === 'resolve' ? 'Updating...' : 'Mark Complete'}
                            </button>
                          )}
                          {report.status === 'RESOLVED' && (
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">✓ Resolved</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop */}
                  <div className="hidden md:block overflow-x-auto overflow-y-auto max-h-[500px] border rounded-2xl">
                    <table className="w-full table-fixed text-sm divide-y divide-gray-200 dark:divide-gray-700">
                      <colgroup>
                        <col className="w-24" /><col className="w-64" /><col className="w-28" />
                        <col className="w-20" /><col className="w-32" /><col className="w-32" /><col className="w-32" />
                      </colgroup>
                      <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-600 dark:text-gray-400 uppercase tracking-wider">ID</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-600 dark:text-gray-400 uppercase tracking-wider">Description</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-600 dark:text-gray-400 uppercase tracking-wider">Category</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-600 dark:text-gray-400 uppercase tracking-wider">Risk</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-600 dark:text-gray-400 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-600 dark:text-gray-400 uppercase tracking-wider">Created</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-600 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredReports.map((report) => (
                          <tr key={report.id} onClick={() => setSelectedReport(report)} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                            <td className="px-4 py-4 text-xs text-gray-500 font-mono">#{report.id.slice(0, 8)}</td>
                            <td className="px-4 py-4 text-sm text-gray-900 dark:text-gray-100">
                              <div className="truncate max-w-[240px]" title={report.description}>{report.description || <span className="italic text-gray-400">No description</span>}</div>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900 dark:text-gray-100 capitalize">{report.category || 'other'}</td>
                            <td className="px-4 py-4"><span className={getRiskBadgeClass(report.risk_level)}>{report.risk_level}</span></td>
                            <td className="px-4 py-4"><span className={getStatusBadgeClass(report.status)}>{getStatusDisplay(report.status)}</span></td>
                            <td className="px-4 py-4 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap">{new Date(report.created_at).toLocaleDateString()}</td>
                            <td className="px-4 py-4">
                              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                {report.status === 'IN_PROGRESS' && (
                                  <button onClick={() => handleAction(report.id, 'resolve')} disabled={!!actionLoading[report.id]} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-2 py-1 rounded text-xs transition-colors">
                                    {actionLoading[report.id] === 'resolve' ? 'Updating...' : 'Mark Complete'}
                                  </button>
                                )}
                                {report.status === 'RESOLVED' && (
                                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">✓ Done</span>
                                )}
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

          {/* Pagination */}
          {pagination.total_pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl mt-2">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total_count)} of {pagination.total_count} reports
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handlePageChange(pagination.page - 1)} disabled={!pagination.has_prev} className="px-3 py-1 rounded-xl text-sm text-gray-700 dark:text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                  ← Prev
                </button>
                <span className="text-sm text-gray-700 dark:text-gray-600 dark:text-gray-400 px-2">
                  Page {pagination.page} of {pagination.total_pages}
                </span>
                <button onClick={() => handlePageChange(pagination.page + 1)} disabled={!pagination.has_next} className="px-3 py-1 rounded-xl text-sm text-gray-700 dark:text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                  Next →
                </button>
              </div>
            </div>
          )}

        </div> {/* close max-w-7xl */}
      </div> {/* close min-h-screen */}

      {selectedReport && (
        <ReportModal
          report={selectedReport}
          isAdmin={false}
          isDepartment={true}
          onClose={() => setSelectedReport(null)}
          onResolve={(id) => { handleAction(id, 'resolve'); setSelectedReport(null) }}
        />
      )}
    </motion.div>
  )
}

export default DepartmentDashboard
