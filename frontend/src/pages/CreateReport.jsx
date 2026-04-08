import 'leaflet/dist/leaflet.css'

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../config/api'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import { motion } from 'framer-motion'
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import toast from 'react-hot-toast'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

function MapClickHandler({ setPosition, fetchLocationName }) {
  useMapEvents({
    click(e) {
      setPosition({
        lat: e.latlng.lat,
        lng: e.latlng.lng
      })
      fetchLocationName(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function FlyToLocation({ position }) {
  const map = useMap()
  useEffect(() => {
    if (position) map.flyTo([position.lat, position.lng], 15, { animate: true, duration: 1.5 })
  }, [position, map])
  return null
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' }
  })
}

function CreateReport() {
  const [description, setDescription] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [image, setImage] = useState(null)
  const [position, setPosition] = useState(null)
  const [locationName, setLocationName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [mapKey] = useState(() => `map-${Date.now()}-${Math.random()}`)
  const navigate = useNavigate()
  const { user } = useAuth()
  const searchTimerRef = useRef(null)

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith("image/")) {
      if (file.size > 1 * 1024 * 1024) {
        setError("Image must be less than 1MB. Please choose a smaller file.")
        return
      }
      setImage(file)
      setImageFile(file)
    }
  }

  const handleDragOver = (e) => e.preventDefault()

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 1 * 1024 * 1024) {
        setError("Image must be less than 1MB. Please choose a smaller file.")
        return
      }
      setImage(file)
      setImageFile(file)
    }
  }

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude
          const lng = pos.coords.longitude
          setPosition({ lat, lng })
          fetchLocationName(lat, lng)
        },
        (error) => console.error('Location error:', error),
        { enableHighAccuracy: true, timeout: 10000 }
      )
    }
  }, [])

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSearchResults && !event.target.closest('.relative')) {
        setShowSearchResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSearchResults])

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser")
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        fetchLocationName(pos.coords.latitude, pos.coords.longitude)
      },
      (error) => {
        alert("Unable to retrieve your location")
        console.error(error)
      }
    )
  }

  const handleSearch = async (query = searchQuery) => {
    if (!query.trim() || query.length < 3) return

    setSearchLoading(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=8`
      )
      const data = await res.json()
      setSearchResults(data || [])
      setShowSearchResults(true)
    } catch (error) {
      console.error('Search failed:', error)
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }

  const handlePlaceSelect = (place) => {
    const { lat, lon, display_name } = place
    setPosition({ lat: parseFloat(lat), lng: parseFloat(lon) })
    setLocationName(display_name)
    setShowSearchResults(false)
    setSearchQuery('')
  }

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch(searchQuery)
    }
  }

  const closeSearchResults = () => {
    setShowSearchResults(false)
  }

  async function fetchLocationName(lat, lng) {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
      const data = await res.json()
      if (data.display_name) setLocationName(data.display_name)
    } catch (error) {
      console.error('Reverse geocoding failed', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Prevent duplicate submissions
    if (isSubmitting) {
      return
    }
    
    setIsSubmitting(true)
    setLoading(true)
    setError('')
    setSuccess('')

    if (!position) {
      toast.error('Please select a location on the map.')
      setLoading(false)
      return
    }
    if (!description && !imageFile) {
      toast.error("Please provide either a description or upload an image before submitting the report.")
      setLoading(false)
      return
    }

    const toastId = toast.loading('Submitting report...')

    try {
      const formData = new FormData()
      formData.append("description", description)
      formData.append("user_id", user?.id || "citizen_demo")
      formData.append("latitude", position.lat)
      formData.append("longitude", position.lng)
      formData.append("location", locationName || "Location not provided")
      if (imageFile) formData.append("image", imageFile)

      const data = await apiFetch('/reports', { method: 'POST', body: formData })
      const parsedData = typeof data === 'string' ? JSON.parse(data) : data

      if (parsedData.success) {
        toast.dismiss(toastId)
        toast.success('Report submitted successfully!')
        setTimeout(() => {
          navigate('/citizen')
        }, 1500)
      } else {
        throw new Error(parsedData.message || parsedData.error || 'Failed to submit report')
      }
    } catch (err) {
      toast.dismiss(toastId)
      toast.error('Failed to submit report. Please try again.')
    } finally {
      setLoading(false)
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@300;400;500;600&display=swap');
        .cr-page {
          background: #050B18;
          min-height: 100vh;
          font-family: 'Inter', sans-serif;
          color: white;
          position: relative;
          overflow-x: hidden;
        }
        .cr-grid-bg {
          position: fixed;
          inset: 0;
          background-image: linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px);
          background-size: 50px 50px;
          z-index: 0;
          pointer-events: none;
        }
        .cr-orb {
          position: fixed;
          border-radius: 50%;
          filter: blur(80px);
          animation: crFloat 8s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes crFloat {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-30px) scale(1.05); }
        }
        .cr-glass-card {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          backdrop-filter: blur(20px);
          border-radius: 20px;
          padding: 40px;
        }
        @media (max-width: 768px) {
          .cr-glass-card { padding: 24px 20px; }
        }
        .cr-section-title {
          font-family: 'Syne', sans-serif;
          font-size: 18px;
          font-weight: 700;
          color: white;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .cr-label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: rgba(255,255,255,0.5);
          margin-bottom: 8px;
        }
        .cr-textarea {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 14px 16px;
          color: white;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          outline: none;
          transition: all 0.3s ease;
          resize: none;
          box-sizing: border-box;
          line-height: 1.6;
        }
        .cr-textarea::placeholder { color: rgba(255,255,255,0.3); }
        .cr-textarea:focus {
          border-color: #3B82F6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.15);
        }
        .cr-input {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 12px 16px;
          color: white;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          outline: none;
          transition: all 0.3s ease;
          box-sizing: border-box;
        }
        .cr-input::placeholder { color: rgba(255,255,255,0.3); }
        .cr-input:focus {
          border-color: #3B82F6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.15);
        }
        .cr-dropzone {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 220px;
          border: 2px dashed rgba(255,255,255,0.15);
          border-radius: 16px;
          cursor: pointer;
          background: rgba(255,255,255,0.03);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        .cr-dropzone:hover {
          border-color: rgba(59,130,246,0.4);
          background: rgba(59,130,246,0.05);
        }
        .cr-btn-primary {
          background: #3B82F6;
          color: white;
          border: none;
          border-radius: 12px;
          padding: 14px 28px;
          font-weight: 600;
          font-size: 15px;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .cr-btn-primary:hover:not(:disabled) {
          background: #2563EB;
          transform: translateY(-1px);
          box-shadow: 0 8px 25px rgba(59,130,246,0.4);
        }
        .cr-btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .cr-btn-ghost {
          background: transparent;
          color: rgba(255,255,255,0.7);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 12px;
          padding: 14px 28px;
          font-weight: 500;
          font-size: 15px;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .cr-btn-ghost:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.3);
          color: white;
        }
        .cr-btn-small {
          background: #3B82F6;
          color: white;
          border: none;
          border-radius: 12px;
          padding: 10px 20px;
          font-weight: 600;
          font-size: 13px;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .cr-btn-small:hover:not(:disabled) {
          background: #2563EB;
          box-shadow: 0 4px 12px rgba(59,130,246,0.3);
        }
        .cr-btn-small:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .cr-search-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          z-index: 99999;
          background: rgba(15,20,35,0.98);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          max-height: 200px;
          overflow-y: auto;
          margin-top: 6px;
          backdrop-filter: blur(20px);
          box-shadow: 0 15px 40px rgba(0,0,0,0.4);
        }
        .cr-search-item {
          padding: 12px 16px;
          font-size: 13px;
          cursor: pointer;
          color: rgba(255,255,255,0.7);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          transition: all 0.15s ease;
        }
        .cr-search-item:last-child { border-bottom: none; }
        .cr-search-item:hover {
          background: rgba(59,130,246,0.1);
          color: white;
        }
        .cr-info-box {
          background: rgba(59,130,246,0.08);
          border: 1px solid rgba(59,130,246,0.2);
          border-radius: 12px;
          padding: 14px 18px;
          font-size: 13px;
          color: #60A5FA;
        }
        .cr-error-box {
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.25);
          border-radius: 12px;
          padding: 14px 18px;
          font-size: 13px;
          color: #FCA5A5;
        }
        .cr-success-box {
          background: rgba(34,197,94,0.1);
          border: 1px solid rgba(34,197,94,0.25);
          border-radius: 12px;
          padding: 14px 18px;
          font-size: 13px;
          color: #86EFAC;
        }
        .cr-location-box {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 14px 18px;
        }
        .cr-map-wrapper {
          border: 2px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          overflow: hidden;
        }
        .cr-remove-btn {
          position: absolute;
          top: 12px;
          right: 12px;
          background: rgba(239,68,68,0.9);
          color: white;
          border: none;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 14px;
          font-weight: 700;
          transition: all 0.2s ease;
          backdrop-filter: blur(10px);
          z-index: 5;
        }
        .cr-remove-btn:hover {
          background: #EF4444;
          transform: scale(1.1);
        }
      `}</style>

      <div className="cr-page">
        <div className="cr-grid-bg" />
        <div className="cr-orb" style={{ width: 400, height: 400, background: 'rgba(59,130,246,0.1)', top: '-5%', right: '-10%', animationDelay: '0s' }} />
        <div className="cr-orb" style={{ width: 300, height: 300, background: 'rgba(167,139,250,0.08)', bottom: '10%', left: '-8%', animationDelay: '4s' }} />

        <div style={{ maxWidth: 860, margin: '0 auto', padding: '100px 16px 60px', position: 'relative', zIndex: 10 }}>
          <motion.div
            className="cr-glass-card"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
          >
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <motion.h1
                variants={fadeUp} initial="hidden" animate="visible" custom={1}
                style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 800, marginBottom: 8, letterSpacing: '-0.5px' }}
              >
                Create Water Report
              </motion.h1>
              <motion.p
                variants={fadeUp} initial="hidden" animate="visible" custom={2}
                style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}
              >
                Report water issues in your community
              </motion.p>
            </div>
            
            {/* Info box */}
            <div className="cr-info-box" style={{ marginBottom: 28 }}>
              Please provide either a description or upload an image (or both). Location selection is required.
            </div>

            {error && (
              <div className="cr-error-box" style={{ marginBottom: 24 }}>
                {error}
              </div>
            )}
            {success && (
              <div className="cr-success-box" style={{ marginBottom: 24 }}>
                {success}
              </div>
            )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

                {/* Description Section */}
                <div>
                  <div className="cr-section-title">
                    <span>📝</span> Description
                  </div>
                  <div>
                    <label className="cr-label">
                      Describe the water issue (optional)
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="cr-textarea"
                      style={{ height: 140 }}
                      placeholder="Please provide detailed information about the water issue you want to report..."
                    />
                  </div>
                </div>

                {/* Image Upload Section */}
                <div>
                  <div className="cr-section-title">
                    <span>📷</span> Image Upload
                  </div>
                  <div>
                    <label className="cr-label">
                      Upload a photo of the issue (optional)
                    </label>
                    <div>
                      <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" id="image-upload" style={{ display: 'none' }} />
                      <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        className="cr-dropzone"
                        onClick={() => document.getElementById('image-upload').click()}
                      >
                        {image ? (
                          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                            <img src={URL.createObjectURL(image)} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 14 }} />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setImage(null)
                                setImageFile(null)
                                document.getElementById('image-upload').value = ''
                              }}
                              className="cr-remove-btn"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                            <svg width="36" height="36" fill="none" stroke="rgba(255,255,255,0.3)" viewBox="0 0 24 24" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Upload Photo</p>
                            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Drag & drop or click to upload</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Location Section */}
                <div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                      <div className="cr-section-title" style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0, flex: 1, minWidth: 200 }}>
                        <span>📍</span> Location Selection
                      </div>
                      <button
                        type="button"
                        onClick={handleUseMyLocation}
                        className="cr-btn-small"
                      >
                        📍 Use My Location
                      </button>
                    </div>
                  </div>

                  {/* Search Box */}
                  <div className="relative" style={{ position: 'relative', zIndex: 99999, marginBottom: 16 }}>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                          const val = e.target.value
                          setSearchQuery(val)
                          
                          if (searchTimerRef.current) {
                            clearTimeout(searchTimerRef.current)
                          }
                          
                          if (val.length > 2) {
                            searchTimerRef.current = setTimeout(() => {
                              handleSearch(val)
                            }, 500)
                          } else {
                            setSearchResults([])
                            setShowSearchResults(false)
                          }
                        }}
                        onKeyDown={handleSearchKeyDown}
                        placeholder="Search for a place..."
                        className="cr-input"
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        onClick={() => handleSearch(searchQuery)}
                        disabled={searchLoading}
                        className="cr-btn-small"
                      >
                        {searchLoading ? '...' : 'Search'}
                      </button>
                    </div>

                    {/* Search Results Dropdown */}
                    {showSearchResults && (
                      <div className="cr-search-dropdown">
                        {searchResults.length === 0 ? (
                          <div style={{ padding: '12px 16px', fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
                            No places found
                          </div>
                        ) : (
                          searchResults.map((place, index) => (
                            <div
                              key={index}
                              onClick={() => handlePlaceSelect(place)}
                              className="cr-search-item"
                            >
                              {place.display_name}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {position && locationName && (
                    <div className="cr-location-box" style={{ marginBottom: 16 }}>
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>📍 {locationName}</p>
                    </div>
                  )}

                  <div className="cr-map-wrapper">
                    <MapContainer
                      key={mapKey}
                      center={[9.9252, 78.1198]}
                      zoom={13}
                      style={{ height: '280px', width: '100%', zIndex: 1 }}
                      className="md:!h-[350px]"
                    >
                      <TileLayer
                        attribution='&copy; OpenStreetMap contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <MapClickHandler setPosition={setPosition} fetchLocationName={fetchLocationName} />
                      <FlyToLocation position={position} />
                      {position && <Marker position={position} />}
                    </MapContainer>
                  </div>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: 10 }}>Tap on the map to pin your location</p>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', gap: 12, paddingTop: 28, borderTop: '1px solid rgba(255,255,255,0.08)', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => navigate('/citizen')}
                    className="cr-btn-ghost"
                    style={{ flex: '1 1 auto', maxWidth: 160 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || isSubmitting}
                    className="cr-btn-primary"
                    style={{ flex: '1 1 auto', maxWidth: 200 }}
                  >
                    {loading ? (
                      <>
                        <svg style={{ display: 'inline', marginRight: 8, animation: 'spin 1s linear infinite' }} width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                          <path d="M12 2a10 10 0 019.95 9" stroke="white" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                        Submitting...
                      </>
                    ) : 'Submit Report'}
                  </button>
                </div>

              </form>
          </motion.div>
        </div>
      </div>
    </>
  )
}

export default CreateReport