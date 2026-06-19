'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import type { Certificate } from '@/lib/types'
import Link from 'next/link'

export default function AdminCertificateViewPage() {
  const { id } = useParams<{ id: string }>()
  const [cert, setCert] = useState<Certificate | null>(null)
  const [loading, setLoading] = useState(true)
  const [submissions, setSubmissions] = useState<Array<{ id: string; created_at: string; data: Record<string, string> }>>([])

  const loadData = useCallback(async () => {
    try {
      const [certRes, subRes] = await Promise.all([
        fetch(`/api/certificates/${id}`),
        fetch(`/api/certificates/${id}/submissions`),
      ])
      const [certData, subData] = await Promise.all([certRes.json(), subRes.json()])
      setCert(certData)
      setSubmissions(subData)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <span>جاري التحميل...</span>
      </div>
    )
  }

  if (!cert) return <div className="loading-screen">الإجازة غير موجودة</div>

  const publicLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/c/${id}`

  return (
    <div style={{ minHeight: '100vh' }}>
      <nav className="nav">
        <div className="nav-inner">
          <div className="flex items-center gap-2">
            <Link href="/admin" className="btn btn-secondary btn-sm">
              ← العودة للوحة التحكم
            </Link>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{cert.title}</span>
          </div>
          <div className="nav-actions">
            <Link href={`/admin/certificates/${id}/edit`} className="btn btn-primary btn-sm">
              ✏️ تعديل
            </Link>
          </div>
        </div>
      </nav>

      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        {/* Info card */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ marginBottom: '0.25rem' }}>{cert.title}</h2>
              {cert.description && <p style={{ color: 'var(--text-muted)' }}>{cert.description}</p>}
            </div>
            <span className={`badge ${cert.is_open ? 'badge-success' : 'badge-danger'}`}>
              {cert.is_open ? '● مفتوح للتقديم' : '● مغلق'}
            </span>
          </div>

          {cert.is_open && (
            <div style={{ background: 'rgba(108,71,255,0.07)', border: '1px solid rgba(108,71,255,0.2)', borderRadius: '10px', padding: '1rem' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>رابط التقديم للطلاب:</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <code style={{ flex: 1, background: 'var(--bg-input)', borderRadius: '6px', padding: '0.4rem 0.75rem', fontSize: '0.85rem', color: 'var(--primary-light)', direction: 'ltr', overflowWrap: 'break-word' }}>
                  {publicLink}
                </code>
                <button className="btn btn-primary btn-sm" onClick={() => navigator.clipboard.writeText(publicLink)}>
                  نسخ الرابط
                </button>
                <Link href={`/c/${id}`} target="_blank" className="btn btn-secondary btn-sm">
                  فتح الرابط ↗
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Submissions */}
        <div>
          <h3 style={{ marginBottom: '1rem' }}>
            التقديمات ({submissions.length})
          </h3>

          {submissions.length === 0 ? (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3>لا توجد تقديمات بعد</h3>
              {cert.is_open
                ? <p>شارك الرابط مع الطلاب لبدء استقبال التقديمات</p>
                : <p>لم يتم استقبال أي تقديمات قبل إغلاق التقديم</p>
              }
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--bg-card)', borderRadius: '12px', overflow: 'hidden' }}>
                <thead>
                  <tr style={{ background: 'rgba(108,71,255,0.1)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>#</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>التاريخ</th>
                    {cert.form_fields?.map(f => (
                      <th key={f.id} style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>{f.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((sub, idx) => (
                    <tr key={sub.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.7rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{idx + 1}</td>
                      <td style={{ padding: '0.7rem 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {new Date(sub.created_at).toLocaleDateString('ar-SA')}
                      </td>
                      {cert.form_fields?.map(f => (
                        <td key={f.id} style={{ padding: '0.7rem 1rem', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                          {sub.data?.[f.variable] || '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
