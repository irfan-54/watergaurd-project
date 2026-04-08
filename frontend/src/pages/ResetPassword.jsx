import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: 'easeOut' }
  })
}

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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@300;400;500;600&display=swap');
        .rp-page {
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
        .rp-grid-bg {
          position: fixed;
          inset: 0;
          background-image: linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px);
          background-size: 50px 50px;
          pointer-events: none;
        }
        .rp-orb {
          position: fixed;
          border-radius: 50%;
          filter: blur(80px);
          animation: rpFloat 8s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes rpFloat {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-30px) scale(1.05); }
        }
        .rp-glass-card {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          backdrop-filter: blur(20px);
          border-radius: 20px;
          padding: 48px 40px;
          max-width: 440px;
          width: 100%;
          position: relative;
          z-index: 10;
        }
        @media (max-width: 480px) {
          .rp-glass-card { padding: 36px 24px; }
        }
        .rp-input {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 16px 20px;
          color: white;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          outline: none;
          transition: all 0.3s ease;
          box-sizing: border-box;
        }
        .rp-input::placeholder { color: rgba(255,255,255,0.3); }
        .rp-input:focus {
          border-color: #3B82F6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.15);
        }
        .rp-btn {
          width: 100%;
          background: #3B82F6;
          color: white;
          border: none;
          border-radius: 12px;
          padding: 16px;
          font-size: 15px;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .rp-btn:hover:not(:disabled) {
          background: #2563EB;
          transform: translateY(-1px);
          box-shadow: 0 8px 25px rgba(59,130,246,0.4);
        }
        .rp-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>

      <div className="rp-page">
        <div className="rp-grid-bg" />
        <div className="rp-orb" style={{ width: 400, height: 400, background: 'rgba(59,130,246,0.1)', top: '-10%', right: '-10%' }} />
        <div className="rp-orb" style={{ width: 300, height: 300, background: 'rgba(167,139,250,0.08)', bottom: '10%', left: '-8%', animationDelay: '4s' }} />

        <motion.div
          className="rp-glass-card"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
        >
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1} style={{ fontSize: 40, marginBottom: 12 }}>💧</motion.div>
            <motion.h1
              variants={fadeUp} initial="hidden" animate="visible" custom={2}
              style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px' }}
            >
              Reset Password
            </motion.h1>
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12, padding: '14px 18px', fontSize: 13, color: '#FCA5A5', marginBottom: 20 }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 12, padding: '14px 18px', fontSize: 13, color: '#86EFAC', marginBottom: 20 }}>
              {success}
            </div>
          )}

          <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rp-input"
                placeholder="Enter new password"
                required
                minLength={6}
              />
            </div>
            <button type="submit" disabled={loading} className="rp-btn">
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </motion.div>
      </div>
    </>
  )
}

export default ResetPassword
