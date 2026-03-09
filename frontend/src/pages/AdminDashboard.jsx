import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'
import ReportModal from '../components/ReportModal'

// Icon components for stats
const ReportIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

const AlertIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
)

const CheckIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const RiskIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

function AdminDashboard() {
  const [reports, setReports] = useState([])
  const [filteredReports, setFilteredReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [startingWorkIds, setStartingWorkIds] = useState(new Set())
  const [deleteConfirmation, setDeleteConfirmation] = useState(null)
  const [selectedReport, setSelectedReport] = useState(null)
  const [filters, setFilters] = useState({
    risk: '',
    category: '',
    status: ''
  })
  const navigate = useNavigate()

  useEffect(() => {
    fetchReports()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [reports, filters])

  const fetchReports = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('http://127.0.0.1:8000/reports')
      const data = await response.json()

      if (data.status === 'success') {
        setReports(data.data || [])
      } else {
        setError(data.message || 'Failed to fetch reports')
      }
    } catch (err) {
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = reports

    if (filters.risk) {
      filtered = filtered.filter(report => report.risk_level === filters.risk)
    }
    if (filters.category) {
      filtered = filtered.filter(report => report.category === filters.category)
    }
    if (filters.status) {
      filtered = filtered.filter(report => report.status === filters.status)
    }

    setFilteredReports(filtered)
  }

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }))
  }

  const handleResolve = async (reportId) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/reports/${reportId}/resolve`, {
        method: 'PUT'
      })

      const data = await response.json()

      if (response.ok) {
        // Update local state and refresh from server
        setReports(prev => prev.map(report =>
          report.id === reportId
            ? { ...report, status: 'RESOLVED' }
            : report
        ))
        // Refresh the report list to get latest data
        fetchReports()
      } else {
        setError(data.message || 'Failed to resolve report')
      }
    } catch (err) {
      setError('Failed to connect to server')
    }
  }

  const handleStartWork = async (reportId) => {
    if (startingWorkIds.has(reportId)) return

    try {
      setStartingWorkIds(prev => new Set([...prev, reportId]))
      console.log('Starting work on report:', reportId)

      const response = await fetch(`http://127.0.0.1:8000/reports/${reportId}/start`, {
        method: 'PUT'
      })

      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Response data:', data)

      if (response.ok) {
        // Update local state
        setReports(prev => prev.map(report =>
          report.id === reportId
            ? { ...report, status: 'IN_PROGRESS' }
            : report
        ))
        // Refresh the report list to get latest data
        fetchReports()
      } else {
        setError(data.message || 'Failed to start work on report')
      }
    } catch (err) {
      console.log('Error:', err)
      setError('Failed to connect to server')
    } finally {
      setStartingWorkIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(reportId)
        return newSet
      })
    }
  }

  const handleDelete = (reportId) => {
    setDeleteConfirmation(reportId)
  }

  const confirmDelete = async () => {
    const reportId = deleteConfirmation
    setDeleteConfirmation(null)

    try {
      const response = await fetch(`http://127.0.0.1:8000/reports/${reportId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        // Remove from local state
        setReports(prev => prev.filter(report => report.id !== reportId))
      } else {
        setError(data.message || 'Failed to delete report')
      }
    } catch (err) {
      setError('Failed to connect to server')
    }
  }

  const cancelDelete = () => {
    setDeleteConfirmation(null)
  }

  const getRiskBadgeClass = (riskLevel) => {
    switch (riskLevel) {
      case 'HIGH':
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 px-2 py-1 rounded-full text-xs font-semibold'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 px-2 py-1 rounded-full text-xs font-semibold'
      case 'LOW':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-2 py-1 rounded-full text-xs font-semibold'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full text-xs font-semibold'
    }
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'OPEN':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 px-2 py-1 rounded-full text-xs font-semibold'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-2 py-1 rounded-full text-xs font-semibold'
      case 'RESOLVED':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-2 py-1 rounded-full text-xs font-semibold'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full text-xs font-semibold'
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.25 }}
      >
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-200 dark:from-gray-900 dark:to-gray-800">
          <Navbar />
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="mb-8">
              <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-96 mt-2 animate-pulse"></div>
            </div>
            
            {/* Statistics Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
                      <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-16 mt-2 animate-pulse"></div>
                    </div>
                    <div className="h-12 w-12 bg-gray-300 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Filters Skeleton */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-8">
              <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-32 animate-pulse mb-4"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 bg-gray-300 dark:bg-gray-700 rounded animate-pulse"></div>
                ))}
              </div>
            </div>

            {/* Table Skeleton */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="overflow-x-auto overflow-y-auto max-h-[420px] border rounded-xl">
                <table className="w-full text-sm">
                  <thead className="bg-gray-800">
                    <tr>
                      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                        <th key={i} className="px-4 py-3">
                          <div className="h-4 bg-gray-700 rounded animate-pulse"></div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4, 5].map((row) => (
                      <tr key={row} className="border-t border-gray-200 dark:border-gray-700">
                        {[1, 2, 3, 4, 5, 6, 7].map((col) => (
                          <td key={col} className="px-4 py-4">
                            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded animate-pulse"></div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  // Get unique values for filters
  const uniqueRisks = [...new Set(reports.map(r => r.risk_level))].filter(Boolean)
  const uniqueCategories = [...new Set(reports.map(r => r.category))].filter(Boolean)
  const uniqueStatuses = [...new Set(reports.map(r => r.status))].filter(Boolean)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
    >
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-200 dark:from-gray-900 dark:to-gray-800">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Admin Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Manage and resolve water issue reports</p>
          </div>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6 flex justify-between items-center">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-bold">✕</button>
            </div>
          )}

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6 hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Reports</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{reports.length}</p>
                </div>
                <div className="text-blue-500 dark:text-blue-400">
                  <ReportIcon />
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6 hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Open Reports</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{reports.filter(r => r.status === 'OPEN').length}</p>
                </div>
                <div className="text-yellow-500 dark:text-yellow-400">
                  <AlertIcon />
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6 hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">In Progress</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{reports.filter(r => r.status === 'IN_PROGRESS').length}</p>
                </div>
                <div className="text-blue-500 dark:text-blue-400">
                  <AlertIcon />
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6 hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Resolved</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{reports.filter(r => r.status === 'RESOLVED').length}</p>
                </div>
                <div className="text-green-500 dark:text-green-400">
                  <CheckIcon />
                </div>
              </div>
            </div>
          </div>

          {/* Delete Confirmation Modal */}
          {deleteConfirmation && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Delete Report</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Are you sure you want to delete this report? This action cannot be undone.</p>
                <div className="flex space-x-3 justify-end">
                  <button
                    onClick={cancelDelete}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Filters Section */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Risk Level</label>
                <select
                  value={filters.risk}
                  onChange={(e) => handleFilterChange('risk', e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Risks</option>
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  <option value="leakage">leakage</option>
                  <option value="contamination">contamination</option>
                  <option value="blockage">blockage</option>
                  <option value="other">other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="OPEN">OPEN</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="RESOLVED">RESOLVED</option>
                </select>
              </div>
            </div>
          </div>
          {/* Reports Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            {filteredReports.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-xl text-gray-600 dark:text-gray-400 mb-4">No reports found</div>
                <p className="text-gray-500 dark:text-gray-500">Try adjusting your filters or check back later.</p>
              </div>
            ) : (
              <div className="overflow-x-auto overflow-y-auto max-h-[420px] border rounded-xl">
                <table className="w-full text-sm divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="sticky top-0 z-10 bg-gray-800 text-gray-300 text-sm uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Risk</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Created</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredReports.map((report) => (
                      <tr
                        key={report.id}
                        onClick={() => setSelectedReport(report)}
                        className="cursor-pointer hover:bg-gray-700/40 transition"
                      >
                        <td className="px-4 py-4 text-xs text-gray-900 dark:text-gray-100 whitespace-nowrap font-mono">#{report.id.slice(0,8)}</td>
                        <td className="px-4 py-4 text-sm text-gray-900 dark:text-gray-100 truncate" title={report.description}>
                          {report.description}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 capitalize">{report.category || 'other'}</td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={getRiskBadgeClass(report.risk_level)}>
                            {report.risk_level}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={getStatusBadgeClass(report.status)}>
                            {report.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {new Date(report.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium space-x-1">
                          {report.status === 'OPEN' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleStartWork(report.id)
                              }}
                              disabled={startingWorkIds.has(report.id)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                              {startingWorkIds.has(report.id) ? 'Starting...' : 'Start'}
                            </button>
                          )}
                          {report.status === 'IN_PROGRESS' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleResolve(report.id)
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs transition-colors"
                            >
                              Resolve
                            </button>
                          )}
                          {(report.status === 'OPEN' || report.status === 'RESOLVED') && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDelete(report.id)
                              }}
                              className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs transition-colors"
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Report Modal */}
      {selectedReport && (
        <ReportModal
          report={selectedReport}
          isAdmin={true}
          onClose={() => setSelectedReport(null)}
        />
      )}
    </motion.div>
  )
}

export default AdminDashboard
