import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import WaterBlob from '../components/WaterBlob'
import AnimatedLogo from '../components/AnimatedLogo'
import AIBlob from '../components/AIBlob'
import TrackingRing from '../components/TrackingRing'
import CommunityParticles from '../components/CommunityParticles'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' }
  })
}

const featureCardVariants = {
  initial: { 
    scale: 1, 
    y: 0,
    borderColor: 'rgba(255,255,255,0.1)',
    boxShadow: '0 0 0 0 rgba(59,130,246,0)'
  },
  hover: { 
    scale: 1.05,
    y: -10,
    borderColor: 'rgba(59,130,246,0.4)',
    boxShadow: '0 20px 40px rgba(59,130,246,0.3), 0 0 0 1px rgba(59,130,246,0.2)',
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20
    }
  }
}

const iconVariants = {
  initial: { rotate: 0, y: 0 },
  animate: {
    rotate: [0, 5, -5, 0],
    y: [0, -2, 0],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
}

export default function Landing() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ total: 0, active: 0, resolved: 0, high_risk: 0 })

  useEffect(() => {
    async function fetchStats() {
      try {
        const { data, error } = await supabase
          .from('reports')
          .select('status, risk_level')
        
        if (data && !error) {
          setStats({
            total: data.length,
            active: data.filter(r => ['submitted','verified','assigned','in_progress'].includes(r.status)).length,
            resolved: data.filter(r => r.status === 'resolved').length,
            high_risk: data.filter(r => r.risk_level === 'HIGH').length,
          })
        }
      } catch (e) {}
    }
    
    fetchStats()
  }, [])

  return (
    <div style={{ background: '#050B18', minHeight: '100vh', fontFamily: 'Inter, sans-serif', color: 'white', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@300;400;500;600&display=swap');
        .glass { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(20px); border-radius: 16px; }
        .glass-nav { background: rgba(5,11,24,0.8); border-bottom: 1px solid rgba(255,255,255,0.08); backdrop-filter: blur(20px); }
        .feature-card { 
          background: rgba(255,255,255,0.03); 
          border: 1px solid rgba(255,255,255,0.1); 
          backdrop-filter: blur(20px); 
          border-radius: 20px; 
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        .feature-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(59,130,246,0.1), transparent);
          transition: left 0.6s ease;
        }
        .feature-card:hover::before {
          left: 100%;
        }
        .btn-primary { background: #3B82F6; color: white; border: none; border-radius: 12px; padding: 14px 28px; font-weight: 600; font-size: 15px; cursor: pointer; transition: all 0.2s; }
        .btn-primary:hover { background: #2563EB; transform: translateY(-1px); box-shadow: 0 8px 25px rgba(59,130,246,0.4); }
        .btn-ghost { background: transparent; color: white; border: 1px solid rgba(255,255,255,0.2); border-radius: 12px; padding: 14px 28px; font-weight: 500; font-size: 15px; cursor: pointer; transition: all 0.2s; }
        .btn-ghost:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.4); }
        .btn-nav-ghost { background: transparent; color: rgba(255,255,255,0.7); border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; padding: 8px 20px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
        .btn-nav-ghost:hover { color: white; border-color: rgba(255,255,255,0.4); }
        .btn-nav-primary { background: #3B82F6; color: white; border: none; border-radius: 10px; padding: 8px 20px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .btn-nav-primary:hover { background: #2563EB; }
        .orb { position: absolute; border-radius: 50%; filter: blur(80px); animation: float 8s ease-in-out infinite; }
        @keyframes float { 0%,100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-30px) scale(1.05); } }
        @keyframes badgeGlow {
          0% {
            box-shadow: 0 0 8px rgba(59,130,246,0.1), 0 0 16px rgba(59,130,246,0.15);
          }
          50% {
            box-shadow: 0 0 18px rgba(59,130,246,0.25), 0 0 32px rgba(59,130,246,0.2);
          }
          100% {
            box-shadow: 0 0 8px rgba(59,130,246,0.1), 0 0 16px rgba(59,130,246,0.15);
          }
        }
        .feature-card:hover { transform: translateY(-6px); box-shadow: 0 20px 60px rgba(59,130,246,0.15); }
        .ai-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-top: 40px;
          margin-bottom: 24px;
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 500;
          background: rgba(255,255,255,0.06);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.15);
          color: rgba(255,255,255,0.9);
          position: relative;
          z-index: 20;
          width: fit-content;
          transform: scale(1.05);
          animation: badgeGlow 4s ease-in-out infinite;
          transition: box-shadow 0.3s ease;
        }
        .ai-badge::before {
          content: "";
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #22c55e;
        }
        .grid-bg { background-image: linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px); background-size: 50px 50px; }
      `}</style>

      {/* NAVBAR */}
      <nav className="glass-nav" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, padding: '0 40px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <AnimatedLogo size={28} intensity={0.8} textSize={20} />
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn-nav-ghost" onClick={() => navigate('/login')}>Login</button>
            <button className="btn-nav-primary" onClick={() => navigate('/signup')}>Sign Up</button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ position: 'relative', height: '100vh', overflow: 'hidden', overflowX: 'hidden' }}>
        <section className="grid-bg" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', paddingTop: 64 }}>
          {/* 3D Water Blob Background */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
            <WaterBlob />
          </div>
          
          {/* Original CSS Orbs (kept for additional effect) */}
          <div className="orb" style={{ width: 500, height: 500, background: 'rgba(59,130,246,0.15)', top: '10%', left: '-10%', animationDelay: '0s' }} />
          <div className="orb" style={{ width: 400, height: 400, background: 'rgba(99,102,241,0.1)', top: '30%', right: '-5%', animationDelay: '3s' }} />
          <div className="orb" style={{ width: 300, height: 300, background: 'rgba(59,130,246,0.08)', bottom: '10%', left: '30%', animationDelay: '6s' }} />

          <div style={{ textAlign: 'center', maxWidth: 760, padding: '0 16px', position: 'relative', zIndex: 10 }}>
            <div className="ai-badge">AI-Powered Platform</div>

            <motion.h1 variants={fadeUp} initial="hidden" animate="visible" custom={1}
              style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(32px, 6vw, 80px)', fontWeight: 800, lineHeight: 1.1, marginBottom: 24, letterSpacing: '-1px' }}>
              Protect Your<br />
              <span style={{ background: 'linear-gradient(135deg, #3B82F6, #60A5FA, #A78BFA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Community's Water
              </span>
            </motion.h1>

            <motion.p variants={fadeUp} initial="hidden" animate="visible" custom={2}
            style={{ fontSize: 18, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, marginBottom: 40, maxWidth: 520, margin: '0 auto 40px' }}>
            Report water issues instantly. Track resolutions in real-time. Powered by AI to protect what matters most.
          </motion.p>

          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3}
            style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={() => navigate('/signup')}>Report an Issue →</button>
            <button className="btn-ghost" onClick={() => navigate('/login')}>Sign In</button>
          </motion.div>
        </div>
        </section>
      </div>

      {/* STATS */}
      <section style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
          {[
            { label: 'Total Reports', value: stats.total },
            { label: 'Active Alerts', value: stats.active },
            { label: 'Issues Resolved', value: stats.resolved },
            { label: 'High Risk Cases', value: stats.high_risk },
          ].map((s, i) => (
            <motion.div key={s.label} className="glass" variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
              style={{ padding: '32px 28px', textAlign: 'center' }}>
              <div style={{ fontSize: 42, fontWeight: 800, color: '#3B82F6', fontFamily: 'Syne, sans-serif' }}>{s.value}</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 8, fontWeight: 500 }}>{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: '60px 24px 100px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 60 }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 40, fontWeight: 800, marginBottom: 16 }}>Built for communities</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>Everything you need to report, track and resolve water issues</p>
          </motion.div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {[
              { 
                visual: <AIBlob />, 
                title: 'AI Issue Detection', 
                desc: 'Our AI automatically categorizes and assesses risk level of every report submitted.' 
              },
              { 
                visual: <TrackingRing />, 
                title: 'Real-time Tracking', 
                desc: 'Track your report from submission to resolution with live status updates.' 
              },
              { 
                visual: <CommunityParticles />, 
                title: 'Community Reporting', 
                desc: 'Citizens, admins and departments all on one platform working together.' 
              },
            ].map((f, i) => (
              <motion.div 
                key={f.title} 
                className="feature-card" 
                variants={featureCardVariants}
                initial="initial"
                whileInView="visible" 
                viewport={{ once: true }} 
                custom={i}
                whileHover="hover"
                style={{ padding: '36px 32px', cursor: 'pointer' }}
              >
                <motion.div 
                  style={{ 
                    width: 52, 
                    height: 52, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    marginBottom: 20,
                    position: 'relative',
                    zIndex: 1
                  }}
                  variants={iconVariants}
                  initial="initial"
                  animate="animate"
                >
                  {f.visual}
                </motion.div>
                <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700, marginBottom: 12, position: 'relative', zIndex: 1 }}>{f.title}</h3>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, lineHeight: 1.6, position: 'relative', zIndex: 1 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '0 24px 100px' }}>
        <motion.div className="glass" variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center', padding: '64px 40px', background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(99,102,241,0.05))', border: '1px solid rgba(59,130,246,0.2)' }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 36, fontWeight: 800, marginBottom: 16 }}>Ready to protect your community?</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 36, fontSize: 16 }}>Join thousands of citizens making a difference every day</p>
          <button className="btn-primary" style={{ fontSize: 16, padding: '16px 36px' }} onClick={() => navigate('/signup')}>Get Started Free →</button>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '32px 24px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <AnimatedLogo size={16} intensity={0.3} textSize={14} showText={true} />
        </div>
        <span style={{ margin: '0 16px' }}>·</span>
        © 2025 WaterGuard. All rights reserved.
      </footer>
    </div>
  )
}
