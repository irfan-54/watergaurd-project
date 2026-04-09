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
    <div style={{ background: 'rgba(15,20,35,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 16px', backdropFilter: 'blur(10px)', boxShadow: '0 8px 25px rgba(0,0,0,0.4)' }}>
      {label && <p style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.4)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ fontSize: 13, fontWeight: 600, color: p.color || p.fill || '#A78BFA', fontFamily: 'Inter, sans-serif' }}>
          {p.name ? `${p.name}: ` : ''}{p.value}
        </p>
      ))}
    </div>
  )
}

const PieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'rgba(15,20,35,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 16px', backdropFilter: 'blur(10px)', boxShadow: '0 8px 25px rgba(0,0,0,0.4)' }}>
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>{payload[0].name}</p>
      <p style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>{payload[0].value} reports</p>
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{(payload[0].payload.percent * 100).toFixed(1)}%</p>
    </div>
  )
}

function KpiCard({ title, value, subtitle, icon, accent, index }) {
  return (
    <motion.div
      custom={index}
      variants={fadeUp}
      initial="hidden"
      animate="show"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px)',
        borderRadius: 16,
        padding: '20px 18px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        cursor: 'default',
      }}
      className="an-kpi-card"
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: accent }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{title}</p>
          <p style={{ fontSize: 'clamp(22px, 3vw, 28px)', fontWeight: 800, fontFamily: 'Syne, sans-serif', color: 'white', fontVariantNumeric: 'tabular-nums' }}>{value}</p>
          {subtitle && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{subtitle}</p>}
        </div>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: `${accent}15`, border: `1px solid ${accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
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
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px)',
        borderRadius: 16,
        padding: 24,
        ...(fullWidth ? { gridColumn: '1 / -1' } : {}),
      }}
    >
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: 'white' }}>{title}</h2>
        {subtitle && <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{subtitle}</p>}
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
    { title: 'Total Reports', value: totalReports, icon: '📊', accent: '#3B82F6', subtitle: 'All time' },
    { title: 'Open', value: openReports, icon: '📥', accent: '#F59E0B', subtitle: 'Awaiting action' },
    { title: 'In Progress', value: inProgressReports, icon: '🔧', accent: '#06B6D4', subtitle: 'Being handled' },
    { title: 'Resolved', value: resolvedReports, icon: '✅', accent: '#22C55E', subtitle: 'Completed' },
    { title: 'High Risk', value: highRiskReports, icon: '🚨', accent: '#EF4444', subtitle: 'Need priority' },
    { title: 'Resolution Rate', value: `${resolutionRate}%`, icon: '📈', accent: '#8B5CF6', subtitle: 'Overall' },
  ]

  // Chart axis/grid style
  const axisTickStyle = { fontSize: 10, fill: 'rgba(255,255,255,0.35)', fontFamily: 'Inter, sans-serif' }
  const gridStroke = 'rgba(255,255,255,0.06)'

  if (loading) return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@300;400;500;600&display=swap');`}</style>
      <div style={{ background: '#050B18', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
        <Navbar />
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '100px 16px 40px' }}>
          <div style={{ height: 32, width: 200, background: 'rgba(255,255,255,0.06)', borderRadius: 12, marginBottom: 24 }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, marginBottom: 24 }}>
            {[...Array(6)].map((_, i) => <div key={i} style={{ height: 100, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16 }} />)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {[...Array(4)].map((_, i) => <div key={i} style={{ height: 300, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16 }} />)}
          </div>
        </div>
      </div>
    </>
  )

  if (error) return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@300;400;500;600&display=swap');`}</style>
      <div style={{ background: '#050B18', minHeight: '100vh', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#F87171', marginBottom: 16, fontSize: 14 }}>{error}</p>
          <button onClick={fetchReports} style={{ padding: '10px 24px', background: '#3B82F6', color: 'white', borderRadius: 12, border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'Inter, sans-serif' }}>Retry</button>
        </div>
      </div>
    </>
  )

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@300;400;500;600&display=swap');
        .an-page { background: #050B18; min-height: 100vh; font-family: 'Inter', sans-serif; color: white; position: relative; overflow-x: hidden; }
        .an-grid-bg { position: fixed; inset: 0; background-image: linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px); background-size: 50px 50px; pointer-events: none; }
        .an-orb { position: fixed; border-radius: 50%; filter: blur(80px); animation: anFloat 8s ease-in-out infinite; pointer-events: none; }
        @keyframes anFloat { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-30px) scale(1.05)} }
        .an-kpi-card:hover { transform: translateY(-4px); border-color: rgba(59,130,246,0.3) !important; box-shadow: 0 12px 40px rgba(59,130,246,0.1); }
        @media (max-width: 640px) {
          .analytics-bottom-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div className="an-page">
        <div className="an-grid-bg" />
        <div className="an-orb" style={{ width: 500, height: 500, background: 'rgba(59,130,246,0.08)', top: '-8%', right: '-12%' }} />
        <div className="an-orb" style={{ width: 400, height: 400, background: 'rgba(139,92,246,0.06)', bottom: '5%', left: '-10%', animationDelay: '4s' }} />

        <Navbar />
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '100px 16px 60px', position: 'relative', zIndex: 10 }}>

          {/* Page header */}
          <motion.div variants={fadeUp} custom={0} initial="hidden" animate="show" style={{ marginBottom: 28 }}>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 4 }}>Analytics</h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Water issue reports — insights & trends</p>
          </motion.div>

          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
            {kpis.map((kpi, i) => <KpiCard key={kpi.title} {...kpi} index={i + 1} />)}
          </div>

          {/* Row 1: Trend + Category */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 20, marginBottom: 20 }}>

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
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis dataKey="date" tick={axisTickStyle} tickLine={false} axisLine={false} interval={2} />
                  <YAxis tick={axisTickStyle} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} cursor={false} />
                  <Area type="monotone" dataKey="reports" stroke="#3b82f6" strokeWidth={2.5} fill="url(#areaGrad)" dot={{ fill: '#3b82f6', r: 3 }} activeDot={{ r: 5 }} name="Reports" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Category Pie */}
            <ChartCard title="Category Distribution" subtitle="By report type" index={8}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <ResponsiveContainer width="60%" height={240}>
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" outerRadius={100} innerRadius={50} dataKey="value" labelLine={false} label={renderCustomLabel}>
                      {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="none" />)}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {categoryData.map(d => (
                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{d.name}</span>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </ChartCard>
          </div>

          {/* Row 2: Risk + Status */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 20, marginBottom: 20 }}>

            {/* Risk Level */}
            <ChartCard title="Risk Level Distribution" subtitle="Report severity breakdown" index={9}>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={riskData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }} barSize={48}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis dataKey="name" tick={axisTickStyle} tickLine={false} axisLine={false} />
                  <YAxis tick={axisTickStyle} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} cursor={false} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Reports">
                    {riskData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    <LabelList dataKey="count" position="top" style={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 700 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Status Distribution */}
            <ChartCard title="Status Overview" subtitle="Current pipeline state" index={10}>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={statusData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }} barSize={48}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis dataKey="name" tick={axisTickStyle} tickLine={false} axisLine={false} />
                  <YAxis tick={axisTickStyle} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} cursor={false} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Reports">
                    {statusData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    <LabelList dataKey="count" position="top" style={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 700 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Row 3: Resolution Rate by Category */}
          {resolutionByCategory.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <ChartCard title="Resolution Rate by Category" subtitle="% of reports resolved per category" index={11} fullWidth>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={resolutionByCategory} margin={{ top: 20, right: 20, left: -10, bottom: 0 }} barGap={6}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                    <XAxis dataKey="name" tick={{ ...axisTickStyle, fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis tick={axisTickStyle} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} cursor={false} />
                    <Bar dataKey="total" name="Total" fill="rgba(255,255,255,0.1)" radius={[6, 6, 0, 0]} barSize={32} />
                    <Bar dataKey="resolved" name="Resolved" fill="#10b981" radius={[6, 6, 0, 0]} barSize={32}>
                      <LabelList dataKey="rate" position="top" formatter={(v) => `${v}%`} style={{ fill: '#10b981', fontSize: 11, fontWeight: 700 }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', gap: 16, marginTop: 12, justifyContent: 'flex-end' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(255,255,255,0.1)' }} /><span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Total</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 12, borderRadius: 3, background: '#10b981' }} /><span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Resolved</span></div>
                </div>
              </ChartCard>
            </div>
          )}

          {/* Row 4: AI Processing + Quick Stats */}
          <div className="analytics-bottom-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>

            {/* AI Stats */}
            <ChartCard title="AI Processing" subtitle="Model coverage" index={12}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 160, gap: 12 }}>
                <div style={{ position: 'relative', width: 112, height: 112 }}>
                  <svg width="112" height="112" style={{ transform: 'rotate(-90deg)' }} viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#8b5cf6" strokeWidth="10"
                      strokeDasharray={`${aiRate * 2.51} 251`} strokeLinecap="round" />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 24, fontWeight: 800, fontFamily: 'Syne, sans-serif', color: 'white' }}>{aiRate}%</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>processed</span>
                  </div>
                </div>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{aiProcessed} of {totalReports} reports analysed by AI</p>
              </div>
            </ChartCard>

            {/* Quick Insights */}
            <ChartCard title="Quick Insights" subtitle="Key metrics at a glance" index={13}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { label: 'Avg reports/day', value: last14Days.length ? (last14Days.reduce((s, d) => s + d.reports, 0) / 14).toFixed(1) : '0', icon: '📅', accent: '#60A5FA' },
                  { label: 'Open backlog', value: openReports, icon: '📥', accent: '#FBBF24' },
                  { label: 'Active cases', value: inProgressReports, icon: '🔧', accent: '#60A5FA' },
                  { label: 'Resolved total', value: resolvedReports, icon: '🏁', accent: '#4ADE80' },
                  { label: 'High priority', value: highRiskReports, icon: '🚨', accent: '#F87171' },
                  { label: 'AI coverage', value: `${aiRate}%`, icon: '🤖', accent: '#A78BFA' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }}>
                    <span style={{ fontSize: 20 }}>{item.icon}</span>
                    <div>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>{item.label}</p>
                      <p style={{ fontSize: 18, fontWeight: 800, fontFamily: 'Syne, sans-serif', color: item.accent }}>{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>

        </div>
      </div>
    </motion.div>
  )
}

export default Analytics