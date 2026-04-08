import { useState } from 'react'
import { apiFetch } from '../config/api'

function ReportForm() {
  const [formData, setFormData] = useState({
    issue: '',
    image: null,
    latitude: '',
    longitude: ''
  })
  
  const [result, setResult] = useState(null)

  const handleChange = (e) => {
    const { name, value, files } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: files ? files[0] : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const form = new FormData()
    form.append("description", formData.issue)
    form.append("latitude", formData.latitude)
    form.append("longitude", formData.longitude)
    form.append("image", formData.image)
    
    try {
      const result = await apiFetch('/reports', {
        method: 'POST',
        body: form
      })
      
      if (import.meta.env.DEV) {
        console.log('Response:', result)
      }
      
      // Store prediction results in state
      setResult({
        category: result.category,
        risk: result.risk
      })
      
      alert('Report submitted successfully')
    } catch (error) {
      console.error('Error:', error)
      alert('Error submitting report')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Report Form
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Text Area */}
          <div>
            <label htmlFor="issue" className="block text-sm font-medium text-gray-700 mb-2">
              Describe the issue
            </label>
            <textarea
              id="issue"
              name="issue"
              value={formData.issue}
              onChange={handleChange}
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Please describe the issue in detail..."
            />
          </div>

          {/* Image Upload */}
          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
              Upload Image
            </label>
            <input
              type="file"
              id="image"
              name="image"
              accept="image/*"
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-1 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {/* Location Inputs */}
          <div className="space-y-3">
            <div>
              <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-2">
                Latitude
              </label>
              <input
                type="text"
                id="latitude"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 40.7128"
              />
            </div>
            
            <div>
              <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-2">
                Longitude
              </label>
              <input
                type="text"
                id="longitude"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., -74.0060"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Submit Report
            </button>
          </div>
        </form>
        
        {/* Result Display Section */}
        {result && (
          <div className="mt-6 p-4 bg-gray-100 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Prediction Results
            </h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="font-medium text-gray-600">Predicted Category:</span>
                <span className="ml-2 font-bold text-blue-600">{result.category}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium text-gray-600">Risk Level:</span>
                <span className={`ml-2 font-bold ${
                  result.risk === 'HIGH' ? 'text-red-600' :
                  result.risk === 'MEDIUM' ? 'text-orange-500' :
                  'text-green-600'
                }`}>
                  {result.risk}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ReportForm
