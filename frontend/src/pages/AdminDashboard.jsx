import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'

function AdminDashboard() {
  const [reports, setReports] = useState([])
  const [filteredReports, setFilteredReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [startingWorkIds, setStartingWorkIds] = useState(new Set())
  const [deleteConfirmation, setDeleteConfirmation] = useState(null)
  const [filters, setFilters] = useState({
    risk: '',
    category: '',
    status: ''
  })
  const navigate = useNavigate()

  // CSS styles for table scrolling
  const tableStyles = `
    .table-container {
      width: 100%;
      overflow-x: auto;
      overflow-y: auto;
      max-height: 600px;
    }
    .reports-table {
      min-width: 1200px;
    }
    .sticky-header th {
      position: sticky;
      top: 0;
      background: white;
      z-index: 10;
    }
    .reports-table td:first-child,
    .reports-table th:first-child {
      position: sticky;
      left: 0;
      background: white;
      z-index: 5;
    }
    .reports-table tbody tr:hover {
      background-color: #f8fafc;
      transition: background 0.15s ease;
    }
  `

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
        return 'bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-medium'
      case 'MEDIUM':
        return 'bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-medium'
      case 'LOW':
        return 'bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium'
      default:
        return 'bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs font-medium'
    }
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'OPEN':
        return 'bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium'
      case 'RESOLVED':
        return 'bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium'
      default:
        return 'bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs font-medium'
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading reports...</div>
      </div>
    )
  }

  // Get unique values for filters
  const uniqueRisks = [...new Set(reports.map(r => r.risk_level))].filter(Boolean)
  const uniqueCategories = [...new Set(reports.map(r => r.category))].filter(Boolean)
  const uniqueStatuses = [...new Set(reports.map(r => r.status))].filter(Boolean)

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: tableStyles }} />
      <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage and resolve water issue reports</p>
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex justify-between items-center">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 font-bold">✕</button>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {deleteConfirmation && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Report</h3>
                <p className="text-gray-600 mb-6">Are you sure you want to delete this report? This action cannot be undone.</p>
                <div className="flex space-x-3 justify-end">
                  <button
                    onClick={cancelDelete}
                    className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
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

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Risk Level</label>
                <select
                  value={filters.risk}
                  onChange={(e) => handleFilterChange('risk', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Risks</option>
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  <option value="leakage">leakage</option>
                  <option value="contamination">contamination</option>
                  <option value="blockage">blockage</option>
                  <option value="other">other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="OPEN">OPEN</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="RESOLVED">RESOLVED</option>
                </select>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {filteredReports.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-xl text-gray-600 mb-4">No reports found</div>
                <p className="text-gray-500">Try adjusting your filters or check back later.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="reports-table min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky-header">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50 z-10">Report ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50 z-10">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50 z-10">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50 z-10">Risk Level</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50 z-10">AI Confidence</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50 z-10">Location</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50 z-10">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50 z-10">Created At</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50 z-10">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredReports.map((report) => (
                      <tr key={report.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.id}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate" title={report.description}>
                          {report.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{report.category || 'other'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={getRiskBadgeClass(report.risk_level)}>
                            {report.risk_level}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {report.confidence ? `${Math.round(report.confidence * 100)}%` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          📍 {report.latitude?.toFixed(4)}, {report.longitude?.toFixed(4)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={getStatusBadgeClass(report.status)}>
                            {report.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(report.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          {report.status === 'OPEN' && (
                            <button
                              onClick={() => handleStartWork(report.id)}
                              disabled={startingWorkIds.has(report.id)}
                              className="text-blue-600 hover:text-blue-900 px-3 py-1 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                              {startingWorkIds.has(report.id) ? 'Starting...' : 'Start Work'}
                            </button>
                          )}
                          {report.status === 'IN_PROGRESS' && (
                            <button
                              onClick={() => handleResolve(report.id)}
                              className="text-green-600 hover:text-green-900 px-3 py-1 bg-green-50 rounded-md hover:bg-green-100 transition-colors"
                            >
                              Resolve
                            </button>
                          )}
                          {(report.status === 'OPEN' || report.status === 'RESOLVED') && (
                            <button
                              onClick={() => handleDelete(report.id)}
                              className="text-red-600 hover:text-red-900 px-3 py-1 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
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
    </div>
    </>
  )
}

export default AdminDashboard
