import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import ReportModal from '../components/ReportModal'

const ReportIcon = () => (
  <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)
const ClockIcon = () => (
  <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)
const ProgressIcon = () => (
  <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
)
const CheckIcon = () => (
  <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' }
  })
}

function CitizenDashboard() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedReport, setSelectedReport] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteReportId, setDeleteReportId] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  useEffect(() => {
  fetchReports()

  const channel = supabase
    .channel("reports-live")
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "reports"
      },
      (payload) => {
        fetchReports()
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [location.key])

  const fetchReports = async () => {
    setCurrentPage(1)
    try {
      setLoading(true); setError(null)
      const { data, error } = await supabase
        .from('reports').select('*').eq('user_id', user.id).eq('ai_processed', true).order('created_at', { ascending: false })
      if (error) setError(error.message)
      else setReports(data || [])
    } catch (err) { setError('Failed to fetch reports') }
    finally { setLoading(false) }
  }

  const totalReports = reports.length
  const pendingReports = reports.filter(r => r.status === 'PENDING').length
  const assignedReports = reports.filter(r => r.status === 'IN_PROGRESS').length
  const resolvedReports = reports.filter(r => r.status === 'RESOLVED').length

  const totalPages = Math.ceil(reports.length / ITEMS_PER_PAGE)
  const paginatedReports = reports.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const getStatusBadge = (status) => {
    const map = {
      PENDING: { bg: 'rgba(245,158,11,0.12)', color: '#FBBF24', border: 'rgba(245,158,11,0.25)' },
      IN_PROGRESS: { bg: 'rgba(59,130,246,0.12)', color: '#60A5FA', border: 'rgba(59,130,246,0.25)' },
      RESOLVED: { bg: 'rgba(34,197,94,0.12)', color: '#4ADE80', border: 'rgba(34,197,94,0.25)' },
      REJECTED: { bg: 'rgba(239,68,68,0.12)', color: '#F87171', border: 'rgba(239,68,68,0.25)' },
    }
    return map[status] || { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: 'rgba(255,255,255,0.1)' }
  }

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'PENDING': return 'Pending'
      case 'ASSIGNED': return 'Assigned'
      case 'IN_PROGRESS': return 'In Progress'
      case 'RESOLVED': return 'Resolved'
      case 'REJECTED': return 'Rejected'
      default: return status
    }
  }

  const getRiskBadge = (riskLevel) => {
    const map = {
      LOW: { bg: 'rgba(34,197,94,0.12)', color: '#4ADE80', border: 'rgba(34,197,94,0.25)' },
      MEDIUM: { bg: 'rgba(245,158,11,0.12)', color: '#FBBF24', border: 'rgba(245,158,11,0.25)' },
      HIGH: { bg: 'rgba(239,68,68,0.12)', color: '#F87171', border: 'rgba(239,68,68,0.25)' },
    }
    return map[riskLevel] || { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: 'rgba(255,255,255,0.1)' }
  }

  const getCategoryColor = (category, aiProcessed) => {
    if (!aiProcessed) return '#FBBF24'
    const map = { contamination: '#F87171', blockage: '#FBBF24', leakage: '#60A5FA' }
    return map[category] || 'rgba(255,255,255,0.5)'
  }

  const handleDeleteClick = (id) => { setDeleteReportId(id); setShowDeleteModal(true) }

  const handleDelete = async () => {
    try {
      const { error } = await supabase.from('reports').delete().eq('id', deleteReportId)
      if (error) setError(error.message)
      else setReports(reports.filter(r => r.id !== deleteReportId))
    } catch (err) { setError('Failed to delete report') }
    finally { setShowDeleteModal(false); setDeleteReportId(null) }
  }

  const badgeStyle = (b) => ({
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 600,
    fontFamily: 'Inter, sans-serif',
    background: b.bg,
    color: b.color,
    border: `1px solid ${b.border}`,
  })

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@300;400;500;600&display=swap');
        `}</style>
        <div style={{ background: '#050B18', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
          <Navbar />
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '100px 16px 40px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              {[1,2,3,4].map((i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24 }}>
                  <div style={{ height: 16, width: 80, background: 'rgba(255,255,255,0.08)', borderRadius: 8, marginBottom: 12 }} />
                  <div style={{ height: 32, width: 60, background: 'rgba(255,255,255,0.08)', borderRadius: 8 }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  if (error) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@300;400;500;600&display=swap');
        `}</style>
        <div style={{ background: '#050B18', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#F87171', fontSize: 16, marginBottom: 16 }}>Error: {error}</p>
            <button onClick={fetchReports} style={{ background: '#3B82F6', color: 'white', border: 'none', borderRadius: 12, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Retry</button>
          </div>
        </div>
      </>
    )
  }

  const statCards = [
    { label: 'My Reports', value: totalReports, icon: <ReportIcon />, accent: '#3B82F6' },
    { label: 'Pending', value: pendingReports, icon: <ClockIcon />, accent: '#F59E0B' },
    { label: 'In Progress', value: assignedReports, icon: <ProgressIcon />, accent: '#3B82F6' },
    { label: 'Resolved', value: resolvedReports, icon: <CheckIcon />, accent: '#22C55E' },
  ]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@300;400;500;600&display=swap');
        .cd-page {
          background: #050B18;
          min-height: 100vh;
          font-family: 'Inter', sans-serif;
          color: white;
          position: relative;
          overflow-x: hidden;
        }
        .cd-grid-bg {
          position: fixed;
          inset: 0;
          background-image: linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px);
          background-size: 50px 50px;
          pointer-events: none;
        }
        .cd-orb {
          position: fixed;
          border-radius: 50%;
          filter: blur(80px);
          animation: cdFloat 8s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes cdFloat {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-30px) scale(1.05); }
        }
        .cd-glass {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          backdrop-filter: blur(20px);
          border-radius: 16px;
        }
        .cd-stat-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(20px);
          border-radius: 16px;
          padding: 24px;
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
          cursor: default;
        }
        .cd-stat-card:hover {
          transform: translateY(-4px);
          border-color: rgba(59,130,246,0.3);
          box-shadow: 0 12px 40px rgba(59,130,246,0.1);
        }
        .cd-stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(59,130,246,0.06), transparent);
          transition: left 0.6s ease;
        }
        .cd-stat-card:hover::before {
          left: 100%;
        }
        .cd-table-row {
          cursor: pointer;
          transition: all 0.15s ease;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .cd-table-row:hover {
          background: rgba(59,130,246,0.06);
        }
        .cd-btn-primary {
          background: #3B82F6;
          color: white;
          border: none;
          border-radius: 12px;
          padding: 10px 24px;
          font-weight: 600;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .cd-btn-primary:hover {
          background: #2563EB;
          transform: translateY(-1px);
          box-shadow: 0 8px 25px rgba(59,130,246,0.4);
        }
        .cd-btn-sm {
          border: none;
          border-radius: 8px;
          padding: 6px 14px;
          font-size: 12px;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .cd-btn-sm:hover {
          transform: translateY(-1px);
        }
        .cd-mobile-card {
          padding: 20px;
          cursor: pointer;
          transition: background 0.15s ease;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .cd-mobile-card:hover {
          background: rgba(255,255,255,0.03);
        }
        .cd-pagination-btn {
          background: transparent;
          color: rgba(255,255,255,0.6);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 8px;
          padding: 6px 14px;
          font-size: 13px;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .cd-pagination-btn:hover:not(:disabled) {
          background: rgba(255,255,255,0.06);
          color: white;
          border-color: rgba(255,255,255,0.25);
        }
        .cd-pagination-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        @media (max-width: 768px) {
          .cd-desktop-table { display: none !important; }
        }
        @media (min-width: 769px) {
          .cd-mobile-list { display: none !important; }
        }
        @media (max-width: 640px) {
          .cd-stat-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>

      <div className="cd-page">
        <div className="cd-grid-bg" />
        <div className="cd-orb" style={{ width: 450, height: 450, background: 'rgba(59,130,246,0.08)', top: '-5%', right: '-10%' }} />
        <div className="cd-orb" style={{ width: 350, height: 350, background: 'rgba(167,139,250,0.06)', bottom: '10%', left: '-8%', animationDelay: '4s' }} />

        <Navbar />
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '100px 16px 60px', position: 'relative', zIndex: 10 }}>

          {/* Page header */}
          <motion.div
            variants={fadeUp} initial="hidden" animate="visible" custom={0}
            style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 28 }}
          >
            <div>
              <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 4 }}>Citizen Dashboard</h1>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Track and manage your water issue reports</p>
            </div>
            <button className="cd-btn-primary" onClick={() => navigate('/create-report')}>
              🚨 Report Issue
            </button>
          </motion.div>

          {/* Stat cards */}
          <div className="cd-stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
            {statCards.map((s, i) => (
              <motion.div key={s.label} className="cd-stat-card" variants={fadeUp} initial="hidden" animate="visible" custom={i + 1}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: `${s.accent}15`,
                  border: `1px solid ${s.accent}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 16, color: s.accent,
                  position: 'relative', zIndex: 1
                }}>
                  {s.icon}
                </div>
                <p style={{ fontSize: 28, fontWeight: 800, fontFamily: 'Syne, sans-serif', color: s.accent, position: 'relative', zIndex: 1 }}>{s.value}</p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4, fontWeight: 500, position: 'relative', zIndex: 1 }}>{s.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Reports Section */}
          <motion.div className="cd-glass" variants={fadeUp} initial="hidden" animate="visible" custom={5}>
            {reports.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '64px 24px' }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>📋</div>
                <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No reports yet</h3>
                <p style={{ color: 'rgba(255,255,255,0.45)', marginBottom: 28, fontSize: 14 }}>Start by reporting water issues in your community</p>
                <button className="cd-btn-primary" onClick={() => navigate('/create-report')}>
                  Report a Water Issue
                </button>
              </div>
            ) : (
              <>
                {/* MOBILE: card list */}
                <div className="cd-mobile-list">
                  {paginatedReports.map((report) => (
                    <div key={report.id} className="cd-mobile-card" onClick={() => setSelectedReport(report)}>
                      {/* Row 1: ID + badges */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>#{report.id.slice(0, 8)}</span>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <span style={badgeStyle(getRiskBadge(report.risk_level || 'LOW'))}>{report.risk_level || 'LOW'}</span>
                          <span style={badgeStyle(getStatusBadge(report.status))}>{getStatusDisplay(report.status)}</span>
                        </div>
                      </div>
                      {report.status === 'REJECTED' && report.rejection_reason && (
                        <p style={{ fontSize: 11, color: '#F87171', marginBottom: 6 }}>Reason: {report.rejection_reason}</p>
                      )}

                      {/* Row 2: Description */}
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 10, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {report.description}
                      </p>

                      {/* Row 3: category · date */}
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 12 }}>
                        <span style={{ fontWeight: 600, textTransform: 'capitalize', color: getCategoryColor(report.category, report.ai_processed) }}>
                          {report.ai_processed ? (report.category || "Processing...") : "Processing..."}
                        </span>
                        <span style={{ margin: '0 6px' }}>·</span>
                        <span>{new Date(report.created_at).toLocaleDateString()}</span>
                      </p>

                      {/* AI info */}
                      {report.ai_processed && (
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>
                          {report.final_confidence && (
                            <p>Confidence: {report.final_confidence > 1 ? `${report.final_confidence.toFixed(2)}%` : `${(report.final_confidence * 100).toFixed(2)}%`}</p>
                          )}
                          {report.ai_explanation && (
                            <p style={{ fontStyle: 'italic' }}>{report.ai_explanation}</p>
                          )}
                        </div>
                      )}

                      {/* Row 4: buttons */}
                      <div style={{ display: 'flex', gap: 8 }} onClick={(e) => e.stopPropagation()}>
                        <button className="cd-btn-sm" style={{ background: '#3B82F6', color: 'white' }} onClick={() => navigate(`/track/${report.id}`)}>Track</button>
                        {report.status === 'PENDING' && (
                          <button className="cd-btn-sm" style={{ background: 'rgba(34,197,94,0.15)', color: '#4ADE80', border: '1px solid rgba(34,197,94,0.25)' }} onClick={() => navigate(`/edit-report/${report.id}`)}>Edit</button>
                        )}
                        <button className="cd-btn-sm" style={{ background: 'rgba(239,68,68,0.12)', color: '#F87171', border: '1px solid rgba(239,68,68,0.25)' }} onClick={() => handleDeleteClick(report.id)}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                      Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, reports.length)} of {reports.length}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button className="cd-pagination-btn" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>← Prev</button>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', padding: '0 8px' }}>Page {currentPage} of {totalPages}</span>
                      <button className="cd-pagination-btn" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>Next →</button>
                    </div>
                  </div>
                )}

                {/* DESKTOP: table */}
                <div className="cd-desktop-table" style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 480 }}>
                  <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        {['ID', 'Description', 'Category', 'Risk', 'Status', 'Created', 'Actions'].map(h => (
                          <th key={h} style={{ padding: '14px 18px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.35)', fontFamily: 'Inter, sans-serif', position: 'sticky', top: 0, background: 'rgba(5,11,24,0.95)', backdropFilter: 'blur(10px)', zIndex: 5 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedReports.map((report) => (
                        <tr key={report.id} className="cd-table-row" onClick={() => setSelectedReport(report)}>
                          <td style={{ padding: '14px 18px', fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>#{report.id.slice(0, 8)}</td>
                          <td style={{ padding: '14px 18px', color: 'rgba(255,255,255,0.8)', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={report.description}>{report.description}</td>
                          <td style={{ padding: '14px 18px' }}>
                            <span style={{ fontWeight: 600, textTransform: 'capitalize', color: getCategoryColor(report.category, report.ai_processed) }}>
                              {report.ai_processed ? (report.category || "Processing...") : "Processing..."}
                            </span>
                          </td>
                          <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}><span style={badgeStyle(getRiskBadge(report.risk_level || 'LOW'))}>{report.risk_level || 'LOW'}</span></td>
                          <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}><span style={badgeStyle(getStatusBadge(report.status))}>{getStatusDisplay(report.status)}</span></td>
                          <td style={{ padding: '14px 18px', whiteSpace: 'nowrap', fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{new Date(report.created_at).toLocaleDateString()}</td>
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button className="cd-btn-sm" style={{ background: '#3B82F6', color: 'white' }} onClick={(e) => { e.stopPropagation(); navigate(`/track/${report.id}`) }}>Track</button>
                              {report.status === 'PENDING' && (
                                <button className="cd-btn-sm" style={{ background: 'rgba(34,197,94,0.15)', color: '#4ADE80', border: '1px solid rgba(34,197,94,0.25)' }} onClick={(e) => { e.stopPropagation(); navigate(`/edit-report/${report.id}`) }}>Edit</button>
                              )}
                              <button className="cd-btn-sm" style={{ background: 'rgba(239,68,68,0.12)', color: '#F87171', border: '1px solid rgba(239,68,68,0.25)' }} onClick={(e) => { e.stopPropagation(); handleDeleteClick(report.id) }}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </motion.div>
        </div>

        {selectedReport && <ReportModal report={selectedReport} isAdmin={false} onClose={() => setSelectedReport(null)} />}

        {showDeleteModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
            <div style={{ background: 'rgba(15,20,35,0.95)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', borderRadius: 20, padding: 32, width: '100%', maxWidth: 420, boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <svg width="24" height="24" fill="none" stroke="#F87171" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700, textAlign: 'center', marginBottom: 8 }}>Delete Report</h3>
              <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 28 }}>Are you sure you want to delete this report? This action cannot be undone.</p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => { setShowDeleteModal(false); setDeleteReportId(null) }} style={{ flex: 1, padding: '12px 20px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: 500, fontFamily: 'Inter, sans-serif', cursor: 'pointer', transition: 'all 0.2s' }}>Cancel</button>
                <button onClick={handleDelete} style={{ flex: 1, padding: '12px 20px', background: 'rgba(239,68,68,0.9)', border: 'none', borderRadius: 12, color: 'white', fontSize: 14, fontWeight: 600, fontFamily: 'Inter, sans-serif', cursor: 'pointer', transition: 'all 0.2s' }}>Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default CitizenDashboard