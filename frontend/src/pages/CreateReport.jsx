import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

function MapClickHandler({ setPosition, fetchLocationName }) {
  useMapEvents({
    click(e) {
      const newPosition = [e.latlng.lat, e.latlng.lng]
      setPosition(newPosition)
      fetchLocationName(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function CreateReport() {
  const [description, setDescription] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [image, setImage] = useState(null)
  const [position, setPosition] = useState(null)
  const [locationName, setLocationName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()
  const { user } = useAuth()
  const mapRef = useRef(null)

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    
    if (file && file.type.startsWith("image/")) {
      setImage(file)
      setImageFile(file)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImage(file)
      setImageFile(file)
    }
  }

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        },
        (error) => {
          console.error('Location error:', error)
        }
      )
    }
  }, [])

  const handleUseMyLocation = async () => {
  try {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude
          const lng = pos.coords.longitude
          const newPosition = [lat, lng]
          setPosition(newPosition)
          
          // Update map center and zoom
          if (mapRef.current) {
            mapRef.current.setView(newPosition, 14)
          }
          
          fetchLocationName(lat, lng)
        },
        async () => {
          await useIPLocation()
        },
        { enableHighAccuracy: true, timeout: 5000 }
      )
    } else {
      await useIPLocation()
    }
  } catch (err) {
    setError('Could not detect location. Please click on the map.')
  }
}

  const useIPLocation = async () => {
    try {
      const res = await fetch('https://ipapi.co/json/')
      const data = await res.json()
      if (data.latitude && data.longitude) {
        setPosition({ lat: data.latitude, lng: data.longitude })
        fetchLocationName(data.latitude, data.longitude)
      }
    } catch (err) {
      setError('Could not detect location. Please click on the map.')
    }
  }

  async function fetchLocationName(lat, lng) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      )
      const data = await res.json()
      if (data.display_name) {
        setLocationName(data.display_name)
      }
    } catch (error) {
      console.error('Reverse geocoding failed', error)
    }
  }

  function LocationMarker({ setPosition, fetchLocationName }) {
    useMapEvents({
      click(e) {
        const lat = e.latlng.lat
        const lng = e.latlng.lng
        setPosition({ lat, lng })
        fetchLocationName(lat, lng)
      },
    })
    return null
  }

  const FlyToLocation = ({ position }) => {
    const map = useMap()
    useEffect(() => {
      if (position) {
        map.flyTo([position.lat, position.lng], 15, {
          animate: true,
          duration: 1.5
        })
      }
    }, [position, map])
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (!position) {
      setError('Please select a location on the map.')
      setLoading(false)
      return
    }

    if (!imageFile) {
      setError('Please upload an image of the issue.')
      setLoading(false)
      return
    }

    try {
      // ✅ Send everything to /reports as FormData
      // Backend handles: NLP + CLIP AI analysis + Supabase insert
      const formData = new FormData()
      formData.append('description', description)
      formData.append('user_id', user.id)
      
      // Handle position in both array and object formats
      const lat = Array.isArray(position) ? position[0] : position.lat
      const lng = Array.isArray(position) ? position[1] : position.lng
      
      formData.append('latitude', lat.toString())
      formData.append('longitude', lng.toString())
      formData.append('image', imageFile)

      const response = await fetch('http://127.0.0.1:8000/reports', {
        method: 'POST',
        body: formData
        // ✅ Do NOT set Content-Type header — browser sets it automatically with boundary
      })

      const data = await response.json()

      if (data.status === 'success') {
        setSuccess('Report submitted successfully!')
        setTimeout(() => navigate('/citizen'), 2000)
      } else {
        throw new Error(data.message || data.error || 'Failed to submit report')
      }

    } catch (err) {
      setError(err.message || 'Failed to submit report')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
    >
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-200 dark:from-gray-900 dark:to-gray-800 py-8">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-8">
            <h1 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-gray-100">Create Report</h1>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg mb-6">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Description Section */}
              <div className="space-y-3">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
                  📝 Description
                </h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Describe the water issue <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                    style={{ height: '140px' }}
                    placeholder="Please provide detailed information about the water issue you want to report..."
                    required
                  />
                </div>
              </div>

              {/* Image Upload Section */}
              <div className="space-y-3">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
                  📷 Image Upload
                </h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Upload a photo of the issue <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="image-upload"
                    />
                    <div
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      className="flex flex-col items-center justify-center w-full h-56 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors relative"
                      onClick={() => document.getElementById('image-upload').click()}
                    >
                      {image ? (
                        <div className="image-preview-container relative w-full h-full">
                          <img
                            src={URL.createObjectURL(image)}
                            alt="preview"
                            className="upload-preview w-full h-56 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setImage(null)
                              setImageFile(null)
                              document.getElementById('image-upload').value = ''
                            }}
                            className="remove-btn absolute top-[10px] right-[10px] bg-[#ef4444] hover:bg-red-700 text-white rounded-full w-[26px] h-[26px] border-none cursor-pointer flex items-center justify-center text-sm font-bold transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <svg className="w-8 h-8 mb-3 text-gray-400 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                            <span className="font-semibold">Upload Photo</span>
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Drag & drop or click to upload</p>
                        </div>
                      )}
                    </div>
                  </div>
                  {imageFile && !image && (
                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      Selected: {imageFile.name}
                    </div>
                  )}
                </div>
              </div>

              {/* Location Selection Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
                    📍 Location Selection
                  </h2>
                  <button
                    type="button"
                    onClick={handleUseMyLocation}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    📍 Use My Location
                  </button>
                </div>
                
                {position && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-3">
                    {locationName && (
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        📍 Location: {locationName}
                      </p>
                    )}
                  </div>
                )}
                
                <div className="border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                  <MapContainer
                    ref={mapRef}
                    center={[9.9252, 78.1198]}
                    zoom={13}
                    style={{ height: '350px', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; OpenStreetMap contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapClickHandler setPosition={setPosition} fetchLocationName={fetchLocationName} />
                    {position && <Marker position={position} />}
                  </MapContainer>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => navigate('/citizen')}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default CreateReport