'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Certificate, FormField, Asset } from '@/lib/types'
import {
  ArrowRight,
  Save,
  Eye,
  Sparkles,
  Info,
  Plus,
  Trash2,
  MoreVertical,
  Search,
  Download,
  FileText,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  Stamp,
  PenTool,
  Link2,
  Copy,
  Clock,
  Lock,
  Bold,
  Italic,
  Underline,
  AlignRight,
  AlignCenter,
  AlignLeft,
  Undo2,
  Redo2,
  Type,
  Image as ImageIcon,
  Calendar,
  List,
  Hash,
  Mail,
  GripVertical,
  ChevronDown
} from 'lucide-react'

import DateTimePickerModal, { MONTH_NAMES, getHour12 } from './DateTimePickerModal'

/* ====================================================================== */
/*  بيانات وثوابت مشتركة                                                  */
/* ====================================================================== */

const COLOR_SWATCHES = ['#16243f', '#b8923a', '#1f2733', '#7a2e2e']
const BG_SWATCHES = ['#fffdf8', '#f7f2e7', '#f3ecd8', '#f0f0ec']

const INITIAL_PAGE_HTML = `
  <div style="text-align:center; font-family:'Tajawal',sans-serif; font-size:14px; color:#6b6457; font-weight:500;">أكاديمية النور للعلوم الشرعية</div>
  <div style="text-align:center; font-family:'Amiri',serif; font-size:32px; font-weight:700; color:#16243f; margin-top:18px;">إجازة حفظ القرآن الكريم</div>
  <div style="text-align:center; font-family:'Tajawal',sans-serif; font-size:14px; color:#6b6457; margin-top:24px;">تشهد الأكاديمية بأنّ الطالب/ـة</div>
  <div style="text-align:center; font-family:'Amiri',serif; font-size:26px; font-weight:700; color:#b8923a; margin-top:14px;"><span contenteditable="false" class="field-chip">{ اسم الطالب }</span></div>
  <div style="text-align:center; font-family:'Tajawal',sans-serif; font-size:14px; color:#1f2733; margin-top:20px; line-height:2;">قد أتمّ/ـت بنجاح حفظ جزء عمّ كاملاً بإتقان وضبط، بتاريخ <span contenteditable="false" class="field-chip">{ تاريخ الإصدار }</span></div>
  <div style="text-align:center; font-family:'Tajawal',sans-serif; font-size:11px; color:#a39c8c; margin-top:55px;">رقم الإجازة: <span contenteditable="false" class="field-chip">{ رقم الإجازة }</span></div>
`

const TYPE_OPTIONS = [
  { value: 'text', label: 'نص قصير', icon: Type },
  { value: 'textarea', label: 'نص طويل', icon: AlignLeft },
  { value: 'date', label: 'تاريخ', icon: Calendar },
  { value: 'number', label: 'رقم', icon: Hash },
  { value: 'email', label: 'بريد إلكتروني', icon: Mail },
  { value: 'select', label: 'قائمة منسدلة', icon: List },
]

function fieldIcon(type: string) {
  return (TYPE_OPTIONS.find((t) => t.value === type) || TYPE_OPTIONS[0]).icon
}

const PAGE_SIZE = 8

/* ====================================================================== */
/*  مكونات مساعدة                                                          */
/* ====================================================================== */

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="switch-track"
      style={{
        background: checked ? '#16243f' : '#e0d6b8',
        border: 'none',
        outline: 'none',
        cursor: 'pointer'
      }}
    >
      <span className="switch-knob" style={{ left: checked ? 'calc(100% - 1.3rem)' : '0.2rem' }} />
    </button>
  )
}

function MiniCert() {
  return (
    <svg viewBox="0 0 60 40" className="w-12 h-8 flex-shrink-0">
      <rect x="1" y="1" width="58" height="38" rx="2" fill="#fffdf8" stroke="#c9a227" strokeWidth="1.2" />
      <rect x="14" y="9" width="32" height="2.2" rx="1" fill="#16243f" opacity="0.7" />
      <rect x="10" y="16" width="40" height="1.4" rx="0.7" fill="#16243f" opacity="0.25" />
      <rect x="16" y="21" width="28" height="1.4" rx="0.7" fill="#16243f" opacity="0.25" />
      <circle cx="16" cy="31" r="5" fill="#f3e6c0" stroke="#b8923a" strokeWidth="1" />
    </svg>
  )
}

interface CertificateModalProps {
  response: any
  onClose: () => void
  cert: Certificate | null
  responseCertRef: React.RefObject<HTMLDivElement | null>
  onDownloadPdf: () => void
  onDelete: (r: any) => void
}

function replacePlaceholders(html: string, formData: Record<string, string>): string {
  let replaced = html
  
  // Replace visual span field chips like: <span contenteditable="false" class="field-chip">{ field }</span>
  replaced = replaced.replace(/<span[^>]*class="field-chip"[^>]*>\s*\{\s*([^}]+)\s*\}\s*<\/span>/g, (match, fieldName) => {
    const key = fieldName.trim()
    return formData[key] !== undefined ? formData[key] : match
  })

  // Replace standard {{ field }} or { field } variables
  Object.entries(formData || {}).forEach(([key, value]) => {
    const escapedKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
    const regexDouble = new RegExp(`{{\\s*${escapedKey}\\s*}}`, 'g')
    replaced = replaced.replace(regexDouble, value)
    
    const regexSingle = new RegExp(`{\\s*${escapedKey}\\s*}`, 'g')
    replaced = replaced.replace(regexSingle, value)
  })

  return replaced
}

function getPagesFromHtml(htmlStr: string): string[] {
  if (!htmlStr) return ['']
  if (htmlStr.includes('cert-page-content')) {
    const pageRegex = /<div class="cert-page-content">([\s\S]*?)<\/div>/g
    const list: string[] = []
    let m
    while ((m = pageRegex.exec(htmlStr)) !== null) {
      list.push(m[1])
    }
    return list.length > 0 ? list : ['']
  }
  return [htmlStr]
}

const FONT_OPTIONS = [
  { value: "'Amiri', serif", label: 'Amiri (نص تجريبي)' },
  { value: "'Tajawal', sans-serif", label: 'Tajawal (نص تجريبي)' },
  { value: "'Cairo', sans-serif", label: 'Cairo (نص تجريبي)' },
  { value: "'Reem Kufi', sans-serif", label: 'Reem Kufi (نص تجريبي)' },
  { value: "'Aref Ruqaa', serif", label: 'Aref Ruqaa (نص تجريبي)' },
  { value: "'Lalezar', cursive", label: 'Lalezar (نص تجريبي)' },
  { value: "'El Messiri', sans-serif", label: 'El Messiri (نص تجريبي)' },
  { value: "'Changa', sans-serif", label: 'Changa (نص تجريبي)' },
  { value: "'Almarai', sans-serif", label: 'Almarai (نص تجريبي)' },
  { value: "'Marhey', sans-serif", label: 'Marhey (نص تجريبي)' },
  { value: "'Scheherazade New', serif", label: 'Scheherazade New (نص تجريبي)' },
]

const SIZE_OPTIONS = [11, 12, 14, 16, 18, 22, 26, 32, 38, 48, 56, 64]

function CertificateModal({ response, onClose, cert, responseCertRef, onDownloadPdf, onDelete }: CertificateModalProps) {
  if (!response || !cert) return null
  
  let bg = '#fffdf8'
  let orientation = 'landscape'
  let html = INITIAL_PAGE_HTML
  
  if (cert.template_html && cert.template_html.startsWith('{')) {
    try {
      const config = JSON.parse(cert.template_html)
      bg = config.bg || '#fffdf8'
      orientation = config.orientation || 'landscape'
      html = config.html || INITIAL_PAGE_HTML
    } catch {}
  } else if (cert.template_html) {
    html = cert.template_html
  }

  const displayData = { ...response.data }
  if (response.certificate_no) {
    displayData['رقم الإجازة'] = response.certificate_no
  } else {
    displayData['رقم الإجازة'] = 'IJ-2026-XXXX'
  }
  
  if (!displayData['تاريخ الإصدار']) {
    displayData['تاريخ الإصدار'] = new Date(response.created_at || new Date()).toLocaleDateString('ar-SA')
  }

  const replacedHtml = replacePlaceholders(html, displayData)
  
  const modalPages: string[] = []
  if (replacedHtml.includes('cert-page-content')) {
    const pageRegex = /<div class="cert-page-content">([\s\S]*?)<\/div>/g
    let m
    while ((m = pageRegex.exec(replacedHtml)) !== null) {
      modalPages.push(m[1])
    }
  }
  if (modalPages.length === 0) {
    modalPages.push(replacedHtml)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: 900 }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <h3 className="font-amiri text-xl font-bold" style={{ color: 'var(--navy-dark)' }}>
            معاينة الإجازة للطلب
          </h3>
          <button className="icon-btn" style={{ background: 'transparent', border: 'none', cursor: 'pointer' }} onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        
        <div className="px-6 py-2 flex flex-col gap-6 items-center bg-[#ece6d4]" style={{ overflow: 'auto', maxHeight: '60vh', width: '100%' }}>
          <div ref={responseCertRef} className="flex flex-col gap-6 items-center w-full">
            {modalPages.map((pageHtml, idx) => (
              <div
                key={idx}
                className="certificate-page font-amiri relative overflow-hidden flex-shrink-0"
                style={{
                  background: bg,
                  width: '100%',
                  maxWidth: orientation === 'landscape' ? '880px' : '620px',
                  aspectRatio: orientation === 'landscape' ? '1.4142 / 1' : '1 / 1.4142',
                  border: '2px solid #c9a227',
                  borderRadius: '4px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
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
                    zIndex: 1,
                  }}
                />

                {/* Content Layer */}
                <div
                  className="absolute inset-0 text-right pointer-events-none"
                  style={{
                    padding: '12% 12%',
                    zIndex: 2,
                    direction: 'rtl',
                  }}
                  dangerouslySetInnerHTML={{ __html: pageHtml }}
                />
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-3 px-6 pb-6 pt-4">
          <button className="btn-outline-red flex-1 py-2.5 rounded-full text-sm flex items-center justify-center gap-1.5" onClick={() => onDelete(response)}>
            <Trash2 size={14} />
            حذف الإجازة
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

function extractPlaceholders(html: string): string[] {
  const matches: string[] = []
  
  // 1. Match visual field chips:
  const spanRegex = /<span[^>]*class="field-chip"[^>]*>\s*\{\s*([^}]+)\s*\}\s*<\/span>/g
  let spanMatch
  while ((spanMatch = spanRegex.exec(html)) !== null) {
    const key = spanMatch[1].trim()
    if (key && !matches.includes(key)) {
      matches.push(key)
    }
  }

  // 2. Match standard double curly braces {{ field }} in the text (if any)
  const curlyRegex = /\{\{([^}]+)\}\}/g
  const cleanText = html.replace(/<[^>]*>/g, ' ')
  let curlyMatch
  while ((curlyMatch = curlyRegex.exec(cleanText)) !== null) {
    const key = curlyMatch[1].trim()
    if (key && !matches.includes(key)) {
      matches.push(key)
    }
  }

  return matches
}

/* ====================================================================== */
/*  مساعدات الألوان والتحويلات                                              */
/* ====================================================================== */

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) => {
    const hex = Math.max(0, Math.min(255, c)).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function hexToRgb(hex: string) {
  const cleanHex = hex.replace('#', '')
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16)
    const g = parseInt(cleanHex[1] + cleanHex[1], 16)
    const b = parseInt(cleanHex[2] + cleanHex[2], 16)
    return { r, g, b }
  } else if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16)
    const g = parseInt(cleanHex.substring(2, 4), 16)
    const b = parseInt(cleanHex.substring(4, 6), 16)
    return { r, g, b }
  }
  return { r: 0, g: 0, b: 0 }
}

function rgbToHsv(r: number, g: number, b: number) {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  const s = max === 0 ? 0 : d / max
  const v = max

  if (max !== min) {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h /= 6
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), v: Math.round(v * 100) }
}

function hsvToRgb(h: number, s: number, v: number) {
  s /= 100
  v /= 100
  const c = v * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v - c
  let r = 0, g = 0, b = 0
  if (0 <= h && h < 60) {
    r = c; g = x; b = 0
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x
  }
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  }
}

function rgbStrToHex(rgbStr: string): string {
  if (!rgbStr) return '#1f2733'
  const m = rgbStr.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/)
  if (m) {
    const r = parseInt(m[1], 10)
    const g = parseInt(m[2], 10)
    const b = parseInt(m[3], 10)
    return rgbToHex(r, g, b)
  }
  return rgbStr
}

function getContrastColor(hex: string): string {
  if (!hex) return '#ffffff'
  const rgb = hexToRgb(hex)
  const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000
  return brightness > 125 ? '#1f2733' : '#ffffff'
}

const PRESET_COLORS = [
  '#ffffff', '#f3f4f6', '#e5e7eb', '#d1d5db', '#9ca3af', '#6b7280', '#4b5563', '#374151', '#1f2937', '#111827',
  '#fee2e2', '#ffedd5', '#fef9c3', '#dcfce7', '#ccfbf1', '#e0f2fe', '#dbeafe', '#e0e7ff', '#f3e8ff', '#fae8ff',
  '#fca5a5', '#fdbb2d', '#fde047', '#86efac', '#5eead4', '#7dd3fc', '#93c5fd', '#a5b4fc', '#c084fc', '#f472b6',
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#0ea5e9', '#3b82f6', '#6366f1', '#a855f7', '#ec4899',
  '#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#0d9488', '#0284c7', '#2563eb', '#4f46e5', '#9333ea', '#db2777',
  '#991b1b', '#9a3412', '#854d0e', '#166534', '#115e59', '#075985', '#1e40af', '#3730a3', '#6b21a8', '#9d174d',
]

interface SpectrumColorPickerModalProps {
  isOpen: boolean
  initialColor: string
  onClose: () => void
  onSelectColor: (color: string) => void
}

function SpectrumColorPickerModal({ isOpen, initialColor, onClose, onSelectColor }: SpectrumColorPickerModalProps) {
  const svRef = useRef<HTMLDivElement>(null)
  const [hue, setHue] = useState(0)
  const [sat, setSat] = useState(100)
  const [val, setVal] = useState(100)

  const [hexInput, setHexInput] = useState('#ffffff')
  const [rInput, setRInput] = useState('255')
  const [gInput, setGInput] = useState('255')
  const [bInput, setBInput] = useState('255')

  useEffect(() => {
    if (isOpen) {
      const color = initialColor || '#1f2733'
      const rgb = hexToRgb(color)
      const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b)
      setHue(hsv.h)
      setSat(hsv.s)
      setVal(hsv.v)

      setHexInput(color)
      setRInput(rgb.r.toString())
      setGInput(rgb.g.toString())
      setBInput(rgb.b.toString())
    }
  }, [isOpen, initialColor])

  if (!isOpen) return null

  const syncFromHsv = (h: number, s: number, v: number) => {
    const rgb = hsvToRgb(h, s, v)
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b)
    setHexInput(hex)
    setRInput(rgb.r.toString())
    setGInput(rgb.g.toString())
    setBInput(rgb.b.toString())
  }

  const handleSvMove = (clientX: number, clientY: number) => {
    if (!svRef.current) return
    const rect = svRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left))
    const y = Math.max(0, Math.min(rect.height, clientY - rect.top))
    const s = Math.round((x / rect.width) * 100)
    const v = Math.round((1 - y / rect.height) * 100)
    setSat(s)
    setVal(v)
    syncFromHsv(hue, s, v)
  }

  const handleSvMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    handleSvMove(e.clientX, e.clientY)

    const handleMouseMove = (moveEvent: MouseEvent) => {
      handleSvMove(moveEvent.clientX, moveEvent.clientY)
    }

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  const handleHueChange = (newHue: number) => {
    setHue(newHue)
    syncFromHsv(newHue, sat, val)
  }

  const handleHexChange = (valStr: string) => {
    setHexInput(valStr)
    const cleanHex = valStr.replace('#', '')
    if (cleanHex.length === 6 || cleanHex.length === 3) {
      const rgb = hexToRgb(valStr)
      const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b)
      setHue(hsv.h)
      setSat(hsv.s)
      setVal(hsv.v)
      setRInput(rgb.r.toString())
      setGInput(rgb.g.toString())
      setBInput(rgb.b.toString())
    }
  }

  const handleRgbChange = (channel: 'r' | 'g' | 'b', valStr: string) => {
    let r = parseInt(channel === 'r' ? valStr : rInput, 10) || 0
    let g = parseInt(channel === 'g' ? valStr : gInput, 10) || 0
    let b = parseInt(channel === 'b' ? valStr : bInput, 10) || 0

    r = Math.max(0, Math.min(255, r))
    g = Math.max(0, Math.min(255, g))
    b = Math.max(0, Math.min(255, b))

    if (channel === 'r') setRInput(valStr)
    else if (channel === 'g') setGInput(valStr)
    else if (channel === 'b') setBInput(valStr)

    const hsv = rgbToHsv(r, g, b)
    setHue(hsv.h)
    setSat(hsv.s)
    setVal(hsv.v)
    setHexInput(rgbToHex(r, g, b))
  }

  const currentRgb = hsvToRgb(hue, sat, val)
  const currentHex = rgbToHex(currentRgb.r, currentRgb.g, currentRgb.b)

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }} onClick={onClose}>
      <div
        className="modal-card p-5"
        style={{ maxWidth: 320, background: '#fffdf8', direction: 'rtl', borderRadius: '14px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h4 className="font-amiri text-base font-bold mb-3 text-right" style={{ color: 'var(--navy-dark)' }}>
          منتقي الألوان المخصص
        </h4>

        {/* SV box */}
        <div
          ref={svRef}
          onMouseDown={handleSvMouseDown}
          style={{
            position: 'relative',
            width: '100%',
            height: '150px',
            backgroundColor: `hsl(${hue}, 100%, 50%)`,
            borderRadius: '8px',
            overflow: 'hidden',
            cursor: 'crosshair',
            userSelect: 'none'
          }}
        >
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, #fff, transparent)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #000, transparent)' }} />
          <div
            style={{
              position: 'absolute',
              width: '12px',
              height: '12px',
              borderRadius: '9999px',
              border: '2px solid #fff',
              boxShadow: '0 0 0 1px rgba(0,0,0,0.5)',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              left: `${sat}%`,
              top: `${100 - val}%`,
              backgroundColor: 'transparent'
            }}
          />
        </div>

        {/* Hue range input */}
        <div className="mt-3">
          <input
            type="range"
            min="0"
            max="360"
            value={hue}
            onChange={(e) => handleHueChange(parseInt(e.target.value, 10))}
            style={{
              width: '100%',
              height: '10px',
              borderRadius: '9999px',
              outline: 'none',
              appearance: 'none',
              cursor: 'pointer',
              background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)'
            }}
          />
        </div>

        {/* Preview and Text fields */}
        <div className="flex items-center gap-3 mt-4">
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '9999px',
              backgroundColor: currentHex,
              border: '1.5px solid #d6cdb0',
              flexShrink: 0,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          />

          <div className="flex-1 flex flex-col gap-0.5 text-right">
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'bold' }}>سداسي عشري</span>
            <input
              type="text"
              value={hexInput}
              onChange={(e) => handleHexChange(e.target.value)}
              className="field-input"
              style={{
                fontFamily: 'monospace',
                fontSize: '11px',
                padding: '4px 6px',
                borderRadius: '6px',
                textAlign: 'left',
                direction: 'ltr'
              }}
            />
          </div>
        </div>

        {/* RGB fields */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '12px' }}>
          <div className="flex flex-col gap-0.5 text-right">
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'bold' }}>أحمر (R)</span>
            <input
              type="number"
              min="0"
              max="255"
              value={rInput}
              onChange={(e) => handleRgbChange('r', e.target.value)}
              className="field-input text-center"
              style={{ fontSize: '11px', padding: '4px 6px', borderRadius: '6px' }}
            />
          </div>
          <div className="flex flex-col gap-0.5 text-right">
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'bold' }}>أخضر (G)</span>
            <input
              type="number"
              min="0"
              max="255"
              value={gInput}
              onChange={(e) => handleRgbChange('g', e.target.value)}
              className="field-input text-center"
              style={{ fontSize: '11px', padding: '4px 6px', borderRadius: '6px' }}
            />
          </div>
          <div className="flex flex-col gap-0.5 text-right">
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'bold' }}>أزرق (B)</span>
            <input
              type="number"
              min="0"
              max="255"
              value={bInput}
              onChange={(e) => handleRgbChange('b', e.target.value)}
              className="field-input text-center"
              style={{ fontSize: '11px', padding: '4px 6px', borderRadius: '6px' }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t" style={{ borderColor: '#efe9da' }}>
          <button
            type="button"
            className="btn-gold flex-1 py-1.5 rounded-lg text-xs"
            onClick={() => onSelectColor(currentHex)}
          >
            حسناً
          </button>
          <button
            type="button"
            className="btn-outline flex-1 py-1.5 rounded-lg text-xs"
            onClick={onClose}
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  )
}

/* ====================================================================== */
/*  الصفحة الرئيسية                                                       */
/* ====================================================================== */

export default function CertificateBuilderPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [cert, setCert] = useState<Certificate | null>(null)
  const [templateName, setTemplateName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [assets, setAssets] = useState<Asset[]>([])
  const [submissions, setSubmissions] = useState<any[] | null>(null)
  const [submissionsLoading, setSubmissionsLoading] = useState(false)

  // Tabs / Modes
  const [viewMode, setViewMode] = useState<'builder' | 'form_editor' | 'responses'>('builder')

  // Cert Editor States
  const pageRefs = useRef<(HTMLDivElement | null)[]>([])
  const [pages, setPages] = useState<string[]>([''])
  const savedRangeRef = useRef<Range | null>(null)
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape')
  const [pageBg, setPageBg] = useState('#fffdf8')
  const [fieldMenuOpen, setFieldMenuOpen] = useState(false)
  const [imageMenuOpen, setImageMenuOpen] = useState(false)
  const [fontMenuOpen, setFontMenuOpen] = useState(false)
  const [sizeMenuOpen, setSizeMenuOpen] = useState(false)
  const [editorHtml, setEditorHtml] = useState('')
  const [activeFont, setActiveFont] = useState<string>('Tajawal')
  const [activeSize, setActiveSize] = useState<string>('14px')
  const [activeColor, setActiveColor] = useState<string>('#1f2733')
  const [colorMenuOpen, setColorMenuOpen] = useState(false)
  const [spectrumModalOpen, setSpectrumModalOpen] = useState(false)
  const [customHue, setCustomHue] = useState<number>(0)
  const [customSaturation, setCustomSaturation] = useState<number>(100)
  const [customValue, setCustomValue] = useState<number>(100)

  // Form Fields States
  const [formFields, setFormFields] = useState<FormField[]>([])
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  
  // Auto Close States
  const [autoCloseEnabled, setAutoCloseEnabled] = useState(false)
  const [autoCloseAt, setAutoCloseAt] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)

  // Submissions/Responses States
  const [submissionsQuery, setSubmissionsQuery] = useState('')
  const [submissionsPage, setSubmissionsPage] = useState(1)
  const [selectedSubmissionIds, setSelectedSubmissionIds] = useState<string[]>([])
  const [openRowMenu, setOpenRowMenu] = useState<string | null>(null)
  const [viewingSubmission, setViewingSubmission] = useState<any | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const responseCertRef = useRef<HTMLDivElement>(null)

  // Upload state
  const [inlineUploading, setInlineUploading] = useState(false)

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
      setFormDescription(certData.description || '')
      setAssets(assetsData || [])

      let initialHtml = INITIAL_PAGE_HTML
      if (certData.template_html && certData.template_html.startsWith('{')) {
        try {
          const config = JSON.parse(certData.template_html)
          setPageBg(config.bg || '#fffdf8')
          setOrientation(config.orientation || 'landscape')
          initialHtml = config.html || INITIAL_PAGE_HTML
        } catch {}
      } else if (certData.template_html) {
        initialHtml = certData.template_html
      }
      setEditorHtml(initialHtml)
      const pagesList = getPagesFromHtml(initialHtml)
      setPages(pagesList)

      // Initialize Auto Close Settings
      if (certData.auto_close_at) {
        setAutoCloseEnabled(true)
        setAutoCloseAt(utcToMeccaString(certData.auto_close_at))
      } else {
        setAutoCloseEnabled(false)
        setAutoCloseAt('')
      }

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

  // Synchronize HTML with page refs when tab becomes cert builder
  useEffect(() => {
    if (viewMode === 'builder') {
      pages.forEach((pageContent, idx) => {
        const ref = pageRefs.current[idx]
        if (ref && ref.innerHTML !== pageContent) {
          ref.innerHTML = pageContent
        }
      })
    }
  }, [viewMode, pages])

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

  // Timezone conversions
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

  function meccaStringToUtc(meccaString: string): string {
    if (!meccaString) return ''
    const [datePart, timePart] = meccaString.split('T')
    const [y, m, d] = datePart.split('-').map(Number)
    const [h, min] = timePart.split(':').map(Number)
    const utcDate = new Date(Date.UTC(y, m - 1, d, h, min))
    const finalDate = new Date(utcDate.getTime() - 3 * 3600000)
    return finalDate.toISOString()
  }

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

  // Auto-synchronize canvas field elements (from visual placeholders) with formFields array
  const syncFormFields = useCallback((html: string) => {
    const placeholderKeys = extractPlaceholders(html)
    setFormFields((prev) => {
      // 1. Remove deleted fields that represent canvas elements (linked)
      let updated = prev.filter((field) => {
        // Linked fields map to visual placeholders, unless it's student_name which is always preserved
        if (field.variable === 'student_name' || field.variable === 'email') return true
        const isLinkedField = !field.id.startsWith('extra-')
        if (isLinkedField) {
          return placeholderKeys.includes(field.variable)
        }
        return true
      })

      // 2. Add any NEW placeholders
      placeholderKeys.forEach((key) => {
        const exists = updated.some((f) => f.variable === key)
        if (!exists && key !== 'رقم الإجازة' && key !== 'تاريخ الإصدار') {
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
  }, [])

  // Tab changer
  function handleTabChange(mode: 'builder' | 'form_editor' | 'responses') {
    if (viewMode === 'builder') {
      const pagesList = pageRefs.current.map(ref => ref ? ref.innerHTML : '')
      const currentHtml = pagesList.map(h => `<div class="cert-page-content">${h}</div>`).join('')
      setPages(pagesList)
      setEditorHtml(currentHtml)
      syncFormFields(currentHtml)
    }
    setViewMode(mode)
  }

  // Document Editor Selection & Commands
  function getFontLabel(fontValue: string) {
    if (!fontValue) return 'الخط'
    const cleanValue = fontValue.replace(/['"]/g, '').toLowerCase().trim()
    const found = FONT_OPTIONS.find((opt) => {
      const cleanOpt = opt.value.replace(/['"]/g, '').toLowerCase().trim()
      const fontNameFromOpt = cleanOpt.split(',')[0].trim()
      const fontNameFromVal = cleanValue.split(',')[0].trim()
      return fontNameFromOpt === fontNameFromVal || cleanOpt.includes(cleanValue) || cleanValue.includes(fontNameFromOpt)
    })
    if (found) {
      return found.label.split('(')[0].trim()
    }
    const firstFont = fontValue.split(',')[0].replace(/['"]/g, '').trim()
    return firstFont || 'الخط'
  }

  function updateToolbarStates() {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return

    const range = sel.getRangeAt(0)
    let node: Node | null = range.startContainer
    if (!node) return

    let element: HTMLElement | null = node.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement) : node.parentElement

    let foundFont = ''
    let foundSize = ''
    let foundColor = ''

    while (element && !element.classList.contains('doc-page')) {
      if (!foundFont && element.style.fontFamily) {
        foundFont = element.style.fontFamily
      }
      if (!foundSize && element.style.fontSize) {
        foundSize = element.style.fontSize
      }
      if (!foundColor && element.style.color) {
        foundColor = element.style.color
      }
      if (foundFont && foundSize && foundColor) break
      element = element.parentElement
    }

    if (!foundFont || !foundSize || !foundColor) {
      let targetEl = node.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement) : node.parentElement
      if (targetEl) {
        const computed = window.getComputedStyle(targetEl)
        if (!foundFont) foundFont = computed.fontFamily
        if (!foundSize) foundSize = computed.fontSize
        if (!foundColor) foundColor = computed.color
      }
    }

    if (foundFont) {
      setActiveFont(foundFont)
    }
    if (foundSize) {
      setActiveSize(foundSize)
    }
    if (foundColor) {
      setActiveColor(rgbStrToHex(foundColor))
    }
  }

  function saveSelection() {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) {
      const isInside = pageRefs.current.some(ref => ref && ref.contains(sel.anchorNode))
      if (isInside) {
        savedRangeRef.current = sel.getRangeAt(0).cloneRange()
        updateToolbarStates()
      }
    }
  }

  const handlePageInput = (index: number, target: HTMLDivElement | null = null) => {
    const pageEl = target || pageRefs.current[index]
    if (!pageEl) return

    const newPages = [...pageRefs.current.map(ref => ref ? ref.innerHTML : '')]
    newPages[index] = pageEl.innerHTML

    if (pageEl.scrollHeight > pageEl.clientHeight) {
      const lastChild = pageEl.lastElementChild
      if (lastChild) {
        const lastChildHtml = lastChild.outerHTML
        const currentHtml = pageEl.innerHTML
        const lastIndex = currentHtml.lastIndexOf(lastChildHtml)
        const updatedCurrent = lastIndex !== -1 ? currentHtml.substring(0, lastIndex) : currentHtml
        
        const nextPageContent = newPages[index + 1] || ''
        const updatedNextPage = lastChildHtml + nextPageContent
        
        newPages[index] = updatedCurrent
        newPages[index + 1] = updatedNextPage
        
        pageEl.innerHTML = updatedCurrent
        
        setPages(newPages)
        
        setTimeout(() => {
          const nextRef = pageRefs.current[index + 1]
          if (nextRef) {
            nextRef.innerHTML = updatedNextPage
            nextRef.focus()
            const range = document.createRange()
            const sel = window.getSelection()
            range.selectNodeContents(nextRef)
            range.collapse(true)
            sel?.removeAllRanges()
            sel?.addRange(range)
            saveSelection()
            handlePageInput(index + 1, nextRef)
          }
        }, 50)
      }
    } else {
      setPages(newPages)
    }
  }

  const handlePageKeyDown = (index: number, e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Backspace' && index > 0) {
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        if (range.startOffset === 0 && range.collapsed) {
          e.preventDefault()
          const prevPageRef = pageRefs.current[index - 1]
          if (prevPageRef) {
            const prevHtml = prevPageRef.innerHTML
            const currentHtml = e.currentTarget.innerHTML
            const mergedHtml = prevHtml + currentHtml
            
            prevPageRef.innerHTML = mergedHtml
            
            const newPages = [...pageRefs.current.map(ref => ref ? ref.innerHTML : '')]
            newPages[index - 1] = mergedHtml
            newPages.splice(index, 1)
            
            setPages(newPages)
            
            setTimeout(() => {
              const prevRef = pageRefs.current[index - 1]
              if (prevRef) {
                prevRef.focus()
                const range = document.createRange()
                const sel = window.getSelection()
                range.selectNodeContents(prevRef)
                range.collapse(false)
                sel?.removeAllRanges()
                sel?.addRange(range)
                saveSelection()
                handlePageInput(index - 1, prevRef)
              }
            }, 50)
          }
        }
      }
    }
  }

  function restoreSelection() {
    const sel = window.getSelection()
    if (sel && savedRangeRef.current) {
      sel.removeAllRanges()
      sel.addRange(savedRangeRef.current)
    } else {
      const firstPage = pageRefs.current[0]
      if (firstPage) firstPage.focus()
    }
  }

  function exec(command: string, value: string | null = null) {
    restoreSelection()
    document.execCommand(command, false, value || undefined)
    saveSelection()
  }

  function applyStyle(prop: string, value: string) {
    restoreSelection()
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return

    if (sel.isCollapsed) {
      const range = sel.getRangeAt(0)
      const span = document.createElement('span')
      // @ts-ignore
      span.style[prop] = value
      span.innerHTML = '&#8203;' // zero-width space
      range.insertNode(span)

      const newRange = document.createRange()
      newRange.selectNodeContents(span)
      newRange.collapse(false)
      sel.removeAllRanges()
      sel.addRange(newRange)
      saveSelection()

      if (prop === 'fontFamily') {
        setActiveFont(value)
      } else if (prop === 'fontSize') {
        setActiveSize(value)
      } else if (prop === 'color') {
        setActiveColor(value)
      }
      return
    }

    const range = sel.getRangeAt(0)
    const span = document.createElement('span')
    // @ts-ignore
    span.style[prop] = value
    try {
      range.surroundContents(span)
    } catch {
      const content = range.extractContents()
      span.appendChild(content)
      range.insertNode(span)
    }
    sel.removeAllRanges()
    const newRange = document.createRange()
    newRange.selectNodeContents(span)
    sel.addRange(newRange)
    saveSelection()
    if (prop === 'fontFamily') {
      setActiveFont(value)
    } else if (prop === 'fontSize') {
      setActiveSize(value)
    } else if (prop === 'color') {
      setActiveColor(value)
    }
  }

  function insertHtmlAtCursor(html: string) {
    restoreSelection()
    document.execCommand('insertHTML', false, html)
    
    const sel = window.getSelection()
    if (sel && sel.anchorNode) {
      const pageIndex = pageRefs.current.findIndex(ref => ref && ref.contains(sel.anchorNode))
      if (pageIndex !== -1) {
        const ref = pageRefs.current[pageIndex]
        if (ref) {
          handlePageInput(pageIndex, ref)
        }
      }
    }
    saveSelection()
  }

  function insertField(label: string) {
    insertHtmlAtCursor(`<span contenteditable="false" class="field-chip">{ ${label} }</span>&nbsp;`)
    setFieldMenuOpen(false)
  }

  function insertImage(url: string, name: string) {
    insertHtmlAtCursor(`<img src="${url}" alt="${name}" style="height: 60px; max-width: 150px; object-fit: contain; vertical-align: middle; display: inline-block; margin: 0 8px;" />&nbsp;`)
    setImageMenuOpen(false)
  }

  // Inline Upload handler
  async function handleInlineUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setInlineUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      if (!uploadRes.ok) throw new Error()
      const uploadData = await uploadRes.json()

      const metaRes = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: file.name.replace(/\.[^.]+$/, ''),
          type: file.name.toLowerCase().includes('stamp') || file.name.toLowerCase().includes('ختم') ? 'stamp' : 'signature',
          public_url: uploadData.public_url,
        }),
      })
      if (!metaRes.ok) throw new Error()
      const assetData = await metaRes.json()

      setAssets((prev) => [...prev, assetData])
      showToast('تم رفع الصورة بنجاح ✓')
      
      // Auto-insert the uploaded image into the document flow
      insertImage(assetData.public_url, assetData.name)
    } catch {
      showToast('فشل رفع الصورة', 'error')
    } finally {
      setInlineUploading(false)
    }
  }

  // Form Editor Helper Functions
  function updateField(id: string, patch: Partial<FormField>) {
    setFormFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)))
  }

  function deleteField(id: string) {
    setFormFields((prev) => prev.filter((f) => f.id !== id))
    if (selectedFieldId === id) setSelectedFieldId(null)
  }

  function addField() {
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
    setSelectedFieldId(extraId)
  }

  // Save changes to database
  async function handleSave() {
    setSaving(true)
    try {
      let currentHtml = ''
      if (viewMode === 'builder') {
        const pagesList = pageRefs.current.map(ref => ref ? ref.innerHTML : '')
        currentHtml = pagesList.map(h => `<div class="cert-page-content">${h}</div>`).join('')
        setPages(pagesList)
        setEditorHtml(currentHtml)
        syncFormFields(currentHtml)
      } else {
        currentHtml = editorHtml
      }

      const configJson = JSON.stringify({
        html: currentHtml,
        bg: pageBg,
        orientation,
      })

      const res = await fetch(`/api/certificates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: templateName,
          description: formDescription,
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

  // Export CSV Handlers
  function handleExportCsv() {
    if (!submissions || submissions.length === 0) {
      showToast('لا توجد ردود لتصديرها', 'error')
      return
    }

    const headers = ['الطالب', 'البريد الإلكتروني', 'التاريخ', ...(formFields.filter(f => f.variable !== 'student_name' && f.variable !== 'email').map((f) => f.label))]
    const rows = submissions.map((sub: any) => {
      const date = new Date(sub.created_at).toLocaleDateString('ar-SA')
      const name = sub.data?.['student_name'] || sub.data?.['اسم الطالب'] || Object.values(sub.data)[0] || ''
      const email = sub.data?.['email'] || sub.data?.['البريد الإلكتروني'] || ''
      const fieldValues = formFields.filter(f => f.variable !== 'student_name' && f.variable !== 'email').map((f) => sub.data?.[f.variable] || '')
      return [name, email, date, ...fieldValues]
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
    const headers = ['الطالب', 'البريد الإلكتروني', 'التاريخ', ...(formFields.filter(f => f.variable !== 'student_name' && f.variable !== 'email').map((f) => f.label))]
    const rows = selectedSubs.map((sub: any) => {
      const date = new Date(sub.created_at).toLocaleDateString('ar-SA')
      const name = sub.data?.['student_name'] || sub.data?.['اسم الطالب'] || Object.values(sub.data)[0] || ''
      const email = sub.data?.['email'] || sub.data?.['البريد الإلكتروني'] || ''
      const fieldValues = formFields.filter(f => f.variable !== 'student_name' && f.variable !== 'email').map((f) => sub.data?.[f.variable] || '')
      return [name, email, date, ...fieldValues]
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

  // Deletion logic
  async function deleteOneResponse(r: any) {
    const studentName = r.data?.['student_name'] || r.data?.['اسم الطالب'] || Object.values(r.data)[0] || 'طالب'
    if (!window.confirm(`هل أنت متأكد من حذف إجازة "${studentName}"؟`)) return
    
    try {
      const res = await fetch(`/api/certificates/${id}/submissions`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [r.id] })
      })
      if (!res.ok) throw new Error()
      
      setSubmissions(prev => prev ? prev.filter((x) => x.id !== r.id) : null)
      setSelectedSubmissionIds(prev => prev.filter((x) => x !== r.id))
      setOpenRowMenu(null)
      setViewingSubmission(null)
      showToast('تم حذف الإجازة بنجاح ✓')
    } catch {
      showToast('فشل حذف الإجازة', 'error')
    }
  }

  async function deleteSelectedResponses() {
    if (selectedSubmissionIds.length === 0) return
    if (!window.confirm(`هل أنت متأكد من حذف ${selectedSubmissionIds.length} إجازة محددة؟`)) return

    try {
      const res = await fetch(`/api/certificates/${id}/submissions`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedSubmissionIds })
      })
      if (!res.ok) throw new Error()
      
      setSubmissions(prev => prev ? prev.filter((x) => !selectedSubmissionIds.includes(x.id)) : null)
      setSelectedSubmissionIds([])
      showToast('تم حذف الردود المحددة بنجاح ✓')
    } catch {
      showToast('فشل حذف الردود المحددة', 'error')
    }
  }

  // Individual PDF Downloader
  async function handleDownloadPdfForSubmission(response: any) {
    if (!cert) return
    showToast('جاري تحضير ملف PDF...')
    try {
      const html2canvas = (await import('html2canvas')).default
      const jsPDF = (await import('jspdf')).default

      if (!responseCertRef.current) return

      const certPages = responseCertRef.current.querySelectorAll('.certificate-page')
      const pdf = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: 'a4',
      })

      if (certPages.length > 0) {
        for (let i = 0; i < certPages.length; i++) {
          const pageEl = certPages[i] as HTMLElement
          const canvas = await html2canvas(pageEl, {
            scale: 2.2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: null,
          })
          const imgData = canvas.toDataURL('image/png')
          const pdfWidth = pdf.internal.pageSize.getWidth()
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width
          if (i > 0) {
            pdf.addPage()
          }
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
        }
      } else {
        const canvas = await html2canvas(responseCertRef.current, {
          scale: 2.2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: null,
        })
        const imgData = canvas.toDataURL('image/png')
        const pdfWidth = pdf.internal.pageSize.getWidth()
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      }
      
      const studentName = response.data?.['student_name'] || response.data?.['اسم الطالب'] || Object.values(response.data)[0] || 'طالب'
      pdf.save(`إجازة_${studentName}_${cert.title}.pdf`)
      showToast('تم تحميل ملف PDF بنجاح ✓')
    } catch (err) {
      console.error(err)
      showToast('فشل توليد PDF تلقائياً', 'error')
    }
  }

  // Dynamic placeholders list for inserting fields
  const insertableFields = Array.from(new Set([
    'اسم الطالب',
    'البريد الإلكتروني',
    ...formFields.map(f => f.label),
    'رقم الإجازة',
    'تاريخ الإصدار'
  ]))

  const publicLink = `/c/${id}`

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f2e7]">
        <div className="spinner" />
      </div>
    )
  }

  const filteredSubmissions = submissions
    ? submissions.filter((r) => {
        const studentName = r.data?.['student_name'] || r.data?.['اسم الطالب'] || Object.values(r.data)[0] || ''
        const studentEmail = r.data?.['email'] || r.data?.['البريد الإلكتروني'] || ''
        return (
          String(studentName).includes(submissionsQuery.trim()) ||
          String(studentEmail).includes(submissionsQuery.trim())
        )
      })
    : []

  const totalPages = Math.max(1, Math.ceil(filteredSubmissions.length / PAGE_SIZE))
  const safePage = Math.min(submissionsPage, totalPages)
  const pageItems = filteredSubmissions.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const pageIds = pageItems.map((r) => r.id)
  const allPageSelected = pageIds.length > 0 && pageIds.every((fid) => selectedSubmissionIds.includes(fid))

  function toggleSelectRow(rowId: string) {
    setSelectedSubmissionIds((prev) => (prev.includes(rowId) ? prev.filter((x) => x !== rowId) : [...prev, rowId]))
  }

  function toggleSelectAllOnPage() {
    if (allPageSelected) {
      setSelectedSubmissionIds((prev) => prev.filter((fid) => !pageIds.includes(fid)))
    } else {
      setSelectedSubmissionIds((prev) => Array.from(new Set([...prev, ...pageIds])))
    }
  }

  return (
    <div dir="rtl" className="builder-app min-h-screen flex flex-col">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Tajawal:wght@300;400;500;700;800;900&family=Cairo:wght@200..1000&family=Reem+Kufi:wght@400..700&family=Aref+Ruqaa:wght@400;700&family=Lalezar&family=El+Messiri:wght@400..700&family=Changa:wght@200..800&family=Almarai:wght@300;400;700;800&family=Marhey:wght@300..700&family=Scheherazade+New:wght@400;700&display=swap');
        .builder-app { background:#f7f2e7; color:#1f2733; font-family:'Tajawal', sans-serif; }
        .font-amiri { font-family:'Amiri', serif; }

        .topbar { background:#fffdf8; border-bottom:1px solid #e7ddc4; }
        .name-input { font-family:'Amiri',serif; font-size:1.1rem; font-weight:700; color:#16243f; background:transparent; border:none; outline:none; border-bottom:1.5px dashed transparent; }
        .name-input:focus { border-color:#c9a227; }

        .tab-toggle { display:flex; align-items:center; gap:2px; background:#faf7ee; border:1px solid #ecdcae; border-radius:9999px; padding:3px; }
        .tab-btn { padding:0.45rem 1.15rem; border-radius:9999px; font-size:0.85rem; font-weight:600; color:#8a8378; transition:all .15s ease; white-space:nowrap; background:transparent; border:none; cursor:pointer; }
        .tab-btn:hover { color:#16243f; }
        .tab-btn.active { background:#fffdf8; color:#9c7a1f; font-weight:700; box-shadow:0 1px 3px rgba(22,36,63,0.12), 0 1px 2px rgba(22,36,63,0.08); }

        .panel { background:#fffdf8; border-left:1px solid #e7ddc4; }
        .panel-right { background:#fffdf8; border-right:1px solid #e7ddc4; }
        .content-bg { background-color:#f7f2e7; background-image: radial-gradient(rgba(184,146,58,0.10) 1px, transparent 1.4px); background-size:20px 20px; }

        .icon-btn { width:1.9rem; height:1.9rem; display:flex; align-items:center; justify-content:center; border-radius:0.45rem; color:#6b6457; flex-shrink:0; transition:all .15s ease; background:transparent; border:none; cursor:pointer; }
        .icon-btn:hover { background:#f3e6c0; color:#16243f; }

        .btn-gold { background:linear-gradient(180deg,#d9b94a,#b8923a); color:#16243f; font-weight:800; border:none; cursor:pointer; box-shadow:0 6px 16px -6px rgba(184,146,58,0.6); transition: all 0.2s; }
        .btn-gold:hover { transform: translateY(-1px); }
        .btn-gold:disabled { opacity:0.5; box-shadow:none; cursor:not-allowed; }
        .btn-outline { border:1.5px solid #d6cdb0; color:#4a4538; background:transparent; font-weight:600; cursor:pointer; }
        .btn-outline:hover { background:#f3ecd8; }
        .btn-outline-red { border:1.5px solid #e3b9b9; color:#9c3b3b; background:transparent; font-weight:700; cursor:pointer; }
        .btn-outline-red:hover { background:#f7e8e8; }

        .field-select, .field-input { width:100%; font-size:0.82rem; padding:0.55rem 0.7rem; border-radius:0.5rem; border:1px solid #e0d6b8; background:#fffdf8; color:#1f2733; outline:none; }
        .field-select:focus, .field-input:focus { border-color:#c9a227; }
        .field-label { font-size:0.72rem; font-weight:700; color:#6b6457; margin-bottom:0.35rem; display:block; text-align:right; }

        .switch-track { position:relative; width:2.6rem; height:1.45rem; border-radius:9999px; flex-shrink:0; transition:background .2s ease; }
        .switch-knob { position:absolute; top:0.18rem; width:1.1rem; height:1.1rem; border-radius:9999px; background:#fff; transition:left .2s ease; box-shadow:0 1px 3px rgba(0,0,0,0.3); }

        .card-formal { background:#fffdf8; border:1px solid #e7ddc4; border-radius:16px; box-shadow:0 1px 2px rgba(22,36,63,0.04), 0 14px 30px -18px rgba(22,36,63,0.18); }
        .preview-input { width:100%; font-size:0.92rem; padding:0.7rem 0.9rem; border-radius:0.6rem; border:1px solid #e0d6b8; background:#fffdf8; outline:none; color:#1f2733; text-align:right; }

        .layer-row { display:flex; align-items:center; gap:0.5rem; padding:0.55rem 0.6rem; border-radius:0.55rem; cursor:pointer; transition:background .12s ease; }
        .layer-row:hover { background:#f3ecd8; }
        .layer-row.active { background:#f3e6c0; box-shadow: inset 2px 0 0 #c9a227; }
        .tool-btn { display:flex; align-items:center; justify-content:center; gap:0.5rem; padding:0.65rem; border-radius:0.7rem; border:1.5px dashed #c9a227; background:rgba(201,162,39,0.05); font-size:0.8rem; font-weight:700; color:#9c7a1f; width:100%; cursor:pointer; }
        .tool-btn:hover { background:rgba(201,162,39,0.12); }

        .dropdown-menu { background:#fffdf8; border:1px solid #e7ddc4; border-radius:0.75rem; box-shadow:0 12px 32px -12px rgba(22,36,63,0.3); }
        .dropdown-item { width:100%; display:flex; align-items:center; gap:0.6rem; padding:0.6rem 0.9rem; font-size:0.83rem; color:#1f2733; text-align:right; transition:background .12s ease; background:transparent; border:none; cursor:pointer; }
        .dropdown-item:hover { background:#f7f2e7; }

        .swatch { width:1.5rem; height:1.5rem; border-radius:9999px; border:2px solid #fff; box-shadow:0 0 0 1px #d6cdb0; cursor:pointer; }
        .swatch.active { box-shadow:0 0 0 2px #16243f; }

        /* محرر المستند */
        .editor-toolbar { display:flex; align-items:center; gap:0.2rem; padding:0.5rem 0.75rem; background:#fffdf8; border-bottom:1px solid #e7ddc4; flex-wrap:wrap; }
        .toolbar-btn { width:2rem; height:2rem; display:flex; align-items:center; justify-content:center; border-radius:0.4rem; color:#4a4538; flex-shrink:0; background:transparent; border:none; cursor:pointer; }
        .toolbar-btn:hover { background:#f3e6c0; color:#16243f; }
        .toolbar-select { font-size:0.78rem; padding:0.35rem 0.45rem; border-radius:0.4rem; border:1px solid #e0d6b8; background:#fffdf8; color:#1f2733; max-width:6.5rem; }
        .toolbar-divider { width:1px; height:1.5rem; background:#e7ddc4; margin:0 0.3rem; flex-shrink:0; }
        .toolbar-dropdown-btn { display:flex; align-items:center; gap:0.3rem; font-size:0.78rem; font-weight:700; padding:0.4rem 0.7rem; border-radius:0.5rem; color:#9c7a1f; background:rgba(201,162,39,0.08); white-space:nowrap; border:none; cursor:pointer; }
        .toolbar-dropdown-btn:hover { background:rgba(201,162,39,0.16); }

        .doc-scroll { flex:1; overflow:auto; padding:2.5rem 1.5rem; display:flex; justify-content:center; background-color:#ece6d4; background-image: radial-gradient(rgba(184,146,58,0.14) 1px, transparent 1.4px); background-size:20px 20px; }
        .doc-page-container { position:relative; overflow:hidden; flex-shrink:0; box-shadow:0 14px 40px -12px rgba(22,36,63,0.28); border:2px solid #c9a227; border-radius:4px; transition:box-shadow 0.15s ease; }
        .doc-page-container:focus-within { box-shadow:0 0 0 3px rgba(201,162,39,0.25), 0 14px 40px -12px rgba(22,36,63,0.28); }
        .doc-page { width:100%; height:100%; border:none; padding:12% 12%; outline:none; background:transparent; }

        .field-chip, .image-chip { display:inline-block; font-family:'Tajawal',sans-serif; font-size:0.85em; padding:1px 9px; margin:0 2px; border:1.5px dashed #c9a227; border-radius:4px; background:rgba(201,162,39,0.08); color:#9c7a1f; font-weight:600; }
        .image-chip { border-color:#b8923a; }

        .resp-table { width:100%; border-collapse:separate; border-spacing:0; }
        .resp-table th { text-align:right; font-size:0.74rem; font-weight:700; color:#6b6457; padding:0 0.9rem 0.7rem; white-space:nowrap; }
        .resp-table td { padding:0.8rem 0.9rem; border-top:1px solid #efe9da; font-size:0.85rem; vertical-align:middle; }
        .resp-table tr:hover td { background:#faf7ee; }
        .avatar-ring { width:2.1rem; height:2.1rem; border-radius:9999px; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.78rem; background:#16243f; color:#d9b94a; flex-shrink:0; }

        .modal-overlay { position:fixed; inset:0; background:rgba(15,26,48,0.55); display:flex; align-items:center; justify-content:center; z-index:50; padding:1rem; }
        .modal-card { background:#fffdf8; border-radius:18px; width:100%; box-shadow:0 24px 60px -20px rgba(15,26,48,0.5); border:1px solid #e7ddc4; }

        .page-btn { width:2.1rem; height:2.1rem; display:flex; align-items:center; justify-content:center; border-radius:0.5rem; border:1px solid #e0d6b8; color:#6b6457; background:transparent; cursor:pointer; }
        .page-btn:disabled { opacity:0.4; cursor:not-allowed; }
        .page-btn:not(:disabled):hover { background:#f3e6c0; color:#16243f; }
        
        .toast {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: #16243f;
          color: #fff;
          padding: 0.75rem 1.5rem;
          border-radius: 9999px;
          z-index: 100;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          font-size: 0.85rem;
          font-weight: 600;
        }
        .toast-error {
          background: #9c3b3b;
        }
        
        /* Spinner */
        .spinner {
          width: 1.5rem;
          height: 1.5rem;
          border: 3px solid rgba(184, 146, 58, 0.2);
          border-top-color: var(--gold-main);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      ` }} />

      {/* ===== الشريط العلوي المشترك ===== */}
      <header className="topbar flex flex-wrap items-center gap-3 px-5 lg:px-7 py-3">
        <Link href="/admin" className="icon-btn flex items-center justify-center" style={{ width: '2.1rem', height: '2.1rem' }} title="رجوع إلى الإجازات">
          <ArrowRight size={18} />
        </Link>
        <div className="flex flex-col min-w-0 text-right">
          <p className="text-[11px] font-semibold" style={{ color: '#b8923a' }}>
            الإجازات
          </p>
          <input
            className="name-input"
            style={{ width: 'min(60vw, 360px)' }}
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
          />
        </div>

        <div className="flex-1 flex justify-center">
          <div className="tab-toggle">
            <button className={`tab-btn ${viewMode === 'form_editor' ? 'active' : ''}`} onClick={() => handleTabChange('form_editor')}>
              الاستمارة
            </button>
            <button className={`tab-btn ${viewMode === 'builder' ? 'active' : ''}`} onClick={() => handleTabChange('builder')}>
              الإجازة
            </button>
            <button className={`tab-btn ${viewMode === 'responses' ? 'active' : ''}`} onClick={() => handleTabChange('responses')}>
              الردود
            </button>
          </div>
        </div>

        {viewMode !== 'responses' ? (
          <>
            <button className="btn-outline px-4 py-2 rounded-full text-sm hidden sm:inline-flex items-center gap-1.5" onClick={() => window.open(publicLink, '_blank')}>
              <Eye size={15} />
              معاينة
            </button>
            <button className="btn-gold px-4 py-2 rounded-full text-sm inline-flex items-center gap-1.5" onClick={handleSave} disabled={saving}>
              <Save size={15} />
              {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
            </button>
          </>
        ) : (
          <button className="btn-outline px-4 py-2 rounded-full text-sm hidden sm:inline-flex items-center gap-1.5" onClick={handleExportCsv}>
            <Download size={15} />
            تصدير CSV
          </button>
        )}
      </header>

      {/* ===== تبويب الإجازة: محرر المستند ===== */}
      <div className={`flex-1 flex flex-col lg:flex-row overflow-hidden ${viewMode === 'builder' ? '' : 'hidden'}`}>
        <aside className="panel-right order-2 lg:order-1 w-full lg:w-72 flex-shrink-0 p-4 flex flex-col gap-5 overflow-y-auto">
          <div>
            <span className="field-label">اتجاه الصفحة</span>
            <div className="flex gap-2">
              <button
                type="button"
                className="flex-1 py-2 rounded-lg text-xs font-semibold border"
                style={orientation === 'landscape' ? { background: '#16243f', color: '#e9c969', borderColor: '#16243f', cursor: 'pointer' } : { borderColor: '#e0d6b8', color: '#6b6457', background: 'transparent', cursor: 'pointer' }}
                onClick={() => setOrientation('landscape')}
              >
                أفقي
              </button>
              <button
                type="button"
                className="flex-1 py-2 rounded-lg text-xs font-semibold border"
                style={orientation === 'portrait' ? { background: '#16243f', color: '#e9c969', borderColor: '#16243f', cursor: 'pointer' } : { borderColor: '#e0d6b8', color: '#6b6457', background: 'transparent', cursor: 'pointer' }}
                onClick={() => setOrientation('portrait')}
              >
                عمودي
              </button>
            </div>
          </div>

          <div>
            <span className="field-label">لون خلفية الصفحة</span>
            <div className="flex gap-2.5">
              {BG_SWATCHES.map((c) => (
                <button key={c} type="button" className={`swatch ${pageBg === c ? 'active' : ''}`} style={{ background: c }} onClick={() => setPageBg(c)} />
              ))}
            </div>
          </div>

          <div>
            <span className="field-label">الأختام والتوقيعات المحفوظة</span>
            <p className="text-[11px] mb-2 text-right" style={{ color: '#a39c8c' }}>
              انقر لإدراج العنصر في موضع المؤشر
            </p>
            <div className="grid grid-cols-3 gap-2">
              {assets.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  className="aspect-square rounded-lg flex flex-col items-center justify-center gap-1 stamp-card-container"
                  style={{ background: '#f7f2e7', border: '1px solid #e7ddc4', padding: '4px', cursor: 'pointer' }}
                  title={asset.name}
                  onClick={() => insertImage(asset.public_url, asset.name)}
                >
                  <img src={asset.public_url} alt={asset.name} className="pointer-events-none stamp-image-zoom" style={{ maxWidth: '80%', maxHeight: '80%', objectFit: 'contain' }} />
                </button>
              ))}
              <label
                className="aspect-square rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-[#f3ecd8] transition-colors"
                style={{ border: '1.5px dashed #c9a227', color: '#b8923a' }}
              >
                {inlineUploading ? (
                  <span className="spinner" style={{ width: '1.2rem', height: '1.2rem', borderWidth: '2px' }} />
                ) : (
                  <>
                    <Plus size={16} />
                    <span className="text-[8px] font-bold mt-1">رفع صورة</span>
                  </>
                )}
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

          <div className="rounded-xl p-3.5 flex gap-2.5 text-right" style={{ background: '#faf1de', border: '1px solid #ecdcae' }}>
            <Info size={15} style={{ color: '#b07a1f', flexShrink: 0, marginTop: 2 }} />
            <p className="text-xs leading-relaxed" style={{ color: '#7a5c1f' }}>
              العناصر المنقطة الذهبية هي حقول متغيّرة تُملأ تلقائيًا من ردود النموذج عند إصدار كل إجازة.
            </p>
          </div>

          <button
            type="button"
            className="btn-outline w-full py-2.5 rounded-full text-sm"
            style={{ border: '1.5px solid #c9a227', color: '#9c7a1f' }}
            onClick={handleSetMaster}
            disabled={saving || cert?.is_master}
          >
            {cert?.is_master ? '⭐ قالب رئيسي معتمد' : 'تعيين كقالب رئيسي للأكاديمية'}
          </button>
        </aside>

        <div className="order-1 lg:order-2 flex-1 flex flex-col overflow-hidden">
          <div className="editor-toolbar">
            <button type="button" className="toolbar-btn" title="تراجع" onClick={() => exec('undo')}>
              <Undo2 size={15} />
            </button>
            <button type="button" className="toolbar-btn" title="إعادة" onClick={() => exec('redo')}>
              <Redo2 size={15} />
            </button>
            <div className="toolbar-divider" />
            
            {/* Font Dropdown */}
            <div className="relative">
              <button
                type="button"
                className="toolbar-dropdown-btn"
                onClick={() => {
                  saveSelection()
                  setFontMenuOpen((v) => !v)
                  setSizeMenuOpen(false)
                  setFieldMenuOpen(false)
                  setImageMenuOpen(false)
                  setColorMenuOpen(false)
                }}
              >
                <Type size={12} />
                <span>{getFontLabel(activeFont)}</span>
                <ChevronDown size={11} style={{ opacity: 0.7 }} />
              </button>
              {fontMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setFontMenuOpen(false)} />
                  <div className="dropdown-menu absolute right-0 top-9 z-20 w-48 py-1.5 max-h-60 overflow-y-auto">
                    {FONT_OPTIONS.map((f) => (
                      <button
                        key={f.value}
                        type="button"
                        className="dropdown-item text-right"
                        style={{ fontFamily: f.value, fontSize: '0.95rem' }}
                        onClick={() => {
                          applyStyle('fontFamily', f.value)
                          setFontMenuOpen(false)
                        }}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Size Dropdown */}
            <div className="relative mr-1">
              <button
                type="button"
                className="toolbar-dropdown-btn"
                onClick={() => {
                  saveSelection()
                  setSizeMenuOpen((v) => !v)
                  setFontMenuOpen(false)
                  setFieldMenuOpen(false)
                  setImageMenuOpen(false)
                  setColorMenuOpen(false)
                }}
              >
                <span>{activeSize ? activeSize.replace('px', '').trim() + ' px' : 'الحجم'}</span>
                <ChevronDown size={11} style={{ opacity: 0.7 }} />
              </button>
              {sizeMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setSizeMenuOpen(false)} />
                  <div className="dropdown-menu absolute right-0 top-9 z-20 w-28 py-1.5 max-h-60 overflow-y-auto">
                    {SIZE_OPTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className="dropdown-item"
                        style={{ fontSize: '0.85rem', display: 'block', textAlign: 'center', width: '100%', whiteSpace: 'nowrap' }}
                        onClick={() => {
                          applyStyle('fontSize', `${s}px`)
                          setSizeMenuOpen(false)
                        }}
                      >
                        {s} px
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="toolbar-divider" />
            <button type="button" className="toolbar-btn" title="عريض" onClick={() => exec('bold')}>
              <Bold size={15} />
            </button>
            <button type="button" className="toolbar-btn" title="مائل" onClick={() => exec('italic')}>
              <Italic size={15} />
            </button>
            <button type="button" className="toolbar-btn" title="تسطير" onClick={() => exec('underline')}>
              <Underline size={15} />
            </button>
            <div className="toolbar-divider" />
            {COLOR_SWATCHES.map((c) => {
              const isActive = activeColor.toLowerCase() === c.toLowerCase()
              return (
                <button
                  key={c}
                  type="button"
                  className="toolbar-btn"
                  title="لون النص"
                  onClick={() => applyStyle('color', c)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: isActive ? 'scale(1.2)' : 'none',
                    transition: 'transform 0.15s ease'
                  }}
                >
                  <span style={{
                    width: 13,
                    height: 13,
                    borderRadius: 9999,
                    background: c,
                    display: 'block',
                    boxShadow: isActive ? '0 0 0 2px var(--navy-dark), 0 0 0 3px #fff' : '0 0 0 1px #d6cdb0'
                  }} />
                </button>
              )
            })}

            {/* Custom Color Button & Popover */}
            {(() => {
              const isCustomActive = !COLOR_SWATCHES.map(x => x.toLowerCase()).includes(activeColor.toLowerCase())
              const contrastColor = getContrastColor(activeColor)
              return (
                <div className="relative">
                  <button
                    type="button"
                    className="toolbar-btn relative"
                    title="ألوان إضافية ومخصصة"
                    onClick={() => {
                      saveSelection()
                      setColorMenuOpen((v) => !v)
                      setFontMenuOpen(false)
                      setSizeMenuOpen(false)
                      setFieldMenuOpen(false)
                      setImageMenuOpen(false)
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transform: isCustomActive ? 'scale(1.2)' : 'none',
                      transition: 'transform 0.15s ease'
                    }}
                  >
                    <span style={{
                      width: 17,
                      height: 17,
                      borderRadius: 9999,
                      border: isCustomActive ? 'none' : '1.5px dashed #b8923a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      color: isCustomActive ? contrastColor : '#b8923a',
                      background: isCustomActive ? activeColor : 'rgba(184, 146, 58, 0.08)',
                      boxShadow: isCustomActive ? '0 0 0 2px var(--navy-dark), 0 0 0 3px #fff' : 'none'
                    }}>
                      +
                    </span>
                  </button>
                  {colorMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setColorMenuOpen(false)} />
                      <div className="dropdown-menu absolute right-0 top-9 z-20 p-3" style={{ width: '230px' }}>
                        <p className="text-[11px] font-bold mb-2 text-right" style={{ color: 'var(--text-muted)' }}>ألوان جاهزة</p>
                        
                        {/* Grid of Preset Colors */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '6px', marginBottom: '12px', direction: 'ltr' }}>
                          {PRESET_COLORS.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => {
                                applyStyle('color', c)
                                setColorMenuOpen(false)
                              }}
                              style={{
                                width: '16px',
                                height: '16px',
                                borderRadius: '9999px',
                                backgroundColor: c,
                                border: '1px solid #d6cdb0',
                                padding: 0,
                                cursor: 'pointer',
                                boxShadow: activeColor.toLowerCase() === c.toLowerCase() ? '0 0 0 1.5px var(--navy-dark)' : 'none'
                              }}
                              title={c}
                            />
                          ))}
                        </div>
                        
                        <div style={{ height: '1px', background: '#e7ddc4', margin: '8px 0' }} />
                        
                        {/* Custom Color Selector section */}
                        <div className="flex items-center justify-between mt-2" style={{ direction: 'rtl' }}>
                          <span className="text-[11px] font-bold" style={{ color: 'var(--text-main)' }}>مخصص:</span>
                          <div className="flex items-center gap-1.5">
                            <span style={{
                              width: '14px',
                              height: '14px',
                              borderRadius: '9999px',
                              backgroundColor: activeColor,
                              border: '1px solid #d6cdb0',
                              display: 'inline-block'
                            }} />
                            <span className="text-[11px] font-mono select-all" style={{ color: 'var(--text-muted)' }}>{activeColor}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const rgb = hexToRgb(activeColor)
                              const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b)
                              setCustomHue(hsv.h)
                              setCustomSaturation(hsv.s)
                              setCustomValue(hsv.v)
                              setSpectrumModalOpen(true)
                              setColorMenuOpen(false)
                            }}
                            style={{
                              background: 'rgba(201, 162, 39, 0.1)',
                              border: 'none',
                              borderRadius: '4px',
                              color: '#9c7a1f',
                              padding: '3px 7px',
                              fontSize: '10px',
                              fontWeight: 'bold',
                              cursor: 'pointer'
                            }}
                          >
                            طيف الألوان
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )
            })()}
            <div className="toolbar-divider" />
            <button type="button" className="toolbar-btn" title="محاذاة يمين" onClick={() => exec('justifyRight')}>
              <AlignRight size={15} />
            </button>
            <button type="button" className="toolbar-btn" title="توسيط" onClick={() => exec('justifyCenter')}>
              <AlignCenter size={15} />
            </button>
            <button type="button" className="toolbar-btn" title="محاذاة يسار" onClick={() => exec('justifyLeft')}>
              <AlignLeft size={15} />
            </button>
            <div className="toolbar-divider" />
            <div className="relative">
              <button
                type="button"
                className="toolbar-dropdown-btn"
                onClick={() => {
                  saveSelection()
                  setFieldMenuOpen((v) => !v)
                  setImageMenuOpen(false)
                  setFontMenuOpen(false)
                  setSizeMenuOpen(false)
                  setColorMenuOpen(false)
                }}
              >
                <Type size={13} />
                إدراج حقل
              </button>
              {fieldMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setFieldMenuOpen(false)} />
                  <div className="dropdown-menu absolute right-0 top-9 z-20 w-48 py-1.5">
                    {insertableFields.map((f) => (
                      <button key={f} type="button" className="dropdown-item" onClick={() => insertField(f)}>
                        {f}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="relative">
              <button
                type="button"
                className="toolbar-dropdown-btn mr-1.5"
                onClick={() => {
                  saveSelection()
                  setImageMenuOpen((v) => !v)
                  setFieldMenuOpen(false)
                  setFontMenuOpen(false)
                  setSizeMenuOpen(false)
                  setColorMenuOpen(false)
                }}
              >
                <ImageIcon size={13} />
                إدراج صورة
              </button>
              {imageMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setImageMenuOpen(false)} />
                  <div className="dropdown-menu absolute right-0 top-9 z-20 w-52 py-1.5">
                    {assets.map((s) => (
                      <button key={s.id} type="button" className="dropdown-item" onClick={() => insertImage(s.public_url, s.name)}>
                        {s.name.toLowerCase().includes('stamp') || s.name.toLowerCase().includes('ختم') ? <Stamp size={14} /> : <PenTool size={14} />}
                        <span className="truncate flex-1 pr-1.5">{s.name}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="doc-scroll flex flex-col gap-6 items-center" style={{ justifyContent: 'flex-start' }}>
            {pages.map((pageContent, idx) => (
              <div
                key={idx}
                className="doc-page-container"
                style={{
                  width: '100%',
                  maxWidth: orientation === 'landscape' ? '880px' : '620px',
                  aspectRatio: orientation === 'landscape' ? '1.4142 / 1' : '1 / 1.4142',
                  background: pageBg,
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
                    zIndex: 1,
                  }}
                />
                <div
                  ref={(el) => {
                    pageRefs.current[idx] = el
                  }}
                  contentEditable
                  suppressContentEditableWarning
                  dir="rtl"
                  onMouseUp={saveSelection}
                  onKeyUp={saveSelection}
                  onInput={() => handlePageInput(idx)}
                  onKeyDown={(e) => handlePageKeyDown(idx, e)}
                  className="doc-page font-amiri"
                  style={{
                    width: '100%',
                    height: '100%',
                    zIndex: 2,
                    position: 'absolute',
                    inset: 0,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== تبويب الاستمارة ===== */}
      <div className={`flex-1 flex flex-col lg:flex-row overflow-hidden ${viewMode === 'form_editor' ? '' : 'hidden'}`}>
        <aside className="panel-right order-2 lg:order-1 w-full lg:w-72 flex-shrink-0 p-4 flex flex-col gap-4 overflow-y-auto">
          <p className="field-label">حقول النموذج ({formFields.length})</p>
          <div className="flex flex-col gap-0.5">
            {formFields.map((f) => {
              const isAuto = f.variable === 'issue_date' || f.variable === 'cert_no'
              const Icon = isAuto ? Clock : fieldIcon(f.type)
              return (
                <div key={f.id} className={`layer-row ${selectedFieldId === f.id ? 'active' : ''}`} onClick={() => setSelectedFieldId(f.id)}>
                  <GripVertical size={13} style={{ color: '#c2b896' }} />
                  <Icon size={14} style={{ color: isAuto ? '#a39c8c' : '#6b6457' }} />
                  <div className="flex-1 min-w-0 text-right pr-1.5">
                    <p className="text-xs truncate font-medium" style={{ color: '#1f2733' }}>
                      {f.label}
                    </p>
                    {isAuto && (
                      <p className="text-[10px] truncate" style={{ color: '#a39c8c' }}>
                        تلقائي
                      </p>
                    )}
                  </div>
                  {f.required && !isAuto && (
                    <span className="text-[10px] font-bold" style={{ color: '#9c3b3b' }}>
                      *
                    </span>
                  )}
                  {!isAuto && f.variable !== 'student_name' && f.variable !== 'email' && (
                    <button
                      type="button"
                      className="icon-btn mr-auto"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteField(f.id)
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
          <button type="button" className="tool-btn" onClick={addField}>
            <Plus size={15} />
            إضافة حقل
          </button>
          <div className="rounded-xl p-3 flex gap-2 mt-1 text-right" style={{ background: '#faf1de', border: '1px solid #ecdcae' }}>
            <Info size={14} style={{ color: '#b07a1f', flexShrink: 0, marginTop: 1 }} />
            <p className="text-[11px] leading-relaxed" style={{ color: '#7a5c1f' }}>
              الحقول المرتبطة بالقالب لا يمكن حذفها. الحقول التلقائية لا تظهر للطالب ويملؤها النظام عند الإرسال.
            </p>
          </div>
        </aside>

        <div className="order-1 lg:order-2 flex-1 overflow-auto p-6 lg:p-10 flex items-start justify-center content-bg">
          <div className="w-full" style={{ maxWidth: 560 }}>
            <div className="card-formal p-7 lg:p-9 text-right">
              <p className="text-xs font-semibold mb-1.5" style={{ color: '#b8923a' }}>
                أكاديمية النور للعلوم الشرعية
              </p>
              <h2 className="font-amiri text-2xl font-bold mb-2" style={{ color: '#16243f' }}>
                {templateName}
              </h2>
              <p className="text-sm mb-7 leading-relaxed" style={{ color: '#6b6457' }}>
                {formDescription || 'يرجى تعبئة بياناتكم بدقة، حيث ستُستخدم كما هي في إصدار الإجازة.'}
              </p>
              <div className="flex flex-col gap-5">
                {formFields
                  .filter((f) => f.variable !== 'issue_date' && f.variable !== 'cert_no')
                  .map((f) => (
                    <div key={f.id}>
                      <label className="text-sm font-semibold mb-1.5 block" style={{ color: '#1f2733' }}>
                        {f.label}
                        {f.required && <span style={{ color: '#9c3b3b' }}> *</span>}
                      </label>
                      {f.type === 'textarea' ? (
                        <textarea className="preview-input" rows={3} placeholder={f.placeholder} disabled />
                      ) : f.type === 'select' ? (
                        <select className="preview-input" disabled>
                          <option>{f.placeholder || 'اختر...'}</option>
                        </select>
                      ) : (
                        <input className="preview-input" type={f.type === 'date' ? 'date' : f.type === 'number' ? 'number' : f.type === 'email' ? 'email' : 'text'} placeholder={f.placeholder} disabled />
                      )}
                    </div>
                  ))}
              </div>
              <button type="button" className="btn-gold w-full py-3 rounded-full text-sm mt-8">إرسال وإصدار الإجازة</button>
            </div>
            <p className="text-center text-xs mt-3" style={{ color: '#9c948a' }}>
              هكذا سيظهر النموذج للطالب عند فتح الرابط
            </p>
          </div>
        </div>

        <aside className="panel order-3 w-full lg:w-80 flex-shrink-0 p-5 overflow-y-auto">
          {(!selectedFieldId || !formFields.some(f => f.id === selectedFieldId)) ? (
            <div className="flex flex-col gap-6 text-right">
              <div>
                <p className="font-amiri text-lg font-bold" style={{ color: '#16243f' }}>
                  إعدادات الاستمارة
                </p>
                <p className="text-xs mt-1" style={{ color: '#6b6457' }}>
                  انقر أي حقل لتعديل خصائصه
                </p>
              </div>
              <div>
                <span className="field-label">وصف / تعليمات الاستمارة</span>
                <textarea className="field-select" rows={3} value={formDescription} onChange={(e) => setFormDescription(e.target.value)} />
              </div>
              <div className="border-t pt-5 flex flex-col gap-4" style={{ borderColor: '#e7ddc4' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#1f2733' }}>
                      استقبال الردود
                    </p>
                    <p className="text-[11px] text-right" style={{ color: '#a39c8c' }}>
                      تفعيل/إيقاف استقبال طلبات جديدة
                    </p>
                  </div>
                  <Switch checked={cert ? cert.is_open : true} onChange={async (v) => {
                    try {
                      const res = await fetch(`/api/certificates/${id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ is_open: v })
                      })
                      if (!res.ok) throw new Error()
                      const updated = await res.json()
                      setCert(updated)
                      showToast(v ? 'تم فتح الاستمارة لاستقبال الردود ✓' : 'تم إغلاق الاستمارة ✓')
                    } catch {
                      showToast('فشل تعديل حالة الاستمارة', 'error')
                    }
                  }} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#1f2733' }}>
                      إغلاق تلقائي مجدول
                    </p>
                    <p className="text-[11px] text-right" style={{ color: '#a39c8c' }}>
                      إيقاف الاستقبال تلقائيًا في وقت محدد
                    </p>
                  </div>
                  <Switch checked={autoCloseEnabled} onChange={(v) => {
                    setAutoCloseEnabled(v)
                    if (!v) setAutoCloseAt('')
                  }} />
                </div>

                {autoCloseEnabled && (
                  <button
                    type="button"
                    className="field-select text-right flex items-center justify-between"
                    style={{ cursor: 'pointer', background: '#fffdf8', border: '1px solid #e0d6b8' }}
                    onClick={() => setShowDatePicker(true)}
                  >
                    <Calendar size={14} style={{ color: 'var(--gold-main)' }} />
                    <span>{autoCloseAt ? formatArabicDateTime(autoCloseAt) : 'اختر التاريخ والوقت...'}</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            (() => {
              const selectedField = formFields.find(f => f.id === selectedFieldId)!
              const isAuto = selectedField.variable === 'issue_date' || selectedField.variable === 'cert_no'
              return (
                <div className="flex flex-col gap-4 text-right">
                  <span className="inline-flex w-fit items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full mr-auto" style={{ background: isAuto ? '#efe9da' : selectedField.variable === 'student_name' || selectedField.variable === 'email' ? '#eef4ea' : '#f3e6c0', color: isAuto ? '#6b6457' : selectedField.variable === 'student_name' || selectedField.variable === 'email' ? '#4f7d4a' : '#9c7a1f' }}>
                    {isAuto ? <Clock size={11} /> : selectedField.variable === 'student_name' || selectedField.variable === 'email' ? <Sparkles size={11} /> : <Plus size={11} />}
                    {isAuto ? 'حقل تلقائي' : selectedField.variable === 'student_name' || selectedField.variable === 'email' ? 'مرتبط بالقالب' : 'حقل إضافي'}
                  </span>
                  <div>
                    <span className="field-label">اسم الحقل</span>
                    <input
                      className="field-select"
                      value={selectedField.label}
                      onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                      disabled={isAuto}
                    />
                  </div>
                  {!isAuto && (
                    <>
                      <div>
                        <span className="field-label">نوع الحقل</span>
                        <select
                          className="field-select"
                          value={selectedField.type}
                          onChange={(e) => updateField(selectedField.id, { type: e.target.value as any })}
                          disabled={selectedField.variable === 'student_name' || selectedField.variable === 'email'}
                        >
                          {TYPE_OPTIONS.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <span className="field-label">{selectedField.type === 'select' ? 'الخيارات (مفصولة بفاصلة)' : 'نص توضيحي'}</span>
                        <input
                          className="field-select"
                          value={selectedField.placeholder || ''}
                          onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold" style={{ color: '#1f2733' }}>
                          حقل إجباري
                        </p>
                        <Switch
                          checked={selectedField.required}
                          onChange={(v) => updateField(selectedField.id, { required: v })}
                          // @ts-ignore
                          disabled={selectedField.variable === 'student_name' || selectedField.variable === 'email'}
                        />
                      </div>
                    </>
                  )}
                  {isAuto && (
                    <div className="rounded-lg p-3 text-xs leading-relaxed" style={{ background: '#faf1de', color: '#7a5c1f' }}>
                      مصدر القيمة: {selectedField.variable === 'cert_no' ? 'رقم تسلسلي تلقائي' : 'تاريخ إرسال الرد'}. لا يظهر هذا الحقل للطالب ويملؤه النظام تلقائياً عند إصدار الإجازة.
                    </div>
                  )}
                  {!isAuto && selectedField.variable !== 'student_name' && selectedField.variable !== 'email' && (
                    <button
                      type="button"
                      className="text-xs font-semibold inline-flex items-center gap-1.5 mt-2"
                      style={{ color: '#9c3b3b', background: 'none', border: 'none', cursor: 'pointer' }}
                      onClick={() => deleteField(selectedField.id)}
                    >
                      <Trash2 size={13} />
                      حذف هذا الحقل
                    </button>
                  )}
                </div>
              )
            })()
          )}
        </aside>
      </div>

      {/* ===== تبويب الردود ===== */}
      <div className={`content-bg flex-1 px-5 lg:px-8 py-7 overflow-y-auto text-right ${viewMode === 'responses' ? '' : 'hidden'}`}>
        <div className="card-formal p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-full border flex-1 sm:max-w-xs" style={{ borderColor: '#e0d6b8', background: '#fffdf8' }}>
              <Search size={15} className="opacity-50" />
              <input
                value={submissionsQuery}
                onChange={(e) => {
                  setSubmissionsQuery(e.target.value)
                  setSubmissionsPage(1)
                }}
                placeholder="ابحث باسم الطالب أو بريده..."
                className="bg-transparent outline-none text-sm flex-1 placeholder:opacity-60 text-right"
              />
            </div>
            
            <div className="flex items-center gap-5 flex-wrap justify-end">
              <p className="text-sm" style={{ color: '#6b6457' }}>
                إجمالي الردود:{' '}
                <span className="font-bold" style={{ color: '#16243f' }}>
                  {filteredSubmissions.length.toLocaleString('ar-EG')}
                </span>
              </p>
              <button type="button" className="btn-outline px-3.5 py-1.5 rounded-full text-xs flex items-center gap-1.5" onClick={handleExportCsv}>
                <Download size={13} />
                تنزيل CSV للكل
              </button>
            </div>
          </div>

          {selectedSubmissionIds.length > 0 && (
            <div className="flex items-center justify-between gap-3 mb-4 px-4 py-2.5 rounded-xl" style={{ background: '#f3e6c0' }}>
              <p className="text-sm font-semibold" style={{ color: '#16243f' }}>
                {selectedSubmissionIds.length.toLocaleString('ar-EG')} محدد
              </p>
              <div className="flex items-center gap-2">
                <button type="button" className="btn-outline px-3.5 py-1.5 rounded-full text-xs flex items-center gap-1.5" style={{ background: '#fffdf8' }} onClick={handleDownloadSelectedCsv}>
                  <Download size={13} />
                  تنزيل المحدد CSV
                </button>
                <button type="button" className="btn-outline-red px-3.5 py-1.5 rounded-full text-xs flex items-center gap-1.5" style={{ background: '#fffdf8' }} onClick={deleteSelectedResponses}>
                  <Trash2 size={13} />
                  حذف المحدد
                </button>
              </div>
            </div>
          )}

          {submissionsLoading ? (
            <div className="text-center py-10 text-xs text-muted">جاري تحميل الردود...</div>
          ) : pageItems.length === 0 ? (
            <div className="text-center py-10 text-xs text-muted">لا توجد ردود مطابقة لبحثك</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="resp-table">
                <thead>
                  <tr>
                    <th>
                      <input type="checkbox" checked={allPageSelected} onChange={toggleSelectAllOnPage} style={{ accentColor: '#16243f' }} />
                    </th>
                    <th>الطالب</th>
                    <th>تاريخ الإرسال</th>
                    {formFields.filter(f => f.variable !== 'student_name' && f.variable !== 'email').map((f) => (
                      <th key={f.id}>{f.label}</th>
                    ))}
                    <th>الإجازة</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((r) => {
                    const studentName = r.data?.['student_name'] || r.data?.['اسم الطالب'] || Object.values(r.data)[0] || 'طالب'
                    const studentEmail = r.data?.['email'] || r.data?.['البريد الإلكتروني'] || ''
                    return (
                      <tr key={r.id}>
                        <td>
                          <input type="checkbox" checked={selectedSubmissionIds.includes(r.id)} onChange={() => toggleSelectRow(r.id)} style={{ accentColor: '#16243f' }} />
                        </td>
                        <td>
                          <div className="flex items-center gap-2.5 justify-start">
                            <div className="avatar-ring">{String(studentName).slice(0, 1)}</div>
                            <div className="min-w-0 text-right">
                              <p className="font-semibold truncate" style={{ color: '#16243f' }}>
                                {studentName}
                              </p>
                              {studentEmail && (
                                <p className="text-[11px] truncate" style={{ color: '#a39c8c' }} dir="ltr">
                                  {studentEmail}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={{ color: '#6b6457' }}>
                          {new Date(r.created_at).toLocaleDateString('ar-SA')} <span style={{ color: '#c2b896' }}>·</span> {new Date(r.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        {formFields.filter(f => f.variable !== 'student_name' && f.variable !== 'email').map((f) => (
                          <td key={f.id} style={{ color: '#1f2733', fontWeight: 500 }}>
                            {r.data?.[f.variable] || '—'}
                          </td>
                        ))}
                        <td>
                          <button type="button" className="flex items-center gap-2" style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setViewingSubmission(r)}>
                            <MiniCert />
                            <span className="text-xs font-semibold" style={{ color: '#b8923a' }}>
                              عرض
                            </span>
                          </button>
                        </td>
                        <td>
                          <div className="relative flex justify-end">
                            <button type="button" className="icon-btn" onClick={() => setOpenRowMenu(openRowMenu === r.id ? null : r.id)}>
                              <MoreVertical size={16} />
                            </button>
                            {openRowMenu === r.id && (
                              <>
                                <div className="fixed inset-0 z-10" onClick={() => setOpenRowMenu(null)} />
                                <div className="dropdown-menu absolute left-0 top-9 z-20 w-52 py-1.5">
                                  <button
                                    type="button"
                                    className="dropdown-item"
                                    onClick={() => {
                                      setViewingSubmission(r)
                                      setOpenRowMenu(null)
                                    }}
                                  >
                                    <Eye size={14} />
                                    عرض الإجازة
                                  </button>
                                  <button type="button" className="dropdown-item" onClick={() => {
                                    handleDownloadPdfForSubmission(r)
                                    setOpenRowMenu(null)
                                  }}>
                                    <Download size={14} />
                                    تنزيل PDF
                                  </button>
                                  <div className="my-1.5 border-t" style={{ borderColor: '#e7ddc4' }} />
                                  <button type="button" className="dropdown-item" style={{ color: '#9c3b3b' }} onClick={() => deleteOneResponse(r)}>
                                    <Trash2 size={14} />
                                    حذف الإجازة
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {filteredSubmissions.length > 0 && (
            <div className="flex items-center justify-between mt-5 pt-4 border-t" style={{ borderColor: '#efe9da' }}>
              <p className="text-xs" style={{ color: '#a39c8c' }}>
                عرض {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filteredSubmissions.length)} من {filteredSubmissions.length.toLocaleString('ar-EG')} ردًا
              </p>
              <div className="flex items-center gap-2">
                <button type="button" className="page-btn" disabled={safePage === 1} onClick={() => setSubmissionsPage(safePage - 1)}>
                  <ChevronRight size={15} />
                </button>
                <span className="text-xs px-2" style={{ color: '#6b6457' }}>
                  {safePage} / {totalPages}
                </span>
                <button type="button" className="page-btn" disabled={safePage === totalPages} onClick={() => setSubmissionsPage(safePage + 1)}>
                  <ChevronLeft size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <DateTimePickerModal
        isOpen={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        value={autoCloseAt}
        onChange={setAutoCloseAt}
      />

      <CertificateModal
        response={viewingSubmission}
        onClose={() => setViewingSubmission(null)}
        cert={cert}
        responseCertRef={responseCertRef}
        onDownloadPdf={() => handleDownloadPdfForSubmission(viewingSubmission)}
        onDelete={deleteOneResponse}
      />

      <SpectrumColorPickerModal
        isOpen={spectrumModalOpen}
        initialColor={activeColor}
        onClose={() => setSpectrumModalOpen(false)}
        onSelectColor={(color) => {
          applyStyle('color', color)
          setSpectrumModalOpen(false)
        }}
      />

      {toast && (
        <div className={`toast toast-${toast.type}`} role="status">
          {toast.msg}
        </div>
      )}
    </div>
  )
}
