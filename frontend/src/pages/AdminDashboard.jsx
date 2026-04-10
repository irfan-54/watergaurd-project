import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'
import ReportModal from '../components/ReportModal'
import { apiFetch } from '../config/api'
import toast from 'react-hot-toast'

// ── Icon components ──────────────────────────────────────────────────────────
const Icon = ({ d, size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} fill="none" stroke={color} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={d} />
  </svg>
)
const IconReport  = () => <Icon d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
const IconAlert   = () => <Icon d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
const IconCheck   = () => <Icon d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
const IconClock   = () => <Icon d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
const IconSearch  = () => <Icon d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" size={16} />
const IconDownload= () => <Icon d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" size={16} />
const IconUsers   = () => <Icon d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
const IconFilter  = () => <Icon d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" size={16} />

// ── Badge helpers ─────────────────────────────────────────────────────────────
const RISK_BADGE = {
  HIGH:   { bg: 'rgba(239,68,68,0.12)', color: '#F87171', border: 'rgba(239,68,68,0.25)' },
  MEDIUM: { bg: 'rgba(245,158,11,0.12)', color: '#FBBF24', border: 'rgba(245,158,11,0.25)' },
  LOW:    { bg: 'rgba(34,197,94,0.12)', color: '#4ADE80', border: 'rgba(34,197,94,0.25)' },
}
const STATUS_BADGE = {
  submitted:        { bg: 'rgba(245,158,11,0.12)', color: '#FBBF24', border: 'rgba(245,158,11,0.25)' },
  PENDING:          { bg: 'rgba(245,158,11,0.12)', color: '#FBBF24', border: 'rgba(245,158,11,0.25)' },
  pending:          { bg: 'rgba(245,158,11,0.12)', color: '#FBBF24', border: 'rgba(245,158,11,0.25)' },
  in_progress:     { bg: 'rgba(59,130,246,0.12)', color: '#60A5FA', border: 'rgba(59,130,246,0.25)' },
  IN_PROGRESS:      { bg: 'rgba(59,130,246,0.12)', color: '#60A5FA', border: 'rgba(59,130,246,0.25)' },
  assigned:         { bg: 'rgba(99,102,241,0.12)', color: '#A78BFA', border: 'rgba(99,102,241,0.25)' },
  ASSIGNED:         { bg: 'rgba(99,102,241,0.12)', color: '#A78BFA', border: 'rgba(99,102,241,0.25)' },
  awaiting_review: { bg: 'rgba(167,139,250,0.12)', color: '#A78BFA', border: 'rgba(167,139,250,0.25)' },
  resolved:         { bg: 'rgba(34,197,94,0.12)', color: '#4ADE80', border: 'rgba(34,197,94,0.25)' },
  RESOLVED:         { bg: 'rgba(34,197,94,0.12)', color: '#4ADE80', border: 'rgba(34,197,94,0.25)' },
  rejected:         { bg: 'rgba(239,68,68,0.12)', color: '#F87171', border: 'rgba(239,68,68,0.25)' },
  REJECTED:         { bg: 'rgba(239,68,68,0.12)', color: '#F87171', border: 'rgba(239,68,68,0.25)' },
}
const ROLE_BADGE = {
  admin:      { bg: 'rgba(167,139,250,0.12)', color: '#A78BFA', border: 'rgba(167,139,250,0.25)' },
  department: { bg: 'rgba(59,130,246,0.12)', color: '#60A5FA', border: 'rgba(59,130,246,0.25)' },
  user:       { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: 'rgba(255,255,255,0.1)' },
}
const CATEGORY_COLORS = {
  contamination: '#F87171',
  blockage: '#FBBF24',
  leakage: '#60A5FA',
}

const badgeStyle = (b) => ({
  display: 'inline-flex', alignItems: 'center',
  padding: '4px 12px', borderRadius: 999,
  fontSize: 11, fontWeight: 600, fontFamily: 'Inter, sans-serif',
  background: b?.bg || 'rgba(255,255,255,0.06)',
  color: b?.color || 'rgba(255,255,255,0.5)',
  border: `1px solid ${b?.border || 'rgba(255,255,255,0.1)'}`,
})

const Badge = ({ label, badgeData }) => (
  <span style={badgeStyle(badgeData)}>{label}</span>
)

const getStatusDisplay = s => ({ 
  submitted:'Submitted', 
  PENDING:'Submitted',
  pending:'Submitted',
  assigned:'Assigned', 
  ASSIGNED:'Assigned',
  in_progress:'In Progress', 
  IN_PROGRESS:'In Progress',
  awaiting_review:'Awaiting Review',
  resolved:'Resolved', 
  RESOLVED:'Resolved',
  rejected:'Rejected',
  REJECTED:'Rejected'
}[s] || s)

// ── Stat card ─────────────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' }
  })
}

// ── Action button ─────────────────────────────────────────────────────────────
const ActionBtn = ({ onClick, disabled, variant = 'primary', children, small }) => {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    fontWeight: 600, fontFamily: 'Inter, sans-serif',
    borderRadius: small ? 8 : 12, cursor: 'pointer',
    transition: 'all 0.2s ease', border: 'none',
    padding: small ? '6px 14px' : '10px 20px',
    fontSize: small ? 12 : 14,
    opacity: disabled ? 0.4 : 1,
    pointerEvents: disabled ? 'none' : 'auto',
  }
  const variants = {
    primary: { background: '#3B82F6', color: 'white' },
    success: { background: 'rgba(34,197,94,0.15)', color: '#4ADE80', border: '1px solid rgba(34,197,94,0.25)' },
    danger:  { background: 'rgba(239,68,68,0.12)', color: '#F87171', border: '1px solid rgba(239,68,68,0.25)' },
    ghost:   { background: 'transparent', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.12)' },
  }
  return <button onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant] }}>{children}</button>
}

// ── Modal wrapper ─────────────────────────────────────────────────────────────
const Modal = ({ title, children, onClose }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.18 }}
      style={{ background: 'rgba(15,20,35,0.95)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', borderRadius: 20, width: '100%', maxWidth: 440, boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: 'white' }}>{title}</h3>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', transition: 'all 0.2s' }}>
          <Icon d="M6 18L18 6M6 6l12 12" size={16} />
        </button>
      </div>
      <div style={{ padding: '20px 24px' }}>{children}</div>
    </motion.div>
  </div>
)

// ── Tab button ────────────────────────────────────────────────────────────────
const Tab = ({ label, active, onClick, badge }) => (
  <button
    onClick={onClick}
    style={{
      padding: '10px 20px', fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif',
      borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s ease', border: 'none',
      background: active ? '#3B82F6' : 'transparent',
      color: active ? 'white' : 'rgba(255,255,255,0.5)',
      ...(active ? {} : { border: '1px solid rgba(255,255,255,0.1)' }),
    }}
  >
    {label}
    {badge != null && (
      <span style={{ marginLeft: 8, fontSize: 11, padding: '2px 8px', borderRadius: 999, background: active ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)', color: active ? 'white' : 'rgba(255,255,255,0.4)' }}>
        {badge}
      </span>
    )}
  </button>
)

// ── Select ────────────────────────────────────────────────────────────────────
const Select = ({ value, onChange, options, placeholder, className = '', style = {} }) => (
  <select
    value={value}
    onChange={e => onChange(e.target.value)}
    style={{
      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 12, padding: '10px 14px', color: 'white', fontSize: 13,
      fontFamily: 'Inter, sans-serif', outline: 'none', cursor: 'pointer',
      transition: 'border-color 0.2s', appearance: 'auto', ...style,
    }}
    className={className}
  >
    {placeholder && <option value="" style={{ background: '#0F1423', color: 'rgba(255,255,255,0.6)' }}>{placeholder}</option>}
    {options.map(o => <option key={o.value} value={o.value} style={{ background: '#0F1423', color: 'white' }}>{o.label}</option>)}
  </select>
)

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
function AdminDashboard() {
  const [reports, setReports]               = useState([])
  const [loading, setLoading]               = useState(true)
  const [error, setError]                   = useState(null)
  const [isDbError, setIsDbError]           = useState(false)
  const [startingWorkIds, setStartingWorkIds] = useState(new Set())
  const [deleteConfirmation, setDeleteConfirmation] = useState(null)
  const [assignModal, setAssignModal]       = useState(null)
  const [rejectConfirmation, setRejectConfirmation] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [selectedReport, setSelectedReport] = useState(null)
  const [filters, setFilters]               = useState({ risk: '', category: '', status: '' })
  const [searchEmail, setSearchEmail]       = useState('')
  const [activeTab, setActiveTab]           = useState('reports')
  const [pagination, setPagination]         = useState({ page:1, limit:10, total_count:0, total_pages:0, has_next:false, has_prev:false })

  // User management
  const [users, setUsers]                   = useState([])
  const [usersLoading, setUsersLoading]     = useState(false)
  const [usersError, setUsersError]         = useState(null)
  const [updatingUserId, setUpdatingUserId] = useState(null)
  const [userEdits, setUserEdits]           = useState({})
  const [updateSuccess, setUpdateSuccess]   = useState(null)
  const [userSearch, setUserSearch]         = useState('')
  const [roleFilter, setRoleFilter]         = useState('')

  // Export
  const [exportFilters, setExportFilters]   = useState({ dateRange:'all', category:'', status:'', risk:'' })
  const [exporting, setExporting]           = useState(false)
  const [showExport, setShowExport]         = useState(false)

  // Bulk
  const [selectedIds, setSelectedIds]       = useState(new Set())
  const [bulkAction, setBulkAction]         = useState('')
  const [bulkLoading, setBulkLoading]       = useState(false)

  useEffect(() => { fetchReports(1, filters) }, [])
  useEffect(() => { fetchReports(1, filters) }, [filters])
  useEffect(() => { if (activeTab === 'users') fetchUsers() }, [activeTab])

  const filteredUsers = useMemo(() =>
    users.filter(u => {
      const ms = u.email.toLowerCase().includes(userSearch.toLowerCase())
      const mr = roleFilter ? u.role === roleFilter : true
      return ms && mr
    }), [users, userSearch, roleFilter])

  const filteredReports = useMemo(() =>
    reports.filter(report => {
      const matchesRisk = !filters.risk || report.risk_level === filters.risk
      const matchesCategory = !filters.category || report.category === filters.category
      const matchesStatus = !filters.status || report.status === filters.status
      const matchesEmail = !searchEmail || report.submitter_email?.toLowerCase().includes(searchEmail.toLowerCase())
      return matchesRisk && matchesCategory && matchesStatus && matchesEmail
    }), [reports, filters, searchEmail])

  const fetchReports = async (page = 1, currentFilters = filters) => {
    try {
      setLoading(true); setError(null); setIsDbError(false)
      const params = new URLSearchParams({ page, limit: 10, ai_processed: true })
      if (currentFilters.status)   params.append('status', currentFilters.status)
      if (currentFilters.category) params.append('category', currentFilters.category)
      if (currentFilters.risk)     params.append('risk_level', currentFilters.risk)
      const data = await apiFetch(`/reports?${params.toString()}`)
      if (data.status === 'success') {
        setReports(data.data || [])
        setPagination(data.pagination || {})
      } else {
        setError(data.message || 'Failed to fetch reports')
        setReports([])
        setPagination({})
      }
    } catch (err) { 
      const errorMsg = err.message || 'Failed to connect to server'
      setError(errorMsg)
      setIsDbError(errorMsg.includes('connect') || errorMsg.includes('network') || errorMsg.includes('fetch'))
      setReports([])
      setPagination({})
    }
    finally { setLoading(false) }
  }

  const fetchUsers = async () => {
    try {
      setUsersLoading(true); setUsersError(null)
      const { data, error } = await supabase.from('profiles').select('id, email, role, department').order('email')
      if (error) throw error
      setUsers(data || [])
      const edits = {}
      data.forEach(u => { edits[u.id] = { role: u.role || 'user', department: u.department || '' } })
      setUserEdits(edits)
    } catch (err) { setUsersError('Failed to fetch users: ' + err.message) }
    finally { setUsersLoading(false) }
  }

  const handleUserEditChange = (userId, field, value) => {
    setUserEdits(prev => ({
      ...prev,
      [userId]: { ...prev[userId], [field]: value, ...(field === 'role' && value !== 'department' ? { department: '' } : {}) }
    }))
  }

  const handleUpdateUserRole = async (userId) => {
    const edit = userEdits[userId]; if (!edit) return
    try {
      setUpdatingUserId(userId); setUsersError(null)
      const updates = { role: edit.role, department: edit.role === 'department' ? edit.department || null : null }
      const { error } = await supabase.from('profiles').update(updates).eq('id', userId)
      if (error) throw error
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u))
      setUpdateSuccess(userId); setTimeout(() => setUpdateSuccess(null), 2000)
    } catch (err) { setUsersError('Failed to update user: ' + err.message) }
    finally { setUpdatingUserId(null) }
  }

  const handlePageChange = newPage => fetchReports(newPage, filters)

  const toggleSelectReport = id => {
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.size === filteredReports.length ? new Set() : new Set(filteredReports.map(r => r.id)))
  }

  const handleBulkAction = async () => {
    if (!selectedIds.size) { toast.error('No reports selected'); return }
    if (!bulkAction) { toast.error('Please select an action'); return }
    setBulkLoading(true)
    try {
      const ids = Array.from(selectedIds)
      if (bulkAction === 'delete') {
        await Promise.all(ids.map(id => apiFetch(`/reports/${id}`, { method: 'DELETE' })))
        toast.success(`Deleted ${ids.length} reports`)
      } else {
        const deptMap = { assign_water: 'water_dept', assign_pwd: 'pwd', assign_health: 'health_dept' }
        const dept = deptMap[bulkAction]
        if (dept) {
          const fd = new FormData(); fd.append('department', dept)
          await Promise.all(ids.map(id => apiFetch(`/reports/${id}/assign`, { method: 'PUT', body: fd })))
          toast.success(`Assigned ${ids.length} reports`)
        }
      }
      setSelectedIds(new Set()); setBulkAction(''); await fetchReports()
    } catch { toast.error('Bulk action failed') }
    finally { setBulkLoading(false) }
  }

  const exportToCSV = (data, filename) => {
    const headers = ['ID','Description','Category','Risk Level','Status','Department','Submitted By','Created Date','Updated Date','Rejection Reason']
    const rows = data.map(r => [r.id, `"${(r.description||'').replace(/"/g,'""')}"`, r.category||'other', r.risk_level||'LOW', r.status||'', r.department||'', r.submitter_email||'', r.created_at?new Date(r.created_at).toLocaleDateString():'', r.updated_at?new Date(r.updated_at).toLocaleDateString():'', `"${(r.rejection_reason||'').replace(/"/g,'""')}"`])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type:'text/csv;charset=utf-8;' }))
    const a = Object.assign(document.createElement('a'), { href: url })
    a.setAttribute('download', filename); document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
  }

  const handleExportFiltered = async () => {
    try {
      setExporting(true)
      const params = new URLSearchParams({ page:1, limit:9999 })
      if (exportFilters.status)   params.append('status', exportFilters.status)
      if (exportFilters.category) params.append('category', exportFilters.category)
      if (exportFilters.risk)     params.append('risk_level', exportFilters.risk)
      const data = await apiFetch(`/reports?${params.toString()}`)
      if (data.status === 'success') {
        let rpts = data.data
        if (exportFilters.dateRange !== 'all') {
          const days = { '1d':1, '7d':7, '30d':30 }[exportFilters.dateRange]
          const cutoff = new Date(Date.now() - days * 864e5)
          rpts = rpts.filter(r => new Date(r.created_at) >= cutoff)
        }
        if (!rpts.length) { toast.error('No reports match filters'); return }
        const label = [exportFilters.dateRange !== 'all' ? exportFilters.dateRange : '', exportFilters.category, exportFilters.status, exportFilters.risk].filter(Boolean).join('_') || 'all'
        exportToCSV(rpts, `waterguard_${label}_${new Date().toISOString().slice(0,10)}.csv`)
        toast.success(`Exported ${rpts.length} reports`)
      }
    } catch { toast.error('Export failed') }
    finally { setExporting(false) }
  }

  const handleResolve   = async id => { try { await apiFetch(`/reports/${id}/resolve`, { method:'PUT' }); await fetchReports() } catch {} }
  const handleDelete    = id => setDeleteConfirmation(id)
  const cancelDelete    = () => setDeleteConfirmation(null)
  const confirmDelete   = async () => {
    const id = deleteConfirmation; setDeleteConfirmation(null)
    try {
      const data = await apiFetch(`/reports/${id}`, { method: 'DELETE' })
      if (data.status === 'success') setReports(prev => prev.filter(r => r.id !== id))
      else setError(data.message || 'Failed to delete report')
    } catch { setError('Failed to connect to server') }
  }

  const handleStartWork = async id => {
  const report = reports.find(r => r.id === id)
  if (!report) return
  
  // If already in progress, do nothing
  if (['in_progress', 'IN_PROGRESS'].includes(report.status)) return
  
  // If category is 'other' and not yet assigned, show manual assign modal
  if (report.category === 'other' && !['assigned', 'ASSIGNED'].includes(report.status)) {
    setAssignModal(id)
    return
  }
  
  if (startingWorkIds.has(id)) return
  
  const categoryDeptMap = {
    leakage: 'water_dept',
    contamination: 'health_dept',
    blockage: 'pwd',
  }
  const dept = categoryDeptMap[report.category]
  
  try {
    setStartingWorkIds(prev => new Set([...prev, id]))
    
    // Only call assign if not already assigned
    if (dept && !['assigned', 'ASSIGNED'].includes(report.status)) {
      const fd = new FormData()
      fd.append('department', dept)
      await apiFetch(`/reports/${id}/assign`, { method: 'PUT', body: fd })
    }
    
    // Always call start
    await apiFetch(`/reports/${id}/start`, { method: 'PUT' })
    await fetchReports()
    toast.success('Work started successfully')
  } catch (err) {
    setError('Start work failed: ' + err.message)
  } finally {
    setStartingWorkIds(prev => { const s = new Set(prev); s.delete(id); return s })
  }
}

  const handleAssign = async (id, dept) => {
    setAssignModal(null)
    try {
      const fd = new FormData(); fd.append('department', dept)
      const data = await apiFetch(`/reports/${id}/assign`, { method:'PUT', body:fd })
      if (data.status === 'success') {
        await apiFetch(`/reports/${id}/start`, { method: 'PUT' })
        toast.success('Report assigned and work started')
        await fetchReports()
      } else setError(data.message || 'Failed to assign report')
    } catch (err) { setError('Failed to assign: ' + err.message) }
  }

  const handleReject = async (id, reason) => {
    setRejectConfirmation(null)
    try {
      const fd = new FormData(); fd.append('reason', reason)
      const data = await apiFetch(`/reports/${id}/reject`, { method:'PUT', body:fd })
      if (data.status === 'success') { toast.success('Report rejected'); await fetchReports() }
      else setError(data.message || 'Failed to reject')
    } catch (err) { setError('Failed to reject: ' + err.message) }
  }

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (loading) return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@300;400;500;600&display=swap');`}</style>
      <div style={{ background: '#050B18', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
        <Navbar />
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '100px 16px 40px' }}>
          <div style={{ height: 32, width: 200, background: 'rgba(255,255,255,0.06)', borderRadius: 12, marginBottom: 24 }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
            {[1,2,3,4].map(i => <div key={i} style={{ height: 110, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16 }} />)}
          </div>
          <div style={{ height: 400, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16 }} />
        </div>
      </div>
    </>
  )

  // ── Stat values ──────────────────────────────────────────────────────────────
  const totalReports    = pagination.total_count > 0 ? pagination.total_count : reports.length
  const submittedCount = reports.filter(r => ['submitted','PENDING','pending'].includes(r.status)).length
  const assignedCount   = reports.filter(r => ['in_progress','IN_PROGRESS'].includes(r.status)).length
  const resolvedCount   = reports.filter(r => ['resolved','RESOLVED'].includes(r.status)).length

  const STAT_CARDS = [
    { label:'Total Reports',  value: totalReports,  icon: <IconReport />,  accent:'#3B82F6' },
    { label:'Submitted', value: submittedCount,  icon: <IconAlert />,   accent:'#F59E0B' },
    { label:'Assigned',       value: assignedCount, icon: <IconClock />,   accent:'#6366F1' },
    { label:'Resolved',       value: resolvedCount, icon: <IconCheck />,   accent:'#22C55E' },
  ]

  const getCatColor = (cat) => CATEGORY_COLORS[cat?.toLowerCase()] || 'rgba(255,255,255,0.5)'
  const getCatBadge = (cat) => {
    const map = {
      contamination: { bg: 'rgba(239,68,68,0.12)', color: '#F87171', border: 'rgba(239,68,68,0.25)' },
      blockage: { bg: 'rgba(245,158,11,0.12)', color: '#FBBF24', border: 'rgba(245,158,11,0.25)' },
      leakage: { bg: 'rgba(59,130,246,0.12)', color: '#60A5FA', border: 'rgba(59,130,246,0.25)' },
    }
    return map[cat?.toLowerCase()] || { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: 'rgba(255,255,255,0.1)' }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@300;400;500;600&display=swap');
        .ad-page { background: #050B18; min-height: 100vh; font-family: 'Inter', sans-serif; color: white; position: relative; overflow-x: hidden; }
        .ad-grid-bg { position: fixed; inset: 0; background-image: linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px); background-size: 50px 50px; pointer-events: none; }
        .ad-orb { position: fixed; border-radius: 50%; filter: blur(80px); animation: adFloat 8s ease-in-out infinite; pointer-events: none; }
        @keyframes adFloat { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-30px) scale(1.05)} }
        .ad-glass { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(20px); border-radius: 16px; }
        .ad-stat-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); backdrop-filter: blur(20px); border-radius: 16px; padding: 24px; position: relative; overflow: hidden; transition: all 0.3s ease; cursor: default; }
        .ad-stat-card:hover { transform: translateY(-4px); border-color: rgba(59,130,246,0.3); box-shadow: 0 12px 40px rgba(59,130,246,0.1); }
        .ad-stat-card::before { content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(59,130,246,0.06), transparent); transition: left 0.6s ease; }
        .ad-stat-card:hover::before { left: 100%; }
        .ad-table-row { cursor: pointer; transition: all 0.15s ease; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .ad-table-row:hover { background: rgba(59,130,246,0.06); }
        .ad-input { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 10px 14px; color: white; font-size: 13px; font-family: 'Inter', sans-serif; outline: none; transition: border-color 0.2s; width: 100%; box-sizing: border-box; }
        .ad-input::placeholder { color: rgba(255,255,255,0.3); }
        .ad-input:focus { border-color: #3B82F6; }
        .ad-search-input { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 10px 14px 10px 36px; color: white; font-size: 13px; font-family: 'Inter', sans-serif; outline: none; transition: border-color 0.2s; width: 100%; box-sizing: border-box; }
        .ad-search-input::placeholder { color: rgba(255,255,255,0.3); }
        .ad-search-input:focus { border-color: #3B82F6; }
        .ad-pagination-btn { background: transparent; color: rgba(255,255,255,0.6); border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; padding: 6px 14px; font-size: 13px; font-family: 'Inter', sans-serif; cursor: pointer; transition: all 0.2s ease; }
        .ad-pagination-btn:hover:not(:disabled) { background: rgba(255,255,255,0.06); color: white; border-color: rgba(255,255,255,0.25); }
        .ad-pagination-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        @media (max-width: 768px) { .ad-desktop { display: none !important; } }
        @media (min-width: 769px) { .ad-mobile { display: none !important; } }
        @media (max-width: 640px) {
          .admin-stat-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>

      <div className="ad-page">
        <div className="ad-grid-bg" />
        <div className="ad-orb" style={{ width: 500, height: 500, background: 'rgba(59,130,246,0.08)', top: '-8%', right: '-12%' }} />
        <div className="ad-orb" style={{ width: 400, height: 400, background: 'rgba(99,102,241,0.06)', bottom: '5%', left: '-10%', animationDelay: '4s' }} />

        <Navbar />
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '100px 16px 60px', position: 'relative', zIndex: 10 }}>

          {/* Page header */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}
            style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 28 }}
          >
            <div>
              <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 4 }}>Admin Dashboard</h1>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Manage reports, departments, and user access</p>
            </div>
            <button onClick={() => setShowExport(!showExport)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              <IconDownload /> Export CSV
            </button>
          </motion.div>

          {/* Error banner */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}
                style={{ padding: '14px 18px', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, marginBottom: 20,
                  background: isDbError ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                  border: `1px solid ${isDbError ? 'rgba(245,158,11,0.25)' : 'rgba(239,68,68,0.25)'}`,
                  color: isDbError ? '#FBBF24' : '#FCA5A5',
                }}
              >
                <span>{isDbError ? '🔌 Database not available: ' : '⚠️ '}{error}</span>
                <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 700, opacity: 0.6, fontSize: 14 }}>✕</button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stat cards */}
          <div className="admin-stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
            {STAT_CARDS.map((s, i) => (
              <motion.div key={s.label} className="ad-stat-card" variants={fadeUp} initial="hidden" animate="visible" custom={i + 1}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${s.accent}15`, border: `1px solid ${s.accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, color: s.accent, position: 'relative', zIndex: 1 }}>
                  {s.icon}
                </div>
                <p style={{ fontSize: 28, fontWeight: 800, fontFamily: 'Syne, sans-serif', color: s.accent, position: 'relative', zIndex: 1 }}>{s.value}</p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4, fontWeight: 500, position: 'relative', zIndex: 1 }}>{s.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Export panel */}
          <AnimatePresence>
            {showExport && (
              <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}
                className="ad-glass" style={{ padding: 24, marginBottom: 20 }}
              >
                <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>Export Reports as CSV</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 16 }}>
                  <Select value={exportFilters.dateRange} onChange={v => setExportFilters(p=>({...p,dateRange:v}))} options={[{value:'all',label:'All Time'},{value:'1d',label:'Today'},{value:'7d',label:'Last 7 Days'},{value:'30d',label:'Last 30 Days'}]} style={{ width: '100%' }} />
                  <Select value={exportFilters.category}  onChange={v => setExportFilters(p=>({...p,category:v}))}  options={[{value:'leakage',label:'Leakage'},{value:'blockage',label:'Blockage'},{value:'contamination',label:'Contamination'},{value:'other',label:'Other'}]} placeholder="All Categories" style={{ width: '100%' }} />
                  <Select value={exportFilters.status}    onChange={v => setExportFilters(p=>({...p,status:v}))}    options={[{value:'submitted',label:'Submitted'},{value:'in_progress',label:'In Progress'},{value:'resolved',label:'Resolved'},{value:'rejected',label:'Rejected'}]} placeholder="All Statuses" style={{ width: '100%' }} />
                  <Select value={exportFilters.risk}      onChange={v => setExportFilters(p=>({...p,risk:v}))}      options={[{value:'HIGH',label:'High'},{value:'MEDIUM',label:'Medium'},{value:'LOW',label:'Low'}]} placeholder="All Risks" style={{ width: '100%' }} />
                </div>
                <ActionBtn onClick={handleExportFiltered} disabled={exporting} variant="primary">
                  <IconDownload /> <span>{exporting ? 'Exporting…' : 'Export'}</span>
                </ActionBtn>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <Tab label="Reports" active={activeTab==='reports'} onClick={() => setActiveTab('reports')} badge={totalReports || undefined} />
            <Tab label="User Management" active={activeTab==='users'} onClick={() => setActiveTab('users')} badge={users.length || undefined} />
          </div>

          {/* ══════ REPORTS TAB ══════ */}
          {activeTab === 'reports' && (
            <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.25 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Filters bar */}
              <div className="ad-glass" style={{ padding: 20 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>
                    <IconFilter /> Filters
                  </span>
                  <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 320 }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }}><IconSearch /></span>
                    <input type="text" placeholder="Search by user email..." value={searchEmail} onChange={e => setSearchEmail(e.target.value)} className="ad-search-input" />
                    {searchEmail && <button onClick={() => setSearchEmail('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 12 }}>✕</button>}
                  </div>
                  <Select value={filters.risk}     onChange={v => setFilters(p=>({...p,risk:v}))}     options={[{value:'HIGH',label:'HIGH'},{value:'MEDIUM',label:'MEDIUM'},{value:'LOW',label:'LOW'}]} placeholder="All Risks" />
                  <Select value={filters.category} onChange={v => setFilters(p=>({...p,category:v}))} options={[{value:'leakage',label:'Leakage'},{value:'contamination',label:'Contamination'},{value:'blockage',label:'Blockage'},{value:'other',label:'Other'}]} placeholder="All Categories" />
                  <Select value={filters.status}   onChange={v => setFilters(p=>({...p,status:v}))}   options={[{value:'submitted',label:'Submitted'},{value:'in_progress',label:'In Progress'},{value:'resolved',label:'Resolved'},{value:'rejected',label:'Rejected'}]} placeholder="All Statuses" />
                  {(filters.risk || filters.category || filters.status || searchEmail) && (
                    <button onClick={() => { setFilters({risk:'',category:'',status:''}); setSearchEmail('') }} style={{ background: 'none', border: 'none', color: '#3B82F6', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Clear</button>
                  )}
                </div>
              </div>

              {/* Reports table */}
              <div className="ad-glass" style={{ overflow: 'hidden' }}>
                {filteredReports.length === 0 ? (
                  <div style={{ padding: '80px 24px', textAlign: 'center' }}>
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: 'rgba(255,255,255,0.3)' }}><IconReport /></div>
                    <p style={{ fontWeight: 500, marginBottom: 4 }}>No reports found</p>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>Try adjusting your filters</p>
                  </div>
                ) : (
                  <>
                    {/* Mobile cards */}
                    <div className="ad-mobile">
                      {filteredReports.map(report => (
                        <div key={report.id} onClick={() => setSelectedReport(report)} style={{ padding: 20, cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.06)', transition: 'background 0.15s' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                            <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>#{report.id.slice(0,8)}</span>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <Badge label={report.risk_level} badgeData={RISK_BADGE[report.risk_level] || RISK_BADGE.LOW} />
                              <Badge label={getStatusDisplay(report.status)} badgeData={STATUS_BADGE[report.status]} />
                            </div>
                          </div>
                          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 10, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{report.description}</p>
                          <p style={{ fontSize: 12, marginBottom: 12 }}>
                            <span style={badgeStyle(getCatBadge(report.category))}>{report.category || 'Processing'}</span>
                            <span style={{ margin: '0 8px', color: 'rgba(255,255,255,0.2)' }}>·</span>
                            <span style={{ color: 'rgba(255,255,255,0.35)' }}>{new Date(report.created_at).toLocaleDateString()}</span>
                          </p>
                          <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                            {(report.status === 'submitted' || report.status === 'PENDING' || report.status === 'pending') && <ActionBtn onClick={() => handleStartWork(report.id)} disabled={startingWorkIds.has(report.id)} variant="primary" small>{startingWorkIds.has(report.id) ? 'Starting…' : 'Start Work'}</ActionBtn>}
                            {!(report.status === 'resolved' || report.status === 'RESOLVED' || report.status === 'rejected' || report.status === 'REJECTED') && <ActionBtn onClick={() => setRejectConfirmation(report.id)} variant="danger" small>Reject</ActionBtn>}
                            {(report.status === 'resolved' || report.status === 'rejected' || report.status === 'RESOLVED' || report.status === 'REJECTED') && <ActionBtn onClick={() => handleDelete(report.id)} variant="danger" small>Delete</ActionBtn>}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop table */}
                    <div className="ad-desktop" style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 520 }}>
                      <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                            {['Submitted By','Description','Category','Risk','Status','Created','Actions'].map(h => (
                              <th key={h} style={{ padding: '14px 18px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.35)', fontFamily: 'Inter, sans-serif', position: 'sticky', top: 0, background: 'rgba(5,11,24,0.95)', backdropFilter: 'blur(10px)', zIndex: 5, whiteSpace: 'nowrap' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredReports.map(report => (
                            <tr key={report.id} className="ad-table-row" onClick={() => setSelectedReport(report)}>
                              <td style={{ padding: '14px 18px', fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>{report.submitter_email || report.id.slice(0,8)}</td>
                              <td style={{ padding: '14px 18px', color: 'rgba(255,255,255,0.8)', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {report.description || <span style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.3)' }}>No description</span>}
                              </td>
                              <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                                <span style={badgeStyle(getCatBadge(report.category))}>{report.category || 'Processing'}</span>
                              </td>
                              <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}><Badge label={report.risk_level} badgeData={RISK_BADGE[report.risk_level] || RISK_BADGE.LOW} /></td>
                              <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}><Badge label={getStatusDisplay(report.status)} badgeData={STATUS_BADGE[report.status]} /></td>
                              <td style={{ padding: '14px 18px', whiteSpace: 'nowrap', fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{new Date(report.created_at).toLocaleDateString()}</td>
                              <td style={{ padding: '14px 18px' }} onClick={e => e.stopPropagation()}>
                                <div style={{ display: 'flex', gap: 6 }}>
                                  {(report.status === 'submitted' || report.status === 'PENDING' || report.status === 'pending') && <ActionBtn onClick={() => handleStartWork(report.id)} disabled={startingWorkIds.has(report.id)} variant="primary" small>{startingWorkIds.has(report.id) ? '…' : 'Start Work'}</ActionBtn>}
                                  {!(report.status === 'resolved' || report.status === 'RESOLVED' || report.status === 'rejected' || report.status === 'REJECTED') && <ActionBtn onClick={() => setRejectConfirmation(report.id)} variant="danger" small>Reject</ActionBtn>}
                                  {(report.status === 'resolved' || report.status === 'rejected' || report.status === 'RESOLVED' || report.status === 'REJECTED') && <ActionBtn onClick={() => handleDelete(report.id)} variant="danger" small>Delete</ActionBtn>}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>

              {/* Pagination */}
              {pagination.total_pages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                    {((pagination.page-1)*pagination.limit)+1}–{Math.min(pagination.page*pagination.limit, pagination.total_count)} of {pagination.total_count}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button className="ad-pagination-btn" onClick={() => handlePageChange(pagination.page-1)} disabled={!pagination.has_prev}>← Prev</button>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', padding: '0 8px' }}>Page {pagination.page} of {pagination.total_pages}</span>
                    <button className="ad-pagination-btn" onClick={() => handlePageChange(pagination.page+1)} disabled={!pagination.has_next}>Next →</button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ══════ USERS TAB ══════ */}
          {activeTab === 'users' && (
            <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.25 }}>
              <div className="ad-glass" style={{ overflow: 'hidden' }}>
                {/* Header */}
                <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 320 }}>
                      <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }}><IconSearch /></span>
                      <input type="text" placeholder="Search by email…" value={userSearch} onChange={e => setUserSearch(e.target.value)} className="ad-search-input" />
                      {userSearch && <button onClick={() => setUserSearch('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 12 }}>✕</button>}
                    </div>
                    <Select value={roleFilter} onChange={setRoleFilter} options={[{value:'user',label:'user'},{value:'department',label:'department'},{value:'admin',label:'admin'}]} placeholder="All Roles" />
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{filteredUsers.length} of {users.length} users</span>
                    <button onClick={fetchUsers} style={{ background: 'none', border: 'none', color: '#3B82F6', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Refresh</button>
                  </div>
                  {usersError && <div style={{ marginTop: 14, fontSize: 13, color: '#F87171' }}>{usersError}</div>}
                </div>

                {usersLoading ? (
                  <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>Loading users…</div>
                ) : filteredUsers.length === 0 ? (
                  <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                    {userSearch || roleFilter ? 'No users match your search.' : 'No users found.'}
                  </div>
                ) : (
                  <>
                    {/* Mobile */}
                    <div className="ad-mobile" style={{ maxHeight: 600, overflowY: 'auto' }}>
                      {filteredUsers.map(u => {
                        const edit = userEdits[u.id] || { role: u.role || 'user', department: u.department || '' }
                        const isDirty = edit.role !== (u.role||'user') || edit.department !== (u.department||'')
                        return (
                          <div key={u.id} style={{ padding: 20, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                              <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.8)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</span>
                              <Badge label={u.role || 'user'} badgeData={ROLE_BADGE[u.role] || ROLE_BADGE.user} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                              <Select value={edit.role} onChange={v => handleUserEditChange(u.id,'role',v)} options={[{value:'user',label:'user'},{value:'department',label:'department'},{value:'admin',label:'admin'}]} style={{ width: '100%' }} />
                              <Select value={edit.department} onChange={v => handleUserEditChange(u.id,'department',v)} options={[{value:'water_dept',label:'Water Dept'},{value:'pwd',label:'PWD'},{value:'health_dept',label:'Health Dept'}]} placeholder="No dept" style={{ width: '100%', opacity: edit.role!=='department' ? 0.4 : 1, pointerEvents: edit.role!=='department' ? 'none' : 'auto' }} />
                            </div>
                            <ActionBtn onClick={() => handleUpdateUserRole(u.id)} disabled={!isDirty || updatingUserId===u.id} variant={updateSuccess===u.id?'success':'primary'} small>
                              {updatingUserId===u.id ? 'Saving…' : updateSuccess===u.id ? '✓ Saved' : 'Save Changes'}
                            </ActionBtn>
                          </div>
                        )
                      })}
                    </div>

                    {/* Desktop */}
                    <div className="ad-desktop" style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 520 }}>
                      <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                            {['Email','Current Role','New Role','Department','Action'].map(h => (
                              <th key={h} style={{ padding: '14px 18px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.35)', fontFamily: 'Inter, sans-serif', position: 'sticky', top: 0, background: 'rgba(5,11,24,0.95)', backdropFilter: 'blur(10px)', zIndex: 5 }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsers.map(u => {
                            const edit = userEdits[u.id] || { role: u.role || 'user', department: u.department || '' }
                            const isDirty = edit.role !== (u.role||'user') || edit.department !== (u.department||'')
                            return (
                              <tr key={u.id} className="ad-table-row" style={{ cursor: 'default' }}>
                                <td style={{ padding: '14px 18px', color: 'rgba(255,255,255,0.8)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</td>
                                <td style={{ padding: '14px 18px' }}>
                                  <Badge label={u.role || 'user'} badgeData={ROLE_BADGE[u.role] || ROLE_BADGE.user} />
                                  {u.department && <span style={{ marginLeft: 8, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>({u.department})</span>}
                                </td>
                                <td style={{ padding: '14px 18px' }}>
                                  <Select value={edit.role} onChange={v => handleUserEditChange(u.id,'role',v)} options={[{value:'user',label:'user'},{value:'department',label:'department'},{value:'admin',label:'admin'}]} style={{ width: '100%' }} />
                                </td>
                                <td style={{ padding: '14px 18px' }}>
                                  <Select value={edit.department} onChange={v => handleUserEditChange(u.id,'department',v)} options={[{value:'water_dept',label:'Water Department'},{value:'pwd',label:'PWD'},{value:'health_dept',label:'Health Department'}]} placeholder="No department" style={{ width: '100%', opacity: edit.role!=='department' ? 0.4 : 1, pointerEvents: edit.role!=='department' ? 'none' : 'auto' }} />
                                </td>
                                <td style={{ padding: '14px 18px' }}>
                                  <ActionBtn onClick={() => handleUpdateUserRole(u.id)} disabled={!isDirty || updatingUserId===u.id} variant={updateSuccess===u.id?'success':'primary'} small>
                                    {updatingUserId===u.id ? 'Saving…' : updateSuccess===u.id ? '✓ Saved' : 'Save'}
                                  </ActionBtn>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {deleteConfirmation && (
          <Modal title="Delete Report" onClose={cancelDelete}>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 24 }}>Are you sure you want to delete this report? This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <ActionBtn onClick={cancelDelete} variant="ghost">Cancel</ActionBtn>
              <ActionBtn onClick={confirmDelete} variant="danger">Delete</ActionBtn>
            </div>
          </Modal>
        )}

        {assignModal && (
          <Modal title="Assign Department" onClose={() => setAssignModal(null)}>
            <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 12, padding: '14px 18px', marginBottom: 20 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#FBBF24' }}>⚠️ AI could not classify this report</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Manual department assignment required</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {[
                { dept:'water_dept',  label:'💧 Water Department' },
                { dept:'pwd',         label:'🔧 PWD' },
                { dept:'health_dept', label:'🏥 Health Department' },
              ].map(({ dept, label }) => (
                <button key={dept} onClick={() => handleAssign(assignModal, dept)}
                  style={{ width: '100%', padding: '12px 18px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left', fontFamily: 'Inter, sans-serif' }}
                >
                  {label}
                </button>
              ))}
              <button onClick={() => { setAssignModal(null); setRejectConfirmation(assignModal) }}
                style={{ width: '100%', padding: '12px 18px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12, fontSize: 13, fontWeight: 600, color: '#F87171', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left', fontFamily: 'Inter, sans-serif' }}
              >
                ✕ Not Water-Related — Reject
              </button>
            </div>
            <ActionBtn onClick={() => setAssignModal(null)} variant="ghost">Cancel</ActionBtn>
          </Modal>
        )}

        {rejectConfirmation && (
          <Modal title="Reject Report" onClose={() => { setRejectConfirmation(null); setRejectionReason('') }}>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 14 }}>Please provide a reason for the citizen.</p>
            <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason…" rows={3}
              className="ad-input"
              style={{ resize: 'none', marginBottom: 20, height: 'auto' }}
            />
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <ActionBtn onClick={() => { setRejectConfirmation(null); setRejectionReason('') }} variant="ghost">Cancel</ActionBtn>
              <ActionBtn onClick={() => { if (!rejectionReason.trim()) { toast.error('Please enter a reason'); return } handleReject(rejectConfirmation, rejectionReason); setRejectionReason('') }} variant="danger">
                Send Rejection
              </ActionBtn>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Report detail modal */}
      {selectedReport && (
        <ReportModal
          report={selectedReport} isAdmin={true}
          onClose={() => setSelectedReport(null)}
          onStartWork={id => { handleStartWork(id); setSelectedReport(null) }}
          onResolve={id => { handleResolve(id); setSelectedReport(null) }}
          onDelete={id => { handleDelete(id); setSelectedReport(null) }}
        />
      )}
    </motion.div>
  )
}

export default AdminDashboard