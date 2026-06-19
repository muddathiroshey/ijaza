'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import type { Certificate, FormField, Asset } from '@/lib/types'
import Link from 'next/link'

// ── Unique ID helper ──────────────────────────────────────────────────────────
function uid() {
  return Math.random().toString(36).slice(2, 10)
}

// ── Template Editor Component ─────────────────────────────────────────────────
function TemplateEditor({
  value,
  onChange,
  assets,
}: {
  value: string
  onChange: (html: string) => void
  assets: Asset[]
}) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [showAssets, setShowAssets] = useState(false)
  const [showVars, setShowVars] = useState(false)
  const [vars, setVars] = useState<string[]>([])

  // Extract variables from form fields
  useEffect(() => {
    const matches = value.match(/\{\{[^}]+\}\}/g) || []
    setVars([...new Set(matches)])
  }, [value])

  function execCmd(cmd: string, val?: string) {
    document.execCommand(cmd, false, val)
    editorRef.current?.focus()
    handleInput()
  }

  function handleInput() {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  function insertVariable(v: string) {
    const selection = window.getSelection()
    if (!selection || !editorRef.current) return
    
    const node = document.createTextNode(v)
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      range.deleteContents()
      range.insertNode(node)
      range.setStartAfter(node)
      range.setEndAfter(node)
      selection.removeAllRanges()
      selection.addRange(range)
    } else {
      editorRef.current.appendChild(node)
    }
    handleInput()
    setShowVars(false)
  }

  function insertImage(url: string) {
    const img = `<img src="${url}" style="max-width:160px; max-height:100px; display:inline-block; vertical-align:middle;" alt="توقيع/ختم" />`
    document.execCommand('insertHTML', false, img)
    editorRef.current?.focus()
    handleInput()
    setShowAssets(false)
  }

  function setFontSize(size: string) {
    execCmd('fontSize', size)
  }

  function setColor(color: string) {
    execCmd('foreColor', color)
  }

  function setAlignment(align: string) {
    execCmd('justify' + align)
  }

  const toolbarColors = ['#1a1a1a', '#6c47ff', '#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#ec4899']

  return (
    <div className="template-editor-wrapper">
      {/* Toolbar */}
      <div className="template-editor-toolbar">
        {/* Text formatting */}
        <button className="toolbar-btn" title="عريض" onClick={() => execCmd('bold')}><b>ع</b></button>
        <button className="toolbar-btn" title="مائل" onClick={() => execCmd('italic')}><i>م</i></button>
        <button className="toolbar-btn" title="تسطير" onClick={() => execCmd('underline')}><u>خ</u></button>
        
        <div className="toolbar-divider" />

        {/* Font size */}
        <select
          title="حجم الخط"
          onChange={(e) => setFontSize(e.target.value)}
          style={{ background: 'transparent', border: '1px solid #ddd', borderRadius: '4px', padding: '2px 6px', fontSize: '0.8rem', cursor: 'pointer' }}
        >
          <option value="">حجم الخط</option>
          {[1,2,3,4,5,6,7].map(s => (
            <option key={s} value={s}>{['صغير جداً','صغير','عادي','متوسط','كبير','كبير جداً','ضخم'][s-1]}</option>
          ))}
        </select>

        <div className="toolbar-divider" />

        {/* Alignment */}
        <button className="toolbar-btn" title="محاذاة يمين" onClick={() => setAlignment('Right')}>
          <svg viewBox="0 0 16 16" width="14" fill="currentColor"><path d="M1 2h14v1.5H1V2zm4 3h10v1.5H5V5zm-4 3h14v1.5H1V8zm4 3h10v1.5H5V11z"/></svg>
        </button>
        <button className="toolbar-btn" title="توسيط" onClick={() => setAlignment('Center')}>
          <svg viewBox="0 0 16 16" width="14" fill="currentColor"><path d="M1 2h14v1.5H1V2zm3 3h8v1.5H4V5zm-3 3h14v1.5H1V8zm3 3h8v1.5H4V11z"/></svg>
        </button>
        <button className="toolbar-btn" title="محاذاة يسار" onClick={() => setAlignment('Left')}>
          <svg viewBox="0 0 16 16" width="14" fill="currentColor"><path d="M1 2h14v1.5H1V2zm0 3h10v1.5H1V5zm0 3h14v1.5H1V8zm0 3h10v1.5H1V11z"/></svg>
        </button>

        <div className="toolbar-divider" />

        {/* Colors */}
        <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
          {toolbarColors.map(c => (
            <button
              key={c}
              title="لون النص"
              onClick={() => setColor(c)}
              style={{ width: '18px', height: '18px', borderRadius: '3px', background: c, border: '1px solid rgba(0,0,0,0.2)', cursor: 'pointer', padding: 0 }}
            />
          ))}
        </div>

        <div className="toolbar-divider" />

        {/* Insert variable */}
        <div style={{ position: 'relative' }}>
          <button
            className="toolbar-btn"
            onClick={() => { setShowVars(!showVars); setShowAssets(false) }}
            title="إدراج متغير"
            style={{ color: '#6c47ff', fontWeight: 700 }}
          >
            &#123;&#123;متغير&#125;&#125;
          </button>
          {showVars && (
            <div className="dropdown-panel">
              <div className="dropdown-header">اختر متغيراً لإدراجه</div>
              {vars.length === 0 ? (
                <div className="dropdown-empty">لا توجد متغيرات — أضف حقولاً من قسم النموذج أولاً</div>
              ) : (
                vars.map(v => (
                  <button key={v} className="dropdown-item" onClick={() => insertVariable(v)}>{v}</button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Insert asset */}
        <div style={{ position: 'relative' }}>
          <button
            className="toolbar-btn"
            onClick={() => { setShowAssets(!showAssets); setShowVars(false) }}
            title="إدراج توقيع أو ختم"
          >
            🖊 توقيع/ختم
          </button>
          {showAssets && (
            <div className="dropdown-panel" style={{ width: '280px' }}>
              <div className="dropdown-header">اختر توقيعاً أو ختماً</div>
              {assets.length === 0 ? (
                <div className="dropdown-empty">لا توجد أصول — أضفها من صفحة التواقيع والأختام</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '6px', padding: '8px' }}>
                  {assets.map(a => (
                    <button
                      key={a.id}
                      onClick={() => insertImage(a.public_url)}
                      title={a.name}
                      style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: '6px', padding: '4px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
                    >
                      <img src={a.public_url} alt={a.name} style={{ width: '60px', height: '45px', objectFit: 'contain' }} />
                      <span style={{ fontSize: '0.7rem', color: '#555', textAlign: 'center' }}>{a.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Editable area (A4 preview) */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        dangerouslySetInnerHTML={{ __html: value }}
        className="certificate-a4"
        style={{ minHeight: '297mm', outline: 'none', cursor: 'text' }}
        dir="rtl"
        id="template-editor-area"
      />

      <style jsx>{`
        .dropdown-panel {
          position: absolute;
          top: 100%;
          right: 0;
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.15);
          min-width: 200px;
          z-index: 100;
          overflow: hidden;
        }
        .dropdown-header {
          padding: 8px 12px;
          font-size: 0.8rem;
          color: #888;
          border-bottom: 1px solid #f0f0f0;
          background: #fafafa;
        }
        .dropdown-empty {
          padding: 12px;
          font-size: 0.82rem;
          color: #aaa;
          text-align: center;
        }
        .dropdown-item {
          display: block;
          width: 100%;
          padding: 8px 12px;
          text-align: right;
          background: transparent;
          border: none;
          cursor: pointer;
          font-family: 'Cairo', sans-serif;
          font-size: 0.9rem;
          color: #333;
          border-bottom: 1px solid #f5f5f5;
          transition: background 0.15s;
        }
        .dropdown-item:hover { background: #f0eeff; color: #6c47ff; }
      `}</style>
    </div>
  )
}

// ── Form Builder Component ────────────────────────────────────────────────────
function FormBuilder({
  fields,
  onChange,
}: {
  fields: FormField[]
  onChange: (fields: FormField[]) => void
}) {
  function addField() {
    const newField: FormField = {
      id: uid(),
      label: 'حقل جديد',
      type: 'text',
      placeholder: '',
      required: true,
      variable: `{{حقل_${fields.length + 1}}}`,
    }
    onChange([...fields, newField])
  }

  function updateField(id: string, updates: Partial<FormField>) {
    onChange(fields.map(f => f.id === id ? { ...f, ...updates } : f))
  }

  function removeField(id: string) {
    onChange(fields.filter(f => f.id !== id))
  }

  function moveField(idx: number, dir: 'up' | 'down') {
    const arr = [...fields]
    const target = dir === 'up' ? idx - 1 : idx + 1
    if (target < 0 || target >= arr.length) return
    ;[arr[idx], arr[target]] = [arr[target], arr[idx]]
    onChange(arr)
  }

  return (
    <div>
      {fields.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          لا توجد حقول — أضف حقلاً أولاً
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
          {fields.map((field, idx) => (
            <div key={field.id} className="field-pill">
              {/* Move buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <button
                  className="btn btn-secondary btn-icon"
                  style={{ padding: '2px 5px', fontSize: '0.7rem' }}
                  onClick={() => moveField(idx, 'up')}
                  disabled={idx === 0}
                  title="تحريك لأعلى"
                >▲</button>
                <button
                  className="btn btn-secondary btn-icon"
                  style={{ padding: '2px 5px', fontSize: '0.7rem' }}
                  onClick={() => moveField(idx, 'down')}
                  disabled={idx === fields.length - 1}
                  title="تحريك لأسفل"
                >▼</button>
              </div>

              {/* Field fields */}
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>اسم الحقل</label>
                  <input
                    className="form-input"
                    style={{ padding: '0.45rem 0.7rem', fontSize: '0.85rem' }}
                    value={field.label}
                    onChange={e => updateField(field.id, { label: e.target.value })}
                    placeholder="اسم الحقل"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>المتغير في القالب</label>
                  <input
                    className="form-input"
                    style={{ padding: '0.45rem 0.7rem', fontSize: '0.85rem', direction: 'ltr', fontFamily: 'monospace' }}
                    value={field.variable}
                    onChange={e => updateField(field.id, { variable: e.target.value })}
                    placeholder="{{اسم_المتغير}}"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>نوع الحقل</label>
                  <select
                    className="form-select"
                    style={{ padding: '0.45rem 0.7rem', fontSize: '0.85rem' }}
                    value={field.type}
                    onChange={e => updateField(field.id, { type: e.target.value as FormField['type'] })}
                  >
                    <option value="text">نص قصير</option>
                    <option value="textarea">نص طويل</option>
                    <option value="date">تاريخ</option>
                    <option value="select">قائمة منسدلة</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>نص التلميح</label>
                  <input
                    className="form-input"
                    style={{ padding: '0.45rem 0.7rem', fontSize: '0.85rem' }}
                    value={field.placeholder || ''}
                    onChange={e => updateField(field.id, { placeholder: e.target.value })}
                    placeholder="نص توضيحي (اختياري)"
                  />
                </div>
                {field.type === 'select' && (
                  <div className="form-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>الخيارات (مفصولة بفاصلة)</label>
                    <input
                      className="form-input"
                      style={{ padding: '0.45rem 0.7rem', fontSize: '0.85rem' }}
                      value={(field.options || []).join(',')}
                      onChange={e => updateField(field.id, { options: e.target.value.split(',').map(o => o.trim()) })}
                      placeholder="خيار 1, خيار 2, خيار 3"
                    />
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', gridColumn: '1 / -1' }}>
                  <input
                    type="checkbox"
                    id={`req-${field.id}`}
                    checked={field.required}
                    onChange={e => updateField(field.id, { required: e.target.checked })}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label htmlFor={`req-${field.id}`} style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>حقل إلزامي</label>
                </div>
              </div>

              {/* Delete */}
              <button
                className="btn btn-danger btn-icon"
                onClick={() => removeField(field.id)}
                title="حذف الحقل"
              >
                <svg viewBox="0 0 24 24" fill="none" width="14" height="14" stroke="currentColor" strokeWidth="2">
                  <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <button className="btn btn-secondary" onClick={addField} id="add-field-btn">
        <svg viewBox="0 0 24 24" fill="none" width="16" height="16" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
        إضافة حقل
      </button>
    </div>
  )
}

// ── Main Edit Page ────────────────────────────────────────────────────────────
export default function EditCertificatePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [cert, setCert] = useState<Certificate | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [templateHtml, setTemplateHtml] = useState('')
  const [formFields, setFormFields] = useState<FormField[]>([])
  const [activeTab, setActiveTab] = useState<'template' | 'form' | 'settings'>('template')
  const [assets, setAssets] = useState<Asset[]>([])
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [closing, setClosing] = useState(false)

  // New settings states
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [autoCloseEnabled, setAutoCloseEnabled] = useState(false)
  const [autoCloseAt, setAutoCloseAt] = useState('')

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const loadData = useCallback(async () => {
    try {
      const [certRes, assetsRes] = await Promise.all([
        fetch(`/api/certificates/${id}`),
        fetch('/api/assets'),
      ])
      const certData = await certRes.json()
      const assetsData = await assetsRes.json()
      setCert(certData)
      setTemplateHtml(certData.template_html || getDefaultTemplate(certData.title))
      setFormFields(certData.form_fields || [])
      setAssets(assetsData)

      // Initialize settings states
      setTitle(certData.title || '')
      setDescription(certData.description || '')
      if (certData.auto_close_at) {
        setAutoCloseEnabled(true)
        const localDate = new Date(certData.auto_close_at)
        const tzOffset = localDate.getTimezoneOffset() * 60000
        const localISOTime = (new Date(localDate.getTime() - tzOffset)).toISOString().slice(0, 16)
        setAutoCloseAt(localISOTime)
      } else {
        setAutoCloseEnabled(false)
        setAutoCloseAt('')
      }
    } catch {
      showToast('فشل تحميل البيانات', 'error')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadData()
  }, [loadData])

  function getDefaultTemplate(title: string) {
    return `<div style="text-align:center; padding: 20px; font-family: Cairo, sans-serif;">
  <h1 style="font-size: 2.5em; color: #4a3000; margin-bottom: 10px; font-weight: 900;">بسم الله الرحمن الرحيم</h1>
  <div style="border: 3px double #8b6900; padding: 30px; margin: 20px 0; border-radius: 8px;">
    <h2 style="font-size: 2em; color: #6c47ff; margin-bottom: 20px;">${title}</h2>
    <p style="font-size: 1.3em; color: #333; line-height: 2; margin-bottom: 20px;">
      نشهد أن الطالب/ة الكريم/ة
    </p>
    <p style="font-size: 1.8em; color: #4a3000; font-weight: 800; margin-bottom: 20px;">{{اسم_الطالب}}</p>
    <p style="font-size: 1.3em; color: #333; line-height: 2;">
      قد أتم/أتمت بنجاح وتفوق متطلبات هذه الإجازة، وقد منحناه/منحناها هذه الشهادة تقديراً لجهوده/جهودها.
    </p>
    <p style="font-size: 1.1em; color: #555; margin-top: 20px;">التاريخ: {{التاريخ}}</p>
  </div>
  <div style="margin-top: 40px; display: flex; justify-content: space-around;">
    <div style="text-align: center;">
      <div style="height: 60px;"></div>
      <p style="border-top: 1px solid #333; padding-top: 8px; color: #555;">توقيع المشرف</p>
    </div>
    <div style="text-align: center;">
      <div style="height: 60px;"></div>
      <p style="border-top: 1px solid #333; padding-top: 8px; color: #555;">الختم الرسمي</p>
    </div>
  </div>
</div>`
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/certificates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          template_html: templateHtml,
          form_fields: formFields,
          auto_close_at: autoCloseEnabled && autoCloseAt ? new Date(autoCloseAt).toISOString() : null,
        }),
      })
      if (!res.ok) throw new Error()
      const updatedData = await res.json()
      setCert(updatedData)
      showToast('تم الحفظ بنجاح ✓')
    } catch {
      showToast('فشل الحفظ', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveAsMaster() {
    setSaving(true)
    try {
      const res = await fetch(`/api/certificates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_master: true }),
      })
      if (!res.ok) throw new Error()
      setCert(prev => prev ? { ...prev, is_master: true } : prev)
      showToast('تم حفظ القالب كقالب رئيسي معتمد بنجاح ⭐')
    } catch {
      showToast('فشل تعيين القالب الرئيسي', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleClose() {
    if (!confirm('هل تريد إغلاق التقديم على هذه الإجازة؟ سيتم تصدير بيانات التقديمات كملف CSV.')) return
    setClosing(true)
    try {
      const res = await fetch(`/api/certificates/${id}/close`, { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        showToast(`تم الإغلاق وتصدير ${data.count} تقديم`)
        setCert(prev => prev ? { ...prev, is_open: false, csv_data: data.csv } : prev)
      } else {
        throw new Error()
      }
    } catch {
      showToast('فشل إغلاق التقديم', 'error')
    } finally {
      setClosing(false)
    }
  }

  async function handleReopen() {
    try {
      await fetch(`/api/certificates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_open: true }),
      })
      setCert(prev => prev ? { ...prev, is_open: true } : prev)
      showToast('تم إعادة فتح التقديم')
    } catch {
      showToast('فشل', 'error')
    }
  }

  function downloadCsv() {
    if (!cert?.csv_data) return
    const blob = new Blob(['\uFEFF' + cert.csv_data], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${cert.title}_تقديمات.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const publicLink = typeof window !== 'undefined' ? `${window.location.origin}/c/${id}` : `/c/${id}`

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <span>جاري التحميل...</span>
      </div>
    )
  }

  return (
    <div className="edit-page">
      {/* Navigation */}
      <nav className="nav">
        <div className="nav-inner">
          <div className="flex items-center gap-2">
            <Link href="/admin" className="btn btn-secondary btn-sm">
              <svg viewBox="0 0 24 24" fill="none" width="14" height="14" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              العودة
            </Link>
            <span className="nav-logo" style={{ fontSize: '1.1rem' }}>
              {cert?.title}
            </span>
          </div>

          <div className="nav-actions">
            <button
              className={`btn ${cert?.is_master ? 'btn-success' : 'btn-secondary'} btn-sm`}
              onClick={handleSaveAsMaster}
              disabled={saving}
              id="master-cert-btn"
              title="عند تعيين هذا القالب كقالب رئيسي، سيتم استخدام تصميمه وحقوله تلقائياً للإجازات الجديدة"
            >
              {cert?.is_master ? '⭐ قالب رئيسي' : '☆ تعيين كقالب رئيسي'}
            </button>
            {cert?.is_open ? (
              <button className="btn btn-danger btn-sm" onClick={handleClose} disabled={closing} id="close-cert-btn">
                {closing ? 'جاري الإغلاق...' : '🔒 إغلاق التقديم'}
              </button>
            ) : (
              <>
                <button className="btn btn-success btn-sm" onClick={handleReopen} id="reopen-cert-btn">🔓 إعادة الفتح</button>
                {cert?.csv_data && (
                  <button className="btn btn-secondary btn-sm" onClick={downloadCsv} id="download-csv-btn">
                    ⬇ تحميل CSV
                  </button>
                )}
              </>
            )}
            <Link href={`/admin/certificates/${id}`} className="btn btn-secondary btn-sm" target="_blank" id="preview-cert-btn">
              👁 معاينة
            </Link>
            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving} id="save-cert-btn">
              {saving ? 'جاري الحفظ...' : '💾 حفظ'}
            </button>
          </div>
        </div>
      </nav>

      {/* Public Link Banner */}
      {cert?.is_open && (
        <div className="link-banner">
          <div className="container">
            <div className="link-banner-inner">
              <span>
                <svg viewBox="0 0 24 24" fill="none" width="16" height="16" stroke="currentColor" strokeWidth="2">
                  <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                رابط الطالب:
              </span>
              <code className="link-code">{publicLink}</code>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => { navigator.clipboard.writeText(publicLink); showToast('تم نسخ الرابط ✓') }}
                id="copy-link-btn"
              >
                نسخ
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="container edit-container">
        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab-btn ${activeTab === 'template' ? 'active' : ''}`}
            onClick={() => setActiveTab('template')}
            id="tab-template"
          >
            ✏️ تصميم القالب
          </button>
          <button
            className={`tab-btn ${activeTab === 'form' ? 'active' : ''}`}
            onClick={() => setActiveTab('form')}
            id="tab-form"
          >
            📋 بناء النموذج ({formFields.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
            id="tab-settings"
          >
            ⚙️ إعدادات الإجازة
          </button>
        </div>

        {activeTab === 'template' && (
          <div className="tab-content page-content">
            <div className="tab-hint">
              <svg viewBox="0 0 24 24" fill="none" width="16" height="16" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
              </svg>
              اكتب نص الشهادة في المنطقة البيضاء أدناه. استخدم <strong>&#123;&#123;متغير&#125;&#125;</strong> لإضافة بيانات الطالب تلقائياً.
            </div>
            <TemplateEditor
              value={templateHtml}
              onChange={setTemplateHtml}
              assets={assets}
            />
          </div>
        )}

        {activeTab === 'form' && (
          <div className="tab-content page-content">
            <div className="tab-hint">
              <svg viewBox="0 0 24 24" fill="none" width="16" height="16" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
              </svg>
              أضف حقولاً للنموذج الذي سيملؤه الطالب. تأكد من مطابقة <strong>المتغير</strong> للـ &#123;&#123;متغير&#125;&#125; في القالب.
            </div>
            <div className="card" style={{ padding: '1.5rem' }}>
              <FormBuilder fields={formFields} onChange={setFormFields} />
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="tab-content page-content">
            <div className="tab-hint">
              <svg viewBox="0 0 24 24" fill="none" width="16" height="16" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
              </svg>
              تعديل تفاصيل الإجازة وتعيين خيارات الإغلاق التلقائي للنموذج. انقر على "حفظ" لحفظ التغييرات.
            </div>
            <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="edit-title" style={{ fontWeight: 600 }}>اسم الإجازة *</label>
                <input
                  id="edit-title"
                  className="form-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: إجازة دورة تعليم القرآن الكريم"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="edit-desc" style={{ fontWeight: 600 }}>الوصف (اختياري)</label>
                <textarea
                  id="edit-desc"
                  className="form-textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="وصف مختصر..."
                  rows={3}
                />
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0.5rem 0' }} />

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <input
                    type="checkbox"
                    id="edit-enable-auto-close"
                    checked={autoCloseEnabled}
                    onChange={(e) => setAutoCloseEnabled(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="edit-enable-auto-close" style={{ fontSize: '0.95rem', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600 }}>
                    تفعيل الإغلاق التلقائي للنموذج في تاريخ ووقت محددين
                  </label>
                </div>

                {autoCloseEnabled && (
                  <div className="form-group" style={{ maxWidth: '320px', marginRight: '1.8rem' }}>
                    <label className="form-label" htmlFor="edit-auto-close-at" style={{ fontSize: '0.82rem' }}>تاريخ ووقت الإغلاق</label>
                    <input
                      type="datetime-local"
                      id="edit-auto-close-at"
                      className="form-input"
                      value={autoCloseAt}
                      onChange={(e) => setAutoCloseAt(e.target.value)}
                      required
                    />
                    {autoCloseAt && (
                      <span style={{ display: 'block', marginTop: '0.5rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        {new Date(autoCloseAt) > new Date() ? (
                          <>
                            يغلق بعد: {' '}
                            {Math.max(0, Math.floor((new Date(autoCloseAt).getTime() - Date.now()) / (1000 * 60 * 60)))} ساعة و {' '}
                            {Math.max(0, Math.floor(((new Date(autoCloseAt).getTime() - Date.now()) / (1000 * 60)) % 60))} دقيقة
                          </>
                        ) : (
                          <span style={{ color: 'var(--danger)' }}>تنبيه: هذا الوقت المختار في الماضي، سيغلق التقديم فوراً عند الحفظ!</span>
                        )}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div className={`toast toast-${toast.type}`} role="status">{toast.msg}</div>
      )}

      <style jsx>{`
        .edit-page { min-height: 100vh; }

        .link-banner {
          background: rgba(16, 185, 129, 0.08);
          border-bottom: 1px solid rgba(16, 185, 129, 0.2);
          padding: 0.6rem 0;
        }

        .link-banner-inner {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

        .link-code {
          background: var(--bg-input);
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 0.2rem 0.6rem;
          font-size: 0.82rem;
          color: var(--primary-light);
          direction: ltr;
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .edit-container {
          padding-top: 1.5rem;
          padding-bottom: 4rem;
        }

        .tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
          border-bottom: 1px solid var(--border);
          padding-bottom: 0;
        }

        .tab-btn {
          background: transparent;
          border: none;
          border-bottom: 3px solid transparent;
          padding: 0.65rem 1.2rem;
          font-family: 'Cairo', sans-serif;
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: -1px;
        }

        .tab-btn:hover { color: var(--text-primary); }
        .tab-btn.active {
          color: var(--primary-light);
          border-bottom-color: var(--primary);
        }

        .tab-content { margin-top: 0.5rem; }

        .tab-hint {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(108, 71, 255, 0.08);
          border: 1px solid rgba(108, 71, 255, 0.2);
          border-radius: 8px;
          padding: 0.65rem 1rem;
          font-size: 0.88rem;
          color: var(--text-secondary);
          margin-bottom: 1rem;
        }
      `}</style>
    </div>
  )
}
