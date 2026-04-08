import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

function EditReport() {
  const [description, setDescription] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [image, setImage] = useState(null)
  const [imageUrl, setImageUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuth()

  useEffect(() => {
    fetchReport()
  }, [id])

  const fetchReport = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (error) {
        setError(error.message)
      } else if (data) {
        setDescription(data.description || '')
        setImageUrl(data.image_url || "")
      }
    } catch (err) {
      setError('Failed to fetch report')
    }
  }

  const handleUpdate = async () => {
    try {
      setLoading(true)
      setError('')
      setSuccess('')

      const updates = { description }

      if (imageFile) {
        // Upload new image to Supabase storage
        const filePath = `reports/${Date.now()}-${imageFile.name}`
        const { error: uploadError } = await supabase.storage
          .from('report-images')
          .upload(filePath, imageFile)

        if (uploadError) {
          throw new Error('Failed to upload image: ' + uploadError.message)
        }

        // Get public URL for uploaded image
        const { data: publicUrlData } = supabase.storage
          .from('report-images')
          .getPublicUrl(filePath)

        updates.image_url = publicUrlData.publicUrl
      }

      // Update report in Supabase
      const { error: updateError } = await supabase
        .from('reports')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)

      if (updateError) {
        throw new Error('Failed to update report: ' + updateError.message)
      }

      setSuccess('Report updated successfully!')
      setTimeout(() => {
        navigate('/citizen')
      }, 2000)

    } catch (err) {
      setError(err.message || 'Failed to update report')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    await handleUpdate()
  }

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

  return (
    <motion.div
      initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:0.3 }}
    >
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity:0, y:16 }}
            animate={{ opacity:1, y:0 }}
            transition={{ duration:0.4 }}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-lg p-6 md:p-8"
          >
            <div className="text-center mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Edit Water Report</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Update your water issue report</p>
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
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                    style={{ height: '140px' }}
                    placeholder="Please provide detailed information about the water issue..."
                    required
                  />
                </div>
              </div>

              {/* Current Image Section */}
              {imageUrl && (
                <div className="space-y-3">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
                    🖼️ Current Image
                  </h2>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Current report image
                    </label>
                    <div className="relative">
                      <img 
                        src={imageUrl} 
                        alt="Current report" 
                        className="w-full h-56 object-cover rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Image Upload Section */}
              <div className="space-y-3">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
                  📷 Replace Image (Optional)
                </h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Upload a new photo of the issue
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
                      className="flex flex-col items-center justify-center w-full h-56 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative"
                      onClick={() => document.getElementById('image-upload').click()}
                    >
                      {image ? (
                        <div className="image-preview-container relative w-full h-full">
                          <img
                            src={URL.createObjectURL(image)}
                            alt="preview"
                            className="w-full h-56 object-cover rounded-xl"
                          />
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
                          <svg className="w-8 h-8 mb-3 text-gray-400 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                            <span className="font-semibold">Upload New Photo</span>
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

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => navigate('/citizen')}
                  className="px-6 py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow"
                >
                  {loading ? 'Updating...' : 'Update Report'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}

export default EditReport
