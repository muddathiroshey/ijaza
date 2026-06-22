'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import type { Certificate } from '@/lib/types'
import Link from 'next/link'
import { ArrowLeft, Edit3, Link2, Download, Table, Calendar, AlertCircle } from 'lucide-react'

export default function AdminCertificateViewPage() {
  const { id } = useParams<{ id: string }>()
  const [cert, setCert] = useState<Certificate | null>(null)
  const [loading, setLoading] = useState(true)
  const [submissions, setSubmissions] = useState<Array<{ id: string; created_at: string; data: Record<string, string> }>>([])
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const loadData = useCallback(async () => {
    try {
      const [certRes, subRes] = await Promise.all([
        fetch(`/api/certificates/${id}`),
        fetch(`/api/certificates/${id}/submissions`),
      ])
      
      if (!certRes.ok) throw new Error()
      
      const certData = await certRes.json()
      const subData = await subRes.json()
      
      setCert(certData)
      setSubmissions(subData || [])
    } catch {
      showToast('فشل تحميل تفاصيل الإجازة والردود', 'error')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadData()
  }, [loadData])

  function handleCopyLink() {
    if (!cert) return
    const publicLink = `${window.location.origin}/c/${cert.id}`
    navigator.clipboard.writeText(publicLink)
    showToast('تم نسخ الرابط المباشر للتقديم ✓')
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <span>جاري تحميل التقديمات...</span>
      </div>
    )
  }

  if (!cert) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-right">
        <div className="card-formal p-8 text-center max-w-sm">
          <AlertCircle size={40} style={{ color: 'var(--danger)', margin: '0 auto 1rem' }} />
          <h2 className="font-amiri text-lg font-bold mb-2">الإجازة غير موجودة</h2>
          <p className="text-xs text-muted mb-4">الرمز الممرر غير مرتبط بأي إجازة مسجلة.</p>
          <Link href="/admin" className="btn btn-gold btn-sm">العودة للوحة التحكم</Link>
        </div>
      </div>
    )
  }

  const publicLink = `${window.location.origin}/c/${id}`
  const isClosed = !cert.is_open || !!(cert.auto_close_at && new Date() > new Date(cert.auto_close_at))

  return (
    <div className="px-5 lg:px-8 py-7 text-right">
      {/* الترويسة والتحكم */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin" className="text-xs font-bold flex items-center gap-1" style={{ color: 'var(--gold-main)' }}>
              <span>← العودة للرئيسية</span>
            </Link>
          </div>
          <h1 className="font-amiri text-2xl font-bold" style={{ color: 'var(--navy-dark)' }}>
            {cert.title}
          </h1>
          {cert.description && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{cert.description}</p>}
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link href={`/admin/certificates/${id}/edit`} className="btn btn-outline-gold btn-sm flex items-center gap-1">
            <Edit3 size={14} />
            <span>تعديل التصميم والقالب</span>
          </Link>
        </div>
      </div>

      <div className="divider-rule mb-6">
        <div className="line" />
        <div className="diamond" />
        <div className="line" />
      </div>

      {/* تفاصيل الرابط */}
      {!isClosed && (
        <div className="card-formal p-4 mb-6 text-right" style={{ background: 'var(--bg-card)' }}>
          <p className="text-xs font-bold mb-2" style={{ color: 'var(--navy-dark)' }}>رابط تقديم الطلاب المباشر:</p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <code className="flex-1 bg-cream-light border rounded-lg px-3 py-2 text-xs font-mono select-all text-left" style={{ direction: 'ltr', background: 'var(--bg-cream)', borderColor: 'var(--border-gold)', color: 'var(--navy-dark)' }}>
              {publicLink}
            </code>
            <div className="flex gap-2">
              <button className="btn btn-gold btn-sm flex-1 sm:flex-initial" onClick={handleCopyLink}>
                <Link2 size={14} />
                <span>نسخ الرابط</span>
              </button>
              <a href={`/c/${id}`} target="_blank" className="btn btn-secondary btn-sm flex-1 sm:flex-initial">
                فتح الرابط ↗
              </a>
            </div>
          </div>
        </div>
      )}

      {/* الردود والتقديمات */}
      <div>
        <h3 className="font-amiri text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--navy-dark)' }}>
          <Table size={18} style={{ color: 'var(--gold-main)' }} />
          <span>قائمة التقديمات المستلمة ({submissions.length})</span>
        </h3>

        {submissions.length === 0 ? (
          <div className="card-formal p-10 text-center flex flex-col items-center justify-center">
            <AlertCircle size={40} style={{ color: 'var(--gold-main)', opacity: 0.6 }} className="mb-3" />
            <h3 className="font-amiri text-lg font-bold" style={{ color: 'var(--navy-dark)' }}>لا توجد تقديمات بعد</h3>
            {!isClosed ? (
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>انسخ الرابط أعلاه وشاركه مع طلابك لبدء استقبال الإجابات.</p>
            ) : (
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>التقديم على هذه الشهادة مغلق حالياً.</p>
            )}
          </div>
        ) : (
          <div className="card-formal overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-right text-sm">
                <thead>
                  <tr style={{ background: '#fdfaf2', borderBottom: '1px solid var(--border-gold)' }}>
                    <th style={{ padding: '0.8rem 1rem', color: 'var(--navy-dark)', fontWeight: 700 }}>#</th>
                    <th style={{ padding: '0.8rem 1rem', color: 'var(--navy-dark)', fontWeight: 700 }}>تاريخ التقديم</th>
                    {cert.form_fields?.map((f) => (
                      <th key={f.id} style={{ padding: '0.8rem 1rem', color: 'var(--navy-dark)', fontWeight: 700 }}>{f.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((sub, idx) => (
                    <tr key={sub.id} className="border-b hover:bg-[#fffefb]" style={{ borderColor: 'var(--border-gold)' }}>
                      <td style={{ padding: '0.8rem 1rem', color: 'var(--text-muted)' }}>{idx + 1}</td>
                      <td style={{ padding: '0.8rem 1rem', color: 'var(--text-muted)' }}>
                        <span className="flex items-center gap-1.5 text-xs">
                          <Calendar size={12} />
                          {new Date(sub.created_at).toLocaleDateString('ar-SA')}
                        </span>
                      </td>
                      {cert.form_fields?.map((f) => (
                        <td key={f.id} style={{ padding: '0.8rem 1rem', color: 'var(--text-main)', fontWeight: 500 }}>
                          {sub.data?.[f.variable] || '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {toast && <div className={`toast toast-${toast.type}`} role="status">{toast.msg}</div>}
    </div>
  )
}
