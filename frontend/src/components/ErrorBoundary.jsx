import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <>
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@300;400;500;600&display=swap');
            @keyframes ebFloat {
              0%, 100% { transform: translateY(0) scale(1); }
              50% { transform: translateY(-20px) scale(1.05); }
            }
          `}</style>
          <div style={{
            background: '#050B18',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Inter, sans-serif',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            padding: 24,
          }}>
            {/* Grid bg */}
            <div style={{
              position: 'fixed', inset: 0,
              backgroundImage: 'linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px)',
              backgroundSize: '50px 50px', pointerEvents: 'none',
            }} />
            {/* Orbs */}
            <div style={{ position: 'fixed', width: 400, height: 400, borderRadius: '50%', background: 'rgba(239,68,68,0.08)', filter: 'blur(80px)', top: '-10%', right: '-10%', animation: 'ebFloat 8s ease-in-out infinite', pointerEvents: 'none' }} />
            <div style={{ position: 'fixed', width: 300, height: 300, borderRadius: '50%', background: 'rgba(59,130,246,0.06)', filter: 'blur(80px)', bottom: '10%', left: '-8%', animation: 'ebFloat 8s ease-in-out infinite 4s', pointerEvents: 'none' }} />

            <div style={{
              position: 'relative', zIndex: 10,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(20px)',
              borderRadius: 20,
              padding: '48px 40px',
              maxWidth: 440,
              width: '100%',
              textAlign: 'center',
            }}>
              {/* Error icon */}
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'rgba(239,68,68,0.12)',
                border: '1px solid rgba(239,68,68,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 24px', fontSize: 28,
              }}>
                ⚠️
              </div>

              <h2 style={{
                fontFamily: 'Syne, sans-serif',
                fontSize: 24,
                fontWeight: 800,
                marginBottom: 12,
                letterSpacing: '-0.3px',
              }}>
                Something went wrong
              </h2>

              <p style={{
                color: 'rgba(255,255,255,0.45)',
                fontSize: 14,
                lineHeight: 1.6,
                marginBottom: 28,
              }}>
                {this.state.error?.message}
              </p>

              <button
                onClick={() => window.location.reload()}
                style={{
                  background: '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: 12,
                  padding: '14px 32px',
                  fontSize: 15,
                  fontWeight: 600,
                  fontFamily: 'Inter, sans-serif',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => { e.target.style.background = '#2563EB'; e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 8px 25px rgba(59,130,246,0.4)' }}
                onMouseLeave={e => { e.target.style.background = '#3B82F6'; e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = 'none' }}
              >
                Reload Page
              </button>
            </div>
          </div>
        </>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
