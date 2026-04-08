import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import ReportsMap from '../components/ReportsMap'
import Navbar from '../components/Navbar'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: 'easeOut' }
  })
}

function MapPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading time for map initialization
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@300;400;500;600&display=swap');`}</style>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
        >
          <div style={{ background: '#050B18', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
            <Navbar />
            <div style={{ maxWidth: 1180, margin: '0 auto', padding: '100px 16px 40px' }}>
              {/* Title skeleton */}
              <div style={{ marginBottom: 32 }}>
                <div style={{ height: 32, width: 320, background: 'rgba(255,255,255,0.06)', borderRadius: 12, marginBottom: 10 }} />
                <div style={{ height: 16, width: 400, background: 'rgba(255,255,255,0.04)', borderRadius: 8 }} />
              </div>
              {/* Map skeleton */}
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, height: 400, marginBottom: 16 }} />
              {/* Legend skeleton */}
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 20 }}>
                <div style={{ height: 16, width: 120, background: 'rgba(255,255,255,0.06)', borderRadius: 8, marginBottom: 14 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[1, 2, 3].map((i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 16, height: 16, background: 'rgba(255,255,255,0.06)', borderRadius: 4 }} />
                      <div style={{ height: 14, width: 100, background: 'rgba(255,255,255,0.04)', borderRadius: 6 }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </>
    )
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@300;400;500;600&display=swap');
        .mp-page {
          background: #050B18;
          min-height: 100vh;
          font-family: 'Inter', sans-serif;
          color: white;
          position: relative;
          overflow-x: hidden;
        }
        .mp-grid-bg {
          position: fixed; inset: 0;
          background-image: linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px);
          background-size: 50px 50px;
          pointer-events: none;
        }
        .mp-orb {
          position: fixed; border-radius: 50%; filter: blur(80px);
          animation: mpFloat 8s ease-in-out infinite; pointer-events: none;
        }
        @keyframes mpFloat { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-30px) scale(1.05)} }
      `}</style>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.25 }}
      >
        <div className="mp-page">
          <div className="mp-grid-bg" />
          <div className="mp-orb" style={{ width: 450, height: 450, background: 'rgba(59,130,246,0.08)', top: '-5%', right: '-10%' }} />
          <div className="mp-orb" style={{ width: 350, height: 350, background: 'rgba(34,197,94,0.06)', bottom: '8%', left: '-8%', animationDelay: '4s' }} />

          <Navbar />

          <div style={{ maxWidth: 1180, margin: '0 auto', padding: '100px 16px 60px', position: 'relative', zIndex: 10 }}>
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0} style={{ marginBottom: 28 }}>
              <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 6 }}>
                Community Water Issues Map
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
                Explore water issues reported by the community in your area
              </p>
            </motion.div>

            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1}>
              <ReportsMap />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </>
  )
}

export default MapPage
