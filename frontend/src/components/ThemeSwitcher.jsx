import { useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'

// Icon components
const SunIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)

const MoonIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
)

export default function ThemeSwitcher() {
  const { setTheme, isDark } = useTheme()

  const handleThemeChange = (theme) => {
    setTheme(theme)
  }

  return (
    <div className="flex items-center bg-gray-200 dark:bg-gray-700 rounded-full p-1 transition-colors">
      {/* Sun (Light) Button */}
      <button
        onClick={() => handleThemeChange('light')}
        className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 ${
          !isDark 
            ? 'bg-white dark:bg-gray-900 text-yellow-500 shadow-md' 
            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
        }`}
        title="Switch to light theme"
      >
        <SunIcon />
      </button>

      {/* Moon (Dark) Button */}
      <button
        onClick={() => handleThemeChange('dark')}
        className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 ${
          isDark 
            ? 'bg-white dark:bg-gray-900 text-blue-600 shadow-md' 
            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
        }`}
        title="Switch to dark theme"
      >
        <MoonIcon />
      </button>
    </div>
  )
}
