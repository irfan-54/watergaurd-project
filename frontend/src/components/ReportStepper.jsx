import React from 'react'

const STEPS = [
  { key: 'submitted',   label: 'Submitted' },
  { key: 'verified',    label: 'Verified' },
  { key: 'assigned',    label: 'Assigned' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'resolved',    label: 'Resolved' },
]

export default function ReportStepper({ currentStatus }) {
  const currentIndex = STEPS.findIndex(s => s.key === currentStatus)
  const isRejected = currentStatus === 'rejected'

  const dotStyle = (isCompleted, isActive) => ({
    width: 18,
    height: 18,
    borderRadius: '50%',
    transition: 'all 0.3s ease',
    flexShrink: 0,
    background: isRejected
      ? 'rgba(255,255,255,0.15)'
      : isCompleted
      ? '#3B82F6'
      : isActive
      ? '#3B82F6'
      : 'rgba(255,255,255,0.15)',
    boxShadow: isActive && !isRejected
      ? '0 0 0 4px rgba(59,130,246,0.25), 0 0 12px rgba(59,130,246,0.3)'
      : isCompleted && !isRejected
      ? '0 0 8px rgba(59,130,246,0.2)'
      : 'none',
  })

  const labelStyle = (isCompleted, isActive) => ({
    fontSize: 11,
    fontWeight: isActive ? 600 : 500,
    fontFamily: 'Inter, sans-serif',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    marginTop: 8,
    transition: 'color 0.3s ease',
    color: isRejected
      ? 'rgba(255,255,255,0.25)'
      : isActive
      ? '#60A5FA'
      : isCompleted
      ? 'rgba(255,255,255,0.55)'
      : 'rgba(255,255,255,0.3)',
  })

  const lineStyle = (index) => ({
    flex: 1,
    height: 2,
    marginLeft: 4,
    marginRight: 4,
    marginBottom: 22,
    borderRadius: 1,
    transition: 'all 0.3s ease',
    background: !isRejected && index < currentIndex
      ? 'linear-gradient(90deg, #3B82F6, #60A5FA)'
      : 'rgba(255,255,255,0.1)',
    boxShadow: !isRejected && index < currentIndex
      ? '0 0 6px rgba(59,130,246,0.3)'
      : 'none',
  })

  return (
    <div style={{ width: '100%', padding: '16px 8px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>
        {STEPS.map((step, index) => {
          const isCompleted = !isRejected && index < currentIndex
          const isActive    = !isRejected && index === currentIndex
          const isLast      = index === STEPS.length - 1

          return (
            <React.Fragment key={step.key}>
              {/* Step dot + label */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10, position: 'relative' }}>
                <div style={dotStyle(isCompleted, isActive)}>
                  {isCompleted && !isRejected && (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ display: 'block' }}>
                      <path d="M5 9L8 12L13 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span style={labelStyle(isCompleted, isActive)}>
                  {step.label}
                </span>
              </div>

              {/* Connector line between steps */}
              {!isLast && (
                <div style={lineStyle(index)} />
              )}
            </React.Fragment>
          )
        })}
      </div>

      {isRejected && (
        <p style={{
          textAlign: 'center',
          fontSize: 12,
          fontWeight: 500,
          fontFamily: 'Inter, sans-serif',
          color: '#EF4444',
          marginTop: 14,
          padding: '8px 16px',
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 10,
        }}>
          This report was rejected
        </p>
      )}
    </div>
  )
}
