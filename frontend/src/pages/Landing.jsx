import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-slate-900 dark:to-slate-800">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="flex flex-col items-center justify-center min-h-screen px-6 py-24"
      >
        <div className="max-w-4xl w-full text-center">
          {/* Hero Section */}
          <div className="mb-16">
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-6xl font-bold text-gray-900 dark:text-white mb-4"
            >
              WaterGuard
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-xl text-gray-600 dark:text-gray-300 mb-8"
            >
              Smart Water Issue Reporting System
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-12"
            >
              Protecting communities through smart water infrastructure monitoring.
              Report leaks, contamination, and blockages in seconds to help maintain
              safe and reliable water systems for everyone.
            </motion.p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/signup')}
              className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Get Started
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/map')}
              className="px-8 py-3 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-semibold rounded-lg border-2 border-blue-600 dark:border-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors"
            >
              Explore Water Issues
            </motion.button>
          </div>

          {/* Login Link */}
          <div className="text-center mb-16">
            <span className="text-gray-600 dark:text-gray-400">Already have an account? </span>
            <button
              onClick={() => navigate('/login')}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
            >
              Login
            </button>
          </div>

          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="mb-16"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg"
              >
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  {statsLoading ? '...' : (stats.total_reports ?? 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Reports Submitted</div>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg"
              >
                <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                  {statsLoading ? '...' : (stats.resolved_reports ?? 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Issues Resolved</div>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg"
              >
                <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">
                  {statsLoading ? '...' : (stats.active_alerts ?? 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Active Alerts</div>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg"
              >
                <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">
                  {statsLoading ? '...' : (stats.high_risk_cases ?? 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">High Risk Cases</div>
              </motion.div>
            </div>
          </motion.div>

          {/* Features Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.8 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <motion.div
                whileHover={{ scale: 1.03 }}
                className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg text-center"
              >
                <div className="text-4xl mb-4">🚰</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Real-time Monitoring</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Track water issues as they happen with live updates and notifications
                </p>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.03 }}
                className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg text-center"
              >
                <div className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Analytics Dashboard</div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Comprehensive insights and trends to improve water infrastructure management
                </p>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.03 }}
                className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg text-center"
              >
                <div className="text-4xl mb-4">🔔</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Smart Alerts</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Automated notifications for critical water issues and maintenance needs
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

export default Landing
