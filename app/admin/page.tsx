'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Certificate, Asset } from '@/lib/types'
import {
  Inbox,
  CheckCircle2,
  Users,
  Sparkles,
  Plus,
  Link2,
  Eye,
  Pencil,
  MoreVertical,
  Trash2,
  Calendar,
  Clock,
  Download,
  Stamp,
  PenTool,
  UserPlus,
} from 'lucide-react'

/* ---------------------------------- عناصر زخرفية ---------------------------------- */

function CertThumb({ tone = 'gold' }) {
  const stroke = tone === 'muted' ? '#a7a08e' : '#b8923a'
  const fill = tone === 'muted' ? '#e9e3d2' : '#e9d49a'
  return (
    <svg viewBox="0 0 220 140" className="w-full h-full">
      <rect x="4" y="4" width="212" height="132" rx="6" fill="#fffdf8" stroke={stroke} strokeWidth="2" />
      <rect x="11" y="11" width="198" height="118" rx="3" fill="none" stroke={stroke} strokeWidth="0.75" strokeDasharray="2 3" />
      {[
        [11, 11, 0],
        [209, 11, 90],
        [209, 129, 180],
        [11, 129, 270],
      ].map(([x, y, r], i) => (
        <path
          key={i}
          d="M0,10 Q0,0 10,0"
          transform={`translate(${x},${y}) rotate(${r})`}
          fill="none"
          stroke={stroke}
          strokeWidth="1.5"
        />
      ))}
      <rect x="55" y="28" width="110" height="6" rx="3" fill={stroke} opacity="0.6" />
      <rect x="40" y="44" width="140" height="3" rx="1.5" fill={stroke} opacity="0.3" />
      <rect x="60" y="53" width="100" height="3" rx="1.5" fill={stroke} opacity="0.3" />
      <rect x="50" y="62" width="120" height="3" rx="1.5" fill={stroke} opacity="0.3" />
      <circle cx="55" cy="100" r="18" fill={fill} stroke={stroke} strokeWidth="1.5" />
      <circle cx="55" cy="100" r="12" fill="none" stroke={stroke} strokeWidth="0.75" />
      <path d="M48,100 l5,5 l9,-11" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M140,108 q6,-12 12,-2 q6,10 12,-4 q5,-9 10,3"
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function Watermark() {
  return (
    <svg
      viewBox="0 0 400 400"
      className="pointer-events-none absolute -top-10 -right-10 w-80 h-80 opacity-[0.04]"
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

function StatusBadge({ isOpen, autoCloseAt }: { isOpen: boolean; autoCloseAt?: string | null }) {
  if (!isOpen) {
    return (
      <span className="badge badge-closed inline-flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#8a8378' }} />
        مغلق
      </span>
    )
  }

  if (autoCloseAt) {
    const diff = new Date(autoCloseAt).getTime() - Date.now()
    if (diff > 0) {
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
      return (
        <span className="badge badge-scheduled inline-flex items-center gap-1.5">
          <Clock size={12} strokeWidth={2.5} />
          يُغلق تلقائياً خلال {days} {days === 1 ? 'يوم' : days <= 10 ? 'أيام' : 'يوم'}
        </span>
      )
    }
  }

  return (
    <span className="badge badge-active inline-flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#4f7d4a' }} />
      يستقبل الردود
    </span>
  )
}

/* ---------------------------------- البطاقة ---------------------------------- */

function CertificateCard({
  cert,
  openMenu,
  setOpenMenu,
  onDelete,
  onToggleStatus,
  onCopyLink,
  onDownloadCsv,
}: {
  cert: Certificate & { submissions?: [{ count: number }] }
  openMenu: string | null
  setOpenMenu: (id: string | null) => void
  onDelete: (id: string, title: string) => void
  onToggleStatus: (id: string, currentStatus: boolean) => void
  onCopyLink: (id: string) => void
  onDownloadCsv: (cert: Certificate) => void
}) {
  const isMenuOpen = openMenu === cert.id
  const responseCount = cert.submissions?.[0]?.count ?? 0

  return (
    <div className="card-formal relative flex flex-col overflow-hidden">
      <div className="p-3 pb-0">
        <div className="rounded-lg overflow-hidden border" style={{ borderColor: '#e7ddc4' }}>
          <CertThumb tone={cert.is_open ? 'gold' : 'muted'} />
        </div>
      </div>

      <div className="p-4 flex flex-col gap-3 flex-1 text-right">
        <h3 className="font-amiri text-lg leading-snug font-bold" style={{ color: '#16243f' }}>
          {cert.title}
        </h3>

        <div className="flex items-center gap-4 text-xs" style={{ color: '#6b6457' }}>
          <span className="inline-flex items-center gap-1">
            <Inbox size={13} />
            {responseCount === 0 ? 'لا ردود بعد' : `${responseCount.toLocaleString('ar-EG')} ردًا`}
          </span>
          <span className="inline-flex items-center gap-1">
            <Calendar size={13} />
            {new Date(cert.created_at).toLocaleDateString('ar-SA')}
          </span>
        </div>

        <div>
          <StatusBadge isOpen={cert.is_open} autoCloseAt={cert.auto_close_at} />
        </div>

        <div className="mt-auto pt-3 flex items-center gap-1 border-t" style={{ borderColor: '#e7ddc4' }}>
          <button className="icon-action" title="نسخ الرابط" onClick={() => onCopyLink(cert.id)}>
            <Link2 size={16} />
          </button>
          <Link href={`/admin/certificates/${cert.id}`} className="icon-action" title="عرض الردود">
            <Eye size={16} />
          </Link>
          <Link href={`/admin/certificates/${cert.id}/edit`} className="icon-action" title="تعديل الإجازة">
            <Pencil size={16} />
          </Link>
          <div className="relative mr-auto">
            <button className="icon-action" title="مزيد من الخيارات" onClick={() => setOpenMenu(isMenuOpen ? null : cert.id)}>
              <MoreVertical size={16} />
            </button>
            {isMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                <div className="dropdown-menu absolute left-0 top-9 z-20 w-52 py-1.5">
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      setOpenMenu(null)
                      onToggleStatus(cert.id, cert.is_open)
                    }}
                  >
                    <Clock size={14} />
                    {cert.is_open ? 'إيقاف استقبال الردود' : 'إعادة فتح الاستقبال'}
                  </button>
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      setOpenMenu(null)
                      onDownloadCsv(cert)
                    }}
                    disabled={responseCount === 0 && !cert.csv_data}
                  >
                    <Download size={14} />
                    تنزيل الردود CSV
                  </button>
                  <div className="my-1.5 border-t" style={{ borderColor: '#e7ddc4' }} />
                  <button
                    className="dropdown-item"
                    style={{ color: '#9c3b3b' }}
                    onClick={() => {
                      setOpenMenu(null)
                      onDelete(cert.id, cert.title)
                    }}
                  >
                    <Trash2 size={14} />
                    حذف الإجازة
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------------------------------- التطبيق الرئيسي ---------------------------------- */

export default function AdminDashboard() {
  const [certificates, setCertificates] = useState<(Certificate & { submissions?: [{ count: number }] })[]>([])
  const [stamps, setStamps] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  
  // Creation States
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

  const loadDashboardData = useCallback(async () => {
    try {
      const [certsRes, assetsRes] = await Promise.all([
        fetch('/api/certificates'),
        fetch('/api/assets'),
      ])
      
      const certsData = await certsRes.json()
      const assetsData = await assetsRes.json()

      setCertificates(certsData || [])
      setStamps(assetsData || [])
    } catch {
      showToast('فشل تحميل بيانات لوحة التحكم', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  // Handle Certificate Deletion
  async function handleDelete(id: string, title: string) {
    if (!confirm(`هل أنت متأكد من حذف إجازة "${title}"؟`)) return
    try {
      const res = await fetch(`/api/certificates/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setCertificates((prev) => prev.filter((c) => c.id !== id))
      showToast('تم حذف الإجازة بنجاح')
    } catch {
      showToast('فشل حذف الإجازة', 'error')
    }
  }

  // Handle Open/Close Toggle
  async function handleToggleStatus(id: string, currentStatus: boolean) {
    try {
      const res = await fetch(`/api/certificates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_open: !currentStatus }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setCertificates((prev) =>
        prev.map((c) => (c.id === id ? { ...c, is_open: updated.is_open } : c))
      )
      showToast(updated.is_open ? 'تم فتح استقبال الردود' : 'تم إيقاف استقبال الردود')
    } catch {
      showToast('حدث خطأ أثناء تغيير الحالة', 'error')
    }
  }

  // Handle Clipboard Copy
  function handleCopyLink(id: string) {
    const publicLink = `${window.location.origin}/c/${id}`
    navigator.clipboard.writeText(publicLink)
    showToast('تم نسخ رابط التقديم ✓')
  }

  // Handle Export CSV
  async function handleDownloadCsv(cert: Certificate) {
    // If the certificate already has saved CSV, use it
    if (cert.csv_data) {
      downloadCsvFile(cert.title, cert.csv_data)
      return
    }

    // Otherwise fetch the submissions and generate CSV dynamically
    try {
      const res = await fetch(`/api/certificates/${cert.id}/submissions`)
      const submissions = await res.json()
      if (submissions.length === 0) {
        showToast('لا توجد ردود لتصديرها', 'error')
        return
      }

      // Generate CSV string
      const headers = ['التاريخ', ...(cert.form_fields?.map((f) => f.label) || [])]
      const rows = submissions.map((sub: any) => {
        const date = new Date(sub.created_at).toLocaleDateString('ar-SA')
        const fieldValues = cert.form_fields?.map((f) => sub.data?.[f.variable] || '') || []
        return [date, ...fieldValues]
      })

      const csvContent = [headers, ...rows]
        .map((row) => row.map((val: any) => `"${String(val).replace(/"/g, '""')}"`).join(','))
        .join('\n')

      downloadCsvFile(cert.title, csvContent)
      showToast('تم تصدير الردود بنجاح')
    } catch {
      showToast('فشل تصدير الردود', 'error')
    }
  }

  function downloadCsvFile(title: string, csvData: string) {
    const blob = new Blob(['\uFEFF' + csvData], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title}_ردود.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Handle Create Certificate
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
      if (!res.ok) throw new Error()
      
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

  // Stats Calculations
  const totalCerts = certificates.length
  const activeCerts = certificates.filter((c) => c.is_open).length
  const totalSubmissions = certificates.reduce(
    (sum, cert) => sum + (cert.submissions?.[0]?.count ?? 0),
    0
  )
  const masterTemplate = certificates.find((c) => c.is_master === true)

  const STATS_ITEMS = [
    { label: 'إجمالي الإجازات', value: String(totalCerts), icon: Sparkles },
    { label: 'الردود المستلمة', value: String(totalSubmissions), icon: Inbox },
    { label: 'النماذج النشطة', value: String(activeCerts), icon: CheckCircle2 },
    { label: 'أعضاء الفريق', value: '٤', icon: Users },
  ]

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <span>جاري التحميل...</span>
      </div>
    )
  }

  return (
    <div className="px-5 lg:px-8 py-7">
      <Watermark />
      
      <div className="relative grid grid-cols-1 xl:grid-cols-3 gap-7">
        {/* العمود الرئيسي */}
        <div className="xl:col-span-2 flex flex-col gap-7 min-w-0">
          
          {/* الترحيب */}
          <div className="text-right">
            <p className="text-xs font-semibold tracking-wide" style={{ color: 'var(--gold-main)' }}>
              {new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="font-amiri text-3xl font-bold mt-1" style={{ color: 'var(--navy-dark)' }}>
              مرحباً بعودتكم، أكاديمية النور
            </h1>
            <p className="text-sm mt-1.5" style={{ color: 'var(--text-muted)' }}>
              إليكم ملخص أداء إجازاتكم ونماذجكم لهذا الأسبوع
            </p>
            <div className="divider-rule mt-4">
              <div className="line" />
              <div className="diamond" />
              <div className="line" />
            </div>
          </div>

          {/* الإحصائيات */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {STATS_ITEMS.map((s, i) => (
              <div key={i} className="stat-card">
                <div className="stat-icon">
                  <s.icon size={20} />
                </div>
                <div className="text-right">
                  <p className="font-amiri text-2xl font-bold" style={{ color: 'var(--navy-dark)' }}>
                    {s.value}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {s.label}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* القالب الرئيسي */}
          <div
            className="rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-5 text-right"
            style={{ background: 'linear-gradient(135deg, var(--navy-dark), var(--navy-light))', boxShadow: '0 14px 32px -16px rgba(22,36,63,0.45)' }}
          >
            <div className="w-28 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2" style={{ borderColor: 'var(--gold-light)' }}>
              <CertThumb tone="gold" />
            </div>
            <div className="flex-1 text-center sm:text-right">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full mb-2" style={{ background: 'rgba(201,162,39,0.18)', color: '#e9c969' }}>
                <Sparkles size={12} />
                القالب الرئيسي
              </div>
              {masterTemplate ? (
                <>
                  <h3 className="font-amiri text-lg font-bold" style={{ color: '#f7f2e7' }}>
                    {masterTemplate.title}
                  </h3>
                  <p className="text-sm mt-1" style={{ color: '#aab2c8' }}>
                    تم اعتماده كقالب رئيسي للمؤسسة. أي إجازة جديدة ستعتمد تصميمه تلقائياً.
                  </p>
                </>
              ) : (
                <>
                  <h3 className="font-amiri text-lg font-bold" style={{ color: '#f7f2e7' }}>
                    لا يوجد قالب رئيسي معتمد بعد
                  </h3>
                  <p className="text-sm mt-1" style={{ color: '#aab2c8' }}>
                    يمكنك تعيين أي قالب كقالب رئيسي من صفحة تحريره لتوحيد الهوية البصرية.
                  </p>
                </>
              )}
            </div>
            {masterTemplate ? (
              <Link
                href={`/admin/certificates/${masterTemplate.id}/edit`}
                className="btn btn-outline-gold flex-shrink-0 px-5 py-2.5 rounded-full text-sm"
                style={{ borderColor: 'var(--gold-light)', color: '#e9c969' }}
              >
                تعديل القالب الرئيسي
              </Link>
            ) : (
              <button
                className="btn btn-outline-gold flex-shrink-0 px-5 py-2.5 rounded-full text-sm"
                style={{ borderColor: 'var(--gold-light)', color: '#e9c969' }}
                onClick={() => setShowCreate(true)}
              >
                إنشاء أول إجازة
              </button>
            )}
          </div>

          {/* قائمة الإجازات */}
          <div>
            <div className="panel-title flex items-center justify-between mb-4">
              <h2 className="font-amiri text-xl font-bold" style={{ color: 'var(--navy-dark)' }}>
                إجازاتكم
              </h2>
              <button
                className="btn btn-gold flex items-center gap-1.5 text-xs px-3.5 py-1.5"
                onClick={() => setShowCreate(true)}
              >
                <Plus size={14} strokeWidth={2.5} />
                <span>إنشاء إجازة جديدة</span>
              </button>
            </div>

            {certificates.length === 0 ? (
              <div className="card-formal p-10 text-center flex flex-col items-center justify-center">
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📜</div>
                <h3 className="font-amiri text-lg font-bold mb-1" style={{ color: 'var(--navy-dark)' }}>
                  لا توجد إجازات بعد
                </h3>
                <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                  ابدأ بإنشاء أول إجازة وتخصيص قالبها
                </p>
                <button className="btn btn-gold btn-sm" onClick={() => setShowCreate(true)}>
                  إنشاء إجازة جديدة
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {certificates.map((cert) => (
                  <CertificateCard
                    key={cert.id}
                    cert={cert}
                    openMenu={openMenu}
                    setOpenMenu={setOpenMenu}
                    onDelete={handleDelete}
                    onToggleStatus={handleToggleStatus}
                    onCopyLink={handleCopyLink}
                    onDownloadCsv={handleDownloadCsv}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* العمود الجانبي */}
        <div className="flex flex-col gap-6 min-w-0">
          
          {/* الأختام والتوقيعات */}
          <div className="card-formal p-5 text-right">
            <div className="panel-title flex justify-between mb-4">
              <h3 className="font-amiri text-lg font-bold" style={{ color: 'var(--navy-dark)' }}>
                الأختام والتوقيعات المحفوظة
              </h3>
              <Link href="/admin/assets" className="text-xs font-semibold" style={{ color: 'var(--gold-main)' }}>
                إدارة الكل
              </Link>
            </div>
            
            {stamps.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gold rounded-xl">
                <Stamp size={24} style={{ color: 'var(--gold-main)', opacity: 0.5 }} className="mb-2" />
                <p className="text-[11px] text-center" style={{ color: 'var(--text-muted)' }}>
                  لا توجد أختام محفوظة بعد.
                </p>
                <Link href="/admin/assets" className="text-xs font-semibold mt-2" style={{ color: 'var(--gold-main)' }}>
                  اضغط للرفع
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {stamps.slice(0, 5).map((s, i) => (
                  <div key={s.id || i} className="flex flex-col items-center gap-1.5">
                    <div
                      className="w-full aspect-square rounded-xl flex items-center justify-center overflow-hidden"
                      style={{ background: '#f7f2e7', border: '1px solid #e7ddc4' }}
                    >
                      <img src={s.public_url} alt={s.name} className="w-[80%] h-[80%] object-contain" />
                    </div>
                    <p className="text-[9px] text-center leading-tight truncate w-full" style={{ color: 'var(--text-muted)' }} title={s.name}>
                      {s.name}
                    </p>
                  </div>
                ))}
                {stamps.length < 6 && (
                  <Link
                    href="/admin/assets"
                    className="w-full aspect-square rounded-xl flex items-center justify-center"
                    style={{ border: '1.5px dashed var(--gold-focus)', color: 'var(--gold-main)' }}
                  >
                    <Plus size={18} />
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* أعضاء الفريق */}
          <div className="card-formal p-5 text-right">
            <div className="panel-title flex justify-between mb-4">
              <h3 className="font-amiri text-lg font-bold" style={{ color: 'var(--navy-dark)' }}>
                أعضاء الفريق
              </h3>
              <button className="icon-action" style={{ color: 'var(--gold-main)' }} title="إضافة عضو">
                <UserPlus size={16} />
              </button>
            </div>
            <div className="flex flex-col gap-3.5">
              {[
                { name: 'محمد العتيبي', role: 'مشرف عام' },
                { name: 'ليان السبيعي', role: 'محررة قوالب' },
                { name: 'خالد منصور', role: 'مراجع ردود' },
                { name: 'هدى الشمري', role: 'عضو' },
              ].map((m, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="avatar-ring text-[10px]">{m.name.slice(0, 1)}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-main)' }}>
                      {m.name}
                    </p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: '#f3e6c0', color: '#9c7a1f' }}>
                    {m.role}
                  </span>
                </div>
              ))}
            </div>
            <button className="btn btn-outline-gold w-full mt-4 py-2 text-xs">إدارة الأعضاء</button>
          </div>

        </div>
      </div>

      {/* modal create certificate */}
      {showCreate && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2>إجازة جديدة</h2>
              <button className="icon-action" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group text-right">
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
              
              <div className="form-group text-right">
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

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', margin: '1rem 0' }}>
                <input
                  type="checkbox"
                  id="enable-auto-close"
                  checked={enableAutoClose}
                  onChange={(e) => setEnableAutoClose(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="enable-auto-close" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}>
                  تفعيل الإغلاق التلقائي للنموذج بعد مدة محددة
                </label>
              </div>

              {enableAutoClose && (
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div className="form-group text-right" style={{ flex: 1, marginBottom: 0 }}>
                    <label className="form-label" htmlFor="duration-hours" style={{ fontSize: '0.78rem' }}>عدد الساعات</label>
                    <input
                      type="number"
                      id="duration-hours"
                      className="form-input"
                      min="0"
                      max="720"
                      value={durationHours}
                      onChange={(e) => setDurationHours(e.target.value)}
                      required
                      style={{ padding: '0.5rem 0.8rem', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div className="form-group text-right" style={{ flex: 1, marginBottom: 0 }}>
                    <label className="form-label" htmlFor="duration-minutes" style={{ fontSize: '0.78rem' }}>عدد الدقائق</label>
                    <input
                      type="number"
                      id="duration-minutes"
                      className="form-input"
                      min="0"
                      max="59"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(e.target.value)}
                      required
                      style={{ padding: '0.5rem 0.8rem', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2 justify-end mt-5">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowCreate(false); setEnableAutoClose(false); }}>
                  إلغاء
                </button>
                <button type="submit" className="btn btn-gold" disabled={creating}>
                  {creating ? 'جاري الإنشاء...' : 'إنشاء وتصميم القالب'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`toast toast-${toast.type}`} role="status">
          {toast.msg}
        </div>
      )}
    </div>
  )
}
