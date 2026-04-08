import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

const TrackingRing = ({ size = 52 }) => {
  const [trail, setTrail] = useState([])
  const [position, setPosition] = useState({ x: 50, y: 50 })
  
  // Update position and trail
  useEffect(() => {
    const interval = setInterval(() => {
      const time = Date.now() / 1000
      const newX = 50 + Math.cos(time * 0.8) * 30
      const newY = 50 + Math.sin(time * 0.6) * 30
      
      setPosition({ x: newX, y: newY })
      setTrail(prev => [...prev.slice(-8), { x: newX, y: newY }]) // Keep last 8 positions
    }, 50)
    
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
        justifyContent: 'center'
      }}
    >
      {/* Orbital path guide */}
      <div
        style={{
          position: 'absolute',
          width: '70%',
          height: '50%',
          border: '0.5px solid rgba(59, 130, 246, 0.15)',
          borderRadius: '50%',
          left: '15%',
          top: '25%',
          zIndex: 0
        }}
      />
      
      {/* Trail path behind moving dot */}
      {trail.map((point, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: '3%',
            height: '3%',
            background: `rgba(147, 197, 253, ${0.1 + (i / trail.length) * 0.3})`,
            borderRadius: '50%',
            left: `${point.x}%`,
            top: `${point.y}%`,
            marginLeft: '-1.5%',
            marginTop: '-1.5%',
            zIndex: 1
          }}
        />
      ))}

      {/* Rotating rings */}
      <motion.div
        style={{
          position: 'absolute',
          width: '80%',
          height: '80%',
          border: '1px solid transparent',
          borderTop: '1px solid rgba(59, 130, 246, 0.6)',
          borderRadius: '50%',
          zIndex: 2
        }}
        animate={{
          rotate: [0, 360]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      
      <motion.div
        style={{
          position: 'absolute',
          width: '60%',
          height: '60%',
          border: '0.8px solid transparent',
          borderRight: '0.8px solid rgba(147, 197, 253, 0.4)',
          borderRadius: '50%',
          zIndex: 2
        }}
        animate={{
          rotate: [360, 0]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      
      {/* Moving dot with glow */}
      <motion.div
        style={{
          position: 'absolute',
          width: '12%',
          height: '12%',
          background: 'rgba(59, 130, 246, 0.9)',
          borderRadius: '50%',
          left: `${position.x}%`,
          top: `${position.y}%`,
          marginLeft: '-6%',
          marginTop: '-6%',
          zIndex: 3,
          boxShadow: '0 0 10px rgba(59, 130, 246, 0.6)'
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.8, 1, 0.8]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Central hub */}
      <div
        style={{
          position: 'absolute',
          width: '20%',
          height: '20%',
          background: 'rgba(59, 130, 246, 0.3)',
          borderRadius: '50%',
          left: '40%',
          top: '40%',
          zIndex: 1
        }}
      />
    </motion.div>
  )
}

export default TrackingRing
