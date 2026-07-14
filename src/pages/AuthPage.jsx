import { useState, useMemo } from "react";
import { Eye, EyeOff } from "lucide-react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
} from "firebase/auth";
import emailjs from "@emailjs/browser";
import { auth } from "../lib/firebase";
import styles from "./AuthPage.module.css";

const EMAILJS_SERVICE = "service_rdx4vns";
const EMAILJS_WELCOME = "template_b52b9xf";
const EMAILJS_RESET = "template_vhxta0e";
const EMAILJS_KEY = "GYshRTHCTu1Q3XOoY";

const RULES = [
  { label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { label: "One lowercase letter", test: (v) => /[a-z]/.test(v) },
  { label: "One number", test: (v) => /[0-9]/.test(v) },
  { label: "One symbol", test: (v) => /[^A-Za-z0-9]/.test(v) },
  { label: "At least 8 characters", test: (v) => v.length >= 8 },
];

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  const checks = useMemo(
    () => RULES.map((r) => ({ ...r, passed: r.test(password) })),
    [password]
  );
  const allPassed = checks.every((c) => c.passed);
  const passwordsMatch = password === confirm;

  async function handleSubmit(e) {
    e.preventDefault();
    setTouched(true);
    if (mode === "signup") {
      if (!allPassed) return;
      if (!passwordsMatch) { setError("Passwords do not match."); return; }
    }
    setError("");
    setLoading(true);
    try {
      if (mode === "signup") {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name });
        await sendEmailVerification(cred.user);
        try {
          await emailjs.send(
            EMAILJS_SERVICE, EMAILJS_WELCOME,
            { to_name: name, email, app_url: "https://progressioapp.vercel.app/" },
            EMAILJS_KEY
          );
        } catch (e) { console.error("EmailJS error:", e); }
        setVerificationSent(true);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e) {
    e.preventDefault();
    if (!resetEmail.trim()) return;
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());
      setResetSent(true);
    } catch (err) {
      setError(friendlyError(err.code));
    }
    setLoading(false);
  }

  function friendlyError(code) {
    const map = {
      "auth/email-already-in-use": "That email is already registered.",
      "auth/invalid-credential": "Wrong email or password.",
      "auth/weak-password": "Password must be at least 8 characters.",
      "auth/invalid-email": "Enter a valid email address.",
    };
    return map[code] || "Something went wrong. Try again.";
  }

  function switchMode() {
    setMode(mode === "login" ? "signup" : "login");
    setError(""); setTouched(false);
    setPassword(""); setConfirm("");
    setShowPassword(false); setShowConfirm(false);
  }

  return (
    <div className={styles.page}>

      {/* Reset modal */}
      {showReset && (
        <div className={styles.modal}>
          <div className={styles.modalBox}>
            <h2 className={styles.modalTitle}>Reset password</h2>
            {resetSent ? (
              <>
                <p className={styles.successNote}>Reset link sent. Check your inbox.</p>
                <div className={styles.modalActions}>
                  <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => { setShowReset(false); setResetSent(false); setResetEmail(""); }}>
                    Done
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={handleReset}>
                <p className={styles.modalSub}>Enter your email and we'll send a reset link.</p>
                <input
                  type="email" value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  placeholder="you@example.com" required
                  className={styles.input}
                  style={{ borderBottom: '1.5px solid var(--border)', display: 'block', width: '100%' }}
                />
                {error && <p className={styles.error}>{error}</p>}
                <div className={styles.modalActions}>
                  <button type="button" className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => { setShowReset(false); setError(""); }}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}
                    disabled={loading}>{loading ? "Sending…" : "Send link"}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Left — brand */}
      <div className={styles.brand}>
        <div className={styles.brandAccentLine} />
        <div className={styles.brandTop}>
          <span className={styles.brandMark}>Progressio</span>
          <h1 className={styles.brandHeadline}>
            Build the life<br />
            you <em>actually</em><br />
            want.
          </h1>
          <p className={styles.brandTagline}>
            Track goals, earn XP, and watch every area of your life level up — one day at a time.
          </p>
        </div>
        <div className={styles.brandBottom}>
          <div className={styles.brandStats}>
            <div className={styles.brandStat}>
              <span className={styles.brandStatVal}>100</span>
              <span className={styles.brandStatLabel}>Achievements</span>
            </div>
            <div className={styles.brandStat}>
              <span className={styles.brandStatVal}>8</span>
              <span className={styles.brandStatLabel}>Life Areas</span>
            </div>
            <div className={styles.brandStat}>
              <span className={styles.brandStatVal}>15</span>
              <span className={styles.brandStatLabel}>Levels</span>
            </div>
          </div>
          <p className={styles.brandQuote}>
            "Small consistent actions lead to extraordinary results."
          </p>
        </div>
      </div>

      {/* Right — form */}
      <div className={styles.formPanel}>
        <div className={styles.formHeader}>
          <h2 className={styles.formTitle}>
            {mode === "login" ? "Sign in" : "Create account"}
          </h2>
          <p className={styles.formSub}>
            {mode === "login"
              ? "Enter your credentials to continue."
              : "Start your journey with Progressio."}
          </p>
        </div>

        {verificationSent && (
          <p className={styles.successNote} style={{ marginBottom: '1.5rem' }}>
            Account created. Check your email to verify your address.
          </p>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          {mode === "signup" && (
            <div className={styles.field}>
              <label className={styles.label}>Your name</label>
              <input
                className={styles.input}
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Wasiu Chukwudi"
                required
              />
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <input
              className={styles.input}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Password</label>
            <div className={styles.inputWrap}>
              <input
                className={styles.input}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => { setPassword(e.target.value); setTouched(false); }}
                placeholder={mode === "signup" ? "Create a strong password" : "••••••••"}
                required
              />
              <button type="button" className={styles.eyeBtn}
                onClick={() => setShowPassword(v => !v)} tabIndex={-1}>
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {mode === "login" && (
            <button type="button" className={styles.forgotBtn}
              onClick={() => { setShowReset(true); setError(""); setResetEmail(email); }}>
              Forgot password?
            </button>
          )}

          {mode === "signup" && password.length > 0 && (
            <div className={styles.checklist}>
              {checks.map((c, i) => (
                <div key={i} className={`${styles.checkItem} ${c.passed ? styles.checkPassed : styles.checkFailed}`}>
                  <span className={styles.checkDot}>{c.passed ? "✓" : "·"}</span>
                  {c.label}
                </div>
              ))}
            </div>
          )}

          {mode === "signup" && (
            <div className={styles.field}>
              <label className={styles.label}>Confirm password</label>
              <div className={styles.inputWrap}>
                <input
                  className={styles.input}
                  type={showConfirm ? "text" : "password"}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Re-enter your password"
                  required
                  style={{ borderBottomColor: touched && !passwordsMatch ? "var(--danger)" : "" }}
                />
                <button type="button" className={styles.eyeBtn}
                  onClick={() => setShowConfirm(v => !v)} tabIndex={-1}>
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {touched && !passwordsMatch && (
                <span className={styles.fieldError}>Passwords do not match.</span>
              )}
            </div>
          )}

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        <div className={styles.toggle}>
          <div className={styles.toggleDivider} />
          <span>{mode === "login" ? "New here?" : "Have an account?"}</span>
          <button className={styles.toggleBtn} onClick={switchMode}>
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
          <div className={styles.toggleDivider} />
        </div>
      </div>
    </div>
  );
}
