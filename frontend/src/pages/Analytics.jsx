import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

function Analytics() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchReports()
  }, [])

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

  // Calculate statistics
  const totalReports = reports.length
  const openReports = reports.filter(r => r.status === 'OPEN').length
  const inProgressReports = reports.filter(r => r.status === 'IN_PROGRESS').length
  const resolvedReports = reports.filter(r => r.status === 'RESOLVED').length
  const highRiskReports = reports.filter(r => r.risk_level === 'HIGH').length

  // Prepare category data for PieChart with dark mode colors
  const categoryData = [
    { name: 'Leakage', value: reports.filter(r => r.category === 'leakage').length, color: '#38bdf8' },
    { name: 'Contamination', value: reports.filter(r => r.category === 'contamination').length, color: '#ef4444' },
    { name: 'Blockage', value: reports.filter(r => r.category === 'blockage').length, color: '#f59e0b' },
    { name: 'Other', value: reports.filter(r => r.category === 'other').length, color: '#10b981' }
  ].filter(item => item.value > 0)

  // Prepare risk level data for BarChart with dark mode colors
  const riskData = [
    { name: 'HIGH', count: reports.filter(r => r.risk_level === 'HIGH').length, color: '#ef4444' },
    { name: 'MEDIUM', count: reports.filter(r => r.risk_level === 'MEDIUM').length, color: '#f59e0b' },
    { name: 'LOW', count: reports.filter(r => r.risk_level === 'LOW').length, color: '#22c55e' }
  ]

  // Prepare status data for BarChart
  const statusData = [
    { name: 'OPEN', count: reports.filter(r => r.status === 'OPEN').length },
    { name: 'IN_PROGRESS', count: reports.filter(r => r.status === 'IN_PROGRESS').length },
    { name: 'RESOLVED', count: reports.filter(r => r.status === 'RESOLVED').length }
  ]

  // Resolution time analytics
  const resolvedReportsData = reports.filter(r => r.status === 'RESOLVED' && r.updated_at && r.created_at)

  const getResolutionDays = (report) => {
    const created = new Date(report.created_at)
    const updated = new Date(report.updated_at)
    return (updated - created) / (1000 * 60 * 60 * 24) // convert ms to days
  }

  const avgResolutionTime = resolvedReportsData.length > 0
    ? (resolvedReportsData.reduce((sum, r) => sum + getResolutionDays(r), 0) / resolvedReportsData.length).toFixed(1)
    : null

  const resolutionByCategory = ['contamination', 'leakage', 'blockage', 'other'].map(cat => {
    const catResolved = resolvedReportsData.filter(r => r.category === cat)
    const avg = catResolved.length > 0
      ? (catResolved.reduce((sum, r) => sum + getResolutionDays(r), 0) / catResolved.length).toFixed(1)
      : 0
    return { name: cat.charAt(0).toUpperCase() + cat.slice(1), avgDays: parseFloat(avg), count: catResolved.length }
  }).filter(item => item.count > 0)

  const StatisticsCard = ({ title, value, color }) => (
    <div className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border-l-4 ${color}`}>
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{title}</h3>
      <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  )

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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-gray-800 rounded-xl shadow-md p-6">
                  <div className="h-4 bg-gray-700 rounded w-20 animate-pulse"></div>
                  <div className="h-8 bg-gray-700 rounded w-16 mt-2 animate-pulse"></div>
                </div>
              ))}
            </div>

            {/* Charts Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-800 rounded-xl shadow-md p-6">
                <div className="h-6 bg-gray-700 rounded w-32 animate-pulse mb-4"></div>
                <div className="h-64 bg-gray-700 rounded animate-pulse"></div>
              </div>
              <div className="bg-gray-800 rounded-xl shadow-md p-6">
                <div className="h-6 bg-gray-700 rounded w-32 animate-pulse mb-4"></div>
                <div className="h-64 bg-gray-700 rounded animate-pulse"></div>
              </div>
            </div>

            {/* Status Chart Skeleton */}
            <div className="bg-gray-800 rounded-xl shadow-md p-6">
              <div className="h-6 bg-gray-700 rounded w-32 animate-pulse mb-4"></div>
              <div className="h-80 bg-gray-700 rounded animate-pulse"></div>
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Analytics Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Water issue reports analytics and insights</p>
          </div>

          {/* Statistics Cards - Top Row */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <StatisticsCard title="Total Reports" value={totalReports} color="border-blue-500" />
            <StatisticsCard title="Open Reports" value={openReports} color="border-yellow-500" />
            <StatisticsCard title="In Progress" value={inProgressReports} color="border-blue-500" />
            <StatisticsCard title="Resolved" value={resolvedReports} color="border-green-500" />
            <StatisticsCard title="High Risk" value={highRiskReports} color="border-red-500" />
            <StatisticsCard 
              title="Avg Resolution" 
              value={avgResolutionTime ? `${avgResolutionTime} days` : 'N/A'} 
              color="border-purple-500" 
            />
          </div>

          {/* Charts Section - First Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Category Distribution */}
            <div className="bg-gray-800 rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-200 mb-5">Category Distribution</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: '#e5e7eb' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Risk Level Distribution */}
            <div className="bg-gray-800 rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-200 mb-5">Risk Level Distribution</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={riskData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: '#e5e7eb' }}
                  />
                  <Bar dataKey="count" fill="#8884d8" barSize={60} animationDuration={800}>
                    {riskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Report Status Distribution - Full Width */}
          <div className="bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-200 mb-5">Report Status Distribution</h2>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={statusData} margin={{ top: 20, right: 40, left: 20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: '#e5e7eb' }}
                />
                <Bar dataKey="count" fill="#3b82f6" barSize={70} radius={[8, 8, 0, 0]} animationDuration={800} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Resolution Time by Category - Optional */}
          {resolutionByCategory.length > 0 && (
            <div className="bg-gray-800 rounded-xl shadow-md p-6 mt-6">
              <h2 className="text-xl font-semibold text-gray-200 mb-5">Average Resolution Time by Category</h2>
              <p className="text-sm text-gray-400 mb-4">Based on {resolvedReportsData.length} resolved reports</p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={resolutionByCategory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9ca3af" />
                  <YAxis 
                    label={{ value: 'Days', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af' } }} 
                    stroke="#9ca3af" 
                  />
                  <Tooltip 
                    formatter={(value) => [`${value} days`, 'Avg Resolution Time']}
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: '#e5e7eb' }}
                  />
                  <Legend wrapperStyle={{ color: '#e5e7eb' }} />
                  <Bar dataKey="avgDays" name="Avg Days to Resolve" fill="#8b5cf6" radius={[4,4,0,0]} animationDuration={800} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default Analytics
