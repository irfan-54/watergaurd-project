import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'

function CreateReport() {
  const [description, setDescription] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [position, setPosition] = useState(null)
  const [locationName, setLocationName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()
  const { user } = useAuth()

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
      // Try browser geolocation first
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lat = pos.coords.latitude
            const lng = pos.coords.longitude
            // Sanity check - if coords look wrong (e.g. Korea), use IP fallback
            setPosition({ lat, lng })
            fetchLocationName(lat, lng)
          },
          async () => {
            // Permission denied - use IP fallback
            await useIPLocation()
          },
          { timeout: 5000 }
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
      );
      const data = await res.json();
      if (data.display_name) {
        setLocationName(data.display_name);
      }
    } catch (error) {
      console.error("Reverse geocoding failed", error);
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

  try {
    let imageUrl = null

    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}` 
      const { data, error: uploadError } = await supabase.storage
        .from('report-images')
        .upload(fileName, imageFile)

      if (uploadError) throw uploadError.message

      const { data: { publicUrl } } = supabase.storage
        .from('report-images')
        .getPublicUrl(fileName)

      imageUrl = publicUrl
    }

    // Call AI classification
    let category = 'other'
    let risk_level = 'LOW'

    try {
      const aiResponse = await fetch('http://127.0.0.1:8000/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: description })
      })
      const aiData = await aiResponse.json()
      category = aiData.category || 'other'
      risk_level = aiData.risk_level || 'LOW'
    } catch (aiErr) {
      console.log('AI classification failed, using defaults')
    }

    const { error: insertError } = await supabase
      .from('reports')
      .insert({
        description,
        image_url: imageUrl,
        latitude: position.lat,
        longitude: position.lng,
        user_id: user.id,
        status: 'OPEN',
        category: category,
        risk_level: risk_level,
        created_at: new Date().toISOString()
      })

    if (insertError) throw insertError.message

    setSuccess('Report submitted successfully!')
    setTimeout(() => {
      navigate('/citizen')
    }, 2000)

  } catch (err) {
    setError(err.message || 'Failed to submit report')
  } finally {
    setLoading(false)
  }
}

  const handleFileChange = (e) => {
    const files = e.target.files
    if (files && files.length > 0) {
      if (files.length > 1) {
        setError('Only 1 image allowed per report')
        return
      }
      setImageFile(files[0])
    }
  }

  // Add this component inside CreateReport, before the return
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white shadow-lg rounded-xl p-8">
          <h1 className="text-2xl font-bold text-center mb-6">Create Report</h1>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Describe the issue you want to report..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image (optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="font-medium">Select Location *</label>
                <button
                  type="button"
                  onClick={handleUseMyLocation}
                  className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  📍 Use My Location
                </button>
              </div>
              {position && (
                <div className="mb-2">
                  {locationName && (
                    <p className="text-sm text-gray-700 mb-1">
                      📍 Location: {locationName}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    📌 Lat: {position.lat.toFixed(4)}, Lng: {position.lng.toFixed(4)}
                  </p>
                </div>
              )}
              <MapContainer
                center={[9.9252, 78.1198]}
                zoom={13}
                style={{ height: '300px', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <FlyToLocation position={position} />
                <LocationMarker setPosition={setPosition} fetchLocationName={fetchLocationName} />
                {position && <Marker position={position} />}
              </MapContainer>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
              >
                {loading ? 'Submitting...' : 'Submit Report'}
              </button>
              
              <button
                type="button"
                onClick={() => navigate('/citizen')}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CreateReport
