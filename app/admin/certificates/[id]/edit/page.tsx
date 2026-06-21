'use client'

import { useEffect, useState, useCallback, useRef, forwardRef, useImperativeHandle } from 'react'
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
  List,
  Hash,
  Mail,
  Download,
  Search,
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Check,
  Award,
} from 'lucide-react'

import DateTimePickerModal, { MONTH_NAMES, getHour12 } from './DateTimePickerModal'


/* ---------------------------------- Rich Text Editor ---------------------------------- */

interface ParagraphStyle {
  font: 'Amiri' | 'Tajawal'
  size: number
  color: string
  align: 'right' | 'center' | 'left'
  weight: number
}

interface EditableDocumentProps {
  initialHtml: string
  onChange: (html: string) => void
  onSelectionChange: (style: ParagraphStyle | null) => void
}

export interface EditableDocumentRef {
  applyStyle: (stylePatch: { font?: string; size?: number; color?: string; align?: string }) => void
  insertPlaceholder: (name: string) => void
  appendParagraph: () => void
}

const EditableDocument = forwardRef<EditableDocumentRef, EditableDocumentProps>(({ initialHtml, onChange, onSelectionChange }, ref) => {
  const editorRef = useRef<HTMLDivElement>(null)
  const lastHtmlRef = useRef(initialHtml)

  // Initialize/update content from external props (without caret resets during active typing)
  useEffect(() => {
    if (editorRef.current && initialHtml && editorRef.current.innerHTML !== initialHtml) {
      editorRef.current.innerHTML = initialHtml
      lastHtmlRef.current = initialHtml
    }
  }, [initialHtml])

  // Ensure editor never becomes completely empty of paragraphs
  useEffect(() => {
    if (editorRef.current && !editorRef.current.innerHTML.trim()) {
      editorRef.current.innerHTML = `<p style="font-family: 'Tajawal', sans-serif; font-size: 14px; text-align: center; color: #1f2733;">&nbsp;</p>`
      lastHtmlRef.current = editorRef.current.innerHTML
    }
  }, [])

  const handleSelectionChange = useCallback(() => {
    if (!editorRef.current) return
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) {
      onSelectionChange(null)
      return
    }

    const range = sel.getRangeAt(0)
    let node: Node | null = range.startContainer

    // Traverse up to find paragraph element inside editor
    let pNode: HTMLParagraphElement | null = null
    while (node && node !== editorRef.current) {
      if (node.nodeName === 'P') {
        pNode = node as HTMLParagraphElement
        break
      }
      node = node.parentNode
    }

    if (pNode) {
      const style = pNode.style
      const fontFamily = style.fontFamily || ''
      const font = fontFamily.includes('Amiri') ? 'Amiri' : 'Tajawal'
      const size = parseInt(style.fontSize) || 14
      const color = style.color || '#1f2733'
      const textAlign = style.textAlign || 'center'
      const align: 'right' | 'center' | 'left' = (textAlign === 'right' || textAlign === 'left') ? textAlign : 'center'
      const weight = parseInt(style.fontWeight) || 400

      onSelectionChange({ font, size, color, align, weight })
    } else {
      onSelectionChange(null)
    }
  }, [onSelectionChange])

  useImperativeHandle(ref, () => ({
    applyStyle: (stylePatch) => {
      if (!editorRef.current) return
      const sel = window.getSelection()
      if (!sel || sel.rangeCount === 0) return

      const paragraphs: HTMLParagraphElement[] = []
      const range = sel.getRangeAt(0)

      // Collect all paragraphs intersecting with selection
      const allPs = editorRef.current.querySelectorAll('p')
      allPs.forEach((p) => {
        if (range.intersectsNode(p)) {
          paragraphs.push(p as HTMLParagraphElement)
        }
      })

      // Fallback: search parent tree of start container
      if (paragraphs.length === 0) {
        let node: Node | null = range.startContainer
        while (node && node !== editorRef.current) {
          if (node.nodeName === 'P') {
            paragraphs.push(node as HTMLParagraphElement)
            break
          }
          node = node.parentNode
        }
      }

      if (paragraphs.length > 0) {
        paragraphs.forEach((pNode) => {
          if (stylePatch.font !== undefined) {
            pNode.style.fontFamily = stylePatch.font === 'Amiri' ? "'Amiri', serif" : "'Tajawal', sans-serif"
          }
          if (stylePatch.size !== undefined) {
            pNode.style.fontSize = `${stylePatch.size}px`
          }
          if (stylePatch.color !== undefined) {
            pNode.style.color = stylePatch.color
          }
          if (stylePatch.align !== undefined) {
            pNode.style.textAlign = stylePatch.align
          }
        })

        const currentHtml = editorRef.current.innerHTML
        lastHtmlRef.current = currentHtml
        onChange(currentHtml)
      }
    },
    insertPlaceholder: (name) => {
      if (!editorRef.current) return
      editorRef.current.focus()

      const sel = window.getSelection()
      if (!sel || sel.rangeCount === 0) return

      const range = sel.getRangeAt(0)
      range.deleteContents()

      const placeholderText = `{{${name}}}`
      const textNode = document.createTextNode(placeholderText)
      range.insertNode(textNode)

      // Move caret after inserted text node
      range.setStartAfter(textNode)
      range.setEndAfter(textNode)
      sel.removeAllRanges()
      sel.addRange(range)

      const currentHtml = editorRef.current.innerHTML
      lastHtmlRef.current = currentHtml
      onChange(currentHtml)
    },
    appendParagraph: () => {
      if (!editorRef.current) return
      const p = document.createElement('p')
      p.style.fontFamily = "'Tajawal', sans-serif"
      p.style.fontSize = '14px'
      p.style.textAlign = 'center'
      p.style.color = '#1f2733'
      p.innerHTML = 'نص جديد'
      editorRef.current.appendChild(p)

      const currentHtml = editorRef.current.innerHTML
      lastHtmlRef.current = currentHtml
      onChange(currentHtml)

      // Focus new paragraph
      p.focus()
      const sel = window.getSelection()
      if (sel) {
        const range = document.createRange()
        range.selectNodeContents(p)
        sel.removeAllRanges()
        sel.addRange(range)
      }
      handleSelectionChange()
    }
  }))

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const currentHtml = e.currentTarget.innerHTML
    if (currentHtml !== lastHtmlRef.current) {
      lastHtmlRef.current = currentHtml
      onChange(currentHtml)
    }
  }

  return (
    <div
      ref={editorRef}
      contentEditable
      onInput={handleInput}
      onMouseUp={handleSelectionChange}
      onKeyUp={handleSelectionChange}
      onFocus={handleSelectionChange}
      dir="rtl"
      className="w-full h-full bg-transparent border-none outline-none resize-none overflow-hidden p-3"
      style={{
        direction: 'rtl',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: '0.4rem',
        fontFamily: "'Tajawal', sans-serif",
        border: 'none',
        outline: 'none',
        boxShadow: 'none',
        background: 'transparent',
      }}
    />
  )
})
EditableDocument.displayName = 'EditableDocument'

/* ----------------------------- Helpers for Rich Editor ----------------------------- */

function convertElementsToHtml(elements: any[]): string {
  return elements
    .filter((el) => el.type !== 'image')
    .map((el) => {
      const fontStr = el.font === 'Amiri' ? "'Amiri', serif" : "'Tajawal', sans-serif"
      const alignStr = el.align || 'center'
      const weightStr = el.weight || 400
      const colorStr = el.color || '#1f2733'
      const textVal = el.type === 'field' ? `{{${el.key}}}` : el.text
      return `<p style="font-family: ${fontStr}; font-size: ${el.size}px; font-weight: ${weightStr}; color: ${colorStr}; text-align: ${alignStr};">${textVal || '&nbsp;'}</p>`
    })
    .join('')
}

function extractPlaceholders(html: string): string[] {
  const matches: string[] = []
  const regex = /\{\{([^}]+)\}\}/g
  const cleanText = html.replace(/<[^>]*>/g, ' ')
  let match
  while ((match = regex.exec(cleanText)) !== null) {
    const key = match[1].trim()
    if (key && !matches.includes(key)) {
      matches.push(key)
    }
  }
  return matches
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

  // New Rich Editor States & Refs
  const [editorHtml, setEditorHtml] = useState('')
  const [activeStyle, setActiveStyle] = useState<ParagraphStyle | null>(null)
  const documentRef = useRef<EditableDocumentRef>(null)
  const [inlineUploading, setInlineUploading] = useState(false)

  // Auto Close Settings
  const [autoCloseEnabled, setAutoCloseEnabled] = useState(false)
  const [autoCloseAt, setAutoCloseAt] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)

  // Form Editor Settings
  const [viewMode, setViewMode] = useState<'builder' | 'form_editor' | 'responses'>('builder')
  const [formFields, setFormFields] = useState<FormField[]>([])
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null)

  // Submissions (الطلبات) state
  const [submissions, setSubmissions] = useState<any[] | null>(null)
  const [submissionsLoading, setSubmissionsLoading] = useState(false)
  const [submissionsQuery, setSubmissionsQuery] = useState('')
  const [submissionsPage, setSubmissionsPage] = useState(1)
  const [selectedSubmissionIds, setSelectedSubmissionIds] = useState<string[]>([])
  const [viewingSubmission, setViewingSubmission] = useState<any | null>(null)
  const responseCertRef = useRef<HTMLDivElement>(null)

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


  // Synchronize canvas field elements (from rich text placeholders) with formFields array
  useEffect(() => {
    const placeholderKeys = extractPlaceholders(editorHtml)

    setFormFields((prev) => {
      // 1. Remove deleted canvas fields (field id doesn't start with 'extra-')
      let updated = prev.filter((field) => {
        const isCanvasField = !field.id.startsWith('extra-')
        if (isCanvasField) {
          return placeholderKeys.includes(field.variable)
        }
        return true
      })

      // 2. Add any NEW canvas fields that are not in the list yet
      placeholderKeys.forEach((key) => {
        const exists = updated.some((f) => f.variable === key)
        if (!exists) {
          updated.push({
            id: `field-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            label: key,
            type: key.includes('تاريخ') ? 'date' : 'text',
            required: true,
            variable: key,
          })
        }
      })

      return updated
    })
  }, [editorHtml])

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
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({})

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
          setBg(config.bg || BG_SWATCHES[0])
          setOrientation(config.orientation || 'landscape')
          
          if (config.html) {
            setEditorHtml(config.html)
            setElements(config.elements || [])
          } else {
            // Older config format conversion
            const legacyElements = config.elements || INITIAL_ELEMENTS
            setEditorHtml(convertElementsToHtml(legacyElements))
            setElements(legacyElements.filter((el: any) => el.type === 'image'))
          }
        } catch {
          setEditorHtml(convertElementsToHtml(INITIAL_ELEMENTS))
          setElements(INITIAL_ELEMENTS.filter(el => el.type === 'image'))
        }
      } else {
        setEditorHtml(convertElementsToHtml(INITIAL_ELEMENTS))
        setElements(INITIAL_ELEMENTS.filter(el => el.type === 'image'))
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

  const loadSubmissions = useCallback(async () => {
    setSubmissionsLoading(true)
    try {
      const res = await fetch(`/api/certificates/${id}/submissions`)
      const data = await res.json()
      setSubmissions(data || [])
    } catch {
      showToast('فشل تحميل التقديمات والردود', 'error')
    } finally {
      setSubmissionsLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (viewMode === 'responses' && submissions === null) {
      loadSubmissions()
    }
  }, [viewMode, submissions, loadSubmissions])

  async function handleToggleIsOpen(currentStatus: boolean) {
    try {
      const res = await fetch(`/api/certificates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_open: !currentStatus }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setCert((prev) => prev ? { ...prev, is_open: updated.is_open } : null)
      showToast(updated.is_open ? 'تم فتح الاستمارة لاستقبال الردود ✓' : 'تم إغلاق الاستمارة ✓')
    } catch {
      showToast('فشل تعديل حالة الاستمارة', 'error')
    }
  }

  function handleExportCsv() {
    if (!submissions || submissions.length === 0) {
      showToast('لا توجد ردود لتصديرها', 'error')
      return
    }

    const headers = ['التاريخ', ...(formFields.map((f) => f.label))]
    const rows = submissions.map((sub: any) => {
      const date = new Date(sub.created_at).toLocaleDateString('ar-SA')
      const fieldValues = formFields.map((f) => sub.data?.[f.variable] || '')
      return [date, ...fieldValues]
    })

    const csvContent = [headers, ...rows]
      .map((row) => row.map((val: any) => `"${String(val).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${templateName}_ردود.csv`
    a.click()
    URL.revokeObjectURL(url)
    showToast('تم تصدير الردود بنجاح ✓')
  }

  function handleDownloadSelectedCsv() {
    if (selectedSubmissionIds.length === 0 || !submissions) return

    const selectedSubs = submissions.filter(s => selectedSubmissionIds.includes(s.id))
    const headers = ['التاريخ', ...(formFields.map((f) => f.label))]
    const rows = selectedSubs.map((sub: any) => {
      const date = new Date(sub.created_at).toLocaleDateString('ar-SA')
      const fieldValues = formFields.map((f) => sub.data?.[f.variable] || '')
      return [date, ...fieldValues]
    })

    const csvContent = [headers, ...rows]
      .map((row) => row.map((val: any) => `"${String(val).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${templateName}_محدد_ردود.csv`
    a.click()
    URL.revokeObjectURL(url)
    showToast('تم تصدير الردود المحددة بنجاح ✓')
  }

  async function handleDownloadPdfForSubmission(response: any) {
    if (!cert) return
    showToast('جاري تحضير ملف الإجازة PDF...')
    try {
      const html2canvas = (await import('html2canvas')).default
      const jsPDF = (await import('jspdf')).default

      if (!responseCertRef.current) return

      const canvas = await html2canvas(responseCertRef.current, {
        scale: 2.2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
      })

      const imgData = canvas.toDataURL('image/png')
      
      let isLandscape = true
      if (cert.template_html && cert.template_html.startsWith('{')) {
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
      
      const studentName = response.data['اسم الطالب'] || Object.values(response.data)[0] || 'طالب'
      pdf.save(`إجازة_${studentName}_${cert.title}.pdf`)
      showToast('تم تحميل ملف PDF بنجاح ✓')
    } catch (err) {
      console.error(err)
      showToast('فشل توليد PDF تلقائياً', 'error')
    }
  }

  const selected = elements.find((e) => e.id === selectedId) || null

  // Element Actions (for image overlays)
  function updateElement(elId: string, patch: any) {
    setElements((prev) => prev.map((it) => (it.id === elId ? { ...it, ...patch } : it)))
  }

  function deleteElement(elId: string) {
    setElements((prev) => prev.filter((it) => it.id !== elId))
    if (selectedId === elId) setSelectedId(null)
  }

  async function handleInlineUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !selectedId) return
    setInlineUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'signature')

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok) throw new Error(uploadData.error)

      const assetName = file.name.replace(/\.[^.]+$/, '')
      const metaRes = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: assetName,
          type: 'signature',
          storage_path: uploadData.storage_path,
          public_url: uploadData.public_url,
        }),
      })
      const metaData = await metaRes.json()
      if (!metaRes.ok) throw new Error(metaData.error)

      // Add to assets list
      setAssets((prev) => [metaData, ...prev])
      
      // Update element
      updateElement(selectedId, { url: metaData.public_url, label: assetName })
      showToast('تم رفع الصورة وتحديث العنصر بنجاح ✓')
    } catch {
      showToast('فشل رفع الصورة', 'error')
    } finally {
      setInlineUploading(false)
    }
  }

  function addElement(type: 'static' | 'field' | 'image') {
    if (type === 'static') {
      documentRef.current?.appendParagraph()
    } else if (type === 'field') {
      documentRef.current?.insertPlaceholder('حقل جديد')
    } else if (type === 'image') {
      const newId = `new-image-${idCounter.current++}`
      const el = {
        id: newId,
        type: 'image',
        label: 'ختم/توقيع',
        x: 50,
        y: 80,
        w: 14,
        h: 14,
        url: '',
      }
      setElements((prev) => [...prev, el])
      setSelectedId(newId)
    }
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
      // Compile visual layout state into JSON configuration string
      const configJson = JSON.stringify({
        html: editorHtml,
        elements,
        bg,
        orientation,
      })

      // Patch database record
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

        {/* أزرار التبديل بين الشهادة، الاستمارة، والطلبات */}
        <div className="flex p-1 border bg-[#f7f2e7] gap-1" style={{ borderColor: 'var(--border-gold)', borderRadius: '30px' }}>
          <button
            type="button"
            className="text-xs font-bold transition-all"
            style={{
              borderRadius: '28px',
              padding: '0.45rem 1.25rem',
              cursor: 'pointer',
              outline: 'none',
              border: '1px solid transparent',
              ...(viewMode === 'builder'
                ? {
                    background: '#fff',
                    color: 'var(--navy-dark)',
                    boxShadow: '0 2px 6px rgba(22, 36, 63, 0.08)',
                    borderColor: 'var(--border-gold)'
                  }
                : {
                    background: 'transparent',
                    color: 'var(--text-muted)'
                  }
              )
            }}
            onClick={() => setViewMode('builder')}
          >
            الشهادة
          </button>
          <button
            type="button"
            className="text-xs font-bold transition-all"
            style={{
              borderRadius: '28px',
              padding: '0.45rem 1.25rem',
              cursor: 'pointer',
              outline: 'none',
              border: '1px solid transparent',
              ...(viewMode === 'form_editor'
                ? {
                    background: '#fff',
                    color: 'var(--navy-dark)',
                    boxShadow: '0 2px 6px rgba(22, 36, 63, 0.08)',
                    borderColor: 'var(--border-gold)'
                  }
                : {
                    background: 'transparent',
                    color: 'var(--text-muted)'
                  }
              )
            }}
            onClick={() => setViewMode('form_editor')}
          >
            الاستمارة
          </button>
          <button
            type="button"
            className="text-xs font-bold transition-all"
            style={{
              borderRadius: '28px',
              padding: '0.45rem 1.25rem',
              cursor: 'pointer',
              outline: 'none',
              border: '1px solid transparent',
              ...(viewMode === 'responses'
                ? {
                    background: '#fff',
                    color: 'var(--navy-dark)',
                    boxShadow: '0 2px 6px rgba(22, 36, 63, 0.08)',
                    borderColor: 'var(--border-gold)'
                  }
                : {
                    background: 'transparent',
                    color: 'var(--text-muted)'
                  }
              )
            }}
            onClick={() => setViewMode('responses')}
          >
            الطلبات
          </button>
        </div>
        
        {cert?.is_master && (
          <div className="hidden md:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full" style={{ background: '#eef4ea', color: '#4f7d4a', fontWeight: 600 }}>
            <Sparkles size={13} />
            القالب الرئيسي المعتمد
          </div>
        )}

        {viewMode === 'responses' ? (
          <div className="flex gap-2">
            <button
              className="btn btn-secondary px-4 py-2 text-sm hidden sm:inline-flex items-center gap-1.5"
              onClick={handleExportCsv}
            >
              <Download size={14} />
              <span>تنزيل CSV</span>
            </button>
          </div>
        ) : (
          <>
            <button className="btn btn-secondary px-4 py-2 text-sm hidden sm:inline-flex items-center gap-1.5" onClick={() => window.open(publicLink, '_blank')}>
              <Eye size={15} />
              <span>معاينة الرابط</span>
            </button>
            
            <button className="btn btn-gold px-4 py-2 text-sm inline-flex items-center gap-1.5" onClick={handleSave} disabled={saving}>
              <Save size={15} />
              <span>{saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
            </button>
          </>
        )}
      </header>

      {/* ===== محتوى الصفحة ===== */}
      {viewMode === 'builder' && (
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
                <span>إضافة صورة</span>
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
                border: '1.5px solid var(--border-gold)',
              }}
            >
              {/* Border Image */}
              <img
                src="/border.png"
                alt="Certificate Border"
                className="absolute pointer-events-none select-none"
                style={{
                  width: orientation === 'landscape' ? '70.72%' : '100%',
                  height: orientation === 'landscape' ? '141.42%' : '100%',
                  top: orientation === 'landscape' ? '50%' : '0',
                  left: orientation === 'landscape' ? '50%' : '0',
                  transform: orientation === 'landscape' ? 'translate(-50%, -50%) rotate(90deg)' : 'none',
                  objectFit: 'fill',
                }}
              />

              {/* Central flow document container */}
              <div
                className="absolute flex flex-col justify-center gap-2 text-right"
                style={{
                  left: '8%',
                  right: '8%',
                  top: '8%',
                  bottom: '8%',
                  direction: 'rtl',
                  zIndex: 2,
                }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <EditableDocument
                  ref={documentRef}
                  initialHtml={editorHtml}
                  onChange={setEditorHtml}
                  onSelectionChange={(style) => {
                    setActiveStyle(style)
                    if (style) {
                      setSelectedId('text-editor')
                    }
                  }}
                />
              </div>

              {/* Draggable Stamps and Signatures */}
              {elements.filter(el => el.type === 'image' && !el.hidden).map((el) => {
                const isSelected = selectedId === el.id
                return (
                  <div
                    key={el.id}
                    onMouseDown={(e) => handleElementMouseDown(e, el)}
                    className={`image-slot ${isSelected ? 'selected' : ''}`}
                    style={{
                      left: `${el.x}%`,
                      top: `${el.y}%`,
                      width: `${el.w}%`,
                      height: `${el.h}%`,
                      position: 'absolute',
                      transform: 'translate(-50%, -50%)',
                      zIndex: 10,
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
              {/* Text Formatting Controls */}
              {activeStyle && (
                <div className="flex flex-col gap-4">
                  <p className="font-amiri text-base font-bold" style={{ color: 'var(--navy-dark)' }}>
                    تنسيق النص المحدد
                  </p>
                  
                  {/* Font selector */}
                  <div>
                    <span className="field-label">الخط</span>
                    <select
                      className="field-select"
                      value={activeStyle.font}
                      onChange={(e) => {
                        const newFont = e.target.value
                        setActiveStyle(prev => prev ? { ...prev, font: newFont as any } : null)
                        documentRef.current?.applyStyle({ font: newFont })
                      }}
                    >
                      <option value="Amiri">Amiri — خط كلاسيكي</option>
                      <option value="Tajawal">Tajawal — خط حديث</option>
                    </select>
                  </div>

                  {/* Font Size slider */}
                  <div>
                    <span className="field-label">الحجم ({activeStyle.size}px)</span>
                    <input
                      type="range"
                      min="9"
                      max="48"
                      value={activeStyle.size}
                      onChange={(e) => {
                        const newSize = Number(e.target.value)
                        setActiveStyle(prev => prev ? { ...prev, size: newSize } : null)
                        documentRef.current?.applyStyle({ size: newSize })
                      }}
                      className="w-full"
                    />
                  </div>

                  {/* Alignment buttons */}
                  <div>
                    <span className="field-label">المحاذاة</span>
                    <div className="flex gap-2">
                      <button
                        className={`align-btn ${activeStyle.align === 'right' ? 'active' : ''}`}
                        onClick={() => {
                          setActiveStyle(prev => prev ? { ...prev, align: 'right' } : null)
                          documentRef.current?.applyStyle({ align: 'right' })
                        }}
                      >
                        <AlignRight size={14} />
                      </button>
                      <button
                        className={`align-btn ${activeStyle.align === 'center' ? 'active' : ''}`}
                        onClick={() => {
                          setActiveStyle(prev => prev ? { ...prev, align: 'center' } : null)
                          documentRef.current?.applyStyle({ align: 'center' })
                        }}
                      >
                        <AlignCenter size={14} />
                      </button>
                      <button
                        className={`align-btn ${activeStyle.align === 'left' ? 'active' : ''}`}
                        onClick={() => {
                          setActiveStyle(prev => prev ? { ...prev, align: 'left' } : null)
                          documentRef.current?.applyStyle({ align: 'left' })
                        }}
                      >
                        <AlignLeft size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Color swatches */}
                  <div>
                    <span className="field-label">لون الخط</span>
                    <div className="flex gap-2 flex-wrap">
                      {COLOR_SWATCHES.map((c) => (
                        <button
                          key={c}
                          className={`swatch ${activeStyle.color === c ? 'active' : ''}`}
                          style={{ background: c }}
                          onClick={() => {
                            setActiveStyle(prev => prev ? { ...prev, color: c } : null)
                            documentRef.current?.applyStyle({ color: c })
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="divider" style={{ background: 'var(--border-gold)', height: '1px', margin: '0.5rem 0' }} />
                </div>
              )}

              <div>
                <p className="font-amiri text-lg font-bold" style={{ color: 'var(--navy-dark)' }}>
                  إعدادات الإجازة
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  انقر على النص في الإجازة لتعديل خصائصه وتنسيقه
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
              {/* Selected Element Controls (Only images are selectable elements now) */}
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
                <div className="flex items-center justify-between mt-2.5">
                  <Link href="/admin/assets" className="text-[10px] font-bold" style={{ color: 'var(--gold-main)' }}>
                    مكتبة الصور ↗
                  </Link>
                  <label
                    className="text-[10px] font-bold cursor-pointer"
                    style={{ color: 'var(--gold-main)' }}
                  >
                    {inlineUploading ? 'جاري الرفع...' : 'رفع صورة مباشرة ↑'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleInlineUpload}
                      disabled={inlineUploading}
                    />
                  </label>
                </div>
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
      )}

      {viewMode === 'form_editor' && (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden text-right" style={{ background: '#f7f2e7' }}>
          <style dangerouslySetInnerHTML={{ __html: `
            .panel { background:#fffdf8; border-left:1px solid #e7ddc4; }
            .panel-right { background:#fffdf8; border-right:1px solid #e7ddc4; }
            .content-bg { background-color:#f7f2e7; background-image: radial-gradient(rgba(184,146,58,0.10) 1px, transparent 1.4px); background-size:20px 20px; }

            .layer-row { display:flex; align-items:center; gap:0.5rem; padding:0.55rem 0.6rem; border-radius:0.55rem; cursor:pointer; transition:background .12s ease; text-align:right; }
            .layer-row:hover { background:#f3ecd8; }
            .layer-row.active { background:#f3e6c0; box-shadow: inset 2px 0 0 #c9a227; }

            .tool-btn { display:flex; align-items:center; justify-content:center; gap:0.5rem; padding:0.65rem; border-radius:0.7rem; border:1.5px dashed #c9a227; background:rgba(201,162,39,0.05); font-size:0.8rem; font-weight:700; color:#9c7a1f; width:100%; cursor:pointer; }
            .tool-btn:hover { background:rgba(201,162,39,0.12); }

            .field-select, .field-input { width:100%; font-size:0.82rem; padding:0.55rem 0.7rem; border-radius:0.5rem; border:1px solid #e0d6b8; background:#fffdf8; color:#1f2733; outline:none; text-align:right; }
            .field-select:focus, .field-input:focus { border-color:#c9a227; }
            .field-label { font-size:0.72rem; font-weight:700; color:#6b6457; margin-bottom:0.35rem; display:block; text-align:right; }

            .preview-input { width:100%; font-size:0.92rem; padding:0.7rem 0.9rem; border-radius:0.6rem; border:1px solid #e0d6b8; background:#fffdf8; outline:none; color:#1f2733; text-align:right; }
            .preview-input:focus { border-color:#c9a227; }

            .form-editor-option-item { display:flex; align-items:center; gap:0.5rem; margin-top:0.35rem; }
            .form-editor-option-dot { width:6px; height:6px; border-radius:9999px; background:#c9a227; }
          ` }} />

          {/* Right Panel (Fields List) */}
          <aside className="panel-right order-2 lg:order-1 w-full lg:w-72 flex-shrink-0 p-4 flex flex-col gap-4 overflow-y-auto" style={{ borderRight: '1px solid #e7ddc4', background: '#fffdf8' }}>
            <p className="field-label">حقول النموذج ({formFields.length})</p>
            <div className="flex flex-col gap-0.5">
              {formFields.map((f, index) => {
                const isCanvasField = !f.id.startsWith('extra-')
                const Icon = isCanvasField ? Sparkles : Plus
                const isActive = activeFieldId === f.id
                return (
                  <div
                    key={f.id}
                    className={`layer-row ${isActive ? "active" : ""}`}
                    onClick={() => setActiveFieldId(f.id)}
                  >
                    <GripVertical size={13} style={{ color: "#c2b896" }} />
                    <Icon size={14} style={{ color: isCanvasField ? "var(--gold-main)" : "#6b6457" }} />
                    <div className="flex-1 min-w-0 pr-1 text-right">
                      <p className="text-xs truncate font-medium" style={{ color: "#1f2733" }}>
                        {f.label}
                      </p>
                      {isCanvasField && (
                        <p className="text-[9px] truncate" style={{ color: "#a39c8c" }}>
                          حقل الشهادة الأساسي
                        </p>
                      )}
                    </div>
                    {f.required && (
                      <span className="text-[10px] font-bold" style={{ color: "#9c3b3b" }}>
                        *
                      </span>
                    )}
                    
                    {/* Move controls */}
                    <div className="flex gap-1 mr-auto">
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={(e) => { e.stopPropagation(); moveField(index, 'up'); }}
                        disabled={index === 0}
                        style={{ padding: 0, width: '1.2rem', height: '1.2rem' }}
                      >
                        <ChevronUp size={12} />
                      </button>
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={(e) => { e.stopPropagation(); moveField(index, 'down'); }}
                        disabled={index === formFields.length - 1}
                        style={{ padding: 0, width: '1.2rem', height: '1.2rem' }}
                      >
                        <ChevronDown size={12} />
                      </button>
                    </div>

                    {!isCanvasField && (
                      <button
                        className="icon-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteAdditionalField(f.id);
                        }}
                        style={{ padding: 0, width: '1.2rem', height: '1.2rem' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <button className="tool-btn" onClick={addAdditionalField}>
              <Plus size={15} />
              <span>إضافة حقل إضافي</span>
            </button>

            <div className="rounded-xl p-3 flex gap-2 mt-1 text-right" style={{ background: "#faf1de", border: "1px solid #ecdcae" }}>
              <Info size={14} style={{ color: "#b07a1f", flexShrink: 0, marginTop: 1 }} />
              <p className="text-[11px] leading-relaxed" style={{ color: "#7a5c1f" }}>
                الحقول المرتبطة بالشهادة لا يمكن حذفها من هنا (احذفها من تصميم الشهادة أولاً).
              </p>
            </div>
          </aside>

          <div className="order-1 lg:order-2 flex-1 overflow-auto p-6 lg:p-10 flex items-start justify-center content-bg">
            <div className="w-full" style={{ maxWidth: 440 }}>
              <div className="card-formal p-7 lg:p-9 text-right" style={{ background: '#fffdf8', border: '1px solid #e7ddc4', borderRadius: '16px' }}>
                <p className="text-xs font-semibold mb-1.5" style={{ color: "#b8923a" }}>
                  أكاديمية النور للعلوم الشرعية
                </p>
                <h2 className="font-amiri text-2xl font-bold mb-2" style={{ color: "#16243f" }}>
                  {templateName.startsWith('نموذج') ? templateName : `نموذج ${templateName}`}
                </h2>
                <p className="text-sm mb-7 leading-relaxed" style={{ color: "#6b6457" }}>
                  {description || 'يرجى تعبئة بياناتكم بدقة، حيث ستستخدم في إصدار الإجازة.'}
                </p>

                <div className="flex flex-col gap-5">
                  {formFields.map((f) => (
                    <div key={f.id} className="text-right">
                      <label className="text-sm font-semibold mb-1.5 block" style={{ color: "#1f2733" }}>
                        {f.label}
                        {f.required && (
                          <span style={{ color: "#9c3b3b" }}> *</span>
                        )}
                      </label>
                      {f.type === "textarea" ? (
                        <textarea className="preview-input" rows={3} placeholder={f.placeholder || ""} disabled />
                      ) : f.type === "select" ? (
                        <select className="preview-input" disabled>
                          <option>{f.placeholder || "اختر..."}</option>
                          {(f.options || []).map((o, idx) => (
                            <option key={idx}>{o}</option>
                          ))}
                        </select>
                      ) : (
                        <input className="preview-input" type={f.type === "date" ? "date" : "text"} placeholder={f.placeholder || ""} disabled />
                      )}
                    </div>
                  ))}
                  {formFields.length === 0 && (
                    <div className="text-center py-6 text-xs text-muted">
                      لا توجد حقول في الاستمارة حالياً.
                    </div>
                  )}
                </div>

                <button className="btn btn-gold w-full py-3 rounded-full text-sm mt-8" disabled style={{ opacity: 0.7 }}>إرسال وإصدار الإجازة</button>
              </div>
              <p className="text-center text-xs mt-3" style={{ color: "#9c948a" }}>
                هكذا ستظهر الاستمارة للطالب عند فتح الرابط
              </p>
            </div>
          </div>

          {/* Left Panel (Properties & Settings) */}
          <aside className="panel order-3 w-full lg:w-80 flex-shrink-0 p-5 overflow-y-auto text-right" style={{ borderLeft: '1px solid #e7ddc4', background: '#fffdf8' }}>
            {/* If no field is selected, show general form settings */}
            {!activeFieldId || !formFields.some(f => f.id === activeFieldId) ? (
              <div className="flex flex-col gap-6">
                <div>
                  <p className="font-amiri text-lg font-bold" style={{ color: "#16243f" }}>
                    إعدادات الاستمارة
                  </p>
                  <p className="text-xs mt-1" style={{ color: "#6b6457" }}>
                    انقر على أي حقل في القائمة الجانبية لتعديل خصائصه
                  </p>
                </div>

                <div>
                  <span className="field-label">وصف / تعليمات الاستمارة</span>
                  <textarea
                    className="field-select"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="اكتب تعليمات للطلاب تظهر أسفل عنوان الاستمارة..."
                  />
                </div>

                <div className="border-t pt-5" style={{ borderColor: "#e7ddc4" }}>
                  <span className="field-label flex items-center gap-1.5">
                    <Clock size={13} />
                    جدولة الإغلاق التلقائي
                  </span>
                  <div className="flex items-center justify-between mb-3 mt-2">
                    <div>
                      <p className="text-xs font-semibold" style={{ color: "#1f2733" }}>
                        تمكين الإغلاق التلقائي
                      </p>
                      <p className="text-[10px]" style={{ color: "#a39c8c" }}>
                        إيقاف الاستقبال تلقائيًا في وقت محدد
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAutoCloseEnabled(!autoCloseEnabled)}
                      className="switch-track"
                      style={{
                        position: 'relative',
                        width: '2.6rem',
                        height: '1.45rem',
                        borderRadius: '9999px',
                        flexShrink: 0,
                        transition: 'background .2s ease',
                        border: 'none',
                        cursor: 'pointer',
                        background: autoCloseEnabled ? "#16243f" : "#e0d6b8"
                      }}
                    >
                      <span
                        className="switch-knob"
                        style={{
                          position: 'absolute',
                          top: '0.18rem',
                          width: '1.1rem',
                          height: '1.1rem',
                          borderRadius: '9999px',
                          background: '#fff',
                          transition: 'left .2s ease',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                          left: autoCloseEnabled ? 'calc(100% - 1.3rem)' : '0.2rem'
                        }}
                      />
                    </button>
                  </div>
                  {autoCloseEnabled && (
                    <div
                      className="field-select cursor-pointer flex justify-between items-center"
                      onClick={() => setShowDatePicker(true)}
                      style={{ background: '#fffdf8', border: '1px solid #e0d6b8', padding: '0.65rem' }}
                    >
                      <span>{autoCloseAt ? autoCloseAt.replace('T', ' ') : 'اختر التاريخ والوقت...'}</span>
                      <Calendar size={14} />
                    </div>
                  )}
                </div>
              </div>
            ) : (() => {
              const selectedField = formFields.find(f => f.id === activeFieldId)!
              const isCanvasField = !selectedField.id.startsWith('extra-')

              return (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex w-fit items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: isCanvasField ? "#eef4ea" : "#f3e6c0", color: isCanvasField ? "#4f7d4a" : "#9c7a1f" }}>
                      {isCanvasField ? <Sparkles size={11} /> : <Plus size={11} />}
                      {isCanvasField ? "مرتبط بالشهادة" : "حقل إضافي للاستمارة"}
                    </span>
                    <button className="text-xs font-semibold" style={{ color: 'var(--gold-main)', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setActiveFieldId(null)}>
                      رجوع للإعدادات
                    </button>
                  </div>

                  <div>
                    <span className="field-label">نص السؤال</span>
                    <input
                      className="field-select"
                      value={selectedField.label}
                      onChange={(e) => {
                        if (isCanvasField) {
                          updateFormField(selectedField.id, { label: e.target.value })
                        } else {
                          updateAdditionalFieldLabel(selectedField.id, e.target.value)
                        }
                      }}
                    />
                  </div>

                  <div>
                    <span className="field-label">نوع الحقل</span>
                    <select
                      className="field-select"
                      value={selectedField.type}
                      onChange={(e) => {
                        const newType = e.target.value as any
                        const patch: Partial<FormField> = { type: newType }
                        if (newType === 'select') {
                          patch.options = ['الخيار الأول']
                        }
                        updateFormField(selectedField.id, patch)
                      }}
                    >
                      <option value="text">إجابة قصيرة (نص)</option>
                      <option value="textarea">إجابة طويلة (فقرة)</option>
                      <option value="date">تاريخ</option>
                      <option value="select">قائمة خيارات (Dropdown)</option>
                    </select>
                  </div>

                  {selectedField.type === 'select' ? (
                    <div className="border-t pt-4 mt-2" style={{ borderColor: '#e7ddc4' }}>
                      <span className="field-label">خيارات القائمة المنسدلة</span>
                      <div className="flex flex-col gap-2">
                        {(selectedField.options || ['الخيار الأول']).map((option, optIdx) => (
                          <div key={optIdx} className="form-editor-option-item">
                            <span className="form-editor-option-dot" />
                            <input
                              type="text"
                              className="field-input py-1 px-2 text-xs flex-1"
                              value={option}
                              onChange={(e) => updateOption(selectedField.id, optIdx, e.target.value)}
                              style={{ background: '#fff', border: '1px solid var(--border-gold)' }}
                            />
                            <button
                              type="button"
                              className="text-[#9c3b3b] hover:text-[#7a2e2e] text-xs font-bold px-1"
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                              onClick={() => removeOption(selectedField.id, optIdx)}
                            >
                              حذف
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          className="text-xs font-bold mt-1 inline-flex items-center gap-1 hover:text-[#16243f]"
                          style={{ color: 'var(--gold-main)', background: 'none', border: 'none', cursor: 'pointer', width: 'fit-content' }}
                          onClick={() => addOption(selectedField.id)}
                        >
                          <span>+ إضافة خيار جديد</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <span className="field-label">نص توضيحي (Placeholder)</span>
                      <input
                        className="field-select"
                        value={selectedField.placeholder || ""}
                        onChange={(e) => updateFormField(selectedField.id, { placeholder: e.target.value })}
                        placeholder="مثال: اكتب هنا..."
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t pt-4 mt-2" style={{ borderColor: '#e7ddc4' }}>
                    <p className="text-sm font-semibold" style={{ color: "#1f2733" }}>
                      حقل إجباري (مطلوب)
                    </p>
                    <button
                      type="button"
                      onClick={() => updateFormField(selectedField.id, { required: !selectedField.required })}
                      className="switch-track"
                      style={{
                        position: 'relative',
                        width: '2.6rem',
                        height: '1.45rem',
                        borderRadius: '9999px',
                        flexShrink: 0,
                        transition: 'background .2s ease',
                        border: 'none',
                        cursor: 'pointer',
                        background: selectedField.required ? "#16243f" : "#e0d6b8"
                      }}
                    >
                      <span
                        className="switch-knob"
                        style={{
                          position: 'absolute',
                          top: '0.18rem',
                          width: '1.1rem',
                          height: '1.1rem',
                          borderRadius: '9999px',
                          background: '#fff',
                          transition: 'left .2s ease',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                          left: selectedField.required ? 'calc(100% - 1.3rem)' : '0.2rem'
                        }}
                      />
                    </button>
                  </div>

                  {!isCanvasField && (
                    <button
                      className="text-xs font-semibold inline-flex items-center gap-1.5 mt-4 text-[#9c3b3b] hover:text-[#7a2e2e]"
                      style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                      onClick={() => deleteAdditionalField(selectedField.id)}
                    >
                      <Trash2 size={13} />
                      <span>حذف هذا الحقل بالكامل</span>
                    </button>
                  )}
                </div>
              )
            })()}
          </aside>
        </div>
      )}

      {viewMode === 'responses' && (
        <div className="flex-1 overflow-y-auto content-bg py-6 px-4 lg:px-8 text-right" style={{ background: '#f7f2e7' }}>
          <style dangerouslySetInnerHTML={{ __html: `
            .resp-table { width:100%; border-collapse:separate; border-spacing:0; }
            .resp-table th { text-align:right; font-size:0.74rem; font-weight:700; color:#6b6457; padding:0 0.9rem 0.7rem; white-space:nowrap; }
            .resp-table td { padding:0.8rem 0.9rem; border-top:1px solid #efe9da; font-size:0.85rem; vertical-align:middle; }
            .resp-table tr:hover td { background:#faf7ee; }
          ` }} />
          <div className="card-formal p-5" style={{ background: '#fffdf8', border: '1px solid #e7ddc4', borderRadius: '14px' }}>
            {/* Control Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-full border flex-1 sm:max-w-xs" style={{ borderColor: "#e0d6b8", background: "#fffdf8" }}>
                <Search size={15} className="opacity-50" />
                <input
                  value={submissionsQuery}
                  onChange={(e) => {
                    setSubmissionsQuery(e.target.value)
                    setSubmissionsPage(1)
                  }}
                  placeholder="ابحث باسم الطالب..."
                  className="bg-transparent outline-none text-sm flex-1 placeholder:opacity-60 text-right"
                  style={{ border: 'none' }}
                />
              </div>
              <div className="flex items-center gap-5">
                <p className="text-sm" style={{ color: "#6b6457" }}>
                  إجمالي الردود: <span className="font-bold" style={{ color: "#16243f" }}>{submissions ? submissions.length : 0}</span>
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold" style={{ color: "#1f2733" }}>
                    استقبال الردود
                  </span>
                  <button
                    type="button"
                    onClick={() => handleToggleIsOpen(cert?.is_open ?? false)}
                    className="switch-track"
                    style={{
                      position: 'relative',
                      width: '2.6rem',
                      height: '1.45rem',
                      borderRadius: '9999px',
                      flexShrink: 0,
                      transition: 'background .2s ease',
                      border: 'none',
                      cursor: 'pointer',
                      background: cert?.is_open ? "#16243f" : "#e0d6b8"
                    }}
                  >
                    <span
                      className="switch-knob"
                      style={{
                        position: 'absolute',
                        top: '0.18rem',
                        width: '1.1rem',
                        height: '1.1rem',
                        borderRadius: '9999px',
                        background: '#fff',
                        transition: 'left .2s ease',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                        left: cert?.is_open ? 'calc(100% - 1.3rem)' : '0.2rem'
                      }}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Bulk Action Bar */}
            {selectedSubmissionIds.length > 0 && (
              <div className="flex items-center justify-between gap-3 mb-4 px-4 py-2.5 rounded-xl" style={{ background: "#f3e6c0" }}>
                <p className="text-sm font-semibold" style={{ color: "#16243f" }}>
                  {selectedSubmissionIds.length} محدد
                </p>
                <div className="flex items-center gap-2">
                  <button
                    className="btn btn-secondary px-3.5 py-1.5 rounded-full text-xs flex items-center gap-1.5"
                    style={{ background: "#fffdf8" }}
                    onClick={handleDownloadSelectedCsv}
                  >
                    <Download size={13} />
                    تنزيل المحدد
                  </button>
                </div>
              </div>
            )}

            {/* Table */}
            {submissionsLoading ? (
              <div className="text-center py-10 text-xs text-muted">جاري تحميل الردود...</div>
            ) : !submissions || submissions.length === 0 ? (
              <div className="text-center py-10 text-xs text-muted">لا توجد ردود مستلمة بعد.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="resp-table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'right', fontSize: '0.74rem', fontWeight: 700, color: '#6b6457', padding: '0 0.9rem 0.7rem' }}>
                        <input
                          type="checkbox"
                          checked={submissions && submissions.length > 0 && selectedSubmissionIds.length === submissions.length}
                          onChange={(e) => {
                            if (e.target.checked && submissions) {
                              setSelectedSubmissionIds(submissions.map(s => s.id))
                            } else {
                              setSelectedSubmissionIds([])
                            }
                          }}
                          style={{ accentColor: "#16243f" }}
                        />
                      </th>
                      <th style={{ textAlign: 'right', fontSize: '0.74rem', fontWeight: 700, color: '#6b6457', padding: '0 0.9rem 0.7rem' }}>#</th>
                      <th style={{ textAlign: 'right', fontSize: '0.74rem', fontWeight: 700, color: '#6b6457', padding: '0 0.9rem 0.7rem' }}>تاريخ الإرسال</th>
                      {formFields.map((f) => (
                        <th key={f.id} style={{ textAlign: 'right', fontSize: '0.74rem', fontWeight: 700, color: '#6b6457', padding: '0 0.9rem 0.7rem' }}>{f.label}</th>
                      ))}
                      <th style={{ textAlign: 'right', fontSize: '0.74rem', fontWeight: 700, color: '#6b6457', padding: '0 0.9rem 0.7rem' }}>الإجازة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions
                      .filter((r) => {
                        const studentName = r.data['اسم الطالب'] || Object.values(r.data)[0] || '';
                        return String(studentName).includes(submissionsQuery.trim());
                      })
                      .map((sub: any, idx: number) => {
                        return (
                          <tr key={sub.id} className="hover:bg-[#faf7ee]">
                            <td style={{ padding: '0.8rem 0.9rem', borderTop: '1px solid #efe9da', verticalAlign: 'middle' }}>
                              <input
                                type="checkbox"
                                checked={selectedSubmissionIds.includes(sub.id)}
                                onChange={() => {
                                  setSelectedSubmissionIds(prev =>
                                    prev.includes(sub.id) ? prev.filter(x => x !== sub.id) : [...prev, sub.id]
                                  )
                                }}
                                style={{ accentColor: "#16243f" }}
                              />
                            </td>
                            <td style={{ padding: '0.8rem 0.9rem', borderTop: '1px solid #efe9da', verticalAlign: 'middle', color: '#6b6457' }}>{idx + 1}</td>
                            <td style={{ padding: '0.8rem 0.9rem', borderTop: '1px solid #efe9da', verticalAlign: 'middle', color: '#6b6457' }}>
                              {new Date(sub.created_at).toLocaleDateString('ar-SA')} {new Date(sub.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            {formFields.map((f) => (
                              <td key={f.id} style={{ padding: '0.8rem 0.9rem', borderTop: '1px solid #efe9da', verticalAlign: 'middle', fontWeight: 500, color: '#1f2733' }}>
                                {sub.data?.[f.variable] || '—'}
                              </td>
                            ))}
                            <td style={{ padding: '0.8rem 0.9rem', borderTop: '1px solid #efe9da', verticalAlign: 'middle' }}>
                              <button
                                className="flex items-center gap-2"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', outline: 'none' }}
                                onClick={() => setViewingSubmission(sub)}
                              >
                                <svg viewBox="0 0 60 40" className="w-12 h-8 flex-shrink-0">
                                  <rect x="1" y="1" width="58" height="38" rx="2" fill="#fffdf8" stroke="#c9a227" strokeWidth="1.2" />
                                  <rect x="14" y="9" width="32" height="2.2" rx="1" fill="#16243f" opacity="0.7" />
                                  <rect x="10" y="16" width="40" height="1.4" rx="0.7" fill="#16243f" opacity="0.25" />
                                  <rect x="16" y="21" width="28" height="1.4" rx="0.7" fill="#16243f" opacity="0.25" />
                                  <circle cx="16" cy="31" r="5" fill="#f3e6c0" stroke="#b8923a" strokeWidth="1" />
                                </svg>
                                <span className="text-xs font-semibold" style={{ color: "#b8923a" }}>
                                  عرض
                                </span>
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            )}
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

      {/* Dynamic Certificate Preview Modal for Submissions */}
      <CertificateModal
        response={viewingSubmission}
        onClose={() => setViewingSubmission(null)}
        cert={cert}
        responseCertRef={responseCertRef}
        onDownloadPdf={() => handleDownloadPdfForSubmission(viewingSubmission)}
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

// CertificateModal helper component definition
interface CertificateModalProps {
  response: any
  onClose: () => void
  cert: Certificate | null
  responseCertRef: React.RefObject<HTMLDivElement | null>
  onDownloadPdf: () => void
}

function replacePlaceholders(html: string, formData: Record<string, string>): string {
  let replaced = html
  Object.entries(formData || {}).forEach(([key, value]) => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
    replaced = replaced.replace(regex, value)
  })
  return replaced
}

function CertificateModal({ response, onClose, cert, responseCertRef, onDownloadPdf }: CertificateModalProps) {
  if (!response || !cert) return null

  let isJsonTemplate = false
  let builderConfig: any = null
  try {
    if (cert.template_html && cert.template_html.startsWith('{')) {
      builderConfig = JSON.parse(cert.template_html)
      isJsonTemplate = true
    }
  } catch {}

  return (
    <div className="modal-overlay" onClick={onClose}>
      <style dangerouslySetInnerHTML={{ __html: `
        .modal-overlay { position:fixed; inset:0; background:rgba(15,26,48,0.55); display:flex; align-items:center; justify-content:center; z-index:100; padding:1rem; }
        .modal-card { background:#fffdf8; border-radius:18px; width:100%; box-shadow:0 24px 60px -20px rgba(15,26,48,0.5); border:1px solid #e7ddc4; }
        .certificate-a4 { box-shadow: 0 10px 30px rgba(22, 36, 63, 0.15); border-radius: 4px; overflow: hidden; background: #fffdf8; }
        .btn-gold { background:linear-gradient(180deg,#d9b94a,#b8923a); color:#16243f; font-weight:800; border:none; cursor:pointer; }
        .btn-outline { border:1.5px solid #d6cdb0; color:#4a4538; background:transparent; font-weight:600; cursor:pointer; }
      ` }} />
      <div className="modal-card" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-6 pb-2 text-right">
          <h3 className="font-amiri text-xl font-bold" style={{ color: "#16243f" }}>
            معاينة الإجازة للطلب
          </h3>
          <button className="icon-btn" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div className="px-6 pb-2 flex justify-center overflow-auto">
          {isJsonTemplate && builderConfig ? (
            <div
              ref={responseCertRef}
              className="certificate-a4 relative flex-shrink-0"
              style={{
                background: builderConfig.bg || '#fffdf8',
                aspectRatio: builderConfig.orientation === 'landscape' ? '1.414 / 1' : '1 / 1.414',
                width: builderConfig.orientation === 'landscape' ? '480px' : '340px',
                height: builderConfig.orientation === 'landscape' ? '340px' : '480px',
                border: '1px solid var(--border-gold)',
                position: 'relative',
                overflow: 'hidden'
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
                className="absolute flex flex-col justify-center gap-1 text-right pointer-events-none"
                style={{
                  left: '8%',
                  right: '8%',
                  top: '8%',
                  bottom: '8%',
                  direction: 'rtl',
                  zIndex: 2,
                }}
                dangerouslySetInnerHTML={{
                  __html: replacePlaceholders(builderConfig.html || '', response.data)
                }}
              />

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
            <div className="p-10 text-center text-xs text-muted">
              هذه الإجازة تستخدم قالباً قديماً غير مدعوم للمعاينة المباشرة هنا.
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 px-6 pb-6 pt-4">
          <button className="btn-outline flex-1 py-2.5 rounded-full text-sm" onClick={onClose}>
            إغلاق
          </button>
          <button className="btn-gold flex-1 py-2.5 rounded-full text-sm flex items-center justify-center gap-1.5" onClick={onDownloadPdf}>
            <Download size={14} />
            تنزيل PDF
          </button>
        </div>
      </div>
    </div>
  )
}

