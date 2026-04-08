import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

const CommunityParticles = ({ size = 52 }) => {
  const [nodes, setNodes] = useState([])
  const [connections, setConnections] = useState([])
  const [activeNode, setActiveNode] = useState(null)
  
  // Initialize nodes gradually
  useEffect(() => {
    const targetNodes = [
      { x: 50, y: 20, id: 1 },  // Top
      { x: 20, y: 70, id: 2 },  // Bottom left
      { x: 80, y: 70, id: 3 },  // Bottom right
      { x: 35, y: 45, id: 4 },  // Middle left
      { x: 65, y: 45, id: 5 },  // Middle right
    ]

    // Add nodes gradually
    targetNodes.forEach((node, index) => {
      setTimeout(() => {
        setNodes(prev => {
          const newNodes = [...prev, node]
          // Create connections when new node appears
          if (newNodes.length > 1) {
            const newConnections = []
            newNodes.forEach((n1, i) => {
              newNodes.slice(i + 1).forEach(n2 => {
                if (Math.random() > 0.3) { // 70% chance of connection
                  newConnections.push({ from: n1.id, to: n2.id, opacity: 0.2 + Math.random() * 0.4 })
                }
              })
            })
            setConnections(newConnections)
          }
          return newNodes
        })
      }, index * 300) // Stagger appearance
    })

    // Highlight random node periodically
    const highlightInterval = setInterval(() => {
      setActiveNode(Math.floor(Math.random() * 5) + 1)
      setTimeout(() => setActiveNode(null), 1000)
    }, 3000)

    return () => clearInterval(highlightInterval)
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
      {/* Connection lines */}
      <svg
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          left: 0,
          top: 0,
          zIndex: 1
        }}
      >
        {connections.map((conn, i) => {
          const fromNode = nodes.find(n => n.id === conn.from)
          const toNode = nodes.find(n => n.id === conn.to)
          
          if (!fromNode || !toNode) return null
          
          return (
            <motion.line
              key={i}
              x1={`${fromNode.x}%`}
              y1={`${fromNode.y}%`}
              x2={`${toNode.x}%`}
              y2={`${toNode.y}%`}
              stroke="rgba(147, 197, 253, 0.4)"
              strokeWidth="1"
              animate={{
                opacity: [conn.opacity, conn.opacity + 0.2, conn.opacity],
                strokeWidth: [0.8, 1.2, 0.8]
              }}
              transition={{
                duration: 2 + Math.random(),
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.2
              }}
            />
          )
        })}
      </svg>

      {/* Network nodes */}
      {nodes.map((node, i) => (
        <motion.div
          key={node.id}
          style={{
            position: 'absolute',
            width: activeNode === node.id ? '18%' : '14%',
            height: activeNode === node.id ? '18%' : '14%',
            background: activeNode === node.id 
              ? 'rgba(59, 130, 246, 1)' 
              : 'rgba(147, 197, 253, 0.7)',
            borderRadius: '50%',
            left: `${node.x}%`,
            top: `${node.y}%`,
            marginLeft: activeNode === node.id ? '-9%' : '-7%',
            marginTop: activeNode === node.id ? '-9%' : '-7%',
            zIndex: 2,
            boxShadow: activeNode === node.id 
              ? '0 0 15px rgba(59, 130, 246, 0.8)' 
              : '0 0 5px rgba(147, 197, 253, 0.3)'
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: [0, 1.2, 1], 
            opacity: [0, 1, 0.8] 
          }}
          transition={{
            duration: 0.5,
            ease: "easeOut"
          }}
        />
      ))}

      {/* Central pulse effect */}
      <motion.div
        style={{
          position: 'absolute',
          width: '30%',
          height: '30%',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '50%',
          left: '50%',
          top: '50%',
          marginLeft: '-15%',
          marginTop: '-15%',
          zIndex: 0
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </motion.div>
  )
}

export default CommunityParticles
