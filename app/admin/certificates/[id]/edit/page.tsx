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

        {/* أزرار التبديل بين الإجازة والاستمارة */}
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
            الإجازة
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
                            style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              outline: 'none',
                              boxShadow: 'none',
                              padding: '0 0.5rem'
                            }}
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
                          style={{
                            borderColor: 'var(--border-gold)',
                            background: 'transparent',
                            borderTop: 'none',
                            borderBottom: 'none',
                            borderLeft: 'none',
                            padding: '0 0.75rem 0 0',
                            cursor: 'pointer',
                            outline: 'none',
                            boxShadow: 'none',
                          }}
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
