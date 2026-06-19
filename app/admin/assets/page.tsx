'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import type { Asset } from '@/lib/types'
import Link from 'next/link'

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<'signature' | 'stamp'>('signature')
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const loadAssets = useCallback(async () => {
    try {
      const res = await fetch('/api/assets')
      const data = await res.json()
      setAssets(data)
    } catch {
      showToast('فشل تحميل الأصول', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAssets()
  }, [loadAssets])

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
    // Auto-fill name from filename
    if (!newName) {
      setNewName(file.name.replace(/\.[^.]+$/, ''))
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedFile || !newName.trim()) return
    setUploading(true)

    try {
      // 1. Upload file to storage
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('folder', newType)

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok) throw new Error(uploadData.error)

      // 2. Save metadata to DB
      const metaRes = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          type: newType,
          storage_path: uploadData.storage_path,
          public_url: uploadData.public_url,
        }),
      })
      const metaData = await metaRes.json()
      if (!metaRes.ok) throw new Error(metaData.error)

      setAssets((prev) => [metaData, ...prev])
      setNewName('')
      setSelectedFile(null)
      setPreview(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      showToast('تم رفع الأصل بنجاح ✓')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'فشل الرفع'
      showToast(msg, 'error')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`هل تريد حذف "${name}"؟`)) return
    try {
      await fetch(`/api/assets/${id}`, { method: 'DELETE' })
      setAssets((prev) => prev.filter((a) => a.id !== id))
      showToast('تم الحذف')
    } catch {
      showToast('فشل الحذف', 'error')
    }
  }

  const signatures = assets.filter((a) => a.type === 'signature')
  const stamps = assets.filter((a) => a.type === 'stamp')

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Nav */}
      <nav className="nav">
        <div className="nav-inner">
          <div className="flex items-center gap-2">
            <Link href="/admin" className="btn btn-secondary btn-sm">
              ← العودة للوحة التحكم
            </Link>
            <span className="nav-logo" style={{ fontSize: '1.1rem' }}>التواقيع والأختام</span>
          </div>
        </div>
      </nav>

      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        <div className="page-header" style={{ textAlign: 'right', paddingTop: '1rem' }}>
          <h1>مكتبة التواقيع والأختام</h1>
          <p>ارفع صور التواقيع والأختام لاستخدامها بسهولة في قوالب الإجازات</p>
        </div>

        <div className="assets-layout">
          {/* Upload Panel */}
          <div className="card" style={{ height: 'fit-content', position: 'sticky', top: '80px' }}>
            <h3 style={{ marginBottom: '1.25rem' }}>إضافة توقيع أو ختم</h3>
            <form onSubmit={handleUpload}>
              {/* Dropzone */}
              <div
                className="dropzone"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const file = e.dataTransfer.files[0]
                  if (file) {
                    setSelectedFile(file)
                    const reader = new FileReader()
                    reader.onload = (ev) => setPreview(ev.target?.result as string)
                    reader.readAsDataURL(file)
                    if (!newName) setNewName(file.name.replace(/\.[^.]+$/, ''))
                  }
                }}
              >
                {preview ? (
                  <img src={preview} alt="معاينة" className="dropzone-preview" />
                ) : (
                  <>
                    <div className="dropzone-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40">
                        <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <p className="dropzone-text">اسحب صورة هنا أو اضغط للاختيار</p>
                    <p className="dropzone-hint">PNG, JPG, SVG, WebP</p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                id="file-input"
              />

              <div className="form-group">
                <label className="form-label" htmlFor="asset-name">اسم الأصل</label>
                <input
                  id="asset-name"
                  className="form-input"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="مثال: توقيع المدير"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="asset-type">النوع</label>
                <select
                  id="asset-type"
                  className="form-select"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as 'signature' | 'stamp')}
                >
                  <option value="signature">توقيع</option>
                  <option value="stamp">ختم</option>
                </select>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={!selectedFile || !newName.trim() || uploading}
                id="upload-asset-btn"
                style={{ width: '100%' }}
              >
                {uploading ? (
                  <>
                    <span className="spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px' }} />
                    جاري الرفع...
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" width="16" height="16" stroke="currentColor" strokeWidth="2">
                      <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    رفع الأصل
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Assets Grid */}
          <div>
            {loading ? (
              <div className="loading-screen" style={{ minHeight: '200px' }}>
                <div className="spinner" />
              </div>
            ) : assets.length === 0 ? (
              <div className="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <h3>لا توجد أصول بعد</h3>
                <p>ارفع أول توقيع أو ختم من الجانب</p>
              </div>
            ) : (
              <>
                {signatures.length > 0 && (
                  <section style={{ marginBottom: '2rem' }}>
                    <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>✍️</span> التواقيع ({signatures.length})
                    </h3>
                    <div className="assets-grid">
                      {signatures.map((asset) => (
                        <AssetCard key={asset.id} asset={asset} onDelete={handleDelete} />
                      ))}
                    </div>
                  </section>
                )}

                {stamps.length > 0 && (
                  <section>
                    <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>🔏</span> الأختام ({stamps.length})
                    </h3>
                    <div className="assets-grid">
                      {stamps.map((asset) => (
                        <AssetCard key={asset.id} asset={asset} onDelete={handleDelete} />
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <div className={`toast toast-${toast.type}`} role="status">{toast.msg}</div>
      )}

      <style jsx>{`
        .assets-layout {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 2rem;
          align-items: start;
        }

        @media (max-width: 900px) {
          .assets-layout { grid-template-columns: 1fr; }
        }

        .dropzone {
          border: 2px dashed var(--border-strong);
          border-radius: var(--radius-md);
          padding: 2rem 1rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 1.2rem;
          background: var(--bg-input);
          min-height: 160px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .dropzone:hover {
          border-color: var(--primary);
          background: rgba(108, 71, 255, 0.05);
        }

        .dropzone-preview {
          max-height: 120px;
          max-width: 100%;
          object-fit: contain;
        }

        .dropzone-icon { color: var(--text-muted); }
        .dropzone-text { color: var(--text-secondary); font-size: 0.9rem; }
        .dropzone-hint { color: var(--text-muted); font-size: 0.78rem; }

        .assets-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 1rem;
        }
      `}</style>
    </div>
  )
}

function AssetCard({ asset, onDelete }: { asset: Asset; onDelete: (id: string, name: string) => void }) {
  const [copied, setCopied] = useState(false)

  function copyUrl() {
    navigator.clipboard.writeText(asset.public_url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="asset-card">
      <img src={asset.public_url} alt={asset.name} />
      <div className="asset-card-info">
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {asset.name}
        </span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            className="btn btn-secondary btn-icon"
            style={{ padding: '3px 6px', fontSize: '0.7rem' }}
            onClick={copyUrl}
            title="نسخ الرابط"
          >
            {copied ? '✓' : '🔗'}
          </button>
          <button
            className="btn btn-danger btn-icon"
            style={{ padding: '3px 6px', fontSize: '0.7rem' }}
            onClick={() => onDelete(asset.id, asset.name)}
            title="حذف"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}
