import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'
import ReportModal from '../components/ReportModal'
import { apiFetch } from '../config/api'
import toast from 'react-hot-toast'

// ── Icon components ──────────────────────────────────────────────────────────
const Icon = ({ d, size = 20 }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
const RISK_STYLES = {
  HIGH:   'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  MEDIUM: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  LOW:    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
}
const STATUS_STYLES = {
  PENDING:         'bg-yellow-100  text-yellow-700  dark:bg-yellow-900/30  dark:text-yellow-300  ring-1 ring-yellow-200  dark:ring-yellow-800',
  IN_PROGRESS:    'bg-blue-100    text-blue-700    dark:bg-blue-900/30    dark:text-blue-300    ring-1 ring-blue-200    dark:ring-blue-800',
  ASSIGNED:       'bg-indigo-100  text-indigo-700  dark:bg-indigo-900/30  dark:text-indigo-300  ring-1 ring-indigo-200  dark:ring-indigo-800',
  AWAITING_REVIEW: 'bg-purple-100  text-purple-700  dark:bg-purple-900/30  dark:text-purple-300  ring-1 ring-purple-200  dark:ring-purple-800',
  RESOLVED:       'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 ring-1 ring-emerald-200 dark:ring-emerald-800',
  REJECTED:       'bg-red-100     text-red-700     dark:bg-red-900/30     dark:text-red-300     ring-1 ring-red-200     dark:ring-red-800',
}
const ROLE_STYLES = {
  admin:      'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 ring-1 ring-violet-200 dark:ring-violet-800',
  department: 'bg-blue-50   text-blue-700   dark:bg-blue-900/30   dark:text-blue-300   ring-1 ring-blue-200   dark:ring-blue-800',
  user:       'bg-gray-100  text-gray-600   dark:bg-gray-700      dark:text-gray-600 dark:text-gray-400   ring-1 ring-gray-200   dark:ring-gray-700',
}
const Badge = ({ label, styles }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles}`}>{label}</span>
)
const getStatusDisplay = s => ({ 
  PENDING:'Pending', 
  ASSIGNED:'Assigned', 
  IN_PROGRESS:'In Progress', 
  AWAITING_REVIEW:'Awaiting Review',
  RESOLVED:'Resolved', 
  REJECTED:'Rejected' 
}[s] || s)

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon, accent, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 overflow-hidden group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
  >
    <div className={`absolute top-0 right-0 w-24 h-24 rounded-full ${accent} opacity-10 -translate-y-6 translate-x-6`} />
    <div className={`inline-flex p-2.5 rounded-xl ${accent} bg-opacity-15 mb-3 text-white`}
         style={{ background: 'none' }}>
      <div className={`p-2 rounded-xl ${accent} bg-opacity-10`}>
        <span className="opacity-80">{icon}</span>
      </div>
    </div>
    <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</p>
    <p className="text-sm text-gray-900 dark:text-white mt-0.5 font-medium">{label}</p>
  </motion.div>
)

// ── Action button ─────────────────────────────────────────────────────────────
const ActionBtn = ({ onClick, disabled, variant = 'primary', children, small }) => {
  const base = `inline-flex items-center font-semibold rounded-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${small ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-sm'}`
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow',
    danger:  'bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow',
    ghost:   'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-600 dark:text-gray-400',
  }
  return <button onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]}`}>{children}</button>
}

// ── Modal wrapper ─────────────────────────────────────────────────────────────
const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.18 }}
      className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-800"
    >
      <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
          <Icon d="M6 18L18 6M6 6l12 12" size={18} />
        </button>
      </div>
      <div className="px-6 py-5">{children}</div>
    </motion.div>
  </div>
)

// ── Tab button ────────────────────────────────────────────────────────────────
const Tab = ({ label, active, onClick, badge }) => (
  <button
    onClick={onClick}
    className={`relative px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
      active
        ? 'bg-blue-600 text-white shadow-sm'
        : 'text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
    }`}
  >
    {label}
    {badge != null && (
      <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-600 dark:text-gray-400'}`}>
        {badge}
      </span>
    )}
  </button>
)

// ── Select ────────────────────────────────────────────────────────────────────
const Select = ({ value, onChange, options, placeholder, className = '' }) => (
  <select
    value={value}
    onChange={e => onChange(e.target.value)}
    className={`border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${className}`}
  >
    {placeholder && <option value="">{placeholder}</option>}
    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
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
  const [pagination, setPagination]         = useState({ page:1, limit:20, total_count:0, total_pages:0, has_next:false, has_prev:false })

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
      const params = new URLSearchParams({ page, limit: 20, ai_processed: true })
      if (currentFilters.status)   params.append('status', currentFilters.status)
      if (currentFilters.category) params.append('category', currentFilters.category)
      if (currentFilters.risk)     params.append('risk_level', currentFilters.risk)
      const data = await apiFetch(`/reports?${params.toString()}`)
      if (data.status === 'success') {
        setReports(data.data || [])
        setPagination(data.pagination || {})
      } else {
        setError(data.message || 'Failed to fetch reports')
        // Set empty reports to prevent UI crash
        setReports([])
        setPagination({})
      }
    } catch (err) { 
      const errorMsg = err.message || 'Failed to connect to server'
      setError(errorMsg)
      setIsDbError(errorMsg.includes('connect') || errorMsg.includes('network') || errorMsg.includes('fetch'))
      // Set empty reports to prevent UI crash
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
    const report = reports.find(r => r.id === id); if (!report) return
    // 'other' category → show 4-option modal (3 depts + reject)
    if (report.category === 'other') { setAssignModal(id); return }
    if (startingWorkIds.has(id)) return
    // Auto-assign based on category
    const categoryDeptMap = {
      leakage:       'water_dept',
      contamination: 'health_dept',
      blockage:      'pwd',
    }
    const dept = categoryDeptMap[report.category]
    try {
      setStartingWorkIds(prev => new Set([...prev, id]))
      if (dept) {
        // Use assign endpoint with the mapped department
        const fd = new FormData(); fd.append('department', dept)
        await apiFetch(`/reports/${id}/assign`, { method: 'PUT', body: fd })
        // Update status to IN_PROGRESS after assignment
        await apiFetch(`/reports/${id}/start`, { method: 'PUT' })
      } else {
        await apiFetch(`/reports/${id}/start`, { method: 'PUT' })
      }
      await fetchReports()
      toast.success('Work started successfully')
    } catch (err) { setError('Start work failed: ' + err.message) }
    finally { setStartingWorkIds(prev => { const s = new Set(prev); s.delete(id); return s }) }
  }

  const handleAssign = async (id, dept) => {
    setAssignModal(null)
    try {
      const fd = new FormData(); fd.append('department', dept)
      const data = await apiFetch(`/reports/${id}/assign`, { method:'PUT', body:fd })
      if (data.status === 'success') {
        // Update status to IN_PROGRESS after assignment
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 space-y-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded-xl w-48 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />)}
        </div>
        <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />
      </div>
    </div>
  )

  // ── Stat values ──────────────────────────────────────────────────────────────
  const totalReports    = pagination.total_count > 0 ? pagination.total_count : reports.length
  const pendingCount    = reports.filter(r => r.status === 'OPEN').length
  const assignedCount   = reports.filter(r => r.status === 'IN_PROGRESS').length
  const resolvedCount   = reports.filter(r => r.status === 'RESOLVED').length

  const STAT_CARDS = [
    { label:'Total Reports',    value: totalReports,  icon: <IconReport />,  accent:'bg-blue-500',    delay:0.0 },
    { label:'Pending Review',   value: pendingCount,  icon: <IconAlert />,   accent:'bg-amber-500',   delay:0.07 },
    { label:'Assigned',         value: assignedCount, icon: <IconClock />,   accent:'bg-indigo-500',  delay:0.14 },
    { label:'Resolved',         value: resolvedCount, icon: <IconCheck />,   accent:'bg-emerald-500', delay:0.21 },
  ]

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:0.3 }}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />

        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 space-y-6">

          {/* ── Page header ─────────────────────────────────────────────────── */}
          <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.35 }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
          >
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Admin Dashboard</h1>
              <p className="text-sm text-gray-900 dark:text-white mt-1">Manage reports, departments, and user access</p>
            </div>
            <button
              onClick={() => setShowExport(!showExport)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-600 dark:text-gray-400 rounded-xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shadow-sm"
            >
              <IconDownload /> Export CSV
            </button>
          </motion.div>

          {/* ── Error banner ─────────────────────────────────────────────────── */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}
                className={`px-4 py-3 rounded-xl flex justify-between items-center text-sm ${
                  isDbError 
                    ? 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300'
                    : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
                }`}
              >
                <span>
                  {isDbError ? '🔌 Database not available: ' : '⚠️ '}
                  {error}
                </span>
                <button onClick={() => setError(null)} className="font-bold opacity-60 hover:opacity-100">✕</button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Stat cards ───────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {STAT_CARDS.map(c => <StatCard key={c.label} {...c} />)}
          </div>

          {/* ── Export panel ─────────────────────────────────────────────────── */}
          <AnimatePresence>
            {showExport && (
              <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}
                className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 space-y-4"
              >
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-600 dark:text-gray-400">Export Reports as CSV</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Select value={exportFilters.dateRange} onChange={v => setExportFilters(p=>({...p,dateRange:v}))} options={[{value:'all',label:'All Time'},{value:'1d',label:'Today'},{value:'7d',label:'Last 7 Days'},{value:'30d',label:'Last 30 Days'}]} className="w-full" />
                  <Select value={exportFilters.category}  onChange={v => setExportFilters(p=>({...p,category:v}))}  options={[{value:'leakage',label:'Leakage'},{value:'blockage',label:'Blockage'},{value:'contamination',label:'Contamination'},{value:'other',label:'Other'}]} placeholder="All Categories" className="w-full" />
                  <Select value={exportFilters.status}    onChange={v => setExportFilters(p=>({...p,status:v}))}    options={[{value:'PENDING',label:'Pending'},{value:'IN_PROGRESS',label:'In Progress'},{value:'RESOLVED',label:'Resolved'},{value:'REJECTED',label:'Rejected'}]} placeholder="All Statuses" className="w-full" />
                  <Select value={exportFilters.risk}      onChange={v => setExportFilters(p=>({...p,risk:v}))}      options={[{value:'HIGH',label:'High'},{value:'MEDIUM',label:'Medium'},{value:'LOW',label:'Low'}]} placeholder="All Risks" className="w-full" />
                </div>
                <ActionBtn onClick={handleExportFiltered} disabled={exporting} variant="primary">
                  <IconDownload /> <span className="ml-1.5">{exporting ? 'Exporting…' : 'Export'}</span>
                </ActionBtn>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Tabs ─────────────────────────────────────────────────────────── */}
          <div className="flex items-center gap-2">
            <Tab label="Reports" active={activeTab==='reports'} onClick={() => setActiveTab('reports')} badge={totalReports || undefined} />
            <Tab label="User Management" active={activeTab==='users'} onClick={() => setActiveTab('users')} badge={users.length || undefined} />
          </div>

          {/* ════════════════════════════════════════════════════════════════════
              REPORTS TAB
          ════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'reports' && (
            <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.25 }} className="space-y-4">

              {/* Filters bar */}
              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white">
                    <IconFilter /> Filters
                  </span>
                  <div className="relative flex-1 max-w-sm">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><IconSearch /></span>
                    <input 
                      type="text" 
                      placeholder="Search by user email..."
                      value={searchEmail}
                      onChange={e => setSearchEmail(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                    {searchEmail && <button onClick={() => setSearchEmail('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">✕</button>}
                  </div>
                  <Select value={filters.risk}     onChange={v => setFilters(p=>({...p,risk:v}))}     options={[{value:'HIGH',label:'HIGH'},{value:'MEDIUM',label:'MEDIUM'},{value:'LOW',label:'LOW'}]}                                                                                                                                          placeholder="All Risks"      className="min-w-[130px]" />
                  <Select value={filters.category} onChange={v => setFilters(p=>({...p,category:v}))} options={[{value:'leakage',label:'Leakage'},{value:'contamination',label:'Contamination'},{value:'blockage',label:'Blockage'},{value:'other',label:'Other'}]}                                                                                placeholder="All Categories" className="min-w-[150px]" />
                  <Select value={filters.status}   onChange={v => setFilters(p=>({...p,status:v}))}   options={[{value:'PENDING',label:'Pending'},{value:'IN_PROGRESS',label:'In Progress'},{value:'RESOLVED',label:'Resolved'},{value:'REJECTED',label:'Rejected'}]}                              placeholder="All Statuses"   className="min-w-[150px]" />
                  {(filters.risk || filters.category || filters.status || searchEmail) && (
                    <button onClick={() => { setFilters({risk:'',category:'',status:''}); setSearchEmail('') }} className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline">Clear</button>
                  )}
                </div>
              </div>

              {/* Reports table */}
              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
                {filteredReports.length === 0 ? (
                  <div className="py-20 text-center">
                    <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3 text-gray-400"><IconReport /></div>
                    <p className="text-gray-900 dark:text-white font-medium">No reports found</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try adjusting your filters</p>
                  </div>
                ) : (
                  <>
                    {/* Mobile cards */}
                    <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
                      {filteredReports.map(report => (
                        <div key={report.id} onClick={() => setSelectedReport(report)} className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs text-gray-400">#{report.id.slice(0,8)}</span>
                            <div className="flex gap-1.5">
                              <Badge label={report.risk_level} styles={RISK_STYLES[report.risk_level] || RISK_STYLES.LOW} />
                              <Badge label={getStatusDisplay(report.status)} styles={STATUS_STYLES[report.status] || ''} />
                            </div>
                          </div>
                          <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2">{report.description}</p>
                          <p className="text-xs capitalize font-semibold">
  <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
    (report.category || "").toLowerCase() === "contamination"
      ? "bg-red-500/20 text-red-600 dark:text-red-400"
      : (report.category || "").toLowerCase() === "blockage"
      ? "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400"
      : (report.category || "").toLowerCase() === "leakage"
      ? "bg-blue-500/20 text-blue-600 dark:text-blue-400"
      : "bg-gray-500/20 text-gray-600 dark:text-gray-400"
  }`}>
    {report.category || "Processing"}
  </span>
  {' · '}
  <span className="text-gray-500">{new Date(report.created_at).toLocaleDateString()}</span>
</p>
                          <div className="flex gap-2 pt-1" onClick={e => e.stopPropagation()}>
                            {report.status === 'PENDING' && (
                              <ActionBtn onClick={() => handleStartWork(report.id)} disabled={startingWorkIds.has(report.id)} variant="primary" small>
                                {startingWorkIds.has(report.id) ? 'Starting…' : 'Start Work'}
                              </ActionBtn>
                            )}
                            {report.status === 'IN_PROGRESS' && (
                              <ActionBtn onClick={() => handleResolve(report.id)} variant="success" small>Resolve</ActionBtn>
                            )}
                            {(report.status === 'PENDING' || report.status === 'ASSIGNED' || report.status === 'IN_PROGRESS') && (
                              <ActionBtn onClick={() => setRejectConfirmation(report.id)} variant="danger" small>Reject</ActionBtn>
                            )}
                            {(report.status === 'RESOLVED' || report.status === 'REJECTED') && (
                              <ActionBtn onClick={() => handleDelete(report.id)} variant="danger" small>Delete</ActionBtn>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop table */}
                    <div className="hidden md:block overflow-x-auto overflow-y-auto max-h-[520px]">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                          <tr>
                            {['Submitted By','Description','Category','Risk','Status','Created','Actions'].map(h => (
                              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                          {filteredReports.map(report => (
                            <tr key={report.id} onClick={() => setSelectedReport(report)}
                              className="cursor-pointer border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                              <td className="px-5 py-4 text-xs text-gray-500 font-mono truncate max-w-[100px]">{report.submitter_email || report.id.slice(0,8)}</td>
                              <td className="px-5 py-4 text-gray-800 dark:text-gray-200 max-w-[240px]">
                                <div className="truncate">{report.description || <span className="italic text-gray-400">No description</span>}</div>
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap">
  <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
    (report.category || "").toLowerCase() === "contamination"
      ? "bg-red-500/20 text-red-600 dark:text-red-400"
      : (report.category || "").toLowerCase() === "blockage"
      ? "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400"
      : (report.category || "").toLowerCase() === "leakage"
      ? "bg-blue-500/20 text-blue-600 dark:text-blue-400"
      : "bg-gray-500/20 text-gray-600 dark:text-gray-400"
  }`}>
    {report.category || "Processing"}
  </span>
</td>
                              <td className="px-5 py-4 whitespace-nowrap"><Badge label={report.risk_level} styles={RISK_STYLES[report.risk_level] || RISK_STYLES.LOW} /></td>
                              <td className="px-5 py-4 whitespace-nowrap"><Badge label={getStatusDisplay(report.status)} styles={STATUS_STYLES[report.status] || ''} /></td>
                              <td className="px-5 py-4 whitespace-nowrap text-gray-900 dark:text-white">{new Date(report.created_at).toLocaleDateString()}</td>
                              <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                                <div className="flex gap-1.5">
                                  {report.status === 'PENDING' && (
                                    <ActionBtn onClick={() => handleStartWork(report.id)} disabled={startingWorkIds.has(report.id)} variant="primary" small>
                                      {startingWorkIds.has(report.id) ? '…' : 'Start Work'}
                                    </ActionBtn>
                                  )}
                                  {report.status === 'IN_PROGRESS' && (
                                    <ActionBtn onClick={() => handleResolve(report.id)} variant="success" small>Resolve</ActionBtn>
                                  )}
                                  {(report.status === 'PENDING' || report.status === 'ASSIGNED' || report.status === 'IN_PROGRESS') && (
                                    <ActionBtn onClick={() => setRejectConfirmation(report.id)} variant="danger" small>Reject</ActionBtn>
                                  )}
                                  {(report.status === 'RESOLVED' || report.status === 'REJECTED') && (
                                    <ActionBtn onClick={() => handleDelete(report.id)} variant="danger" small>Delete</ActionBtn>
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
              </div>

              {/* Pagination */}
              {pagination.total_pages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl">
                  <span className="text-sm text-gray-900 dark:text-white">
                    {((pagination.page-1)*pagination.limit)+1}–{Math.min(pagination.page*pagination.limit, pagination.total_count)} of {pagination.total_count}
                  </span>
                  <div className="flex items-center gap-2">
                    <ActionBtn onClick={() => handlePageChange(pagination.page-1)} disabled={!pagination.has_prev} variant="ghost" small>← Prev</ActionBtn>
                    <span className="text-sm text-gray-600 dark:text-gray-400 px-2">Page {pagination.page} of {pagination.total_pages}</span>
                    <ActionBtn onClick={() => handlePageChange(pagination.page+1)} disabled={!pagination.has_next} variant="ghost" small>Next →</ActionBtn>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ════════════════════════════════════════════════════════════════════
              USERS TAB 
          ════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'users' && (
            <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.25 }}>
              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">

                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-2 flex-1">
                      <div className="relative flex-1 max-w-sm">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><IconSearch /></span>
                        <input type="text" placeholder="Search by email…" value={userSearch} onChange={e => setUserSearch(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                        {userSearch && <button onClick={() => setUserSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">✕</button>}
                      </div>
                      <Select value={roleFilter} onChange={setRoleFilter}
                        options={[{value:'user',label:'user'},{value:'department',label:'department'},{value:'admin',label:'admin'}]}
                        placeholder="All Roles" className="min-w-[120px]"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-900 dark:text-white">{filteredUsers.length} of {users.length} users</span>
                      <button onClick={fetchUsers} className="text-sm text-blue-600 dark:text-blue-400 font-semibold hover:underline">Refresh</button>
                    </div>
                  </div>
                  {usersError && <div className="mt-3 text-sm text-red-600 dark:text-red-400">{usersError}</div>}
                </div>

                {usersLoading ? (
                  <div className="p-8 text-center text-gray-900 dark:text-white">Loading users…</div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-8 text-center text-gray-900 dark:text-white">
                    {userSearch || roleFilter ? 'No users match your search.' : 'No users found.'}
                  </div>
                ) : (
                  <>
                    {/* Mobile */}
                    <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800 overflow-y-auto max-h-[600px]">
                      {filteredUsers.map(u => {
                        const edit = userEdits[u.id] || { role: u.role || 'user', department: u.department || '' }
                        const isDirty = edit.role !== (u.role||'user') || edit.department !== (u.department||'')
                        return (
                          <div key={u.id} className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate max-w-[200px]">{u.email}</span>
                              <Badge label={u.role || 'user'} styles={ROLE_STYLES[u.role] || ROLE_STYLES.user} />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <Select value={edit.role} onChange={v => handleUserEditChange(u.id,'role',v)}
                                options={[{value:'user',label:'user'},{value:'department',label:'department'},{value:'admin',label:'admin'}]} className="w-full" />
                              <Select value={edit.department} onChange={v => handleUserEditChange(u.id,'department',v)}
                                options={[{value:'water_dept',label:'Water Dept'},{value:'pwd',label:'PWD'},{value:'health_dept',label:'Health Dept'}]}
                                placeholder="No dept" className={`w-full ${edit.role!=='department'?'opacity-40 cursor-not-allowed':''}`}
                              />
                            </div>
                            <ActionBtn onClick={() => handleUpdateUserRole(u.id)} disabled={!isDirty || updatingUserId===u.id} variant={updateSuccess===u.id?'success':'primary'} small>
                              {updatingUserId===u.id ? 'Saving…' : updateSuccess===u.id ? '✓ Saved' : 'Save Changes'}
                            </ActionBtn>
                          </div>
                        )
                      })}
                    </div>

                    {/* Desktop */}
                    <div className="hidden md:block overflow-x-auto overflow-y-auto max-h-[520px]">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                          <tr>
                            {['Email','Current Role','New Role','Department','Action'].map(h => (
                              <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                          {filteredUsers.map(u => {
                            const edit = userEdits[u.id] || { role: u.role || 'user', department: u.department || '' }
                            const isDirty = edit.role !== (u.role||'user') || edit.department !== (u.department||'')
                            return (
                              <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                <td className="px-5 py-3.5 text-gray-800 dark:text-gray-200 max-w-[220px] truncate">{u.email}</td>
                                <td className="px-5 py-3.5">
                                  <Badge label={u.role || 'user'} styles={ROLE_STYLES[u.role] || ROLE_STYLES.user} />
                                  {u.department && <span className="ml-2 text-xs text-gray-400">({u.department})</span>}
                                </td>
                                <td className="px-5 py-3.5">
                                  <Select value={edit.role} onChange={v => handleUserEditChange(u.id,'role',v)}
                                    options={[{value:'user',label:'user'},{value:'department',label:'department'},{value:'admin',label:'admin'}]} className="w-full" />
                                </td>
                                <td className="px-5 py-3.5">
                                  <Select value={edit.department} onChange={v => handleUserEditChange(u.id,'department',v)}
                                    options={[{value:'water_dept',label:'Water Department'},{value:'pwd',label:'PWD'},{value:'health_dept',label:'Health Department'}]}
                                    placeholder="No department" className={`w-full ${edit.role!=='department'?'opacity-40 cursor-not-allowed pointer-events-none':''}`}
                                  />
                                </td>
                                <td className="px-5 py-3.5">
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
            <p className="text-sm text-gray-900 dark:text-white mb-5">Are you sure you want to delete this report? This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <ActionBtn onClick={cancelDelete} variant="ghost">Cancel</ActionBtn>
              <ActionBtn onClick={confirmDelete} variant="danger">Delete</ActionBtn>
            </div>
          </Modal>
        )}

        {assignModal && (
          <Modal title="Assign Department" onClose={() => setAssignModal(null)}>
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 px-4 py-3 rounded-xl mb-4">
              <p className="text-sm font-semibold">⚠️ AI could not classify this report</p>
              <p className="text-xs mt-1">Manual department assignment required</p>
            </div>
            <div className="space-y-2 mb-4">
              {[
                { dept:'water_dept',  label:'💧 Water Department', variant:'primary' },
                { dept:'pwd',         label:'🔧 PWD',               variant:'primary' },
                { dept:'health_dept', label:'🏥 Health Department', variant:'primary' },
              ].map(({ dept, label }) => (
                <button key={dept} onClick={() => handleAssign(assignModal, dept)}
                  className="w-full py-2.5 px-4 bg-gray-50 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-600 dark:text-gray-400 transition-all text-left"
                >
                  {label}
                </button>
              ))}
              <button onClick={() => { setAssignModal(null); setRejectConfirmation(assignModal) }}
                className="w-full py-2.5 px-4 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 border border-red-200 dark:border-red-800 rounded-xl text-sm font-semibold text-red-700 dark:text-red-300 transition-all text-left"
              >
                ✕ Not Water-Related — Reject
              </button>
            </div>
            <ActionBtn onClick={() => setAssignModal(null)} variant="ghost">Cancel</ActionBtn>
          </Modal>
        )}

        {rejectConfirmation && (
          <Modal title="Reject Report" onClose={() => { setRejectConfirmation(null); setRejectionReason('') }}>
            <p className="text-sm text-gray-900 dark:text-white mb-3">Please provide a reason for the citizen.</p>
            <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason…" rows={3}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 mb-4 resize-none"
            />
            <div className="flex gap-3 justify-end">
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