import React, { useState } from "react";
import {
  ArrowRight,
  Download,
  Search,
  MoreVertical,
  Eye,
  Trash2,
  X,
  ChevronRight,
  ChevronLeft,
  Stamp,
  PenTool,
  FileText,
} from "lucide-react";

/* ---------------------------------- بيانات تجريبية ---------------------------------- */

const RAW_RESPONSES = [
  { name: "سارة أحمد القحطاني", email: "sarah.ahmed@email.com", certNo: "IJ-2026-0458", date: "١٨ يونيو ٢٠٢٦", time: "٠٩:١٢ ص" },
  { name: "عبدالله الحربي", email: "a.harbi@email.com", certNo: "IJ-2026-0457", date: "١٨ يونيو ٢٠٢٦", time: "٠٨:٤٠ ص" },
  { name: "منى العتيبي", email: "mona.otaibi@email.com", certNo: "IJ-2026-0456", date: "١٧ يونيو ٢٠٢٦", time: "٠٥:٢٠ م" },
  { name: "فهد الزهراني", email: "fahad.z@email.com", certNo: "IJ-2026-0455", date: "١٧ يونيو ٢٠٢٦", time: "١١:٠٥ ص" },
  { name: "ريم الدوسري", email: "reem.dosari@email.com", certNo: "IJ-2026-0454", date: "١٦ يونيو ٢٠٢٦", time: "٠٢:١٥ م" },
  { name: "خالد المطيري", email: "khalid.m@email.com", certNo: "IJ-2026-0453", date: "١٦ يونيو ٢٠٢٦", time: "١٠:٠٠ ص" },
  { name: "نورة العنزي", email: "noura.anzi@email.com", certNo: "IJ-2026-0452", date: "١٥ يونيو ٢٠٢٦", time: "٠٦:٤٥ م" },
  { name: "سلطان الشمري", email: "sultan.shamri@email.com", certNo: "IJ-2026-0451", date: "١٥ يونيو ٢٠٢٦", time: "٠٩:٣٠ ص" },
  { name: "هند القرني", email: "hind.qarni@email.com", certNo: "IJ-2026-0450", date: "١٤ يونيو ٢٠٢٦", time: "٠٤:١٠ م" },
  { name: "ياسر الغامدي", email: "yasser.g@email.com", certNo: "IJ-2026-0449", date: "١٤ يونيو ٢٠٢٦", time: "٠٨:٥٥ ص" },
  { name: "لمى السبيعي", email: "lama.subaie@email.com", certNo: "IJ-2026-0448", date: "١٣ يونيو ٢٠٢٦", time: "٠٣:٢٠ م" },
  { name: "طارق العمري", email: "tareq.omari@email.com", certNo: "IJ-2026-0447", date: "١٢ يونيو ٢٠٢٦", time: "١١:٤٠ ص" },
  { name: "جواهر البقمي", email: "jawaher.b@email.com", certNo: "IJ-2026-0446", date: "١٢ يونيو ٢٠٢٦", time: "٠٩:١٥ ص" },
  { name: "ماجد الزهراني", email: "majed.z@email.com", certNo: "IJ-2026-0445", date: "١١ يونيو ٢٠٢٦", time: "٠١:٠٠ م" },
].map((r, i) => ({ id: i + 1, ...r }));

const PAGE_SIZE = 8;

/* ---------------------------------- عناصر مساعدة ---------------------------------- */

function Switch({ checked, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="switch-track" style={{ background: checked ? "#16243f" : "#e0d6b8" }}>
      <span className="switch-knob" style={{ left: checked ? "calc(100% - 1.3rem)" : "0.2rem" }} />
    </button>
  );
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
  );
}

/* ---------------------------------- نافذة معاينة الإجازة ---------------------------------- */

function CertificateModal({ response, onClose, onDelete }) {
  if (!response) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <h3 className="font-amiri text-xl font-bold" style={{ color: "#16243f" }}>
            معاينة الإجازة
          </h3>
          <button className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="px-6 pb-2">
          <div className="relative rounded-xl p-8 text-center" style={{ background: "#fffdf8", border: "2px solid #c9a227" }}>
            <div className="absolute inset-2 pointer-events-none rounded-lg" style={{ border: "1px dashed #c9a227", opacity: 0.5 }} />
            <p className="text-xs font-semibold" style={{ color: "#b8923a" }}>
              أكاديمية النور للعلوم الشرعية
            </p>
            <h2 className="font-amiri text-2xl font-bold mt-2" style={{ color: "#16243f" }}>
              إجازة حفظ القرآن الكريم
            </h2>
            <p className="text-sm mt-3" style={{ color: "#6b6457" }}>
              تشهد الأكاديمية بأنّ الطالب/ـة
            </p>
            <p className="font-amiri text-2xl font-bold mt-2" style={{ color: "#b8923a" }}>
              {response.name}
            </p>
            <p className="text-sm mt-3 leading-relaxed" style={{ color: "#1f2733" }}>
              قد أتمّ/ـت بنجاح حفظ جزء عمّ كاملاً بإتقان وضبط
            </p>
            <p className="text-xs mt-4" style={{ color: "#6b6457" }}>
              تاريخ الإصدار: {response.date}
            </p>
            <p className="absolute top-3 left-4 text-[10px]" style={{ color: "#a39c8c" }}>
              {response.certNo}
            </p>
            <div className="flex items-center justify-between mt-7 px-2">
              <PenTool size={20} style={{ color: "#b8923a" }} />
              <Stamp size={26} style={{ color: "#b8923a" }} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-6 pb-6 pt-4">
          <button className="btn-outline-red flex-1 py-2.5 rounded-full text-sm flex items-center justify-center gap-1.5" onClick={() => onDelete(response)}>
            <Trash2 size={14} />
            حذف الإجازة
          </button>
          <button className="btn-gold flex-1 py-2.5 rounded-full text-sm flex items-center justify-center gap-1.5">
            <Download size={14} />
            تنزيل PDF
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- التطبيق الرئيسي ---------------------------------- */

export default function ResponsesTable() {
  const [responses, setResponses] = useState(RAW_RESPONSES);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const [openMenu, setOpenMenu] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [accepting, setAccepting] = useState(true);

  const filtered = responses.filter((r) => r.name.includes(query.trim()) || r.email.includes(query.trim()));
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const pageIds = pageItems.map((r) => r.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));

  function toggleSelect(id) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleSelectAllOnPage() {
    if (allPageSelected) {
      setSelected((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelected((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  }

  function deleteOne(r) {
    if (window.confirm(`هل أنت متأكد من حذف إجازة "${r.name}"؟`)) {
      setResponses((prev) => prev.filter((x) => x.id !== r.id));
      setSelected((prev) => prev.filter((x) => x !== r.id));
      setOpenMenu(null);
      setViewing(null);
    }
  }

  function deleteSelected() {
    if (window.confirm(`هل أنت متأكد من حذف ${selected.length} إجازة محددة؟`)) {
      setResponses((prev) => prev.filter((x) => !selected.includes(x.id)));
      setSelected([]);
    }
  }

  return (
    <div dir="rtl" className="responses-app min-h-screen flex flex-col" style={{ fontFamily: "'Tajawal', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Tajawal:wght@300;400;500;700;800&display=swap');
        .responses-app { background:#f7f2e7; color:#1f2733; }
        .font-amiri { font-family:'Amiri', serif; }

        .topbar { background:#fffdf8; border-bottom:1px solid #e7ddc4; }
        .content-bg { background-color:#f7f2e7; background-image: radial-gradient(rgba(184,146,58,0.10) 1px, transparent 1.4px); background-size:20px 20px; }
        .card-formal { background:#fffdf8; border:1px solid #e7ddc4; border-radius:16px; box-shadow:0 1px 2px rgba(22,36,63,0.04), 0 10px 24px -16px rgba(22,36,63,0.18); }

        .badge-active { background:#eef4ea; color:#4f7d4a; }

        .icon-btn { width:2rem; height:2rem; display:flex; align-items:center; justify-content:center; border-radius:0.5rem; color:#6b6457; transition:all .15s ease; }
        .icon-btn:hover { background:#f3e6c0; color:#16243f; }

        .btn-gold { background:linear-gradient(180deg,#d9b94a,#b8923a); color:#16243f; font-weight:800; box-shadow:0 6px 16px -6px rgba(184,146,58,0.6); }
        .btn-outline { border:1.5px solid #d6cdb0; color:#4a4538; background:transparent; font-weight:600; }
        .btn-outline:hover { background:#f3ecd8; }
        .btn-outline-red { border:1.5px solid #e3b9b9; color:#9c3b3b; background:transparent; font-weight:700; }
        .btn-outline-red:hover { background:#f7e8e8; }

        .resp-table { width:100%; border-collapse:separate; border-spacing:0; }
        .resp-table th { text-align:right; font-size:0.74rem; font-weight:700; color:#6b6457; padding:0 0.9rem 0.7rem; white-space:nowrap; }
        .resp-table td { padding:0.8rem 0.9rem; border-top:1px solid #efe9da; font-size:0.85rem; vertical-align:middle; }
        .resp-table tr:hover td { background:#faf7ee; }

        .dropdown-menu { background:#fffdf8; border:1px solid #e7ddc4; border-radius:0.75rem; box-shadow:0 12px 32px -12px rgba(22,36,63,0.3); }
        .dropdown-item { width:100%; display:flex; align-items:center; gap:0.6rem; padding:0.6rem 0.9rem; font-size:0.83rem; color:#1f2733; text-align:right; transition:background .12s ease; }
        .dropdown-item:hover { background:#f7f2e7; }

        .switch-track { position:relative; width:2.6rem; height:1.45rem; border-radius:9999px; flex-shrink:0; transition:background .2s ease; }
        .switch-knob { position:absolute; top:0.18rem; width:1.1rem; height:1.1rem; border-radius:9999px; background:#fff; transition:left .2s ease; box-shadow:0 1px 3px rgba(0,0,0,0.3); }

        .avatar-ring { width:2.1rem; height:2.1rem; border-radius:9999px; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.78rem; background:#16243f; color:#d9b94a; flex-shrink:0; }

        .modal-overlay { position:fixed; inset:0; background:rgba(15,26,48,0.55); display:flex; align-items:center; justify-content:center; z-index:50; padding:1rem; }
        .modal-card { background:#fffdf8; border-radius:18px; width:100%; box-shadow:0 24px 60px -20px rgba(15,26,48,0.5); border:1px solid #e7ddc4; }

        .page-btn { width:2.1rem; height:2.1rem; display:flex; align-items:center; justify-content:center; border-radius:0.5rem; border:1px solid #e0d6b8; color:#6b6457; }
        .page-btn:disabled { opacity:0.4; cursor:not-allowed; }
        .page-btn:not(:disabled):hover { background:#f3e6c0; color:#16243f; }
      `}</style>

      {/* ===== الشريط العلوي ===== */}
      <header className="topbar flex flex-wrap items-center gap-3 px-5 lg:px-7 py-3.5">
        <button className="icon-btn" style={{ width: "2.1rem", height: "2.1rem" }} title="رجوع إلى الإجازات">
          <ArrowRight size={18} />
        </button>
        <div className="flex flex-col min-w-0">
          <p className="text-[11px] font-semibold" style={{ color: "#b8923a" }}>
            الإجازات / الردود
          </p>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="font-amiri text-lg font-bold truncate" style={{ color: "#16243f" }}>
              إجازة حفظ القرآن الكريم – جزء عمّ
            </h1>
            <span className="badge-active inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#4f7d4a" }} />
              نشط
            </span>
          </div>
        </div>
        <div className="flex-1" />
        <button className="btn-outline px-4 py-2 rounded-full text-sm inline-flex items-center gap-1.5">
          <Download size={15} />
          تنزيل CSV
        </button>
        <button className="btn-gold px-4 py-2 rounded-full text-sm inline-flex items-center gap-1.5">
          <FileText size={15} />
          تنزيل الكل PDF
        </button>
      </header>

      <main className="content-bg flex-1 px-5 lg:px-8 py-7 overflow-y-auto">
        <div className="card-formal p-5">
          {/* شريط التحكم */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-full border flex-1 sm:max-w-xs" style={{ borderColor: "#e0d6b8", background: "#fffdf8" }}>
              <Search size={15} className="opacity-50" />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="ابحث باسم الطالب أو بريده..."
                className="bg-transparent outline-none text-sm flex-1 placeholder:opacity-60"
              />
            </div>
            <div className="flex items-center gap-5">
              <p className="text-sm" style={{ color: "#6b6457" }}>
                إجمالي الردود: <span className="font-bold" style={{ color: "#16243f" }}>{responses.length.toLocaleString("ar-EG")}</span>
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold" style={{ color: "#1f2733" }}>
                  استقبال الردود
                </span>
                <Switch checked={accepting} onChange={setAccepting} />
              </div>
            </div>
          </div>

          {/* شريط الإجراءات الجماعية */}
          {selected.length > 0 && (
            <div className="flex items-center justify-between gap-3 mb-4 px-4 py-2.5 rounded-xl" style={{ background: "#f3e6c0" }}>
              <p className="text-sm font-semibold" style={{ color: "#16243f" }}>
                {selected.length.toLocaleString("ar-EG")} محدد
              </p>
              <div className="flex items-center gap-2">
                <button className="btn-outline px-3.5 py-1.5 rounded-full text-xs flex items-center gap-1.5" style={{ background: "#fffdf8" }}>
                  <Download size={13} />
                  تنزيل المحدد
                </button>
                <button className="btn-outline-red px-3.5 py-1.5 rounded-full text-xs flex items-center gap-1.5" style={{ background: "#fffdf8" }} onClick={deleteSelected}>
                  <Trash2 size={13} />
                  حذف المحدد
                </button>
              </div>
            </div>
          )}

          {/* الجدول */}
          <div className="overflow-x-auto">
            <table className="resp-table">
              <thead>
                <tr>
                  <th>
                    <input type="checkbox" checked={allPageSelected} onChange={toggleSelectAllOnPage} style={{ accentColor: "#16243f" }} />
                  </th>
                  <th>الطالب</th>
                  <th>رقم الإجازة</th>
                  <th>تاريخ الإرسال</th>
                  <th>الإجازة</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <input type="checkbox" checked={selected.includes(r.id)} onChange={() => toggleSelect(r.id)} style={{ accentColor: "#16243f" }} />
                    </td>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="avatar-ring">{r.name.slice(0, 1)}</div>
                        <div className="min-w-0">
                          <p className="font-semibold truncate" style={{ color: "#16243f" }}>
                            {r.name}
                          </p>
                          <p className="text-[11px] truncate" style={{ color: "#a39c8c" }} dir="ltr">
                            {r.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: "#6b6457" }} dir="ltr">
                      {r.certNo}
                    </td>
                    <td style={{ color: "#6b6457" }}>
                      {r.date} <span style={{ color: "#c2b896" }}>·</span> {r.time}
                    </td>
                    <td>
                      <button className="flex items-center gap-2" onClick={() => setViewing(r)}>
                        <MiniCert />
                        <span className="text-xs font-semibold" style={{ color: "#b8923a" }}>
                          عرض
                        </span>
                      </button>
                    </td>
                    <td>
                      <div className="relative flex justify-end">
                        <button className="icon-btn" onClick={() => setOpenMenu(openMenu === r.id ? null : r.id)}>
                          <MoreVertical size={16} />
                        </button>
                        {openMenu === r.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                            <div className="dropdown-menu absolute left-0 top-9 z-20 w-52 py-1.5">
                              <button
                                className="dropdown-item"
                                onClick={() => {
                                  setViewing(r);
                                  setOpenMenu(null);
                                }}
                              >
                                <Eye size={14} />
                                عرض الإجازة
                              </button>
                              <button className="dropdown-item">
                                <Download size={14} />
                                تنزيل PDF
                              </button>
                              <div className="my-1.5 border-t" style={{ borderColor: "#e7ddc4" }} />
                              <button className="dropdown-item" style={{ color: "#9c3b3b" }} onClick={() => deleteOne(r)}>
                                <Trash2 size={14} />
                                حذف الإجازة
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {pageItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-10" style={{ color: "#a39c8c" }}>
                      لا توجد ردود مطابقة لبحثك
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* الترقيم */}
          {filtered.length > 0 && (
            <div className="flex items-center justify-between mt-5 pt-4 border-t" style={{ borderColor: "#efe9da" }}>
              <p className="text-xs" style={{ color: "#a39c8c" }}>
                عرض {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} من {filtered.length.toLocaleString("ar-EG")} ردًا
              </p>
              <div className="flex items-center gap-2">
                <button className="page-btn" disabled={safePage === 1} onClick={() => setPage(safePage - 1)}>
                  <ChevronRight size={15} />
                </button>
                <span className="text-xs px-2" style={{ color: "#6b6457" }}>
                  {safePage} / {totalPages}
                </span>
                <button className="page-btn" disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)}>
                  <ChevronLeft size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <CertificateModal response={viewing} onClose={() => setViewing(null)} onDelete={deleteOne} />
    </div>
  );
}
