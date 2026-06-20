'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import type { Asset } from '@/lib/types'
import { Trash2, Link2, Upload, AlertCircle } from 'lucide-react'

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
      setAssets(data || [])
    } catch {
      showToast('فشل تحميل الأصول من المكتبة', 'error')
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
      showToast('تم رفع الصورة بنجاح وتخزينها ✓')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'فشل رفع الصورة'
      showToast(msg, 'error')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`هل تريد حذف "${name}" نهائياً من المكتبة؟`)) return
    try {
      const res = await fetch(`/api/assets/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setAssets((prev) => prev.filter((a) => a.id !== id))
      showToast('تم حذف العنصر بنجاح')
    } catch {
      showToast('فشل حذف العنصر', 'error')
    }
  }

  const signatures = assets.filter((a) => a.type === 'signature')
  const stamps = assets.filter((a) => a.type === 'stamp')

  return (
    <div className="px-5 lg:px-8 py-7 text-right">
      <div className="mb-6">
        <h1 className="font-amiri text-3xl font-bold" style={{ color: 'var(--navy-dark)' }}>
          مكتبة التواقيع والأختام
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          ارفع صور الأختام الرسمية والتواقيع المعتمدة لتضمينها في قوالب شهادات الإجازة
        </p>
        <div className="divider-rule mt-4">
          <div className="line" />
          <div className="diamond" />
          <div className="line" />
        </div>
      </div>

      <div className="assets-layout">
        {/* رفع أصل جديد */}
        <div className="card-formal p-6" style={{ height: 'fit-content' }}>
          <h3 className="font-amiri text-lg font-bold mb-4" style={{ color: 'var(--navy-dark)' }}>
            إضافة ختم أو توقيع جديد
          </h3>
          
          <form onSubmit={handleUpload}>
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
              style={{ border: '2px dashed var(--border-gold)', background: 'var(--bg-cream)' }}
            >
              {preview ? (
                <img src={preview} alt="معاينة" className="dropzone-preview max-h-28 object-contain" />
              ) : (
                <div className="flex flex-col items-center gap-1.5 py-4">
                  <Upload size={32} style={{ color: 'var(--gold-main)' }} />
                  <p className="text-xs font-bold" style={{ color: 'var(--navy-dark)' }}>اسحب الصورة هنا أو اضغط للاختيار</p>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>PNG, JPG, SVG, WebP</p>
                </div>
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

            <div className="form-group mt-4">
              <label className="form-label" htmlFor="asset-name">اسم الملف/التسمية</label>
              <input
                id="asset-name"
                className="form-input"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="مثال: ختم الأكاديمية الرسمي"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="asset-type">التصنيف</label>
              <select
                id="asset-type"
                className="form-select"
                value={newType}
                onChange={(e) => setNewType(e.target.value as 'signature' | 'stamp')}
              >
                <option value="signature">توقيع مشرف / مدير</option>
                <option value="stamp">ختم المؤسسة الرسمي</option>
              </select>
            </div>

            <button
              type="submit"
              className="btn btn-gold w-full flex items-center justify-center gap-2 mt-2"
              disabled={!selectedFile || !newName.trim() || uploading}
            >
              {uploading ? (
                <>
                  <span className="spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px' }} />
                  <span>جاري الرفع...</span>
                </>
              ) : (
                <>
                  <Upload size={16} />
                  <span>رفع للمكتبة</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* شبكة الأصول */}
        <div className="flex flex-col gap-6">
          {loading ? (
            <div className="loading-screen" style={{ minHeight: '200px' }}>
              <div className="spinner" />
            </div>
          ) : assets.length === 0 ? (
            <div className="card-formal p-10 text-center flex flex-col items-center justify-center">
              <AlertCircle size={40} style={{ color: 'var(--gold-main)', opacity: 0.6 }} className="mb-3" />
              <h3 className="font-amiri text-lg font-bold" style={{ color: 'var(--navy-dark)' }}>لا توجد ملفات مرفوعة</h3>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>ابدأ برفع أول توقيع أو ختم من خلال النموذج الجانبي</p>
            </div>
          ) : (
            <>
              {signatures.length > 0 && (
                <section>
                  <h3 className="font-amiri text-lg font-bold mb-3" style={{ color: 'var(--navy-dark)' }}>
                    ✍️ التواقيع ({signatures.length})
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
                  <h3 className="font-amiri text-lg font-bold mb-3 mt-4" style={{ color: 'var(--navy-dark)' }}>
                    🔏 الأختام ({stamps.length})
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

      {toast && (
        <div className={`toast toast-${toast.type}`} role="status">{toast.msg}</div>
      )}

      <style jsx>{`
        .assets-layout {
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: 2rem;
          align-items: start;
        }

        @media (max-width: 900px) {
          .assets-layout { grid-template-columns: 1fr; }
        }

        .dropzone {
          border-radius: var(--radius-md);
          padding: 1.5rem 1rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 120px;
        }

        .dropzone:hover {
          border-color: var(--gold-focus) !important;
          background: #fffdf2 !important;
        }

        .assets-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 1.25rem;
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
    <div className="asset-card card-formal overflow-hidden flex flex-col">
      <div className="flex-1 bg-white p-3 flex items-center justify-center h-28 border-b" style={{ borderColor: 'var(--border-gold)' }}>
        <img src={asset.public_url} alt={asset.name} className="max-h-full max-w-full object-contain pointer-events-none" />
      </div>
      <div className="p-3 flex items-center justify-between gap-1">
        <span className="text-xs font-semibold truncate flex-1 leading-none text-right" style={{ color: 'var(--text-main)' }} title={asset.name}>
          {asset.name}
        </span>
        <div className="flex gap-1 flex-shrink-0">
          <button
            className="icon-action"
            style={{ width: '1.65rem', height: '1.65rem', padding: 0 }}
            onClick={copyUrl}
            title="نسخ الرابط المباشر للصورة"
          >
            <Link2 size={13} />
          </button>
          <button
            className="icon-action hover:text-red-700"
            style={{ width: '1.65rem', height: '1.65rem', padding: 0 }}
            onClick={() => onDelete(asset.id, asset.name)}
            title="حذف الصورة من المكتبة"
          >
            <Trash2 size={13} style={{ color: 'var(--danger)' }} />
          </button>
        </div>
      </div>
    </div>
  )
}
