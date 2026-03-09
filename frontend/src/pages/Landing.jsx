import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import Navbar from "../components/Navbar"

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

const BrainIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
)

const MapIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const UsersIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)

function Landing() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    total_reports: 0,
    active_alerts: 0,
    resolved_reports: 0,
    high_risk_cases: 0
  })
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStatsLoading(true)
        const response = await fetch('http://127.0.0.1:8000/stats')
        const data = await response.json()

        if (data.status === 'success') {
          setStats({
            total_reports: data.total_reports,
            active_alerts: data.active_alerts,
            resolved_reports: data.issues_resolved, // Map issues_resolved to resolved_reports
            high_risk_cases: data.high_risk // Map high_risk to high_risk_cases
          })
        } else {
          console.error('Failed to fetch stats:', data.message)
          // Keep default values on failure
        }
      } catch (err) {
        console.error('Error fetching stats:', err)
        // Keep default values on error
      } finally {
        setStatsLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
    >
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-7xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-6"
          >
            WaterGuard
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-2xl text-gray-700 dark:text-gray-300 mb-8 max-w-3xl mx-auto"
          >
            AI-powered water issue reporting system that protects communities through smart monitoring and rapid response
          </motion.p>
          
          {/* Hero Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
          >
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(59, 130, 246, 0.3)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/create-report')}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 shadow-lg"
            >
              Report an Issue
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(6, 182, 212, 0.2)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/map')}
              className="px-8 py-4 bg-white dark:bg-gray-800 text-cyan-600 dark:text-cyan-400 font-semibold rounded-xl border-2 border-cyan-600 dark:border-cyan-400 hover:bg-cyan-50 dark:hover:bg-gray-700 transition-all duration-300 shadow-lg"
            >
              View Map
            </motion.button>
          </motion.div>

          {/* Login Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="text-center"
          >
            <span className="text-gray-600 dark:text-gray-400">Already have an account? </span>
            <button
              onClick={() => navigate('/login')}
              className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-semibold transition-colors"
            >
              Login
            </button>
          </motion.div>
        </motion.div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.8 }}
        >
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-100 mb-12">Platform Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all duration-300"
            >
              <div className="flex items-center justify-center mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                  <ReportIcon />
                </div>
              </div>
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2 text-center">
                {statsLoading ? '...' : (stats.total_reports ?? 0).toLocaleString()}
              </div>
              <div className="text-gray-600 dark:text-gray-400 text-center font-medium">Total Reports</div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all duration-300"
            >
              <div className="flex items-center justify-center mb-4">
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
                  <AlertIcon />
                </div>
              </div>
              <div className="text-4xl font-bold text-yellow-600 dark:text-yellow-400 mb-2 text-center">
                {statsLoading ? '...' : (stats.active_alerts ?? 0).toLocaleString()}
              </div>
              <div className="text-gray-600 dark:text-gray-400 text-center font-medium">Active Alerts</div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all duration-300"
            >
              <div className="flex items-center justify-center mb-4">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                  <CheckIcon />
                </div>
              </div>
              <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2 text-center">
                {statsLoading ? '...' : (stats.resolved_reports ?? 0).toLocaleString()}
              </div>
              <div className="text-gray-600 dark:text-gray-400 text-center font-medium">Resolved Issues</div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all duration-300"
            >
              <div className="flex items-center justify-center mb-4">
                <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full">
                  <RiskIcon />
                </div>
              </div>
              <div className="text-4xl font-bold text-red-600 dark:text-red-400 mb-2 text-center">
                {statsLoading ? '...' : (stats.high_risk_cases ?? 0).toLocaleString()}
              </div>
              <div className="text-gray-600 dark:text-gray-400 text-center font-medium">High Risk Cases</div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
        >
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-100 mb-12">Platform Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 text-center"
            >
              <div className="flex items-center justify-center mb-6">
                <div className="p-4 bg-purple-100 dark:bg-purple-900 rounded-full">
                  <BrainIcon />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">AI Issue Detection</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Advanced artificial intelligence automatically classifies water issues, predicts risk levels, and provides confidence scores for accurate assessment
              </p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 text-center"
            >
              <div className="flex items-center justify-center mb-6">
                <div className="p-4 bg-cyan-100 dark:bg-cyan-900 rounded-full">
                  <MapIcon />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Real-time Map Tracking</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Interactive map showing all water issues with live updates, geographic filtering, and comprehensive location-based analytics
              </p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 text-center"
            >
              <div className="flex items-center justify-center mb-6">
                <div className="p-4 bg-green-100 dark:bg-green-900 rounded-full">
                  <UsersIcon />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Community Reporting</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Empower citizens to report water issues instantly with photos, descriptions, and automatic location tagging for faster response
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
    </motion.div>
  )
}

export default Landing
