import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import ReportModal from '../components/ReportModal'

// Icon components for stats
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
  const navigate = useNavigate()
  const location = useLocation()
  const { user, role } = useAuth()

  useEffect(() => {
    fetchReports()
  }, [location.key]) // Refresh when location key changes (navigation)

  const fetchReports = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        setError(error.message)
      } else {
        setReports(data || [])
      }
    } catch (err) {
      setError('Failed to fetch reports')
    } finally {
      setLoading(false)
    }
  }

  // Calculate statistics
  const totalReports = reports.length
  const openReports = reports.filter(r => r.status === 'OPEN').length
  const inProgressReports = reports.filter(r => r.status === 'IN_PROGRESS').length
  const resolvedReports = reports.filter(r => r.status === 'RESOLVED').length

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'OPEN':
        return 'px-2 py-1 rounded text-xs font-semibold bg-gray-400 text-black'
      case 'IN_PROGRESS':
        return 'px-2 py-1 rounded text-xs font-semibold bg-yellow-400 text-black'
      case 'RESOLVED':
        return 'px-2 py-1 rounded text-xs font-semibold bg-green-500 text-white'
      default:
        return 'px-2 py-1 rounded text-xs font-semibold bg-gray-400 text-black'
    }
  }

  const getRiskBadgeClass = (riskLevel) => {
    switch (riskLevel) {
      case 'LOW':
        return 'px-2 py-1 rounded text-xs font-semibold bg-blue-500 text-white'
      case 'MEDIUM':
        return 'px-2 py-1 rounded text-xs font-semibold bg-yellow-400 text-black'
      case 'HIGH':
        return 'px-2 py-1 rounded text-xs font-semibold bg-red-500 text-white'
      default:
        return 'px-2 py-1 rounded text-xs font-semibold bg-gray-400 text-black'
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  const handleDeleteClick = (id) => {
    setDeleteReportId(id)
    setShowDeleteModal(true)
  }

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', deleteReportId)

      if (error) {
        setError(error.message)
      } else {
        setReports(reports.filter(report => report.id !== deleteReportId))
      }
    } catch (err) {
      setError('Failed to delete report')
    } finally {
      setShowDeleteModal(false)
      setDeleteReportId(null)
    }
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
          <div className="py-8">
            <div className="max-w-6xl mx-auto px-4">
              <div className="mb-8">
                <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-96 mt-2 animate-pulse"></div>
              </div>

              {/* Reports Grid Skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="h-48 bg-gray-300 dark:bg-gray-700 animate-pulse"></div>
                    <div className="p-4">
                      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full animate-pulse mb-2"></div>
                      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 animate-pulse mb-3"></div>
                      <div className="flex justify-between items-center">
                        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
                        <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-200 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-red-600 dark:text-red-400 mb-4">Error: {error}</div>
          <button 
            onClick={fetchReports}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">My Reports</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Track and manage your water issue reports</p>
          </div>

          {/* Summary Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">My Reports</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalReports}</p>
                </div>
                <div className="text-blue-500">
                  <ReportIcon />
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Open Reports</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{openReports}</p>
                </div>
                <div className="text-gray-500">
                  <ClockIcon />
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">In Progress</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{inProgressReports}</p>
                </div>
                <div className="text-yellow-500">
                  <ProgressIcon />
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Resolved</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{resolvedReports}</p>
                </div>
                <div className="text-green-500">
                  <CheckIcon />
                </div>
              </div>
            </div>
          </div>

          {/* Reports Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            {reports.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No reports yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Start by reporting water issues in your community</p>
                <button
                  onClick={() => navigate('/create-report')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Report a Water Issue
                </button>
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
                    {reports.map((report) => (
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
                          <span className={getRiskBadgeClass(report.risk_level || 'LOW')}>
                            {report.risk_level || 'LOW'}
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
                                navigate(`/edit-report/${report.id}`)
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs transition-colors"
                            >
                              Edit
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteClick(report.id)
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs transition-colors"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        
        {/* Report Details Modal */}
        {selectedReport && (
          <ReportModal
            report={selectedReport}
            isAdmin={false}
            onClose={() => setSelectedReport(null)}
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              
              <h3 className="text-lg font-semibold text-center text-gray-900 dark:text-gray-100 mb-2">
                Delete Report
              </h3>
              
              <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to delete this report? This action cannot be undone.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setDeleteReportId(null)
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default CitizenDashboard
