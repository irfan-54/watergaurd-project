// Theme Controller for WaterGuard Application
// Supports two modes: "light", "dark"

const THEME_KEY = 'waterguard-theme'

// Get the current theme preference from localStorage
export function getTheme() {
  return localStorage.getItem(THEME_KEY) || 'light'
}

// Set theme preference and apply it
export function setTheme(theme) {
  if (!['light', 'dark'].includes(theme)) {
    console.warn('Invalid theme. Must be "light" or "dark"')
    return
  }

  // Save to localStorage
  localStorage.setItem(THEME_KEY, theme)
  
  // Apply the theme
  applyTheme(theme)
}

// Apply theme to the document
function applyTheme(theme) {
  const root = document.documentElement
  
  if (theme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

// Initialize theme on application load
export function initTheme() {
  const theme = getTheme()
  applyTheme(theme)
}

// Get current effective theme (what's actually applied)
export function getEffectiveTheme() {
  const root = document.documentElement
  return root.classList.contains('dark') ? 'dark' : 'light'
}
