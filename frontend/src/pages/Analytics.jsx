import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, LabelList,
  AreaChart, Area, RadialBarChart, RadialBar, LineChart, Line
} from 'recharts'
import { apiFetch } from '../config/api'

const COLORS = {
  leakage: '#3b82f6',
  contamination: '#ef4444',
  blockage: '#f59e0b',
  other: '#10b981',
  open: '#f59e0b',
  in_progress: '#3b82f6',
  resolved: '#10b981',
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#22c55e',
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.45, ease: [0.22, 1, 0.36, 1] } })
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 shadow-xl">
      {label && <p className="text-xs font-medium mb-1 uppercase tracking-wider" style={{ color: '#6b7280' }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-semibold" style={{ color: p.color || p.fill || '#6366f1' }}>
          {p.name ? `${p.name}: ` : ''}{p.value}
        </p>
      ))}
    </div>
  )
}

const PieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{payload[0].name}</p>
      <p className="text-sm font-bold text-gray-900 dark:text-white">{payload[0].value} reports</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{(payload[0].payload.percent * 100).toFixed(1)}%</p>
    </div>
  )
}

function KpiCard({ title, value, subtitle, icon, color, index }) {
  return (
    <motion.div
      custom={index}
      variants={fadeUp}
      initial="hidden"
      animate="show"
      className="relative bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden group"
    >
      <div className={`absolute inset-x-0 top-0 h-0.5 ${color}`} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white tabular-nums">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${color.replace('bg-gradient-to-r', 'bg').split(' ')[0]} bg-opacity-10`}>
          {icon}
        </div>
      </div>
    </motion.div>
  )
}

function ChartCard({ title, subtitle, children, index, fullWidth }) {
  return (
    <motion.div
      custom={index}
      variants={fadeUp}
      initial="hidden"
      animate="show"
      className={`bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm ${fullWidth ? 'col-span-full' : ''}`}
    >
      <div className="mb-5">
        <h2 className="text-base font-bold text-gray-900 dark:text-white">{title}</h2>
        {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </motion.div>
  )
}

const RADIAN = Math.PI / 180
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
  if (percent < 0.05) return null
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

function Analytics() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => { fetchReports() }, [])

  const fetchReports = async () => {
    try {
      setLoading(true); setError(null)
      const data = await apiFetch('/reports?ai_processed=true')
      if (data.status === 'success') setReports(data.data || [])
      else setError(data.message || 'Failed to fetch reports')
    } catch { setError('Failed to connect to server') }
    finally { setLoading(false) }
  }

  const totalReports = reports.length
  const openReports = reports.filter(r => r.status === 'OPEN').length
  const inProgressReports = reports.filter(r => r.status === 'IN_PROGRESS').length
  const resolvedReports = reports.filter(r => r.status === 'RESOLVED').length
  const highRiskReports = reports.filter(r => r.risk_level === 'HIGH').length
  const resolutionRate = totalReports > 0 ? Math.round((resolvedReports / totalReports) * 100) : 0

  const categoryData = [
    { name: 'Leakage', value: reports.filter(r => r.category === 'leakage').length, color: COLORS.leakage },
    { name: 'Contamination', value: reports.filter(r => r.category === 'contamination').length, color: COLORS.contamination },
    { name: 'Blockage', value: reports.filter(r => r.category === 'blockage').length, color: COLORS.blockage },
    { name: 'Other', value: reports.filter(r => r.category === 'other' || !r.category).length, color: COLORS.other },
  ].filter(d => d.value > 0).map(d => ({ ...d, percent: d.value / totalReports }))

  const riskData = [
    { name: 'HIGH', count: reports.filter(r => r.risk_level === 'HIGH').length, fill: COLORS.high },
    { name: 'MEDIUM', count: reports.filter(r => r.risk_level === 'MEDIUM').length, fill: COLORS.medium },
    { name: 'LOW', count: reports.filter(r => r.risk_level === 'LOW').length, fill: COLORS.low },
  ]

  const statusData = [
    { name: 'Open', count: openReports, fill: COLORS.open },
    { name: 'In Progress', count: inProgressReports, fill: COLORS.in_progress },
    { name: 'Resolved', count: resolvedReports, fill: COLORS.resolved },
  ]

  // Daily trend (last 14 days)
  const last14Days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (13 - i))
    const key = d.toISOString().slice(0, 10)
    return {
      date: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      reports: reports.filter(r => r.created_at?.slice(0, 10) === key).length
    }
  })

  // AI processed rate
  const aiProcessed = reports.filter(r => r.ai_processed).length
  const aiRate = totalReports > 0 ? Math.round((aiProcessed / totalReports) * 100) : 0

  // Resolution by category
  const resolutionByCategory = ['leakage', 'contamination', 'blockage', 'other'].map(cat => {
    const catTotal = reports.filter(r => (r.category === cat) || (!r.category && cat === 'other')).length
    const catResolved = reports.filter(r => (r.category === cat || (!r.category && cat === 'other')) && r.status === 'RESOLVED').length
    return {
      name: cat.charAt(0).toUpperCase() + cat.slice(1),
      total: catTotal,
      resolved: catResolved,
      rate: catTotal > 0 ? Math.round((catResolved / catTotal) * 100) : 0
    }
  }).filter(d => d.total > 0)

  const kpis = [
    { title: 'Total Reports', value: totalReports, icon: '', color: 'bg-gradient-to-r from-blue-500 to-blue-600', subtitle: 'All time' },
    { title: 'Open', value: openReports, icon: '', color: 'bg-gradient-to-r from-yellow-400 to-orange-500', subtitle: 'Awaiting action' },
    { title: 'In Progress', value: inProgressReports, icon: '', color: 'bg-gradient-to-r from-blue-400 to-cyan-500', subtitle: 'Being handled' },
    { title: 'Resolved', value: resolvedReports, icon: '', color: 'bg-gradient-to-r from-green-400 to-emerald-500', subtitle: 'Completed' },
    { title: 'High Risk', value: highRiskReports, icon: '', color: 'bg-gradient-to-r from-red-500 to-rose-600', subtitle: 'Need priority' },
    { title: 'Resolution Rate', value: `${resolutionRate}%`, icon: '', color: 'bg-gradient-to-r from-purple-500 to-violet-600', subtitle: 'Overall' },
  ]

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 space-y-6">
        <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded-2xl w-64 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-28 bg-gray-300 dark:bg-gray-700 rounded-2xl animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => <div key={i} className="h-80 bg-gray-300 dark:bg-gray-700 rounded-2xl animate-pulse" />)}
        </div>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <button onClick={fetchReports} className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">Retry</button>
      </div>
    </div>
  )

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 space-y-6">

          {/* ── Page header ─────────────────────────────────────────────────── */}
          <motion.div variants={fadeUp} custom={0} initial="hidden" animate="show">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Analytics</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Water issue reports — insights & trends</p>
          </motion.div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
            {kpis.map((kpi, i) => <KpiCard key={kpi.title} {...kpi} index={i + 1} />)}
          </div>

          {/* Row 1: Trend + Category */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* 14-day trend */}
            <ChartCard title="Report Trend" subtitle="Last 14 days" index={7}>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={last14Days} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" className="dark:stroke-gray-700" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} interval={2} />
                  <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} cursor={false} />
                  <Area type="monotone" dataKey="reports" stroke="#3b82f6" strokeWidth={2.5} fill="url(#areaGrad)" dot={{ fill: '#3b82f6', r: 3 }} activeDot={{ r: 5 }} name="Reports" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Category Pie */}
            <ChartCard title="Category Distribution" subtitle="By report type" index={8}>
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="60%" height={240}>
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" outerRadius={100} innerRadius={50} dataKey="value" labelLine={false} label={renderCustomLabel}>
                      {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="none" />)}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {categoryData.map(d => (
                    <div key={d.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                        <span className="text-xs text-gray-600 dark:text-gray-400">{d.name}</span>
                      </div>
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </ChartCard>
          </div>

          {/* Row 2: Risk + Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Risk Level */}
            <ChartCard title="Risk Level Distribution" subtitle="Report severity breakdown" index={9}>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={riskData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }} barSize={48}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" className="dark:stroke-gray-700" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} cursor={false} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Reports">
                    {riskData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    <LabelList dataKey="count" position="top" style={{ fill: "#374151", fontSize: 11, fontWeight: 700 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Status Distribution */}
            <ChartCard title="Status Overview" subtitle="Current pipeline state" index={10}>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={statusData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }} barSize={48}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" className="dark:stroke-gray-700" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} cursor={false} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Reports">
                    {statusData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    <LabelList dataKey="count" position="top" style={{ fill: "#374151", fontSize: 11, fontWeight: 700 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Row 3: Resolution Rate by Category */}
          {resolutionByCategory.length > 0 && (
            <ChartCard title="Resolution Rate by Category" subtitle="% of reports resolved per category" index={11} fullWidth>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={resolutionByCategory} margin={{ top: 20, right: 20, left: -10, bottom: 0 }} barGap={6}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" className="dark:stroke-gray-700" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} cursor={false} />
                  <Bar dataKey="total" name="Total" fill="#e5e7eb" radius={[6, 6, 0, 0]} barSize={32} />
                  <Bar dataKey="resolved" name="Resolved" fill="#10b981" radius={[6, 6, 0, 0]} barSize={32}>
                    <LabelList dataKey="rate" position="top" formatter={(v) => `${v}%`} style={{ fill: '#10b981', fontSize: 11, fontWeight: 700 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-3 justify-end">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-gray-200 dark:bg-gray-600" /><span className="text-xs text-gray-500">Total</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-emerald-500" /><span className="text-xs text-gray-500">Resolved</span></div>
              </div>
            </ChartCard>
          )}

          {/* Row 4: AI Processing + Quick Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* AI Stats */}
            <ChartCard title="AI Processing" subtitle="Model coverage" index={12}>
              <div className="flex flex-col items-center justify-center h-40 gap-3">
                <div className="relative w-28 h-28">
                  <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="10" className="dark:stroke-gray-700" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#8b5cf6" strokeWidth="10"
                      strokeDasharray={`${aiRate * 2.51} 251`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-gray-900 dark:text-white">{aiRate}%</span>
                    <span className="text-xs text-gray-400">processed</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500">{aiProcessed} of {totalReports} reports analysed by AI</p>
              </div>
            </ChartCard>

            {/* Quick Insights */}
            <div className="lg:col-span-2">
              <ChartCard title="Quick Insights" subtitle="Key metrics at a glance" index={13}>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Avg reports/day', value: last14Days.length ? (last14Days.reduce((s, d) => s + d.reports, 0) / 14).toFixed(1) : '0', icon: '📅', color: 'text-blue-500' },
                    { label: 'Open backlog', value: openReports, icon: '📥', color: 'text-yellow-500' },
                    { label: 'Active cases', value: inProgressReports, icon: '🔧', color: 'text-blue-500' },
                    { label: 'Resolved total', value: resolvedReports, icon: '🏁', color: 'text-green-500' },
                    { label: 'High priority', value: highRiskReports, icon: '🚨', color: 'text-red-500' },
                    { label: 'AI coverage', value: `${aiRate}%`, icon: '🤖', color: 'text-purple-500' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/40 rounded-xl">
                      <span className="text-xl">{item.icon}</span>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
                        <p className={`text-lg font-black ${item.color}`}>{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ChartCard>
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  )
}

export default Analytics