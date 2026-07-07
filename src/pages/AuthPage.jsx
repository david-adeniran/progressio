import { useState, useMemo } from "react";
import { Eye, EyeOff } from "lucide-react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../lib/firebase";
import styles from "./AuthPage.module.css";

const RULES = [
  { label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { label: "One lowercase letter", test: (v) => /[a-z]/.test(v) },
  { label: "One number", test: (v) => /[0-9]/.test(v) },
  { label: "One symbol", test: (v) => /[^A-Za-z0-9]/.test(v) },
  { label: "At least 8 characters", test: (v) => v.length >= 8 },
];

function EyeIcon({ open }) {
  return open ? <Eye size={16} /> : <EyeOff size={16} />
}

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
  const [resetEmail, setResetEmail] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  const checks = useMemo(
    () => RULES.map((r) => ({ ...r, passed: r.test(password) })),
    [password],
  );
  const allPassed = checks.every((c) => c.passed);
  const passwordsMatch = password === confirm;

  async function handleSubmit(e) {
    e.preventDefault();
    setTouched(true);
    if (mode === "signup") {
      if (!allPassed) return;
      if (!passwordsMatch) {
        setError("Passwords do not match.");
        return;
      }
    }
    setError("");
    setLoading(true);
    try {
      if (mode === "signup") {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name });
        await sendEmailVerification(cred.user);
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
    setError("");
    setTouched(false);
    setPassword("");
    setConfirm("");
    setShowPassword(false);
    setShowConfirm(false);
  }

  return (
    <div className={styles.page}>

      {/* Password reset modal */}
      {showReset && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: '2rem', maxWidth: 380, width: '90%', textAlign: 'center' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.5rem' }}>Reset password</h2>
            {resetSent ? (
              <>
                <p style={{ fontSize: '0.85rem', color: 'var(--success)', marginBottom: '1.25rem' }}>✓ Reset link sent! Check your inbox.</p>
                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { setShowReset(false); setResetSent(false); setResetEmail(''); }}>Done</button>
              </>
            ) : (
              <form onSubmit={handleReset}>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.6 }}>Enter your email and we'll send a reset link.</p>
                <input type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} placeholder="you@example.com" required style={{ marginBottom: '1rem' }} />
                {error && <p style={{ fontSize: '0.78rem', color: 'var(--danger)', marginBottom: '0.75rem' }}>{error}</p>}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { setShowReset(false); setError(''); }}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={loading}>{loading ? 'Sending…' : 'Send link'}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <div className={styles.box}>
        <h1 className={styles.wordmark}>Progressio</h1>
        <p className={styles.sub}>
          {mode === "login" ? "Welcome back." : "Create your account."}
        </p>

        {/* Email verification notice */}
        {verificationSent && (
          <div style={{ background: 'var(--success-dim)', border: '1px solid rgba(62,207,142,0.3)', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.82rem', color: 'var(--success)' }}>
            ✓ Account created! Check your email to verify your address.
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          {mode === "signup" && (
            <div className="form-group">
              <label>Your name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Wasiu Chukwudi"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className={styles.inputWrap}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setTouched(false);
                }}
                placeholder={
                  mode === "signup" ? "Create a strong password" : ""
                }
                required
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
          </div>

          {mode === "login" && (
            <div style={{ textAlign: 'right', marginTop: '-0.5rem', marginBottom: '0.5rem' }}>
              <button type="button" onClick={() => { setShowReset(true); setError(''); setResetEmail(email); }}
                style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                Forgot password?
              </button>
            </div>
          )}

          {mode === "signup" && password.length > 0 && (
            <div className={styles.checklist}>
              {checks.map((c, i) => (
                <div
                  key={i}
                  className={
                    styles.checkItem +
                    " " +
                    (c.passed ? styles.checkPassed : styles.checkFailed)
                  }
                >
                  <span className={styles.checkDot}>
                    {c.passed ? "✓" : "✕"}
                  </span>
                  {c.label}
                </div>
              ))}
            </div>
          )}

          {mode === "signup" && (
            <div className="form-group">
              <label>Confirm password</label>
              <div className={styles.inputWrap}>
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter your password"
                  required
                  style={{
                    borderColor:
                      touched && !passwordsMatch ? "var(--danger)" : "",
                  }}
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowConfirm((v) => !v)}
                  tabIndex={-1}
                >
                  <EyeIcon open={showConfirm} />
                </button>
              </div>
              {touched && !passwordsMatch && (
                <span className={styles.fieldError}>
                  Passwords do not match.
                </span>
              )}
            </div>
          )}

          {error && <p className={styles.error}>{error}</p>}

          <button
            className="btn btn-primary"
            style={{
              width: "100%",
              justifyContent: "center",
              marginTop: "0.5rem",
            }}
            disabled={loading}
          >
            {loading
              ? "Please wait…"
              : mode === "login"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>

        <p className={styles.toggle}>
          {mode === "login"
            ? "Don't have an account? "
            : "Already have an account? "}
          <button onClick={switchMode}>
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
