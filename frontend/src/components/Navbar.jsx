import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const pathname = location.pathname
  const isAdminPage = pathname.startsWith("/admin")
  const { user, role } = useAuth()

  const [authUser, setAuthUser] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthUser(data.session?.user ?? null)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen)

  const navLinkStyle = (path) => ({
    fontFamily: 'Inter, sans-serif',
    fontSize: 14,
    fontWeight: 500,
    padding: '8px 16px',
    borderRadius: 10,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textDecoration: 'none',
    background: pathname === path ? 'rgba(59,130,246,0.15)' : 'transparent',
    color: pathname === path ? '#60A5FA' : 'rgba(255,255,255,0.6)',
    border: pathname === path ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
  })

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@300;400;500;600&display=swap');
        .wg-navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 50;
          background: rgba(5,11,24,0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.08);
          font-family: 'Inter', sans-serif;
        }
        .wg-navbar-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 64px;
        }
        .wg-nav-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          font-family: 'Syne', sans-serif;
          font-size: 20px;
          font-weight: 700;
          color: white;
          transition: opacity 0.2s;
        }
        .wg-nav-logo:hover {
          opacity: 0.85;
        }
        .wg-nav-logo-icon {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          background: linear-gradient(135deg, rgba(59,130,246,0.25), rgba(99,102,241,0.2));
          border: 1px solid rgba(59,130,246,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
        }
        .wg-nav-center {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .wg-nav-link {
          text-decoration: none;
          display: inline-block;
        }
        .wg-nav-link:hover {
          color: rgba(255,255,255,0.9) !important;
          background: rgba(255,255,255,0.06) !important;
        }
        .wg-nav-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .wg-nav-btn-primary {
          background: #3B82F6;
          color: white;
          border: none;
          border-radius: 10px;
          padding: 8px 20px;
          font-size: 14px;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .wg-nav-btn-primary:hover {
          background: #2563EB;
          transform: translateY(-1px);
          box-shadow: 0 4px 15px rgba(59,130,246,0.35);
        }
        .wg-nav-btn-ghost {
          background: transparent;
          color: rgba(255,255,255,0.7);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 10px;
          padding: 8px 20px;
          font-size: 14px;
          font-weight: 500;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .wg-nav-btn-ghost:hover {
          color: white;
          border-color: rgba(255,255,255,0.35);
          background: rgba(255,255,255,0.06);
        }
        .wg-nav-btn-logout {
          background: transparent;
          color: rgba(239,68,68,0.8);
          border: 1px solid rgba(239,68,68,0.25);
          border-radius: 10px;
          padding: 8px 20px;
          font-size: 14px;
          font-weight: 500;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .wg-nav-btn-logout:hover {
          color: #EF4444;
          border-color: rgba(239,68,68,0.5);
          background: rgba(239,68,68,0.08);
        }
        .wg-hamburger {
          display: none;
          background: none;
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 8px;
          padding: 6px;
          cursor: pointer;
          color: rgba(255,255,255,0.7);
          transition: all 0.2s ease;
        }
        .wg-hamburger:hover {
          color: white;
          border-color: rgba(255,255,255,0.35);
          background: rgba(255,255,255,0.06);
        }
        .wg-mobile-menu {
          display: none;
          background: rgba(5,11,24,0.95);
          backdrop-filter: blur(20px);
          border-top: 1px solid rgba(255,255,255,0.08);
          padding: 16px 24px;
        }
        .wg-mobile-menu.open {
          display: block;
          position: fixed;
          top: 64px;
          left: 0;
          right: 0;
          z-index: 49;
        }
        .wg-mobile-link {
          display: block;
          text-decoration: none;
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          font-family: 'Inter', sans-serif;
          transition: all 0.2s ease;
          color: rgba(255,255,255,0.6);
        }
        .wg-mobile-link:hover,
        .wg-mobile-link.active {
          color: #60A5FA;
          background: rgba(59,130,246,0.1);
        }
        .wg-mobile-divider {
          height: 1px;
          background: rgba(255,255,255,0.08);
          margin: 12px 0;
        }
        .wg-mobile-btn {
          display: block;
          width: 100%;
          text-align: center;
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-bottom: 8px;
          border: none;
        }
        @media (max-width: 768px) {
          .wg-nav-center,
          .wg-nav-desktop-auth {
            display: none !important;
          }
          .wg-hamburger {
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .wg-mobile-menu.open {
            display: block;
          }
        }
      `}</style>

      <nav className="wg-navbar">
        <div className="wg-navbar-inner">
          {/* LEFT: Logo */}
          <Link to="/" className="wg-nav-logo">
            <div className="wg-nav-logo-icon">💧</div>
            WaterGuard
          </Link>

          {/* CENTER: Desktop Navigation Links */}
          <div className="wg-nav-center">
            {!authUser && (
              <div></div>
            )}
            {authUser && role === 'admin' && (
              <>
                <Link to="/admin" className="wg-nav-link" style={navLinkStyle('/admin')} onClick={() => setMobileMenuOpen(false)}>Admin Dashboard</Link>
                <Link to="/map" className="wg-nav-link" style={navLinkStyle('/map')} onClick={() => setMobileMenuOpen(false)}>Map</Link>
                <Link to="/analytics" className="wg-nav-link" style={navLinkStyle('/analytics')} onClick={() => setMobileMenuOpen(false)}>Analytics</Link>
              </>
            )}
            {authUser && role === 'citizen' && (
              <>
                <Link to="/citizen" className="wg-nav-link" style={navLinkStyle('/citizen')} onClick={() => setMobileMenuOpen(false)}>My Reports</Link>
                <Link to="/map" className="wg-nav-link" style={navLinkStyle('/map')} onClick={() => setMobileMenuOpen(false)}>Map</Link>
              </>
            )}
          </div>

          {/* RIGHT: Theme Toggle + Auth + Mobile Hamburger */}
          <div className="wg-nav-right">


            {/* Desktop Authentication */}
            <div className="wg-nav-desktop-auth" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {authUser ? (
                <>
                  {role === 'citizen' && (
                    <button onClick={() => navigate('/create-report')} className="wg-nav-btn-primary">
                      Create Report
                    </button>
                  )}
                  <button onClick={handleLogout} className="wg-nav-btn-logout">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => navigate('/login')} className="wg-nav-btn-ghost">
                    Login
                  </button>
                  <button onClick={() => navigate('/signup')} className="wg-nav-btn-primary">
                    Sign Up
                  </button>
                </>
              )}
            </div>

            {/* Mobile Hamburger */}
            <button onClick={toggleMobileMenu} className="wg-hamburger">
              <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                }
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <div className={`wg-mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
          {!authUser && (
            <div></div>
          )}
          {authUser && role === 'admin' && (
            <>
              <Link to="/admin" className={`wg-mobile-link ${pathname === '/admin' ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>Admin Dashboard</Link>
              <Link to="/map" className={`wg-mobile-link ${pathname === '/map' ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>Map</Link>
              <Link to="/analytics" className={`wg-mobile-link ${pathname === '/analytics' ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>Analytics</Link>
            </>
          )}

          {authUser && role === 'citizen' && (
            <>
              <Link to="/citizen" className={`wg-mobile-link ${pathname === '/citizen' ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>My Reports</Link>
              <Link to="/map" className={`wg-mobile-link ${pathname === '/map' ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>Map</Link>
            </>
          )}

          <div className="wg-mobile-divider" />

          {authUser ? (
            <>
              {role === 'citizen' && (
                <button
                  onClick={() => { navigate('/create-report'); setMobileMenuOpen(false) }}
                  className="wg-mobile-btn"
                  style={{ background: '#3B82F6', color: 'white' }}
                >
                  Create Report
                </button>
              )}
              <button
                onClick={() => { handleLogout(); setMobileMenuOpen(false) }}
                className="wg-mobile-btn"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.25)' }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => { navigate('/login'); setMobileMenuOpen(false) }}
                className="wg-mobile-btn"
                style={{ background: 'transparent', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.15)' }}
              >
                Login
              </button>
              <button
                onClick={() => { navigate('/signup'); setMobileMenuOpen(false) }}
                className="wg-mobile-btn"
                style={{ background: '#3B82F6', color: 'white' }}
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </nav>
    </>
  )
}

export default Navbar
