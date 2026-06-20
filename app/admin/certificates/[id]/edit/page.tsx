'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Certificate, FormField, Asset } from '@/lib/types'
import {
  ArrowRight,
  Type,
  Image as ImageIcon,
  Stamp as StampIcon,
  PenTool,
  GripVertical,
  Eye,
  EyeOff,
  Trash2,
  AlignRight,
  AlignCenter,
  AlignLeft,
  Save,
  Sparkles,
  Plus,
  Info,
  Palette,
  ChevronDown,
  ChevronUp,
  Calendar,
  Clock,
} from 'lucide-react'

import DateTimePickerModal, { MONTH_NAMES, getHour12 } from './DateTimePickerModal'


/* ---------------------------------- عناصر زخرفية ---------------------------------- */

function CornerOrnament({ corner }: { corner: 'tl' | 'tr' | 'br' | 'bl' }) {
  const rotations = { tl: 0, tr: 90, br: 180, bl: 270 }
  const pos = {
    tl: { top: 10, left: 10 },
    tr: { top: 10, right: 10 },
    br: { bottom: 10, right: 10 },
    bl: { bottom: 10, left: 10 },
  }[corner]
  return (
    <svg
      viewBox="0 0 30 30"
      className="absolute w-7 h-7 pointer-events-none"
      style={{ ...pos, transform: `rotate(${rotations[corner]}deg)` }}
    >
      <path d="M2,28 L2,10 Q2,2 10,2 L28,2" fill="none" stroke="#c9a227" strokeWidth="1.5" />
      <circle cx="2" cy="28" r="1.6" fill="#c9a227" />
    </svg>
  )
}

/* ---------------------------------- القوالب الافتراضية ---------------------------------- */

const INITIAL_ELEMENTS = [
  { id: 'academy', type: 'static', text: 'أكاديمية النور للعلوم الشرعية', x: 50, y: 10, font: 'Tajawal', size: 14, weight: 500, color: '#6b6457', align: 'center' },
  { id: 'title', type: 'static', text: 'إجازة حفظ القرآن الكريم', x: 50, y: 22, font: 'Amiri', size: 32, weight: 700, color: '#16243f', align: 'center' },
  { id: 'intro', type: 'static', text: 'تشهد الأكاديمية بأنّ الطالب/ـة', x: 50, y: 34, font: 'Tajawal', size: 14, weight: 400, color: '#6b6457', align: 'center' },
  { id: 'student_name', type: 'field', key: 'اسم الطالب', text: 'سارة أحمد القحطاني', x: 50, y: 45, font: 'Amiri', size: 24, weight: 700, color: '#b8923a', align: 'center' },
  { id: 'body', type: 'static', text: 'قد أتمّ/ـت بنجاح حفظ جزء عمّ كاملاً بإتقان وضبط', x: 50, y: 55, font: 'Tajawal', size: 14, weight: 400, color: '#1f2733', align: 'center' },
  { id: 'date', type: 'field', key: 'تاريخ الإصدار', text: '١٨ يونيو ٢٠٢٦', x: 50, y: 65, font: 'Tajawal', size: 13, weight: 600, color: '#1f2733', align: 'center' },
  { id: 'cert_no', type: 'field', key: 'رقم الإجازة', text: 'IJ-2026-0458', x: 16, y: 8, font: 'Tajawal', size: 10, weight: 400, color: '#a39c8c', align: 'center' },
  { id: 'signature', type: 'image', label: 'توقيع المدير', x: 26, y: 84, w: 14, h: 12, url: '' },
  { id: 'stamp', type: 'image', label: 'الختم الرسمي', x: 74, y: 84, w: 13, h: 18, url: '' },
]

const BG_SWATCHES = ['#fffdf8', '#f7f2e7', '#f3ecd8', '#f0f0ec']
const COLOR_SWATCHES = ['#16243f', '#b8923a', '#1f2733', '#7a2e2e', '#4f7d4a', '#8a8378']

/* ---------------------------------- التطبيق الرئيسي ---------------------------------- */

export default function EditCertificatePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [cert, setCert] = useState<Certificate | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [assets, setAssets] = useState<Asset[]>([])

  // Layout State
  const [templateName, setTemplateName] = useState('')
  const [description, setDescription] = useState('')
  const [elements, setElements] = useState<any[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [bg, setBg] = useState(BG_SWATCHES[0])
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape')

  // Auto Close Settings
  const [autoCloseEnabled, setAutoCloseEnabled] = useState(false)
  const [autoCloseAt, setAutoCloseAt] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)

  // Form Editor Settings
  const [viewMode, setViewMode] = useState<'builder' | 'form_editor'>('builder')
  const [formFields, setFormFields] = useState<FormField[]>([])
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null)

  // Countdown Timer state for admin view
  const [timeLeft, setTimeLeft] = useState<number | null>(null)

  useEffect(() => {
    if (!autoCloseEnabled || !autoCloseAt) {
      setTimeLeft(null)
      return
    }

    const calculateTimeLeft = () => {
      try {
        const [datePart, timePart] = autoCloseAt.split('T')
        const [y, m, d] = datePart.split('-').map(Number)
        const [h, min] = timePart.split(':').map(Number)
        const utcDate = new Date(Date.UTC(y, m - 1, d, h, min))
        const targetTimeMs = utcDate.getTime() - 3 * 3600000 // Convert Mecca (UTC+3) to UTC ms
        const diffSec = Math.floor((targetTimeMs - Date.now()) / 1000)
        setTimeLeft(diffSec > 0 ? diffSec : 0)
      } catch {
        setTimeLeft(null)
      }
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)
    return () => clearInterval(timer)
  }, [autoCloseEnabled, autoCloseAt])


  // Synchronize canvas field elements with formFields array
  useEffect(() => {
    const canvasFields = elements.filter((el) => el.type === 'field')

    setFormFields((prev) => {
      // 1. Remove deleted canvas fields (canvas fields are fields whose id does NOT start with 'extra-')
      let updated = prev.filter((field) => {
        const isCanvasField = !field.id.startsWith('extra-')
        if (isCanvasField) {
          const canvasEl = elements.find((el) => el.id === field.id)
          return canvasEl && canvasEl.type === 'field'
        }
        return true
      })

      // 2. Update renamed canvas fields (keeping their relative position in the array)
      updated = updated.map((field) => {
        const canvasEl = canvasFields.find((el) => el.id === field.id)
        if (canvasEl) {
          if (field.variable !== canvasEl.key) {
            return {
              ...field,
              label: field.label === field.variable ? canvasEl.key : field.label,
              variable: canvasEl.key,
            }
          }
        }
        return field
      })

      // 3. Append any NEW canvas fields that are not in the list yet
      canvasFields.forEach((el) => {
        const exists = updated.some((f) => f.id === el.id)
        if (!exists) {
          updated.push({
            id: el.id,
            label: el.key,
            type: el.key.includes('تاريخ') ? 'date' : 'text',
            required: true,
            variable: el.key,
          })
        }
      })

      return updated
    })
  }, [elements])

  // Form Editor Helper Functions
  function moveField(index: number, direction: 'up' | 'down') {
    setFormFields((prev) => {
      const copy = [...prev]
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex >= 0 && targetIndex < copy.length) {
        const temp = copy[index]
        copy[index] = copy[targetIndex]
        copy[targetIndex] = temp
      }
      return copy
    })
  }

  // Define dynamic key updates when label changes for extra fields
  function updateAdditionalFieldLabel(fieldId: string, labelVal: string) {
    setFormFields((prev) =>
      prev.map((f) => {
        if (f.id === fieldId) {
          const patched: Partial<FormField> = { label: labelVal }
          // If the variable key was not changed manually, auto-align it
          if (f.variable.startsWith('extra_')) {
            patched.variable = labelVal.trim() || f.variable
          }
          return { ...f, ...patched }
        }
        return f
      })
    )
  }

  function updateFormField(fieldId: string, patch: Partial<FormField>) {
    setFormFields((prev) =>
      prev.map((f) => (f.id === fieldId ? { ...f, ...patch } : f))
    )
  }

  function addAdditionalField() {
    const extraId = `extra-${Date.now()}`
    const newField: FormField = {
      id: extraId,
      label: 'حقل إضافي جديد',
      type: 'text',
      required: false,
      variable: `extra_${Date.now()}`,
      placeholder: '',
    }
    setFormFields((prev) => [...prev, newField])
    setActiveFieldId(extraId)
  }

  function deleteAdditionalField(fieldId: string) {
    setFormFields((prev) => prev.filter((f) => f.id !== fieldId))
    if (activeFieldId === fieldId) setActiveFieldId(null)
  }

  function updateOption(fieldId: string, optionIdx: number, val: string) {
    setFormFields((prev) =>
      prev.map((f) => {
        if (f.id === fieldId) {
          const opts = [...(f.options || ['الخيار الأول'])]
          opts[optionIdx] = val
          return { ...f, options: opts }
        }
        return f
      })
    )
  }

  function addOption(fieldId: string) {
    setFormFields((prev) =>
      prev.map((f) => {
        if (f.id === fieldId) {
          const opts = [...(f.options || ['الخيار الأول'])]
          opts.push(`الخيار ${opts.length + 1}`)
          return { ...f, options: opts }
        }
        return f
      })
    )
  }

  function removeOption(fieldId: string, optionIdx: number) {
    setFormFields((prev) =>
      prev.map((f) => {
        if (f.id === fieldId) {
          const opts = [...(f.options || ['الخيار الأول'])].filter((_, idx) => idx !== optionIdx)
          return { ...f, options: opts.length > 0 ? opts : ['الخيار الأول'] }
        }
        return f
      })
    )
  }


  // Helper to convert UTC ISO string to Mecca Time 'YYYY-MM-DDTHH:MM' string
  function utcToMeccaString(utcString: string): string {
    if (!utcString) return ''
    const date = new Date(utcString)
    const meccaDate = new Date(date.getTime() + 3 * 3600000)
    const y = meccaDate.getUTCFullYear()
    const m = String(meccaDate.getUTCMonth() + 1).padStart(2, '0')
    const d = String(meccaDate.getUTCDate()).padStart(2, '0')
    const h = String(meccaDate.getUTCHours()).padStart(2, '0')
    const min = String(meccaDate.getUTCMinutes()).padStart(2, '0')
    return `${y}-${m}-${d}T${h}:${min}`
  }

  // Helper to convert Mecca Time 'YYYY-MM-DDTHH:MM' string back to UTC ISO string
  function meccaStringToUtc(meccaString: string): string {
    if (!meccaString) return ''
    const [datePart, timePart] = meccaString.split('T')
    const [y, m, d] = datePart.split('-').map(Number)
    const [h, min] = timePart.split(':').map(Number)
    const utcDate = new Date(Date.UTC(y, m - 1, d, h, min))
    const finalDate = new Date(utcDate.getTime() - 3 * 3600000)
    return finalDate.toISOString()
  }

  // Helper to format Mecca string into friendly Arabic text
  function formatArabicDateTime(meccaString: string): string {
    if (!meccaString) return 'اختر التاريخ والوقت...'
    try {
      const [datePart, timePart] = meccaString.split('T')
      const [y, m, d] = datePart.split('-').map(Number)
      const [h24, min] = timePart.split(':').map(Number)
      
      const monthName = MONTH_NAMES[m - 1]
      const { hour12, period } = getHour12(h24)
      const periodArabic = period === 'AM' ? 'ص' : 'م'
      const minStr = String(min).padStart(2, '0')
      const hourStr = String(hour12).padStart(2, '0')
      
      return `${d} ${monthName} ${y}، الساعة ${hourStr}:${minStr} ${periodArabic}`
    } catch {
      return meccaString
    }
  }


  // Drag Refs
  const canvasRef = useRef<HTMLDivElement>(null)
  const dragState = useRef<{ id: string; startX: number; startY: number; originX: number; originY: number } | null>(null)
  const idCounter = useRef(1)

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Load Certificate and Assets
  const loadData = useCallback(async () => {
    try {
      const [certRes, assetsRes] = await Promise.all([
        fetch(`/api/certificates/${id}`),
        fetch('/api/assets'),
      ])

      if (!certRes.ok) throw new Error()

      const certData = await certRes.json()
      const assetsData = await assetsRes.json()

      setCert(certData)
      setTemplateName(certData.title || '')
      setDescription(certData.description || '')
      setAssets(assetsData || [])

      // Parse JSON configuration from template_html if exists, otherwise load default
      if (certData.template_html && certData.template_html.startsWith('{')) {
        try {
          const config = JSON.parse(certData.template_html)
          setElements(config.elements || INITIAL_ELEMENTS)
          setBg(config.bg || BG_SWATCHES[0])
          setOrientation(config.orientation || 'landscape')
        } catch {
          setElements(INITIAL_ELEMENTS)
        }
      } else {
        setElements(INITIAL_ELEMENTS)
      }

      // Initialize Auto Close Settings
      if (certData.auto_close_at) {
        setAutoCloseEnabled(true)
        setAutoCloseAt(utcToMeccaString(certData.auto_close_at))
      } else {
        setAutoCloseEnabled(false)
        setAutoCloseAt('')
      }

      // Initialize Form Fields
      setFormFields(certData.form_fields || [])
    } catch {
      showToast('فشل تحميل بيانات الإجازة', 'error')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadData()
  }, [loadData])

  const selected = elements.find((e) => e.id === selectedId) || null

  // Element Actions
  function updateElement(elId: string, patch: any) {
    setElements((prev) => prev.map((it) => (it.id === elId ? { ...it, ...patch } : it)))
  }

  function deleteElement(elId: string) {
    setElements((prev) => prev.filter((it) => it.id !== elId))
    if (selectedId === elId) setSelectedId(null)
  }

  function addElement(type: 'static' | 'field' | 'image') {
    const newId = `new-${idCounter.current++}`
    let el: any = { id: newId, type, x: 50, y: 50, font: 'Tajawal', size: 14, weight: 400, color: '#1f2733', align: 'center' }
    
    if (type === 'static') {
      el.text = 'نص جديد'
    } else if (type === 'field') {
      el.key = 'حقل متغيّر'
      el.text = 'نص تجريبي'
    } else if (type === 'image') {
      el.label = 'ختم/توقيع'
      el.w = 14
      el.h = 14
      el.url = ''
    }

    setElements((prev) => [...prev, el])
    setSelectedId(newId)
  }

  // Drag and Drop Handlers
  function handleElementMouseDown(e: React.MouseEvent, el: any) {
    e.stopPropagation()
    setSelectedId(el.id)
    dragState.current = {
      id: el.id,
      startX: e.clientX,
      startY: e.clientY,
      originX: el.x,
      originY: el.y,
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  function handleMouseMove(e: MouseEvent) {
    if (!dragState.current || !canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const dxPct = ((e.clientX - dragState.current.startX) / rect.width) * 100
    const dyPct = ((e.clientY - dragState.current.startY) / rect.height) * 100
    const newX = Math.min(96, Math.max(4, dragState.current.originX + dxPct))
    const newY = Math.min(96, Math.max(4, dragState.current.originY + dyPct))
    
    setElements((prev) =>
      prev.map((it) => (it.id === dragState.current!.id ? { ...it, x: newX, y: newY } : it))
    )
  }

  function handleMouseUp() {
    dragState.current = null
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseup', handleMouseUp)
  }

  // Save Config to Database
  async function handleSave() {
    setSaving(true)
    try {
      // 1. Compile visual layout state into JSON configuration string
      const configJson = JSON.stringify({
        elements,
        bg,
        orientation,
      })

      // 2. Patch database record
      const res = await fetch(`/api/certificates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: templateName,
          description,
          template_html: configJson,
          form_fields: formFields,
          auto_close_at: autoCloseEnabled && autoCloseAt ? meccaStringToUtc(autoCloseAt) : null,
        }),
      })

      if (!res.ok) throw new Error()
      const updated = await res.json()
      setCert(updated)
      showToast('تم حفظ التغييرات بنجاح ✓')
    } catch {
      showToast('فشل حفظ التغييرات', 'error')
    } finally {
      setSaving(false)
    }
  }

  // Set Master Template
  async function handleSetMaster() {
    setSaving(true)
    try {
      const res = await fetch(`/api/certificates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_master: true }),
      })
      if (!res.ok) throw new Error()
      setCert((prev) => (prev ? { ...prev, is_master: true } : prev))
      showToast('تم تعيين القالب كقالب رئيسي معتمد للمؤسسة ⭐')
    } catch {
      showToast('فشل تعيين كقالب رئيسي', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <span>جاري تحميل المصمم...</span>
      </div>
    )
  }

  const publicLink = typeof window !== 'undefined' ? `${window.location.origin}/c/${id}` : `/c/${id}`

  return (
    <div dir="rtl" className="min-h-screen flex flex-col" style={{ background: 'var(--bg-cream)' }}>
      {/* ===== الشريط العلوي (Topbar) ===== */}
      <header className="topbar flex items-center gap-4 px-5 lg:px-7 py-3 shadow-sm z-10">
        <Link href="/admin" className="icon-btn flex items-center justify-center" title="رجوع إلى الإجازات">
          <ArrowRight size={18} />
        </Link>
        <div className="flex flex-col flex-1 min-w-0 text-right">
          <p className="text-[11px] font-semibold" style={{ color: 'var(--gold-main)' }}>
            محرر الإجازات / مصمم القوالب
          </p>
          <input
            className="name-input w-full"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'Amiri, serif' }}
          />
        </div>

        {/* أزرار التبديل بين الإجازة والاستمارة */}
        <div className="flex p-0.5 border rounded-lg bg-[#f7f2e7] gap-0.5" style={{ borderColor: 'var(--border-gold)' }}>
          <button
            type="button"
            className={`px-4 py-1.5 text-xs font-bold transition-all rounded-md ${
              viewMode === 'builder'
                ? 'bg-white text-[#16243f] shadow-sm border border-[#e7ddc4]'
                : 'text-[#6b6457] hover:text-[#16243f]'
            }`}
            onClick={() => setViewMode('builder')}
          >
            الإجازة
          </button>
          <button
            type="button"
            className={`px-4 py-1.5 text-xs font-bold transition-all rounded-md ${
              viewMode === 'form_editor'
                ? 'bg-white text-[#16243f] shadow-sm border border-[#e7ddc4]'
                : 'text-[#6b6457] hover:text-[#16243f]'
            }`}
            onClick={() => setViewMode('form_editor')}
          >
            الاستمارة
          </button>
        </div>
        
        {cert?.is_master && (
          <div className="hidden md:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full" style={{ background: '#eef4ea', color: '#4f7d4a', fontWeight: 600 }}>
            <Sparkles size={13} />
            القالب الرئيسي المعتمد
          </div>
        )}

        <button className="btn btn-secondary px-4 py-2 text-sm hidden sm:inline-flex items-center gap-1.5" onClick={() => window.open(publicLink, '_blank')}>
          <Eye size={15} />
          <span>معاينة الرابط</span>
        </button>
        
        <button className="btn btn-gold px-4 py-2 text-sm inline-flex items-center gap-1.5" onClick={handleSave} disabled={saving}>
          <Save size={15} />
          <span>{saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
        </button>
      </header>

      {/* ===== محتوى الصفحة ===== */}
      {viewMode === 'builder' ? (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* الشريط الجانبي الأيمن: إدارة العناصر والطبقات */}
        <aside className="panel-right order-2 lg:order-1 w-full lg:w-64 flex-shrink-0 p-4 flex flex-col gap-5 overflow-y-auto" style={{ background: 'var(--bg-card)', borderLeft: '1px solid var(--border-gold)' }}>
          <div>
            <p className="field-label text-right">إضافة عنصر للشهادة</p>
            <div className="grid grid-cols-3 gap-2">
              <button className="tool-btn" onClick={() => addElement('static')}>
                <Type size={16} />
                <span>نص ثابت</span>
              </button>
              <button className="tool-btn" onClick={() => addElement('field')}>
                <span className="font-bold text-xs">{"{ }"}</span>
                <span>حقل متغيّر</span>
              </button>
              <button className="tool-btn" onClick={() => addElement('image')}>
                <ImageIcon size={16} />
                <span>توقيع/ختم</span>
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 flex flex-col text-right">
            <p className="field-label">طبقات العناصر ({elements.length})</p>
            <div className="flex flex-col gap-0.5 overflow-y-auto pr-1">
              {elements.map((el) => (
                <div
                  key={el.id}
                  className={`layer-row ${selectedId === el.id ? 'active' : ''}`}
                  onClick={() => setSelectedId(el.id)}
                >
                  <GripVertical size={13} style={{ color: '#c2b896' }} />
                  {el.type === 'static' && <Type size={14} style={{ color: '#6b6457' }} />}
                  {el.type === 'field' && <span className="font-mono text-[10px] font-bold" style={{ color: 'var(--gold-main)' }}>{"{}"}</span>}
                  {el.type === 'image' && <PenTool size={14} style={{ color: 'var(--gold-main)' }} />}
                  
                  <span className="text-xs flex-1 truncate pr-1" style={{ color: el.hidden ? '#b3ab9a' : 'var(--text-main)' }}>
                    {el.type === 'field' ? el.key : el.type === 'image' ? el.label : el.text}
                  </span>
                  
                  <button
                    className="icon-btn mr-auto"
                    onClick={(e) => {
                      e.stopPropagation()
                      updateElement(el.id, { hidden: !el.hidden })
                    }}
                  >
                    {el.hidden ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                  <button
                    className="icon-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteElement(el.id)
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* مساحة العمل: لوحة التصميم */}
        <div className="order-1 lg:order-2 flex-1 overflow-auto p-6 lg:p-10 flex items-start justify-center content-bg">
          <div className="w-full" style={{ maxWidth: 840 }}>
            <div
              ref={canvasRef}
              onMouseDown={() => setSelectedId(null)}
              className="relative w-full rounded-md shadow-xl certificate-a4"
              style={{
                background: bg,
                aspectRatio: orientation === 'landscape' ? '1.414 / 1' : '1 / 1.414',
                border: '2.5px solid var(--gold-focus)',
              }}
            >
              {/* Ornaments */}
              <div className="absolute inset-2.5 pointer-events-none" style={{ border: '1px dashed var(--gold-focus)', opacity: 0.4 }} />
              <CornerOrnament corner="tl" />
              <CornerOrnament corner="tr" />
              <CornerOrnament corner="br" />
              <CornerOrnament corner="bl" />

              {/* Elements Rendering */}
              {elements.map((el) => {
                const isSelected = selectedId === el.id
                
                if (el.type === 'image') {
                  return (
                    <div
                      key={el.id}
                      onMouseDown={(e) => handleElementMouseDown(e, el)}
                      className={`image-slot ${isSelected ? 'selected' : ''} ${el.hidden ? 'hidden-el' : ''}`}
                      style={{
                        left: `${el.x}%`,
                        top: `${el.y}%`,
                        width: `${el.w}%`,
                        height: `${el.h}%`,
                      }}
                    >
                      {el.url ? (
                        <img src={el.url} alt={el.label} className="w-full h-full object-contain pointer-events-none" />
                      ) : (
                        <>
                          {el.label.includes('ختم') ? (
                            <StampIcon size={20} style={{ color: 'var(--gold-main)' }} />
                          ) : (
                            <PenTool size={18} style={{ color: 'var(--gold-main)' }} />
                          )}
                          <span className="text-[8px] font-bold" style={{ color: '#9c7a1f' }}>
                            {el.label}
                          </span>
                        </>
                      )}
                      
                      {isSelected && (
                        <>
                          <span className="handle" style={{ top: -4, left: -4 }} />
                          <span className="handle" style={{ top: -4, right: -4 }} />
                          <span className="handle" style={{ bottom: -4, left: -4 }} />
                          <span className="handle" style={{ bottom: -4, right: -4 }} />
                        </>
                      )}
                    </div>
                  )
                }

                return (
                  <div
                    key={el.id}
                    onMouseDown={(e) => handleElementMouseDown(e, el)}
                    className={`canvas-el ${el.type === 'field' ? 'field-box' : ''} ${isSelected ? 'selected' : ''} ${el.hidden ? 'hidden-el' : ''}`}
                    style={{
                      left: `${el.x}%`,
                      top: `${el.y}%`,
                      fontFamily: el.font === 'Amiri' ? "'Amiri', serif" : "'Tajawal', sans-serif",
                      fontSize: `${el.size}px`,
                      fontWeight: el.weight || 400,
                      color: el.color,
                      textAlign: el.align || 'center',
                    }}
                  >
                    {el.type === 'field' ? `{{${el.key}}}` : el.text}
                    
                    {isSelected && (
                      <>
                        <span className="handle" style={{ top: -5, left: -5 }} />
                        <span className="handle" style={{ top: -5, right: -5 }} />
                        <span className="handle" style={{ bottom: -5, left: -5 }} />
                        <span className="handle" style={{ bottom: -5, right: -5 }} />
                      </>
                    )}
                  </div>
                )
              })}
            </div>
            
            <p className="text-center text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
              اسحب أي عنصر لتغيير موضعه داخل القالب
            </p>
          </div>
        </div>

        {/* الشريط الجانبي الأيسر: لوحة الخصائص والإعدادات */}
        <aside className="panel order-3 w-full lg:w-80 flex-shrink-0 p-5 overflow-y-auto text-right" style={{ background: 'var(--bg-card)', borderRight: '1px solid var(--border-gold)' }}>
          {!selected ? (
            <div className="flex flex-col gap-5">
              <div>
                <p className="font-amiri text-lg font-bold" style={{ color: 'var(--navy-dark)' }}>
                  إعدادات الإجازة
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  انقر على أي عنصر داخل القالب لتعديل خصائصه وتنسيقه
                </p>
              </div>

              {/* Title and Description */}
              <div className="form-group">
                <span className="field-label">الوصف التفصيلي (اختياري)</span>
                <textarea
                  className="form-textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="وصف مختصر يظهر للطلاب في صفحة التقديم..."
                  rows={2}
                />
              </div>

              <div className="divider" style={{ background: 'var(--border-gold)', height: '1px', margin: '0.5rem 0' }} />

              {/* Orientation */}
              <div>
                <span className="field-label">اتجاه الصفحة</span>
                <div className="flex gap-2">
                  <button
                    className="flex-1 py-1.5 rounded-lg text-xs font-bold border"
                    style={orientation === 'landscape' ? { background: 'var(--navy-dark)', color: '#e9c969', borderColor: 'var(--navy-dark)' } : { borderColor: 'var(--border-gold)', color: 'var(--text-muted)' }}
                    onClick={() => setOrientation('landscape')}
                  >
                    أفقي (عرضي)
                  </button>
                  <button
                    className="flex-1 py-1.5 rounded-lg text-xs font-bold border"
                    style={orientation === 'portrait' ? { background: 'var(--navy-dark)', color: '#e9c969', borderColor: 'var(--navy-dark)' } : { borderColor: 'var(--border-gold)', color: 'var(--text-muted)' }}
                    onClick={() => setOrientation('portrait')}
                  >
                    عمودي (طولي)
                  </button>
                </div>
              </div>

              {/* Background swatch */}
              <div>
                <span className="field-label flex items-center gap-1">
                  <Palette size={13} />
                  <span>لون خلفية الشهادة</span>
                </span>
                <div className="flex gap-2.5">
                  {BG_SWATCHES.map((c) => (
                    <button key={c} className={`swatch ${bg === c ? 'active' : ''}`} style={{ background: c }} onClick={() => setBg(c)} />
                  ))}
                </div>
              </div>

              {/* Auto Close Config */}
              <div className="divider" style={{ background: 'var(--border-gold)', height: '1px', margin: '0.5rem 0' }} />
              
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="edit-enable-auto-close"
                    checked={autoCloseEnabled}
                    onChange={(e) => setAutoCloseEnabled(e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label htmlFor="edit-enable-auto-close" style={{ fontSize: '0.85rem', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 600 }}>
                    تحديد وقت محدد لإغلاق التقديم
                  </label>
                </div>

                {autoCloseEnabled && (
                  <div className="form-group mt-2">
                    <label className="form-label font-semibold" htmlFor="edit-auto-close-at" style={{ fontSize: '0.72rem' }}>تاريخ ووقت الإغلاق (بتوقيت مكة المكرمة)</label>
                    <button
                      type="button"
                      id="edit-auto-close-at"
                      className="form-input text-right flex items-center justify-between w-full"
                      onClick={() => setShowDatePicker(true)}
                      style={{
                        background: '#fffdf8',
                        border: '1px solid var(--border-gold)',
                        padding: '0.65rem 0.9rem',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        color: autoCloseAt ? 'var(--text-main)' : 'var(--text-muted)'
                      }}
                    >
                      <span>{formatArabicDateTime(autoCloseAt)}</span>
                      <Calendar size={14} className="text-[#b8923a]" />
                    </button>
                  </div>
                )}

                {/* مؤقت العد التنازلي للمسؤول في شريط الإعدادات */}
                {autoCloseEnabled && timeLeft !== null && timeLeft > 0 && (
                  <div className="countdown-banner rounded-xl p-3 flex flex-col items-center justify-center mt-3 text-right" style={{ background: 'var(--warning-bg)', border: '1px solid #ecdcae' }}>
                    <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: '#7a5c1f' }}>
                      <Clock size={13} />
                      <span>ينتهي استقبال الردود تلقائياً خلال:</span>
                    </div>
                    <div className="flex gap-3 mt-2 direction-ltr font-mono text-base font-bold" style={{ color: '#7a5c1f' }}>
                      <div className="text-center">
                        <span className="text-sm">{String(Math.floor(timeLeft / 3600)).padStart(2, '0')}</span>
                        <span className="block text-[7px] opacity-75">ساعة</span>
                      </div>
                      <span>:</span>
                      <div className="text-center">
                        <span className="text-sm">{String(Math.floor((timeLeft % 3600) / 60)).padStart(2, '0')}</span>
                        <span className="block text-[7px] opacity-75">دقيقة</span>
                      </div>
                      <span>:</span>
                      <div className="text-center">
                        <span className="text-sm">{String(timeLeft % 60).padStart(2, '0')}</span>
                        <span className="block text-[7px] opacity-75">ثانية</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="divider" style={{ background: 'var(--border-gold)', height: '1px', margin: '0.5rem 0' }} />

              <div className="rounded-xl p-3.5 flex gap-2.5" style={{ background: '#faf1de', border: '1px solid #ecdcae' }}>
                <Info size={15} style={{ color: '#b07a1f', flexShrink: 0, marginTop: 2 }} />
                <p className="text-[11px] leading-relaxed text-right" style={{ color: '#7a5c1f' }}>
                  عناصر "الحقل المتغيّر" تظهر تلقائياً كحقول إدخال للطلاب عند فتح رابط الإجازة لملء بياناتهم.
                </p>
              </div>

              {!cert?.is_master && (
                <button className="btn btn-outline-gold w-full py-2.5 text-xs mt-2" onClick={handleSetMaster}>
                  اعتماد كقالب رئيسي للمؤسسة
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Selected Element Controls */}
              {selected.type === 'static' && (
                <>
                  <span className="inline-flex w-fit items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: '#efe9da', color: '#6b6457' }}>
                    <Type size={11} />
                    نص ثابت
                  </span>
                  <div>
                    <span className="field-label">محتوى النص</span>
                    <textarea
                      className="field-select"
                      rows={2}
                      value={selected.text}
                      onChange={(e) => updateElement(selected.id, { text: e.target.value })}
                    />
                  </div>
                </>
              )}

              {selected.type === 'field' && (
                <>
                  <span className="inline-flex w-fit items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: '#f3e6c0', color: '#9c7a1f' }}>
                    <span className="font-bold text-[9px]">{"{}"}</span>
                    حقل متغيّر في النموذج
                  </span>
                  <div className="rounded-lg p-2.5 text-[11px] leading-relaxed text-right" style={{ background: '#faf1de', color: '#7a5c1f' }}>
                    سيقوم الطالب بتعبئة هذا الحقل عند التقديم لتظهر قيمته في هذا الموضع.
                  </div>
                  <div>
                    <span className="field-label">اسم الحقل (تسمية الإدخال)</span>
                    <input
                      className="field-select"
                      value={selected.key}
                      onChange={(e) => updateElement(selected.id, { key: e.target.value })}
                    />
                  </div>
                </>
              )}

              {selected.type === 'image' && (
                <>
                  <span className="inline-flex w-fit items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: '#f3e6c0', color: '#9c7a1f' }}>
                    <ImageIcon size={11} />
                    عنصر ختم / توقيع
                  </span>
                  
                  <div>
                    <span className="field-label">اسم العنصر</span>
                    <input
                      className="field-select"
                      value={selected.label}
                      onChange={(e) => updateElement(selected.id, { label: e.target.value })}
                    />
                  </div>

                  <div>
                    <span className="field-label">اختر صورة من المحفوظات</span>
                    {assets.length === 0 ? (
                      <p className="text-[10px] text-center p-2" style={{ color: 'var(--text-muted)' }}>
                        لا توجد أختام أو تواقيع محفوظة.
                      </p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        {assets.map((asset) => (
                          <button
                            key={asset.id}
                            className="aspect-square rounded-lg flex items-center justify-center overflow-hidden border p-1"
                            style={{
                              background: '#f7f2e7',
                              borderColor: selected.url === asset.public_url ? 'var(--gold-focus)' : '#e7ddc4',
                              borderWidth: selected.url === asset.public_url ? '2px' : '1px',
                            }}
                            title={asset.name}
                            onClick={() => updateElement(selected.id, { url: asset.public_url, label: asset.name })}
                          >
                            <img src={asset.public_url} alt={asset.name} className="w-full h-full object-contain pointer-events-none" />
                          </button>
                        ))}
                      </div>
                    )}
                    <Link href="/admin/assets" className="text-[10px] font-bold block mt-2 text-left" style={{ color: 'var(--gold-main)' }}>
                      رفع صورة جديدة ↗
                    </Link>
                  </div>

                  <div>
                    <span className="field-label">حجم الصورة على الشهادة</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] w-10 text-left" style={{ color: '#9c948a' }}>العرض</span>
                      <input
                        type="range"
                        min="5"
                        max="35"
                        value={selected.w}
                        onChange={(e) => updateElement(selected.id, { w: Number(e.target.value) })}
                        className="flex-1"
                      />
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] w-10 text-left" style={{ color: '#9c948a' }}>الارتفاع</span>
                      <input
                        type="range"
                        min="5"
                        max="35"
                        value={selected.h}
                        onChange={(e) => updateElement(selected.id, { h: Number(e.target.value) })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Common Typography and Styling Controls (only for text/field types) */}
              {selected.type !== 'image' && (
                <>
                  <div>
                    <span className="field-label">الخط</span>
                    <select
                      className="field-select"
                      value={selected.font}
                      onChange={(e) => updateElement(selected.id, { font: e.target.value })}
                    >
                      <option value="Amiri">Amiri — خط كلاسيكي</option>
                      <option value="Tajawal">Tajawal — خط حديث</option>
                    </select>
                  </div>

                  <div>
                    <span className="field-label">الحجم ({selected.size}px)</span>
                    <input
                      type="range"
                      min="9"
                      max="48"
                      value={selected.size}
                      onChange={(e) => updateElement(selected.id, { size: Number(e.target.value) })}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <span className="field-label">المحاذاة</span>
                    <div className="flex gap-2">
                      <button
                        className={`align-btn ${selected.align === 'right' ? 'active' : ''}`}
                        onClick={() => updateElement(selected.id, { align: 'right' })}
                      >
                        <AlignRight size={14} />
                      </button>
                      <button
                        className={`align-btn ${selected.align === 'center' ? 'active' : ''}`}
                        onClick={() => updateElement(selected.id, { align: 'center' })}
                      >
                        <AlignCenter size={14} />
                      </button>
                      <button
                        className={`align-btn ${selected.align === 'left' ? 'active' : ''}`}
                        onClick={() => updateElement(selected.id, { align: 'left' })}
                      >
                        <AlignLeft size={14} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="field-label">لون الخط</span>
                    <div className="flex gap-2">
                      {COLOR_SWATCHES.map((c) => (
                        <button
                          key={c}
                          className={`swatch ${selected.color === c ? 'active' : ''}`}
                          style={{ background: c }}
                          onClick={() => updateElement(selected.id, { color: c })}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="divider" style={{ background: 'var(--border-gold)', height: '1px', margin: '0.5rem 0' }} />

              <button
                className="text-xs font-semibold inline-flex items-center gap-1.5 mt-2"
                style={{ color: 'var(--danger)' }}
                onClick={() => deleteElement(selected.id)}
              >
                <Trash2 size={13} />
                <span>حذف هذا العنصر من الشهادة</span>
              </button>
            </div>
          )}
        </aside>
      </div>
      ) : (
        <div className="flex-1 overflow-y-auto content-bg py-8">
          <div className="form-editor-container">
            {/* Card 1: Title and Description Header (Google Forms style) */}
            <div className="form-editor-card header-card">
              <div className="form-group text-right">
                <input
                  type="text"
                  className="form-input font-bold"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="عنوان الاستمارة"
                  style={{
                    fontSize: '1.6rem',
                    border: 'none',
                    borderBottom: '1.5px solid transparent',
                    borderRadius: 0,
                    padding: '0.25rem 0',
                    background: 'transparent',
                    fontFamily: 'Amiri, serif',
                    color: 'var(--navy-dark)',
                    boxShadow: 'none'
                  }}
                  onFocus={(e) => { e.target.style.borderBottom = '1.5px solid var(--gold-main)' }}
                  onBlur={(e) => { e.target.style.borderBottom = '1.5px solid transparent' }}
                />
              </div>
              <div className="form-group text-right" style={{ marginTop: '-0.5rem' }}>
                <textarea
                  className="form-textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="وصف الاستمارة والتعليمات للطلاب..."
                  rows={2}
                  style={{
                    border: 'none',
                    borderBottom: '1.5px solid transparent',
                    borderRadius: 0,
                    padding: '0.25rem 0',
                    background: 'transparent',
                    fontSize: '0.88rem',
                    color: 'var(--text-muted)',
                    boxShadow: 'none',
                    resize: 'none'
                  }}
                  onFocus={(e) => { e.target.style.borderBottom = '1.5px solid var(--gold-main)' }}
                  onBlur={(e) => { e.target.style.borderBottom = '1.5px solid transparent' }}
                />
              </div>

              {/* مؤقت العد التنازلي للمسؤول داخل ترويسة الاستمارة */}
              {autoCloseEnabled && timeLeft !== null && timeLeft > 0 && (
                <div className="countdown-banner rounded-xl p-3 flex flex-col items-center justify-center mt-3 text-right" style={{ background: 'var(--warning-bg)', border: '1px solid #ecdcae', alignSelf: 'center', width: '100%', maxWidth: '360px' }}>
                  <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: '#7a5c1f' }}>
                    <Clock size={13} />
                    <span>ينتهي استقبال الردود تلقائياً خلال:</span>
                  </div>
                  <div className="flex gap-4 mt-2 direction-ltr font-mono text-base font-bold" style={{ color: '#7a5c1f' }}>
                    <div className="text-center">
                      <span className="text-sm">{String(Math.floor(timeLeft / 3600)).padStart(2, '0')}</span>
                      <span className="block text-[8px] opacity-75">ساعة</span>
                    </div>
                    <span>:</span>
                    <div className="text-center">
                      <span className="text-sm">{String(Math.floor((timeLeft % 3600) / 60)).padStart(2, '0')}</span>
                      <span className="block text-[8px] opacity-75">دقيقة</span>
                    </div>
                    <span>:</span>
                    <div className="text-center">
                      <span className="text-sm">{String(timeLeft % 60).padStart(2, '0')}</span>
                      <span className="block text-[8px] opacity-75">ثانية</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Cards 2+: Form Fields */}
            {formFields.map((field, index) => {
              const isCanvasField = !field.id.startsWith('extra-')
              const isActive = activeFieldId === field.id

              return (
                <div
                  key={field.id}
                  className={`form-editor-card ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveFieldId(field.id)}
                >
                  {/* Field Details */}
                  <div className="form-editor-row">
                    {/* Field Label / Question */}
                    <div className="flex-1 text-right">
                      <input
                        type="text"
                        className="form-input"
                        value={field.label}
                        onChange={(e) => {
                          if (isCanvasField) {
                            updateFormField(field.id, { label: e.target.value })
                          } else {
                            updateAdditionalFieldLabel(field.id, e.target.value)
                          }
                        }}
                        placeholder="السؤال / اسم الحقل"
                        style={{
                          fontWeight: 600,
                          fontSize: '0.95rem',
                          border: 'none',
                          borderBottom: '1.5px solid var(--border-gold)',
                          borderRadius: 0,
                          background: 'transparent',
                          padding: '0.5rem 0',
                          boxShadow: 'none'
                        }}
                      />
                    </div>

                    {/* Field Type Selector */}
                    <select
                      className="form-select form-editor-type-select"
                      value={field.type}
                      onChange={(e) => {
                        const newType = e.target.value as FormField['type']
                        const patch: Partial<FormField> = { type: newType }
                        if (newType === 'select' && !field.options) {
                          patch.options = ['الخيار الأول']
                        }
                        updateFormField(field.id, patch)
                      }}
                      style={{ fontSize: '0.82rem', padding: '0.45rem' }}
                    >
                      <option value="text">إجابة قصيرة (نص)</option>
                      <option value="textarea">إجابة طويلة (فقرة)</option>
                      <option value="date">تاريخ</option>
                      <option value="select">قائمة خيارات (Dropdown)</option>
                    </select>
                  </div>

                  {/* Additional Options (select dropdown) */}
                  {field.type === 'select' && (
                    <div className="form-editor-options-list text-right">
                      <p className="text-[11px] font-bold mb-2" style={{ color: 'var(--text-muted)' }}>خيارات القائمة المنسدلة:</p>
                      {(field.options || ['الخيار الأول']).map((option, optIdx) => (
                        <div key={optIdx} className="form-editor-option-item">
                          <span className="form-editor-option-dot" />
                          <input
                            type="text"
                            className="form-input flex-1 py-1 px-2.5 text-xs"
                            value={option}
                            onChange={(e) => updateOption(field.id, optIdx, e.target.value)}
                            style={{ background: '#fff', border: '1px solid var(--border-gold)' }}
                          />
                          <button
                            type="button"
                            className="text-[#9c3b3b] hover:text-[#7a2e2e] text-xs font-bold px-1"
                            onClick={() => removeOption(field.id, optIdx)}
                          >
                            حذف
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="text-xs font-bold mt-1 inline-flex items-center gap-1 hover:text-[#16243f]"
                        style={{ color: 'var(--gold-main)', background: 'none', border: 'none', cursor: 'pointer', width: 'fit-content' }}
                        onClick={() => addOption(field.id)}
                      >
                        <span>+ إضافة خيار جديد</span>
                      </button>
                    </div>
                  )}

                  {/* Placeholder Config */}
                  {field.type !== 'date' && (
                    <div className="text-right">
                      <input
                        type="text"
                        className="form-input text-xs py-1.5 px-3"
                        value={field.placeholder || ''}
                        onChange={(e) => updateFormField(field.id, { placeholder: e.target.value })}
                        placeholder="نص تلميح مساعدة داخل المربع (اختياري)..."
                        style={{ background: '#faf9f6', borderStyle: 'dashed' }}
                      />
                    </div>
                  )}

                  {/* Card Actions Footer */}
                  <div className="form-editor-actions">
                    <div className="form-editor-action-group">
                      <button
                        type="button"
                        className="form-editor-order-btn"
                        onClick={(e) => { e.stopPropagation(); moveField(index, 'up'); }}
                        disabled={index === 0}
                        title="تحريك لأعلى"
                      >
                        <ChevronUp size={16} />
                      </button>
                      <button
                        type="button"
                        className="form-editor-order-btn"
                        onClick={(e) => { e.stopPropagation(); moveField(index, 'down'); }}
                        disabled={index === formFields.length - 1}
                        title="تحريك لأسفل"
                      >
                        <ChevronDown size={16} />
                      </button>

                      <span className={`form-editor-field-badge ${!isCanvasField ? 'additional' : ''}`}>
                        {isCanvasField ? 'حقل الشهادة الأساسي' : 'حقل إضافي للاستمارة'}
                      </span>
                    </div>

                    <div className="form-editor-action-group">
                      <div className="flex items-center gap-1.5 ml-4">
                        <input
                          type="checkbox"
                          id={`req-${field.id}`}
                          checked={field.required}
                          onChange={(e) => updateFormField(field.id, { required: e.target.checked })}
                          style={{ cursor: 'pointer' }}
                        />
                        <label htmlFor={`req-${field.id}`} style={{ fontSize: '0.78rem', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}>
                          مطلوب إدخاله
                        </label>
                      </div>

                      {!isCanvasField && (
                        <button
                          type="button"
                          className="text-[#9c3b3b] hover:text-[#7a2e2e] flex items-center gap-1 text-xs font-bold pr-3 border-r"
                          style={{ borderColor: 'var(--border-gold)' }}
                          onClick={() => deleteAdditionalField(field.id)}
                        >
                          <Trash2 size={13} />
                          <span>حذف الحقل</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Add Additional Field */}
            <div className="form-editor-add-btn-container">
              <button
                type="button"
                className="btn btn-secondary py-2.5 px-6 text-sm flex items-center gap-1.5 shadow-sm"
                onClick={addAdditionalField}
                style={{ background: '#fff', border: '1px solid var(--border-gold)' }}
              >
                <Plus size={16} />
                <span>إضافة حقل إضافي للاستمارة</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Date Time Picker Modal */}
      <DateTimePickerModal
        isOpen={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        value={autoCloseAt}
        onChange={setAutoCloseAt}
      />

      {/* Toast Notification */}
      {toast && (
        <div className={`toast toast-${toast.type}`} role="status">
          {toast.msg}
        </div>
      )}
    </div>
  )
}
