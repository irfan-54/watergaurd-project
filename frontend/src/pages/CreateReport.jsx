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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity:0, y:16 }}
          animate={{ opacity:1, y:0 }}
          transition={{ duration:0.4 }}
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-lg p-6 md:p-8"
        >
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Create Water Report</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Report water issues in your community</p>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 px-4 py-3 rounded-xl mb-6">
            <p className="text-sm">Please provide either a description or upload an image (or both). Location selection is required.</p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl mb-6">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 px-4 py-3 rounded-xl mb-6">
              {success}
            </div>
          )}

            <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">

              <div className="space-y-3">
                <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
                  📝 Description
                </h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Describe the water issue (optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                    style={{ height: '140px' }}
                    placeholder="Please provide detailed information about the water issue you want to report..."
                  />
                </div>
              </div>

              <div className="space-y-3">
                <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
                  📷 Image Upload
                </h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Upload a photo of the issue (optional)
                  </label>
                  <div className="relative">
                    <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" id="image-upload" />
                    <div
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      className="flex flex-col items-center justify-center w-full h-48 md:h-56 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative"
                      onClick={() => document.getElementById('image-upload').click()}
                    >
                      {image ? (
                        <div className="image-preview-container relative w-full h-full">
                          <img src={URL.createObjectURL(image)} alt="preview" className="w-full h-48 md:h-56 object-cover rounded-xl" />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setImage(null)
                              setImageFile(null)
                              document.getElementById('image-upload').value = ''
                            }}
                            className="absolute top-3 right-3 bg-red-600 hover:bg-red-700 text-white rounded-full w-8 h-8 border-none cursor-pointer flex items-center justify-center text-sm font-bold transition-colors shadow-lg"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <svg className="w-8 h-8 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Upload Photo</span></p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Drag & drop or click to upload</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
                    📍 Location Selection
                  </h2>
                  <button
                    type="button"
                    onClick={handleUseMyLocation}
                    className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow"
                  >
                    📍 Use My Location
                  </button>
                </div>

                {/* Search Box */}
                <div className="relative" style={{ position: 'relative', zIndex: 99999 }}>
                  <div className="flex gap-2">
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
                      className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleSearch(searchQuery)}
                      disabled={searchLoading}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {searchLoading ? '...' : 'Search'}
                    </button>
                  </div>

                  {/* Search Results Dropdown */}
                  {showSearchResults && (
                    <div 
                      className="absolute w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                      style={{ zIndex: 99999, position: 'absolute', top: '100%', left: 0, right: 0 }}
                    >
                      {searchResults.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                          No places found
                        </div>
                      ) : (
                        searchResults.map((place, index) => (
                          <div
                            key={index}
                            onClick={() => handlePlaceSelect(place)}
                            className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white border-b border-gray-100 last:border-0"
                          >
                            {place.display_name}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {position && locationName && (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                    <p className="text-sm text-gray-700 dark:text-gray-300"> 📍 {locationName}</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">📍 {locationName}</p>
                  </div>
                )}

                <div className="border-2 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
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
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">Tap on the map to pin your location</p>
              </div>

              <div className="flex flex-col-reverse md:flex-row md:justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => navigate('/citizen')}
                  className="w-full md:w-auto px-6 py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || isSubmitting}
                  className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow relative"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4V12zm4 0v8h8v-8H8z"></path>
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
  )
}

export default CreateReport