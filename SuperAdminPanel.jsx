import React, { useState } from "react";
import {
  ShieldCheck,
  LayoutDashboard,
  Building2,
  History,
  Settings,
  Search,
  Plus,
  MoreVertical,
  Eye,
  Ban,
  CheckCircle2,
  KeyRound,
  Trash2,
  Copy,
  X,
  Info,
  RefreshCw,
  Users,
  Award,
  Clock,
  LogOut,
} from "lucide-react";

/* ---------------------------------- بيانات تجريبية ---------------------------------- */

const NAV_ITEMS = [
  { key: "overview", label: "نظرة عامة", icon: LayoutDashboard },
  { key: "orgs", label: "المؤسسات", icon: Building2 },
  { key: "log", label: "سجل النشاط", icon: History },
  { key: "settings", label: "الإعدادات", icon: Settings },
];

const STATS = [
  { label: "إجمالي المؤسسات", value: "٢٤", icon: Building2 },
  { label: "الإجازات الصادرة", value: "٣٬٤١٨", icon: Award },
  { label: "الردود المستلمة", value: "١٢٬٩٠٢", icon: Users },
  { label: "بانتظار إكمال الإعداد", value: "٢", icon: Clock },
];

const INITIAL_ORGS = [
  { id: 1, name: "أكاديمية النور للعلوم الشرعية", status: "active", members: 4, certs: 12, created: "١٠ يناير ٢٠٢٦", lastLogin: "اليوم، ٠٩:٢٠ ص" },
  { id: 2, name: "مركز الفرقان لتحفيظ القرآن", status: "active", members: 7, certs: 28, created: "٢ نوفمبر ٢٠٢٥", lastLogin: "أمس، ٠٤:١٥ م" },
  { id: 3, name: "معهد الإتقان لتعليم اللغة العربية", status: "pending", members: 1, certs: 0, created: "١٩ يونيو ٢٠٢٦", lastLogin: null },
  { id: 4, name: "جمعية بصائر الخيرية", status: "suspended", members: 3, certs: 9, created: "١٥ أغسطس ٢٠٢٥", lastLogin: "قبل ٣ أشهر" },
  { id: 5, name: "دار الفجر لتدريب المعلمين", status: "active", members: 5, certs: 41, created: "٢٠ مايو ٢٠٢٥", lastLogin: "قبل ساعتين" },
  { id: 6, name: "مؤسسة سبل السلام التعليمية", status: "active", members: 2, certs: 6, created: "٢ إبريل ٢٠٢٦", lastLogin: "قبل يومين" },
];

const FILTERS = [
  { key: "all", label: "الكل" },
  { key: "active", label: "نشطة" },
  { key: "pending", label: "بانتظار الإعداد" },
  { key: "suspended", label: "معلّقة" },
];

function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let pwd = "";
  for (let i = 0; i < 10; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
  return pwd;
}

/* ---------------------------------- عناصر مساعدة ---------------------------------- */

function StatusBadge({ status }) {
  if (status === "active") {
    return (
      <span className="badge badge-active inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#4f7d4a" }} />
        نشطة
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="badge badge-pending inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full">
        <Clock size={11} />
        بانتظار إكمال الإعداد
      </span>
    );
  }
  return (
    <span className="badge badge-suspended inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full">
      <Ban size={11} />
      معلّقة
    </span>
  );
}

function CopyableField({ label, value }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch (e) {
      /* تجاهل أخطاء النسخ */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <div>
      <span className="field-label">{label}</span>
      <div className="flex items-center gap-2">
        <div className="flex-1 px-3 py-2.5 rounded-lg font-mono text-sm truncate" style={{ background: "#f7f2e7", border: "1px solid #e7ddc4", color: "#16243f" }}>
          {value}
        </div>
        <button className="icon-btn-lg" onClick={handleCopy} title="نسخ">
          {copied ? <CheckCircle2 size={16} style={{ color: "#4f7d4a" }} /> : <Copy size={16} />}
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------- التطبيق الرئيسي ---------------------------------- */

export default function SuperAdminPanel() {
  const [activeNav, setActiveNav] = useState("orgs");
  const [orgs, setOrgs] = useState(INITIAL_ORGS);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [openMenu, setOpenMenu] = useState(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createStep, setCreateStep] = useState("form");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [resetOrg, setResetOrg] = useState(null);
  const [resetPassword, setResetPassword] = useState("");

  const filtered = orgs.filter((o) => {
    const matchesFilter = filter === "all" || o.status === filter;
    const matchesQuery = o.name.includes(query.trim());
    return matchesFilter && matchesQuery;
  });

  function openCreateModal() {
    setNewName("");
    setNewPassword(generatePassword());
    setCreateStep("form");
    setCreateOpen(true);
  }

  function handleCreate() {
    if (!newName.trim() || !newPassword.trim()) return;
    const newOrg = {
      id: Date.now(),
      name: newName.trim(),
      status: "pending",
      members: 1,
      certs: 0,
      created: "اليوم",
      lastLogin: null,
    };
    setOrgs((prev) => [newOrg, ...prev]);
    setCreateStep("success");
  }

  function toggleSuspend(org) {
    setOrgs((prev) => prev.map((o) => (o.id === org.id ? { ...o, status: o.status === "suspended" ? "active" : "suspended" } : o)));
    setOpenMenu(null);
  }

  function handleDelete(org) {
    if (window.confirm(`هل أنت متأكد من حذف "${org.name}"؟ لا يمكن التراجع عن هذا الإجراء.`)) {
      setOrgs((prev) => prev.filter((o) => o.id !== org.id));
    }
    setOpenMenu(null);
  }

  function handleResetPassword(org) {
    setResetOrg(org);
    setResetPassword(generatePassword());
    setOpenMenu(null);
  }

  return (
    <div dir="rtl" className="superadmin-app min-h-screen flex" style={{ fontFamily: "'Tajawal', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Tajawal:wght@300;400;500;700;800&display=swap');
        .superadmin-app { background:#f7f2e7; color:#1f2733; }
        .font-amiri { font-family:'Amiri', serif; }

        .sidebar { background:linear-gradient(180deg,#16243f 0%,#0f1a30 100%); color:#f3e6c0; }
        .nav-item { display:flex; align-items:center; gap:0.75rem; padding:0.65rem 0.9rem; border-radius:0.6rem; font-size:0.92rem; color:#cdd3e0; transition:all .15s ease; cursor:pointer; }
        .nav-item:hover { background:rgba(201,162,39,0.1); color:#f3e6c0; }
        .nav-item.active { background:rgba(201,162,39,0.16); color:#e9c969; font-weight:700; box-shadow: inset 3px 0 0 #c9a227; }

        .content-bg { background-color:#f7f2e7; background-image: radial-gradient(rgba(184,146,58,0.10) 1px, transparent 1.4px); background-size:20px 20px; }

        .stat-card { background:#fffdf8; border:1px solid #e7ddc4; border-radius:14px; padding:1.1rem 1.25rem; display:flex; align-items:center; gap:0.9rem; }
        .stat-icon { width:2.75rem; height:2.75rem; border-radius:0.85rem; display:flex; align-items:center; justify-content:center; background:#16243f; color:#d9b94a; flex-shrink:0; }

        .card-formal { background:#fffdf8; border:1px solid #e7ddc4; border-radius:14px; box-shadow:0 1px 2px rgba(22,36,63,0.04), 0 10px 24px -16px rgba(22,36,63,0.18); }

        .badge-active { background:#eef4ea; color:#4f7d4a; }
        .badge-pending { background:#faf1de; color:#b07a1f; }
        .badge-suspended { background:#f7e8e8; color:#9c3b3b; }

        .admin-table { width:100%; border-collapse:separate; border-spacing:0; }
        .admin-table th { text-align:right; font-size:0.74rem; font-weight:700; color:#6b6457; padding:0 0.9rem 0.7rem; }
        .admin-table td { padding:0.85rem 0.9rem; border-top:1px solid #efe9da; font-size:0.85rem; vertical-align:middle; }
        .admin-table tr:hover td { background:#faf7ee; }

        .icon-btn { width:2rem; height:2rem; display:flex; align-items:center; justify-content:center; border-radius:0.5rem; color:#6b6457; transition:all .15s ease; }
        .icon-btn:hover { background:#f3e6c0; color:#16243f; }
        .icon-btn-lg { width:2.4rem; height:2.4rem; flex-shrink:0; display:flex; align-items:center; justify-content:center; border-radius:0.6rem; border:1px solid #e0d6b8; color:#6b6457; }
        .icon-btn-lg:hover { background:#f3e6c0; color:#16243f; }

        .dropdown-menu { background:#fffdf8; border:1px solid #e7ddc4; border-radius:0.75rem; box-shadow:0 12px 32px -12px rgba(22,36,63,0.3); }
        .dropdown-item { width:100%; display:flex; align-items:center; gap:0.6rem; padding:0.6rem 0.9rem; font-size:0.83rem; color:#1f2733; text-align:right; transition:background .12s ease; }
        .dropdown-item:hover { background:#f7f2e7; }

        .btn-gold { background:linear-gradient(180deg,#d9b94a,#b8923a); color:#16243f; font-weight:800; box-shadow:0 6px 16px -6px rgba(184,146,58,0.6); }
        .btn-outline { border:1.5px solid #d6cdb0; color:#4a4538; background:transparent; font-weight:600; }
        .btn-outline:hover { background:#f3ecd8; }

        .chip { font-size:0.78rem; font-weight:600; padding:0.4rem 0.95rem; border-radius:9999px; border:1px solid #e0d6b8; color:#6b6457; cursor:pointer; transition:all .15s ease; white-space:nowrap; }
        .chip.active { background:#16243f; color:#e9c969; border-color:#16243f; }

        .field-label { font-size:0.75rem; font-weight:700; color:#6b6457; margin-bottom:0.4rem; display:block; }
        .field-input { width:100%; font-size:0.9rem; padding:0.65rem 0.8rem; border-radius:0.6rem; border:1px solid #e0d6b8; background:#fffdf8; color:#1f2733; outline:none; }
        .field-input:focus { border-color:#c9a227; }

        .avatar-ring { width:2.1rem; height:2.1rem; border-radius:9999px; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.8rem; background:#16243f; color:#d9b94a; flex-shrink:0; }

        .modal-overlay { position:fixed; inset:0; background:rgba(15,26,48,0.55); display:flex; align-items:center; justify-content:center; z-index:50; padding:1rem; }
        .modal-card { background:#fffdf8; border-radius:18px; width:100%; max-width:26rem; box-shadow:0 24px 60px -20px rgba(15,26,48,0.5); border:1px solid #e7ddc4; }
      `}</style>

      {/* ===== الشريط الجانبي ===== */}
      <aside className="sidebar w-64 flex-shrink-0 hidden lg:flex flex-col p-4">
        <div className="flex items-center gap-3 pb-5 mb-4 border-b" style={{ borderColor: "rgba(243,230,192,0.15)" }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(201,162,39,0.18)", border: "1.5px solid #c9a227" }}>
            <ShieldCheck size={18} color="#d9b94a" />
          </div>
          <div>
            <p className="font-amiri text-xl font-bold leading-none" style={{ color: "#f3e6c0" }}>
              إجازة
            </p>
            <p className="text-[11px] mt-1" style={{ color: "#8d93a8" }}>
              لوحة المشرف العام
            </p>
          </div>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {NAV_ITEMS.map((item) => (
            <div key={item.key} className={`nav-item ${activeNav === item.key ? "active" : ""}`} onClick={() => setActiveNav(item.key)}>
              <item.icon size={17} />
              {item.label}
            </div>
          ))}
        </nav>

        <div className="pt-4 mt-4 border-t" style={{ borderColor: "rgba(243,230,192,0.15)" }}>
          <div className="flex items-center gap-3 px-1">
            <div className="avatar-ring">إ.ع</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: "#f3e6c0" }}>
                إدارة المنصة
              </p>
              <p className="text-[11px]" style={{ color: "#8d93a8" }}>
                مشرف عام
              </p>
            </div>
            <button title="تسجيل الخروج" className="text-gray-400 hover:text-amber-300 transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ===== المحتوى الرئيسي ===== */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between gap-4 px-5 lg:px-8 py-4 bg-white/70 backdrop-blur border-b" style={{ borderColor: "#e7ddc4" }}>
          <div>
            <p className="text-xs font-semibold" style={{ color: "#b8923a" }}>
              لوحة المشرف العام
            </p>
            <h1 className="font-amiri text-xl font-bold" style={{ color: "#16243f" }}>
              إدارة المؤسسات المسجّلة في المنصة
            </h1>
          </div>
          <div className="flex items-center gap-2 lg:hidden">
            <div className="avatar-ring">إ.ع</div>
          </div>
        </header>

        <main className="content-bg flex-1 px-5 lg:px-8 py-7 overflow-y-auto">
          {/* الإحصائيات */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-7">
            {STATS.map((s, i) => (
              <div key={i} className="stat-card">
                <div className="stat-icon">
                  <s.icon size={20} />
                </div>
                <div>
                  <p className="font-amiri text-2xl font-bold" style={{ color: "#16243f" }}>
                    {s.value}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "#6b6457" }}>
                    {s.label}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* لوحة المؤسسات */}
          <div className="card-formal p-5">
            <div className="flex flex-col gap-4 mb-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="font-amiri text-xl font-bold" style={{ color: "#16243f" }}>
                  المؤسسات المسجّلة
                </h2>
                <button className="btn-gold flex items-center justify-center gap-1.5 text-sm px-4 py-2.5 rounded-full" onClick={openCreateModal}>
                  <Plus size={16} strokeWidth={2.5} />
                  إنشاء مؤسسة جديدة
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-full border flex-1 sm:max-w-xs" style={{ borderColor: "#e0d6b8", background: "#fffdf8" }}>
                  <Search size={15} className="opacity-50" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="ابحث عن مؤسسة..."
                    className="bg-transparent outline-none text-sm flex-1 placeholder:opacity-60"
                    style={{ border: "none" }}
                  />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto">
                  {FILTERS.map((f) => (
                    <button key={f.key} className={`chip ${filter === f.key ? "active" : ""}`} onClick={() => setFilter(f.key)}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>المؤسسة</th>
                    <th>الحالة</th>
                    <th>الأعضاء</th>
                    <th>الإجازات</th>
                    <th>آخر تسجيل دخول</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((org) => (
                    <tr key={org.id}>
                      <td>
                        <p className="font-semibold" style={{ color: "#16243f" }}>
                          {org.name}
                        </p>
                        <p className="text-[11px] mt-0.5" style={{ color: "#a39c8c" }}>
                          أُنشئت في {org.created}
                        </p>
                      </td>
                      <td>
                        <StatusBadge status={org.status} />
                      </td>
                      <td style={{ color: "#4a4538" }}>{org.members.toLocaleString("ar-EG")}</td>
                      <td style={{ color: "#4a4538" }}>{org.certs.toLocaleString("ar-EG")}</td>
                      <td style={{ color: "#6b6457" }}>{org.lastLogin || "لم يسجّل الدخول بعد"}</td>
                      <td>
                        <div className="relative flex justify-end">
                          <button className="icon-btn" onClick={() => setOpenMenu(openMenu === org.id ? null : org.id)}>
                            <MoreVertical size={16} />
                          </button>
                          {openMenu === org.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                              <div className="dropdown-menu absolute left-0 top-9 z-20 w-60 py-1.5">
                                <button className="dropdown-item">
                                  <Eye size={14} />
                                  عرض التفاصيل
                                </button>
                                <button className="dropdown-item" onClick={() => handleResetPassword(org)}>
                                  <KeyRound size={14} />
                                  إعادة تعيين كلمة المرور
                                </button>
                                <button className="dropdown-item" onClick={() => toggleSuspend(org)}>
                                  {org.status === "suspended" ? <CheckCircle2 size={14} /> : <Ban size={14} />}
                                  {org.status === "suspended" ? "إعادة تفعيل الحساب" : "تعليق الحساب"}
                                </button>
                                <div className="my-1.5 border-t" style={{ borderColor: "#e7ddc4" }} />
                                <button className="dropdown-item" style={{ color: "#9c3b3b" }} onClick={() => handleDelete(org)}>
                                  <Trash2 size={14} />
                                  حذف المؤسسة
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-8" style={{ color: "#a39c8c" }}>
                        لا توجد مؤسسات مطابقة لبحثك
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* ===== نافذة إنشاء مؤسسة ===== */}
      {createOpen && (
        <div className="modal-overlay" onClick={() => setCreateOpen(false)}>
          <div className="modal-card p-6" onClick={(e) => e.stopPropagation()}>
            {createStep === "form" && (
              <>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-amiri text-xl font-bold" style={{ color: "#16243f" }}>
                    إنشاء حساب مؤسسة جديد
                  </h3>
                  <button className="icon-btn" onClick={() => setCreateOpen(false)}>
                    <X size={18} />
                  </button>
                </div>
                <p className="text-xs mb-5" style={{ color: "#6b6457" }}>
                  أدخل اسم المؤسسة وكلمة مرور مؤقتة لإنشاء حسابها على المنصة
                </p>

                <div className="flex flex-col gap-4">
                  <div>
                    <span className="field-label">اسم المؤسسة</span>
                    <input className="field-input" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="مثال: أكاديمية الرسالة التعليمية" />
                  </div>
                  <div>
                    <span className="field-label">كلمة المرور المؤقتة</span>
                    <div className="flex items-center gap-2">
                      <input className="field-input font-mono" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                      <button className="icon-btn-lg" title="توليد كلمة مرور" onClick={() => setNewPassword(generatePassword())}>
                        <RefreshCw size={15} />
                      </button>
                    </div>
                  </div>

                  <div className="rounded-xl p-3.5 flex gap-2.5" style={{ background: "#faf1de", border: "1px solid #ecdcae" }}>
                    <Info size={15} style={{ color: "#b07a1f", flexShrink: 0, marginTop: 2 }} />
                    <p className="text-xs leading-relaxed" style={{ color: "#7a5c1f" }}>
                      عند أول تسجيل دخول، سيُطلب من المؤسسة إدخال البريد الإلكتروني والمعلومات الإضافية لإكمال إعداد الحساب.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-6">
                  <button className="btn-outline flex-1 py-2.5 rounded-full text-sm" onClick={() => setCreateOpen(false)}>
                    إلغاء
                  </button>
                  <button
                    className="btn-gold flex-1 py-2.5 rounded-full text-sm"
                    style={{ opacity: newName.trim() && newPassword.trim() ? 1 : 0.5 }}
                    onClick={handleCreate}
                  >
                    إنشاء الحساب
                  </button>
                </div>
              </>
            )}

            {createStep === "success" && (
              <>
                <div className="flex flex-col items-center text-center mb-5">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: "#eef4ea" }}>
                    <CheckCircle2 size={24} style={{ color: "#4f7d4a" }} />
                  </div>
                  <h3 className="font-amiri text-xl font-bold" style={{ color: "#16243f" }}>
                    تم إنشاء الحساب بنجاح
                  </h3>
                  <p className="text-xs mt-1" style={{ color: "#6b6457" }}>
                    شارك بيانات الدخول التالية مع المؤسسة لتسجيل الدخول لأول مرة
                  </p>
                </div>

                <div className="flex flex-col gap-3.5">
                  <CopyableField label="اسم المؤسسة" value={newName} />
                  <CopyableField label="كلمة المرور المؤقتة" value={newPassword} />
                </div>

                <button className="btn-gold w-full py-2.5 rounded-full text-sm mt-6" onClick={() => setCreateOpen(false)}>
                  تم
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ===== نافذة إعادة تعيين كلمة المرور ===== */}
      {resetOrg && (
        <div className="modal-overlay" onClick={() => setResetOrg(null)}>
          <div className="modal-card p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center mb-5">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: "#faf1de" }}>
                <KeyRound size={22} style={{ color: "#b07a1f" }} />
              </div>
              <h3 className="font-amiri text-xl font-bold" style={{ color: "#16243f" }}>
                تمت إعادة تعيين كلمة المرور
              </h3>
              <p className="text-xs mt-1" style={{ color: "#6b6457" }}>
                كلمة المرور الجديدة لمؤسسة «{resetOrg.name}»
              </p>
            </div>
            <CopyableField label="كلمة المرور الجديدة" value={resetPassword} />
            <button className="btn-gold w-full py-2.5 rounded-full text-sm mt-6" onClick={() => setResetOrg(null)}>
              تم
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
