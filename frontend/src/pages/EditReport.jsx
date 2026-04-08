import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' }
  })
}

function EditReport() {
  const [description, setDescription] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [image, setImage] = useState(null)
  const [imageUrl, setImageUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuth()

  useEffect(() => {
    fetchReport()
  }, [id])

  const fetchReport = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (error) {
        setError(error.message)
      } else if (data) {
        setDescription(data.description || '')
        setImageUrl(data.image_url || "")
      }
    } catch (err) {
      setError('Failed to fetch report')
    }
  }

  const handleUpdate = async () => {
    try {
      setLoading(true)
      setError('')
      setSuccess('')

      const updates = { description }

      if (imageFile) {
        // Upload new image to Supabase storage
        const filePath = `reports/${Date.now()}-${imageFile.name}`
        const { error: uploadError } = await supabase.storage
          .from('report-images')
          .upload(filePath, imageFile)

        if (uploadError) {
          throw new Error('Failed to upload image: ' + uploadError.message)
        }

        // Get public URL for uploaded image
        const { data: publicUrlData } = supabase.storage
          .from('report-images')
          .getPublicUrl(filePath)

        updates.image_url = publicUrlData.publicUrl
      }

      // Update report in Supabase
      const { error: updateError } = await supabase
        .from('reports')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)

      if (updateError) {
        throw new Error('Failed to update report: ' + updateError.message)
      }

      setSuccess('Report updated successfully!')
      setTimeout(() => {
        navigate('/citizen')
      }, 2000)

    } catch (err) {
      setError(err.message || 'Failed to update report')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    await handleUpdate()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    
    if (file && file.type.startsWith("image/")) {
      setImage(file)
      setImageFile(file)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImage(file)
      setImageFile(file)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@300;400;500;600&display=swap');
        .er-page {
          background: #050B18;
          min-height: 100vh;
          font-family: 'Inter', sans-serif;
          color: white;
          position: relative;
          overflow-x: hidden;
        }
        .er-grid-bg {
          position: fixed; inset: 0;
          background-image: linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px);
          background-size: 50px 50px; pointer-events: none;
        }
        .er-orb {
          position: fixed; border-radius: 50%; filter: blur(80px);
          animation: erFloat 8s ease-in-out infinite; pointer-events: none;
        }
        @keyframes erFloat { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-30px) scale(1.05)} }
        .er-glass-card {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          backdrop-filter: blur(20px);
          border-radius: 20px;
          padding: 40px;
        }
        @media (max-width: 768px) { .er-glass-card { padding: 24px 20px; } }
        .er-section-title {
          font-family: 'Syne', sans-serif;
          font-size: 18px; font-weight: 700; color: white;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          margin-bottom: 16px;
          display: flex; align-items: center; gap: 10px;
        }
        .er-label {
          display: block; font-size: 13px; font-weight: 500;
          color: rgba(255,255,255,0.5); margin-bottom: 8px;
        }
        .er-textarea {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px; padding: 14px 16px;
          color: white; font-size: 14px;
          font-family: 'Inter', sans-serif;
          outline: none; transition: all 0.3s ease;
          resize: none; box-sizing: border-box; line-height: 1.6;
        }
        .er-textarea::placeholder { color: rgba(255,255,255,0.3); }
        .er-textarea:focus { border-color: #3B82F6; box-shadow: 0 0 0 3px rgba(59,130,246,0.15); }
        .er-dropzone {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          width: 100%; height: 220px;
          border: 2px dashed rgba(255,255,255,0.15);
          border-radius: 16px; cursor: pointer;
          background: rgba(255,255,255,0.03);
          transition: all 0.3s ease;
          position: relative; overflow: hidden;
        }
        .er-dropzone:hover { border-color: rgba(59,130,246,0.4); background: rgba(59,130,246,0.05); }
        .er-btn-primary {
          background: #3B82F6; color: white; border: none;
          border-radius: 12px; padding: 14px 28px;
          font-weight: 600; font-size: 15px;
          font-family: 'Inter', sans-serif; cursor: pointer;
          transition: all 0.2s ease;
        }
        .er-btn-primary:hover:not(:disabled) {
          background: #2563EB; transform: translateY(-1px);
          box-shadow: 0 8px 25px rgba(59,130,246,0.4);
        }
        .er-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .er-btn-ghost {
          background: transparent;
          color: rgba(255,255,255,0.7);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 12px; padding: 14px 28px;
          font-weight: 500; font-size: 15px;
          font-family: 'Inter', sans-serif; cursor: pointer;
          transition: all 0.2s ease;
        }
        .er-btn-ghost:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.3); color: white; }
        .er-remove-btn {
          position: absolute; top: 12px; right: 12px;
          background: rgba(239,68,68,0.9); color: white;
          border: none; border-radius: 50%;
          width: 32px; height: 32px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; font-size: 14px; font-weight: 700;
          transition: all 0.2s ease; backdrop-filter: blur(10px); z-index: 5;
        }
        .er-remove-btn:hover { background: #EF4444; transform: scale(1.1); }
      `}</style>

      <div className="er-page">
        <div className="er-grid-bg" />
        <div className="er-orb" style={{ width: 400, height: 400, background: 'rgba(59,130,246,0.1)', top: '-5%', right: '-10%' }} />
        <div className="er-orb" style={{ width: 300, height: 300, background: 'rgba(167,139,250,0.08)', bottom: '10%', left: '-8%', animationDelay: '4s' }} />

        <div style={{ maxWidth: 860, margin: '0 auto', padding: '100px 16px 60px', position: 'relative', zIndex: 10 }}>
          <motion.div className="er-glass-card" variants={fadeUp} initial="hidden" animate="visible" custom={0}>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <motion.h1 variants={fadeUp} initial="hidden" animate="visible" custom={1}
                style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 800, marginBottom: 8, letterSpacing: '-0.5px' }}
              >
                Edit Water Report
              </motion.h1>
              <motion.p variants={fadeUp} initial="hidden" animate="visible" custom={2}
                style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}
              >
                Update your water issue report
              </motion.p>
            </div>

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12, padding: '14px 18px', fontSize: 13, color: '#FCA5A5', marginBottom: 24 }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 12, padding: '14px 18px', fontSize: 13, color: '#86EFAC', marginBottom: 24 }}>
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

              {/* Description Section */}
              <div>
                <div className="er-section-title"><span>📝</span> Description</div>
                <div>
                  <label className="er-label">Describe the water issue <span style={{ color: '#F87171' }}>*</span></label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="er-textarea"
                    style={{ height: 140 }}
                    placeholder="Please provide detailed information about the water issue..."
                    required
                  />
                </div>
              </div>

              {/* Current Image Section */}
              {imageUrl && (
                <div>
                  <div className="er-section-title"><span>🖼️</span> Current Image</div>
                  <div>
                    <label className="er-label">Current report image</label>
                    <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <img src={imageUrl} alt="Current report" style={{ width: '100%', height: 220, objectFit: 'cover', display: 'block' }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Image Upload Section */}
              <div>
                <div className="er-section-title"><span>📷</span> Replace Image (Optional)</div>
                <div>
                  <label className="er-label">Upload a new photo of the issue</label>
                  <div>
                    <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} id="image-upload" />
                    <div
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      className="er-dropzone"
                      onClick={() => document.getElementById('image-upload').click()}
                    >
                      {image ? (
                        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                          <img src={URL.createObjectURL(image)} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 14 }} />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setImage(null)
                              setImageFile(null)
                              document.getElementById('image-upload').value = ''
                            }}
                            className="er-remove-btn"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                          <svg width="36" height="36" fill="none" stroke="rgba(255,255,255,0.3)" viewBox="0 0 24 24" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Upload New Photo</p>
                          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Drag & drop or click to upload</p>
                        </div>
                      )}
                    </div>
                  </div>
                  {imageFile && !image && (
                    <div style={{ marginTop: 8, fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
                      Selected: {imageFile.name}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 28, borderTop: '1px solid rgba(255,255,255,0.08)', flexWrap: 'wrap' }}>
                <button type="button" onClick={() => navigate('/citizen')} className="er-btn-ghost">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="er-btn-primary">
                  {loading ? 'Updating...' : 'Update Report'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </>
  )
}

export default EditReport
