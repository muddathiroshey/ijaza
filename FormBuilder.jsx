import React, { useState } from "react";
import {
  ArrowRight,
  Type,
  AlignLeft,
  Calendar,
  Hash,
  Mail,
  List,
  GripVertical,
  Trash2,
  Plus,
  Eye,
  Save,
  Sparkles,
  Info,
  Link2,
  Copy,
  CheckCircle2,
  Lock,
  Clock,
  Share2,
} from "lucide-react";

/* ---------------------------------- بيانات أولية ---------------------------------- */

const INITIAL_FIELDS = [
  { id: "student_name", key: "اسم الطالب", label: "الاسم الكامل للطالب/ـة", type: "text", source: "student", required: true, placeholder: "اكتب اسمك الكامل", linked: true },
  { id: "email", key: "البريد الإلكتروني", label: "البريد الإلكتروني لاستلام الإجازة", type: "email", source: "student", required: true, placeholder: "name@example.com", linked: false },
  { id: "cert_no", key: "رقم الإجازة", label: "رقم الإجازة", source: "auto", autoType: "رقم تسلسلي تلقائي", linked: true },
  { id: "issue_date", key: "تاريخ الإصدار", label: "تاريخ الإصدار", source: "auto", autoType: "تاريخ إرسال الرد", linked: true },
];

const TYPE_OPTIONS = [
  { value: "text", label: "نص قصير", icon: Type },
  { value: "textarea", label: "نص طويل", icon: AlignLeft },
  { value: "date", label: "تاريخ", icon: Calendar },
  { value: "number", label: "رقم", icon: Hash },
  { value: "email", label: "بريد إلكتروني", icon: Mail },
  { value: "select", label: "قائمة منسدلة", icon: List },
];

function fieldIcon(type) {
  return (TYPE_OPTIONS.find((t) => t.value === type) || TYPE_OPTIONS[0]).icon;
}

function generateSlug() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < 7; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

/* ---------------------------------- عناصر مساعدة ---------------------------------- */

function Switch({ checked, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="switch-track" style={{ background: checked ? "#16243f" : "#e0d6b8" }}>
      <span className="switch-knob" style={{ left: checked ? "calc(100% - 1.3rem)" : "0.2rem" }} />
    </button>
  );
}

/* ---------------------------------- التطبيق الرئيسي ---------------------------------- */

export default function FormBuilder() {
  const [formTitle, setFormTitle] = useState("نموذج إجازة حفظ القرآن الكريم – جزء عمّ");
  const [formDescription, setFormDescription] = useState("يرجى تعبئة بياناتكم بدقة، حيث ستُستخدم كما هي في إصدار الإجازة.");
  const [fields, setFields] = useState(INITIAL_FIELDS);
  const [selectedId, setSelectedId] = useState(null);
  const idCounter = React.useRef(1);

  const [status, setStatus] = useState("draft"); // draft | published
  const [shareLink, setShareLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [acceptingResponses, setAcceptingResponses] = useState(true);
  const [autoCloseEnabled, setAutoCloseEnabled] = useState(false);
  const [closeAt, setCloseAt] = useState("");

  const selected = fields.find((f) => f.id === selectedId) || null;

  function updateField(id, patch) {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  function deleteField(id) {
    setFields((prev) => prev.filter((f) => f.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  function addField() {
    const id = `custom-${idCounter.current++}`;
    const newField = { id, key: "حقل جديد", label: "حقل جديد", type: "text", source: "student", required: false, placeholder: "", linked: false };
    setFields((prev) => [...prev, newField]);
    setSelectedId(id);
  }

  function publish() {
    setShareLink(`ijaza.app/f/${generateSlug()}`);
    setStatus("published");
    setAcceptingResponses(true);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`https://${shareLink}`);
    } catch (e) {
      /* تجاهل */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const formClosed = status === "published" && !acceptingResponses;

  return (
    <div dir="rtl" className="builder-app min-h-screen flex flex-col" style={{ fontFamily: "'Tajawal', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Tajawal:wght@300;400;500;700;800&display=swap');
        .builder-app { background:#f7f2e7; color:#1f2733; }
        .font-amiri { font-family:'Amiri', serif; }

        .topbar { background:#fffdf8; border-bottom:1px solid #e7ddc4; }
        .name-input { font-family:'Amiri',serif; font-size:1.1rem; font-weight:700; color:#16243f; background:transparent; border:none; outline:none; border-bottom:1.5px dashed transparent; }
        .name-input:focus { border-color:#c9a227; }

        .panel { background:#fffdf8; border-left:1px solid #e7ddc4; }
        .panel-right { background:#fffdf8; border-right:1px solid #e7ddc4; }
        .content-bg { background-color:#f7f2e7; background-image: radial-gradient(rgba(184,146,58,0.10) 1px, transparent 1.4px); background-size:20px 20px; }

        .layer-row { display:flex; align-items:center; gap:0.5rem; padding:0.55rem 0.6rem; border-radius:0.55rem; cursor:pointer; transition:background .12s ease; }
        .layer-row:hover { background:#f3ecd8; }
        .layer-row.active { background:#f3e6c0; box-shadow: inset 2px 0 0 #c9a227; }

        .icon-btn { width:1.7rem; height:1.7rem; display:flex; align-items:center; justify-content:center; border-radius:0.4rem; color:#9c948a; flex-shrink:0; }
        .icon-btn:hover { background:#e9e0c8; color:#16243f; }

        .tool-btn { display:flex; align-items:center; justify-content:center; gap:0.5rem; padding:0.65rem; border-radius:0.7rem; border:1.5px dashed #c9a227; background:rgba(201,162,39,0.05); font-size:0.8rem; font-weight:700; color:#9c7a1f; width:100%; }
        .tool-btn:hover { background:rgba(201,162,39,0.12); }

        .btn-gold { background:linear-gradient(180deg,#d9b94a,#b8923a); color:#16243f; font-weight:800; box-shadow:0 6px 16px -6px rgba(184,146,58,0.6); }
        .btn-gold:disabled { opacity:0.5; box-shadow:none; cursor:not-allowed; }
        .btn-outline { border:1.5px solid #d6cdb0; color:#4a4538; background:transparent; font-weight:600; }
        .btn-outline:hover { background:#f3ecd8; }

        .field-select, .field-input { width:100%; font-size:0.82rem; padding:0.55rem 0.7rem; border-radius:0.5rem; border:1px solid #e0d6b8; background:#fffdf8; color:#1f2733; outline:none; }
        .field-select:focus, .field-input:focus { border-color:#c9a227; }
        .field-label { font-size:0.72rem; font-weight:700; color:#6b6457; margin-bottom:0.35rem; display:block; }

        .switch-track { position:relative; width:2.6rem; height:1.45rem; border-radius:9999px; flex-shrink:0; transition:background .2s ease; }
        .switch-knob { position:absolute; top:0.18rem; width:1.1rem; height:1.1rem; border-radius:9999px; background:#fff; transition:left .2s ease; box-shadow:0 1px 3px rgba(0,0,0,0.3); }

        .card-formal { background:#fffdf8; border:1px solid #e7ddc4; border-radius:16px; box-shadow:0 1px 2px rgba(22,36,63,0.04), 0 14px 30px -18px rgba(22,36,63,0.18); }

        .preview-input { width:100%; font-size:0.92rem; padding:0.7rem 0.9rem; border-radius:0.6rem; border:1px solid #e0d6b8; background:#fffdf8; outline:none; color:#1f2733; }
        .preview-input:focus { border-color:#c9a227; }
      `}</style>

      {/* ===== الشريط العلوي ===== */}
      <header className="topbar flex items-center gap-4 px-5 lg:px-7 py-3">
        <button className="icon-btn" style={{ width: "2.1rem", height: "2.1rem" }} title="رجوع إلى النماذج">
          <ArrowRight size={18} />
        </button>
        <div className="flex flex-col flex-1 min-w-0">
          <p className="text-[11px] font-semibold" style={{ color: "#b8923a" }}>
            النماذج / تحرير النموذج
          </p>
          <input className="name-input w-full" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />
        </div>
        <div className="hidden md:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full" style={{ background: "#eef4ea", color: "#4f7d4a" }}>
          <Sparkles size={13} />
          مرتبط بقالب: إجازة حفظ القرآن الكريم
        </div>
        <button className="btn-outline px-4 py-2 rounded-full text-sm hidden sm:inline-flex items-center gap-1.5">
          <Eye size={15} />
          معاينة
        </button>
        <button className="btn-gold px-4 py-2 rounded-full text-sm inline-flex items-center gap-1.5">
          <Save size={15} />
          حفظ
        </button>
      </header>

      {/* ===== الجسم ===== */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* لوحة الحقول (يمين) */}
        <aside className="panel-right order-2 lg:order-1 w-full lg:w-72 flex-shrink-0 p-4 flex flex-col gap-4 overflow-y-auto">
          <p className="field-label">حقول النموذج ({fields.length})</p>
          <div className="flex flex-col gap-0.5">
            {fields.map((f) => {
              const Icon = f.source === "auto" ? Clock : fieldIcon(f.type);
              return (
                <div key={f.id} className={`layer-row ${selectedId === f.id ? "active" : ""}`} onClick={() => setSelectedId(f.id)}>
                  <GripVertical size={13} style={{ color: "#c2b896" }} />
                  <Icon size={14} style={{ color: f.source === "auto" ? "#a39c8c" : "#6b6457" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs truncate font-medium" style={{ color: "#1f2733" }}>
                      {f.label}
                    </p>
                    {f.source === "auto" && (
                      <p className="text-[10px] truncate" style={{ color: "#a39c8c" }}>
                        تلقائي
                      </p>
                    )}
                  </div>
                  {f.required && f.source === "student" && (
                    <span className="text-[10px] font-bold" style={{ color: "#9c3b3b" }}>
                      *
                    </span>
                  )}
                  {!f.linked && (
                    <button
                      className="icon-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteField(f.id);
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <button className="tool-btn" onClick={addField}>
            <Plus size={15} />
            إضافة حقل
          </button>

          <div className="rounded-xl p-3 flex gap-2 mt-1" style={{ background: "#faf1de", border: "1px solid #ecdcae" }}>
            <Info size={14} style={{ color: "#b07a1f", flexShrink: 0, marginTop: 1 }} />
            <p className="text-[11px] leading-relaxed" style={{ color: "#7a5c1f" }}>
              الحقول المرتبطة بالقالب لا يمكن حذفها. الحقول التلقائية لا تظهر للطالب ويملؤها النظام عند الإرسال.
            </p>
          </div>
        </aside>

        {/* معاينة النموذج */}
        <div className="order-1 lg:order-2 flex-1 overflow-auto p-6 lg:p-10 flex items-start justify-center">
          <div className="w-full" style={{ maxWidth: 560 }}>
            <div className="card-formal p-7 lg:p-9">
              {!formClosed ? (
                <>
                  <p className="text-xs font-semibold mb-1.5" style={{ color: "#b8923a" }}>
                    أكاديمية النور للعلوم الشرعية
                  </p>
                  <h2 className="font-amiri text-2xl font-bold mb-2" style={{ color: "#16243f" }}>
                    {formTitle}
                  </h2>
                  <p className="text-sm mb-7 leading-relaxed" style={{ color: "#6b6457" }}>
                    {formDescription}
                  </p>

                  <div className="flex flex-col gap-5">
                    {fields
                      .filter((f) => f.source === "student")
                      .map((f) => (
                        <div key={f.id}>
                          <label className="text-sm font-semibold mb-1.5 block" style={{ color: "#1f2733" }}>
                            {f.label}
                            {f.required && (
                              <span style={{ color: "#9c3b3b" }}> *</span>
                            )}
                          </label>
                          {f.type === "textarea" ? (
                            <textarea className="preview-input" rows={3} placeholder={f.placeholder} disabled />
                          ) : f.type === "select" ? (
                            <select className="preview-input" disabled>
                              <option>{f.placeholder || "اختر..."}</option>
                            </select>
                          ) : (
                            <input className="preview-input" type={f.type === "date" ? "date" : f.type === "number" ? "number" : f.type === "email" ? "email" : "text"} placeholder={f.placeholder} disabled />
                          )}
                        </div>
                      ))}
                  </div>

                  <button className="btn-gold w-full py-3 rounded-full text-sm mt-8">إرسال وإصدار الإجازة</button>
                </>
              ) : (
                <div className="flex flex-col items-center text-center py-10">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: "#f7e8e8" }}>
                    <Lock size={24} style={{ color: "#9c3b3b" }} />
                  </div>
                  <h2 className="font-amiri text-xl font-bold" style={{ color: "#16243f" }}>
                    النموذج مغلق حاليًا
                  </h2>
                  <p className="text-sm mt-2" style={{ color: "#6b6457" }}>
                    توقّف هذا النموذج عن استقبال ردود جديدة
                  </p>
                </div>
              )}
            </div>
            <p className="text-center text-xs mt-3" style={{ color: "#9c948a" }}>
              هكذا سيظهر النموذج للطالب عند فتح الرابط
            </p>
          </div>
        </div>

        {/* لوحة الخصائص (يسار) */}
        <aside className="panel order-3 w-full lg:w-80 flex-shrink-0 p-5 overflow-y-auto">
          {!selected && (
            <div className="flex flex-col gap-6">
              <div>
                <p className="font-amiri text-lg font-bold" style={{ color: "#16243f" }}>
                  إعدادات النموذج
                </p>
                <p className="text-xs mt-1" style={{ color: "#6b6457" }}>
                  انقر أي حقل لتعديل خصائصه
                </p>
              </div>

              <div>
                <span className="field-label">وصف / تعليمات النموذج</span>
                <textarea className="field-select" rows={3} value={formDescription} onChange={(e) => setFormDescription(e.target.value)} />
              </div>

              <div className="border-t pt-5" style={{ borderColor: "#e7ddc4" }}>
                {status === "draft" ? (
                  <>
                    <p className="text-xs leading-relaxed mb-3" style={{ color: "#6b6457" }}>
                      انشر النموذج للحصول على رابط مشاركة وتفعيل خيارات استقبال الردود
                    </p>
                    <button className="btn-gold w-full py-2.5 rounded-full text-sm flex items-center justify-center gap-1.5" onClick={publish}>
                      <Share2 size={15} />
                      نشر النموذج
                    </button>
                  </>
                ) : (
                  <>
                    <span className="field-label flex items-center gap-1.5">
                      <Link2 size={13} />
                      رابط المشاركة
                    </span>
                    <div className="flex items-center gap-2 mb-5">
                      <div className="flex-1 px-3 py-2.5 rounded-lg font-mono text-xs truncate" style={{ background: "#f7f2e7", border: "1px solid #e7ddc4", color: "#16243f" }} dir="ltr">
                        {shareLink}
                      </div>
                      <button className="icon-btn" style={{ width: "2.3rem", height: "2.3rem", border: "1px solid #e0d6b8" }} onClick={copyLink}>
                        {copied ? <CheckCircle2 size={15} style={{ color: "#4f7d4a" }} /> : <Copy size={15} />}
                      </button>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "#1f2733" }}>
                          استقبال الردود
                        </p>
                        <p className="text-[11px]" style={{ color: "#a39c8c" }}>
                          {acceptingResponses ? "النموذج يستقبل الردود الآن" : "تم إيقاف استقبال الردود يدويًا"}
                        </p>
                      </div>
                      <Switch checked={acceptingResponses} onChange={setAcceptingResponses} />
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "#1f2733" }}>
                          إغلاق تلقائي مجدول
                        </p>
                        <p className="text-[11px]" style={{ color: "#a39c8c" }}>
                          إيقاف الاستقبال تلقائيًا في وقت محدد
                        </p>
                      </div>
                      <Switch checked={autoCloseEnabled} onChange={setAutoCloseEnabled} />
                    </div>
                    {autoCloseEnabled && (
                      <input type="datetime-local" className="field-select" value={closeAt} onChange={(e) => setCloseAt(e.target.value)} />
                    )}

                    <div className="rounded-xl p-3 flex gap-2 mt-4" style={{ background: "#faf1de", border: "1px solid #ecdcae" }}>
                      <Info size={14} style={{ color: "#b07a1f", flexShrink: 0, marginTop: 1 }} />
                      <p className="text-[11px] leading-relaxed" style={{ color: "#7a5c1f" }}>
                        بعد إغلاق النموذج، سيتم تلقائيًا توليد ملفي PDF وCSV يضمّان جميع الردود المستلمة.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {selected && selected.source === "auto" && (
            <div className="flex flex-col gap-4">
              <span className="inline-flex w-fit items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: "#efe9da", color: "#6b6457" }}>
                <Clock size={11} />
                حقل تلقائي
              </span>
              <div>
                <span className="field-label">اسم الحقل في القالب</span>
                <div className="field-select" style={{ color: "#6b6457" }}>
                  {selected.key}
                </div>
              </div>
              <div className="rounded-lg p-3 text-xs leading-relaxed" style={{ background: "#faf1de", color: "#7a5c1f" }}>
                مصدر القيمة: {selected.autoType}. لا يظهر هذا الحقل للطالب ضمن النموذج، ويُملأ تلقائيًا عند إصدار الإجازة.
              </div>
            </div>
          )}

          {selected && selected.source === "student" && (
            <div className="flex flex-col gap-4">
              <span className="inline-flex w-fit items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: selected.linked ? "#eef4ea" : "#f3e6c0", color: selected.linked ? "#4f7d4a" : "#9c7a1f" }}>
                {selected.linked ? <Sparkles size={11} /> : <Plus size={11} />}
                {selected.linked ? "مرتبط بحقل في القالب" : "حقل إضافي"}
              </span>

              <div>
                <span className="field-label">نص السؤال</span>
                <input className="field-select" value={selected.label} onChange={(e) => updateField(selected.id, { label: e.target.value })} />
              </div>

              <div>
                <span className="field-label">نوع الحقل</span>
                <select className="field-select" value={selected.type} onChange={(e) => updateField(selected.id, { type: e.target.value })}>
                  {TYPE_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="field-label">{selected.type === "select" ? "الخيارات (مفصولة بفاصلة)" : "نص توضيحي"}</span>
                <input className="field-select" value={selected.placeholder} onChange={(e) => updateField(selected.id, { placeholder: e.target.value })} />
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold" style={{ color: "#1f2733" }}>
                  حقل إجباري
                </p>
                <Switch checked={selected.required} onChange={(v) => updateField(selected.id, { required: v })} />
              </div>

              {!selected.linked && (
                <button className="text-xs font-semibold inline-flex items-center gap-1.5 mt-2" style={{ color: "#9c3b3b" }} onClick={() => deleteField(selected.id)}>
                  <Trash2 size={13} />
                  حذف هذا الحقل
                </button>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
