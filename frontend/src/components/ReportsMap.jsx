import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet'
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import 'leaflet/dist/leaflet.css'
import { apiFetch } from '../config/api'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

const RISK_COLORS = {
  HIGH: '#ef4444',
  MEDIUM: '#f59e0b',
  LOW: '#3b82f6',
  DEFAULT: '#6b7280',
}

const STATUS_EMOJI = {
  OPEN: '🔴',
  IN_PROGRESS: '🟡',
  PENDING: '🔴',
  ASSIGNED: '🟡',
  AWAITING_REVIEW: '�',
  RESOLVED: '✅',
  REJECTED: '❌',
}

const CATEGORY_EMOJI = {
  leakage: '💧',
  contamination: '⚠️',
  blockage: '🚧',
  other: '📋',
}

const TIME_FILTERS = [
  { label: '24h', days: 1 },
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: 'All', days: null },
]

function createMarkerIcon(riskLevel) {
  const color = RISK_COLORS[riskLevel] || RISK_COLORS.DEFAULT
  return L.divIcon({
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4);"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -10],
    className: '',
  })
}

function HeatmapLayer({ points, heatFilter }) {
  const map = useMap()
  
  // Configuration
  const SEARCH_RADIUS = 3000 // 3km radius for density calculation
  const THRESHOLDS = {
    HIGH: 15,
    MEDIUM: 8,
    LOW_MEDIUM: 3
  }
  
  const getDensityColor = (count) => {
    if (count >= THRESHOLDS.HIGH) return { color: '#ef4444', opacity: 0.25, label: 'High', level: 'HIGH' }
    if (count >= THRESHOLDS.MEDIUM) return { color: '#f97316', opacity: 0.22, label: 'Medium', level: 'MEDIUM' }
    if (count >= THRESHOLDS.LOW_MEDIUM) return { color: '#eab308', opacity: 0.2, label: 'Low-Medium', level: 'LOW_MEDIUM' }
    return { color: '#3b82f6', opacity: 0.15, label: 'Low', level: 'LOW' }
  }
  
  const calculateDensity = (centerPoint, allPoints) => {
    const [centerLat, centerLng] = centerPoint
    let count = 0
    
    allPoints.forEach(([lat, lng]) => {
      const distance = map.distance([centerLat, centerLng], [lat, lng])
      if (distance <= SEARCH_RADIUS) {
        count++
      }
    })
    
    return count
  }
  
  const clusterPoints = (points, minDistance = 500) => {
    const clusters = []
    const processed = new Set()
    
    points.forEach(([lat, lng], index) => {
      if (processed.has(index)) return
      
      // Find all points within minimum distance
      const nearbyPoints = []
      points.forEach(([plat, plng], i) => {
        if (map.distance([lat, lng], [plat, plng]) <= minDistance) {
          nearbyPoints.push(i)
          processed.add(i)
        }
      })
      
      // Calculate center of cluster
      const centerLat = nearbyPoints.reduce((sum, i) => sum + points[i][0], 0) / nearbyPoints.length
      const centerLng = nearbyPoints.reduce((sum, i) => sum + points[i][1], 0) / nearbyPoints.length
      
      clusters.push({
        center: [centerLat, centerLng],
        points: nearbyPoints,
        density: calculateDensity([centerLat, centerLng], points)
      })
    })
    
    return clusters
  }
  
  useEffect(() => {
    if (!map || points.length === 0) return

    let circles = []

    const renderDensityCircles = () => {
      circles.forEach(c => map.removeLayer(c))
      circles = []

      if (map.getZoom() < 8) return // Only show at reasonable zoom levels

      const clusters = clusterPoints(points)
      
      circles = clusters.map(({ center, density }) => {
        const { color, opacity, label, level } = getDensityColor(density)
        
        // Apply heat filter
        if (heatFilter !== 'ALL' && level !== heatFilter) {
          return null
        }
        
        return L.circle(center, {
          radius: 1800,
          fillColor: color,
          fillOpacity: opacity,
          color: color,
          weight: 0.5,
          pane: 'shadowPane',
        }).bindPopup(`
          <div style="font-family:system-ui;padding:6px;min-width:140px">
            <div style="font-weight:700;font-size:14px;margin-bottom:6px">📍 Density Zone</div>
            <div style="font-size:12px;color:#374151;margin-bottom:3px">
              Nearby reports: <strong>${density}</strong>
            </div>
            <div style="font-size:12px;color:#6b7280;margin-bottom:3px">
              Search radius: <strong>${SEARCH_RADIUS}m</strong>
            </div>
            <div style="font-size:12px;color:${color};font-weight:600">
              Density: <strong>${label}</strong>
            </div>
          </div>
        `).addTo(map)
      }).filter(Boolean) // Remove null values from filtering
    }

    renderDensityCircles()
    map.on('zoomend', renderDensityCircles)

    return () => {
      circles.forEach(c => map.removeLayer(c))
      map.off('zoomend', renderDensityCircles)
    }
  }, [map, points, SEARCH_RADIUS, heatFilter])
  
  return null
}

function LocateButton() {
  const map = useMap()
  const locate = () => {
    navigator.geolocation?.getCurrentPosition(
      ({ coords }) => map.flyTo([coords.latitude, coords.longitude], 14, { duration: 1.2 }),
      () => alert('Location access denied.')
    )
  }
  return (
    <div style={{ position: 'absolute', bottom: 90, right: 12, zIndex: 1000 }}>
      <button
        onClick={locate}
        title="Go to my location"
        style={{
          background: 'white', border: 'none', borderRadius: '8px',
          width: 36, height: 36, boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
      >📍</button>
    </div>
  )
}

function MapInner({ filteredReports, heatPoints, heatFilter }) {
  const map = useMap()
  const [zoom, setZoom] = useState(() => map.getZoom())

  useEffect(() => {
    const onZoom = () => setZoom(map.getZoom())
    map.on('zoomend', onZoom)
    return () => map.off('zoomend', onZoom)
  }, [map])

  return (
    <>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <HeatmapLayer points={heatPoints} heatFilter={heatFilter} />
      <LocateButton />
      {zoom >= 5 && filteredReports.map((report) => {
        if (!report.latitude || !report.longitude) return null
        const lat = parseFloat(report.latitude)
        const lng = parseFloat(report.longitude)
        if (isNaN(lat) || isNaN(lng) || lat > 85 || lat < -85 || lng > 180 || lng < -180) return null
        const icon = createMarkerIcon(report.risk_level)
        const catEmoji = CATEGORY_EMOJI[report.category] || '≡ƒîï'
        const statusEmoji = STATUS_EMOJI[report.status] || 'Γ¥ö'
        const timeAgo = report.created_at
          ? (() => {
              const diff = Date.now() - new Date(report.created_at).getTime()
              const d = Math.floor(diff / 86400000)
              const h = Math.floor((diff % 86400000) / 3600000)
              if (d > 0) return `${d}d ago` 
              if (h > 0) return `${h}h ago` 
              return 'Just now'
            })()
          : 'Unknown'
        return (
          <Marker key={report.id} position={[lat, lng]} icon={icon}>
            <Popup minWidth={220} maxWidth={280}>
              <div style={{ fontFamily: 'system-ui, sans-serif', padding: '2px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 20 }}>{catEmoji}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#111', textTransform: 'capitalize' }}>
                      {report.category || 'Other'}
                    </div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>{timeAgo}</div>
                  </div>
                </div>
                {report.description && (
                  <p style={{ fontSize: 12, color: '#374151', marginBottom: 8, lineHeight: 1.4, borderLeft: `3px solid ${RISK_COLORS[report.risk_level] || '#ccc'}`, paddingLeft: 8 }}>
                    {report.description.length > 100 ? report.description.slice(0, 100) + 'ΓÇª' : report.description}
                  </p>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 8px', fontSize: 11 }}>
                  <div style={{ color: '#6b7280' }}>Risk</div>
                  <div style={{ fontWeight: 600, color: RISK_COLORS[report.risk_level] || '#6b7280' }}>{report.risk_level || 'N/A'}</div>
                  <div style={{ color: '#6b7280' }}>Status</div>
                  <div style={{ fontWeight: 600 }}>{statusEmoji} {report.status?.replace('_', ' ') || 'N/A'}</div>
                  {report.submitter_email && (
                    <>
                      <div style={{ color: '#6b7280' }}>By</div>
                      <div style={{ fontWeight: 500, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{report.submitter_email}</div>
                    </>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </>
  )
}

function StatBadge({ label, value, color }) {
  return (
    <div className="flex flex-col items-center px-4 py-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm min-w-[70px]">
      <span className={`text-xl font-black ${color}`}>{value}</span>
      <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</span>
    </div>
  )
}

function ReportsMap() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ riskLevel: 'All', category: 'All', status: 'All' })
  const [timeFilter, setTimeFilter] = useState('All')
  const [heatFilter, setHeatFilter] = useState('ALL')

  useEffect(() => { fetchReports() }, [])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const data = await apiFetch('/reports?limit=1000&ai_processed=true')
      if (data.status === 'success') setReports(data.data || [])
      else setReports([])
    } catch { setReports([]) }
    finally { setLoading(false) }
  }

  const handleFilter = (type, value) => setFilters(prev => ({ ...prev, [type]: value }))

  const getDistance = (report1, report2) => {
    if (!report1.latitude || !report1.longitude || !report2.latitude || !report2.longitude) return Infinity
    const lat1 = parseFloat(report1.latitude)
    const lng1 = parseFloat(report1.longitude)
    const lat2 = parseFloat(report2.latitude)
    const lng2 = parseFloat(report2.longitude)
    
    // Simple distance calculation (in meters - approximate)
    const R = 6371000 // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  const getDensity = (report, reports) => {
    return reports.filter(r => getDistance(report, r) < 3000).length
  }

  const getHeatLevel = (count) => {
    if (count >= 15) return "HIGH"
    if (count >= 8) return "MEDIUM"
    if (count >= 3) return "LOW_MEDIUM"
    return "LOW"
  }

  const timeFilteredReports = reports.filter(r => {
    if (timeFilter === 'All') return true
    const days = TIME_FILTERS.find(t => t.label === timeFilter)?.days
    if (!days || !r.created_at) return true
    return Date.now() - new Date(r.created_at).getTime() <= days * 86400000
  })

  const filteredReports = timeFilteredReports.filter(r => {
    const matchRisk = filters.riskLevel === 'All' || r.risk_level === filters.riskLevel.toUpperCase()
    const matchCat = filters.category === 'All' || r.category === filters.category.toLowerCase()
    const matchStatus = filters.status === 'All' || r.status === filters.status.toUpperCase().replace(' ', '_')
    return matchRisk && matchCat && matchStatus
  })

  const withLocation = filteredReports.filter(r => r.latitude && r.longitude)
  const heatPoints = withLocation.map(r => [parseFloat(r.latitude), parseFloat(r.longitude), 0.5])

  const pendingCount = filteredReports.filter(r => r.status === 'OPEN').length
  const assignedCount = filteredReports.filter(r => ['ASSIGNED', 'IN_PROGRESS'].includes(r.status)).length
  const resolvedCount = filteredReports.filter(r => r.status === 'RESOLVED').length
  const highCount = filteredReports.filter(r => r.risk_level === 'HIGH').length

  const selectCls = "w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"

  if (loading) return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <div className="h-96 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse flex items-center justify-center">
        <span className="text-gray-400 text-sm">Loading map data…</span>
      </div>
    </div>
  )

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Water Issues Map</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Live community reports ΓÇö hover markers for details</p>
          </div>
          {/* Time filter pills */}
          <div className="flex gap-1.5">
            {TIME_FILTERS.map(t => (
              <button
                key={t.label}
                onClick={() => setTimeFilter(t.label)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  timeFilter === t.label
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-6 py-4">
        {/* Filters row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Category</label>
            <select value={filters.category} onChange={e => handleFilter('category', e.target.value)} className={selectCls}>
              <option value="All">All Categories</option>
              <option value="Leakage">💧 Leakage</option>
              <option value="Contamination">⚠️ Contamination</option>
              <option value="Blockage">🚧 Blockage</option>
              <option value="Other">📋 Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Risk Level</label>
            <select value={filters.riskLevel} onChange={e => handleFilter('riskLevel', e.target.value)} className={selectCls}>
              <option value="All">All Risks</option>
              <option value="High">🔴 High</option>
              <option value="Medium">🟡 Medium</option>
              <option value="Low">🔵 Low</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Status</label>
            <select value={filters.status} onChange={e => handleFilter('status', e.target.value)} className={selectCls}>
              <option value="All">All Statuses</option>
              <option value="OPEN">🔴 Open/Pending</option>
              <option value="ASSIGNED">🟡 Assigned</option>
              <option value="AWAITING_REVIEW">🟣 Awaiting Review</option>
              <option value="RESOLVED">✅ Resolved</option>
              <option value="REJECTED">❌ Rejected</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Heat Zone</label>
            <select value={heatFilter} onChange={(e) => setHeatFilter(e.target.value)} className={selectCls}>
              <option value="ALL">All Zones</option>
              <option value="HIGH">🔴 High (15+)</option>
              <option value="MEDIUM">🟠 Medium (8+)</option>
              <option value="LOW_MEDIUM">🟡 Low-Medium (3+)</option>
              <option value="LOW">🔵 Low (&lt;3)</option>
            </select>
          </div>
        </div>

        {/* Live stats */}
        <div className="flex flex-wrap gap-2 mb-4">
          <StatBadge label="Showing" value={withLocation.length} color="text-gray-800 dark:text-white" />
          <StatBadge label="Pending" value={pendingCount} color="text-yellow-500" />
          <StatBadge label="Assigned" value={assignedCount} color="text-blue-500" />
          <StatBadge label="Resolved" value={resolvedCount} color="text-green-500" />
          <StatBadge label="High Risk" value={highCount} color="text-red-500" />
        </div>

        {/* Map */}
        <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600" style={{ height: 480, position: 'relative' }}>
          <MapContainer
            center={[13.0827, 80.2707]}
            zoom={11}
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
          >
            <MapInner filteredReports={withLocation} heatPoints={heatPoints} heatFilter={heatFilter} />
          </MapContainer>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Density:</span>
          {[
            { label: 'High (15+)', color: '#ef4444' },
            { label: 'Medium (8+)', color: '#f97316' },
            { label: 'Low-Medium (3+)', color: '#eab308' },
            { label: 'Low', color: '#3b82f6' },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, border: '2px solid white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              <span className="text-xs text-gray-600 dark:text-gray-400">{label}</span>
            </div>
          ))}
          <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">· Markers = individual reports · Circles = density zones (3km radius)</span>
        </div>
      </div>
    </div>
  )
}

export default ReportsMap 