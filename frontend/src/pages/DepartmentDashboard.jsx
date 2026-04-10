import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../config/api'
import Navbar from '../components/Navbar'
import ReportModal from '../components/ReportModal'
import toast from 'react-hot-toast'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' }
  })
}

const RISK_BADGE = {
  HIGH:   { bg: 'rgba(239,68,68,0.12)', color: '#F87171', border: 'rgba(239,68,68,0.25)' },
  MEDIUM: { bg: 'rgba(245,158,11,0.12)', color: '#FBBF24', border: 'rgba(245,158,11,0.25)' },
  LOW:    { bg: 'rgba(34,197,94,0.12)', color: '#4ADE80', border: 'rgba(34,197,94,0.25)' },
}
const STATUS_BADGE = {
  submitted:        { bg: 'rgba(245,158,11,0.12)', color: '#FBBF24', border: 'rgba(245,158,11,0.25)' },
  in_progress:     { bg: 'rgba(59,130,246,0.12)', color: '#60A5FA', border: 'rgba(59,130,246,0.25)' },
  assigned:         { bg: 'rgba(99,102,241,0.12)', color: '#A78BFA', border: 'rgba(99,102,241,0.25)' },
  awaiting_review: { bg: 'rgba(167,139,250,0.12)', color: '#A78BFA', border: 'rgba(167,139,250,0.25)' },
  resolved:         { bg: 'rgba(34,197,94,0.12)', color: '#4ADE80', border: 'rgba(34,197,94,0.25)' },
  rejected:         { bg: 'rgba(239,68,68,0.12)', color: '#F87171', border: 'rgba(239,68,68,0.25)' },
}
const CATEGORY_BADGE = {
  contamination: { bg: 'rgba(239,68,68,0.12)', color: '#F87171', border: 'rgba(239,68,68,0.25)' },
  blockage: { bg: 'rgba(245,158,11,0.12)', color: '#FBBF24', border: 'rgba(245,158,11,0.25)' },
  leakage: { bg: 'rgba(59,130,246,0.12)', color: '#60A5FA', border: 'rgba(59,130,246,0.25)' },
}

const pillStyle = (b) => ({
  display: 'inline-flex', alignItems: 'center',
  padding: '4px 12px', borderRadius: 999,
  fontSize: 11, fontWeight: 600, fontFamily: 'Inter, sans-serif',
  background: b?.bg || 'rgba(255,255,255,0.06)',
  color: b?.color || 'rgba(255,255,255,0.5)',
  border: `1px solid ${b?.border || 'rgba(255,255,255,0.1)'}`,
})

function DepartmentDashboard() {
  const { department } = useAuth()
  const [reports, setReports] = useState([])
  const [filteredReports, setFilteredReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState({})
  const [filters, setFilters] = useState({ risk: '', status: '' })
  const [selectedReport, setSelectedReport] = useState(null)
  const [resolutionModal, setResolutionModal] = useState(null)
  const [resolutionImage, setResolutionImage] = useState(null)
  const [pagination, setPagination] = useState({
    page: 1, limit: 10, total_count: 0, total_pages: 0, has_next: false, has_prev: false
  })

  useEffect(() => { fetchReports(1, filters) }, [])
  useEffect(() => { fetchReports(1, filters) }, [filters])

  const fetchReports = async (page = 1, currentFilters = filters) => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams({ page, limit: 10, ai_processed: true })
      if (currentFilters.status) params.append('status', currentFilters.status)
      if (currentFilters.risk) params.append('risk_level', currentFilters.risk)
      const data = await apiFetch(`/department/reports?${params.toString()}`)
      if (data.status === 'success') {
        setReports(data.data || [])
        setFilteredReports(data.data || [])
        setPagination(data.pagination || {})
      } else {
        setError(data.message || 'Failed to fetch reports')
      }
    } catch (err) {
      toast.error('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (newPage) => fetchReports(newPage, filters)
  const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }))

  const handleAction = async (reportId, action) => {
    if (action === 'resolve') {
      setResolutionModal(reportId)
      return
    }
    
    setActionLoading(prev => ({ ...prev, [reportId]: action }))
    try {
      await apiFetch(`/reports/${reportId}/${action}`, { method: 'PUT' })
      await fetchReports()
      toast.success('Report updated successfully')
    } catch (err) {
      toast.error(`Failed to update report`)
    } finally {
      setActionLoading(prev => ({ ...prev, [reportId]: null }))
    }
  }

  const handleResolve = async (withPhoto = false) => {
    const reportId = resolutionModal
    setResolutionModal(null)
    setActionLoading(prev => ({ ...prev, [reportId]: 'resolve' }))
    
    try {
      if (withPhoto && resolutionImage) {
        // Upload with image
        const formData = new FormData()
        formData.append('file', resolutionImage)
        await apiFetch(`/reports/${reportId}/resolve`, { 
          method: 'PUT', 
          body: formData,
          headers: {} // Let browser set multipart boundary
        })
      } else {
        // Resolve without photo
        await apiFetch(`/reports/${reportId}/resolve`, { method: 'PUT' })
      }
      
      await fetchReports()
      toast.success('Marked as complete. Awaiting admin review.')
    } catch (err) {
      toast.error(`Failed to resolve report`)
    } finally {
      setActionLoading(prev => ({ ...prev, [reportId]: null }))
      setResolutionImage(null)
    }
  }

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'submitted': return 'Submitted'
      case 'in_progress': return 'In Progress'
      case 'assigned': return 'Assigned'
      case 'resolved': return 'Resolved'
      case 'rejected': return 'Rejected'
      default: return status
    }
  }

  const deptLabel = department
    ? department.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : 'Department'

  const totalAssigned = pagination.total_count || reports.length
  const inProgressCount = reports.filter(r => r.status === 'in_progress').length
  const resolvedCount = reports.filter(r => r.status === 'resolved').length

  const statCards = [
    { label: 'Total Assigned', value: totalAssigned, icon: '📋', accent: '#3B82F6' },
    { label: 'In Progress', value: inProgressCount, icon: '⚡', accent: '#F59E0B' },
    { label: 'Resolved', value: resolvedCount, icon: '✓', accent: '#22C55E' },
  ]

  if (loading) {
    return (
      <>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@300;400;500;600&display=swap');`}</style>
        <div style={{ background: '#050B18', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
          <Navbar />
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '100px 16px 40px' }}>
            <div style={{ height: 32, width: 280, background: 'rgba(255,255,255,0.06)', borderRadius: 12, marginBottom: 24 }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
              {[1,2,3].map(i => <div key={i} style={{ height: 110, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16 }} />)}
            </div>
            <div style={{ height: 400, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16 }} />
          </div>
        </div>
      </>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@300;400;500;600&display=swap');
        .dd-page { background: #050B18; min-height: 100vh; font-family: 'Inter', sans-serif; color: white; position: relative; overflow-x: hidden; }
        .dd-grid-bg { position: fixed; inset: 0; background-image: linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px); background-size: 50px 50px; pointer-events: none; }
        .dd-orb { position: fixed; border-radius: 50%; filter: blur(80px); animation: ddFloat 8s ease-in-out infinite; pointer-events: none; }
        @keyframes ddFloat { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-30px) scale(1.05)} }
        .dd-glass { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(20px); border-radius: 16px; }
        .dd-stat-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); backdrop-filter: blur(20px); border-radius: 16px; padding: 24px; position: relative; overflow: hidden; transition: all 0.3s ease; cursor: default; }
        .dd-stat-card:hover { transform: translateY(-4px); border-color: rgba(59,130,246,0.3); box-shadow: 0 12px 40px rgba(59,130,246,0.1); }
        .dd-stat-card::before { content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(59,130,246,0.06), transparent); transition: left 0.6s ease; }
        .dd-stat-card:hover::before { left: 100%; }
        .dd-table-row { cursor: pointer; transition: all 0.15s ease; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .dd-table-row:hover { background: rgba(59,130,246,0.06); }
        .dd-select { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 12px 16px; color: white; font-size: 13px; font-family: 'Inter', sans-serif; outline: none; transition: border-color 0.2s; width: 100%; appearance: auto; cursor: pointer; }
        .dd-select:focus { border-color: #3B82F6; }
        .dd-select option { background: #0F1423; color: white; }
        .dd-pagination-btn { background: transparent; color: rgba(255,255,255,0.6); border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; padding: 6px 14px; font-size: 13px; font-family: 'Inter', sans-serif; cursor: pointer; transition: all 0.2s ease; }
        .dd-pagination-btn:hover:not(:disabled) { background: rgba(255,255,255,0.06); color: white; border-color: rgba(255,255,255,0.25); }
        .dd-pagination-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .dd-btn-resolve { background: rgba(34,197,94,0.15); color: #4ADE80; border: 1px solid rgba(34,197,94,0.25); border-radius: 8px; padding: 6px 14px; font-size: 12px; font-weight: 600; font-family: 'Inter', sans-serif; cursor: pointer; transition: all 0.2s ease; }
        .dd-btn-resolve:hover:not(:disabled) { background: rgba(34,197,94,0.25); box-shadow: 0 4px 12px rgba(34,197,94,0.2); }
        .dd-btn-resolve:disabled { opacity: 0.4; cursor: not-allowed; }
        @media (max-width: 768px) { .dd-desktop { display: none !important; } }
        @media (min-width: 769px) { .dd-mobile { display: none !important; } }
        @media (max-width: 640px) {
          .dept-stat-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>

      <div className="dd-page">
        <div className="dd-grid-bg" />
        <div className="dd-orb" style={{ width: 450, height: 450, background: 'rgba(59,130,246,0.08)', top: '-5%', right: '-10%' }} />
        <div className="dd-orb" style={{ width: 350, height: 350, background: 'rgba(34,197,94,0.06)', bottom: '10%', left: '-8%', animationDelay: '4s' }} />

        <Navbar />
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '100px 16px 60px', position: 'relative', zIndex: 10 }}>

          {/* Page header */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}
            style={{ marginBottom: 28 }}
          >
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 4 }}>{deptLabel} Dashboard</h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Manage and resolve reports assigned to your department</p>
          </motion.div>

          {/* Error */}
          {error && (
            <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: '#FCA5A5', marginBottom: 20 }}
            >
              <span>{error}</span>
              <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 700, opacity: 0.6, fontSize: 14 }}>✕</button>
            </motion.div>
          )}

          {/* Stat cards */}
          <div className="dept-stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
            {statCards.map((s, i) => (
              <motion.div key={s.label} className="dd-stat-card" variants={fadeUp} initial="hidden" animate="visible" custom={i + 1}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: `${s.accent}15`, border: `1px solid ${s.accent}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 16, fontSize: 20,
                  position: 'relative', zIndex: 1
                }}>
                  {s.icon}
                </div>
                <p style={{ fontSize: 28, fontWeight: 800, fontFamily: 'Syne, sans-serif', color: s.accent, position: 'relative', zIndex: 1 }}>{s.value}</p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4, fontWeight: 500, position: 'relative', zIndex: 1 }}>{s.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Filters */}
          <motion.div className="dd-glass" style={{ padding: 24, marginBottom: 20 }} variants={fadeUp} initial="hidden" animate="visible" custom={4}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Filters</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Risk Level</label>
                <select value={filters.risk} onChange={(e) => handleFilterChange('risk', e.target.value)} className="dd-select">
                  <option value="">All Risks</option>
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Status</label>
                <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)} className="dd-select">
                  <option value="">All Statuses</option>
                  <option value="submitted">Submitted</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Reports Table */}
          <motion.div className="dd-glass" style={{ overflow: 'hidden' }} variants={fadeUp} initial="hidden" animate="visible" custom={5}>
            {filteredReports.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '64px 24px' }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>📋</div>
                <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No reports found</h3>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>Try adjusting your filters or check back later.</p>
              </div>
            ) : (
              <>
                {/* Mobile */}
                <div className="dd-mobile">
                  {filteredReports.map((report) => (
                    <div key={report.id} onClick={() => setSelectedReport(report)}
                      style={{ padding: 20, cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.06)', transition: 'background 0.15s' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>#{report.id.slice(0, 8)}</span>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <span style={pillStyle(RISK_BADGE[report.risk_level] || RISK_BADGE.LOW)}>{report.risk_level}</span>
                          <span style={pillStyle(STATUS_BADGE[report.status])}>{getStatusDisplay(report.status)}</span>
                        </div>
                      </div>
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 10, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{report.description}</p>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>
                        <span style={pillStyle(CATEGORY_BADGE[report.category?.toLowerCase()])}>{report.category || 'other'}</span>
                        <span style={{ margin: '0 8px', color: 'rgba(255,255,255,0.2)' }}>·</span>
                        <span>{new Date(report.created_at).toLocaleDateString()}</span>
                      </p>
                      <div style={{ display: 'flex', gap: 8 }} onClick={(e) => e.stopPropagation()}>
                        {report.status === 'in_progress' && (
                          <button onClick={() => handleAction(report.id, 'resolve')} disabled={!!actionLoading[report.id]} className="dd-btn-resolve" style={{ flex: 1 }}>
                            {actionLoading[report.id] === 'resolve' ? 'Updating...' : 'Mark Complete'}
                          </button>
                        )}
                        {report.status === 'resolved' && (
                          <span style={{ fontSize: 12, color: '#4ADE80', fontWeight: 600 }}>Done</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop */}
                <div className="dd-desktop" style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 520 }}>
                  <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                    <colgroup>
                      <col style={{ width: 100 }} /><col style={{ width: 260 }} /><col style={{ width: 120 }} />
                      <col style={{ width: 90 }} /><col style={{ width: 130 }} /><col style={{ width: 120 }} /><col style={{ width: 130 }} />
                    </colgroup>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        {['ID', 'Description', 'Category', 'Risk', 'Status', 'Created', 'Actions'].map(h => (
                          <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.35)', fontFamily: 'Inter, sans-serif', position: 'sticky', top: 0, background: 'rgba(5,11,24,0.95)', backdropFilter: 'blur(10px)', zIndex: 5, whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReports.map((report) => (
                        <tr key={report.id} className="dd-table-row" onClick={() => setSelectedReport(report)}>
                          <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>#{report.id.slice(0, 8)}</td>
                          <td style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.8)' }}>
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240 }} title={report.description}>
                              {report.description || <span style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.3)' }}>No description</span>}
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={pillStyle(CATEGORY_BADGE[report.category?.toLowerCase()])}>{report.category || 'other'}</span>
                          </td>
                          <td style={{ padding: '14px 16px' }}><span style={pillStyle(RISK_BADGE[report.risk_level] || RISK_BADGE.LOW)}>{report.risk_level}</span></td>
                          <td style={{ padding: '14px 16px' }}><span style={pillStyle(STATUS_BADGE[report.status])}>{getStatusDisplay(report.status)}</span></td>
                          <td style={{ padding: '14px 16px', fontSize: 12, color: 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap' }}>{new Date(report.created_at).toLocaleDateString()}</td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
                              {report.status === 'in_progress' && (
                                <button onClick={() => handleAction(report.id, 'resolve')} disabled={!!actionLoading[report.id]} className="dd-btn-resolve">
                                  {actionLoading[report.id] === 'resolve' ? 'Updating...' : 'Mark Complete'}
                                </button>
                              )}
                              {report.status === 'resolved' && (
                                <span style={{ fontSize: 12, color: '#4ADE80', fontWeight: 600 }}>✓ Done</span>
                              )}
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

          {/* Pagination */}
          {pagination.total_pages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, marginTop: 16 }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total_count)} of {pagination.total_count} reports
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button className="dd-pagination-btn" onClick={() => handlePageChange(pagination.page - 1)} disabled={!pagination.has_prev}>← Prev</button>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', padding: '0 8px' }}>Page {pagination.page} of {pagination.total_pages}</span>
                <button className="dd-pagination-btn" onClick={() => handlePageChange(pagination.page + 1)} disabled={!pagination.has_next}>Next →</button>
              </div>
            </div>
          )}

        </div>
      </div>

      {selectedReport && (
        <ReportModal
          report={selectedReport}
          isAdmin={false}
          isDepartment={true}
          onClose={() => setSelectedReport(null)}
          onResolve={(id) => { handleAction(id, 'resolve'); setSelectedReport(null) }}
        />
      )}

      {/* Resolution Modal */}
      {resolutionModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setResolutionModal(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{
              background: 'rgba(15,23,42,0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 16,
              padding: 24,
              width: '90%',
              maxWidth: 480,
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ color: 'white', fontSize: 20, fontWeight: 600, marginBottom: 16 }}>
              Mark as Resolved
            </h3>
            
            <div style={{
              background: 'rgba(34,197,94,0.1)',
              border: '1px solid rgba(34,197,94,0.25)',
              borderRadius: 12,
              padding: '14px 18px',
              marginBottom: 20
            }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#4ADE80', marginBottom: 4 }}>
                Upload a photo showing the issue has been resolved (optional)
              </p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                This helps verify that the water issue has been properly addressed.
              </p>
            </div>

            {/* File Upload Area */}
            <div
              style={{
                border: '2px dashed rgba(255,255,255,0.2)',
                borderRadius: 12,
                padding: 32,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: resolutionImage ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.02)',
                borderColor: resolutionImage ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.2)',
                marginBottom: 20
              }}
              onClick={() => document.getElementById('resolution-file-input').click()}
              onDragOver={(e) => {
                e.preventDefault()
                e.currentTarget.style.borderColor = 'rgba(59,130,246,0.6)'
                e.currentTarget.style.background = 'rgba(59,130,246,0.05)'
              }}
              onDragLeave={(e) => {
                e.preventDefault()
                e.currentTarget.style.borderColor = resolutionImage ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.2)'
                e.currentTarget.style.background = resolutionImage ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.02)'
              }}
              onDrop={(e) => {
                e.preventDefault()
                const file = e.dataTransfer.files[0]
                if (file && file.type.startsWith('image/')) {
                  setResolutionImage(file)
                }
                e.currentTarget.style.borderColor = resolutionImage ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.2)'
                e.currentTarget.style.background = resolutionImage ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.02)'
              }}
            >
              <input
                id="resolution-file-input"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files[0]
                  if (file) setResolutionImage(file)
                }}
              />
              
              {resolutionImage ? (
                <div>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>#</div>
                  <p style={{ color: '#60A5FA', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                    {resolutionImage.name}
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                    Click to change or drag a new image
                  </p>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>#</div>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                    Click to upload or drag & drop
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                    JPG, PNG, WEBP (max 10MB)
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button
                onClick={() => handleResolve(false)}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  background: 'rgba(107,114,128,0.2)',
                  border: '1px solid rgba(107,114,128,0.3)',
                  borderRadius: 8,
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(107,114,128,0.3)'
                  e.currentTarget.style.borderColor = 'rgba(107,114,128,0.4)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(107,114,128,0.2)'
                  e.currentTarget.style.borderColor = 'rgba(107,114,128,0.3)'
                }}
              >
                Resolve Without Photo
              </button>
              
              <button
                onClick={() => handleResolve(true)}
                disabled={!resolutionImage}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  background: resolutionImage ? 'rgba(34,197,94,0.2)' : 'rgba(34,197,94,0.1)',
                  border: '1px solid rgba(34,197,94,0.4)',
                  borderRadius: 8,
                  color: resolutionImage ? '#4ADE80' : 'rgba(74,222,128,0.5)',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: resolutionImage ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  if (resolutionImage) {
                    e.currentTarget.style.background = 'rgba(34,197,94,0.3)'
                    e.currentTarget.style.borderColor = 'rgba(34,197,94,0.5)'
                  }
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = resolutionImage ? 'rgba(34,197,94,0.2)' : 'rgba(34,197,94,0.1)'
                  e.currentTarget.style.borderColor = 'rgba(34,197,94,0.4)'
                }}
              >
                Resolve With Photo
              </button>
            </div>

            {/* Cancel Button */}
            <button
              onClick={() => {
                setResolutionModal(null)
                setResolutionImage(null)
              }}
              style={{
                width: '100%',
                padding: '10px',
                background: 'transparent',
                border: 'none',
                color: 'rgba(255,255,255,0.5)',
                fontSize: 13,
                cursor: 'pointer',
                marginTop: 12,
                transition: 'color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
              onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
            >
              Cancel
            </button>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}

export default DepartmentDashboard
