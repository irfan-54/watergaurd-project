import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

const AIBlob = ({ size = 52 }) => {
  const [detectedDots, setDetectedDots] = useState([])
  
  // Randomly add detected dots
  useEffect(() => {
    const interval = setInterval(() => {
      const newDot = {
        id: Date.now(),
        x: Math.random() * 80 + 10, // 10-90% range
        y: Math.random() * 80 + 10,
      }
      setDetectedDots(prev => [...prev.slice(-4), newDot]) // Keep max 5 dots
    }, 1500)
    
    return () => clearInterval(interval)
  }, [])

  return (
    <motion.div
      style={{
        width: size,
        height: size,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}
    >
      {/* Subtle grid background */}
      <svg
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          left: 0,
          top: 0,
          zIndex: 0
        }}
      >
        {/* Grid lines */}
        {[...Array(5)].map((_, i) => (
          <g key={i}>
            <line
              x1={`${(i + 1) * 20}%`}
              y1="0%"
              x2={`${(i + 1) * 20}%`}
              y2="100%"
              stroke="rgba(59, 130, 246, 0.1)"
              strokeWidth="0.5"
            />
            <line
              x1="0%"
              y1={`${(i + 1) * 20}%`}
              x2="100%"
              y2={`${(i + 1) * 20}%`}
              stroke="rgba(59, 130, 246, 0.1)"
              strokeWidth="0.5"
            />
          </g>
        ))}
      </svg>

      {/* Scanning line sweeping across */}
      <motion.div
        style={{
          position: 'absolute',
          width: '2px',
          height: '100%',
          background: 'linear-gradient(to bottom, transparent, rgba(59, 130, 246, 0.6), transparent)',
          left: 0,
          top: 0,
          zIndex: 2
        }}
        animate={{
          x: ['0%', '100%', '0%']
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear"
        }}
      />

      {/* Center processing core */}
      <motion.div
        style={{
          width: '8%',
          height: '8%',
          background: 'rgba(59, 130, 246, 1)',
          borderRadius: '50%',
          position: 'absolute',
          zIndex: 3,
          boxShadow: '0 0 6px rgba(59, 130, 246, 0.8)'
        }}
        animate={{
          opacity: [0.7, 1, 0.7]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Detected dots with pulse animation */}
      {detectedDots.map((dot, i) => (
        <motion.div
          key={dot.id}
          style={{
            position: 'absolute',
            width: '4%',
            height: '4%',
            background: 'rgba(147, 197, 253, 0.9)',
            borderRadius: '50%',
            left: `${dot.x}%`,
            top: `${dot.y}%`,
            marginLeft: '-2%',
            marginTop: '-2%',
            zIndex: 3
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: [0, 1.5, 1], 
            opacity: [0, 1, 0.8] 
          }}
          transition={{
            duration: 0.5,
            ease: "easeOut"
          }}
        />
      ))}

      {/* Subtle outer ring */}
      <div
        style={{
          position: 'absolute',
          width: '90%',
          height: '90%',
          border: '0.5px solid rgba(59, 130, 246, 0.2)',
          borderRadius: '8px',
          left: '5%',
          top: '5%',
          zIndex: 1
        }}
      />
    </motion.div>
  )
}

export default AIBlob
