import { createContext, useContext, useState, useEffect } from 'react'
import { getTheme, setTheme, getEffectiveTheme } from '../theme'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => getTheme())
  const [effectiveTheme, setEffectiveThemeState] = useState(() => getEffectiveTheme())

  useEffect(() => {
    // Listen for theme changes
    const handleThemeChange = () => {
      setThemeState(getTheme())
      setEffectiveThemeState(getEffectiveTheme())
    }

    // Listen for storage changes (in case theme changes from another tab)
    window.addEventListener('storage', handleThemeChange)

    return () => {
      window.removeEventListener('storage', handleThemeChange)
    }
  }, [])

  const changeTheme = (newTheme) => {
    setTheme(newTheme)           // applies class to DOM (from theme.js)
    setThemeState(newTheme)
    setEffectiveThemeState(newTheme) // ✅ use newTheme directly, don't re-read
  }

  const value = {
    theme,
    effectiveTheme,
    setTheme: changeTheme,
    isDark: effectiveTheme === 'dark',
    isLight: effectiveTheme === 'light'
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
