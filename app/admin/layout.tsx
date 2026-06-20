'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Inbox,
  Stamp,
  Users,
  Settings,
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  X,
  Sparkles,
} from 'lucide-react'

const NAV_ITEMS = [
  { key: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard, href: '/admin' },
  { key: 'assets', label: 'الأختام والتوقيعات', icon: Stamp, href: '/admin/assets' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Don't show admin sidebar/layout on login page or editor page
  if (pathname === '/admin/login' || pathname.includes('/edit')) {
    return <>{children}</>
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  return (
    <div dir="rtl" className="min-h-screen flex" style={{ background: 'var(--bg-cream)' }}>
      {/* ===== الشريط الجانبي (Sidebar) ===== */}
      <aside
        className={`sidebar w-64 flex-shrink-0 flex-col p-4 fixed inset-y-0 right-0 z-30 transition-transform duration-200 ${
          mobileNavOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        } lg:static lg:flex`}
      >
        <div className="flex flex-col h-full">
          {/* Logo / Title */}
          <div className="flex items-center justify-between lg:justify-start gap-3 px-1 pb-5 mb-4 border-b" style={{ borderColor: 'rgba(243,230,192,0.15)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(201,162,39,0.18)', border: '1.5px solid var(--gold-focus)' }}>
                <Sparkles size={18} color="var(--gold-light)" />
              </div>
              <div className="text-right">
                <p className="font-amiri text-xl font-bold leading-none" style={{ color: '#f3e6c0' }}>
                  محرر الإجازات
                </p>
                <p className="text-[11px] mt-1" style={{ color: '#8d93a8' }}>
                  منصة الشهادات الرقمية
                </p>
              </div>
            </div>
            <button className="lg:hidden text-gray-300" onClick={() => setMobileNavOpen(false)}>
              <X size={20} />
            </button>
          </div>

          {/* Nav Items */}
          <nav className="flex flex-col gap-1 flex-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileNavOpen(false)}
                >
                  <item.icon size={17} />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* User profile footer */}
          <div className="pt-4 mt-4 border-t" style={{ borderColor: 'rgba(243,230,192,0.15)' }}>
            <div className="flex items-center gap-3 px-1">
              <div className="avatar-ring">م.ع</div>
              <div className="flex-1 min-w-0 text-right">
                <p className="text-sm font-semibold truncate" style={{ color: '#f3e6c0' }}>
                  محمد العتيبي
                </p>
                <p className="text-[11px]" style={{ color: '#8d93a8' }}>
                  مشرف عام
                </p>
              </div>
              <button
                onClick={handleLogout}
                title="تسجيل الخروج"
                className="text-gray-400 hover:text-amber-300 transition-colors"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* mobile backdrop overlay */}
      {mobileNavOpen && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setMobileNavOpen(false)} />
      )}

      {/* ===== المحتوى الرئيسي ===== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between gap-4 px-5 lg:px-8 py-4 bg-white/70 backdrop-blur border-b" style={{ borderColor: 'var(--border-gold)' }}>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button className="lg:hidden icon-action" style={{ color: 'var(--navy-dark)' }} onClick={() => setMobileNavOpen(true)}>
              <Menu size={20} />
            </button>
            <div className="hidden sm:flex items-center gap-2 max-w-md w-full px-3.5 py-2 rounded-full border" style={{ borderColor: 'var(--border-gold)', background: 'var(--bg-card)' }}>
              <span className="opacity-60" style={{ color: 'var(--text-muted)' }}>🔍</span>
              <input
                type="text"
                placeholder="ابحث عن إجازة..."
                className="bg-transparent outline-none text-sm flex-1 placeholder:opacity-60"
                style={{ border: 'none' }}
                disabled
              />
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <button className="icon-action relative" style={{ color: 'var(--navy-dark)' }}>
              <Bell size={19} />
              <span className="absolute top-1 left-1.5 w-1.5 h-1.5 rounded-full" style={{ background: 'var(--gold-main)' }} />
            </button>
            <div className="hidden md:flex items-center gap-2 pr-3 border-r cursor-pointer" style={{ borderColor: 'var(--border-gold)' }}>
              <div className="avatar-ring" style={{ background: '#f3e6c0', color: 'var(--navy-dark)' }}>
                أ.ن
              </div>
              <div className="leading-tight text-right">
                <p className="text-sm font-bold" style={{ color: 'var(--navy-dark)' }}>
                  أكاديمية النور
                </p>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  حساب المؤسسة
                </p>
              </div>
              <ChevronDown size={15} style={{ color: 'var(--text-muted)' }} />
            </div>
          </div>
        </header>

        {/* content wrapper */}
        <main className="content-bg flex-1 overflow-y-auto relative">
          {children}
        </main>
      </div>
    </div>
  )
}
