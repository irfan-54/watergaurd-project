import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

function EditReport() {
  const [description, setDescription] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [existingImage, setExistingImage] = useState('')
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
        setDescription(data.description)
        setExistingImage(data.image_url)
      }
    } catch (err) {
      setError('Failed to fetch report')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      let imageUrl = existingImage

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${Date.now()}.${fileExt}`
        
        const { data, error: uploadError } = await supabase.storage
          .from('report-images')
          .upload(fileName, imageFile)

        if (uploadError) {
          throw uploadError.message
        }

        const { data: { publicUrl } } = supabase.storage
          .from('report-images')
          .getPublicUrl(fileName)

        imageUrl = publicUrl
      }

      const { error: updateError } = await supabase
        .from('reports')
        .update({
          description,
          image_url: imageUrl
        })
        .eq('id', id)
        .eq('user_id', user.id)

      if (updateError) {
        throw updateError.message
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white shadow-lg rounded-xl p-8">
          <h1 className="text-2xl font-bold text-center mb-6">Edit Report</h1>
          
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

            {existingImage && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Current image:</p>
                <img 
                  src={existingImage} 
                  alt="Current report image" 
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
              >
                {loading ? 'Updating...' : 'Update Report'}
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

export default EditReport
