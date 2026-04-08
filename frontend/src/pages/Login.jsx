import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' }
  })
}

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { user, role, loading: authLoading } = useAuth()

  useEffect(() => {
    if (user && role) {
      if (role === 'admin') {
        navigate('/admin')
      } else if (role === 'department') {
        navigate('/department')
      } else {
        // 'user' role (previously 'citizen')
        navigate('/citizen')
      }
    }
  }, [user, role, navigate])

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/login` 
      }
    })
    if (error) toast.error('Google login failed')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        toast.error('Invalid email or password')
      }
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@300;400;500;600&display=swap');
        .login-page {
          background: #050B18;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Inter', sans-serif;
          color: white;
          position: relative;
          overflow: hidden;
          padding: 24px;
        }
        .login-grid-bg {
          position: absolute;
          inset: 0;
          background-image: linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px);
          background-size: 50px 50px;
          z-index: 0;
        }
        .login-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          animation: loginFloat 8s ease-in-out infinite;
        }
        @keyframes loginFloat {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-30px) scale(1.05); }
        }
        .login-glass-card {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          backdrop-filter: blur(20px);
          border-radius: 20px;
          padding: 48px 40px;
          width: 100%;
          max-width: 440px;
          position: relative;
          z-index: 10;
        }
        .login-input {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 14px 16px;
          color: white;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          outline: none;
          transition: all 0.3s ease;
          box-sizing: border-box;
        }
        .login-input::placeholder {
          color: rgba(255,255,255,0.3);
        }
        .login-input:focus {
          border-color: #3B82F6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.15);
        }
        .login-label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: rgba(255,255,255,0.6);
          margin-bottom: 8px;
          font-family: 'Inter', sans-serif;
        }
        .login-btn-primary {
          width: 100%;
          background: #3B82F6;
          color: white;
          border: none;
          border-radius: 12px;
          padding: 14px 28px;
          font-weight: 600;
          font-size: 15px;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .login-btn-primary:hover:not(:disabled) {
          background: #2563EB;
          transform: translateY(-1px);
          box-shadow: 0 8px 25px rgba(59,130,246,0.4);
        }
        .login-btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .login-btn-google {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 12px;
          padding: 14px 28px;
          color: rgba(255,255,255,0.8);
          font-size: 14px;
          font-weight: 500;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .login-btn-google:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.3);
          color: white;
        }
        .login-divider {
          position: relative;
          margin: 24px 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .login-divider::before,
        .login-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.1);
        }
        .login-divider span {
          padding: 0 16px;
          color: rgba(255,255,255,0.3);
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .login-error {
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.3);
          color: #FCA5A5;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 13px;
        }
        .login-link {
          background: none;
          border: none;
          color: #3B82F6;
          font-size: 13px;
          font-weight: 500;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          transition: color 0.2s;
          padding: 0;
        }
        .login-link:hover {
          color: #60A5FA;
        }
        .login-back-btn {
          background: none;
          border: none;
          color: rgba(255,255,255,0.4);
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 500;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          transition: color 0.2s;
          padding: 0;
          margin-bottom: 32px;
          position: relative;
          z-index: 10;
        }
        .login-back-btn:hover {
          color: rgba(255,255,255,0.8);
        }
        .login-logo-glow {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          background: linear-gradient(135deg, rgba(59,130,246,0.2), rgba(99,102,241,0.15));
          border: 1px solid rgba(59,130,246,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          font-size: 28px;
        }
      `}</style>

      <div className="login-page">
        {/* Grid texture */}
        <div className="login-grid-bg" />

        {/* Floating orbs */}
        <div className="login-orb" style={{ width: 400, height: 400, background: 'rgba(59,130,246,0.12)', top: '-10%', left: '-10%', animationDelay: '0s' }} />
        <div className="login-orb" style={{ width: 350, height: 350, background: 'rgba(99,102,241,0.08)', bottom: '-5%', right: '-8%', animationDelay: '3s' }} />
        <div className="login-orb" style={{ width: 250, height: 250, background: 'rgba(6,182,212,0.08)', top: '60%', left: '60%', animationDelay: '5s' }} />

        <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 10 }}>
          {/* Back button */}
          <motion.button
            className="login-back-btn"
            onClick={() => navigate('/')}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
          >
            ← Back to Home
          </motion.button>

          {/* Login Card */}
          <motion.div
            className="login-glass-card"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
          >
            {/* Logo */}
            <div className="login-logo-glow">💧</div>

            {/* Title */}
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.5px' }}>
                Welcome Back
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: 400 }}>
                Report and track community water issues
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label className="login-label">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="login-input"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div>
                <label className="login-label">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="login-input"
                  placeholder="Enter your password"
                />
              </div>

              {error && (
                <div className="login-error">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="login-btn-primary"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            {/* Divider */}
            <div className="login-divider">
              <span>or</span>
            </div>

            {/* Google OAuth */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="login-btn-google"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            {/* Links */}
            <div style={{ marginTop: 28, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <button 
                  onClick={async () => {
                    if (!email) {
                      setError('Please enter your email address first, then click Forgot Password.')
                      return
                    }
                    const { error } = await supabase.auth.resetPasswordForEmail(email, {
                      redirectTo: `${window.location.origin}/reset-password`
                    })
                    if (error) {
                      setError(error.message)
                    } else {
                      setError('')
                      alert('Password reset email sent! Check your inbox.')
                    }
                  }}
                  className="login-link"
                >
                  Forgot password?
                </button>
              </div>
              <div>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Don't have an account? </span>
                <button
                  onClick={() => navigate('/signup')}
                  className="login-link"
                  style={{ fontWeight: 600 }}
                >
                  Sign up
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}

export default Login