'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import type { Certificate, FormField } from '@/lib/types'

type Step = 'form' | 'generating' | 'certificate'

export default function StudentCertificatePage() {
  const { id } = useParams<{ id: string }>()
  const [cert, setCert] = useState<Certificate | null>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<Step>('form')
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [generatedHtml, setGeneratedHtml] = useState('')
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const certRef = useRef<HTMLDivElement>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const loadCert = useCallback(async () => {
    try {
      const res = await fetch(`/api/certificates/${id}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setCert(data)

      // Pre-fill today's date for date fields
      const initialData: Record<string, string> = {}
      data.form_fields?.forEach((f: FormField) => {
        if (f.type === 'date') {
          initialData[f.variable] = new Date().toLocaleDateString('ar-SA')
        }
      })
      setFormData(initialData)
    } catch {
      setCert(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadCert()
  }, [loadCert])

  const [timeLeft, setTimeLeft] = useState<number | null>(null)

  useEffect(() => {
    if (!cert || !cert.auto_close_at || !cert.is_open) {
      setTimeLeft(null)
      return
    }

    const calculateTimeLeft = () => {
      const diff = new Date(cert.auto_close_at!).getTime() - Date.now()
      return Math.max(0, Math.floor(diff / 1000))
    }

    const initialSeconds = calculateTimeLeft()
    setTimeLeft(initialSeconds)

    if (initialSeconds <= 0) return

    const interval = setInterval(() => {
      const seconds = calculateTimeLeft()
      setTimeLeft(seconds)
      if (seconds <= 0) {
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [cert])

  const isClosed = cert ? (!cert.is_open || (cert.auto_close_at && (timeLeft !== null ? timeLeft <= 0 : new Date() > new Date(cert.auto_close_at)))) : false

  function validate(): boolean {
    const newErrors: Record<string, string> = {}
    cert?.form_fields?.forEach((field) => {
      if (field.required && !formData[field.variable]?.trim()) {
        newErrors[field.variable] = 'هذا الحقل مطلوب'
      }
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function generateCertificateHtml(data: Record<string, string>): string {
    let html = cert?.template_html || ''
    Object.entries(data).forEach(([key, value]) => {
      // Escape the variable key for regex
      const escaped = key.replace(/[{}]/g, '\\$&')
      html = html.replace(new RegExp(escaped, 'g'), value)
    })
    return html
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    setStep('generating')

    try {
      // Submit to DB
      const res = await fetch(`/api/certificates/${id}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: formData }),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'فشل الإرسال')
      }

      // Generate HTML certificate
      const html = generateCertificateHtml(formData)
      setGeneratedHtml(html)

      // Small delay for UX
      await new Promise(r => setTimeout(r, 1500))
      setStep('certificate')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'حدث خطأ'
      showToast(msg, 'error')
      setStep('form')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDownloadPDF() {
    showToast('جاري تحضير ملف PDF...')

    try {
      // Dynamically import to avoid SSR issues
      const html2canvas = (await import('html2canvas')).default
      const jsPDF = (await import('jspdf')).default

      if (!certRef.current) return

      const canvas = await html2canvas(certRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      })

      const imgData = canvas.toDataURL('image/jpeg', 0.95)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`إجازة_${cert?.title || 'شهادة'}.pdf`)
      showToast('تم تحميل الشهادة بنجاح ✓')
    } catch {
      showToast('فشل تحميل PDF، جرب حفظ الصفحة يدوياً', 'error')
    }
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <span>جاري التحميل...</span>
      </div>
    )
  }

  // ── Not found or closed ───────────────────────────────────────────────────
  if (!cert) {
    return (
      <div className="student-page">
        <div className="not-found-box card-glass">
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚫</div>
          <h2>الإجازة غير موجودة</h2>
          <p>الرابط الذي فتحته غير صحيح أو الإجازة محذوفة.</p>
        </div>
      </div>
    )
  }

  if (isClosed) {
    return (
      <div className="student-page">
        <div className="not-found-box card-glass">
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
          <h2>التقديم مغلق</h2>
          <p>انتهى وقت التقديم على هذه الإجازة.</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>{cert.title}</p>
        </div>
      </div>
    )
  }

  // ── Generating ────────────────────────────────────────────────────────────
  if (step === 'generating') {
    return (
      <div className="student-page">
        <div className="not-found-box card-glass">
          <div className="generating-animation">
            <div className="cert-icon">📜</div>
            <div className="generating-dots">
              <span />
              <span />
              <span />
            </div>
          </div>
          <h2>جاري إنشاء شهادتك</h2>
          <p>يرجى الانتظار لحظة...</p>
        </div>
      </div>
    )
  }

  // ── Certificate View ──────────────────────────────────────────────────────
  if (step === 'certificate') {
    return (
      <div className="student-page certificate-page">
        <div className="certificate-actions-bar">
          <div className="container" style={{ maxWidth: '900px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>🎉 تهانينا! شهادتك جاهزة</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{cert.title}</p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button className="btn btn-secondary" onClick={() => { setStep('form'); setGeneratedHtml('') }}>
                  ← العودة للنموذج
                </button>
                <button className="btn btn-primary btn-lg" onClick={handleDownloadPDF} id="download-pdf-btn">
                  <svg viewBox="0 0 24 24" fill="none" width="18" height="18" stroke="currentColor" strokeWidth="2">
                    <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  تحميل PDF
                </button>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 1rem 4rem', background: 'var(--bg-surface)', minHeight: 'calc(100vh - 80px)' }}>
          <div
            ref={certRef}
            dangerouslySetInnerHTML={{ __html: generatedHtml }}
            className="certificate-a4"
            id="generated-certificate"
          />
        </div>

        {toast && <div className={`toast toast-${toast.type}`} role="status">{toast.msg}</div>}
      </div>
    )
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div className="student-page">
      <div className="student-form-container">
        {/* Header */}
        <div className="student-header card-glass">
          <div className="cert-badge">📜</div>
          <h1>{cert.title}</h1>
          {cert.description && <p>{cert.description}</p>}
        </div>

        {timeLeft !== null && timeLeft > 0 && (
          <div className="countdown-banner card-glass">
            <div className="countdown-title">⏱️ ينتهي التقديم تلقائياً خلال:</div>
            <div className="countdown-timer">
              <div className="timer-segment">
                <span className="timer-val">{String(Math.floor(timeLeft / 3600)).padStart(2, '0')}</span>
                <span className="timer-lbl">ساعة</span>
              </div>
              <div className="timer-colon">:</div>
              <div className="timer-segment">
                <span className="timer-val">{String(Math.floor((timeLeft % 3600) / 60)).padStart(2, '0')}</span>
                <span className="timer-lbl">دقيقة</span>
              </div>
              <div className="timer-colon">:</div>
              <div className="timer-segment">
                <span className="timer-val">{String(timeLeft % 60).padStart(2, '0')}</span>
                <span className="timer-lbl">ثانية</span>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="card-glass student-form-card">
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.15rem' }}>
            أدخل بياناتك لاستلام الإجازة
          </h2>

          <form onSubmit={handleSubmit} noValidate>
            {cert.form_fields?.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                لا توجد حقول في هذا النموذج
              </div>
            ) : (
              cert.form_fields?.map((field) => (
                <div key={field.id} className="form-group">
                  <label className="form-label" htmlFor={`field-${field.id}`}>
                    {field.label}
                    {field.required && <span style={{ color: 'var(--danger)' }}> *</span>}
                  </label>

                  {field.type === 'textarea' ? (
                    <textarea
                      id={`field-${field.id}`}
                      className="form-textarea"
                      value={formData[field.variable] || ''}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, [field.variable]: e.target.value }))
                        if (errors[field.variable]) setErrors(prev => ({ ...prev, [field.variable]: '' }))
                      }}
                      placeholder={field.placeholder}
                      required={field.required}
                      rows={4}
                    />
                  ) : field.type === 'select' ? (
                    <select
                      id={`field-${field.id}`}
                      className="form-select"
                      value={formData[field.variable] || ''}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, [field.variable]: e.target.value }))
                        if (errors[field.variable]) setErrors(prev => ({ ...prev, [field.variable]: '' }))
                      }}
                      required={field.required}
                    >
                      <option value="">اختر...</option>
                      {field.options?.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={`field-${field.id}`}
                      type={field.type === 'date' ? 'date' : 'text'}
                      className="form-input"
                      value={formData[field.variable] || ''}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, [field.variable]: e.target.value }))
                        if (errors[field.variable]) setErrors(prev => ({ ...prev, [field.variable]: '' }))
                      }}
                      placeholder={field.placeholder}
                      required={field.required}
                    />
                  )}

                  {errors[field.variable] && (
                    <span style={{ color: 'var(--danger)', fontSize: '0.82rem', marginTop: '0.25rem' }}>
                      {errors[field.variable]}
                    </span>
                  )}
                </div>
              ))
            )}

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={submitting}
              id="submit-form-btn"
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              {submitting ? (
                <>
                  <span className="spinner" style={{ width: '1.1rem', height: '1.1rem', borderWidth: '2px' }} />
                  جاري الإرسال...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" width="18" height="18" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  إرسال واستلام الإجازة
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {toast && <div className={`toast toast-${toast.type}`} role="status">{toast.msg}</div>}

      <style jsx>{`
        .student-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 2rem 1rem 4rem;
        }

        .student-form-container {
          width: 100%;
          max-width: 600px;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .student-header {
          text-align: center;
          padding: 2rem;
        }

        .cert-badge {
          font-size: 3.5rem;
          margin-bottom: 1rem;
          filter: drop-shadow(0 0 20px rgba(108, 71, 255, 0.4));
        }

        .student-header h1 {
          font-size: 1.7rem;
          margin-bottom: 0.5rem;
          background: linear-gradient(135deg, var(--text-primary), var(--primary-light));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .student-form-card { padding: 2rem; }

        .not-found-box {
          max-width: 400px;
          width: 100%;
          text-align: center;
          padding: 3rem 2rem;
          margin-top: 20vh;
        }

        .not-found-box h2 { margin-bottom: 0.5rem; }

        .certificate-page { padding: 0; }

        .certificate-actions-bar {
          background: rgba(17, 17, 30, 0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border);
          padding: 1rem 1.5rem;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        /* Generating animation */
        .generating-animation {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .cert-icon {
          font-size: 4rem;
          animation: bounce 0.8s infinite alternate;
        }

        @keyframes bounce {
          from { transform: translateY(0); }
          to { transform: translateY(-10px); }
        }

        .generating-dots {
          display: flex;
          gap: 6px;
        }

        .generating-dots span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--primary);
          animation: dot 1s infinite;
        }

        .generating-dots span:nth-child(2) { animation-delay: 0.2s; }
        .generating-dots span:nth-child(3) { animation-delay: 0.4s; }

        @keyframes dot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }

        .countdown-banner {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem;
          background: rgba(245, 158, 11, 0.08);
          border: 1px solid rgba(245, 158, 11, 0.2);
          border-radius: 12px;
          text-align: center;
        }
        .countdown-title {
          font-size: 0.85rem;
          color: var(--text-secondary);
          font-weight: 600;
        }
        .countdown-timer {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          direction: ltr;
        }
        .timer-segment {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 45px;
        }
        .timer-val {
          font-size: 1.3rem;
          font-weight: 700;
          color: #f59e0b;
          font-family: monospace;
        }
        .timer-lbl {
          font-size: 0.7rem;
          color: var(--text-muted);
        }
        .timer-colon {
          font-size: 1.2rem;
          font-weight: 700;
          color: #f59e0b;
          margin-bottom: 12px;
        }
      `}</style>
    </div>
  )
}
