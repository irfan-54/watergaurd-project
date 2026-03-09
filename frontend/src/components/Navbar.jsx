import { useState, useEffect } from 'react'
import { useNavigate, Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabase'
import ThemeSwitcher from './ThemeSwitcher'

function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const pathname = location.pathname
  const { user, role } = useAuth()
  const { theme, effectiveTheme } = useTheme()
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

  const getActiveClass = (path) => {
    return pathname === path
      ? "bg-blue-600 text-white px-4 py-2 rounded-lg"
      : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
  }

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-lg border-b border-gray-200 dark:border-gray-700 transition-colors">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center h-16">
          {/* LEFT: Logo */}
          <div className="flex items-center justify-self-start">
            <Link to="/" className="flex items-center gap-2 text-xl font-bold text-blue-600 dark:text-blue-400 hover:opacity-80 transition-opacity">
              💧 WaterGuard
            </Link>
          </div>

          {/* CENTER: Navigation Links */}
          <div className="flex items-center justify-self-center gap-6">
            <Link
              to="/"
              className={getActiveClass("/")}
            >
              Home
            </Link>
            <Link
              to="/map"
              className={getActiveClass("/map")}
            >
              City Map
            </Link>

            {/* Admin-specific navigation */}
            {authUser && role === 'admin' && (
              <>
                <Link
                  to="/admin"
                  className={getActiveClass("/admin")}
                >
                  Admin Dashboard
                </Link>
                <Link
                  to="/analytics"
                  className={getActiveClass("/analytics")}
                >
                  Analytics
                </Link>
              </>
            )}

            {/* Citizen-specific navigation */}
            {authUser && role === 'citizen' && (
              <Link
                to="/citizen"
                className={getActiveClass("/citizen")}
              >
                My Reports
              </Link>
            )}
          </div>

          {/* RIGHT: Theme Toggle + Authentication */}
          <div className="flex items-center justify-self-end gap-3">
            {/* Theme Switcher - Always visible */}
            <ThemeSwitcher />

            {authUser ? (
              // Authenticated user actions
              <>
                {role === 'citizen' && (
                  <button
                    onClick={() => navigate('/create-report')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Create Report
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              // Guest authentication - NO active highlighting
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
        </div>
      </div>
    </nav>
  )
}

export default Navbar
