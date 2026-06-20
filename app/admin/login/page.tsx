'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Lock } from 'lucide-react'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      const data = await res.json()

      if (data.success) {
        router.push('/admin')
      } else {
        setError(data.error || 'كلمة المرور غير صحيحة')
      }
    } catch {
      setError('حدث خطأ، حاول مجدداً')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page content-bg min-h-screen flex items-center justify-center p-4">
      {/* Decorative Watermark */}
      <svg
        viewBox="0 0 400 400"
        className="pointer-events-none absolute w-96 h-96 opacity-[0.03]"
        aria-hidden="true"
      >
        <g transform="translate(200,200)">
          <rect x="-110" y="-110" width="220" height="220" fill="none" stroke="#16243f" strokeWidth="3" transform="rotate(0)" />
          <rect x="-110" y="-110" width="220" height="220" fill="none" stroke="#16243f" strokeWidth="3" transform="rotate(45)" />
          <circle r="150" fill="none" stroke="#16243f" strokeWidth="2" />
        </g>
      </svg>

      <div className="login-container w-full max-w-[420px] flex flex-col items-center gap-6">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(201,162,39,0.18)', border: '2.5px solid var(--gold-focus)' }}>
            <Sparkles size={22} color="var(--gold-main)" />
          </div>
          <div className="text-right">
            <h2 className="font-amiri text-2xl font-bold leading-none" style={{ color: 'var(--navy-dark)' }}>
              محرر الإجازات
            </h2>
            <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
              منصة الشهادات الرقمية
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="card-formal w-full p-8" style={{ background: 'var(--bg-card)' }}>
          <h1 className="font-amiri text-2xl font-bold text-center mb-1" style={{ color: 'var(--navy-dark)' }}>
            تسجيل الدخول
          </h1>
          <p className="text-xs text-center mb-6" style={{ color: 'var(--text-muted)' }}>
            أدخل كلمة المرور للوصول إلى لوحة الإدارة
          </p>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="form-group text-right">
              <label className="form-label" htmlFor="password">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  className="form-input pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور"
                  required
                  autoFocus
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: '#a39c8c' }}>
                  <Lock size={16} />
                </span>
              </div>
            </div>

            {error && (
              <div className="login-error flex items-center gap-2 text-xs p-3 rounded-lg" style={{ background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid rgba(156, 59, 59, 0.2)' }}>
                <svg viewBox="0 0 24 24" fill="none" width="16" height="16" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
                </svg>
                <span className="font-semibold">{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-gold btn-lg w-full flex items-center justify-center gap-2 mt-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" style={{ width: '1.1rem', height: '1.1rem', borderWidth: '2px' }} />
                  جاري التحقق...
                </>
              ) : (
                <>
                  <span>دخول لوحة التحكم</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
