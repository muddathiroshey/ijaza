import React, { useState } from "react";
import {
  ShieldCheck,
  User,
  Mail,
  Phone,
  Building2,
  Lock,
  Eye,
  EyeOff,
  Image as ImageIcon,
  X,
  Check,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Info,
  Sparkles,
  Link2,
  Download,
} from "lucide-react";

const ORG_TYPES = [
  "أكاديمية تعليمية",
  "مركز تحفيظ القرآن الكريم",
  "معهد لغة عربية",
  "مدرسة",
  "جمعية خيرية",
  "جهة تدريبية",
  "أخرى",
];

function StepCircle({ n, status }) {
  return (
    <div
      className="step-circle"
      style={
        status === "done"
          ? { background: "#16243f", color: "#e9c969", borderColor: "#16243f" }
          : status === "active"
          ? { background: "#fffdf8", color: "#16243f", borderColor: "#c9a227", boxShadow: "0 0 0 4px rgba(201,162,39,0.15)" }
          : { background: "#fffdf8", color: "#a39c8c", borderColor: "#e0d6b8" }
      }
    >
      {status === "done" ? <Check size={14} /> : n}
    </div>
  );
}

function ReqItem({ ok, label }) {
  return (
    <li className="flex items-center gap-1.5 text-xs" style={{ color: ok ? "#4f7d4a" : "#a39c8c" }}>
      <CheckCircle2 size={13} />
      {label}
    </li>
  );
}

export default function FirstLoginSetup() {
  const orgName = "أكاديمية النور للعلوم الشرعية";

  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [orgType, setOrgType] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [logoName, setLogoName] = useState("");

  const step1Valid = fullName.trim().length > 1 && email.includes("@") && orgType !== "";

  const pwdLongEnough = password.length >= 8;
  const pwdHasNumber = /\d/.test(password);
  const pwdsMatch = password.length > 0 && password === confirmPassword;
  const step2Valid = pwdLongEnough && pwdHasNumber && pwdsMatch;

  return (
    <div dir="rtl" className="onboarding-app min-h-screen flex" style={{ fontFamily: "'Tajawal', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Tajawal:wght@300;400;500;700;800&display=swap');
        .onboarding-app { background:#f7f2e7; color:#1f2733; }
        .font-amiri { font-family:'Amiri', serif; }

        .brand-panel { background:linear-gradient(160deg,#16243f 0%,#0f1a30 100%); position:relative; overflow:hidden; }
        .brand-panel::before { content:''; position:absolute; inset:0; background-image: radial-gradient(rgba(201,162,39,0.18) 1px, transparent 1.4px); background-size:24px 24px; opacity:0.5; }

        .content-bg { background-color:#f7f2e7; background-image: radial-gradient(rgba(184,146,58,0.10) 1px, transparent 1.4px); background-size:20px 20px; }

        .card-formal { background:#fffdf8; border:1px solid #e7ddc4; border-radius:16px; box-shadow:0 1px 2px rgba(22,36,63,0.04), 0 14px 30px -18px rgba(22,36,63,0.2); }

        .field-label { font-size:0.78rem; font-weight:700; color:#6b6457; margin-bottom:0.4rem; display:flex; align-items:center; gap:0.35rem; }
        .field-input { width:100%; font-size:0.9rem; padding:0.7rem 0.85rem; border-radius:0.6rem; border:1px solid #e0d6b8; background:#fffdf8; color:#1f2733; outline:none; transition:border-color .15s ease; }
        .field-input:focus { border-color:#c9a227; }
        .field-with-icon { position:relative; }
        .field-with-icon .field-input { padding-right:2.5rem; }
        .field-with-icon .icon-slot { position:absolute; right:0.8rem; top:50%; transform:translateY(-50%); color:#a39c8c; }

        .btn-gold { background:linear-gradient(180deg,#d9b94a,#b8923a); color:#16243f; font-weight:800; box-shadow:0 6px 16px -6px rgba(184,146,58,0.6); }
        .btn-outline { border:1.5px solid #d6cdb0; color:#4a4538; background:transparent; font-weight:600; }
        .btn-outline:hover { background:#f3ecd8; }
        .btn-gold:disabled, .btn-gold[disabled] { opacity:0.45; box-shadow:none; cursor:not-allowed; }

        .step-circle { width:2rem; height:2rem; border-radius:9999px; border:1.5px solid; display:flex; align-items:center; justify-content:center; font-size:0.82rem; font-weight:700; flex-shrink:0; transition:all .2s ease; }

        .upload-box { border:1.5px dashed #c9a227; border-radius:0.85rem; background:rgba(201,162,39,0.05); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:0.4rem; padding:1.3rem; cursor:pointer; text-align:center; }
        .upload-box:hover { background:rgba(201,162,39,0.1); }
      `}</style>

      {/* ===== اللوحة الزخرفية (شاشات كبيرة فقط) ===== */}
      <div className="brand-panel hidden lg:flex lg:w-[42%] flex-col justify-between p-12 relative">
        <div className="relative flex items-center gap-3">
          <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: "rgba(201,162,39,0.18)", border: "1.5px solid #c9a227" }}>
            <ShieldCheck size={20} color="#d9b94a" />
          </div>
          <div>
            <p className="font-amiri text-2xl font-bold leading-none" style={{ color: "#f3e6c0" }}>
              إجازة
            </p>
            <p className="text-[11px] mt-1" style={{ color: "#8d93a8" }}>
              منصة الشهادات الرقمية
            </p>
          </div>
        </div>

        <div className="relative flex flex-col items-center text-center px-4">
          <div className="w-64 rounded-xl overflow-hidden mb-7" style={{ border: "2px solid #c9a227", boxShadow: "0 24px 50px -20px rgba(0,0,0,0.5)" }}>
            <svg viewBox="0 0 220 150" className="w-full">
              <rect width="220" height="150" fill="#fffdf8" />
              <rect x="6" y="6" width="208" height="138" fill="none" stroke="#c9a227" strokeWidth="1.5" strokeDasharray="2 3" />
              <rect x="60" y="28" width="100" height="7" rx="3" fill="#16243f" opacity="0.8" />
              <rect x="45" y="46" width="130" height="3" rx="1.5" fill="#16243f" opacity="0.25" />
              <rect x="65" y="55" width="90" height="3" rx="1.5" fill="#16243f" opacity="0.25" />
              <rect x="55" y="64" width="110" height="3" rx="1.5" fill="#16243f" opacity="0.25" />
              <circle cx="58" cy="112" r="20" fill="#f3e6c0" stroke="#b8923a" strokeWidth="1.5" />
              <path d="M50,112 l6,6 l11,-13" fill="none" stroke="#b8923a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M140,118 q7,-13 13,-2 q7,11 13,-4 q5,-10 11,3" fill="none" stroke="#b8923a" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <p className="font-amiri text-xl leading-relaxed" style={{ color: "#f3e6c0" }}>
            منصة موحّدة لإصدار الإجازات والشهادات الرقمية بثقة واعتمادية
          </p>
        </div>

        <div className="relative flex flex-col gap-4">
          {[
            { icon: Sparkles, text: "قوالب إجازات قابلة للتخصيص بالكامل" },
            { icon: Link2, text: "روابط مشاركة فورية مع الطلاب" },
            { icon: Download, text: "تصدير تلقائي بصيغتي PDF و CSV" },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(201,162,39,0.15)" }}>
                <f.icon size={15} color="#d9b94a" />
              </div>
              <p className="text-sm" style={{ color: "#cdd3e0" }}>
                {f.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ===== لوحة النموذج ===== */}
      <div className="content-bg flex-1 flex items-center justify-center p-5 sm:p-8">
        <div className="w-full" style={{ maxWidth: 440 }}>
          {/* علامة مصغّرة للجوال */}
          <div className="flex lg:hidden items-center justify-center gap-2.5 mb-6">
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#16243f" }}>
              <ShieldCheck size={16} color="#d9b94a" />
            </div>
            <p className="font-amiri text-xl font-bold" style={{ color: "#16243f" }}>
              إجازة
            </p>
          </div>

          {step !== "done" && (
            <>
              <div className="text-center mb-6">
                <h1 className="font-amiri text-2xl font-bold" style={{ color: "#16243f" }}>
                  مرحبًا، {orgName}
                </h1>
                <p className="text-sm mt-1.5" style={{ color: "#6b6457" }}>
                  هذا أول تسجيل دخول لكم — أكملوا الخطوات التالية لتفعيل الحساب
                </p>
              </div>

              {/* مؤشر الخطوات */}
              <div className="relative flex justify-center items-start mb-8 px-6">
                <div className="absolute top-4 right-[18%] left-[18%] h-0.5" style={{ background: "#e0d6b8" }} />
                <div
                  className="absolute top-4 right-[18%] h-0.5 transition-all duration-300"
                  style={{ width: step >= 2 ? "64%" : "0%", background: "#c9a227" }}
                />
                <div className="flex flex-col items-center gap-2 flex-1">
                  <StepCircle n={1} status={step === 1 ? "active" : "done"} />
                  <span className="text-[11px] text-center" style={{ color: "#16243f", fontWeight: step === 1 ? 700 : 500 }}>
                    معلومات المسؤول
                  </span>
                </div>
                <div className="flex flex-col items-center gap-2 flex-1">
                  <StepCircle n={2} status={step === 2 ? "active" : "upcoming"} />
                  <span className="text-[11px] text-center" style={{ color: step === 2 ? "#16243f" : "#a39c8c", fontWeight: step === 2 ? 700 : 500 }}>
                    تأمين الحساب
                  </span>
                </div>
              </div>

              <div className="card-formal p-6">
                {step === 1 && (
                  <div className="flex flex-col gap-4">
                    <div>
                      <span className="field-label">
                        <User size={13} />
                        الاسم الكامل للمسؤول
                      </span>
                      <input className="field-input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="مثال: محمد عبدالله العتيبي" />
                    </div>
                    <div>
                      <span className="field-label">
                        <Mail size={13} />
                        البريد الإلكتروني
                      </span>
                      <input className="field-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
                    </div>
                    <div>
                      <span className="field-label">
                        <Phone size={13} />
                        رقم الجوال <span style={{ color: "#a39c8c", fontWeight: 400 }}>(اختياري)</span>
                      </span>
                      <input className="field-input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05xxxxxxxx" dir="ltr" style={{ textAlign: "right" }} />
                    </div>
                    <div>
                      <span className="field-label">
                        <Building2 size={13} />
                        نوع المؤسسة
                      </span>
                      <select className="field-input" value={orgType} onChange={(e) => setOrgType(e.target.value)}>
                        <option value="">اختر نوع المؤسسة</option>
                        {ORG_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button className="btn-gold w-full py-3 rounded-full text-sm flex items-center justify-center gap-2 mt-2" disabled={!step1Valid} onClick={() => setStep(2)}>
                      التالي: تأمين الحساب
                      <ArrowLeft size={16} />
                    </button>
                  </div>
                )}

                {step === 2 && (
                  <div className="flex flex-col gap-4">
                    <div>
                      <span className="field-label">
                        <Lock size={13} />
                        كلمة مرور جديدة
                      </span>
                      <div className="field-with-icon">
                        <input
                          className="field-input"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                        />
                        <button type="button" className="icon-slot" onClick={() => setShowPassword((v) => !v)}>
                          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <span className="field-label">
                        <Lock size={13} />
                        تأكيد كلمة المرور
                      </span>
                      <input
                        className="field-input"
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>

                    <ul className="flex flex-col gap-1.5 -mt-1">
                      <ReqItem ok={pwdLongEnough} label="٨ أحرف على الأقل" />
                      <ReqItem ok={pwdHasNumber} label="رقم واحد على الأقل" />
                      <ReqItem ok={pwdsMatch} label="تطابق كلمتي المرور" />
                    </ul>

                    <div>
                      <span className="field-label">
                        <ImageIcon size={13} />
                        شعار المؤسسة <span style={{ color: "#a39c8c", fontWeight: 400 }}>(اختياري)</span>
                      </span>
                      {!logoName ? (
                        <label className="upload-box">
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files[0] && setLogoName(e.target.files[0].name)} />
                          <ImageIcon size={20} style={{ color: "#b8923a" }} />
                          <span className="text-xs" style={{ color: "#9c7a1f" }}>
                            اسحبوا الشعار هنا أو انقروا للاختيار
                          </span>
                          <span className="text-[10px]" style={{ color: "#a39c8c" }}>
                            سيظهر هذا الشعار في الإجازات الصادرة عنكم
                          </span>
                        </label>
                      ) : (
                        <div className="flex items-center gap-2.5 p-3 rounded-lg" style={{ background: "#f7f2e7", border: "1px solid #e7ddc4" }}>
                          <div className="w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: "#fffdf8", border: "1px solid #e0d6b8" }}>
                            <ImageIcon size={15} style={{ color: "#b8923a" }} />
                          </div>
                          <span className="text-xs flex-1 truncate" style={{ color: "#1f2733" }}>
                            {logoName}
                          </span>
                          <button className="icon-slot" style={{ position: "static" }} onClick={() => setLogoName("")}>
                            <X size={15} style={{ color: "#9c948a" }} />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-2">
                      <button className="btn-outline px-5 py-3 rounded-full text-sm flex items-center gap-1.5" onClick={() => setStep(1)}>
                        <ArrowRight size={16} />
                        السابق
                      </button>
                      <button className="btn-gold flex-1 py-3 rounded-full text-sm" disabled={!step2Valid} onClick={() => setStep("done")}>
                        إكمال الإعداد
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center gap-1.5 mt-5 text-[11px]" style={{ color: "#a39c8c" }}>
                <Info size={12} />
                هذه الخطوة مطلوبة مرة واحدة فقط عند أول تسجيل دخول
              </div>
            </>
          )}

          {step === "done" && (
            <div className="card-formal p-8 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: "#eef4ea" }}>
                <CheckCircle2 size={28} style={{ color: "#4f7d4a" }} />
              </div>
              <h2 className="font-amiri text-2xl font-bold" style={{ color: "#16243f" }}>
                تم تفعيل حسابكم بنجاح
              </h2>
              <p className="text-sm mt-2 leading-relaxed" style={{ color: "#6b6457" }}>
                أصبح بإمكانكم الآن إنشاء إجازاتكم الأولى ومشاركتها مع طلابكم من لوحة التحكم
              </p>
              <button className="btn-gold w-full py-3 rounded-full text-sm mt-6">الانتقال إلى لوحة التحكم</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
