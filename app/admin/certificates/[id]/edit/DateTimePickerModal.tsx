'use client'

import React, { useEffect, useState, useRef } from 'react'
import { ChevronLeft, ChevronRight, Calendar, Clock, Info } from 'lucide-react'

interface DateTimePickerModalProps {
  isOpen: boolean
  onClose: () => void
  value: string // Format: YYYY-MM-DDTHH:MM
  onChange: (value: string) => void
}

export const MONTH_NAMES = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
]

export const WEEKDAYS = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت']

export function getHour24(h12: number, period: 'AM' | 'PM') {
  if (period === 'AM') {
    return h12 === 12 ? 0 : h12
  } else {
    return h12 === 12 ? 12 : h12 + 12
  }
}

export function getHour12(h24: number): { hour12: number; period: 'AM' | 'PM' } {
  const period = h24 >= 12 ? 'PM' : 'AM'
  let hour12 = h24 % 12
  if (hour12 === 0) hour12 = 12
  return { hour12, period }
}

export default function DateTimePickerModal({
  isOpen,
  onClose,
  value,
  onChange,
}: DateTimePickerModalProps) {
  // Parsing initial value or defaulting to Mecca current time
  const [selectedYear, setSelectedYear] = useState(2026)
  const [selectedMonth, setSelectedMonth] = useState(5) // 0-indexed
  const [selectedDay, setSelectedDay] = useState(20)
  const [selectedHour, setSelectedHour] = useState(12) // 1-12
  const [selectedMinute, setSelectedMinute] = useState(0) // 0-59
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('PM')

  // Calendar View month & year
  const [viewMonth, setViewMonth] = useState(5)
  const [viewYear, setViewYear] = useState(2026)

  // Scroll Refs
  const hourScrollRef = useRef<HTMLDivElement>(null)
  const minuteScrollRef = useRef<HTMLDivElement>(null)

  // Initialize values when modal opens
  useEffect(() => {
    if (isOpen) {
      let parsedDate: Date
      if (value) {
        // Parse value as Mecca local components
        // value format: YYYY-MM-DDTHH:MM
        const [datePart, timePart] = value.split('T')
        const [y, m, d] = datePart.split('-').map(Number)
        const [h, min] = timePart.split(':').map(Number)
        
        setSelectedYear(y)
        setSelectedMonth(m - 1)
        setSelectedDay(d)
        
        const { hour12, period } = getHour12(h)
        setSelectedHour(hour12)
        setSelectedMinute(min)
        setSelectedPeriod(period)

        setViewMonth(m - 1)
        setViewYear(y)
      } else {
        // Default to Mecca Time now (UTC + 3 hours)
        const now = new Date()
        const meccaTime = new Date(now.getTime() + 3 * 3600000)
        const y = meccaTime.getUTCFullYear()
        const m = meccaTime.getUTCMonth()
        const d = meccaTime.getUTCDate()
        const h24 = meccaTime.getUTCHours()
        const min = meccaTime.getUTCMinutes()

        setSelectedYear(y)
        setSelectedMonth(m)
        setSelectedDay(d)

        const { hour12, period } = getHour12(h24)
        setSelectedHour(hour12)
        setSelectedMinute(min)
        setSelectedPeriod(period)

        setViewMonth(m)
        setViewYear(y)
      }
    }
  }, [isOpen, value])

  // Center selected items in scroll containers when modal opens or selections change
  useEffect(() => {
    if (isOpen) {
      // Small timeout to allow DOM node rendering / scroll dimensions to settle
      const timer = setTimeout(() => {
        if (hourScrollRef.current) {
          const activeItem = hourScrollRef.current.querySelector('.active') as HTMLElement
          if (activeItem) {
            hourScrollRef.current.scrollTop = activeItem.offsetTop - hourScrollRef.current.clientHeight / 2 + activeItem.clientHeight / 2
          }
        }
        if (minuteScrollRef.current) {
          const activeItem = minuteScrollRef.current.querySelector('.active') as HTMLElement
          if (activeItem) {
            minuteScrollRef.current.scrollTop = activeItem.offsetTop - minuteScrollRef.current.clientHeight / 2 + activeItem.clientHeight / 2
          }
        }
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [isOpen, selectedHour, selectedMinute])

  if (!isOpen) return null

  // Calendar calculations
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay() // Sunday = 0

  const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1
  const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear
  const prevDaysInMonth = new Date(prevYear, prevMonth + 1, 0).getDate()

  const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1
  const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear

  // Calendar cells grid
  const cells = []
  
  // 1. Trailing days from previous month
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const dayNum = prevDaysInMonth - i
    cells.push({
      day: dayNum,
      month: prevMonth,
      year: prevYear,
      isCurrentMonth: false,
    })
  }

  // 2. Active days of current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      day: d,
      month: viewMonth,
      year: viewYear,
      isCurrentMonth: true,
    })
  }

  // 3. Leading days of next month to fill 42 cells (6 rows)
  const totalCells = 42
  const remaining = totalCells - cells.length
  for (let d = 1; d <= remaining; d++) {
    cells.push({
      day: d,
      month: nextMonth,
      year: nextYear,
      isCurrentMonth: false,
    })
  }

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(prev => prev - 1)
    } else {
      setViewMonth(prev => prev - 1)
    }
  }

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear(prev => prev + 1)
    } else {
      setViewMonth(prev => prev + 1)
    }
  }

  const selectDate = (day: number, month: number, year: number) => {
    setSelectedDay(day)
    setSelectedMonth(month)
    setSelectedYear(year)
  }

  const handleApply = () => {
    const h24 = getHour24(selectedHour, selectedPeriod)
    const yStr = selectedYear
    const mStr = String(selectedMonth + 1).padStart(2, '0')
    const dStr = String(selectedDay).padStart(2, '0')
    const hStr = String(h24).padStart(2, '0')
    const minStr = String(selectedMinute).padStart(2, '0')
    
    onChange(`${yStr}-${mStr}-${dStr}T${hStr}:${minStr}`)
    onClose()
  }

  // Formatting displays
  const displayTime = `${String(selectedHour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`
  const isToday = (day: number, month: number, year: number) => {
    const meccaToday = new Date(Date.now() + 3 * 3600000)
    return (
      day === meccaToday.getUTCDate() &&
      month === meccaToday.getUTCMonth() &&
      year === meccaToday.getUTCFullYear()
    )
  }

  return (
    <div className="dt-picker-overlay" onClick={onClose}>
      <div className="dt-picker-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="dt-picker-header">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#16243f] flex items-center gap-2">
              <Calendar size={18} className="text-[#b8923a]" />
              <span>جدولة وقت الإغلاق</span>
            </h3>
            <button 
              type="button" 
              onClick={onClose} 
              className="text-[#6b6457] hover:text-[#16243f] text-xs font-bold"
            >
              إغلاق
            </button>
          </div>
          {/* Timezone Note */}
          <div className="dt-picker-timezone-note">
            <Info size={14} className="text-[#b8923a]" />
            <span>ملاحظة: يتم حفظ وضبط الأوقات حسب توقيت مكة المكرمة (UTC+3).</span>
          </div>
        </div>

        {/* Panels Body */}
        <div className="dt-picker-body">
          {/* Calendar Panel */}
          <div className="dt-calendar-panel">
            <div className="dt-calendar-header">
              <button 
                type="button" 
                onClick={handlePrevMonth} 
                className="dt-calendar-nav-btn"
                title="الشهر السابق"
              >
                <ChevronRight size={16} />
              </button>
              <div className="dt-calendar-month-year">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </div>
              <button 
                type="button" 
                onClick={handleNextMonth} 
                className="dt-calendar-nav-btn"
                title="الشهر التالي"
              >
                <ChevronLeft size={16} />
              </button>
            </div>

            <div className="dt-calendar-grid">
              {WEEKDAYS.map((w, idx) => (
                <div key={idx} className="dt-calendar-weekday">
                  {w}
                </div>
              ))}
              {cells.map((cell, idx) => {
                const isSelected = 
                  selectedDay === cell.day && 
                  selectedMonth === cell.month && 
                  selectedYear === cell.year
                
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => selectDate(cell.day, cell.month, cell.year)}
                    className={`dt-calendar-day ${!cell.isCurrentMonth ? 'muted' : ''} ${isSelected ? 'selected' : ''} ${isToday(cell.day, cell.month, cell.year) ? 'today' : ''}`}
                  >
                    {cell.day}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Time Panel */}
          <div className="dt-time-panel">
            <div className="dt-time-title flex items-center gap-1.5">
              <Clock size={14} className="text-[#b8923a]" />
              <span>الوقت</span>
            </div>
            
            {/* Big Readout */}
            <div className="dt-time-display">
              <span>{displayTime}</span>
              <span className="period">{selectedPeriod === 'AM' ? 'ص' : 'م'}</span>
            </div>

            {/* Wheels Scroll Columns */}
            <div className="dt-time-wheels-container">
              {/* Hour Wheel */}
              <div className="dt-time-wheel-col" ref={hourScrollRef}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setSelectedHour(h)}
                    className={`dt-time-wheel-btn ${selectedHour === h ? 'active' : ''}`}
                  >
                    {String(h).padStart(2, '0')}
                  </button>
                ))}
              </div>

              {/* Minute Wheel */}
              <div className="dt-time-wheel-col minute-col" ref={minuteScrollRef}>
                {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSelectedMinute(m)}
                    className={`dt-time-wheel-btn ${selectedMinute === m ? 'active' : ''}`}
                  >
                    {String(m).padStart(2, '0')}
                  </button>
                ))}
              </div>

              {/* AM/PM Column */}
              <div className="dt-time-wheel-col period-col">
                <button
                  type="button"
                  onClick={() => setSelectedPeriod('AM')}
                  className={`dt-time-wheel-btn ${selectedPeriod === 'AM' ? 'active' : ''}`}
                  style={{ height: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  ص
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPeriod('PM')}
                  className={`dt-time-wheel-btn ${selectedPeriod === 'PM' ? 'active' : ''}`}
                  style={{ height: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  م
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="dt-picker-footer">
          <button 
            type="button" 
            className="btn btn-secondary py-1.5 px-4 text-xs font-semibold"
            onClick={onClose}
          >
            إلغاء
          </button>
          <button 
            type="button" 
            className="btn btn-gold py-1.5 px-5 text-xs font-bold"
            onClick={handleApply}
            style={{ background: 'var(--navy-dark)', color: '#f3e6c0', borderColor: 'var(--navy-dark)' }}
          >
            تطبيق
          </button>
        </div>
      </div>
    </div>
  )
}
