import { useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'

// Icon components
const SunIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)

const MoonIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
)

export default function ThemeSwitcher() {
  const { setTheme, isDark } = useTheme()

  const handleThemeChange = (theme) => {
    setTheme(theme)
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 999,
      padding: 3,
      transition: 'all 0.3s ease',
    }}>
      {/* Sun (Light) Button */}
      <button
        onClick={() => handleThemeChange('light')}
        title="Switch to light theme"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 32,
          height: 32,
          borderRadius: '50%',
          border: 'none',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          background: !isDark ? 'rgba(255,255,255,0.12)' : 'transparent',
          color: !isDark ? '#FBBF24' : 'rgba(255,255,255,0.3)',
          boxShadow: !isDark ? '0 0 10px rgba(251,191,36,0.2)' : 'none',
        }}
      >
        <SunIcon />
      </button>

      {/* Moon (Dark) Button */}
      <button
        onClick={() => handleThemeChange('dark')}
        title="Switch to dark theme"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 32,
          height: 32,
          borderRadius: '50%',
          border: 'none',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          background: isDark ? 'rgba(59,130,246,0.15)' : 'transparent',
          color: isDark ? '#60A5FA' : 'rgba(255,255,255,0.3)',
          boxShadow: isDark ? '0 0 10px rgba(59,130,246,0.2)' : 'none',
        }}
      >
        <MoonIcon />
      </button>
    </div>
  )
}
