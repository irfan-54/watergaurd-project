import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

function ResetPassword() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()

  const handleReset = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        setError(error.message)
      } else {
        setSuccess('Password updated successfully! Redirecting to login...')
        setTimeout(() => navigate('/login'), 2000)
      }
    } catch (err) {
      setError('Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-md p-8">
        <div className="text-center mb-6">
          <div className="text-3xl">💧</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">Reset Password</h1>
        </div>
        {error && <div className="bg-red-100 text-red-700 px-3 py-2 rounded-md text-sm mb-4">{error}</div>}
        {success && <div className="bg-green-100 text-green-700 px-3 py-2 rounded-md text-sm mb-4">{success}</div>}
        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter new password"
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md font-medium disabled:opacity-50 transition-colors"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ResetPassword
