import { useState, useMemo } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
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
  return open ? (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
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
        const cred = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        await updateProfile(cred.user, { displayName: name });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
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
      <div className={styles.box}>
        <h1 className={styles.wordmark}>Progressio</h1>
        <p className={styles.sub}>
          {mode === "login" ? "Welcome back." : "Create your account."}
        </p>

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
