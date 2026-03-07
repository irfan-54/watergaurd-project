import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ReportsMap from '../components/ReportsMap'
import Navbar from '../components/Navbar'

function MapPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <Navbar />

      {/* Main Content */}
      <div className="py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Community Water Issues Map</h1>
            <p className="text-gray-600 mt-2">Explore water issues reported by the community in your area</p>
          </div>
          
          <ReportsMap />
        </div>
      </div>
    </div>
  )
}

export default MapPage
