'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import type { Certificate, FormField } from '@/lib/types'
import { ArrowLeft, Award, Calendar, Check, Download, AlertTriangle, Clock } from 'lucide-react'

type Step = 'form' | 'generating' | 'certificate'

/* ---------------------------------- عناصر زخرفية ---------------------------------- */


function Watermark() {
  return (
    <svg
      viewBox="0 0 400 400"
      className="pointer-events-none absolute -top-10 -right-10 w-72 h-72 opacity-[0.03]"
      aria-hidden="true"
    >
      <g transform="translate(200,200)">
        <rect x="-110" y="-110" width="220" height="220" fill="none" stroke="#16243f" strokeWidth="3" transform="rotate(0)" />
        <rect x="-110" y="-110" width="220" height="220" fill="none" stroke="#16243f" strokeWidth="3" transform="rotate(45)" />
        <circle r="150" fill="none" stroke="#16243f" strokeWidth="2" />
      </g>
    </svg>
  )
}

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

  // Load Certificate Config
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
          initialData[f.variable] = new Date().toLocaleDateString('ar-EG')
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

  // Countdown timer calculations
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

  const isClosed = cert
    ? (!cert.is_open || (cert.auto_close_at && (timeLeft !== null ? timeLeft <= 0 : new Date() > new Date(cert.auto_close_at))))
    : false

  function validate(): boolean {
    const newErrors: Record<string, string> = {}
    cert?.form_fields?.forEach((field) => {
      if (field.required && !formData[field.variable]?.trim()) {
        newErrors[field.variable] = 'هذا الحقل مطلوب لإصدار الشهادة'
      }
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Fallback HTML string replacement for older templates
  function generateCertificateHtml(data: Record<string, string>): string {
    let html = cert?.template_html || ''
    Object.entries(data).forEach(([key, value]) => {
      const escaped = key.replace(/[{}]/g, '\\$&')
      html = html.replace(new RegExp(escaped, 'g'), value)
    })
    return html
  }

  // Handle Form Submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    setStep('generating')

    try {
      // 1. Submit response to Supabase
      const res = await fetch(`/api/certificates/${id}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: formData }),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'فشل إرسال البيانات للرئيسية')
      }

      // If it's a legacy template, prepare the HTML fallback
      if (cert && cert.template_html && !cert.template_html.startsWith('{')) {
        const html = generateCertificateHtml(formData)
        setGeneratedHtml(html)
      }

      // Small delay for UX transition
      await new Promise((r) => setTimeout(r, 1600))
      setStep('certificate')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'حدث خطأ غير متوقع'
      showToast(msg, 'error')
      setStep('form')
    } finally {
      setSubmitting(false)
    }
  }

  // Download PDF
  async function handleDownloadPDF() {
    showToast('جاري تحضير ملف الإجازة PDF...')

    try {
      const html2canvas = (await import('html2canvas')).default
      const jsPDF = (await import('jspdf')).default

      if (!certRef.current) return

      const canvas = await html2canvas(certRef.current, {
        scale: 2.2, // high quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
      })

      const imgData = canvas.toDataURL('image/png')
      
      // Determine orientation dynamically based on layout config
      let isLandscape = true
      if (cert && cert.template_html && cert.template_html.startsWith('{')) {
        try {
          const config = JSON.parse(cert.template_html)
          isLandscape = config.orientation === 'landscape'
        } catch {}
      }

      const pdf = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`إجازة_${cert?.title || 'شهادة'}.pdf`)
      showToast('تم تحميل ملف PDF بنجاح ✓')
    } catch (err) {
      console.error(err)
      showToast('فشل توليد PDF تلقائياً، يمكنك حفظ الصفحة يدوياً', 'error')
    }
  }

  if (loading) {
    return (
      <div className="loading-screen text-center flex flex-col items-center justify-center min-h-screen content-bg">
        <div className="spinner" />
        <span>جاري تحميل نموذج الإجازة...</span>
      </div>
    )
  }

  if (!cert) {
    return (
      <div className="min-h-screen content-bg flex items-center justify-center p-4">
        <div className="card-formal p-8 text-center max-w-[400px]">
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚫</div>
          <h2 className="font-amiri text-xl font-bold mb-2" style={{ color: 'var(--navy-dark)' }}>
            الإجازة غير موجودة
          </h2>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            الرابط الذي فتحته غير صحيح، أو تم إلغاء هذه الإجازة من قبل الإدارة.
          </p>
        </div>
      </div>
    )
  }

  if (isClosed) {
    return (
      <div className="min-h-screen content-bg flex items-center justify-center p-4">
        <div className="card-formal p-8 text-center max-w-[400px]">
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
          <h2 className="font-amiri text-xl font-bold mb-2" style={{ color: 'var(--navy-dark)' }}>
            استقبال الردود مغلق
          </h2>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            انتهى وقت التقديم المخصص لهذه الدورة/الإجازة.
          </p>
          <div className="divider-rule my-3">
            <div className="line" />
            <div className="diamond" />
            <div className="line" />
          </div>
          <p className="text-[11px] font-bold" style={{ color: 'var(--navy-dark)' }}>{cert.title}</p>
        </div>
      </div>
    )
  }

  if (step === 'generating') {
    return (
      <div className="min-h-screen content-bg flex items-center justify-center p-4">
        <div className="card-formal p-8 text-center max-w-[400px] flex flex-col items-center">
          <div className="generating-animation mb-4">
            <Award size={48} className="animate-bounce" style={{ color: 'var(--gold-main)' }} />
          </div>
          <h2 className="font-amiri text-xl font-bold mb-1" style={{ color: 'var(--navy-dark)' }}>
            جاري توليد إجازتك الرقمية
          </h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            نقوم بختم وتوثيق شهادتك حالياً، الرجاء عدم إغلاق الصفحة...
          </p>
        </div>
      </div>
    )
  }

  // ── عرض الشهادة وتنزيلها ────────────────────────────────────────────────
  if (step === 'certificate') {
    let builderConfig: any = null
    const isJsonTemplate = cert.template_html && cert.template_html.startsWith('{')
    if (isJsonTemplate) {
      try {
        builderConfig = JSON.parse(cert.template_html)
      } catch {}
    }

    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#1c1c1f' }}>
        {/* شريط الإجراءات */}
        <div className="bg-[#121214] border-b border-[#2d2d30] py-4 px-6 sticky top-0 z-50 text-right">
          <div className="container max-w-[900px] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-amiri text-lg font-bold text-white leading-tight">
                🎉 تهانينا! صدرت إجازتك بنجاح
              </h2>
              <p className="text-[11px]" style={{ color: '#a0a0c0' }}>{cert.title}</p>
            </div>
            <div className="flex gap-2.5">
              <button
                className="btn btn-secondary border-[#444] text-[#ccc] hover:bg-[#222]"
                onClick={() => {
                  setStep('form')
                  setGeneratedHtml('')
                }}
              >
                ← تعديل البيانات
              </button>
              <button className="btn btn-gold px-6 py-2.5" onClick={handleDownloadPDF}>
                <Download size={16} />
                <span>تحميل كملف PDF للطباعة</span>
              </button>
            </div>
          </div>
        </div>

        {/* عرض الورقة */}
        <div className="flex-1 flex justify-center items-start p-6 lg:p-12 overflow-auto">
          {isJsonTemplate && builderConfig ? (
            <div
              ref={certRef}
              className="certificate-a4 relative flex-shrink-0"
              style={{
                background: builderConfig.bg || '#fffdf8',
                aspectRatio: builderConfig.orientation === 'landscape' ? '1.414 / 1' : '1 / 1.414',
                width: builderConfig.orientation === 'landscape' ? '297mm' : '210mm',
                height: builderConfig.orientation === 'landscape' ? '210mm' : '297mm',
                border: 'none',
              }}
            >
              {/* Border Image */}
              <img
                src="/border.png"
                alt="Certificate Border"
                className="absolute pointer-events-none select-none"
                style={{
                  width: builderConfig.orientation === 'landscape' ? '70.72%' : '100%',
                  height: builderConfig.orientation === 'landscape' ? '141.42%' : '100%',
                  top: builderConfig.orientation === 'landscape' ? '50%' : '0',
                  left: builderConfig.orientation === 'landscape' ? '50%' : '0',
                  transform: builderConfig.orientation === 'landscape' ? 'translate(-50%, -50%) rotate(90deg)' : 'none',
                  objectFit: 'fill',
                }}
              />

              {/* Central flow document container */}
              <div
                className="absolute flex flex-col justify-center gap-2 text-right pointer-events-none"
                style={{
                  left: '12%',
                  right: '12%',
                  top: '12%',
                  bottom: '12%',
                  direction: 'rtl',
                  zIndex: 2,
                }}
              >
                {builderConfig.elements.filter((el: any) => el.type !== 'image' && !el.hidden).map((el: any) => {
                  let textValue = el.text
                  if (el.type === 'field') {
                    textValue = formData[el.key] || el.text
                  }
                  return (
                    <div
                      key={el.id}
                      style={{
                        fontFamily: el.font === 'Amiri' ? "'Amiri', serif" : "'Tajawal', sans-serif",
                        fontSize: `${el.size}px`,
                        fontWeight: el.weight || 400,
                        color: el.color,
                        textAlign: el.align || 'center',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {textValue}
                    </div>
                  )
                })}
              </div>

              {/* Absolute Stamps and Signatures */}
              {builderConfig.elements.filter((el: any) => el.type === 'image' && !el.hidden).map((el: any) => {
                return (
                  <div
                    key={el.id}
                    className="absolute flex items-center justify-center overflow-hidden pointer-events-none"
                    style={{
                      left: `${el.x}%`,
                      top: `${el.y}%`,
                      width: `${el.w}%`,
                      height: `${el.h}%`,
                      transform: 'translate(-50%, -50%)',
                      zIndex: 10,
                    }}
                  >
                    {el.url && <img src={el.url} alt={el.label} className="w-full h-full object-contain pointer-events-none" />}
                  </div>
                )
              })}
            </div>
          ) : (
            /* Fallback rendering for HTML legacy certificates */
            <div
              ref={certRef}
              dangerouslySetInnerHTML={{ __html: generatedHtml }}
              className="certificate-a4"
              id="generated-certificate"
              style={{ width: '210mm', minHeight: '297mm' }}
            />
          )}
        </div>

        {toast && <div className="toast toast-success" style={{ position: 'fixed', bottom: '2rem' }}>{toast.msg}</div>}
      </div>
    )
  }

  // ── نموذج إدخال البيانات للطلاب ──────────────────────────────────────────
  return (
    <div className="min-h-screen content-bg flex flex-col items-center justify-center p-4 py-12">
      <Watermark />

      <div className="w-full flex flex-col gap-6 relative z-10" style={{ maxWidth: '580px' }}>
        
        {/* ترويسة النموذج */}
        <div className="card-formal p-6 text-center" style={{ background: 'var(--bg-card)' }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(201,162,39,0.15)', border: '2px solid var(--gold-focus)' }}>
            <Award size={26} style={{ color: 'var(--gold-main)' }} />
          </div>
          <h1 className="font-amiri text-2xl font-bold mb-1" style={{ color: 'var(--navy-dark)' }}>
            {cert.title}
          </h1>
          {cert.description && (
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {cert.description}
            </p>
          )}
        </div>



        {/* حقول النموذج */}
        <div className="card-formal p-8" style={{ background: 'var(--bg-card)' }}>
          <h2 className="font-amiri text-lg font-bold mb-5 border-b pb-2 text-right" style={{ color: 'var(--navy-dark)', borderColor: 'var(--border-gold)' }}>
            أدخل بياناتك لاستلام إجازتك الرقمية
          </h2>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 text-right">
            {cert.form_fields?.length === 0 ? (
              <div className="text-center text-xs py-6" style={{ color: 'var(--text-muted)' }}>
                لا توجد حقول مطلوب إدخالها لهذا النموذج.
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
                      rows={3}
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
                      <option value="">اختر من القائمة...</option>
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
                    <span className="text-xs font-semibold mt-1 block" style={{ color: 'var(--danger)' }}>
                      {errors[field.variable]}
                    </span>
                  )}
                </div>
              ))
            )}

            <button
              type="submit"
              className="btn btn-gold btn-lg w-full flex items-center justify-center gap-2 mt-4"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="spinner" style={{ width: '1.1rem', height: '1.1rem', borderWidth: '2px' }} />
                  <span>جاري إرسال الطلب...</span>
                </>
              ) : (
                <>
                  <Check size={18} />
                  <span>تقديم الطلب وإصدار الإجازة</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {toast && <div className={`toast toast-${toast.type}`} role="status">{toast.msg}</div>}
    </div>
  )
}
