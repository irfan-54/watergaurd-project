import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabase'

function Navbar() {
  const navigate = useNavigate()
  const { user, role } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [authUser, setAuthUser] = useState(null)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data }) => {
      setAuthUser(data.session?.user ?? null)
    })

    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-lg border-b border-gray-200 dark:border-gray-700 transition-colors">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 text-xl font-bold text-blue-600 hover:opacity-80 transition-opacity">
              💧 WaterGuard
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigate('/')}
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Home
            </button>
            <button
              onClick={() => navigate('/map')}
              className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              City Map
            </button>

            {authUser ? (
              // Authenticated navigation
              <>
                {role === 'citizen' && (
                  <>
                    <button
                      onClick={() => navigate('/citizen')}
                      className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      My Reports
                    </button>
                    <button
                      onClick={() => navigate('/create-report')}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      Create Report
                    </button>
                  </>
                )}

                {role === 'admin' && (
                  <>
                    <button
                      onClick={() => navigate('/admin')}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      Admin Dashboard
                    </button>
                    <button
                      onClick={() => navigate('/analytics')}
                      className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Analytics
                    </button>
                  </>
                )}
              </>
            ) : (
              // Guest navigation
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate('/signup')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Signup
                </button>
              </>
            )}
          </div>

          {/* Right side: Dark mode + Logout (only for authenticated users) */}
          {authUser && (
            <div className="flex items-center gap-3">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-lg"
                title="Toggle dark mode"
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>

              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
