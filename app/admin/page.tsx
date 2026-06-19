'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Certificate } from '@/lib/types'
import Link from 'next/link'

export default function AdminDashboard() {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [enableAutoClose, setEnableAutoClose] = useState(false)
  const [durationHours, setDurationHours] = useState('0')
  const [durationMinutes, setDurationMinutes] = useState('30')
  const [creating, setCreating] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const router = useRouter()

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const loadCertificates = useCallback(async () => {
    try {
      const res = await fetch('/api/certificates')
      const data = await res.json()
      setCertificates(data)
    } catch {
      showToast('فشل تحميل الإجازات', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCertificates()
  }, [loadCertificates])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          description: newDesc,
          durationHours: enableAutoClose ? Number(durationHours) : 0,
          durationMinutes: enableAutoClose ? Number(durationMinutes) : 0,
        }),
      })
      const data = await res.json()
      setShowCreate(false)
      setNewTitle('')
      setNewDesc('')
      setEnableAutoClose(false)
      setDurationHours('0')
      setDurationMinutes('30')
      showToast('تم إنشاء الإجازة بنجاح ✓')
      router.push(`/admin/certificates/${data.id}/edit`)
    } catch {
      showToast('فشل إنشاء الإجازة', 'error')
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`هل أنت متأكد من حذف إجازة "${title}"؟`)) return
    try {
      await fetch(`/api/certificates/${id}`, { method: 'DELETE' })
      setCertificates((prev) => prev.filter((c) => c.id !== id))
      showToast('تم حذف الإجازة')
    } catch {
      showToast('فشل الحذف', 'error')
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  const openCount = certificates.filter((c) => c.is_open).length
  const closedCount = certificates.filter((c) => !c.is_open).length

  return (
    <div className="admin-layout">
      {/* Navigation */}
      <nav className="nav">
        <div className="nav-inner">
          <Link href="/admin" className="nav-logo">⬡ منصة الإجازات</Link>
          <div className="nav-actions">
            <Link href="/admin/assets" className="btn btn-secondary btn-sm" id="assets-nav-btn">
              <svg viewBox="0 0 24 24" fill="none" width="16" height="16" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
              التواقيع والأختام
            </Link>
            <button className="btn btn-secondary btn-sm" onClick={handleLogout} id="logout-btn">
              <svg viewBox="0 0 24 24" fill="none" width="16" height="16" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              خروج
            </button>
          </div>
        </div>
      </nav>

      <main className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        {/* Header */}
        <div className="dash-header">
          <div>
            <h1>لوحة التحكم</h1>
            <p>أنشئ وأدر شهادات الإجازات</p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowCreate(true)}
            id="create-cert-btn"
          >
            <svg viewBox="0 0 24 24" fill="none" width="18" height="18" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            إجازة جديدة
          </button>
        </div>

        {/* Stats */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-value">{certificates.length}</div>
            <div className="stat-label">إجمالي الإجازات</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{openCount}</div>
            <div className="stat-label">مفتوحة للتقديم</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{closedCount}</div>
            <div className="stat-label">مغلقة</div>
          </div>
        </div>

        {/* Certificates List */}
        {loading ? (
          <div className="loading-screen">
            <div className="spinner" />
            <span>جاري التحميل...</span>
          </div>
        ) : certificates.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3>لا توجد إجازات بعد</h3>
            <p>ابدأ بإنشاء أول إجازة لك</p>
            <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setShowCreate(true)}>
              إنشاء إجازة جديدة
            </button>
          </div>
        ) : (
          <div className="certs-grid">
            {certificates.map((cert) => (
              <div key={cert.id} className="cert-card card">
                <div className="cert-card-header">
                  <span className={`badge ${cert.is_open ? 'badge-success' : 'badge-danger'}`}>
                    <span className="status-dot" />
                    {cert.is_open ? 'مفتوح' : 'مغلق'}
                  </span>
                  <span className="cert-date">
                    {new Date(cert.created_at).toLocaleDateString('ar-SA')}
                  </span>
                </div>

                <h3 className="cert-title">{cert.title}</h3>
                {cert.description && <p className="cert-desc">{cert.description}</p>}

                <div className="cert-meta">
                  <span>
                    <svg viewBox="0 0 24 24" fill="none" width="14" height="14" stroke="currentColor" strokeWidth="2">
                      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    {cert.form_fields?.length || 0} حقل
                  </span>
                </div>

                <div className="cert-actions">
                  <Link href={`/admin/certificates/${cert.id}/edit`} className="btn btn-secondary btn-sm" id={`edit-cert-${cert.id}`}>
                    <svg viewBox="0 0 24 24" fill="none" width="14" height="14" stroke="currentColor" strokeWidth="2">
                      <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    تعديل
                  </Link>
                  <Link href={`/admin/certificates/${cert.id}`} className="btn btn-secondary btn-sm" id={`view-cert-${cert.id}`}>
                    <svg viewBox="0 0 24 24" fill="none" width="14" height="14" stroke="currentColor" strokeWidth="2">
                      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    عرض
                  </Link>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(cert.id, cert.title)}
                    id={`delete-cert-${cert.id}`}
                  >
                    <svg viewBox="0 0 24 24" fill="none" width="14" height="14" stroke="currentColor" strokeWidth="2">
                      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2>إجازة جديدة</h2>
              <button className="btn btn-secondary btn-icon" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label" htmlFor="new-title">اسم الإجازة *</label>
                <input
                  id="new-title"
                  className="form-input"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="مثال: إجازة دورة تعليم القرآن الكريم"
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="new-desc">الوصف (اختياري)</label>
                <textarea
                  id="new-desc"
                  className="form-textarea"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="وصف مختصر عن هذه الإجازة..."
                  rows={3}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '1rem 0' }}>
                <input
                  type="checkbox"
                  id="enable-auto-close"
                  checked={enableAutoClose}
                  onChange={(e) => setEnableAutoClose(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="enable-auto-close" style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600 }}>
                  تفعيل الإغلاق التلقائي للنموذج بعد مدة محددة
                </label>
              </div>

              {enableAutoClose && (
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label className="form-label" htmlFor="duration-hours" style={{ fontSize: '0.8rem' }}>عدد الساعات</label>
                    <input
                      type="number"
                      id="duration-hours"
                      className="form-input"
                      min="0"
                      max="720"
                      value={durationHours}
                      onChange={(e) => setDurationHours(e.target.value)}
                      required
                      style={{ padding: '0.45rem 0.75rem', fontSize: '0.9rem' }}
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label className="form-label" htmlFor="duration-minutes" style={{ fontSize: '0.8rem' }}>عدد الدقائق</label>
                    <input
                      type="number"
                      id="duration-minutes"
                      className="form-input"
                      min="0"
                      max="59"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(e.target.value)}
                      required
                      style={{ padding: '0.45rem 0.75rem', fontSize: '0.9rem' }}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2" style={{ justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowCreate(false); setEnableAutoClose(false); }}>إلغاء</button>
                <button type="submit" className="btn btn-primary" disabled={creating} id="confirm-create-btn">
                  {creating ? 'جاري الإنشاء...' : 'إنشاء والانتقال للتعديل'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`} role="status">
          {toast.msg}
        </div>
      )}

      <style jsx>{`
        .admin-layout { min-height: 100vh; }

        .dash-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }

        .dash-header h1 { margin-bottom: 0.25rem; }
        .dash-header p { color: var(--text-muted); font-size: 0.95rem; }

        .stats-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-bottom: 2rem;
        }

        @media (max-width: 600px) {
          .stats-row { grid-template-columns: 1fr; }
        }

        .certs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.25rem;
        }

        .cert-card { display: flex; flex-direction: column; gap: 0.75rem; }

        .cert-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .cert-date { color: var(--text-muted); font-size: 0.8rem; }

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
          display: inline-block;
        }

        .cert-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .cert-desc {
          font-size: 0.87rem;
          color: var(--text-muted);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .cert-meta {
          display: flex;
          gap: 1rem;
          color: var(--text-muted);
          font-size: 0.82rem;
        }

        .cert-meta span {
          display: flex;
          align-items: center;
          gap: 0.3rem;
        }

        .cert-actions {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-top: auto;
          padding-top: 0.5rem;
          border-top: 1px solid var(--border);
        }
      `}</style>
    </div>
  )
}
