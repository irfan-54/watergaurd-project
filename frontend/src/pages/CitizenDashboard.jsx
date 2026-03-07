import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'

function CitizenDashboard() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const { user, role } = useAuth()

  useEffect(() => {
    fetchReports()
  }, [])

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
        setReports(data)
      }
    } catch (err) {
      setError('Failed to fetch reports')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadgeClass = (status) => {
    return status === 'OPEN' 
      ? 'bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium'
      : 'bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium'
  }

  const getRiskBadgeClass = (riskLevel) => {
    switch (riskLevel) {
      case 'LOW':
        return 'bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium'
      case 'MEDIUM':
        return 'bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-medium'
      case 'HIGH':
        return 'bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-medium'
      default:
        return 'bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs font-medium'
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  const handleDelete = async (reportId) => {
  const confirmed = confirm('Are you sure you want to delete this report?')
  
  if (!confirmed) return

  try {
    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', reportId)
      .eq('user_id', user.id)

    if (error) {
      setError(error.message)
    } else {
      setReports(prev => prev.filter(report => report.id !== reportId))
    }
  } catch (err) {
    setError('Failed to delete report')
  }
}

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading your reports...</div>
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
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Reports</h1>
            <p className="text-gray-600 mt-2">View and manage your water issue reports</p>
          </div>
          {reports.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-xl text-gray-600 mb-4">You have not submitted any reports yet.</div>
              <p className="text-gray-500">Start by reporting issues in your community.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reports.map((report) => (
                <div key={report.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Report Details</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {report.description}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Category: {report.category || 'other'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className={getStatusBadgeClass(report.status)}>
                        {report.status}
                      </span>
                      <span className={getRiskBadgeClass(report.risk_level || 'LOW')}>
                        {report.risk_level || 'LOW'} RISK
                      </span>
                    </div>
                    {report.image_url && (
                      <div className="mt-3">
                        <img
                          src={report.image_url}
                          alt="Report image"
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      </div>
                    )}
                    <div className="text-sm text-gray-500 pt-2">
                      Reported on {new Date(report.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex gap-2 pt-4">
                      {report.status === 'OPEN' && (
                        <button
                          onClick={() => navigate(`/edit-report/${report.id}`)}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Edit
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(report.id)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CitizenDashboard
