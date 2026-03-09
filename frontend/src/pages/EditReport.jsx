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
        console.log("Fetched report data:", data)
        console.log("image_url:", data.image_url)
        setDescription(data.description)
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
    >
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-200 dark:from-gray-900 dark:to-gray-800 py-8">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-8">
            <h1 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-gray-100">Edit Report</h1>

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
                        className="w-full h-56 object-cover rounded-lg"
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
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? 'Updating...' : 'Update Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default EditReport
