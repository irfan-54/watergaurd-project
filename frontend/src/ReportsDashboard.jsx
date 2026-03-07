import { useState, useEffect } from 'react'

function ReportsDashboard() {
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
        setReports(data.data)
      } else {
        setError(data.message || 'Failed to fetch reports')
      }
    } catch (err) {
      setError('Network error: Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'HIGH':
        return 'bg-red-100 text-red-700'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-700'
      case 'LOW':
        return 'bg-green-100 text-green-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-center">
        <p className="font-medium">Error loading reports</p>
        <p className="text-sm mt-1">{error}</p>
        <button 
          onClick={fetchReports}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No reports found</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
      {reports.map((report) => (
        <div key={report.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition duration-300">
          {/* Image */}
          <div className="h-48">
            {report.image_url && report.image_url !== 'debug.jpg' ? (
              <img 
                src={report.image_url} 
                alt="Report image" 
                className="w-full h-48 object-cover rounded-t-xl"
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.nextElementSibling.style.display = 'flex'
                }}
              />
            ) : null}
            <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-400">
              <span>No Image</span>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-5 space-y-2">
            {/* Description */}
            <p className="text-lg font-semibold text-gray-800 line-clamp-2">
              {report.description}
            </p>
            
            {/* Badges */}
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                {report.category}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(report.risk)}`}>
                {report.risk}
              </span>
            </div>
            
            {/* Date */}
            <div className="text-sm text-gray-500">
              {report.created_at && formatDate(report.created_at)}
            </div>
            
            {/* Location */}
            {report.latitude && report.longitude && (
              <div className="text-sm text-gray-500">
                📍 {parseFloat(report.latitude).toFixed(4)}, {parseFloat(report.longitude).toFixed(4)}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default ReportsDashboard
