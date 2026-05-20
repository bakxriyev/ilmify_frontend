"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"

// SVG icons — inline, no emoji, no sticker overlap
const IconPhone = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
    <line x1="12" y1="18" x2="12.01" y2="18"/>
  </svg>
)
const IconLock = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)
const IconEye = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
)
const IconEyeOff = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)
const IconArrowRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
)
const IconGradCap = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
  </svg>
)
const IconBook = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
)

export default function TeacherLoginPage() {
  const [digits, setDigits] = useState("")  // only digits after +998
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [focusedField, setFocusedField] = useState<"phone" | "password" | null>(null)
  const [mounted, setMounted] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  useEffect(() => { setMounted(true) }, [])

  // Format digits as: XX XXX-XX-XX
  const formatDigits = (raw: string) => {
    const d = raw.slice(0, 9)
    let out = ""
    if (d.length > 0) out += d.slice(0, 2)
    if (d.length > 2) out += " " + d.slice(2, 5)
    if (d.length > 5) out += "-" + d.slice(5, 7)
    if (d.length > 7) out += "-" + d.slice(7, 9)
    return out
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 9)
    setDigits(raw)
  }

  const getRawPhone = () => "+998" + digits

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const success = await login(getRawPhone(), password, "teacher")
      if (success) {
        toast.success("Xush kelibsiz!")
        router.push("/dashboard")
      } else {
        toast.error("Telefon raqam yoki parol noto'g'ri")
      }
    } catch (err: any) {
      toast.error(err.message || "Login xatolik")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.root}>
      {/* Background orbs */}
      <div style={styles.orb1} />
      <div style={styles.orb2} />
      <div style={styles.grid} />

      {/* Card */}
      <div style={{ ...styles.card, opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(20px)", transition: "opacity .55s ease, transform .55s ease" }}>
        {/* Top accent line */}
        <div style={styles.accentBar} />

        <div style={styles.inner}>
          {/* Logo */}
          <div style={styles.logoArea}>
            <div style={styles.ring}>
              <div style={styles.ringDash} />
              <div style={styles.ringInner}>
                <IconGradCap />
              </div>
            </div>
            <div style={styles.brand}>
              EduPortal<span style={styles.brandDot}>.</span>
            </div>
            <div style={styles.subBadge}>
              <IconBook />
              <span>O'qituvchilar platformasi</span>
            </div>
          </div>

          {/* Heading */}
          <h1 style={styles.title}>Xush kelibsiz!</h1>
          <p style={styles.subtitle}>Kabinetingizga kiring</p>

          {/* Form */}
          <form onSubmit={handleSubmit} style={styles.form}>

            {/* Phone */}
            <div style={styles.fieldGroup}>
              <label style={styles.fieldLabel} htmlFor="teacher-phone">Telefon raqam</label>
              <div style={styles.fieldWrap}>
                {/* Left icon */}
                <span style={{ ...styles.leftIcon, color: focusedField === "phone" ? "#818cf8" : "#475569" }}>
                  <IconPhone />
                </span>
                {/* Country prefix pill */}
                <div style={styles.prefixPill}>
                  <span style={styles.flag}>🇺🇿</span>
                  <span style={styles.prefixCode}>+998</span>
                </div>
                <input
                  id="teacher-phone"
                  type="tel"
                  inputMode="numeric"
                  style={{
                    ...styles.input,
                    paddingLeft: "108px",
                    borderColor: focusedField === "phone" ? "rgba(99,102,241,.55)" : "rgba(148,163,184,.13)",
                    boxShadow: focusedField === "phone" ? "0 0 0 3px rgba(99,102,241,.11)" : "none",
                  }}
                  value={formatDigits(digits)}
                  onChange={handlePhoneChange}
                  onFocus={() => setFocusedField("phone")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="90 123-45-67"
                  required
                  autoComplete="tel"
                />
              </div>
            </div>

            {/* Password */}
            <div style={styles.fieldGroup}>
              <label style={styles.fieldLabel} htmlFor="teacher-pw">Parol</label>
              <div style={styles.fieldWrap}>
                <span style={{ ...styles.leftIcon, color: focusedField === "password" ? "#818cf8" : "#475569" }}>
                  <IconLock />
                </span>
                <input
                  id="teacher-pw"
                  type={showPassword ? "text" : "password"}
                  style={{
                    ...styles.input,
                    paddingLeft: "40px",
                    paddingRight: "44px",
                    borderColor: focusedField === "password" ? "rgba(99,102,241,.55)" : "rgba(148,163,184,.13)",
                    boxShadow: focusedField === "password" ? "0 0 0 3px rgba(99,102,241,.11)" : "none",
                  }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Parolni kiriting"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={styles.eyeBtn}
                  aria-label={showPassword ? "Yashirish" : "Ko'rsatish"}
                >
                  {showPassword ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.submitBtn,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? (
                <span style={styles.spinner} />
              ) : (
                <>
                  <span style={{ position: "relative", zIndex: 1 }}>Kirish</span>
                  <span style={{ position: "relative", zIndex: 1, display: "flex" }}>
                    <IconArrowRight />
                  </span>
                </>
              )}
            </button>
          </form>

          <p style={styles.footer}>
            Muammo bormi?{" "}
            <a href="/support" style={styles.footerLink}>
              Qo'llab-quvvatlash
            </a>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes orbit { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: "100svh",
    background: "#0a0f1e",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1.5rem",
    position: "relative",
    overflow: "hidden",
    fontFamily: "'Segoe UI', 'SF Pro Display', system-ui, sans-serif",
  },
  orb1: {
    position: "absolute",
    width: 480,
    height: 480,
    borderRadius: "50%",
    background: "radial-gradient(circle, #3b82f6, transparent 70%)",
    filter: "blur(80px)",
    opacity: 0.16,
    top: -160,
    left: -100,
    pointerEvents: "none",
  },
  orb2: {
    position: "absolute",
    width: 360,
    height: 360,
    borderRadius: "50%",
    background: "radial-gradient(circle, #6366f1, transparent 70%)",
    filter: "blur(80px)",
    opacity: 0.16,
    bottom: -100,
    right: -80,
    pointerEvents: "none",
  },
  grid: {
    position: "absolute",
    inset: 0,
    backgroundImage: "linear-gradient(rgba(99,102,241,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,.06) 1px, transparent 1px)",
    backgroundSize: "48px 48px",
    pointerEvents: "none",
  },
  card: {
    width: "100%",
    maxWidth: 400,
    background: "rgba(15,23,42,.92)",
    border: "1px solid rgba(148,163,184,.13)",
    borderRadius: 24,
    boxShadow: "0 24px 60px rgba(0,0,0,.6), 0 0 0 1px rgba(99,102,241,.07)",
    position: "relative",
    overflow: "hidden",
  },
  accentBar: {
    height: 3,
    background: "linear-gradient(90deg, #6366f1, #3b82f6, #0ea5e9)",
  },
  inner: {
    padding: "1.75rem 1.75rem 1.5rem",
  },
  logoArea: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 9,
    marginBottom: "1.5rem",
  },
  ring: {
    width: 66,
    height: 66,
    borderRadius: "50%",
    background: "linear-gradient(135deg, rgba(99,102,241,.22), rgba(59,130,246,.22))",
    border: "1px solid rgba(99,102,241,.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  ringDash: {
    position: "absolute",
    inset: -4,
    borderRadius: "50%",
    border: "1px dashed rgba(99,102,241,.2)",
    animation: "orbit 20s linear infinite",
  },
  ringInner: {
    width: 50,
    height: 50,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #6366f1, #3b82f6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    boxShadow: "0 0 22px rgba(99,102,241,.45)",
  },
  brand: {
    fontSize: 20,
    fontWeight: 800,
    letterSpacing: -0.4,
    color: "#f1f5f9",
  },
  brandDot: { color: "#6366f1" },
  subBadge: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    fontSize: 11,
    color: "#64748b",
    background: "rgba(99,102,241,.1)",
    border: "1px solid rgba(99,102,241,.15)",
    borderRadius: 20,
    padding: "3px 12px",
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    color: "#f1f5f9",
    textAlign: "center",
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    marginTop: 3,
    marginBottom: "1.25rem",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "0.9rem",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.6px",
  },
  fieldWrap: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  // Left icon — absolutely positioned, vertically centered, does NOT overlap prefix pill
  leftIcon: {
    position: "absolute",
    left: 12,
    top: "50%",
    transform: "translateY(-50%)",
    display: "flex",
    alignItems: "center",
    pointerEvents: "none",
    zIndex: 2,
    transition: "color .2s",
  },
  // Prefix pill sits right after the left icon
  prefixPill: {
    position: "absolute",
    left: 36,
    top: "50%",
    transform: "translateY(-50%)",
    display: "flex",
    alignItems: "center",
    gap: 4,
    background: "rgba(99,102,241,.12)",
    borderRight: "1px solid rgba(99,102,241,.2)",
    borderRadius: "6px 0 0 6px",
    padding: "0 8px 0 6px",
    height: 28,
    zIndex: 2,
    pointerEvents: "none",
  },
  flag: { fontSize: 14, lineHeight: 1 },
  prefixCode: {
    fontSize: 13,
    fontWeight: 600,
    color: "#818cf8",
    letterSpacing: 0.2,
  },
  input: {
    width: "100%",
    height: 46,
    borderRadius: 12,
    border: "1px solid rgba(148,163,184,.13)",
    background: "rgba(22,33,55,.7)",
    color: "#f1f5f9",
    fontSize: 14.5,
    paddingRight: 42,
    outline: "none",
    transition: "border-color .2s, box-shadow .2s, background .2s",
    fontFamily: "inherit",
  },
  eyeBtn: {
    position: "absolute",
    right: 11,
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#475569",
    display: "flex",
    alignItems: "center",
    padding: 4,
    borderRadius: 6,
    transition: "color .2s",
    zIndex: 2,
  },
  submitBtn: {
    marginTop: "0.3rem",
    width: "100%",
    height: 48,
    borderRadius: 12,
    border: "none",
    background: "linear-gradient(135deg, #6366f1, #3b82f6)",
    color: "#fff",
    fontSize: 15,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    boxShadow: "0 4px 24px rgba(99,102,241,.35)",
    fontFamily: "inherit",
    position: "relative",
    overflow: "hidden",
    transition: "transform .15s, box-shadow .2s, opacity .2s",
  },
  spinner: {
    display: "inline-block",
    width: 20,
    height: 20,
    border: "2px solid rgba(255,255,255,.3)",
    borderTopColor: "#fff",
    borderRadius: "50%",
    animation: "spin .7s linear infinite",
  },
  footer: {
    textAlign: "center",
    fontSize: 12.5,
    color: "#475569",
    marginTop: "1.1rem",
  },
  footerLink: {
    color: "#818cf8",
    textDecoration: "none",
    fontWeight: 600,
  },
}