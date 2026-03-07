import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

function ReportsMap() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    riskLevel: 'All',
    category: 'All',
    status: 'All'
  })

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }))
  }

  useEffect(() => {
    fetchReports()
  }, [])

  // Filter reports based on current filters
  const filteredReports = reports.filter(report => {
    const matchesRisk = filters.riskLevel === 'All' || report.risk_level === filters.riskLevel.toUpperCase()
    const matchesCategory = filters.category === 'All' || report.category === filters.category.toLowerCase()
    const matchesStatus = filters.status === 'All' || report.status === filters.status.toUpperCase().replace(' ', '_')
    return matchesRisk && matchesCategory && matchesStatus
  })

  // Convert report coordinates to heatmap points
  const heatPoints = reports
    .filter(r => r.latitude && r.longitude)
    .map(r => [r.latitude, r.longitude, 0.5])

  // Heatmap Layer Component
  const HeatmapLayer = ({ points }) => {
    const map = useMap()

    useEffect(() => {
      if (!map || points.length === 0) return

      const getDensityColor = (count) => {
        if (count >= 16) return { color: '#ef4444', opacity: 0.30 }
        if (count >= 11) return { color: '#f97316', opacity: 0.28 }
        if (count >= 6)  return { color: '#eab308', opacity: 0.25 }
        if (count >= 3)  return { color: '#22c55e', opacity: 0.22 }
        return { color: '#3b82f6', opacity: 0.20 }
      }

      // Cluster reports - one hotspot circle per cluster
      const processed = new Set()
      const hotspots = []

      points.forEach(([lat, lng], index) => {
        if (processed.has(index)) return

        const nearby = []
        points.forEach(([plat, plng], i) => {
          const dist = map.distance([lat, lng], [plat, plng])
          if (dist <= 3000) {
            nearby.push(i)
          }
        })

        nearby.forEach(i => processed.add(i))
        hotspots.push({ lat, lng, count: nearby.length })
      })

      const getSeverity = (count) => {
        if (count >= 16) return 'Extreme'
        if (count >= 11) return 'Very High'
        if (count >= 6)  return 'High'
        if (count >= 3)  return 'Medium'
        return 'Low'
      }

      const circles = hotspots.map(({ lat, lng, count }) => {
        const { color, opacity } = getDensityColor(count)
        const severity = getSeverity(count)

        const circle = L.circle([lat, lng], {
          radius: 1500,
          fillColor: color,
          fillOpacity: opacity,
          color: color,
          weight: 1,
          pane: 'shadowPane'
        })

        circle.bindPopup(`
          <div style="text-align:center; min-width:140px;">
            <strong>⚠️ Community Hotspot</strong><br/>
            <hr style="margin:4px 0"/>
            📊 Reports: <strong>${count}</strong><br/>
            📍 Radius: 3km<br/>
            🔴 Severity: <strong>${severity}</strong>
          </div>
        `)

        circle.addTo(map)
        return circle
      })

      return () => {
        circles.forEach(c => map.removeLayer(c))
      }
    }, [map, points])

    return null
  }

  const fetchReports = async () => {
    try {
      setLoading(true)
      console.log('Fetching reports...')
      const response = await fetch('http://127.0.0.1:8000/reports')
      const data = await response.json()
      console.log('Reports fetched:', data)

      if (data.status === 'success') {
        setReports(data.data || [])
      } else {
        console.warn('Failed to fetch reports:', data.message)
        setReports([]) // Allow map to render with empty reports
      }
    } catch (err) {
      console.error('Failed to fetch reports:', err)
      setReports([]) // Allow map to render even if fetch fails
    } finally {
      setLoading(false)
    }
  }

  const getMarkerColor = (riskLevel) => {
    switch (riskLevel) {
      case 'HIGH':
        return 'red'
      case 'MEDIUM':
        return 'yellow'
      case 'LOW':
        return 'blue'
      default:
        return 'gray'
    }
  }

  const createCustomIcon = (color) => {
    return L.divIcon({
      html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
      popupAnchor: [0, -10],
      className: 'custom-marker'
    })
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Water Complaints Map</h2>
        <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
          <div className="text-gray-600">Loading map...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Water Complaints Map</h2>
      
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="All">All</option>
            <option value="Leakage">Leakage</option>
            <option value="Contamination">Contamination</option>
            <option value="Blockage">Blockage</option>
            <option value="Other">Other</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Risk Level</label>
          <select
            value={filters.riskLevel}
            onChange={(e) => handleFilterChange('riskLevel', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="All">All</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="All">All</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>
      
      {/* Legend */}
      <div className="mb-4">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-blue-500"></div><span>Low (1–2)</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-green-500"></div><span>Medium (3–5)</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-yellow-500"></div><span>High (6–10)</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-orange-500"></div><span>Very High (11–15)</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-red-500"></div><span>Extreme (16+)</span></div>
        </div>
      </div>

      <div className="h-96 rounded-lg overflow-hidden border border-gray-200">
        <MapContainer
          center={[13.0827, 80.2707]}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <HeatmapLayer points={heatPoints} />
          
          {filteredReports.map((report) => {
            if (!report.latitude || !report.longitude) return null
            
            const markerColor = getMarkerColor(report.risk_level)
            const customIcon = createCustomIcon(markerColor)
            
            return (
              <Marker
                key={report.id}
                position={[parseFloat(report.latitude), parseFloat(report.longitude)]}
                icon={customIcon}
                options={{ pane: 'markerPane' }}
              >
                <Popup>
                  <div className="text-sm max-w-xs">
                    <p className="font-semibold mb-2">{report.description}</p>
                    <p className="mb-1"><strong>Category:</strong> {report.category || 'Other'}</p>
                    <p className="mb-1"><strong>Risk Level:</strong> {report.risk_level || 'LOW'}</p>
                    <p className="mb-1"><strong>Status:</strong> {report.status || 'OPEN'}</p>
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        Showing {filteredReports.filter(r => r.latitude && r.longitude).length} of {reports.filter(r => r.latitude && r.longitude).length} reports with location data
      </div>
    </div>
  )
}

export default ReportsMap
