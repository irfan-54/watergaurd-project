import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-primary)' }}>
          <h2 style={{ color: 'var(--color-text-primary)', marginBottom: '1rem' }}>Something went wrong</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>{this.state.error?.message}</p>
          <button 
            onClick={() => window.location.reload()}
            style={{ padding: '0.5rem 1rem', cursor: 'pointer', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-primary)', borderRadius: '6px', background: 'var(--color-background-secondary)' }}
          >
            Reload Page
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
