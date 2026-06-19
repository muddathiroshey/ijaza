'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
    <div className="login-page">
      <div className="login-container">
        {/* Logo */}
        <div className="login-logo">
          <svg viewBox="0 0 60 60" fill="none">
            <rect width="60" height="60" rx="16" fill="url(#grad)" />
            <path d="M15 22h30M15 30h20M15 38h24" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="44" cy="38" r="6" fill="white" fillOpacity="0.9" />
            <path d="M41.5 38l1.5 1.5L45.5 36" stroke="#6c47ff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="60" y2="60" gradientUnits="userSpaceOnUse">
                <stop stopColor="#6c47ff" />
                <stop offset="1" stopColor="#5235d4" />
              </linearGradient>
            </defs>
          </svg>
          <span>منصة الإجازات</span>
        </div>

        <div className="card-glass login-card">
          <h1>تسجيل الدخول</h1>
          <p>أدخل كلمة المرور للوصول إلى لوحة الإدارة</p>

          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label className="form-label" htmlFor="password">كلمة المرور</label>
              <input
                id="password"
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="أدخل كلمة المرور"
                required
                autoFocus
              />
            </div>

            {error && (
              <div className="login-error" role="alert">
                <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              id="login-submit-btn"
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              {loading ? (
                <>
                  <span className="spinner" style={{ width: '1.1rem', height: '1.1rem', borderWidth: '2px' }} />
                  جاري التحقق...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                    <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  دخول
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      <style jsx>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .login-container {
          width: 100%;
          max-width: 420px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
        }

        .login-logo {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          font-size: 1.6rem;
          font-weight: 800;
          background: linear-gradient(135deg, #f0f0ff, #8b6fff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .login-logo svg {
          width: 70px;
          height: 70px;
          filter: drop-shadow(0 0 20px rgba(108, 71, 255, 0.5));
        }

        .login-card {
          width: 100%;
          text-align: center;
        }

        .login-card h1 {
          font-size: 1.6rem;
          margin-bottom: 0.5rem;
        }

        .login-card p {
          margin-bottom: 2rem;
          font-size: 0.95rem;
        }

        .login-form {
          text-align: right;
        }

        .login-error {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px;
          padding: 0.65rem 1rem;
          font-size: 0.9rem;
          margin-bottom: 0.75rem;
        }
      `}</style>
    </div>
  )
}
