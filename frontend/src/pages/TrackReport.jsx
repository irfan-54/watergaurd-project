import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { motion } from 'framer-motion'
import ReportStepper from '../components/ReportStepper'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' }
  })
}

export default function TrackReport() {
  const { reportId } = useParams()
  const navigate = useNavigate()
  const [report, setReport] = useState(null)
  const [logs, setLogs] = useState([])
  const [comments, setComments] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState(false)
  const [newComment, setNewComment] = useState('')

  useEffect(() => {
    fetchAll()
  }, [reportId])

  async function fetchAll() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUser(user)

    const { data: report } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single()
    setReport(report)

    const { data: logs } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('report_id', reportId)
      .order('created_at', { ascending: true })
    setLogs(logs || [])

    const { data: comments } = await supabase
      .from('comments')
      .select('*')
      .eq('report_id', reportId)
      .order('created_at', { ascending: true })
    setComments(comments || [])

    setLoading(false)
  }

  async function submitComment() {
    if (!newComment.trim()) return
    await supabase.from('comments').insert({
      report_id: reportId,
      content: newComment,
      user_id: currentUser.id
    })
    setNewComment('')
    fetchAll()
  }

  function formatDate(ts) {
    return new Date(ts).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
  }

  function formatDateTime(ts) {
    return new Date(ts).toLocaleString('en-IN', {
      day: 'numeric', month: 'short',
      hour: '2-digit', minute: '2-digit'
    })
  }

  function getStatusMessage(report) {
    const dept = report.department_name || 'Department assignment pending'
    const reason = report.rejection_reason || 'No reason provided'
    const statusMap = {
      'PENDING': 'Submitted',
      'pending': 'Submitted',
      'submitted': 'Submitted',
      'IN_PROGRESS': 'In Progress',
      'in_progress': 'In Progress',
      'ASSIGNED': 'Assigned',
      'assigned': 'Assigned',
      'RESOLVED': 'Resolved',
      'resolved': 'Resolved',
      'REJECTED': 'Rejected',
      'rejected': 'Rejected',
      'verified': 'Verified'
    }
    const normalizedStatus = statusMap[report.status] || report.status || 'unknown'
    
    const map = {
      submitted: 'Your report has been received. We are reviewing it.',
      verified: 'Your report has been verified by our system.',
      assigned: `Your report has been assigned to ${dept}.`,
      in_progress: `${dept} is actively working on this issue.`,
      resolved: 'This issue has been resolved. Thank you for reporting.',
      rejected: `Your report was not accepted. Reason: ${reason}`
    }
    return map[normalizedStatus.toLowerCase()] || `Status: ${normalizedStatus}`
  }

  const getStatusColor = (status) => {
    const colors = {
      submitted: { bg: 'rgba(245,158,11,0.12)', color: '#FBBF24', border: 'rgba(245,158,11,0.25)' },
      verified: { bg: 'rgba(167,139,250,0.12)', color: '#A78BFA', border: 'rgba(167,139,250,0.25)' },
      assigned: { bg: 'rgba(59,130,246,0.12)', color: '#60A5FA', border: 'rgba(59,130,246,0.25)' },
      in_progress: { bg: 'rgba(245,158,11,0.12)', color: '#FBBF24', border: 'rgba(245,158,11,0.25)' },
      resolved: { bg: 'rgba(34,197,94,0.12)', color: '#4ADE80', border: 'rgba(34,197,94,0.25)' },
      rejected: { bg: 'rgba(239,68,68,0.12)', color: '#F87171', border: 'rgba(239,68,68,0.25)' },
    }
    return colors[status] || { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', border: 'rgba(255,255,255,0.1)' }
  }

  if (loading) return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@300;400;500;600&display=swap');
      `}</style>
      <div style={{ background: '#050B18', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 40, height: 40, border: '3px solid rgba(59,130,246,0.2)', borderTopColor: '#3B82F6', borderRadius: '50%', animation: 'trSpin 0.8s linear infinite' }} />
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Loading report...</p>
        </div>
        <style>{`@keyframes trSpin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </>
  )

  if (!report) return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@300;400;500;600&display=swap');
      `}</style>
      <div style={{ background: '#050B18', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Report not found or you don't have access.</p>
      </div>
    </>
  )

  const sc = getStatusColor(report.status)
  const normalizedStatus = report.status?.toLowerCase() === 'pending' 
    ? 'submitted' 
    : report.status?.toLowerCase() === 'submitted' 
    ? 'submitted' 
    : report.status?.toLowerCase()

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@300;400;500;600&display=swap');
        .tr-page {
          background: #050B18;
          min-height: 100vh;
          font-family: 'Inter', sans-serif;
          color: white;
          position: relative;
          overflow-x: hidden;
        }
        .tr-grid-bg {
          position: fixed;
          inset: 0;
          background-image: linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px);
          background-size: 50px 50px;
          pointer-events: none;
        }
        .tr-orb {
          position: fixed;
          border-radius: 50%;
          filter: blur(80px);
          animation: trFloat 8s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes trFloat {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-30px) scale(1.05); }
        }
        .tr-glass {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          backdrop-filter: blur(20px);
          border-radius: 16px;
          padding: 24px;
        }
        .tr-section-title {
          font-family: 'Syne', sans-serif;
          font-size: 15px;
          font-weight: 700;
          color: white;
          margin-bottom: 16px;
        }
        .tr-back-btn {
          background: none;
          border: none;
          color: rgba(255,255,255,0.4);
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 500;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          transition: color 0.2s;
          padding: 0;
          margin-bottom: 28px;
        }
        .tr-back-btn:hover {
          color: rgba(255,255,255,0.8);
        }
        .tr-comment-input {
          flex: 1;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 10px 14px;
          color: white;
          font-size: 13px;
          font-family: 'Inter', sans-serif;
          outline: none;
          transition: border-color 0.2s;
        }
        .tr-comment-input::placeholder { color: rgba(255,255,255,0.3); }
        .tr-comment-input:focus { border-color: #3B82F6; }
        .tr-send-btn {
          background: #3B82F6;
          color: white;
          border: none;
          border-radius: 12px;
          padding: 10px 20px;
          font-size: 13px;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .tr-send-btn:hover {
          background: #2563EB;
          box-shadow: 0 4px 12px rgba(59,130,246,0.3);
        }
        .tr-lightbox {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.85);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          cursor: pointer;
        }
      `}</style>

      <div className="tr-page">
        <div className="tr-grid-bg" />
        <div className="tr-orb" style={{ width: 400, height: 400, background: 'rgba(59,130,246,0.1)', top: '-5%', left: '-10%', animationDelay: '0s' }} />
        <div className="tr-orb" style={{ width: 300, height: 300, background: 'rgba(167,139,250,0.08)', bottom: '5%', right: '-8%', animationDelay: '4s' }} />

        <div style={{ maxWidth: 720, margin: '0 auto', padding: '100px 16px 60px', position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', gap: 20 }}>

          <motion.button
            className="tr-back-btn"
            onClick={() => navigate(-1)}
            variants={fadeUp} initial="hidden" animate="visible" custom={0}
          >
            ← Back
          </motion.button>

          {/* SECTION 1: HEADER */}
          <motion.div className="tr-glass" variants={fadeUp} initial="hidden" animate="visible" custom={1}>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
              #WG-{report.id.slice(0, 6).toUpperCase()}
            </p>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, textTransform: 'capitalize', marginBottom: 10 }}>
              {report.category}
            </h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                {report.location && report.location !== 'Location not provided' 
                  ? report.location 
                  : `${report.latitude?.toFixed(4)}, ${report.longitude?.toFixed(4)}`}
              </p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{formatDate(report.created_at)}</p>
            </div>
          </motion.div>

          {/* SECTION 2: STEPPER */}
          <motion.div className="tr-glass" variants={fadeUp} initial="hidden" animate="visible" custom={2}>
            <ReportStepper currentStatus={normalizedStatus} />
          </motion.div>

          {/* SECTION 3: STATUS CARD */}
          <motion.div
            className="tr-glass"
            variants={fadeUp} initial="hidden" animate="visible" custom={3}
            style={{ background: sc.bg, borderColor: sc.border }}
          >
            <p style={{ fontSize: 14, fontWeight: 500, color: sc.color, marginBottom: 8, lineHeight: 1.6 }}>
              {getStatusMessage(report)}
            </p>
            {report.department_name && (
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
                Department: <span style={{ color: 'rgba(255,255,255,0.7)' }}>{report.department_name}</span>
              </p>
            )}
            {report.estimated_resolution && (
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>
                ETA: <span style={{ color: 'rgba(255,255,255,0.7)' }}>{report.estimated_resolution}</span>
              </p>
            )}
          </motion.div>

          {/* SECTION 4: TIMELINE */}
          <motion.div className="tr-glass" variants={fadeUp} initial="hidden" animate="visible" custom={4}>
            <h2 className="tr-section-title">Activity Timeline</h2>
            {logs.length === 0 ? (
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>
                Updates will appear here as your report progresses.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {logs.map((log, idx) => (
                  <div key={log.id} style={{ display: 'flex', gap: 14 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{
                        width: 10, height: 10, borderRadius: '50%',
                        background: '#3B82F6',
                        boxShadow: '0 0 8px rgba(59,130,246,0.4)',
                        marginTop: 6, flexShrink: 0
                      }} />
                      {idx < logs.length - 1 && (
                        <div style={{ width: 1, flex: 1, background: 'rgba(255,255,255,0.08)', marginTop: 4 }} />
                      )}
                    </div>
                    <div style={{ paddingBottom: 20 }}>
                      <p style={{ fontSize: 14, fontWeight: 500, color: 'white', textTransform: 'capitalize' }}>
                        {log.event_type}
                      </p>
                      {log.message && (
                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{log.message}</p>
                      )}
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{formatDateTime(log.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* SECTION 5: IMAGE */}
          <motion.div className="tr-glass" variants={fadeUp} initial="hidden" animate="visible" custom={5}>
            <h2 className="tr-section-title">Image Evidence</h2>
            {(!report.image_url && !report.resolution_image_url) ? (
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>No image attached to this report.</p>
            ) : report.image_url && !report.resolution_image_url ? (
              // Show only original image (no resolution image)
              <>
                <img
                  src={report.image_url}
                  alt="Report evidence"
                  style={{ width: '100%', maxHeight: 280, objectFit: 'cover', borderRadius: 12, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.08)' }}
                  onClick={() => setLightbox('single')}
                />
                {lightbox && (
                  <div className="tr-lightbox" onClick={() => setLightbox(null)}>
                    <img
                      src={report.image_url}
                      alt="Full size"
                      style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: 12 }}
                    />
                  </div>
                )}
              </>
            ) : !report.image_url && report.resolution_image_url ? (
              // Show only resolution image (no original image)
              <div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ 
                    fontSize: 12, 
                    fontWeight: 600, 
                    color: 'rgba(255,255,255,0.7)', 
                    marginBottom: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    <span style={{ 
                      background: 'rgba(34,197,94,0.2)', 
                      color: '#4ADE80', 
                      padding: '2px 8px', 
                      borderRadius: 4, 
                      fontSize: 10, 
                      fontWeight: 600 
                    }}>
                      AFTER
                    </span>
                    Resolution Evidence
                  </div>
                  <img
                    src={report.resolution_image_url}
                    alt="Resolution evidence"
                    style={{ 
                      width: '100%', 
                      maxHeight: 240, 
                      objectFit: 'cover', 
                      borderRadius: 12, 
                      cursor: 'pointer', 
                      border: '1px solid rgba(34,197,94,0.25)' 
                    }}
                    onClick={() => setLightbox('after')}
                  />
                </div>
                
                {/* Lightbox for resolution image */}
                {lightbox && (
                  <div className="tr-lightbox" onClick={() => setLightbox(null)}>
                    <img
                      src={report.resolution_image_url}
                      alt="Full size resolution"
                      style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: 12 }}
                    />
                    <div style={{
                      position: 'absolute',
                      top: 20,
                      left: 20,
                      background: 'rgba(0,0,0,0.7)',
                      color: 'white',
                      padding: '8px 12px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600
                    }}>
                      AFTER - Resolved
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Show both before and after images
              <div>
                {/* Before Image */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ 
                    fontSize: 12, 
                    fontWeight: 600, 
                    color: 'rgba(255,255,255,0.7)', 
                    marginBottom: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    <span style={{ 
                      background: 'rgba(245,158,11,0.2)', 
                      color: '#FBBF24', 
                      padding: '2px 8px', 
                      borderRadius: 4, 
                      fontSize: 10, 
                      fontWeight: 600 
                    }}>
                      BEFORE
                    </span>
                    Original Issue
                  </div>
                  <img
                    src={report.image_url}
                    alt="Before - Report evidence"
                    style={{ 
                      width: '100%', 
                      maxHeight: 240, 
                      objectFit: 'cover', 
                      borderRadius: 12, 
                      cursor: 'pointer', 
                      border: '1px solid rgba(255,255,255,0.08)' 
                    }}
                    onClick={() => setLightbox('before')}
                  />
                </div>
                
                {/* After Image */}
                <div>
                  <div style={{ 
                    fontSize: 12, 
                    fontWeight: 600, 
                    color: 'rgba(255,255,255,0.7)', 
                    marginBottom: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    <span style={{ 
                      background: 'rgba(34,197,94,0.2)', 
                      color: '#4ADE80', 
                      padding: '2px 8px', 
                      borderRadius: 4, 
                      fontSize: 10, 
                      fontWeight: 600 
                    }}>
                      AFTER
                    </span>
                    Resolved
                    <span style={{ color: '#4ADE80', fontSize: 14 }}>✓</span>
                  </div>
                  <img
                    src={report.resolution_image_url}
                    alt="After - Resolution evidence"
                    style={{ 
                      width: '100%', 
                      maxHeight: 240, 
                      objectFit: 'cover', 
                      borderRadius: 12, 
                      cursor: 'pointer', 
                      border: '1px solid rgba(34,197,94,0.25)' 
                    }}
                    onClick={() => setLightbox('after')}
                  />
                </div>
                
                {/* Lightbox for both images */}
                {lightbox && (
                  <div className="tr-lightbox" onClick={() => setLightbox(null)}>
                    <img
                      src={lightbox === 'before' ? report.image_url : report.resolution_image_url}
                      alt={`Full size ${lightbox === 'before' ? 'before' : 'after'}`}
                      style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: 12 }}
                    />
                    <div style={{
                      position: 'absolute',
                      top: 20,
                      left: 20,
                      background: 'rgba(0,0,0,0.7)',
                      color: 'white',
                      padding: '8px 12px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600
                    }}>
                      {lightbox === 'before' ? 'BEFORE - Original Issue' : 'AFTER - Resolved'}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* SECTION 6: COMMENTS */}
          <motion.div className="tr-glass" variants={fadeUp} initial="hidden" animate="visible" custom={6}>
            <h2 className="tr-section-title">Comments</h2>
            {comments.length === 0 ? (
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', marginBottom: 16 }}>No comments yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                {comments.map((c) => (
                  <div key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 12 }}>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>
                      {formatDateTime(c.created_at)}
                    </p>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>{c.comment}</p>
                  </div>
                ))}
              </div>
            )}
            {currentUser && report.user_id === currentUser.id && (
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="tr-comment-input"
                />
                <button onClick={submitComment} className="tr-send-btn">
                  Send
                </button>
              </div>
            )}
          </motion.div>

        </div>
      </div>
    </>
  )
}