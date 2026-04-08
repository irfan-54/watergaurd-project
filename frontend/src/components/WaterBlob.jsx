import { useRef, useMemo, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function MovingHighlight() {
  useFrame(() => {
    // Moving highlight light handled by position animation in parent
  })
  
  return (
    <pointLight 
      position={[0, 0, 8]}
      intensity={1.8} 
      color="#93C5FD" 
      distance={20} 
      decay={2} 
    />
  )
}

function Blob() {
  const meshRef = useRef()
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  
  // Create geometry with good subdivision for smooth distortion
  const geometry = useMemo(() => new THREE.SphereGeometry(1.5, 128, 128), [])

  // Track mouse position
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1
      })
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useFrame((state) => {
    if (meshRef.current) {
      // Smooth organic floating movement
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.25) * 0.08
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.15) * 0.12
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.35) * 0.15
      
      // Subtle scale pulsing
      const scale = 1 + Math.sin(state.clock.elapsedTime * 0.4) * 0.03
      meshRef.current.scale.set(scale, scale, scale)
      
      // Mouse-following movement with smooth interpolation
      const targetX = mousePos.x * 0.3
      const targetY = mousePos.y * 0.35
      
      meshRef.current.position.x += (targetX - meshRef.current.position.x) * 0.05
      meshRef.current.position.y += (targetY - meshRef.current.position.y) * 0.05

      // Optimized surface distortion - update every few frames
      if (Math.floor(state.clock.elapsedTime * 30) % 3 === 0) {
        const time = state.clock.elapsedTime
        const vertices = meshRef.current.geometry.attributes.position.array
        
        for (let i = 0; i < vertices.length; i += 3) {
          const x = vertices[i]
          const y = vertices[i + 1]
          const z = vertices[i + 2]
          
          // Subtle wave distortion
          const wave1 = Math.sin(x * 2 + time) * 0.02
          const wave2 = Math.cos(y * 2 + time * 0.8) * 0.015
          
          // Apply distortion to normal direction
          const normal = new THREE.Vector3(x, y, z).normalize()
          const distortion = (wave1 + wave2) * 0.1
          
          vertices[i] = x + normal.x * distortion
          vertices[i + 1] = y + normal.y * distortion
          vertices[i + 2] = z + normal.z * distortion
        }
        
        meshRef.current.geometry.attributes.position.needsUpdate = true
        meshRef.current.geometry.computeVertexNormals()
      }
    }
  })

  return (
    <>
      {/* Ambient light for base illumination */}
      <ambientLight intensity={0.3} />
      
      {/* Strong directional light from above for depth */}
      <directionalLight position={[8, 12, 6]} intensity={1.2} color="#60A5FA" castShadow />
      
      {/* Rim light for edge definition */}
      <pointLight position={[-6, -2, 8]} intensity={1.5} color="#06B6D4" distance={30} decay={2} />
      
      {/* Soft front glow */}
      <pointLight position={[2, 2, 12]} intensity={2.5} color="#3B82F6" distance={25} decay={2} />
      
      {/* Moving highlight light */}
      <MovingHighlight />
      
      <mesh 
        ref={meshRef} 
        geometry={geometry} 
        position={[0.5, -0.3, 0]} // Off-center positioning
        castShadow 
        receiveShadow
      >
        <meshStandardMaterial
          color="#1e40af"
          roughness={0.05}
          metalness={0.95}
          emissive="#3B82F6"
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Subtle inner particles */}
      {[...Array(8)].map((_, i) => {
        const particleRef = useRef()
        
        useFrame((state) => {
          if (particleRef.current) {
            particleRef.current.position.set(
              Math.sin(i * 0.8 + state.clock.elapsedTime * 0.5) * 0.8,
              Math.cos(i * 1.2 + state.clock.elapsedTime * 0.3) * 0.8,
              Math.sin(i * 0.5 + state.clock.elapsedTime * 0.4) * 0.8
            )
          }
        })
        
        return (
          <mesh key={i} ref={particleRef}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshBasicMaterial 
              color="#93C5FD" 
              transparent 
              opacity={0.6}
            />
          </mesh>
        )
      })}
    </>
  )
}

export default function WaterBlob() {
  return (
    <Canvas
      camera={{ position: [0, 0, 7], fov: 40 }}
      style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none'
      }}
      shadows
    >
      <Blob />
    </Canvas>
  )
}
