import { useState, useEffect } from 'react'
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

  // Prepare category data for PieChart
  const categoryData = [
    { name: 'Contamination', value: reports.filter(r => r.category === 'contamination').length, color: '#FF6B6B' },
    { name: 'Leakage', value: reports.filter(r => r.category === 'leakage').length, color: '#4ECDC4' },
    { name: 'Blockage', value: reports.filter(r => r.category === 'blockage').length, color: '#45B7D1' },
    { name: 'Other', value: reports.filter(r => r.category === 'other').length, color: '#96CEB4' }
  ].filter(item => item.value > 0)

  // Prepare risk level data for BarChart
  const riskData = [
    { name: 'HIGH', count: reports.filter(r => r.risk_level === 'HIGH').length },
    { name: 'MEDIUM', count: reports.filter(r => r.risk_level === 'MEDIUM').length },
    { name: 'LOW', count: reports.filter(r => r.risk_level === 'LOW').length }
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
    <div className={`bg-white p-6 rounded-lg shadow-md border-l-4 ${color}`}>
      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">{title}</h3>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading analytics...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-red-600 mb-4">Error: {error}</div>
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-2">Water issue reports analytics and insights</p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
            <StatisticsCard title="Total Reports" value={totalReports} color="border-blue-500" />
            <StatisticsCard title="Open Reports" value={openReports} color="border-yellow-500" />
            <StatisticsCard title="In Progress" value={inProgressReports} color="border-blue-500" />
            <StatisticsCard title="Resolved" value={resolvedReports} color="border-green-500" />
            <StatisticsCard title="High Risk" value={highRiskReports} color="border-red-500" />
            <StatisticsCard 
              title="Avg Resolution Time" 
              value={avgResolutionTime ? `${avgResolutionTime} days` : 'N/A'} 
              color="border-purple-500" 
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Category Distribution */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Category Distribution</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Risk Level Chart */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Risk Level Distribution</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={riskData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Status Chart - Full Width */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Report Status Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Resolution Time by Category */}
          {resolutionByCategory.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-md mt-8">
              <h2 className="text-xl font-semibold mb-1">Average Resolution Time by Category</h2>
              <p className="text-sm text-gray-500 mb-4">Based on {resolvedReportsData.length} resolved reports</p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={resolutionByCategory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis label={{ value: 'Days', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value) => [`${value} days`, 'Avg Resolution Time']} />
                  <Legend />
                  <Bar dataKey="avgDays" name="Avg Days to Resolve" fill="#8b5cf6" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
export default Analytics
