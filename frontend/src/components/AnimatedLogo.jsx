import { motion } from 'framer-motion'

const AnimatedLogo = ({ size = 28, intensity = 1, showText = true, textSize = 20 }) => {
  const logoVariants = {
    initial: { 
      scale: 1,
      y: 0,
      borderRadius: '40% 60% 60% 40% / 60% 40% 60% 40%'
    },
    animate: {
      scale: [1, 1.02 * intensity, 1],
      y: [-2 * intensity, 2 * intensity, -2 * intensity],
      borderRadius: [
        '40% 60% 60% 40% / 60% 40% 60% 40%',
        '60% 40% 40% 60% / 40% 60% 40% 60%',
        '40% 60% 60% 40% / 60% 40% 60% 40%'
      ],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  }

  const glowVariants = {
    initial: { opacity: 0.3 },
    animate: {
      opacity: [0.3, 0.6, 0.3],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <motion.div
        variants={logoVariants}
        initial="initial"
        animate="animate"
        style={{
          width: size,
          height: size,
          background: 'linear-gradient(135deg, #3B82F6, #06B6D4)',
          borderRadius: '40% 60% 60% 40% / 60% 40% 60% 40%',
          position: 'relative',
          flexShrink: 0
        }}
      >
        <motion.div
          variants={glowVariants}
          initial="initial"
          animate="animate"
          style={{
            position: 'absolute',
            inset: -3,
            background: 'linear-gradient(135deg, #3B82F6, #06B6D4)',
            borderRadius: '40% 60% 60% 40% / 60% 40% 60% 40%',
            filter: 'blur(6px)',
            zIndex: -1
          }}
        />
      </motion.div>
      {showText && (
        <span style={{ 
          fontFamily: 'Syne, sans-serif', 
          fontWeight: 700, 
          fontSize: textSize,
          color: 'white',
          letterSpacing: '-0.02em'
        }}>
          WaterGuard
        </span>
      )}
    </div>
  )
}

export default AnimatedLogo
